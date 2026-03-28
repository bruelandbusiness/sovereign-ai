import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { runPrivacyMaintenanceForClient } from "@/lib/compliance/data-privacy";
import { purgeOldContactAttemptLogs } from "@/lib/compliance/data-privacy";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/compliance-purge
 * Weekly cron job to purge unconverted leads and old contact attempt logs.
 * Schedule: 0 3 * * 0 (Sunday 3 AM)
 */
export const GET = withCronErrorHandler("cron/compliance-purge", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();

  try {
    // Get all clients with compliance config
    const clients = await prisma.complianceConfig.findMany({
      select: { clientId: true, dataPurgeDays: true },
    });

    let totalLeadsPurged = 0;
    const errors: Array<{ clientId: string; error: string }> = [];

    for (const client of clients) {
      try {
        const result = await runPrivacyMaintenanceForClient(client.clientId);
        totalLeadsPurged += result.leadsPurged;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({ clientId: client.clientId, error: msg });
        logger.errorWithCause(
          `[cron/compliance-purge] Failed for client ${client.clientId}`,
          error
        );
      }
    }

    // Purge old contact attempt logs (global, not per-client)
    const logsPurged = await purgeOldContactAttemptLogs(180);

    logger.info(
      `[cron/compliance-purge] Completed in ${Date.now() - startTime}ms`,
      {
        clientsProcessed: clients.length,
        totalLeadsPurged,
        logsPurged,
        errors: errors.length,
      }
    );

    return NextResponse.json({
      clientsProcessed: clients.length,
      totalLeadsPurged,
      logsPurged,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/compliance-purge] Fatal error", error);
    return NextResponse.json(
      { error: "Compliance purge cron failed" },
      { status: 500 }
    );
  }
});
