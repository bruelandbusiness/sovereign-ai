import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { isConfigured, sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// GET — Daily Telegram digest cron
//
// Runs daily at 8 AM. Generates a digest and sends to all TelegramConfig
// records that have dailyDigest=true.
// ---------------------------------------------------------------------------

export const GET = withCronErrorHandler("cron/telegram-digest", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  if (!isConfigured()) {
    logger.warn("[cron/telegram-digest] TELEGRAM_BOT_TOKEN not set - skipping");
    return NextResponse.json({ skipped: true, reason: "not configured" });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Gather digest data
    const [
      mrrResult,
      newClientsThisWeek,
      leadsToday,
      pendingApprovals,
      criticalErrors,
    ] = await Promise.all([
      prisma.subscription.aggregate({
        _sum: { monthlyAmount: true },
        where: { status: "active" },
      }),
      prisma.client.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.approvalRequest.count({
        where: { status: "pending" },
      }),
      prisma.agentExecution.count({
        where: {
          status: "failed",
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
    ]);

    const mrrCents = mrrResult._sum.monthlyAmount || 0;
    const mrrDollars = (mrrCents / 100).toFixed(2);

    const digest = [
      "\u{2615} *Daily Digest*",
      "",
      `\u{1F4B0} MRR: $${mrrDollars}`,
      `\u{1F195} New clients (7d): ${newClientsThisWeek}`,
      `\u{1F3AF} Leads captured today: ${leadsToday}`,
      `\u{23F3} Pending approvals: ${pendingApprovals}`,
      criticalErrors > 0
        ? `\u{1F534} Critical errors (24h): ${criticalErrors}`
        : `\u{1F7E2} No errors in last 24h`,
    ].join("\n");

    // Find all configs with dailyDigest enabled
    const configs = await prisma.telegramConfig.findMany({
      where: { isActive: true, dailyDigest: true },
    });

    let sent = 0;
    for (const config of configs) {
      const ok = await sendTelegramMessage(
        config.chatId,
        digest,
        "Markdown",
      );
      if (ok) sent++;
    }

    logger.info(
      `[cron/telegram-digest] Sent digest to ${sent}/${configs.length} configs`,
    );

    return NextResponse.json({
      success: true,
      sent,
      total: configs.length,
    });
  } catch (err) {
    logger.errorWithCause("[cron/telegram-digest] Fatal error", err);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 },
    );
  }
});
