// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status of a webhook delivery. */
export type DeliveryStatus =
  | "pending"
  | "success"
  | "failed"
  | "retrying"
  | "exhausted";

/** Policy governing how retries are handled. */
export interface RetryPolicy {
  /** Maximum number of retry attempts. */
  readonly maxRetries: number;
  /** Ordered list of backoff delays in milliseconds, one per attempt. */
  readonly backoffScheduleMs: readonly number[];
  /** Per-request timeout in milliseconds. */
  readonly timeoutMs: number;
  /** HTTP status codes that are eligible for retry. */
  readonly retryableStatusCodes: readonly number[];
}

/** Record of a single delivery attempt. */
export interface DeliveryAttempt {
  /** 1-based attempt number. */
  readonly attemptNumber: number;
  /** ISO-8601 timestamp of the attempt. */
  readonly timestamp: string;
  /** HTTP status code returned, or null if the request timed out. */
  readonly statusCode: number | null;
  /** Whether this attempt was successful. */
  readonly success: boolean;
  /** Latency in milliseconds. */
  readonly latencyMs: number;
  /** Optional response body or error message. */
  readonly response: string | null;
}

/** A webhook delivery with its full history. */
export interface WebhookDelivery {
  /** Unique delivery identifier. */
  readonly id: string;
  /** The webhook endpoint URL. */
  readonly url: string;
  /** The serialised payload body. */
  readonly payload: string;
  /** ISO-8601 timestamp when the delivery was first created. */
  readonly createdAt: string;
  /** Current delivery status. */
  readonly status: DeliveryStatus;
  /** Ordered list of delivery attempts. */
  readonly attempts: readonly DeliveryAttempt[];
  /** The retry policy applied to this delivery. */
  readonly retryPolicy: RetryPolicy;
}

/** An item sitting in the retry queue. */
export interface RetryQueueItem {
  /** The delivery waiting to be retried. */
  readonly delivery: WebhookDelivery;
  /** ISO-8601 timestamp of the next scheduled retry. */
  readonly nextRetryAt: string;
  /** How many retries have been attempted so far. */
  readonly retriesSoFar: number;
  /** Priority weight — lower means higher priority. */
  readonly priority: number;
}

/** Aggregate metrics computed from a set of deliveries. */
export interface DeliveryMetrics {
  /** Total number of deliveries analysed. */
  readonly totalDeliveries: number;
  /** Number of deliveries that ultimately succeeded. */
  readonly successfulDeliveries: number;
  /** Number of deliveries that exhausted all retries. */
  readonly failedDeliveries: number;
  /** Fraction of deliveries that succeeded (0..1). */
  readonly successRate: number;
  /** Average latency across all attempts in milliseconds. */
  readonly averageLatencyMs: number;
  /** Fraction of deliveries that required at least one retry. */
  readonly retryRate: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_MINUTE_MS = 60 * 1000;
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS;
const THIRTY_MINUTES_MS = 30 * ONE_MINUTE_MS;
const TWO_HOURS_MS = 2 * 60 * ONE_MINUTE_MS;
const TWELVE_HOURS_MS = 12 * 60 * ONE_MINUTE_MS;

/** Sensible default retry policy with exponential backoff. */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 5,
  backoffScheduleMs: [
    ONE_MINUTE_MS,
    FIVE_MINUTES_MS,
    THIRTY_MINUTES_MS,
    TWO_HOURS_MS,
    TWELVE_HOURS_MS,
  ],
  timeoutMs: 30_000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
} as const;

/** Maximum jitter factor applied to backoff delays (20%). */
const JITTER_FACTOR = 0.2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether an HTTP status code warrants a retry under the given policy.
 *
 * @param statusCode - The HTTP status code to evaluate.
 * @param policy     - The retry policy (defaults to DEFAULT_RETRY_POLICY).
 * @returns True if the status code is retryable.
 */
export function isRetryableStatusCode(
  statusCode: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): boolean {
  return policy.retryableStatusCodes.includes(statusCode);
}

/**
 * Compute the delay before the next retry using exponential backoff with
 * random jitter.
 *
 * The base delay comes from the policy's backoff schedule. A random jitter
 * of +/- {@link JITTER_FACTOR} is applied so that retries from many clients
 * do not thundering-herd the server.
 *
 * @param attemptNumber - 1-based attempt that just failed.
 * @param policy        - The retry policy (defaults to DEFAULT_RETRY_POLICY).
 * @returns Delay in milliseconds before the next attempt should fire.
 */
export function calculateNextRetryDelay(
  attemptNumber: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): number {
  const index = Math.min(
    attemptNumber - 1,
    policy.backoffScheduleMs.length - 1,
  );
  const baseDelay = policy.backoffScheduleMs[index];
  const jitter = baseDelay * JITTER_FACTOR * (2 * Math.random() - 1);
  return Math.max(0, Math.round(baseDelay + jitter));
}

