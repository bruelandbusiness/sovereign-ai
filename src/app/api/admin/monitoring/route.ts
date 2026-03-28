import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helper — build a per-day error count array for the last N days
// ---------------------------------------------------------------------------

function buildErrorTrend(
  rows: Array<{ createdAt: Date }>,
  from: Date,
  to: Date,
): Array<{ date: string; count: number }> {
  const buckets: Record<string, number> = {};
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    buckets[key] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (key in buckets) {
      buckets[key] += 1;
    }
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

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

  try {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Quick DB health check with 2-second timeout
  let dbStatus = "connected";
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 AS ok`.then(() => "connected" as const),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 2000)),
    ]);
    dbLatencyMs = Date.now() - dbStart;
    if (result === "timeout") {
      dbStatus = "slow";
    } else if (dbLatencyMs > 1000) {
      dbStatus = "slow";
    }
  } catch {
    dbStatus = "error";
  }

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
    emailTrackingStats,
    activeSessionCount,
    auditLogErrors,
    auditLogErrorTrend,
    apiUsageByResource,
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

    // Email tracking events (last 30 days)
    prisma.emailEvent.groupBy({
      by: ["type"],
      where: {
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
    }),

    // Active sessions count (non-expired)
    prisma.session.count({
      where: { expiresAt: { gt: now } },
    }),

    // AuditLog errors (action = 'error_captured'), last 50
    prisma.auditLog.findMany({
      where: { action: "error_captured" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        accountId: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
      },
    }),

    // AuditLog errors for trend (last 14 days)
    prisma.auditLog.findMany({
      where: {
        action: "error_captured",
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { createdAt: true },
    }),

    // API usage — audit log entries from last 24h grouped by resource
    prisma.auditLog.groupBy({
      by: ["resource"],
      where: { createdAt: { gte: oneDayAgo } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
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
      apiStatus: dbStatus === "error" ? "degraded" : "healthy",
      dbStatus,
      dbLatencyMs,
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
    emailTracking: Object.fromEntries(
      emailTrackingStats.map((row) => [row.type, row._count.id])
    ),
    activeSessions: activeSessionCount,
    auditErrors: auditLogErrors.map((e) => {
      let parsed: Record<string, unknown> = {};
      if (e.metadata) {
        try { parsed = JSON.parse(e.metadata); } catch { /* ignore */ }
      }
      return {
        id: e.id,
        accountId: e.accountId,
        resource: e.resource,
        resourceId: e.resourceId,
        severity: (parsed.severity as string) || "error",
        message: (parsed.message as string) || e.resource,
        source: (parsed.source as string) || null,
        route: (parsed.route as string) || null,
        user: (parsed.user as string) || e.accountId || null,
        createdAt: e.createdAt.toISOString(),
      };
    }),
    errorTrend: buildErrorTrend(auditLogErrorTrend, fourteenDaysAgo, now),
    apiUsage: apiUsageByResource.map((row) => ({
      endpoint: row.resource,
      count: row._count.id,
    })),
  });
  } catch (error) {
    logger.errorWithCause("[admin/monitoring] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Quick actions (clear cache, etc.)
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const body = await request.json() as { action?: string };
    const { action } = body;

    if (action === "clear_cache") {
      // Attempt to flush Upstash Redis cache if configured
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (url && token) {
        await fetch(`${url}/flushdb`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
      }

      logger.info("[admin/monitoring] Cache cleared by admin");
      return NextResponse.json({ ok: true, action: "clear_cache" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.errorWithCause("[admin/monitoring] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
