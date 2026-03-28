import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmailQueued, escapeHtml, emailLayout, emailButton } from "@/lib/email";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { getBundleById, BUNDLES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Return the next bundle tier above the given bundleId, or null if already at top. */
function getNextTier(currentBundleId: string | null | undefined) {
  const tierOrder = ["diy", "starter", "growth", "empire"];
  const currentIndex = currentBundleId
    ? tierOrder.indexOf(currentBundleId)
    : -1;
  const nextId =
    currentIndex >= 0 && currentIndex < tierOrder.length - 1
      ? tierOrder[currentIndex + 1]
      : tierOrder.find((id) => id !== currentBundleId) ?? "growth";
  return getBundleById(nextId) ?? BUNDLES[2]; // fallback to Growth
}

export const GET = withCronErrorHandler("cron/expansion-check", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/expansion-check] Starting expansion opportunity check");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Query active clients with their recent lead counts and account email
    const activeClients = await prisma.client.findMany({
      where: {
        subscription: { status: "active" },
      },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        account: { select: { email: true } },
        subscription: {
          select: { monthlyAmount: true, bundleId: true },
        },
        leads: {
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { id: true },
        },
      },
    });

    let opportunitiesFound = 0;
    let emailsSent = 0;
    const EXPANSION_THRESHOLD = 20;
    const calendlyUrl =
      process.env.NEXT_PUBLIC_CALENDLY_URL ||
      "https://calendly.com/bruelandbusiness/30min";

    for (const client of activeClients) {
      const recentLeadCount = client.leads.length;

      // High-performing clients: lead count in last 30 days exceeds threshold
      if (recentLeadCount > EXPANSION_THRESHOLD) {
        opportunitiesFound++;
        logger.info(
          `[cron/expansion-check] EXPANSION: ${client.businessName} (${client.id}) - ${recentLeadCount} leads in 30 days (bundle: ${client.subscription?.bundleId || "a-la-carte"})`,
        );

        // Deduplicate: check if we already sent an expansion email this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const alreadySent = await prisma.activityEvent.findFirst({
          where: {
            clientId: client.id,
            type: "expansion_email_sent",
            createdAt: { gte: startOfMonth },
          },
          select: { id: true },
        });

        if (alreadySent) {
          logger.info(
            `[cron/expansion-check] Skipping email for ${client.businessName} — already sent this month`,
          );
          continue;
        }

        // Determine next tier and compose email
        const nextTier = getNextTier(client.subscription?.bundleId);
        const percentAbove = Math.round(
          ((recentLeadCount - EXPANSION_THRESHOLD) / EXPANSION_THRESHOLD) * 100,
        );

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
        const unsubscribeUrl = `${appUrl}/api/email/unsubscribe?clientId=${client.id}`;

        const html = emailLayout({
          preheader: `Your AI systems generated ${recentLeadCount} leads this month — let's capture even more.`,
          unsubscribeUrl,
          body: `
            <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(client.ownerName)},</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">Your AI systems generated <strong>${recentLeadCount} leads</strong> this month &mdash; that&rsquo;s <strong>${percentAbove}% above</strong> your plan&rsquo;s target of ${EXPANSION_THRESHOLD}.</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">That&rsquo;s a great problem to have. Upgrading to <strong>${escapeHtml(nextTier.name)}</strong> would unlock:</p>
            <ul style="color:#333;font-size:16px;line-height:1.8;">
              <li>More AI services to convert those extra leads</li>
              <li>Priority support and faster turnaround</li>
              <li>Advanced analytics and reporting</li>
            </ul>
            <p style="color:#333;font-size:16px;line-height:1.5;">Book a quick 30-minute call and we&rsquo;ll walk you through the upgrade options:</p>
            ${emailButton("Book a Call", calendlyUrl)}
            <p style="color:#666;font-size:14px;">Keep up the momentum &mdash; your growth is our top priority.</p>
            <p style="color:#999;font-size:12px;text-align:center;">&mdash; The Sovereign AI Team</p>
          `,
        });

        try {
          await sendEmailQueued(
            client.account.email,
            "You're outgrowing your plan — here's how to capture more leads",
            html,
          );

          // Record the send so we don't duplicate this month
          await prisma.activityEvent.create({
            data: {
              clientId: client.id,
              type: "expansion_email_sent",
              title: "Expansion upsell email sent",
              description: `Sent expansion upsell email — ${recentLeadCount} leads in 30 days (${percentAbove}% above threshold)`,
            },
          });

          emailsSent++;
          logger.info(
            `[cron/expansion-check] Sent expansion email to ${client.businessName} (${client.account.email})`,
          );
        } catch (emailErr) {
          logger.errorWithCause(
            `[cron/expansion-check] Failed to send expansion email to ${client.businessName}`,
            emailErr,
          );
        }
      }
    }

    logger.info("[cron/expansion-check] Completed", {
      opportunitiesFound,
      emailsSent,
    });

    return NextResponse.json({
      ok: true,
      opportunitiesFound,
      emailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.errorWithCause("[cron/expansion-check] Fatal error", err);
    return NextResponse.json(
      { error: "Expansion check cron job failed" },
      { status: 500 },
    );
  }
});
