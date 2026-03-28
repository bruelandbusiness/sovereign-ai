import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { buildNPSEmail } from "@/lib/emails/nps";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withCronErrorHandler("cron/nps", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const now = new Date();

    // Find clients who signed up 30 or 90 days ago (within a 1-day window)
    const clients = await prisma.client.findMany({
      include: {
        account: { select: { email: true } },
        npsResponses: { select: { surveyType: true } },
      },
      take: 500,
    });

    let sent = 0;
    const errors: string[] = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

    for (const client of clients) {
      try {
        const daysSinceSignup = Math.floor(
          (now.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        let surveyType: "30day" | "90day" | null = null;
        if (daysSinceSignup >= 30 && daysSinceSignup < 31) surveyType = "30day";
        else if (daysSinceSignup >= 90 && daysSinceSignup < 91) surveyType = "90day";

        if (!surveyType) continue;

        // Check if already sent
        const alreadySent = client.npsResponses.some(
          (r) => r.surveyType === surveyType
        );
        if (alreadySent) continue;

        // Create NPS record (sentAt = now, respondedAt = null until they respond)
        const nps = await prisma.nPSResponse.create({
          data: {
            clientId: client.id,
            score: 0, // Placeholder until response
            surveyType,
          },
        });

        const responseUrl = `${baseUrl}/api/nps/respond?id=${nps.id}`;

        const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?clientId=${client.id}`;
        const { subject, html } = buildNPSEmail(
          client.ownerName,
          client.businessName,
          surveyType,
          responseUrl,
          undefined, // messageId
          unsubscribeUrl,
        );

        // NPS email is already wrapped in emailLayout by buildNPSEmail,
        // so send directly to avoid double-wrapping.
        await sendEmail(client.account.email, subject, html);
        sent++;
      } catch (err) {
        errors.push(
          `Failed for ${client.id}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: clients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/nps] Cron failed", error);
    return NextResponse.json(
      { error: "NPS cron failed" },
      { status: 500 }
    );
  }
});
