import { prisma } from "@/lib/db";
import { createHash, timingSafeEqual } from "crypto";

export interface MCPContext {
  apiKeyId: string;
  accountId: string;
  clientId: string | null;
  scopes: string[];
}

/**
 * Returned when authentication fails. The `reason` field allows
 * the API route to return the correct HTTP status code.
 */
export interface MCPAuthFailure {
  reason: "invalid_key" | "revoked" | "expired" | "rate_limited";
  retryAfterMs?: number;
}

export type MCPAuthResult =
  | { ok: true; ctx: MCPContext }
  | { ok: false; failure: MCPAuthFailure };

// Simple in-memory rate limiter (resets each minute)
// NOTE: This is per-process. In multi-instance deployments (serverless, k8s)
// each instance tracks independently. For stricter enforcement, replace with
// a Redis-backed counter.
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Constant-time comparison of two hex-encoded hashes. */
function hashEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/**
 * Valid scopes that can be assigned to API keys.
 */
export const VALID_SCOPES = [
  "client.read",
  "client.write",
  "intelligence.read",
  "agency.read",
  "agency.write",
  "*",
] as const;

export type MCPScope = (typeof VALID_SCOPES)[number];

/**
 * Authenticate an MCP API request.
 * Expects Authorization: Bearer mcp_xxxxx
 *
 * Returns a discriminated union so the caller can distinguish between
 * invalid credentials (401), revoked/expired keys (403), and rate
 * limiting (429).
 */
export async function authenticateMCP(
  request: Request,
): Promise<MCPAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer mcp_")) {
    return { ok: false, failure: { reason: "invalid_key" } };
  }

  const rawKey = authHeader.slice(7); // Remove "Bearer "

  // Reject keys that are clearly malformed (must be "mcp_" + 64 hex chars)
  if (!/^mcp_[0-9a-f]{64}$/.test(rawKey)) {
    return { ok: false, failure: { reason: "invalid_key" } };
  }

  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.mCPApiKey.findUnique({
    where: { keyHash },
    include: {
      account: {
        include: { client: { select: { id: true } } },
      },
    },
  });

  // Use constant-time comparison to prevent timing attacks on the hash lookup.
  // Prisma already does an indexed lookup, but we double-check here.
  if (!apiKey || !hashEquals(apiKey.keyHash, keyHash)) {
    return { ok: false, failure: { reason: "invalid_key" } };
  }

  if (apiKey.revokedAt) {
    return { ok: false, failure: { reason: "revoked" } };
  }

  // Check expiry if the key has an expiresAt field
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return { ok: false, failure: { reason: "expired" } };
  }

  // Rate limiting -- return a distinct failure so the route responds with 429
  const now = Date.now();
  const limit = rateLimits.get(apiKey.id);
  if (limit && limit.resetAt > now) {
    if (limit.count >= RATE_LIMIT) {
      return {
        ok: false,
        failure: { reason: "rate_limited", retryAfterMs: limit.resetAt - now },
      };
    }
    limit.count++;
  } else {
    rateLimits.set(apiKey.id, { count: 1, resetAt: now + 60000 });
  }

  // Update lastUsedAt (fire-and-forget)
  prisma.mCPApiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) =>
      console.error(
        "[mcp] Usage logging failed:",
        err instanceof Error ? err.message : err,
      ),
    );

  return {
    ok: true,
    ctx: {
      apiKeyId: apiKey.id,
      accountId: apiKey.accountId,
      clientId: apiKey.account.client?.id || null,
      scopes: JSON.parse(apiKey.scopes) as string[],
    },
  };
}

/**
 * Check if context has required scope.
 */
export function hasScope(ctx: MCPContext, scope: string): boolean {
  return ctx.scopes.includes(scope) || ctx.scopes.includes("*");
}

/**
 * Sanitise tool output before it hits the usage log.
 *
 * Strips fields that commonly contain PII (email, phone, etc.)
 * so the audit log does not become a secondary data-leak vector.
 */
function sanitiseOutputForLog(
  output: Record<string, unknown>,
): Record<string, unknown> {
  const PII_KEYS = new Set(["email", "phone", "ssn", "password", "secret"]);

  function redact(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(redact);
    if (obj && typeof obj === "object" && obj !== null) {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (PII_KEYS.has(key.toLowerCase())) {
          cleaned[key] = "[REDACTED]";
        } else {
          cleaned[key] = redact(value);
        }
      }
      return cleaned;
    }
    return obj;
  }

  return redact(output) as Record<string, unknown>;
}

/**
 * Log MCP tool usage.
 *
 * Output is sanitised to strip PII before persistence.
 */
export async function logUsage(
  apiKeyId: string,
  tool: string,
  input: Record<string, unknown>,
  output: Record<string, unknown> | null,
  durationMs: number,
): Promise<void> {
  const sanitisedOutput = output ? sanitiseOutputForLog(output) : undefined;

  await prisma.mCPUsageLog.create({
    data: {
      apiKeyId,
      tool,
      input: JSON.stringify(input),
      output: sanitisedOutput
        ? JSON.stringify(sanitisedOutput)
        : undefined,
      durationMs,
    },
  });
}

/**
 * Generate a new API key (returns the raw key -- only shown once).
 */
export function generateApiKey(): { rawKey: string; keyHash: string } {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const rawKey =
    "mcp_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return { rawKey, keyHash: hashKey(rawKey) };
}
