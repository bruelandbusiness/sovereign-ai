/**
 * Shared utilities for external integration modules.
 *
 * Provides:
 * - Retry with exponential back-off (handles 429 / 5xx / timeouts)
 * - OAuth token refresh helper
 * - API error classification
 * - Response-body sanitisation (strips tokens/secrets before logging)
 * - Input sanitisation helpers
 */

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { logger } from "@/lib/logger";

// ─── Error Classification ───────────────────────────────────

export type ApiErrorKind =
  | "rate_limit"      // 429
  | "auth_expired"    // 401
  | "forbidden"       // 403
  | "not_found"       // 404
  | "server_error"    // 500-599
  | "timeout"         // AbortError / timeout
  | "network"         // fetch failed (DNS, connection refused, etc.)
  | "client_error"    // other 4xx
  | "unknown";

export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
    public readonly integration?: string,
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

function classifyHttpStatus(status: number): ApiErrorKind {
  if (status === 401) return "auth_expired";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server_error";
  if (status >= 400) return "client_error";
  return "unknown";
}

function classifyError(err: unknown): ApiErrorKind {
  if (err instanceof IntegrationError) return err.kind;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("timed out") || msg.includes("aborted")) return "timeout";
    if (msg.includes("fetch failed") || msg.includes("econnrefused") || msg.includes("enotfound")) return "network";
  }
  return "unknown";
}

function isRetryable(kind: ApiErrorKind): boolean {
  return kind === "rate_limit" || kind === "server_error" || kind === "timeout" || kind === "network";
}

// ─── Secret Sanitisation ────────────────────────────────────

const SECRET_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /Basic\s+[A-Za-z0-9+/]+=*/gi,
  /key=[A-Za-z0-9\-._~]+/gi,
  /token=[A-Za-z0-9\-._~]+/gi,
  /access_token=[A-Za-z0-9\-._~]+/gi,
  /api[_-]?key[=:]\s*["']?[A-Za-z0-9\-._~]+["']?/gi,
];

/**
 * Remove bearer tokens, API keys, and other secrets from a string
 * before it is written to logs.
 */
export function sanitizeForLogging(text: string): string {
  let sanitized = text;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized;
}

// ─── Input Sanitisation ─────────────────────────────────────

/**
 * Ensures a value used inside a GAQL or similar query is a safe numeric ID.
 * Throws if the value contains anything other than digits.
 */
export function sanitizeNumericId(value: string, label = "id"): string {
  const cleaned = value.trim();
  if (!/^\d+$/.test(cleaned)) {
    throw new IntegrationError(
      `Invalid ${label}: expected numeric value, got "${cleaned.slice(0, 20)}"`,
      "client_error",
    );
  }
  return cleaned;
}

/**
 * Validates and returns a string that is safe for use as a URL path segment.
 * Allows alphanumeric, hyphens, underscores, dots, and slashes.
 */
export function sanitizePathSegment(value: string, label = "path"): string {
  const cleaned = value.trim();
  if (!/^[A-Za-z0-9\-_.\/]+$/.test(cleaned)) {
    throw new IntegrationError(
      `Invalid ${label}: contains unsafe characters`,
      "client_error",
    );
  }
  return cleaned;
}

// ─── Retry with Back-off ────────────────────────────────────

export interface RetryOptions {
  /** Max number of attempts (including the first). Default 3. */
  maxAttempts?: number;
  /** Initial delay in ms before the first retry. Default 1000. */
  baseDelayMs?: number;
  /** Maximum delay cap in ms. Default 10000. */
  maxDelayMs?: number;
  /** Integration name for log context. */
  integration?: string;
}

/**
 * Wraps `fetchWithTimeout` with automatic retries for transient failures
 * (429, 5xx, timeouts, network errors).
 *
 * Non-retryable errors (401, 403, 404, other 4xx) are thrown immediately.
 *
 * On 429 responses the `Retry-After` header is respected when present.
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  timeoutMs?: number,
  opts?: RetryOptions,
): Promise<Response> {
  const maxAttempts = opts?.maxAttempts ?? 3;
  const baseDelay = opts?.baseDelayMs ?? 1_000;
  const maxDelay = opts?.maxDelayMs ?? 10_000;
  const tag = opts?.integration ?? "integration";

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);

      if (response.ok) return response;

      // Non-retryable HTTP errors -- throw immediately
      const kind = classifyHttpStatus(response.status);
      if (!isRetryable(kind)) {
        const body = await response.text().catch(() => "");
        throw new IntegrationError(
          `${tag} API error ${response.status}: ${sanitizeForLogging(body).slice(0, 500)}`,
          kind,
          response.status,
          tag,
        );
      }

      // Retryable HTTP error -- will retry after delay
      if (attempt < maxAttempts) {
        const retryAfter = response.headers.get("Retry-After");
        let delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed)) delay = parsed * 1000;
        }
        logger.warn(`[${tag}] Retryable HTTP ${response.status}, attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // Final attempt failed
      const body = await response.text().catch(() => "");
      throw new IntegrationError(
        `${tag} API error ${response.status} after ${maxAttempts} attempts: ${sanitizeForLogging(body).slice(0, 500)}`,
        kind,
        response.status,
        tag,
      );
    } catch (err) {
      if (err instanceof IntegrationError && !isRetryable(err.kind)) {
        throw err;
      }

      lastError = err;
      const kind = classifyError(err);

      if (isRetryable(kind) && attempt < maxAttempts) {
        const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
        logger.warn(`[${tag}] ${kind} error on attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (err instanceof IntegrationError) throw err;
      throw new IntegrationError(
        `${tag} request failed after ${maxAttempts} attempts: ${err instanceof Error ? err.message : "unknown error"}`,
        kind,
        undefined,
        tag,
      );
    }
  }

  // Should not be reachable, but just in case:
  throw lastError;
}

// ─── OAuth Token Refresh ────────────────────────────────────

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // epoch ms
}

export interface TokenRefreshConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  /** Extra form fields (e.g. grant_type override). */
  extraParams?: Record<string, string>;
}

/**
 * Attempts to refresh an OAuth access token.
 * Returns the new access token string, or throws on failure.
 *
 * Callers should persist the new token (and new refresh token if returned)
 * to their database / credential store.
 */
export async function refreshOAuthToken(
  config: TokenRefreshConfig,
  integration = "oauth",
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    ...config.extraParams,
  });

  const response = await fetchWithRetry(
    config.tokenUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
    15_000,
    { maxAttempts: 2, integration },
  );

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!data.access_token) {
    throw new IntegrationError(
      `${integration} token refresh failed: ${data.error ?? "no access_token in response"}`,
      "auth_expired",
      undefined,
      integration,
    );
  }

  logger.info(`[${integration}] OAuth token refreshed successfully`);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// ─── Helpers ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
