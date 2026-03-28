import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DependencyCheck {
  status: "ok" | "degraded" | "error";
  responseMs: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// Individual dependency checks — actual reachability probes, not config checks
// ---------------------------------------------------------------------------

async function checkDatabase(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 AS ok`.then(() => "ok" as const),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), 3000),
      ),
    ]);
    const responseMs = Date.now() - start;

    if (result === "timeout") {
      return { status: "error", responseMs, message: "Connection timed out (3s)" };
    }

    // Also verify we can count — catches permission / schema issues
    await prisma.account.count();

    if (responseMs > 1000) {
      return { status: "degraded", responseMs, message: "Slow response" };
    }
    return { status: "ok", responseMs };
  } catch (err) {
    const responseMs = Date.now() - start;
    const message =
      process.env.NODE_ENV === "production"
        ? "Database connection failed"
        : err instanceof Error
          ? err.message
          : "Unknown error";
    return { status: "error", responseMs, message };
  }
}

async function checkRedis(): Promise<DependencyCheck> {
  const start = Date.now();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return {
      status: "degraded",
      responseMs: 0,
      message: "Upstash Redis not configured — using in-memory fallback",
    };
  }

  try {
    // Write a test key and read it back to verify full read/write
    const testKey = `health:deep:${Date.now()}`;
    const setRes = await fetch(`${url}/set/${testKey}/ok/ex/10`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });

    if (!setRes.ok) {
      return { status: "error", responseMs: Date.now() - start, message: `Redis SET failed: HTTP ${setRes.status}` };
    }

    const getRes = await fetch(`${url}/get/${testKey}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    const responseMs = Date.now() - start;

    if (!getRes.ok) {
      return { status: "error", responseMs, message: `Redis GET failed: HTTP ${getRes.status}` };
    }

    if (responseMs > 1000) {
      return { status: "degraded", responseMs, message: "Slow response" };
    }
    return { status: "ok", responseMs, message: "Read+write OK" };
  } catch (err) {
    const responseMs = Date.now() - start;
    const isTimeout = err instanceof Error && (err.message.includes("timeout") || err.message.includes("abort"));
    return {
      status: "error",
      responseMs,
      message: isTimeout ? "Connection timed out (3s)" : "Redis connection failed",
    };
  }
}

async function checkStripe(): Promise<DependencyCheck> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { status: "error", responseMs: 0, message: "STRIPE_SECRET_KEY not configured" };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const responseMs = Date.now() - start;

    if (!res.ok) {
      const isAuth = res.status === 401 || res.status === 403;
      return {
        status: "error",
        responseMs,
        message: isAuth ? "Authentication failed" : `HTTP ${res.status}`,
      };
    }

    const isTestMode = key.startsWith("sk_test");
    if (responseMs > 2000) {
      return { status: "degraded", responseMs, message: `Slow (${isTestMode ? "test" : "live"} mode)` };
    }
    return { status: "ok", responseMs, message: `${isTestMode ? "Test" : "Live"} mode` };
  } catch (err) {
    return {
      status: "error",
      responseMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

async function checkSendGrid(): Promise<DependencyCheck> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    return { status: "error", responseMs: 0, message: "SENDGRID_API_KEY not configured" };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.sendgrid.com/v3/scopes", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const responseMs = Date.now() - start;

    if (!res.ok) {
      return { status: "error", responseMs, message: `HTTP ${res.status}` };
    }

    if (responseMs > 2000) {
      return { status: "degraded", responseMs, message: "Slow response" };
    }
    return { status: "ok", responseMs };
  } catch (err) {
    return {
      status: "error",
      responseMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

async function checkTwilio(): Promise<DependencyCheck> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return { status: "error", responseMs: 0, message: "TWILIO credentials not configured" };
  }

  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    const responseMs = Date.now() - start;

    if (!res.ok) {
      return { status: "error", responseMs, message: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as { balance?: string };
    const balance = parseFloat(body.balance ?? "1");
    if (balance <= 5) {
      return { status: "degraded", responseMs, message: `Low balance: $${body.balance}` };
    }

    if (responseMs > 2000) {
      return { status: "degraded", responseMs, message: "Slow response" };
    }
    return { status: "ok", responseMs, message: `Balance: $${body.balance}` };
  } catch (err) {
    return {
      status: "error",
      responseMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

function checkMemory(): DependencyCheck {
  const mem = process.memoryUsage();
  const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);
  const rssMB = Math.round(mem.rss / 1024 / 1024);

  if (heapPercent > 95) {
    return { status: "error", responseMs: 0, message: `Heap: ${heapPercent}%, RSS: ${rssMB}MB — critical` };
  }
  if (heapPercent > 85) {
    return { status: "degraded", responseMs: 0, message: `Heap: ${heapPercent}%, RSS: ${rssMB}MB — high` };
  }
  return { status: "ok", responseMs: 0, message: `Heap: ${heapPercent}%, RSS: ${rssMB}MB` };
}

// ---------------------------------------------------------------------------
// GET — Deep health check
//
// Probes ALL critical dependencies with actual API calls (not just config
// presence). Sends Telegram alerts when services are down.
//
// Rate limited to 60 requests per minute.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rl = await rateLimit(`health-deep:${ip}`, 60, 1);

  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: "Too many requests", retryAfter: rl.resetAt },
      { status: 429 },
    );
    return setRateLimitHeaders(res, rl);
  }

  // Run all checks in parallel
  const [database, redis, stripe, sendgrid, twilio] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStripe(),
    checkSendGrid(),
    checkTwilio(),
  ]);
  const memory = checkMemory();

  const checks = { database, redis, stripe, sendgrid, twilio, memory };

  // Determine overall status — database and stripe are critical
  const criticalChecks = [database, stripe];
  const allChecks = Object.values(checks);

  let overall: "ok" | "degraded" | "error" = "ok";

  if (criticalChecks.some((c) => c.status === "error")) {
    overall = "error";
  } else if (allChecks.some((c) => c.status === "error")) {
    overall = "degraded";
  } else if (allChecks.some((c) => c.status === "degraded")) {
    overall = "degraded";
  }

  const totalResponseMs = allChecks.reduce(
    (max, c) => Math.max(max, c.responseMs),
    0,
  );

  // Send Telegram alert for error-state services
  const errorServices = allChecks.filter((c) => c.status === "error");
  if (errorServices.length > 0) {
    const errorNames = Object.entries(checks)
      .filter(([, c]) => c.status === "error")
      .map(([name, c]) => `- ${name}: ${c.message ?? "unknown"}`);

    sendTelegramAlert(
      "critical",
      "Deep Health Check Alert",
      `${errorNames.length} service(s) in error state:\n${errorNames.join("\n")}`,
    ).catch((err) => {
      logger.errorWithCause("[health/deep] Telegram alert failed", err);
    });
  }

  if (overall !== "ok") {
    logger.warn("[health/deep] Non-ok deep health check", {
      overall,
      database: database.status,
      redis: redis.status,
      stripe: stripe.status,
      sendgrid: sendgrid.status,
      twilio: twilio.status,
      memory: memory.status,
    });
  }

  const status = overall === "error" ? 503 : 200;

  const res = NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      totalResponseMs,
      checks,
    },
    { status },
  );

  res.headers.set("Cache-Control", "no-store");
  return setRateLimitHeaders(res, rl);
}
