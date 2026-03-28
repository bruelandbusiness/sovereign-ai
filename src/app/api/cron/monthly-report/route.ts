import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import {
  formatMonthlyReport,
  type MonthlyReportData,
} from "@/lib/operations/digest-generator";
import {
  calculateMrrGrowthRate,
  calculateProjectedAnnualRevenue,
  calculateNetRevenueRetention,
} from "@/lib/operations/metrics-aggregator";
import { isConfigured, sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/monthly-report", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/monthly-report] Starting monthly report generation");

    if (!isConfigured()) {
      logger.warn(
        "[cron/monthly-report] TELEGRAM_BOT_TOKEN not set - skipping",
      );
      return NextResponse.json({ skipped: true, reason: "not configured" });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [
      currentMrrResult,
      totalRevenue,
      activeClients,
      totalClients,
      newClients,
      churnedSubscriptions,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      avgLeadScoreResult,
      clientsWithRevenue,
      totalAgentCostResult,
      prospectCount,
      demoCallCount,
    ] = await Promise.all([
      prisma.subscription.aggregate({
        _sum: { monthlyAmount: true },
        where: { status: "active" },
      }),
      prisma.revenueEvent.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.client.count({
        where: { subscription: { status: "active" } },
      }),
      prisma.client.count(),
      prisma.client.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.subscription.count({
        where: {
          status: "canceled",
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.lead.aggregate({
        _avg: { score: true },
        where: { createdAt: { gte: thirtyDaysAgo }, score: { not: null } },
      }),
      // Get per-client revenue for top/worst analysis
      prisma.client.findMany({
        where: { subscription: { status: "active" } },
        select: {
          businessName: true,
          createdAt: true,
          subscription: { select: { monthlyAmount: true } },
          revenueEvents: {
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { amount: true },
          },
        },
      }),
      // Total agent execution cost this month for cost-per-client and margin calculations
      prisma.agentExecution.aggregate({
        _sum: { totalCostCents: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // Prospect pipeline: new prospects discovered this month
      prisma.prospect.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // Prospect pipeline: demo calls / calls scheduled this month
      prisma.prospectActivity.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          type: { in: ["call", "demo"] },
        },
      }),
    ]);

    const currentMrrCents = currentMrrResult._sum.monthlyAmount || 0;
    const currentMrr = currentMrrCents / 100;
    // Approximate previous month MRR (excluding new clients' subscriptions)
    const previousMrr = currentMrr; // Exact historical tracking would need snapshots
    const mrrGrowthRate = calculateMrrGrowthRate(currentMrr, previousMrr);
    const projectedAnnualRevenue = calculateProjectedAnnualRevenue(currentMrr);

    // Calculate NRR (simplified: using churn count * avg subscription)
    const avgSubscription =
      activeClients > 0 ? currentMrr / activeClients : 0;
    const churnedMrr = churnedSubscriptions * avgSubscription;
    // Expansion MRR requires historical MRR snapshots to compute accurately;
    // passing 0 until an MrrSnapshot model is added to the schema.
    const expansionMrr = 0;
    const netRevenueRetention = calculateNetRevenueRetention(
      currentMrr,
      currentMrr,
      expansionMrr,
      churnedMrr,
    );

    const avgRevenuePerClient =
      activeClients > 0 ? currentMrr / activeClients : 0;

    // Calculate avg client lifetime in months
    const now = new Date();
    const lifetimeMonths = clientsWithRevenue.map((c) => {
      const diffMs = now.getTime() - new Date(c.createdAt).getTime();
      return diffMs / (30 * 24 * 60 * 60 * 1000);
    });
    const avgClientLifetimeMonths =
      lifetimeMonths.length > 0
        ? lifetimeMonths.reduce((a, b) => a + b, 0) / lifetimeMonths.length
        : 0;

    // Find top and worst clients by revenue-to-cost ratio
    const clientPerformance = clientsWithRevenue.map((c) => {
      const revenue = c.revenueEvents.reduce(
        (sum, e) => sum + (e.amount || 0),
        0,
      );
      const subscriptionCost = c.subscription?.monthlyAmount || 0;
      const roi = subscriptionCost > 0 ? (revenue / subscriptionCost) * 100 : 0;
      return { name: c.businessName, roi };
    });
    clientPerformance.sort((a, b) => b.roi - a.roi);

    const topClient = clientPerformance[0] || { name: "N/A", roi: 0 };
    const worstClient =
      clientPerformance[clientPerformance.length - 1] || { name: "N/A", roi: 0 };

    const totalAgentCostCents = totalAgentCostResult._sum.totalCostCents || 0;
    const totalAgentCost = totalAgentCostCents / 100;
    const costPerClient = activeClients > 0 ? totalAgentCost / activeClients : 0;
    const totalRevenueAmount = (totalRevenue._sum.amount || 0) / 100;
    const grossMarginPercent =
      totalRevenueAmount > 0
        ? ((totalRevenueAmount - totalAgentCost) / totalRevenueAmount) * 100
        : 0;
    // leadsDeliveredVsContracted requires a contracted lead target per client;
    // no such field exists in the schema yet. Defaulting to 0 until a
    // contractedLeadTarget column is added to Client or Subscription.
    const leadsDeliveredVsContracted = 0;
    const costPerAcquisition = newClients > 0 ? totalAgentCost / newClients : 0;

    const data: MonthlyReportData = {
      mrr: currentMrr,
      mrrGrowthRate,
      projectedAnnualRevenue,
      totalClients,
      newClients,
      churnedClients: churnedSubscriptions,
      netRevenueRetention,
      avgClientLifetimeMonths,
      avgRevenuePerClient,
      costPerClient,
      grossMarginPercent,
      leadsDeliveredVsContracted,
      topClient,
      worstClient,
      acquisitionMetrics: {
        prospects: prospectCount,
        calls: demoCallCount,
        signedClients: newClients,
        costPerAcquisition,
      },
    };

    const message = formatMonthlyReport(data);

    // Send via Telegram
    const configs = await prisma.telegramConfig.findMany({
      where: { isActive: true, dailyDigest: true },
    });

    let sent = 0;
    for (const config of configs) {
      const ok = await sendTelegramMessage(config.chatId, message);
      if (ok) sent++;
    }

    logger.info("[cron/monthly-report] Monthly report sent", {
      sent,
      total: configs.length,
      currentMrr,
      totalClients,
      newClients,
      churnedSubscriptions,
    });

    return NextResponse.json({
      ok: true,
      sent: sent > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.errorWithCause("[cron/monthly-report] Fatal error", err);
    return NextResponse.json(
      { error: "Monthly report cron job failed" },
      { status: 500 },
    );
  }
});
