import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { captureMessage } from "@/lib/monitoring/error-logger";
import { sendTelegramAlert } from "@/lib/telegram";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Service check helpers
// ---------------------------------------------------------------------------

interface CheckResult {
  service: string;
  status: "ok" | "down";
  latencyMs: number;
  error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { service: "database", status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      service: "database",
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkSendGrid(): Promise<CheckResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return {
      service: "sendgrid",
      status: "down",
      latencyMs: 0,
      error: "SENDGRID_API_KEY not configured",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.sendgrid.com/v3/scopes", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    return {
      service: "sendgrid",
      status: res.ok ? "ok" : "down",
      latencyMs: Date.now() - start,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      service: "sendgrid",
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkStripe(): Promise<CheckResult> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return {
      service: "stripe",
      status: "down",
      latencyMs: 0,
      error: "STRIPE_SECRET_KEY not configured",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    return {
      service: "stripe",
      status: res.ok ? "ok" : "down",
      latencyMs: Date.now() - start,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      service: "stripe",
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// GET /api/cron/health-check
// ---------------------------------------------------------------------------

export const GET = withCronErrorHandler("cron/health-check", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const results = await Promise.all([
    checkDatabase(),
    checkSendGrid(),
    checkStripe(),
  ]);

  const failures = results.filter((r) => r.status === "down");

  // Log any failures as warnings
  for (const failure of failures) {
    await captureMessage(
      `Health check failed: ${failure.service} - ${failure.error}`,
      "warn",
      { source: "cron/health-check", extra: { latencyMs: failure.latencyMs } },
    );
  }

  // Send Telegram alert and create in-app notifications if any service is down
  if (failures.length > 0) {
    const lines = failures.map(
      (f) => `- ${f.service}: ${f.error ?? "unknown error"} (${f.latencyMs}ms)`,
    );
    const body = `${failures.length} service(s) unreachable:\n${lines.join("\n")}`;

    sendTelegramAlert("warning", "Health Check Alert", body).catch((err) => {
      logger.errorWithCause(
        "[cron/health-check] Telegram alert failed",
        err,
      );
    });

    // Create in-app notifications for all admin accounts
    try {
      const adminAccounts = await prisma.account.findMany({
        where: { role: "admin" },
        select: { id: true },
      });

      const failureMsg = failures.map(
        (f) => `${f.service}: ${f.error ?? "unknown error"}`,
      ).join("; ");

      for (const admin of adminAccounts) {
        createNotification({
          accountId: admin.id,
          type: "system",
          title: "Service Health Alert",
          message: `${failures.length} service(s) down: ${failureMsg}`,
          actionUrl: "/dashboard/settings",
          urgent: true,
        }).catch((err) => {
          logger.errorWithCause(
            "[cron/health-check] Failed to create admin notification",
            err,
          );
        });
      }
    } catch (err) {
      logger.errorWithCause(
        "[cron/health-check] Failed to notify admins",
        err,
      );
    }
  }

  const overallStatus = failures.length > 0 ? "degraded" : "healthy";

  return NextResponse.json({
    success: true,
    status: overallStatus,
    checks: results,
    timestamp: new Date().toISOString(),
  });
});