/**
 * Determine whether a failed delivery should be retried.
 *
 * A delivery is retryable when:
 * 1. It has not exceeded the maximum retry count.
 * 2. The last status code is in the retryable set (or was null, i.e. timeout).
 *
 * @param statusCode   - HTTP status code of the last attempt (null = timeout).
 * @param attemptCount - How many attempts have been made so far.
 * @param policy       - The retry policy (defaults to DEFAULT_RETRY_POLICY).
 * @returns True if the delivery should be retried.
 */
export function shouldRetry(
  statusCode: number | null,
  attemptCount: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): boolean {
  if (attemptCount >= policy.maxRetries + 1) {
    return false;
  }

  if (statusCode === null) {
    return true;
  }

  return isRetryableStatusCode(statusCode, policy);
}

/**
 * Build a {@link DeliveryAttempt} record.
 *
 * @param attemptNumber - 1-based attempt number.
 * @param statusCode    - HTTP status code or null on timeout.
 * @param latencyMs     - Round-trip time in milliseconds.
 * @param response      - Optional response body or error message.
 * @returns An immutable DeliveryAttempt object.
 */
export function createDeliveryAttempt(
  attemptNumber: number,
  statusCode: number | null,
  latencyMs: number,
  response: string | null = null,
): DeliveryAttempt {
  const success =
    statusCode !== null && statusCode >= 200 && statusCode < 300;

  return {
    attemptNumber,
    timestamp: new Date().toISOString(),
    statusCode,
    success,
    latencyMs,
    response,
  };
}

/**
 * Preview the full retry schedule for a delivery, starting from a given
 * base time.
 *
 * Returns an array of ISO-8601 timestamps, one per potential retry. This is
 * useful for UI previews and debugging.
 *
 * @param baseTime - The starting point (e.g. the initial delivery time).
 * @param policy   - The retry policy (defaults to DEFAULT_RETRY_POLICY).
 * @returns Array of ISO-8601 timestamps for each retry.
 */
export function getRetrySchedule(
  baseTime: Date,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): readonly string[] {
  const schedule: string[] = [];
  let cursor = baseTime.getTime();

  for (let i = 1; i <= policy.maxRetries; i++) {
    const index = Math.min(i - 1, policy.backoffScheduleMs.length - 1);
    cursor += policy.backoffScheduleMs[index];
    schedule.push(new Date(cursor).toISOString());
  }

  return schedule;
}

/**
 * Compute aggregate delivery metrics from a list of deliveries.
 *
 * @param deliveries - The deliveries to analyse.
 * @returns Computed metrics including success rate, latency, and retry rate.
 */
export function calculateDeliveryMetrics(
  deliveries: readonly WebhookDelivery[],
): DeliveryMetrics {
  if (deliveries.length === 0) {
    return {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      successRate: 0,
      averageLatencyMs: 0,
      retryRate: 0,
    };
  }

  let successfulDeliveries = 0;
  let failedDeliveries = 0;
  let totalLatencyMs = 0;
  let totalAttempts = 0;
  let deliveriesWithRetries = 0;

  for (const delivery of deliveries) {
    if (delivery.status === "success") {
      successfulDeliveries += 1;
    } else if (
      delivery.status === "failed" ||
      delivery.status === "exhausted"
    ) {
      failedDeliveries += 1;
    }

    for (const attempt of delivery.attempts) {
      totalLatencyMs += attempt.latencyMs;
      totalAttempts += 1;
    }

    if (delivery.attempts.length > 1) {
      deliveriesWithRetries += 1;
    }
  }

  const totalDeliveries = deliveries.length;

  return {
    totalDeliveries,
    successfulDeliveries,
    failedDeliveries,
    successRate: totalDeliveries > 0
      ? successfulDeliveries / totalDeliveries
      : 0,
    averageLatencyMs: totalAttempts > 0
      ? Math.round(totalLatencyMs / totalAttempts)
      : 0,
    retryRate: totalDeliveries > 0
      ? deliveriesWithRetries / totalDeliveries
      : 0,
  };
}

/**
 * Sort a retry queue by urgency.
 *
 * Priority order:
 * 1. Oldest scheduled retry first (earliest nextRetryAt).
 * 2. Fewest retries first (to give fresh deliveries a chance).
 *
 * Returns a new sorted array — the input is never mutated.
 *
 * @param queue - The retry queue items to sort.
 * @returns A new array sorted by urgency (highest priority first).
 */
export function prioritizeQueue(
  queue: readonly RetryQueueItem[],
): readonly RetryQueueItem[] {
  return [...queue].sort((a, b) => {
    const timeDiff =
      new Date(a.nextRetryAt).getTime() - new Date(b.nextRetryAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return a.retriesSoFar - b.retriesSoFar;
  });
}
