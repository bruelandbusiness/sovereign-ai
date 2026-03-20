/**
 * Simple in-memory rate limiter using token bucket algorithm.
 * Suitable for single-instance deployments. For distributed systems,
 * use Redis-based rate limiting.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// Clean up old buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > 3600000) {
      buckets.delete(key);
    }
  }
}, 300000);

export function rateLimit(
  key: string,
  maxTokens: number,
  refillRate: number, // tokens per second
  _options?: { degradeGracefully?: boolean },
): { allowed: boolean; remaining: number } {
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

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, remaining: Math.floor(bucket.tokens) };
  }

  return { allowed: false, remaining: 0 };
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
  _options?: { degradeGracefully?: boolean }
): { allowed: boolean; remaining: number } {
  const key = `${action}:${ip}`;
  return rateLimit(key, maxPerHour, maxPerHour / 3600);
}
