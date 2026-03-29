/**
 * Rate limiting configuration utility.
 *
 * Pure config and logic — no Redis or network calls. Complements rate-limit.ts
 * by providing tier-based configuration, endpoint-specific rules, and header
 * formatting helpers.
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** Named pricing/access tiers with ascending rate limits. */
export type RateLimitTier = "free" | "starter" | "professional" | "enterprise";

/** Describes rate limits for a single tier. */
export interface RateLimitRule {
  /** Maximum requests allowed per hour. */
  readonly maxPerHour: number;
  /** Maximum requests allowed per minute (burst protection). */
  readonly maxPerMinute: number;
}

/** Full configuration object mapping every tier to its limits. */
export type RateLimitConfig = Readonly<Record<RateLimitTier, RateLimitRule>>;

/** An endpoint-specific rate limit override with a URL pattern. */
export interface EndpointRule {
  /** Glob-style path prefix (e.g. "/api/auth/*"). */
  readonly pattern: string;
  /** Human-readable description of why these limits exist. */
  readonly description: string;
  /** Per-tier multipliers applied to the base tier limits (1 = unchanged). */
  readonly multipliers: Readonly<Record<RateLimitTier, number>>;
}

/** Resolved rate limit for a specific endpoint + tier combination. */
export interface ResolvedRateLimit {
  readonly tier: RateLimitTier;
  readonly endpoint: string;
  readonly maxPerHour: number;
  readonly maxPerMinute: number;
}

/** Standard X-RateLimit-* headers as a plain record. */
export interface RateLimitHeaders {
  readonly "X-RateLimit-Limit": string;
  readonly "X-RateLimit-Remaining": string;
  readonly "X-RateLimit-Reset": string;
  readonly "Retry-After"?: string;
}

// ---------------------------------------------------------------------------
// Constants — tier definitions
// ---------------------------------------------------------------------------

export const RATE_LIMIT_TIERS: RateLimitConfig = {
  free: { maxPerHour: 60, maxPerMinute: 10 },
  starter: { maxPerHour: 300, maxPerMinute: 30 },
  professional: { maxPerHour: 1000, maxPerMinute: 100 },
  enterprise: { maxPerHour: 5000, maxPerMinute: 500 },
} as const;

// ---------------------------------------------------------------------------
// Constants — endpoint-specific rules
// ---------------------------------------------------------------------------

/**
 * Endpoint rules ordered from most specific to least specific.
 * The first matching pattern wins when resolving limits.
 *
 * Multipliers scale the base tier limits:
 *   < 1 = stricter than default
 *   1   = same as default
 *   > 1 = more relaxed than default
 */
export const ENDPOINT_RULES: readonly EndpointRule[] = [
  {
    pattern: "/api/auth/*",
    description: "Very strict — prevent brute-force attacks",
    multipliers: {
      free: 0.1,
      starter: 0.1,
      professional: 0.15,
      enterprise: 0.2,
    },
  },
  {
    pattern: "/api/public/*",
    description: "Strictest — unauthenticated, high abuse risk",
    multipliers: {
      free: 0.08,
      starter: 0.08,
      professional: 0.1,
      enterprise: 0.12,
    },
  },
  {
    pattern: "/api/leads/*",
    description: "Stricter — prevent data scraping",
    multipliers: {
      free: 0.25,
      starter: 0.3,
      professional: 0.4,
      enterprise: 0.5,
    },
  },
  {
    pattern: "/api/dashboard/*",
    description: "Moderate — standard authenticated usage",
    multipliers: {
      free: 0.8,
      starter: 0.8,
      professional: 0.9,
      enterprise: 1.0,
    },
  },
  {
    pattern: "/api/admin/*",
    description: "Relaxed — trusted administrative users",
    multipliers: {
      free: 1.5,
      starter: 1.5,
      professional: 2.0,
      enterprise: 2.5,
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Helper — pattern matching
// ---------------------------------------------------------------------------

/**
 * Check whether a request path matches an endpoint rule pattern.
 * Supports trailing `*` as a simple wildcard for any suffix.
 */
function matchesPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1); // keep the trailing slash
    return path.startsWith(prefix) || path === prefix.slice(0, -1);
  }
  return path === pattern;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Resolve the applicable rate limit for a given request path and tier.
 *
 * Walks `ENDPOINT_RULES` in order and returns the first match. If no
 * endpoint-specific rule matches, the base tier limits are returned
 * unmodified.
 */
export function getRateLimitForEndpoint(
  path: string,
  tier: RateLimitTier
): ResolvedRateLimit {
  const base = RATE_LIMIT_TIERS[tier];

  for (const rule of ENDPOINT_RULES) {
    if (matchesPattern(path, rule.pattern)) {
      const multiplier = rule.multipliers[tier];
      return {
        tier,
        endpoint: rule.pattern,
        maxPerHour: Math.max(1, Math.floor(base.maxPerHour * multiplier)),
        maxPerMinute: Math.max(1, Math.floor(base.maxPerMinute * multiplier)),
      };
    }
  }

  return {
    tier,
    endpoint: path,
    maxPerHour: base.maxPerHour,
    maxPerMinute: base.maxPerMinute,
  };
}

/**
 * Check whether a request count has exceeded the applicable rate limit.
 *
 * @param currentCount - Number of requests made in the current window.
 * @param limit        - The maximum allowed for that window.
 * @returns `true` when the limit has been reached or exceeded.
 */
export function isRateLimitExceeded(
  currentCount: number,
  limit: number
): boolean {
  return currentCount >= limit;
}

/**
 * Compute the number of seconds a client should wait before retrying.
 *
 * @param resetAtUnix - Unix timestamp (seconds) when the window resets.
 * @param nowMs       - Current time in milliseconds (defaults to Date.now()).
 * @returns Non-negative integer seconds until the window resets.
 */
export function calculateRetryAfter(
  resetAtUnix: number,
  nowMs: number = Date.now()
): number {
  const nowSeconds = Math.ceil(nowMs / 1000);
  return Math.max(0, resetAtUnix - nowSeconds);
}

/**
 * Generate standard `X-RateLimit-*` response headers.
 *
 * Always includes Limit, Remaining, and Reset. Includes Retry-After only
 * when `remaining` is zero (i.e. the client is rate-limited).
 *
 * @param limit     - Maximum requests allowed in the window.
 * @param remaining - Requests remaining in the current window.
 * @param resetAt   - Unix timestamp (seconds) when the window resets.
 * @param nowMs     - Current time in milliseconds (defaults to Date.now()).
 */
export function formatRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number,
  nowMs: number = Date.now()
): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(resetAt),
  };

  if (remaining <= 0) {
    return {
      ...headers,
      "Retry-After": String(calculateRetryAfter(resetAt, nowMs)),
    };
  }

  return headers;
}
