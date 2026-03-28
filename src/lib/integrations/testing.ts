/**
 * Integration Testing Utilities
 *
 * Provides a structured test harness for validating every integration
 * against the standard checklist from INTEGRATIONS.md.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of a single integration check. */
export interface IntegrationCheck {
  name: string;
  passed: boolean;
  message: string;
  durationMs?: number;
}

/** Aggregated result of all checks for one integration. */
export interface IntegrationTestResult {
  integration: string;
  checks: IntegrationCheck[];
  overallPass: boolean;
}

/** Describes a named suite of check names. */
export interface IntegrationTestSuite {
  name: string;
  checks: string[];
}

// ---------------------------------------------------------------------------
// Standard Checklist
// ---------------------------------------------------------------------------

/**
 * The canonical integration-readiness checklist from INTEGRATIONS.md.
 * Every integration must pass all of these before going live.
 */
export const INTEGRATION_TEST_CHECKLIST: string[] = [
  "Auth works (correct credentials, token refresh if OAuth)",
  "Rate limits respected (tested at sustained load)",
  "Error handling covers: 400, 401, 403, 404, 429, 500, 503, timeout",
  "Retry logic works with exponential backoff",
  "Webhook signature validation works (rejects invalid signatures)",
  "Data mapping is correct (fields map between schemas)",
  "Logging captures: request, response status, duration, errors",
  "Budget caps prevent runaway API costs",
  "Dry-run mode works (logs what would happen without executing)",
  "Fallback behavior defined (what happens if integration is down)",
];

// ---------------------------------------------------------------------------
// Individual Test Runners
// ---------------------------------------------------------------------------

/**
 * Test that authentication works for the given integration.
 *
 * @param integration - Name of the integration under test.
 * @param testFn - Async function that returns `true` if auth succeeds.
 */
