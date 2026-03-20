import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// GET — Cleanup expired/stale data
//
// Runs daily at 3 AM. Deletes:
// 1. Expired sessions (expiresAt < now)
// 2. Expired magic links (expiresAt < now)
// 3. Used magic links older than 24 hours
// 4. Sent/failed EmailQueue entries older than 30 days
// 5. Completed/failed OrchestrationEvent entries older than 30 days
// 6. FSMSyncLog entries older than 90 days
// 7. Read notifications older than 90 days
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Delete expired sessions
    const expiredSessions = await prisma.session.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    // 2. Delete expired magic links
    const expiredMagicLinks = await prisma.magicLink.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    // 3. Delete used magic links older than 24 hours
    const usedMagicLinks = await prisma.magicLink.deleteMany({
      where: {
        usedAt: { not: null, lt: twentyFourHoursAgo },
      },
    });

    // 4. Delete sent/failed email queue entries older than 30 days
    let staleEmailQueue = 0;
    try {
      const result = await prisma.emailQueue.deleteMany({
        where: {
          status: { in: ["sent", "failed"] },
          createdAt: { lt: thirtyDaysAgo },
        },
      });
      staleEmailQueue = result.count;
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to clean EmailQueue", err);
    }

    // 5. Delete completed/failed orchestration events older than 30 days
    let staleOrchestrationEvents = 0;
    try {
      const result = await prisma.orchestrationEvent.deleteMany({
        where: {
          status: { in: ["completed", "failed"] },
          createdAt: { lt: thirtyDaysAgo },
        },
      });
      staleOrchestrationEvents = result.count;
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to clean OrchestrationEvent", err);
    }

    // 6. Delete FSM sync logs older than 90 days
    let staleFSMSyncLogs = 0;
    try {
      const result = await prisma.fSMSyncLog.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      });
      staleFSMSyncLogs = result.count;
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to clean FSMSyncLog", err);
    }

    // 7. Delete read notifications older than 90 days
    let staleNotifications = 0;
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: { lt: ninetyDaysAgo },
        },
      });
      staleNotifications = result.count;
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to clean Notification", err);
    }

    logger.info(
      `[cron/cleanup] Done: ${expiredSessions.count} sessions, ${expiredMagicLinks.count + usedMagicLinks.count} magic links, ${staleEmailQueue} email queue, ${staleOrchestrationEvents} orchestration events, ${staleFSMSyncLogs} FSM logs, ${staleNotifications} notifications`
    );

    return NextResponse.json({
      success: true,
      deleted: {
        expiredSessions: expiredSessions.count,
        expiredMagicLinks: expiredMagicLinks.count,
        usedMagicLinks: usedMagicLinks.count,
        staleEmailQueue,
        staleOrchestrationEvents,
        staleFSMSyncLogs,
        staleNotifications,
      },
    });
  } catch (error) {
    logger.errorWithCause("[cron/cleanup] Fatal error", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
