// ---------------------------------------------------------------------------
// Cache Strategy Configuration Utility
// Pure configuration — no Redis or external service calls.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECONDS = 1;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;

const CACHE_VERSION = "v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported data-type keys for cache strategy lookup. */
export type CacheDataType =
  | "static_content"
  | "dashboard_kpis"
  | "lead_list"
  | "service_health"
  | "user_session"
  | "blog_content"
  | "pricing_data"
  | "analytics_reports"
  | "knowledge_base"
  | "competitor_data";

/** Time-to-live specification in seconds. */
export interface CacheTTL {
  /** Maximum age in seconds before the entry is considered stale. */
  readonly maxAge: number;
  /**
   * Duration (seconds) during which stale data may be served while a
   * background revalidation occurs.
   */
  readonly staleWhileRevalidate: number;
}

/** Full cache configuration for a single data type. */
export interface CacheConfig {
  readonly dataType: CacheDataType;
  readonly ttl: CacheTTL;
  /** Whether the response can be stored by shared (CDN) caches. */
  readonly isPublic: boolean;
  /** Events that should trigger immediate invalidation. */
  readonly invalidationEvents: readonly string[];
}

/** A namespaced, versioned cache key. */
export interface CacheKey {
  readonly namespace: string;
  readonly version: string;
  readonly segments: readonly string[];
  /** The fully-qualified string representation. */
  readonly key: string;
}

/** Result of an invalidation check. */
export interface CacheInvalidation {
  readonly shouldInvalidate: boolean;
  readonly reason: string;
}

/** Stale-while-revalidate timing information. */
export interface StaleWhileRevalidate {
  /** Seconds remaining in the fresh window. */
  readonly freshSecondsRemaining: number;
  /** Seconds remaining in the stale-while-revalidate window. */
  readonly staleSecondsRemaining: number;
  readonly isFresh: boolean;
  readonly isStaleButUsable: boolean;
  readonly isExpired: boolean;
}

/** Parsed representation of a Cache-Control header. */
export interface ParsedCacheControl {
  readonly maxAge: number | null;
  readonly sMaxAge: number | null;
  readonly staleWhileRevalidate: number | null;
  readonly staleIfError: number | null;
  readonly isPublic: boolean;
  readonly isPrivate: boolean;
  readonly noCache: boolean;
  readonly noStore: boolean;
  readonly mustRevalidate: boolean;
  readonly immutable: boolean;
}

/** Estimated memory footprint of cached data. */
export interface CacheSizeEstimate {
  readonly bytes: number;
  readonly kilobytes: number;
  readonly megabytes: number;
  readonly label: string;
}

// ---------------------------------------------------------------------------
// CACHE_STRATEGIES
// ---------------------------------------------------------------------------

/**
 * Predefined cache strategies keyed by data type.
 *
 * TTLs are chosen to balance freshness with server load:
 * - Volatile operational data (health, leads) → short TTLs
 * - Semi-static reference data (pricing, KB) → longer TTLs
 * - Truly static content → aggressive caching
 */
export const CACHE_STRATEGIES: Readonly<
  Record<CacheDataType, CacheConfig>
> = {
  static_content: {
    dataType: "static_content",
    ttl: { maxAge: 1 * DAYS, staleWhileRevalidate: 4 * HOURS },
    isPublic: true,
    invalidationEvents: ["deploy", "content_update"],
  },
  dashboard_kpis: {
    dataType: "dashboard_kpis",
    ttl: { maxAge: 5 * MINUTES, staleWhileRevalidate: 2 * MINUTES },
    isPublic: false,
    invalidationEvents: ["kpi_refresh", "data_import"],
  },
  lead_list: {
    dataType: "lead_list",
    ttl: { maxAge: 2 * MINUTES, staleWhileRevalidate: 1 * MINUTES },
    isPublic: false,
    invalidationEvents: ["lead_created", "lead_updated", "lead_deleted"],
  },
  service_health: {
    dataType: "service_health",
    ttl: { maxAge: 1 * MINUTES, staleWhileRevalidate: 30 * SECONDS },
    isPublic: false,
    invalidationEvents: ["health_check", "incident_update"],
  },
  user_session: {
    dataType: "user_session",
    ttl: { maxAge: 30 * MINUTES, staleWhileRevalidate: 5 * MINUTES },
    isPublic: false,
    invalidationEvents: ["logout", "session_revoked", "password_changed"],
  },
  blog_content: {
    dataType: "blog_content",
    ttl: { maxAge: 1 * HOURS, staleWhileRevalidate: 15 * MINUTES },
    isPublic: true,
    invalidationEvents: ["post_published", "post_updated", "post_deleted"],
  },
  pricing_data: {
    dataType: "pricing_data",
    ttl: { maxAge: 12 * HOURS, staleWhileRevalidate: 2 * HOURS },
    isPublic: true,
    invalidationEvents: ["pricing_updated", "promotion_started", "promotion_ended"],
  },
  analytics_reports: {
    dataType: "analytics_reports",
    ttl: { maxAge: 15 * MINUTES, staleWhileRevalidate: 5 * MINUTES },
    isPublic: false,
    invalidationEvents: ["report_generated", "data_import"],
  },
  knowledge_base: {
    dataType: "knowledge_base",
    ttl: { maxAge: 6 * HOURS, staleWhileRevalidate: 1 * HOURS },
    isPublic: true,
    invalidationEvents: ["article_updated", "article_created", "article_deleted"],
  },
  competitor_data: {
    dataType: "competitor_data",
    ttl: { maxAge: 24 * HOURS, staleWhileRevalidate: 4 * HOURS },
    isPublic: false,
    invalidationEvents: ["competitor_scan_complete", "manual_refresh"],
  },
} as const;

