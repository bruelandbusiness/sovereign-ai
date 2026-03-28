import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getAllCircuitBreakerStatus } from "@/lib/circuit-breaker";

// Read version once at module load
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../../../../package.json");

const startTime = Date.now();

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers — lightweight reachability probes (2s timeout each)
// ---------------------------------------------------------------------------

interface ProbeResult {
  status: "ok" | "error" | "not_configured";
  latencyMs: number;
  error?: string;
}

async function probeRedis(): Promise<ProbeResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { status: "not_configured", latencyMs: 0 };

  const start = Date.now();
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(2000),
    });
    const latencyMs = Date.now() - start;
    return { status: res.ok ? "ok" : "error", latencyMs, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { status: "error", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

async function probeStripe(): Promise<ProbeResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { status: "not_configured", latencyMs: 0 };

  const start = Date.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(2000),
    });
    const latencyMs = Date.now() - start;
    return { status: res.ok ? "ok" : "error", latencyMs, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { status: "error", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

async function probeSendGrid(): Promise<ProbeResult> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return { status: "not_configured", latencyMs: 0 };

  const start = Date.now();
  try {
    const res = await fetch("https://api.sendgrid.com/v3/scopes", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(2000),
    });
    const latencyMs = Date.now() - start;
    return { status: res.ok ? "ok" : "error", latencyMs, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { status: "error", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

async function probeTwilio(): Promise<ProbeResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return { status: "not_configured", latencyMs: 0 };

  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        },
        signal: AbortSignal.timeout(2000),
      },
    );
    const latencyMs = Date.now() - start;
    return { status: res.ok ? "ok" : "error", latencyMs, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { status: "error", latencyMs: Date.now() - start, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// GET — Public health check (no auth required)
// Designed for uptime monitors, load balancers, and the admin monitoring page.
//
// Checks ALL critical dependencies with actual reachability probes:
//   - Database (Prisma SELECT 1)
//   - Redis (Upstash REST ping)
//   - Stripe API
//   - SendGrid API
//   - Twilio API
//   - Memory / heap usage
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "health", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const checks: Record<string, unknown> = {};
  let overall: "ok" | "degraded" | "error" = "ok";

  function degrade(level: "degraded" | "error") {
    if (level === "error") overall = "error";
    else if (overall !== "error") overall = "degraded";
  }

  // 1. Database connectivity (with 2-second timeout)
  try {
    const dbStart = Date.now();
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 AS ok`.then(() => "connected" as const),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 2000)),
    ]);
    const dbLatency = Date.now() - dbStart;

    if (result === "timeout") {
      checks.database = { status: "timeout", latencyMs: dbLatency };
      degrade("degraded");
    } else {
      checks.database = { status: "connected", latencyMs: dbLatency };
      if (dbLatency > 1000) degrade("degraded");
    }
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "Unknown error";
    const safeMsg = process.env.NODE_ENV === "production" ? "Database connection failed" : rawMsg;
    checks.database = { status: "error", message: safeMsg };
    degrade("error");
  }

  // 2. Redis connectivity
  const redisResult = await probeRedis();
  checks.redis = redisResult;
  if (redisResult.status === "error") degrade("degraded");

  // 3. Stripe API reachability
  const stripeResult = await probeStripe();
  checks.stripe = stripeResult;
  if (stripeResult.status === "error") degrade("degraded");

  // 4. SendGrid API reachability
  const sendgridResult = await probeSendGrid();
  checks.sendgrid = sendgridResult;
  if (sendgridResult.status === "error") degrade("degraded");

  // 5. Twilio API reachability
  const twilioResult = await probeTwilio();
  checks.twilio = twilioResult;
  if (twilioResult.status === "error") degrade("degraded");

  // 6. Memory usage
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMB = Math.round(mem.rss / 1024 / 1024);
  const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  checks.memory = { heapUsedMB, heapTotalMB, rssMB, heapPercent };
  if (heapPercent > 90) degrade("degraded");

  // 7. Uptime
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  checks.uptime = {
    seconds: uptimeSeconds,
    human: formatUptime(uptimeSeconds),
  };

  // 8. Circuit breaker status — shows if any service has tripped
  const circuitBreakers = getAllCircuitBreakerStatus();
  if (Object.keys(circuitBreakers).length > 0) {
    checks.circuitBreakers = circuitBreakers;
    // If any breaker is open, the system is degraded
    for (const [, cb] of Object.entries(circuitBreakers)) {
      if (cb.state === "open") degrade("degraded");
    }
  }

  const currentOverall = overall as "ok" | "degraded" | "error";
  const status = currentOverall === "error" ? 503 : 200;

  // Log degraded/error states for observability
  if (currentOverall !== "ok") {
    logger.warn("[health] Health check returned non-ok status", {
      overall,
      database: (checks.database as Record<string, unknown>)?.status,
      redis: redisResult.status,
      stripe: stripeResult.status,
      sendgrid: sendgridResult.status,
      twilio: twilioResult.status,
      heapPercent,
    });
  }

  return NextResponse.json(
    {
      status: overall,
      version,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}
