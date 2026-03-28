import { NextRequest, NextResponse } from "next/server";
import {
  captureCheckIn,
  addBreadcrumb,
  captureException,
} from "@sentry/node";

import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CronHandler = (request: NextRequest) => Promise<NextResponse>;

interface CronMonitorOptions {
  /**
   * Warn if execution exceeds this threshold (milliseconds).
   * Defaults to 30_000 (30 seconds).
   */
  warnThresholdMs?: number;
}

interface CronResult {
  [key: string]: unknown;
  success: boolean;
  durationMs: number;
  cronJob: string;
  timestamp: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// withCronMonitoring
// ---------------------------------------------------------------------------

/**
 * Wrap a cron route handler with full observability:
 *
 * 1. **Authentication** — verifies CRON_SECRET before running the handler.
 * 2. **Duration tracking** — logs start, end, and elapsed time.
 * 3. **Sentry cron check-ins** — reports in_progress / ok / error so Sentry
 *    can detect missed or failed cron runs.
 * 4. **Slow-run warnings** — if the handler exceeds `warnThresholdMs`, a
 *    warning is logged and a Sentry breadcrumb is added.
 * 5. **Error reporting** — on uncaught errors, reports to Sentry with cron
 *    context, sends a Telegram alert, and returns a structured 500 response.
 * 6. **Structured response** — always injects `_cron` metadata (duration,
 *    job name, timestamp) into the response body so logs/dashboards can
 *    correlate.
 *
 * Usage:
 * ```ts
 * import { withCronMonitoring } from "@/lib/cron-monitor";
 *
 * export const GET = withCronMonitoring("cron/email-queue", async (request) => {
 *   // ... job logic ...
 *   return NextResponse.json({ success: true, sent: 42 });
 * });
 * ```
 */
export function withCronMonitoring(
  jobName: string,
  handler: CronHandler,
  options: CronMonitorOptions = {},
): CronHandler {
  const { warnThresholdMs = 30_000 } = options;

  return async (request: NextRequest) => {
    // ---- Auth ----
    const authResult = verifyCronSecretInternal(request);
    if (authResult) {
      return authResult;
    }

    // ---- Sentry check-in: in_progress ----
    const monitorSlug = jobName.replace(/\//g, "-");
    let checkInId: string | undefined;
    try {
      checkInId = captureCheckIn({
        monitorSlug,
        status: "in_progress",
      });
    } catch {
      // Sentry SDK may not support captureCheckIn in all configurations.
      // Degrade gracefully — monitoring should never break the job.
    }

    const startTime = performance.now();
    const startIso = new Date().toISOString();

    logger.info(`[${jobName}] Cron started`, { timestamp: startIso });

    try {
      const response = await handler(request);
      const durationMs = Math.round(performance.now() - startTime);

      // ---- Slow-run warning ----
      if (durationMs > warnThresholdMs) {
        logger.warn(`[${jobName}] Cron execution slow: ${durationMs}ms (threshold ${warnThresholdMs}ms)`);
        addBreadcrumb({
          category: "cron",
          message: `${jobName} slow execution: ${durationMs}ms`,
          level: "warning",
          data: { durationMs, warnThresholdMs },
        });
      }

      // ---- Determine success from status code ----
      const succeeded = response.status >= 200 && response.status < 300;

      // ---- Sentry check-in: ok / error ----
      finishCheckIn(monitorSlug, checkInId, succeeded ? "ok" : "error", durationMs);

      // ---- Structured log ----
      const cronResult: CronResult = {
        success: succeeded,
        durationMs,
        cronJob: jobName,
        timestamp: startIso,
      };

      if (succeeded) {
        logger.info(`[${jobName}] Cron completed in ${durationMs}ms`, cronResult);
      } else {
        logger.warn(`[${jobName}] Cron returned non-2xx (${response.status}) in ${durationMs}ms`, cronResult);
      }

      // ---- Inject _cron metadata into response body ----
      return injectCronMetadata(response, cronResult);
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);
      const message = error instanceof Error ? error.message : String(error);

      // ---- Sentry check-in: error ----
      finishCheckIn(monitorSlug, checkInId, "error", durationMs);

      // ---- Structured error log ----
      const cronResult: CronResult = {
        success: false,
        durationMs,
        cronJob: jobName,
        timestamp: startIso,
        error: message,
      };
      logger.errorWithCause(`[${jobName}] Cron failed after ${durationMs}ms`, error);

      // ---- Sentry capture ----
      captureException(error, {
        tags: { cronJob: jobName },
        extra: { jobName, durationMs, startIso },
      });

      // ---- Telegram alert (fire and forget) ----
      sendTelegramAlert(
        "critical",
        `Cron Job Failed: ${jobName}`,
        [
          `The cron job "${jobName}" threw an unhandled error after ${durationMs}ms.`,
          ``,
          `Error: ${message.slice(0, 500)}`,
        ].join("\n"),
      ).catch((err) => {
        logger.errorWithCause(`[${jobName}] Telegram alert failed`, err);
      });

      return NextResponse.json(
        { error: `${jobName} failed`, _cron: cronResult },
        { status: 500 },
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify the CRON_SECRET.  Duplicated from `@/lib/cron` so this module is
 * self-contained — routes that adopt `withCronMonitoring` do not need to call
 * `verifyCronSecret` separately.
 */
function verifyCronSecretInternal(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }
    return null;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  return null;
}

/**
 * Finish a Sentry cron check-in.  Tolerates missing check-in ID or SDK
 * support gaps — monitoring must never crash the job.
 */
function finishCheckIn(
  monitorSlug: string,
  checkInId: string | undefined,
  status: "ok" | "error",
  durationMs: number,
): void {
  try {
    if (checkInId) {
      captureCheckIn({
        checkInId,
        monitorSlug,
        status,
        duration: durationMs / 1000, // Sentry expects seconds
      });
    }
  } catch {
    // Degrade gracefully
  }
}

/**
 * Clone the response and inject `_cron` metadata into the JSON body.
 * If the body is not JSON or cloning fails, return the original response
 * unmodified — we never break the response for the sake of metadata.
 */
async function injectCronMetadata(
  response: NextResponse,
  meta: CronResult,
): Promise<NextResponse> {
  try {
    const body = await response.json();
    return NextResponse.json(
      { ...body, _cron: meta },
      {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      },
    );
  } catch {
    return response;
  }
}
