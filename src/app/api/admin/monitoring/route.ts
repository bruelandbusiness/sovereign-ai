import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET — System monitoring dashboard data
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Parallel queries for performance
  const [
    emailQueueStats,
    recentEmailFailures,
    activeClientCount,
    newClientsThisWeek,
    activeSubsAggregate,
    lastMonthSubsAggregate,
    recentAlerts,
    alertCountsBySeverity,
    recentCronActivity,
    recentErrors,
  ] = await Promise.all([
    // Email queue stats
    prisma.emailQueue.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Recent email failures
    prisma.emailQueue.findMany({
      where: { status: "failed" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        to: true,
        subject: true,
        lastError: true,
        createdAt: true,
      },
    }),

    // Active clients
    prisma.client.count({
      where: {
        subscription: { status: "active" },
      },
    }),

    // New clients this week
    prisma.client.count({
      where: {
        createdAt: { gte: oneWeekAgo },
      },
    }),

    // Active subscriptions MRR via aggregate instead of loading all records
    prisma.subscription.aggregate({
      where: { status: "active" },
      _sum: { monthlyAmount: true },
      _count: true,
    }),

    // Last month's MRR for growth calc (active subs created more than 30 days ago)
    prisma.subscription.aggregate({
      where: {
        status: "active",
        createdAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { monthlyAmount: true },
    }),

    // Recent alerts
    prisma.alertLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        severity: true,
        resolved: true,
        createdAt: true,
      },
    }),

    // Alert counts by severity
    prisma.alertLog.groupBy({
      by: ["severity"],
      where: { resolved: false },
      _count: { id: true },
    }),

    // Recent cron activity events (used to determine last-run times)
    prisma.activityEvent.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        type: {
          in: [
            "content_published",
            "email_sent",
            "review_response",
            "lead_captured",
            "ad_optimized",
            "seo_update",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        type: true,
        createdAt: true,
      },
    }),

    // Recent errors from AlertLog
    prisma.alertLog.findMany({
      where: {
        severity: { in: ["error", "critical"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        severity: true,
        createdAt: true,
      },
    }),
  ]);

  // Parse email queue stats
  const emailStats: Record<string, number> = {
    pending: 0,
    sent: 0,
    failed: 0,
    bounced: 0,
  };
  for (const row of emailQueueStats) {
    emailStats[row.status] = row._count.id;
  }

  // Revenue metrics from aggregate results
  const currentMRR = activeSubsAggregate._sum.monthlyAmount || 0;
  const lastMonthMRR = lastMonthSubsAggregate._sum.monthlyAmount || 0;

  const mrrGrowthRate =
    lastMonthMRR > 0
      ? Math.round(((currentMRR - lastMonthMRR) / lastMonthMRR) * 10000) / 100
      : 0;

  // Parse alert severity counts
  const alertCounts: Record<string, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };
  for (const row of alertCountsBySeverity) {
    alertCounts[row.severity] = row._count.id;
  }

  // Cron job last-run times by type
  const cronLastRun: Record<string, string | null> = {};
  const cronTypes = [
    "content_published",
    "email_sent",
    "review_response",
    "lead_captured",
    "ad_optimized",
    "seo_update",
  ];
  for (const type of cronTypes) {
    const event = recentCronActivity.find((e) => e.type === type);
    cronLastRun[type] = event ? event.createdAt.toISOString() : null;
  }

  return NextResponse.json({
    system: {
      apiStatus: "healthy",
      dbStatus: "connected",
      timestamp: now.toISOString(),
    },
    emailQueue: {
      ...emailStats,
      recentFailures: recentEmailFailures.map((f) => ({
        id: f.id,
        to: f.to,
        subject: f.subject,
        error: f.lastError,
        createdAt: f.createdAt.toISOString(),
      })),
    },
    clients: {
      active: activeClientCount,
      newThisWeek: newClientsThisWeek,
    },
    revenue: {
      mrr: currentMRR,
      mrrGrowthRate,
      activeSubscriptions: activeSubsAggregate._count,
    },
    alerts: {
      counts: alertCounts,
      recent: recentAlerts.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        message: a.message,
        severity: a.severity,
        resolved: a.resolved,
        createdAt: a.createdAt.toISOString(),
      })),
    },
    cronJobs: cronLastRun,
    recentErrors: recentErrors.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      message: e.message,
      severity: e.severity,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
