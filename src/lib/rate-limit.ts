/**
 * Rate limiter with Upstash Redis support and in-memory fallback.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, uses
 * @upstash/ratelimit backed by @upstash/redis for distributed, production-grade
 * rate limiting. Falls back to an in-memory token bucket for local development.
 */

import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // Unix timestamp (seconds)
}

/**
 * Set standard rate limit headers on a NextResponse.
 *
 * Always sets X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset.
 * When the response status is 429 (Too Many Requests), also sets Retry-After
 * with the number of seconds until the rate limit window resets.
 */
export function setRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));

  if (response.status === 429) {
    const retryAfter = Math.max(
      0,
      result.resetAt - Math.ceil(Date.now() / 1000)
    );
    response.headers.set("Retry-After", String(retryAfter));
  }

  return response;
}

// ---------------------------------------------------------------------------
// Upstash Ratelimit instances (lazy, cached by config key)
// ---------------------------------------------------------------------------

const redis = getRedisClient();
const useRedis = redis !== null;

/**
 * Cache of Ratelimit instances keyed by "maxTokens:windowSeconds" so we
 * re-use the same limiter (and its ephemeral cache) for identical configs.
 */
const limiterCache = new Map<string, Ratelimit>();

function getOrCreateLimiter(
  maxTokens: number,
  windowSeconds: number
): Ratelimit {
  const cacheKey = `${maxTokens}:${windowSeconds}`;
  let limiter = limiterCache.get(cacheKey);
  if (limiter) {
    return limiter;
  }

  if (!redis) {
    // Should never happen — callers check `useRedis` first.
    throw new Error("Redis client is not available");
  }

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxTokens, `${windowSeconds} s`),
    prefix: "rl",
    // Allow requests to pass after 5 s if Upstash is unreachable.
    timeout: 5000,
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

/**
 * Upstash-backed rate limit check. Maps the Upstash response to the
 * project's RateLimitResult interface.
 */
async function upstashRateLimit(
  key: string,
  maxTokens: number,
  windowSeconds: number,
  degradeGracefully: boolean
): Promise<RateLimitResult> {
  try {
    const limiter = getOrCreateLimiter(maxTokens, windowSeconds);
    const res = await limiter.limit(key);

    return {
      allowed: res.success,
      remaining: res.remaining,
      limit: res.limit,
      // Upstash returns reset as Unix-ms; convert to seconds.
      resetAt: Math.ceil(res.reset / 1000),
    };
  } catch (error: unknown) {
    logger.warnWithCause("[rate-limit] Upstash error", error);

    if (degradeGracefully) {
      return memoryRateLimit(
        key,
        maxTokens,
        maxTokens / Math.max(1, windowSeconds)
      );
    }

    // Fail closed: deny the request when we cannot verify the rate limit.
    // This is critical for auth endpoints where allowing unlimited attempts
    // could enable brute-force attacks.
    const resetAt = Math.ceil(Date.now() / 1000) + windowSeconds;
    return { allowed: false, remaining: 0, limit: maxTokens, resetAt };
  }
}

// ---------------------------------------------------------------------------
// In-memory fallback (token bucket — suitable for single-instance / dev)
// ---------------------------------------------------------------------------

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// Clean up old buckets every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.lastRefill > 3600000) {
        buckets.delete(key);
      }
    }
  }, 300000);
}

function memoryRateLimit(
  key: string,
  maxTokens: number,
  refillRate: number // tokens per second
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  // Estimate when a token will be available (for resetAt)
  const resetAt = Math.ceil(now / 1000) + Math.ceil(1 / refillRate);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      limit: maxTokens,
      resetAt,
    };
  }

  return { allowed: false, remaining: 0, limit: maxTokens, resetAt };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function rateLimit(
  key: string,
  maxTokens: number,
  refillRate: number, // tokens per second
  options?: { degradeGracefully?: boolean }
): Promise<RateLimitResult> {
  if (useRedis) {
    // Convert token-bucket params to a fixed window:
    // windowSeconds = maxTokens / refillRate
    const windowSeconds = Math.max(1, Math.ceil(maxTokens / refillRate));
    return upstashRateLimit(
      key,
      maxTokens,
      windowSeconds,
      options?.degradeGracefully ?? true
    );
  }

  return Promise.resolve(memoryRateLimit(key, maxTokens, refillRate));
}

/**
 * Rate limit by IP address.
 * @param ip - Client IP address
 * @param action - Action identifier (e.g., "magic-link", "chat")
 * @param maxPerHour - Maximum requests per hour
 */
export function rateLimitByIP(
  ip: string,
  action: string,
  maxPerHour: number,
  options?: { degradeGracefully?: boolean }
): Promise<RateLimitResult> {
  const key = `${action}:${ip}`;

  if (useRedis) {
    return upstashRateLimit(
      key,
      maxPerHour,
      3600,
      options?.degradeGracefully ?? true
    );
  }

  return Promise.resolve(memoryRateLimit(key, maxPerHour, maxPerHour / 3600));
}