// ---------------------------------------------------------------------------
// buildCacheKey
// ---------------------------------------------------------------------------

/**
 * Create a namespaced, versioned cache key.
 *
 * @param namespace - Logical grouping (e.g. "dashboard", "leads").
 * @param segments  - Additional path segments for uniqueness.
 * @param version   - Cache version prefix (defaults to current CACHE_VERSION).
 * @returns A {@link CacheKey} with a fully-qualified `key` string.
 *
 * @example
 * ```ts
 * buildCacheKey("leads", ["org-42", "page-1"])
 * // → { key: "v1:leads:org-42:page-1", … }
 * ```
 */
export function buildCacheKey(
  namespace: string,
  segments: readonly string[] = [],
  version: string = CACHE_VERSION,
): CacheKey {
  const sanitised = [version, namespace, ...segments].map((s) =>
    s.replace(/:/g, "_"),
  );
  return {
    namespace,
    version,
    segments,
    key: sanitised.join(":"),
  };
}

// ---------------------------------------------------------------------------
// shouldInvalidate
// ---------------------------------------------------------------------------

/**
 * Determine whether cached data should be invalidated.
 *
 * Invalidation is triggered when:
 * 1. The entry has exceeded its TTL, **or**
 * 2. A matching invalidation event has fired.
 *
 * @param dataType     - The data type whose strategy to check.
 * @param cachedAtMs   - Timestamp (ms) when the entry was cached.
 * @param nowMs        - Current timestamp in ms (defaults to `Date.now()`).
 * @param firedEvents  - Events that have occurred since the entry was cached.
 */
export function shouldInvalidate(
  dataType: CacheDataType,
  cachedAtMs: number,
  nowMs: number = Date.now(),
  firedEvents: readonly string[] = [],
): CacheInvalidation {
  const config = CACHE_STRATEGIES[dataType];
  const ageSeconds = (nowMs - cachedAtMs) / 1000;

  // Check TTL expiry first.
  if (ageSeconds > config.ttl.maxAge) {
    return {
      shouldInvalidate: true,
      reason: `TTL expired: age ${Math.round(ageSeconds)}s exceeds maxAge ${config.ttl.maxAge}s`,
    };
  }

  // Check event-based invalidation.
  const matchingEvent = firedEvents.find((e) =>
    config.invalidationEvents.includes(e),
  );
  if (matchingEvent !== undefined) {
    return {
      shouldInvalidate: true,
      reason: `Invalidation event fired: "${matchingEvent}"`,
    };
  }

  return {
    shouldInvalidate: false,
    reason: `Entry is fresh (${Math.round(ageSeconds)}s of ${config.ttl.maxAge}s maxAge)`,
  };
}

// ---------------------------------------------------------------------------
// getCacheHeaders
// ---------------------------------------------------------------------------

/**
 * Generate an HTTP `Cache-Control` header value for a given data type.
 *
 * @param dataType - The data type to generate headers for.
 * @returns A standards-compliant Cache-Control header string.
 */
export function getCacheHeaders(dataType: CacheDataType): string {
  const config = CACHE_STRATEGIES[dataType];
  const { maxAge, staleWhileRevalidate } = config.ttl;

  const directives: string[] = [
    config.isPublic ? "public" : "private",
    `max-age=${maxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`,
  ];

  return directives.join(", ");
}

// ---------------------------------------------------------------------------
// calculateStaleTime
// ---------------------------------------------------------------------------

