/**
 * General-purpose retry utility with exponential backoff.
 *
 * Use this for any async operation that can fail transiently (database queries,
 * SDK calls, file operations). For HTTP fetch calls, prefer `fetchWithRetry`
 * from `@/lib/integrations/integration-utils` which handles HTTP status codes
 * and Retry-After headers.
 */

import { logger } from "@/lib/logger";

// ─── Types ───────────────────────────────────────────────────

export interface RetryConfig {
  /** Maximum number of attempts (including the first). Default: 3. */
  maxAttempts?: number;
  /** Initial delay in ms before the first retry. Default: 1000. */
  baseDelayMs?: number;
  /** Maximum delay cap in ms. Default: 10000. */
  maxDelayMs?: number;
  /** Jitter factor (0-1) to randomise delay and avoid thundering herd. Default: 0.2. */
  jitter?: number;
  /** Label for log messages. Default: "retry". */
  label?: string;
  /**
   * Predicate that determines if an error is retryable.
   * Return `true` to retry, `false` to throw immediately.
   * Defaults to retrying all errors.
   */
  isRetryable?: (error: unknown) => boolean;
  /** Called before each retry with the error and attempt number. */
  onRetry?: (error: unknown, attempt: number) => void;
}

// ─── Default retryable check ────────────────────────────────

/**
 * Default predicate: retries everything except errors explicitly
 * marked as non-retryable (e.g. validation errors, 4xx responses).
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    // Skip retrying on known permanent errors
    const msg = error.message.toLowerCase();
    if (
      msg.includes("invalid") ||
      msg.includes("not found") ||
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("validation")
    ) {
      return false;
    }
    // Check for a retryable property on the error
    if ("retryable" in error && (error as { retryable: boolean }).retryable === false) {
      return false;
    }
  }
  return true;
}

// ─── Prisma-specific retryable check ────────────────────────

/** Error codes from Prisma/PostgreSQL that are transient and worth retrying. */
const PRISMA_RETRYABLE_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Timed out connecting to database server
  "P1008", // Operations timed out
  "P1017", // Server closed the connection
  "P2024", // Timed out fetching a new connection from the pool
  "P2034", // Transaction failed due to write conflict or deadlock
]);

/**
 * Returns true if a Prisma error is transient and should be retried.
 */
export function isPrismaRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    // Prisma ClientKnownRequestError has a `code` property
    const code = (error as { code?: string }).code;
    if (code && PRISMA_RETRYABLE_CODES.has(code)) return true;

    // Connection/pool errors from pg
    const msg = error.message.toLowerCase();
    if (
      msg.includes("connection terminated") ||
      msg.includes("connection refused") ||
      msg.includes("econnreset") ||
      msg.includes("econnrefused") ||
      msg.includes("timeout") ||
      msg.includes("deadlock") ||
      msg.includes("could not connect")
    ) {
      return true;
    }
  }
  return false;
}

// ─── Core retry function ────────────────────────────────────

/**
 * Execute an async function with automatic retries on transient failures.
 *
 * @example
 * ```ts
 * const user = await withRetry(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   { label: "fetch-user", isRetryable: isPrismaRetryable }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig,
): Promise<T> {
  const maxAttempts = config?.maxAttempts ?? 3;
  const baseDelay = config?.baseDelayMs ?? 1_000;
  const maxDelay = config?.maxDelayMs ?? 10_000;
  const jitterFactor = config?.jitter ?? 0.2;
  const label = config?.label ?? "retry";
  const isRetryable = config?.isRetryable ?? defaultIsRetryable;
  const onRetry = config?.onRetry;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if the error is retryable
      if (!isRetryable(error)) {
        throw error;
      }

      // Last attempt -- don't delay, just throw
      if (attempt >= maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = baseDelay * 2 ** (attempt - 1);
      const jitter = exponentialDelay * jitterFactor * Math.random();
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      logger.warn(
        `[${label}] Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
          attempt,
          maxAttempts,
        },
      );

      onRetry?.(error, attempt);

      await sleep(delay);
    }
  }

  // All attempts exhausted
  throw lastError;
}

// ─── Helpers ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
