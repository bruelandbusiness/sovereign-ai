// Verifies database health and logs key metrics for monitoring
// Runs daily at 3 AM

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const GET = withCronErrorHandler(
  "cron/backup-verify",
  async (request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    // Collect key metrics
    const [
      clientCount,
      leadCount,
      bookingCount,
      subscriptionCount,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.lead.count(),
      prisma.booking.count(),
      prisma.subscription.count(),
      prisma.auditLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Log metrics for monitoring dashboards
    const metrics = {
      clients: clientCount,
      leads: leadCount,
      bookings: bookingCount,
      subscriptions: subscriptionCount,
      auditLogsLast24h: recentAuditLogs,
      timestamp: new Date().toISOString(),
    };

    logger.info("[cron/backup-verify] Daily database health check", metrics);

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "database_health_check",
        resource: "system",
        resourceId: `health-${new Date().toISOString().split("T")[0]}`,
        accountId: "system",
        metadata: JSON.stringify(metrics),
      },
    });

    return NextResponse.json({ success: true, metrics });
  }
);