export async function testIntegrationAuth(
  integration: string,
  testFn: () => Promise<boolean>,
): Promise<IntegrationCheck> {
  const start = Date.now();
  try {
    const passed = await testFn();
    return {
      name: `${integration}: Auth`,
      passed,
      message: passed
        ? "Authentication succeeded"
        : "Authentication failed — check credentials",
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name: `${integration}: Auth`,
      passed: false,
      message: `Auth threw an error: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Test that rate limits are respected under sustained load.
 *
 * Fires requests at `ratePerSecond` for `testDurationSeconds` and
 * verifies no 429 errors are returned.
 *
 * @param integration - Name of the integration under test.
 * @param requestFn - Async function that performs one request.
 * @param ratePerSecond - Target requests per second.
 * @param testDurationSeconds - How long to sustain the load (default 5 s).
 */
export async function testRateLimit(
  integration: string,
  requestFn: () => Promise<unknown>,
  ratePerSecond: number,
  testDurationSeconds = 5,
): Promise<IntegrationCheck> {
  const start = Date.now();
  const intervalMs = 1000 / ratePerSecond;
  const totalRequests = ratePerSecond * testDurationSeconds;
  let rateLimited = false;

  for (let i = 0; i < totalRequests; i++) {
    const requestStart = Date.now();
    try {
      await requestFn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        rateLimited = true;
        break;
      }
    }
    const elapsed = Date.now() - requestStart;
    const waitMs = Math.max(0, intervalMs - elapsed);
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  return {
    name: `${integration}: Rate Limits`,
    passed: !rateLimited,
    message: rateLimited
      ? `Rate-limited at ${ratePerSecond} req/s — throttle or reduce concurrency`
      : `Sustained ${ratePerSecond} req/s for ${testDurationSeconds}s without 429`,
    durationMs: Date.now() - start,
  };
}

/**
 * Test error handling across common HTTP status codes.
 *
 * Calls `requestFn` with each status code and expects it not to throw
 * an unhandled exception (i.e. it should handle errors gracefully).
 *
 * @param integration - Name of the integration under test.
 * @param requestFn - Async function that simulates a request returning the given status code.
 */
export async function testErrorHandling(
  integration: string,
  requestFn: (statusCode: number) => Promise<unknown>,
): Promise<IntegrationCheck> {
  const start = Date.now();
  const statusCodes = [400, 401, 403, 404, 429, 500, 503];
  const failures: number[] = [];

  for (const code of statusCodes) {
    try {
      await requestFn(code);
    } catch {
      failures.push(code);
    }
  }

  const passed = failures.length === 0;
  return {
    name: `${integration}: Error Handling`,
    passed,
    message: passed
      ? "All error status codes handled gracefully"
      : `Unhandled errors for status codes: ${failures.join(", ")}`,
    durationMs: Date.now() - start,
  };
}

/**
 * Test webhook signature verification (synchronous).
 *
 * Verifies that:
 * 1. A valid signature is accepted.
 * 2. An invalid signature is rejected.
 *
 * @param verifyFn - Function that returns `true` when signature is valid.
 * @param secret - Shared secret used to produce the test signature.
 */
export function testWebhookSignature(
  verifyFn: (payload: string, sig: string) => boolean,
  secret: string,
): IntegrationCheck {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic import to avoid top-level side effect
  const { createHmac } = require("crypto") as typeof import("crypto");
  const payload = '{"test":true}';
  const validSig = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const acceptsValid = verifyFn(payload, validSig);
  const rejectsInvalid = !verifyFn(payload, "invalid_signature_000");

  const passed = acceptsValid && rejectsInvalid;
  return {
    name: "Webhook Signature Validation",
    passed,
    message: passed
      ? "Accepts valid signatures and rejects invalid ones"
      : `Verification issue — acceptsValid=${acceptsValid}, rejectsInvalid=${rejectsInvalid}`,
  };
}

// ---------------------------------------------------------------------------
// Test Runner
// ---------------------------------------------------------------------------

/**
 * Run a full set of tests for one integration and aggregate results.
 *
 * @param integration - Name of the integration under test.
 * @param tests - Array of async test functions, each returning an {@link IntegrationCheck}.
 */
export async function runIntegrationTests(
  integration: string,
  tests: Array<() => Promise<IntegrationCheck>>,
): Promise<IntegrationTestResult> {
  const checks: IntegrationCheck[] = [];

  for (const testFn of tests) {
    const result = await testFn();
    checks.push(result);
  }

  return {
    integration,
    checks,
    overallPass: checks.every((c) => c.passed),
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format an {@link IntegrationTestResult} as a Telegram-friendly message.
 *
 * Uses checkmark / cross-mark emoji per check and a summary line.
 */
export function formatTestResultForTelegram(
  result: IntegrationTestResult,
): string {
  const header = result.overallPass
    ? `\u2705 *${result.integration}* — ALL PASSED`
    : `\u274C *${result.integration}* — FAILURES`;

  const lines = result.checks.map((c) => {
    const icon = c.passed ? "\u2705" : "\u274C";
    const duration = c.durationMs !== undefined ? ` (${c.durationMs}ms)` : "";
    return `${icon} ${c.name}${duration}\n   ${c.message}`;
  });

  const summary = `${result.checks.filter((c) => c.passed).length}/${result.checks.length} checks passed`;

  return [header, "", ...lines, "", summary].join("\n");
}

// ---------------------------------------------------------------------------
// Integration Phases
// ---------------------------------------------------------------------------

/** A rollout phase with its integrations. */
export interface IntegrationPhase {
  phase: number;
  integrations: string[];
  description: string;
}

/**
 * Return the four integration rollout phases from INTEGRATIONS.md.
 */
export function getIntegrationPriority(): IntegrationPhase[] {
  return [
    {
      phase: 1,
      integrations: ["Claude", "Supabase", "Stripe", "Telegram", "Twilio", "SMTP"],
      description: "Launch — core platform services",
    },
    {
      phase: 2,
      integrations: ["VAPI/Bland", "Google Calendar", "Google Maps"],
      description: "Month 1-2 — voice AI and scheduling",
    },
    {
      phase: 3,
      integrations: ["ServiceTitan", "Housecall Pro", "Jobber", "GBP"],
      description: "Month 3-6 — field-service CRM integrations",
    },
    {
      phase: 4,
      integrations: ["Facebook Ads", "Google Ads", "Zapier/Webhook relay"],
      description: "Month 6+ — paid ads and automation relay",
    },
  ];
}