/**
 * Calculate stale-while-revalidate timing for a cached entry.
 *
 * @param dataType   - The data type whose strategy to use.
 * @param cachedAtMs - Timestamp (ms) when the entry was cached.
 * @param nowMs      - Current timestamp in ms (defaults to `Date.now()`).
 */
export function calculateStaleTime(
  dataType: CacheDataType,
  cachedAtMs: number,
  nowMs: number = Date.now(),
): StaleWhileRevalidate {
  const { maxAge, staleWhileRevalidate } = CACHE_STRATEGIES[dataType].ttl;
  const ageSeconds = (nowMs - cachedAtMs) / 1000;

  const freshSecondsRemaining = Math.max(0, maxAge - ageSeconds);
  const totalWindow = maxAge + staleWhileRevalidate;
  const staleSecondsRemaining = Math.max(0, totalWindow - ageSeconds);

  const isFresh = ageSeconds <= maxAge;
  const isStaleButUsable = !isFresh && ageSeconds <= totalWindow;
  const isExpired = ageSeconds > totalWindow;

  return {
    freshSecondsRemaining,
    staleSecondsRemaining,
    isFresh,
    isStaleButUsable,
    isExpired,
  };
}

// ---------------------------------------------------------------------------
// parseCacheControl
// ---------------------------------------------------------------------------

/**
 * Parse a `Cache-Control` header string into a structured object.
 *
 * Handles all standard directives defined in RFC 5861 / RFC 7234.
 *
 * @param header - Raw Cache-Control header value.
 */
export function parseCacheControl(header: string): ParsedCacheControl {
  const directives = header
    .split(",")
    .map((d) => d.trim().toLowerCase());

  const parseNumeric = (name: string): number | null => {
    const match = directives.find((d) => d.startsWith(`${name}=`));
    if (match === undefined) return null;
    const value = parseInt(match.split("=")[1], 10);
    return Number.isNaN(value) ? null : value;
  };

  const hasDirective = (name: string): boolean =>
    directives.some((d) => d === name);

  return {
    maxAge: parseNumeric("max-age"),
    sMaxAge: parseNumeric("s-maxage"),
    staleWhileRevalidate: parseNumeric("stale-while-revalidate"),
    staleIfError: parseNumeric("stale-if-error"),
    isPublic: hasDirective("public"),
    isPrivate: hasDirective("private"),
    noCache: hasDirective("no-cache"),
    noStore: hasDirective("no-store"),
    mustRevalidate: hasDirective("must-revalidate"),
    immutable: hasDirective("immutable"),
  };
}

// ---------------------------------------------------------------------------
// estimateCacheSize
// ---------------------------------------------------------------------------

/**
 * Estimate the in-memory footprint of a cached value.
 *
 * Uses a recursive traversal that accounts for:
 * - String length (2 bytes per char — JS uses UTF-16)
 * - Numbers (8 bytes — IEEE 754 double)
 * - Booleans (4 bytes)
 * - Object key overhead
 * - Array element overhead
 * - null / undefined (0 bytes payload, pointer cost ignored)
 *
 * The estimate is intentionally conservative and does not account for
 * engine-specific object headers or hidden classes.
 *
 * @param value - The value to measure.
 */
export function estimateCacheSize(value: unknown): CacheSizeEstimate {
  const bytes = estimateBytes(value, new WeakSet());

  const kilobytes = bytes / 1024;
  const megabytes = kilobytes / 1024;

  let label: string;
  if (megabytes >= 1) {
    label = `${megabytes.toFixed(2)} MB`;
  } else if (kilobytes >= 1) {
    label = `${kilobytes.toFixed(2)} KB`;
  } else {
    label = `${bytes} B`;
  }

  return { bytes, kilobytes, megabytes, label };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Recursively estimate byte size of a JS value.
 * Uses a WeakSet to avoid infinite loops on circular references.
 */
function estimateBytes(value: unknown, seen: WeakSet<object>): number {
  if (value === null || value === undefined) return 0;

  switch (typeof value) {
    case "string":
      return value.length * 2;
    case "number":
      return 8;
    case "boolean":
      return 4;
    case "bigint":
      return 8;
    case "symbol":
      return 0;
    case "function":
      return 0;
    case "object": {
      if (seen.has(value as object)) return 0;
      seen.add(value as object);

      if (Array.isArray(value)) {
        return value.reduce(
          (sum: number, item: unknown) => sum + estimateBytes(item, seen),
          0,
        );
      }

      let total = 0;
      for (const key of Object.keys(value as Record<string, unknown>)) {
        // Key cost + value cost
        total += key.length * 2;
        total += estimateBytes(
          (value as Record<string, unknown>)[key],
          seen,
        );
      }
      return total;
    }
    default:
      return 0;
  }
}
