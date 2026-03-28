import { NextRequest, NextResponse } from "next/server";
import { captureError } from "@/lib/monitoring/error-logger";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RouteHandler = (
  request: NextRequest,
  context?: unknown,
) => Promise<NextResponse> | NextResponse;

// ---------------------------------------------------------------------------
// withErrorTracking
// ---------------------------------------------------------------------------

/**
 * Higher-order function that wraps a Next.js API route handler with automatic
 * error monitoring.
 *
 * - Catches any unhandled errors thrown by the handler.
 * - Persists the error via `captureError` (AuditLog + Telegram for critical).
 * - Returns a generic 500 JSON response so that internal details are never
 *   leaked to the client.
 *
 * Usage:
 * ```ts
 * export const GET = withErrorTracking(async (req) => {
 *   // your handler logic
 *   return NextResponse.json({ ok: true });
 * });
 * ```
 */
const SLOW_REQUEST_THRESHOLD_MS = 2000;

export function withErrorTracking(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, routeContext?: unknown) => {
    const start = performance.now();
    const url = request.nextUrl?.pathname ?? request.url;

    try {
      const response = await handler(request, routeContext);
      const durationMs = performance.now() - start;

      response.headers.set("X-Response-Time", `${durationMs.toFixed(1)}ms`);

      if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
        logger.warn(
          `[withErrorTracking] Slow request: ${request.method} ${url} took ${durationMs.toFixed(0)}ms`,
        );
      }

      return response;
    } catch (error) {
      const durationMs = performance.now() - start;
      const userAgent = request.headers.get("user-agent") ?? undefined;

      logger.errorWithCause(
        `[withErrorTracking] Unhandled error in ${request.method} ${url} (${durationMs.toFixed(0)}ms)`,
        error,
      );

      // Fire-and-forget: captureError never throws, but wrap just in case
      try {
        await captureError(error, {
          severity: "error",
          url,
          method: request.method,
          route: url,
          userAgent,
          source: `api:${url}`,
        });
      } catch {
        // Monitoring should never take down the request
      }

      const errorResponse = NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
      errorResponse.headers.set("X-Response-Time", `${durationMs.toFixed(1)}ms`);
      return errorResponse;
    }
  };
}
