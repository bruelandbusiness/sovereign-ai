import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { getRedisClient } from "@/lib/redis";
import { getAllCircuitBreakerStatus } from "@/lib/circuit-breaker";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceStatus = "up" | "down" | "configured" | "unconfigured" | "timeout";

interface ServiceCheck {
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
}

interface HealthChecks {
  database: ServiceCheck;
  redis: ServiceCheck;
  stripe: ServiceCheck;
  sendgrid: ServiceCheck;
  twilio: ServiceCheck;
  [key: string]: unknown;
}

type OverallStatus = "healthy" | "degraded" | "unhealthy";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_TIMEOUT_MS = 5_000;

/** Read version once at module load to avoid repeated fs access. */
function getAppVersion(): string {
  if (process.env.BUILD_ID) {
    return process.env.BUILD_ID;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("../../../../package.json") as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return process.env.npm_package_version ?? "unknown";
  }
}

const APP_VERSION = getAppVersion();

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

async function checkDatabase(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), DB_TIMEOUT_MS),
      ),
    ]);
    return {
      status: "up",
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: message === "TIMEOUT" ? "timeout" : "down",
      latencyMs: Math.round(performance.now() - start),
      message,
    };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const redis = getRedisClient();
  if (!redis) {
    return { status: "unconfigured" };
  }
  const start = performance.now();
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 3_000),
      ),
    ]);
    return {
      status: "up",
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - start),
      message,
    };
  }
}

function checkEnvConfigured(
  ...envVars: string[]
): ServiceCheck {
  const allSet = envVars.every((v) => {
    const val = process.env[v];
    return val && val !== "sk_placeholder_for_build";
  });
  return { status: allSet ? "configured" : "unconfigured" };
}

// ---------------------------------------------------------------------------
// Derive overall status
// ---------------------------------------------------------------------------

function deriveOverallStatus(checks: HealthChecks): OverallStatus {
  const dbOk = checks.database.status === "up";

  if (!dbOk) {
    return "unhealthy";
  }

  // Non-critical services: redis, stripe, sendgrid, twilio
  const nonCritical = [
    checks.redis,
    checks.stripe,
    checks.sendgrid,
    checks.twilio,
  ];
  const anyDown = nonCritical.some(
    (c) => c.status === "down" || c.status === "timeout",
  );

  return anyDown ? "degraded" : "healthy";
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/health
 *
 * Public health-check endpoint for uptime monitors and load balancers.
 * Each subsystem check is independent so a single failure never crashes
 * the whole endpoint.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "health-check", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  // Run async checks in parallel for speed
  const [database, redis] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  // Synchronous env-var checks
  const stripe = checkEnvConfigured("STRIPE_SECRET_KEY");
  const sendgrid = checkEnvConfigured("SENDGRID_API_KEY");
  const twilio = checkEnvConfigured("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN");

  const checks: HealthChecks = {
    database,
    redis,
    stripe,
    sendgrid,
    twilio,
  };

  // Circuit breaker status (keep existing behaviour)
  const breakerStatus = getAllCircuitBreakerStatus();
  if (Object.keys(breakerStatus).length > 0) {
    checks.circuitBreakers = breakerStatus;
  }

  // Memory (keep existing behaviour)
  const mem = process.memoryUsage();
  checks.memory = {
    status: "up" as ServiceStatus,
    heapUsedMB: Math.round(mem.heapUsed / 1_024 / 1_024),
    rssMB: Math.round(mem.rss / 1_024 / 1_024),
  };

  const status = deriveOverallStatus(checks);
  const httpStatus = status === "unhealthy" ? 503 : 200;

  const body = {
    status,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    checks,
  };

  if (status !== "healthy") {
    logger.warn("Health check not fully healthy", {
      status,
      checks: Object.fromEntries(
        Object.entries(checks)
          .filter(([, v]) => {
            const s = (v as ServiceCheck).status;
            return s && s !== "up" && s !== "configured";
          })
          .map(([k, v]) => [k, (v as ServiceCheck).status]),
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
