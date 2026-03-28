import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  sendEmailQueued,
  emailLayout,
  emailButton,
  isValidEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  emails: z.array(z.string().email().max(254)).min(1, "At least one email address is required").max(20, "Maximum 20 invitations per request"),
  message: z.string().max(500).optional(),
});

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SAI-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * POST /api/dashboard/referrals/invite
 *
 * Send referral invitation emails.
 * Body: { emails: string[], message?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { clientId } = await requireClient();

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { emails, message } = parsed.data;

    // Get the client info for the referrer
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        businessName: true,
        ownerName: true,
        account: { select: { email: true } },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const referrerName = client.ownerName || client.businessName;
    const results: { email: string; code: string; success: boolean }[] = [];

    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();

      if (!isValidEmail(email)) {
        results.push({ email, code: "", success: false });
        continue;
      }

      // Generate a unique referral code for this invitation
      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.referralCode.findUnique({
          where: { code },
        });
        if (!existing) break;
        code = generateCode();
        attempts++;
      }

      // Create the referral record
      await prisma.referralCode.create({
        data: {
          clientId,
          code,
          status: "active",
        },
      });

      const referralLink = `https://trysovereignai.com/ref/${code}`;
      const personalMessage = message
        ? `<p style="color:#333;font-size:16px;line-height:1.6;background:#f8f9fa;border-left:3px solid #4c85ff;padding:16px;border-radius:4px;margin:24px 0;">"${message.slice(0, 500)}"</p>`
        : "";

      const html = emailLayout({
        preheader: `${referrerName} thinks you'd love Sovereign AI`,
        body: `
          <h2 style="color:#0a0a0f;font-size:22px;margin:0 0 16px;">You've Been Referred!</h2>
          <p style="color:#333;font-size:16px;line-height:1.6;">
            <strong>${referrerName}</strong> thinks you'd be a great fit for
            <strong>Sovereign AI</strong> — the AI-powered marketing platform that
            generates leads, manages reviews, and grows your business on autopilot.
          </p>
          ${personalMessage}
          <p style="color:#333;font-size:16px;line-height:1.6;">
            Book a free strategy call to see how AI can transform your marketing:
          </p>
          ${emailButton("Book Your Free Strategy Call", referralLink)}
          <p style="color:#666;font-size:14px;line-height:1.5;">
            This referral link is unique to you. When you sign up, both you and
            ${referrerName} benefit.
          </p>
        `,
        isTransactional: true,
      });

      try {
        await sendEmailQueued(
          email,
          `${referrerName} invited you to Sovereign AI`,
          html
        );
        results.push({ email, code, success: true });
      } catch (err) {
        logger.errorWithCause("[referral invite] Failed to send invite email", err);
        results.push({ email, code, success: false });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      sent: successCount,
      total: emails.length,
      results,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    logger.errorWithCause("[referrals/invite] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to send referral invitations" },
      { status: 500 }
    );
  }
}
