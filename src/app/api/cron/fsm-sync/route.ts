import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { runFSMSync } from "@/lib/integrations/fsm";
import type { FSMPlatform } from "@/lib/integrations/fsm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * FSM sync cron — runs every 15 minutes.
 *
 * For each active FSMConnection:
 *   1. Pull new jobs/customers from the FSM platform
 *   2. Log all sync events
 *   3. Update connection sync status
 */
export const GET = withCronMonitoring("cron/fsm-sync", async (_request) => {

  try {
    // Find all active connections
    const connections = await prisma.fSMConnection.findMany({
      where: { isActive: true },
      take: 20,
    });

    if (connections.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No active FSM connections",
      });
    }

    let totalJobsSynced = 0;
    let totalCustomersSynced = 0;
    let errored = 0;

    for (const connection of connections) {
      try {
        // Skip if already syncing and started less than 15 minutes ago.
        // If syncing for MORE than 15 minutes, the previous run likely crashed —
        // reset to error so it can be retried on the next invocation.
        if (connection.syncStatus === "syncing" && connection.lastSyncAt) {
          const syncingDurationMs = Date.now() - connection.lastSyncAt.getTime();
          if (syncingDurationMs < 15 * 60 * 1000) {
            logger.info(`[cron/fsm-sync] Skipping ${connection.id} - already syncing`);
            continue;
          }
          logger.warn(`[cron/fsm-sync] Recovering ${connection.id} - stuck in syncing for ${Math.round(syncingDurationMs / 60000)}m`);
        }

        // Mark as syncing
        await prisma.fSMConnection.update({
          where: { id: connection.id },
          data: { syncStatus: "syncing", syncError: null },
        });

        // Run the sync
        const result = await runFSMSync(
          connection.platform as FSMPlatform,
          connection.accessToken || undefined
        );

        // Log sync events
        const logEntries = [
          ...result.jobs.map((job) => ({
            connectionId: connection.id,
            direction: "inbound" as const,
            entityType: "job" as const,
            entityId: job.id,
            externalId: job.externalId,
            action: "synced" as const,
            status: "success" as const,
            details: `Synced job: ${job.customerName} — ${job.status}`,
          })),
          ...result.customers.map((cust) => ({
            connectionId: connection.id,
            direction: "inbound" as const,
            entityType: "customer" as const,
            entityId: cust.id,
            externalId: cust.externalId,
            action: "synced" as const,
            status: "success" as const,
            details: `Synced customer: ${cust.name}`,
          })),
        ];

        if (logEntries.length > 0) {
          await prisma.fSMSyncLog.createMany({ data: logEntries });
        }

        // Update connection status
        await prisma.fSMConnection.update({
          where: { id: connection.id },
          data: {
            syncStatus: "synced",
            lastSyncAt: new Date(),
            syncError: null,
          },
        });

        totalJobsSynced += result.jobs.length;
        totalCustomersSynced += result.customers.length;
      } catch (syncError) {
        errored++;
        const errorMessage =
          syncError instanceof Error ? syncError.message : "Unknown sync error";

        logger.error(
          `[fsm-sync-cron] Error syncing connection ${connection.id} (${connection.platform})`,
          { errorMessage }
        );

        // Log the error and update connection status — wrapped in try/catch
        // so a DB failure here doesn't crash the remaining connections
        try {
          await prisma.fSMSyncLog.create({
            data: {
              connectionId: connection.id,
              direction: "inbound",
              entityType: "job",
              action: "synced",
              status: "error",
              details: `Cron sync failed: ${errorMessage}`,
            },
          });

          await prisma.fSMConnection.update({
            where: { id: connection.id },
            data: {
              syncStatus: "error",
              syncError: errorMessage,
            },
          });
        } catch (dbErr) {
          logger.errorWithCause(
            `[fsm-sync-cron] Failed to record sync error for connection ${connection.id}`,
            dbErr,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: connections.length,
      jobsSynced: totalJobsSynced,
      customersSynced: totalCustomersSynced,
      errored,
    });
  } catch (err) {
    logger.errorWithCause("[cron/fsm-sync] Fatal error", err);
    return NextResponse.json(
      { error: "FSM sync cron failed" },
      { status: 500 }
    );
  }
});
