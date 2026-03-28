import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { runHealthScoreForAllClients } from "@/lib/operations/health-scorer";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/health-score", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/health-score] Starting daily health score run");

    const result = await runHealthScoreForAllClients();

    logger.info("[cron/health-score] Completed", {
      processed: result.processed,
      critical: result.critical,
      atRisk: result.atRisk,
    });

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      critical: result.critical,
      atRisk: result.atRisk,
    });
  } catch (err) {
    logger.errorWithCause("[cron/health-score] Fatal error", err);
    return NextResponse.json(
      { error: "Health score cron job failed" },
      { status: 500 },
    );
  }
});
