import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import {
  formatWeeklyDigest,
  type WeeklyDigestData,
} from "@/lib/operations/digest-generator";
import { getHealthSummary } from "@/lib/operations/metrics-aggregator";
import { isConfigured, sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withCronErrorHandler("cron/weekly-digest", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/weekly-digest] Starting weekly digest generation");

    if (!isConfigured()) {
      logger.warn(
        "[cron/weekly-digest] TELEGRAM_BOT_TOKEN not set - skipping",
      );
      return NextResponse.json({ skipped: true, reason: "not configured" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Aggregate weekly metrics
    const [
      currentMrrResult,
      previousMrrResult,
      leadsThisWeek,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      revenueThisWeek,
      newClients,
      churnedClients,
      activeClientsWithLeads,
      avgLeadScoreResult,
      emailFollowUps,
      emailReplies,
      smsFollowUps,
      smsReplies,
      voiceFollowUps,
      voiceReplies,
      contactedProspects,
      callsScheduled,
      weeklyAgentCostResult,
    ] = await Promise.all([
      prisma.subscription.aggregate({
        _sum: { monthlyAmount: true },
        where: { status: "active" },
      }),
      // Approximate previous week MRR by looking at subscriptions that were active
      // We use the current active sum as a baseline (exact historical tracking would need snapshots)
      prisma.subscription.aggregate({
        _sum: { monthlyAmount: true },
        where: { status: "active" },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.revenueEvent.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.client.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.subscription.count({
        where: {
          status: "canceled",
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.client.findMany({
        where: {
          subscription: { status: "active" },
        },
        select: {
          id: true,
          businessName: true,
          leads: {
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { id: true },
          },
        },
      }),
      prisma.lead.aggregate({
        _avg: { score: true },
        where: { createdAt: { gte: sevenDaysAgo }, score: { not: null } },
      }),
      // Channel response rates: count total follow-ups per channel this week
      prisma.followUpEntry.count({
        where: { currentChannel: "email", lastStepAt: { gte: sevenDaysAgo } },
      }),
      prisma.followUpEntry.count({
        where: { currentChannel: "email", status: "replied", updatedAt: { gte: sevenDaysAgo } },
      }),
      prisma.followUpEntry.count({
        where: { currentChannel: "sms", lastStepAt: { gte: sevenDaysAgo } },
      }),
      prisma.followUpEntry.count({
        where: { currentChannel: "sms", status: "replied", updatedAt: { gte: sevenDaysAgo } },
      }),
      prisma.followUpEntry.count({
        where: { currentChannel: "voice", lastStepAt: { gte: sevenDaysAgo } },
      }),
      prisma.followUpEntry.count({
        where: { currentChannel: "voice", status: "replied", updatedAt: { gte: sevenDaysAgo } },
      }),
      // Prospect pipeline: contacted prospects (any status beyond "new")
      prisma.prospect.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { not: "new" },
        },
      }),
      // Prospect pipeline: calls/demos scheduled this week
      prisma.prospectActivity.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          type: { in: ["call", "demo"] },
        },
      }),
      // Total API/agent spend this week from AgentExecution.totalCostCents
      prisma.agentExecution.aggregate({
        _sum: { totalCostCents: true },
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const currentMrr = (currentMrrResult._sum.monthlyAmount || 0) / 100;
    const previousMrr = (previousMrrResult._sum.monthlyAmount || 0) / 100;
    const mrrChange = currentMrr - previousMrr;
    const mrrChangePercent =
      previousMrr === 0 ? 0 : (mrrChange / previousMrr) * 100;

    // Build per-client delivery data
    const leadsDeliveredPerClient = activeClientsWithLeads.map((client) => ({
      clientName: client.businessName,
      delivered: client.leads.length,
      target: 20, // default contracted target per week
      percentage: (client.leads.length / 20) * 100,
    }));

    // Simple health scores based on lead delivery percentage
    const healthScores = activeClientsWithLeads.map((client) => {
      const deliveryRate = (client.leads.length / 20) * 100;
      return Math.min(100, deliveryRate);
    });

    const clientHealthSummary = getHealthSummary(healthScores);

    // Build churn risk list (clients with low delivery / activity)
    const churnRisk = activeClientsWithLeads
      .filter((client) => {
        const deliveryRate = (client.leads.length / 20) * 100;
        return deliveryRate < 70;
      })
      .map((client) => ({
        clientName: client.businessName,
        healthScore: Math.round(
          Math.min(100, (client.leads.length / 20) * 100),
        ),
        trend: "declining" as const,
      }));

    const emailResponseRate = emailFollowUps > 0 ? (emailReplies / emailFollowUps) * 100 : 0;
    const smsResponseRate = smsFollowUps > 0 ? (smsReplies / smsFollowUps) * 100 : 0;
    const voiceResponseRate = voiceFollowUps > 0 ? (voiceReplies / voiceFollowUps) * 100 : 0;
    const weeklyAgentCostCents = weeklyAgentCostResult._sum.totalCostCents || 0;

    const data: WeeklyDigestData = {
      mrrChange,
      mrrChangePercent,
      leadsDeliveredPerClient,
      avgLeadScore: avgLeadScoreResult._avg.score || 0,
      responseRateByChannel: {
        email: emailResponseRate,
        sms: smsResponseRate,
        voice: voiceResponseRate,
      },
      clientHealthSummary,
      prospectPipeline: {
        newProspects: newClients,
        contacted: contactedProspects,
        callsScheduled,
      },
      totalApiSpend: weeklyAgentCostCents / 100,
      churnRisk,
    };

    const message = formatWeeklyDigest(data);

    // Send via Telegram
    const configs = await prisma.telegramConfig.findMany({
      where: { isActive: true, dailyDigest: true },
    });

    let sent = 0;
    for (const config of configs) {
      const ok = await sendTelegramMessage(config.chatId, message);
      if (ok) sent++;
    }

    logger.info("[cron/weekly-digest] Weekly digest sent", {
      sent,
      total: configs.length,
      leadsThisWeek,
      newClients,
      churnedClients,
    });

    return NextResponse.json({
      ok: true,
      sent: sent > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.errorWithCause("[cron/weekly-digest] Fatal error", err);
    return NextResponse.json(
      { error: "Weekly digest cron job failed" },
      { status: 500 },
    );
  }
});
