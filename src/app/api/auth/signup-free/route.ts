import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateMagicLink } from "@/lib/auth";
import { sendEmail, sendWelcomeEmail, escapeHtml, emailLayout, emailButton } from "@/lib/email";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  businessName: z.string().min(2).max(200),
  vertical: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 signup attempts per IP per hour
    // SECURITY: Auth endpoints must fail closed — if the rate limiter errors,
    // block the request rather than allowing unlimited signup attempts.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "signup", 5, {
      degradeGracefully: false,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, businessName, vertical } = parsed.data;

    // Check if account already exists.
    // SECURITY: Return the same success response regardless of whether the account
    // exists or not, to prevent account enumeration. If the account already has a
    // client, silently send a login magic link instead of revealing existence.
    const existingAccount = await prisma.account.findUnique({ where: { email } });
    if (existingAccount) {
      const existingClient = await prisma.client.findUnique({
        where: { accountId: existingAccount.id },
      });
      if (existingClient) {
        // Silently send a magic link so the user can sign in.
        // Do NOT reveal that the account exists — return the same shape as a new signup.
        try {
          const magicLinkResult = await generateMagicLink(email);
          const magicUrl = magicLinkResult?.url ?? "#";
          await sendEmail(
            email,
            "Sign in to Sovereign AI",
            emailLayout({
              preheader: "Sign in to your Sovereign AI dashboard",
              isTransactional: true,
              body: `
                <p style="color:#333;font-size:16px;line-height:1.5;">Welcome back!</p>
                <p style="color:#333;font-size:16px;line-height:1.5;">It looks like you already have an account. Click below to sign in:</p>
                ${emailButton("Sign In to Dashboard", magicUrl)}
              `,
            })
          );
        } catch (e) {
          logger.errorWithCause("[api/auth/signup-free] Failed to send existing-account magic link", e);
        }
        return NextResponse.json(
          {
            success: true,
            message: "Account created. Check your email for a login link.",
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { status: 201 }
        );
      }
    }

    // Wrap all creation in a transaction to prevent partial state from double-clicks
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const { client } = await prisma.$transaction(async (tx) => {
      // Create account (or get existing one without a client)
      const account = existingAccount || await tx.account.create({
        data: {
          email,
          name,
          role: "client",
        },
      });

      // Update name if it was missing
      if (!account.name && name) {
        await tx.account.update({ where: { id: account.id }, data: { name } });
      }

      // Create client
      const txClient = await tx.client.create({
        data: {
          accountId: account.id,
          businessName,
          ownerName: name,
          vertical: vertical || null,
        },
      });

      // Create trial subscription (14 days)
      await tx.subscription.create({
        data: {
          clientId: txClient.id,
          status: "active",
          monthlyAmount: 0,
          bundleId: null,
          isTrial: true,
          trialEndsAt,
          currentPeriodEnd: trialEndsAt,
        },
      });

      // Activate limited free-tier services
      const freeServices = [
        { serviceId: "chatbot", config: JSON.stringify({ maxConversations: 50 }) },
        { serviceId: "crm", config: JSON.stringify({ maxLeads: 50 }) },
        { serviceId: "analytics", config: JSON.stringify({ readOnly: true }) },
      ];

      for (const svc of freeServices) {
        await tx.clientService.create({
          data: {
            clientId: txClient.id,
            serviceId: svc.serviceId,
            status: "active",
            activatedAt: new Date(),
            config: svc.config,
          },
        });
      }

      // Create default onboarding steps
      const onboardingSteps = ["gbp", "chatbot-greeting", "business-hours", "first-post", "logo"];
      for (const stepKey of onboardingSteps) {
        await tx.onboardingStep.create({
          data: { clientId: txClient.id, stepKey },
        });
      }

      return { client: txClient };
    });

    // Generate magic link for login
    const magicLinkResult = await generateMagicLink(email);
    const magicLinkUrl = magicLinkResult?.url ?? "#";

    // Send welcome email using the shared layout.
    // Wrapped in try/catch so a SendGrid outage does not return 500 to the
    // user after the account was already created successfully. The user can
    // request a new magic link from the login page if the email is lost.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      await sendEmail(
        email,
        `Welcome to Sovereign AI - Your Free Trial is Active!`,
        emailLayout({
          preheader: `Welcome, ${name}! Your 14-day free trial for ${businessName} is now active.`,
          isTransactional: true,
          body: `
            <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(name)},</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">Your 14-day free trial for <strong>${escapeHtml(businessName)}</strong> is now active.</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">Here&rsquo;s what you get:</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="padding:6px 0 6px 16px;color:#333;font-size:16px;line-height:1.6;">&bull; AI Chatbot (50 conversations/month)</td></tr>
              <tr><td style="padding:6px 0 6px 16px;color:#333;font-size:16px;line-height:1.6;">&bull; CRM (50 leads max)</td></tr>
              <tr><td style="padding:6px 0 6px 16px;color:#333;font-size:16px;line-height:1.6;">&bull; Analytics Dashboard (read-only)</td></tr>
            </table>
            ${emailButton("Access Your Dashboard", magicLinkUrl)}
            <p style="color:#666;font-size:14px;line-height:1.5;">
              Your trial ends in 14 days. Upgrade anytime at
              <a href="${appUrl}/dashboard/billing" style="color:#4c85ff;">your billing page</a>.
            </p>
          `,
        })
      );
    } catch (emailErr) {
      logger.errorWithCause("[api/auth/signup-free] Failed to send welcome email", emailErr);
      // Account was created — continue with success response
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Check your email for a login link.",
        trialEndsAt: trialEndsAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.errorWithCause("[api/auth/signup-free] Error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
