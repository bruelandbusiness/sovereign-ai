import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { runAllHealthChecks } from "@/lib/operations/system-monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// GET — System health check
//
// Runs all health checks against database, Claude API, SendGrid, Twilio,
// and Stripe. Returns status for each service and triggers alerts for
// degraded or critical states.
// ---------------------------------------------------------------------------

export const GET = withCronErrorHandler("cron/system-health", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const results = await runAllHealthChecks();

  const overallStatus = results.some((r) => r.status === "critical")
    ? "critical"
    : results.some((r) => r.status === "degraded")
      ? "degraded"
      : "healthy";

  return NextResponse.json({
    success: true,
    status: overallStatus,
    checks: results,
    timestamp: new Date().toISOString(),
  });
});
