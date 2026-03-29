import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { getAllCircuitBreakerStatus } from "@/lib/circuit-breaker";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface CheckResult {
  status: "ok" | "error" | "timeout";
  responseTimeMs: number;
  message?: string;
  [key: string]: unknown;
}

const DB_TIMEOUT_MS = 2000;

/**
 * GET /api/health
 *
 * Public health-check endpoint for uptime monitors and load balancers.
 * Each subsystem check is independent so a single failure never crashes
 * the whole endpoint.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP (allows frequent monitoring but prevents abuse)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "health-check", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const checks: Record<string, CheckResult | Record<string, unknown>> = {};
  const appVersion = process.env.npm_package_version ?? "unknown";

  // 1. Database connection (with timeout)
  checks.database = await timedCheck(async () => {
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as ok`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), DB_TIMEOUT_MS),
      ),
    ]);
    if (!result) throw new Error("No result from database");
  });

  // 2. Stripe configured
  checks.stripe = await timedCheck(async () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === "sk_placeholder_for_build") {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
  });

  // 3. SendGrid configured
  checks.sendgrid = await timedCheck(async () => {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }
  });

  // 4. Memory usage
  const mem = process.memoryUsage();
  checks.memory = {
    status: "ok",
    responseTimeMs: 0,
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
  };

  // 5. Uptime
  const uptimeSec = Math.round(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  checks.uptime = {
    status: "ok",
    responseTimeMs: 0,
    seconds: uptimeSec,
    human: `${hours}h ${minutes}m`,
  };

  // 6. Circuit breaker status
  const breakerStatus = getAllCircuitBreakerStatus();
  if (Object.keys(breakerStatus).length > 0) {
    checks.circuitBreakers = breakerStatus;
  }

  // Derive overall status (only from service checks, not memory/uptime)
  const serviceChecks = [
    checks.database as CheckResult,
    checks.stripe as CheckResult,
    checks.sendgrid as CheckResult,
  ];
  const hasError = serviceChecks.some((c) => c.status === "error");
  const hasTimeout = serviceChecks.some((c) => c.status === "timeout");
  const allFailed = serviceChecks.every((c) => c.status !== "ok");

  // Database is critical — if it errors (not timeout), the system is unhealthy
  const dbDown = (checks.database as CheckResult).status === "error";

  // Check if any circuit breaker is open
  const hasOpenBreaker = Object.values(breakerStatus).some(
    (b) => b.state === "open"
  );

  let overall: "ok" | "degraded" | "error";
  if (!hasError && !hasTimeout && !hasOpenBreaker) {
    overall = "ok";
  } else if (allFailed || dbDown) {
    overall = "error";
  } else {
    overall = "degraded";
  }

  const httpStatus = overall === "error" ? 503 : 200;

  const body = {
    status: overall,
    version: appVersion,
    timestamp: new Date().toISOString(),
    checks,
  };

  if (overall !== "ok") {
    logger.warn("Health check not fully healthy", {
      status: overall,
      checks: Object.fromEntries(
        Object.entries(checks)
          .filter(([, v]) => (v as CheckResult).status !== "ok")
          .map(([k, v]) => [k, (v as CheckResult).message]),
      ),
    });
  }

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10",
    },
  });
}

/** Run an async check, capture its result and elapsed time. */
async function timedCheck(fn: () => Promise<void>): Promise<CheckResult> {
  const start = performance.now();
  try {
    await fn();
    return {
      status: "ok",
      responseTimeMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message === "TIMEOUT";
    return {
      status: isTimeout ? "timeout" : "error",
      responseTimeMs: Math.round(performance.now() - start),
      message,
    };
  }
}
