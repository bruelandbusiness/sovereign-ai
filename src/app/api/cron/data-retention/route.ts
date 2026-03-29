// Purges old non-essential data to keep the database lean
// Runs weekly on Sundays at 4 AM

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export const GET = withCronErrorHandler(
  "cron/data-retention",
  async (request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    const results: Record<string, number> = {};

    // 1. Delete audit logs older than 90 days
    const auditLogResult = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: daysAgo(90) },
      },
    });
    results.auditLogs = auditLogResult.count;

    // 2. Delete activity events older than 180 days
    const activityResult = await prisma.activityEvent.deleteMany({
      where: {
        createdAt: { lt: daysAgo(180) },
      },
    });
    results.activityEvents = activityResult.count;

    // 3. Delete completed/failed email queue entries older than 30 days
    const emailQueueResult = await prisma.emailQueue.deleteMany({
      where: {
        createdAt: { lt: daysAgo(30) },
        status: { in: ["sent", "failed", "bounced"] },
      },
    });
    results.emailQueue = emailQueueResult.count;

    // 4. Delete webhook logs older than 30 days
    const webhookLogResult = await prisma.webhookLog.deleteMany({
      where: {
        createdAt: { lt: daysAgo(30) },
      },
    });
    results.webhookLogs = webhookLogResult.count;

    // 5. Delete read notifications older than 60 days
    const notificationResult = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: daysAgo(60) },
        read: true,
      },
    });
    results.notifications = notificationResult.count;

    const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);

    logger.info("[cron/data-retention] Purge complete", {
      ...results,
      totalDeleted,
    });

    // Record the purge in audit log
    await prisma.auditLog.create({
      data: {
        action: "data_retention_purge",
        resource: "system",
        resourceId: `purge-${new Date().toISOString().split("T")[0]}`,
        accountId: "system",
        metadata: JSON.stringify({ ...results, totalDeleted }),
      },
    });

    return NextResponse.json({ success: true, deleted: results, totalDeleted });
  }
);
