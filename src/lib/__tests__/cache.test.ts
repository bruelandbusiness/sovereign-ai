import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// We need to re-import each test to get a fresh module, but since the cache
// uses a module-level Map, we can just use del / set to manage state.
import { cache } from "../cache";

describe("cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up known keys
    cache.del("key");
    cache.del("a");
    cache.del("b");
    cache.del("wrap-key");
    vi.useRealTimers();
  });

  it("returns null for a missing key", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("stores and retrieves a value", () => {
    cache.set("key", "hello", 60);
    expect(cache.get("key")).toBe("hello");
  });

  it("returns null after TTL expires", () => {
    cache.set("key", "hello", 10);

    // Advance time past TTL
    vi.advanceTimersByTime(11_000);

    expect(cache.get("key")).toBeNull();
  });

  it("returns value before TTL expires", () => {
    cache.set("key", "hello", 10);

    vi.advanceTimersByTime(9_000);

    expect(cache.get("key")).toBe("hello");
  });

  it("deletes a key", () => {
    cache.set("key", "hello", 60);
    cache.del("key");
    expect(cache.get("key")).toBeNull();
  });

  describe("wrap", () => {
    it("calls the factory on cache miss and caches the result", async () => {
      const factory = vi.fn().mockResolvedValue("computed");

      const result = await cache.wrap("wrap-key", 60, factory);

      expect(result).toBe("computed");
      expect(factory).toHaveBeenCalledOnce();

      // Second call should use cached value
      const result2 = await cache.wrap("wrap-key", 60, factory);
      expect(result2).toBe("computed");
      expect(factory).toHaveBeenCalledOnce(); // still once
    });

    it("re-invokes factory after TTL expires", async () => {
      let callCount = 0;
      const factory = vi.fn().mockImplementation(async () => {
        callCount++;
        return `value-${callCount}`;
      });

      await cache.wrap("wrap-key", 5, factory);
      expect(factory).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(6_000);

      const result = await cache.wrap("wrap-key", 5, factory);
      expect(result).toBe("value-2");
      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe("LRU eviction", () => {
    afterEach(() => {
      // Clean up all keys we created
      for (let i = 0; i < 501; i++) {
        cache.del(`evict-${i}`);
      }
    });

    it("evicts the least recently accessed entry when full", () => {
      // Fill the cache to MAX_ENTRIES (500)
      for (let i = 0; i < 500; i++) {
        cache.set(`evict-${i}`, i, 3600);
        // Advance time slightly so lastAccessed differs
        vi.advanceTimersByTime(1);
      }

      // Access the first key so it's no longer LRU
      cache.get("evict-0");
      vi.advanceTimersByTime(1);

      // Adding one more should evict the least recently accessed (evict-1,
      // since evict-0 was just accessed)
      cache.set("evict-500", 500, 3600);

      expect(cache.get("evict-0")).toBe(0); // still present (was accessed)
      expect(cache.get("evict-1")).toBeNull(); // evicted
      expect(cache.get("evict-500")).toBe(500); // newly added
    });
  });
});
