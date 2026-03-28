import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to fully control the module state per test, so we reset modules
// and manipulate env vars before each dynamic import.

describe("getRedisClient", () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    // Restore original env
    if (originalUrl !== undefined) {
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    } else {
      delete process.env.UPSTASH_REDIS_REST_URL;
    }
    if (originalToken !== undefined) {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    } else {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    }
  });

  it("returns null when UPSTASH_REDIS_REST_URL is missing", async () => {
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("returns null when UPSTASH_REDIS_REST_TOKEN is missing", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("returns null when both env vars are missing", async () => {
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("returns null when env vars are empty strings", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "";
    process.env.UPSTASH_REDIS_REST_TOKEN = "";
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("returns null when env vars are whitespace-only", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "   ";
    process.env.UPSTASH_REDIS_REST_TOKEN = "  \t  ";
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("returns a Redis instance when both env vars are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token-abc123";
    const { getRedisClient } = await import("@/lib/redis");
    const client = getRedisClient();
    expect(client).not.toBeNull();
    expect(client).toBeDefined();
  });

  it("returns the same instance on repeated calls (singleton)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token-abc123";
    const { getRedisClient } = await import("@/lib/redis");
    const first = getRedisClient();
    const second = getRedisClient();
    expect(first).toBe(second);
  });
});
