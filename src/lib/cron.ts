import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";
import {
  captureCheckIn,
  addBreadcrumb,
  captureException,
} from "@sentry/node";

/**
 * Verify that a cron request is legitimate.
 * In production (Vercel), cron jobs include an Authorization header with CRON_SECRET.
 * In development, we allow requests without the secret.
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET must be set — reject all requests without it
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }
    // In local development only, allow requests without the secret
    return null;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cron error handler wrapper
// ---------------------------------------------------------------------------

type CronHandler = (request: NextRequest) => Promise<NextResponse>;

/**
 * Wrap a cron route handler with full observability and error monitoring.
 *
 * On every invocation:
 * - Logs start time, end time, and duration
 * - Reports Sentry cron check-ins (in_progress -> ok/error)
 * - Warns on slow executions (>30s)
 *
 * On fatal error:
 * - Logs with full context via structured logger
 * - Reports to Sentry with duration and timing context
 * - Sends a Telegram alert so operators are notified immediately
 * - Returns a 500 response with `_cron` metadata
 *
 * Usage:
 * ```ts
 * export const GET = withCronErrorHandler("cron/my-job", async (request) => {
 *   // ... job logic ...
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */

/** Default threshold (ms) above which a cron run is considered slow. */
const SLOW_THRESHOLD_MS = 30_000;

export function withCronErrorHandler(
  jobName: string,
  handler: CronHandler,
): CronHandler {
  return async (request: NextRequest) => {
    const startTime = performance.now();
    const startIso = new Date().toISOString();

    // ---- Sentry cron check-in: in_progress ----
    const monitorSlug = jobName.replace(/\//g, "-");
    let checkInId: string | undefined;
    try {
      checkInId = captureCheckIn({
        monitorSlug,
        status: "in_progress",
      });
    } catch {
      // SDK may not support captureCheckIn — degrade gracefully
    }

    logger.info(`[${jobName}] Cron started`, { timestamp: startIso });

    try {
      const response = await handler(request);
      const durationMs = Math.round(performance.now() - startTime);

      // ---- Slow-run warning ----
      if (durationMs > SLOW_THRESHOLD_MS) {
        logger.warn(
          `[${jobName}] Cron execution slow: ${durationMs}ms (threshold ${SLOW_THRESHOLD_MS}ms)`,
        );
        addBreadcrumb({
          category: "cron",
          message: `${jobName} slow execution: ${durationMs}ms`,
          level: "warning",
          data: { durationMs, threshold: SLOW_THRESHOLD_MS },
        });
      }

      const succeeded = response.status >= 200 && response.status < 300;

      // ---- Sentry cron check-in: ok / error ----
      finishSentryCheckIn(monitorSlug, checkInId, succeeded ? "ok" : "error", durationMs);

      // ---- Structured completion log ----
      if (succeeded) {
        logger.info(`[${jobName}] Cron completed in ${durationMs}ms`, {
          durationMs,
          cronJob: jobName,
        });
      } else {
        logger.warn(
          `[${jobName}] Cron returned non-2xx (${response.status}) in ${durationMs}ms`,
          { durationMs, status: response.status, cronJob: jobName },
        );
      }

      return response;
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);
      const message = error instanceof Error ? error.message : String(error);

      // ---- Sentry cron check-in: error ----
      finishSentryCheckIn(monitorSlug, checkInId, "error", durationMs);

      // Structured logging
      logger.errorWithCause(
        `[${jobName}] Fatal cron error after ${durationMs}ms`,
        error,
      );

      // Sentry capture
      captureException(error, {
        tags: { cronJob: jobName },
        extra: { jobName, durationMs, startIso },
      });

      // Telegram alert so operators know immediately
      sendTelegramAlert(
        "critical",
        `Cron Job Failed: ${jobName}`,
        `The cron job "${jobName}" threw an unhandled error after ${durationMs}ms and returned 500.\n\nError: ${message.slice(0, 500)}`,
      ).catch((err) => {
        logger.errorWithCause(`[${jobName}] Telegram alert for cron failure failed`, err);
      });

      return NextResponse.json(
        {
          error: `${jobName} failed`,
          _cron: { durationMs, cronJob: jobName, timestamp: startIso },
        },
        { status: 500 },
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finish a Sentry cron check-in.  Tolerates missing check-in ID or SDK
 * support gaps — monitoring must never crash the job.
 */
function finishSentryCheckIn(
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
    // Degrade gracefully — monitoring should never break the job
  }
}
