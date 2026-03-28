import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { buildReactivationEmail } from "@/lib/emails/reactivation";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/reactivation", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    // Find canceled subscriptions
    const canceledSubs = await prisma.subscription.findMany({
      where: { status: "canceled" },
      include: {
        client: {
          include: { account: { select: { email: true } } },
        },
      },
      take: 500,
    });

    let sent = 0;
    const errors: string[] = [];

    for (const sub of canceledSubs) {
      try {
        const daysSinceCanceled = Math.floor(
          (Date.now() - sub.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine which step to send (7, 14, or 30 days after cancel)
        let step: 1 | 2 | 3 | null = null;
        if (daysSinceCanceled >= 7 && daysSinceCanceled < 8) step = 1;
        else if (daysSinceCanceled >= 14 && daysSinceCanceled < 15) step = 2;
        else if (daysSinceCanceled >= 30 && daysSinceCanceled < 31) step = 3;

        if (!step) continue;

        // Check if we already sent this step
        const alreadySent = await prisma.activityEvent.findFirst({
          where: {
            clientId: sub.clientId,
            type: "email_sent",
            title: `Reactivation step ${step} sent`,
          },
        });

        if (alreadySent) continue;

        const { subject, html } = buildReactivationEmail(
          step,
          sub.client.ownerName,
          sub.client.businessName
        );

        await sendEmail(sub.client.account.email, subject, html);

        // Record that we sent this step
        await prisma.activityEvent.create({
          data: {
            clientId: sub.clientId,
            type: "email_sent",
            title: `Reactivation step ${step} sent`,
            description: `Reactivation email step ${step} sent to ${sub.client.account.email}`,
          },
        });

        sent++;
      } catch (err) {
        errors.push(
          `Failed for ${sub.clientId}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: canceledSubs.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/reactivation] Cron failed", error);
    return NextResponse.json(
      { error: "Reactivation cron failed" },
      { status: 500 }
    );
  }
});
