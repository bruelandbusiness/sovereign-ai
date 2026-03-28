/**
 * Simple in-memory cache with TTL support.
 *
 * Each Vercel serverless function instance gets its own cache, which is fine
 * for short-lived data that reduces DB/API load during bursts. Not suitable
 * for data that must be globally consistent across instances.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

const MAX_ENTRIES = 500;
const CLEANUP_INTERVAL_MS = 60_000;

const store = new Map<string, CacheEntry<unknown>>();

// Auto-cleanup expired entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Evict least-recently-accessed entries when the cache is full.
 */
function evictIfNeeded(): void {
  if (store.size < MAX_ENTRIES) return;

  // Find the LRU entry
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of store) {
    if (entry.lastAccessed < oldestAccess) {
      oldestAccess = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    store.delete(oldestKey);
  }
}

/**
 * Get a value from the cache. Returns null if not found or expired.
 */
function get<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  entry.lastAccessed = Date.now();
  return entry.value;
}

/**
 * Set a value in the cache with a TTL in seconds.
 */
function set<T>(key: string, value: T, ttlSeconds: number): void {
  evictIfNeeded();

  const now = Date.now();
  store.set(key, {
    value,
    expiresAt: now + ttlSeconds * 1000,
    lastAccessed: now,
  });
}

/**
 * Delete a key from the cache.
 */
function del(key: string): void {
  store.delete(key);
}

/**
 * Cache-aside pattern: return cached value if available, otherwise execute
 * the factory function, cache the result, and return it.
 */
async function wrap<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = get<T>(key);
  if (cached !== null) return cached;

  const value = await fn();
  set(key, value, ttlSeconds);
  return value;
}

export const cache = { get, set, del, wrap };
