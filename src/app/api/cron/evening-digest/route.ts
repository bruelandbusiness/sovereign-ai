import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import {
  formatDailyDigest,
  type DailyDigestData,
} from "@/lib/operations/digest-generator";
import { isConfigured, sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withCronErrorHandler("cron/evening-digest", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/evening-digest] Starting evening digest generation");

    if (!isConfigured()) {
      logger.warn(
        "[cron/evening-digest] TELEGRAM_BOT_TOKEN not set - skipping",
      );
      return NextResponse.json({ skipped: true, reason: "not configured" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Aggregate daily metrics
    const [
      mrrResult,
      leadsToday,
      revenueEventsResult,
      revenueEventsCount,
      activeClients,
      pendingApprovals,
      criticalAnomalies,
      failedExecutions,
      outreachSentToday,
      repliesReceivedToday,
      appointmentsBookedToday,
      apiCostResult,
    ] = await Promise.all([
      prisma.subscription.aggregate({
        _sum: { monthlyAmount: true },
        where: { status: "active" },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.revenueEvent.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.revenueEvent.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.client.count({
        where: {
          subscription: { status: "active" },
        },
      }),
      prisma.approvalRequest.count({
        where: { status: "pending" },
      }),
      prisma.anomalyLog.findMany({
        where: {
          severity: "critical",
          acknowledged: false,
          createdAt: { gte: todayStart },
        },
        select: { title: true },
      }),
      prisma.agentExecution.count({
        where: {
          status: "failed",
          createdAt: { gte: todayStart },
        },
      }),
      // Outreach entries that had a step executed today
      prisma.outreachEntry.count({
        where: { lastStepAt: { gte: todayStart } },
      }),
      // Outreach entries that received a reply today
      prisma.outreachEntry.count({
        where: {
          status: "replied",
          updatedAt: { gte: todayStart },
        },
      }),
      // Bookings created today
      prisma.booking.count({
        where: { createdAt: { gte: todayStart } },
      }),
      // API/agent cost today from AgentExecution.totalCostCents
      prisma.agentExecution.aggregate({
        _sum: { totalCostCents: true },
        where: { createdAt: { gte: todayStart } },
      }),
    ]);

    const mrrCents = mrrResult._sum.monthlyAmount || 0;
    const revenueTotal = revenueEventsResult._sum.amount || 0;

    const criticalAlerts: string[] = criticalAnomalies.map((a) => a.title);
    if (failedExecutions > 0) {
      criticalAlerts.push(
        `${failedExecutions} agent execution${failedExecutions === 1 ? "" : "s"} failed today`,
      );
    }

    const apiCostTodayCents = apiCostResult._sum.totalCostCents || 0;

    const data: DailyDigestData = {
      mrr: mrrCents / 100,
      leadsDiscovered: leadsToday,
      outreachSent: outreachSentToday,
      repliesReceived: repliesReceivedToday,
      appointmentsBooked: appointmentsBookedToday,
      revenueEvents: {
        count: revenueEventsCount,
        total: revenueTotal / 100,
      },
      apiCostToday: apiCostTodayCents / 100,
      errorsRequiringAttention: failedExecutions,
      pendingApprovals,
      criticalAlerts,
    };

    // Format with formatDailyDigest()
    const message = formatDailyDigest(data);

    // Send via Telegram to all active configs with dailyDigest enabled
    const configs = await prisma.telegramConfig.findMany({
      where: { isActive: true, dailyDigest: true },
    });

    let sent = 0;
    for (const config of configs) {
      const ok = await sendTelegramMessage(config.chatId, message);
      if (ok) sent++;
    }

    logger.info("[cron/evening-digest] Evening digest sent", {
      sent,
      total: configs.length,
      leadsToday,
      revenueEventsCount,
      activeClients,
    });

    return NextResponse.json({
      ok: true,
      sent: sent > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.errorWithCause("[cron/evening-digest] Fatal error", err);
    return NextResponse.json(
      { error: "Evening digest cron job failed" },
      { status: 500 },
    );
  }
});
