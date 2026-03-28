import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  sendEmailQueued,
  emailLayout,
  emailButton,
} from "@/lib/email";

const REFERRAL_CREDIT_CENTS = 50000; // $500

/**
 * Track a referral conversion when a new client signs up.
 *
 * Call this after a new client record is created (e.g. from Stripe webhook
 * or onboarding flow). It checks for a referral code, updates the referral
 * record, credits the referrer, and sends notification emails.
 *
 * @param newClientId  The newly created client's ID
 * @param referralCode The referral code from cookie or signup form
 */
export async function trackReferralConversion(
  newClientId: string,
  referralCode: string
): Promise<{ credited: boolean; referrerId?: string }> {
  if (!referralCode) {
    return { credited: false };
  }

  try {
    // Find the referral code record
    const referral = await prisma.referralCode.findUnique({
      where: { code: referralCode },
      include: {
        client: {
          select: {
            id: true,
            ownerName: true,
            businessName: true,
            accountId: true,
            account: { select: { email: true } },
          },
        },
      },
    });

    if (!referral) {
      logger.warn(`[referral-tracker] Code not found: ${referralCode}`);
      return { credited: false };
    }

    // Prevent self-referrals
    if (referral.clientId === newClientId) {
      logger.warn(`[referral-tracker] Self-referral blocked: ${referralCode}`);
      return { credited: false };
    }

    // Prevent double-crediting
    if (referral.status === "credited") {
      logger.warn(`[referral-tracker] Already credited: ${referralCode}`);
      return { credited: false };
    }

    // Update the referral record
    await prisma.referralCode.update({
      where: { id: referral.id },
      data: {
        referredClientId: newClientId,
        creditCents: REFERRAL_CREDIT_CENTS,
        status: "credited",
      },
    });

    // Create a notification for the referrer
    await prisma.notification.create({
      data: {
        accountId: referral.client.accountId,
        type: "system",
        title: "Referral Converted!",
        message: `Your referral just signed up! You've earned a $${(REFERRAL_CREDIT_CENTS / 100).toFixed(0)} credit.`,
        actionUrl: "/dashboard/referrals",
      },
    });

    // Get the new client info for emails
    const newClient = await prisma.client.findUnique({
      where: { id: newClientId },
      select: {
        ownerName: true,
        businessName: true,
        account: { select: { email: true } },
      },
    });

    // Send email to referrer
    const referrerName = referral.client.ownerName || referral.client.businessName;
    const referrerEmail = referral.client.account.email;

    const referrerHtml = emailLayout({
      preheader: "Your referral signed up! You've earned $500 credit.",
      body: `
        <h2 style="color:#0a0a0f;font-size:22px;margin:0 0 16px;">Your Referral Converted!</h2>
        <p style="color:#333;font-size:16px;line-height:1.6;">
          Great news, ${referrerName}! Your referral has signed up for Sovereign AI.
        </p>
        <div style="background:#f0fdf4;border:1px solid #22c55e;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
          <p style="color:#15803d;font-size:28px;font-weight:700;margin:0;">+$${(REFERRAL_CREDIT_CENTS / 100).toFixed(0)}</p>
          <p style="color:#166534;font-size:14px;margin:8px 0 0;">Credit added to your account</p>
        </div>
        <p style="color:#333;font-size:16px;line-height:1.6;">
          Keep referring fellow contractors to earn more credits. Each conversion
          earns you <strong>$500</strong>.
        </p>
        ${emailButton("View Your Referrals", "https://trysovereignai.com/dashboard/referrals")}
      `,
      isTransactional: true,
    });

    await sendEmailQueued(
      referrerEmail,
      "Your referral signed up! You've earned $500 credit",
      referrerHtml
    ).catch((err) =>
      logger.errorWithCause("[referral-tracker] Failed to email referrer:", err)
    );

    // Send welcome email to new client mentioning the referral
    if (newClient?.account?.email) {
      const newClientName = newClient.ownerName || newClient.businessName;
      const welcomeHtml = emailLayout({
        preheader: `Welcome! You were referred by ${referrerName}.`,
        body: `
          <h2 style="color:#0a0a0f;font-size:22px;margin:0 0 16px;">Welcome to Sovereign AI!</h2>
          <p style="color:#333;font-size:16px;line-height:1.6;">
            Hey ${newClientName}, welcome aboard! You were referred by
            <strong>${referrerName}</strong> — great company to keep.
          </p>
          <p style="color:#333;font-size:16px;line-height:1.6;">
            Your AI-powered marketing services are being activated now. Head to your
            dashboard to get started:
          </p>
          ${emailButton("Go to Dashboard", "https://trysovereignai.com/dashboard")}
        `,
        isTransactional: true,
      });

      await sendEmailQueued(
        newClient.account.email,
        `Welcome to Sovereign AI, ${newClientName}!`,
        welcomeHtml
      ).catch((err) =>
        logger.errorWithCause("[referral-tracker] Failed to email new client:", err)
      );
    }

    return { credited: true, referrerId: referral.clientId };
  } catch (error) {
    logger.errorWithCause("[referral-tracker] Error tracking conversion:", error);
    return { credited: false };
  }
}

/**
 * Extract a referral code from a cookie value.
 */
export function parseReferralCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const trimmed = cookieValue.trim();
  // Validate format: SAI- or AFF- prefix followed by alphanumeric chars and hyphens
  // SAI-XXXXXX = client referral codes
  // AFF-SLUG-XXXX = affiliate referral codes
  if (/^(SAI-[A-Z0-9]{6}|AFF-[A-Z0-9-]{4,20})$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}
