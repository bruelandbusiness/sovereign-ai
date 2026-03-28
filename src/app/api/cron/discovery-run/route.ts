import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { runDiscoveryForClient } from "@/lib/discovery";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET: Cron endpoint to run discovery for all clients with active sources.
 *
 * Processes up to 10 clients per run to stay within execution time limits.
 * Each client is processed independently with its own try-catch.
 */
export const GET = withCronErrorHandler("cron/discovery-run", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    // Find distinct clients that have at least one active discovery source
    const activeSources = await prisma.discoverySource.findMany({
      where: { isActive: true },
      select: { clientId: true },
      distinct: ["clientId"],
      take: 10,
    });

    if (activeSources.length === 0) {
      return NextResponse.json({
        success: true,
        clientsProcessed: 0,
        message: "No clients with active discovery sources",
      });
    }

    const results: Array<{
      clientId: string;
      sourcesRun: number;
      leadsDiscovered: number;
      leadsStored: number;
      errors: string[];
    }> = [];
    const errors: string[] = [];

    for (const { clientId } of activeSources) {
      try {
        const result = await runDiscoveryForClient(clientId);
        results.push(result);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        logger.errorWithCause(
          "[cron/discovery-run] Failed for client",
          err,
          { clientId },
        );
        errors.push(`Client ${clientId}: ${errorMsg}`);
      }
    }

    const totalLeadsStored = results.reduce(
      (sum, r) => sum + r.leadsStored,
      0,
    );
    const totalLeadsDiscovered = results.reduce(
      (sum, r) => sum + r.leadsDiscovered,
      0,
    );

    logger.info("[cron/discovery-run] Cron run complete", {
      clientsProcessed: results.length,
      totalLeadsDiscovered,
      totalLeadsStored,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      clientsProcessed: results.length,
      totalLeadsDiscovered,
      totalLeadsStored,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    logger.errorWithCause("[cron/discovery-run] Fatal error", err);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 },
    );
  }
});
