import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// GET — Cleanup expired/stale data and recover stuck transient states
//
// Runs daily at 3 AM. Performs:
//
// Deletions:
// 1. Expired sessions (expiresAt < now)
// 2. Expired magic links (expiresAt < now)
// 3. Used magic links older than 24 hours
// 4. Sent/failed/bounced EmailQueue entries older than 30 days
// 5. Completed/failed/dead_letter OrchestrationEvent entries older than 30 days
// 6. FSMSyncLog entries older than 90 days
// 7. Read notifications older than 90 days
//
// Stuck-state recovery:
// 8. Services stuck in "provisioning" for > 1 hour → "provisioning_failed"
// 9. ContentJobs stuck in "generating" for > 2 hours → "failed"
// 10. SocialPosts stuck in "scheduled" with scheduledAt in the past > 2 hours → "failed"
// 11. EnrichmentRecords stuck in "enriching" for > 2 hours → "failed"
// 12. FSMConnections stuck in "syncing" for > 30 minutes → "error"
// 13. Expired "pending" ApprovalRequests → "expired"
// 14. Stale leads in "qualified"/"appointment" untouched for > 180 days → "lost"
// ---------------------------------------------------------------------------

export const GET = withCronErrorHandler("cron/cleanup", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // ─── Deletions ────────────────────────────────────────────────────

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

    // 4. Delete sent/failed/bounced email queue entries older than 30 days
    let staleEmailQueue = 0;
    try {
      const result = await prisma.emailQueue.deleteMany({
        where: {
          status: { in: ["sent", "failed", "bounced"] },
          createdAt: { lt: thirtyDaysAgo },
        },
      });
      staleEmailQueue = result.count;
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to clean EmailQueue", err);
    }

    // 5. Delete completed/failed/dead_letter orchestration events older than 30 days
    let staleOrchestrationEvents = 0;
    try {
      const result = await prisma.orchestrationEvent.deleteMany({
        where: {
          status: { in: ["completed", "failed", "dead_letter"] },
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

    // ─── Stuck-state recovery ─────────────────────────────────────────

    // 8. Services stuck in "provisioning" for > 1 hour → "provisioning_failed"
    let stuckProvisioning = 0;
    try {
      const result = await prisma.clientService.updateMany({
        where: {
          status: "provisioning",
          updatedAt: { lt: oneHourAgo },
        },
        data: { status: "provisioning_failed" },
      });
      stuckProvisioning = result.count;
      if (stuckProvisioning > 0) {
        logger.warn(`[cron/cleanup] Recovered ${stuckProvisioning} services stuck in provisioning`);
        sendTelegramAlert(
          "warning",
          "Provisioning Failures Detected",
          `${stuckProvisioning} service(s) were stuck in "provisioning" for >1 hour and have been marked as failed. Manual review may be needed.`,
        ).catch((err) => {
          logger.errorWithCause("[cron/cleanup] Telegram alert for stuck provisioning failed", err);
        });
      }
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to recover stuck provisioning", err);
    }

    // 9. ContentJobs stuck in "generating" for > 2 hours → "failed"
    let stuckContentJobs = 0;
    try {
      const result = await prisma.contentJob.updateMany({
        where: {
          status: "generating",
          updatedAt: { lt: twoHoursAgo },
        },
        data: { status: "failed" },
      });
      stuckContentJobs = result.count;
      if (stuckContentJobs > 0) {
        logger.warn(`[cron/cleanup] Recovered ${stuckContentJobs} content jobs stuck in generating`);
      }
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to recover stuck content jobs", err);
    }

    // 10. SocialPosts stuck in "scheduled" with scheduledAt in the past > 2 hours → "failed"
    let stuckSocialPosts = 0;
    try {
      const result = await prisma.socialPost.updateMany({
        where: {
          status: "scheduled",
          scheduledAt: { lt: twoHoursAgo },
        },
        data: { status: "failed" },
      });
      stuckSocialPosts = result.count;
      if (stuckSocialPosts > 0) {
        logger.warn(`[cron/cleanup] Recovered ${stuckSocialPosts} social posts stuck in scheduled`);
      }
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to recover stuck social posts", err);
    }

    // 11. EnrichmentRecords stuck in "enriching" for > 2 hours → "failed"
    let stuckEnrichment = 0;
    try {
      const result = await prisma.enrichmentRecord.updateMany({
        where: {
          status: "enriching",
          updatedAt: { lt: twoHoursAgo },
        },
        data: {
          status: "failed",
        },
      });
      stuckEnrichment = result.count;
      if (stuckEnrichment > 0) {
        logger.warn(`[cron/cleanup] Recovered ${stuckEnrichment} enrichment records stuck in enriching`);
      }
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to recover stuck enrichment records", err);
    }

    // 12. FSMConnections stuck in "syncing" for > 30 minutes → "error"
    let stuckFSMSync = 0;
    try {
      const result = await prisma.fSMConnection.updateMany({
        where: {
          syncStatus: "syncing",
          updatedAt: { lt: thirtyMinutesAgo },
        },
        data: {
          syncStatus: "error",
          syncError: "Recovered from stuck syncing state (exceeded 30 minute timeout)",
        },
      });
      stuckFSMSync = result.count;
      if (stuckFSMSync > 0) {
        logger.warn(`[cron/cleanup] Recovered ${stuckFSMSync} FSM connections stuck in syncing`);
      }
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to recover stuck FSM connections", err);
    }

    // 13. Expire "pending" ApprovalRequests past their expiresAt
    let expiredApprovals = 0;
    try {
      const result = await prisma.approvalRequest.updateMany({
        where: {
          status: "pending",
          expiresAt: { lt: now },
        },
        data: { status: "expired" },
      });
      expiredApprovals = result.count;
      if (expiredApprovals > 0) {
        logger.info(`[cron/cleanup] Expired ${expiredApprovals} approval requests past their deadline`);
      }
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to expire approval requests", err);
    }

    // 14. Stale leads in "qualified"/"appointment" untouched for > 180 days → "lost"
    let staleLeads = 0;
    try {
      const result = await prisma.lead.updateMany({
        where: {
          status: { in: ["qualified", "appointment"] },
          updatedAt: { lt: oneEightyDaysAgo },
        },
        data: { status: "lost" },
      });
      staleLeads = result.count;
      if (staleLeads > 0) {
        logger.info(`[cron/cleanup] Moved ${staleLeads} stale qualified/appointment leads to lost`);
      }
    } catch (err) {
      logger.errorWithCause("[cron/cleanup] Failed to clean stale leads", err);
    }

    logger.info(
      `[cron/cleanup] Done: ${expiredSessions.count} sessions, ${expiredMagicLinks.count + usedMagicLinks.count} magic links, ${staleEmailQueue} email queue, ${staleOrchestrationEvents} orchestration events, ${staleFSMSyncLogs} FSM logs, ${staleNotifications} notifications | recovered: ${stuckProvisioning} provisioning, ${stuckContentJobs} content, ${stuckSocialPosts} social, ${stuckEnrichment} enrichment, ${stuckFSMSync} FSM sync, ${expiredApprovals} approvals, ${staleLeads} stale leads`
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
      recovered: {
        stuckProvisioning,
        stuckContentJobs,
        stuckSocialPosts,
        stuckEnrichment,
        stuckFSMSync,
        expiredApprovals,
        staleLeads,
      },
    });
});
