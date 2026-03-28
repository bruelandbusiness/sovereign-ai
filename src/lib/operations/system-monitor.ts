import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SystemCheckResult {
  service: string;
  status: "healthy" | "degraded" | "critical";
  latencyMs: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Health check thresholds
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  database: { healthyMs: 200, degradedMs: 1000 },
  claude_api: { healthyMs: 2000, degradedMs: 10000 },
  email_smtp: { healthyMs: 500, degradedMs: 2000 },
  twilio_api: { healthyMs: 1000, degradedMs: 3000 },
  stripe_api: { healthyMs: 1000, degradedMs: 3000 },
} as const;

// ---------------------------------------------------------------------------
// Consecutive status tracking (module-level state)
// ---------------------------------------------------------------------------

const consecutiveDegraded = new Map<string, number>();
const consecutiveCritical = new Map<string, number>();
const previousStatus = new Map<string, "healthy" | "degraded" | "critical">();

const DEGRADED_ALERT_THRESHOLD = 3; // alert after N consecutive degraded checks

// ---------------------------------------------------------------------------
// Alert logic
// ---------------------------------------------------------------------------

async function handleAlerts(result: SystemCheckResult): Promise<void> {
  const { service, status } = result;
  const prev = previousStatus.get(service);

  if (status === "healthy") {
    // Recovery alert: was degraded or critical, now healthy
    if (prev === "degraded" || prev === "critical") {
      logger.info(
        `[system-monitor] ${service} recovered to healthy (latency: ${result.latencyMs}ms)`
      );
      await sendTelegramAlert(
        "info",
        `System recovered: ${service}`,
        `${service} is back to healthy status (latency: ${result.latencyMs}ms).`
      );
    } else {
      logger.info(
        `[system-monitor] ${service} healthy (latency: ${result.latencyMs}ms)`
      );
    }
    consecutiveDegraded.set(service, 0);
    consecutiveCritical.set(service, 0);
  } else if (status === "degraded") {
    const count = (consecutiveDegraded.get(service) ?? 0) + 1;
    consecutiveDegraded.set(service, count);
    consecutiveCritical.set(service, 0);

    logger.warn(
      `[system-monitor] ${service} degraded (latency: ${result.latencyMs}ms, consecutive: ${count})`
    );

    if (count >= DEGRADED_ALERT_THRESHOLD) {
      await sendTelegramAlert(
        "warning",
        `System degraded: ${service}`,
        `${service} has been degraded for ${count} consecutive checks (latency: ${result.latencyMs}ms).${result.error ? ` Error: ${result.error}` : ""}`
      );
    }
  } else if (status === "critical") {
    const count = (consecutiveCritical.get(service) ?? 0) + 1;
    consecutiveCritical.set(service, count);
    consecutiveDegraded.set(service, 0);

    logger.error(
      `[system-monitor] ${service} CRITICAL: ${result.error ?? "unknown error"} (latency: ${result.latencyMs}ms)`
    );

    await sendTelegramAlert(
      "critical",
      `System critical: ${service}`,
      `${service} is in critical state.${result.error ? ` Error: ${result.error}` : ""} (latency: ${result.latencyMs}ms)`
    );
  }

  previousStatus.set(service, status);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyLatency(
  service: keyof typeof THRESHOLDS,
  latencyMs: number
): "healthy" | "degraded" {
  const t = THRESHOLDS[service];
  if (latencyMs <= t.healthyMs) return "healthy";
  if (latencyMs <= t.degradedMs) return "degraded";
  return "degraded"; // over degraded threshold but no error = still degraded
}

// ---------------------------------------------------------------------------
// Individual health checks
// ---------------------------------------------------------------------------

export async function checkDatabase(): Promise<SystemCheckResult> {
  const service = "database";
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      service,
      status: classifyLatency("database", latencyMs),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      service,
      status: "critical",
      latencyMs,
      error: `connection_failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function checkClaudeApi(): Promise<SystemCheckResult> {
  const service = "claude_api";

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      service,
      status: "healthy",
      latencyMs: 0,
      error: "ANTHROPIC_API_KEY not set — skipped",
    };
  }

  const start = Date.now();
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
    const latencyMs = Date.now() - start;
    return {
      service,
      status: classifyLatency("claude_api", latencyMs),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const isAuth = message.toLowerCase().includes("auth") || message.includes("401");
    const consecutiveErrors = (consecutiveCritical.get(service) ?? 0) + 1;

    if (isAuth || consecutiveErrors >= 3) {
      return {
        service,
        status: "critical",
        latencyMs,
        error: isAuth
          ? `auth_failed: ${message}`
          : `3_consecutive_errors: ${message}`,
      };
    }

    return {
      service,
      status: "degraded",
      latencyMs,
      error: message,
    };
  }
}

export async function checkEmailService(): Promise<SystemCheckResult> {
  const service = "email_smtp";

  if (!process.env.SENDGRID_API_KEY) {
    return {
      service,
      status: "healthy",
      latencyMs: 0,
      error: "SENDGRID_API_KEY not set — skipped",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.sendgrid.com/v3/scopes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        service,
        status: res.status === 401 || res.status === 403 ? "critical" : "degraded",
        latencyMs,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      service,
      status: classifyLatency("email_smtp", latencyMs),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const isConnectionRefused =
      message.includes("ECONNREFUSED") || message.includes("fetch failed");
    return {
      service,
      status: isConnectionRefused ? "critical" : "degraded",
      latencyMs,
      error: isConnectionRefused
        ? `connection_refused: ${message}`
        : message,
    };
  }
}

export async function checkTwilioApi(): Promise<SystemCheckResult> {
  const service = "twilio_api";
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return {
      service,
      status: "healthy",
      latencyMs: 0,
      error: "TWILIO credentials not set — skipped",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`,
      {
        method: "GET",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const isAuth = res.status === 401 || res.status === 403;
      return {
        service,
        status: isAuth ? "critical" : "degraded",
        latencyMs,
        error: isAuth
          ? `auth_failed: HTTP ${res.status}`
          : `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const body = (await res.json()) as { balance?: string };
    const balance = parseFloat(body.balance ?? "1");
    if (balance <= 0) {
      return {
        service,
        status: "critical",
        latencyMs,
        error: `balance_zero: current balance is ${body.balance}`,
      };
    }

    return {
      service,
      status: classifyLatency("twilio_api", latencyMs),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      service,
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function checkStripeApi(): Promise<SystemCheckResult> {
  const service = "stripe_api";

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      service,
      status: "healthy",
      latencyMs: 0,
      error: "STRIPE_SECRET_KEY not set — skipped",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/events?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const isAuth = res.status === 401 || res.status === 403;
      return {
        service,
        status: isAuth ? "critical" : "degraded",
        latencyMs,
        error: isAuth
          ? `auth_failed: HTTP ${res.status}`
          : `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      service,
      status: classifyLatency("stripe_api", latencyMs),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      service,
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Run all checks
// ---------------------------------------------------------------------------

export async function runAllHealthChecks(): Promise<SystemCheckResult[]> {
  logger.info("[system-monitor] Starting health checks");

  const results = await Promise.allSettled([
    checkDatabase(),
    checkClaudeApi(),
    checkEmailService(),
    checkTwilioApi(),
    checkStripeApi(),
  ]);

  const checks: SystemCheckResult[] = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const services = [
      "database",
      "claude_api",
      "email_smtp",
      "twilio_api",
      "stripe_api",
    ];
    return {
      service: services[i],
      status: "critical" as const,
      latencyMs: 0,
      error: `check_threw: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
    };
  });

  // Process alerts for each check
  for (const check of checks) {
    try {
      await handleAlerts(check);
    } catch (err) {
      logger.error(
        `[system-monitor] Failed to process alert for ${check.service}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const summary = checks.map((c) => `${c.service}=${c.status}`).join(", ");
  logger.info(`[system-monitor] Health check complete: ${summary}`);

  return checks;
}
