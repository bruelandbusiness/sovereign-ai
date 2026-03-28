/**
 * Sovereign AI — Deploy Checklist
 *
 * Validates production readiness by running a series of checks
 * against environment variables, database connectivity, and
 * third-party service credentials.
 *
 * Usage:
 *   npx tsx scripts/deploy-checklist.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local first (Next.js convention), then fall back to .env
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

import { execSync } from "child_process";
import { Pool } from "pg";
import Stripe from "stripe";

// ---------------------------------------------------------------------------
// ANSI color helpers
// ---------------------------------------------------------------------------

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const PASS = `${GREEN}\u2713${RESET}`;
const FAIL = `${RED}\u2717${RESET}`;
const SKIP = `${YELLOW}\u25CB${RESET}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = "pass" | "fail" | "skip";

interface CheckResult {
  name: string;
  status: CheckStatus;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Box-drawing constants
// ---------------------------------------------------------------------------

const BOX_WIDTH = 46;

function pad(text: string, width: number): string {
  // Strip ANSI codes to compute visible length
  const visible = text.replace(/\x1b\[[0-9;]*m/g, "");
  const padding = width - visible.length;
  if (padding <= 0) return text;
  return text + " ".repeat(padding);
}

function boxTop(): string {
  return `\u2554${"═".repeat(BOX_WIDTH)}\u2557`;
}

function boxMid(): string {
  return `\u2560${"═".repeat(BOX_WIDTH)}\u2563`;
}

function boxBot(): string {
  return `\u255A${"═".repeat(BOX_WIDTH)}\u255D`;
}

function boxRow(content: string): string {
  return `\u2551  ${pad(content, BOX_WIDTH - 3)}\u2551`;
}

function boxTitle(title: string): string {
  const visible = title.replace(/\x1b\[[0-9;]*m/g, "");
  const totalPad = BOX_WIDTH - visible.length;
  const left = Math.floor(totalPad / 2);
  const right = totalPad - left;
  return `\u2551${" ".repeat(left)}${title}${" ".repeat(right)}\u2551`;
}

// ---------------------------------------------------------------------------
// Check implementations
// ---------------------------------------------------------------------------

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SENDGRID_API_KEY",
  "CRON_SECRET",
];

async function checkRequiredEnvVars(): Promise<CheckResult> {
  const missing: string[] = [];
  for (const key of REQUIRED_ENV_VARS) {
    const val = process.env[key];
    if (!val || val.trim() === "") {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    return {
      name: "Required env vars",
      status: "fail",
      detail: `Missing: ${missing.join(", ")}`,
    };
  }
  return { name: "Required env vars", status: "pass" };
}

async function checkAuthSecret(): Promise<CheckResult> {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 32) {
    return {
      name: "AUTH_SECRET valid",
      status: "fail",
      detail: `Must be >= 32 chars (got ${secret.length})`,
    };
  }
  const forbidden = ["placeholder", "change-me", "your-secret"];
  const lower = secret.toLowerCase();
  for (const word of forbidden) {
    if (lower.includes(word)) {
      return {
        name: "AUTH_SECRET valid",
        status: "fail",
        detail: `Contains forbidden word "${word}"`,
      };
    }
  }
  return { name: "AUTH_SECRET valid", status: "pass" };
}

async function checkDatabaseUrlFormat(): Promise<CheckResult> {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    return { name: "DATABASE_URL format", status: "pass" };
  }
  return {
    name: "DATABASE_URL format",
    status: "fail",
    detail: "Must start with postgresql:// or postgres://",
  };
}

async function checkDatabaseConnectivity(): Promise<CheckResult> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return {
      name: "Database connectivity",
      status: "skip",
      detail: "DATABASE_URL not set",
    };
  }

  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
    max: 1,
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      return { name: "Database connectivity", status: "pass" };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: "Database connectivity",
      status: "fail",
      detail: message,
    };
  } finally {
    await pool.end();
  }
}

async function checkStripeKey(): Promise<CheckResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return {
      name: "Stripe API key",
      status: "skip",
      detail: "STRIPE_SECRET_KEY not set",
    };
  }

  try {
    const stripe = new Stripe(key);
    await stripe.products.list({ limit: 1 });
    return { name: "Stripe API key", status: "pass" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: "Stripe API key",
      status: "fail",
      detail: message,
    };
  }
}

async function checkSendGridKey(): Promise<CheckResult> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    return {
      name: "SendGrid API key",
      status: "skip",
      detail: "SENDGRID_API_KEY not set",
    };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    if (res.status === 200) {
      return { name: "SendGrid API key", status: "pass" };
    }
    return {
      name: "SendGrid API key",
      status: "fail",
      detail: `HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: "SendGrid API key",
      status: "fail",
      detail: message,
    };
  }
}

async function checkPrismaMigrations(): Promise<CheckResult> {
  try {
    const output = execSync("npx prisma migrate deploy", {
      cwd: resolve(__dirname, ".."),
      encoding: "utf-8",
      timeout: 30_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const trimmed = output.trim();
    return {
      name: "Prisma migrations",
      status: "pass",
      detail: trimmed ? trimmed.split("\n").pop() : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Extract only the last meaningful line from potentially verbose output
    const lines = message.split("\n").filter((l) => l.trim());
    const detail = lines.pop() ?? message;
    return {
      name: "Prisma migrations",
      status: "fail",
      detail,
    };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const checks = [
    checkRequiredEnvVars,
    checkAuthSecret,
    checkDatabaseUrlFormat,
    checkDatabaseConnectivity,
    checkStripeKey,
    checkSendGridKey,
    checkPrismaMigrations,
  ];

  const results: CheckResult[] = [];

  for (const check of checks) {
    const result = await check();
    results.push(result);
  }

  // Print results
  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const totalCount = results.length;

  console.log();
  console.log(boxTop());
  console.log(
    boxTitle(`${BOLD}Sovereign AI \u2014 Deploy Checklist${RESET}`)
  );
  console.log(boxMid());

  for (const result of results) {
    const icon =
      result.status === "pass"
        ? PASS
        : result.status === "fail"
          ? FAIL
          : SKIP;
    console.log(boxRow(`${icon}  ${result.name}`));
    if (result.detail && result.status !== "pass") {
      // Print detail on next line, indented
      const detailTruncated =
        result.detail.length > 38
          ? result.detail.slice(0, 35) + "..."
          : result.detail;
      console.log(boxRow(`     ${YELLOW}${detailTruncated}${RESET}`));
    }
  }

  console.log(boxMid());

  if (failCount === 0) {
    console.log(
      boxRow(
        `${GREEN}${passCount}/${totalCount} checks passed \u2014 Ready to deploy!${RESET}`
      )
    );
  } else {
    console.log(
      boxRow(
        `${RED}${failCount}/${totalCount} checks failed \u2014 Not ready${RESET}`
      )
    );
  }

  console.log(boxBot());
  console.log();

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}Unexpected error:${RESET}`, err);
  process.exit(1);
});
