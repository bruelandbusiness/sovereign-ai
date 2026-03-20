import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock @upstash/redis and @upstash/ratelimit before importing the module.
// We want the in-memory fallback path to be exercised (no Upstash env vars).
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(vi.fn(), {
    slidingWindow: vi.fn(),
  }),
}));

// Ensure no Upstash env vars are set so we always use the in-memory path
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

// Use a dynamic import to pick up the mocks and env state
const { rateLimit, rateLimitByIP } = await import("./rate-limit");

describe("rateLimitByIP (in-memory fallback)", () => {
  beforeEach(() => {
    // Reset the module-level buckets map between tests by re-importing
    // won't clear module state, so we use unique keys per test instead
  });

  it("allows the first request", async () => {
    const result = await rateLimitByIP(
      "10.0.0.1",
      "test-ip-first",
      10
    );
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("decrements remaining tokens on each call", async () => {
    const r1 = await rateLimitByIP("10.0.0.2", "test-ip-decr", 5);
    const r2 = await rateLimitByIP("10.0.0.2", "test-ip-decr", 5);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBeLessThan(r1.remaining);
  });

  it("blocks after exhausting tokens", async () => {
    const action = "test-ip-exhaust";
    // maxPerHour=2 means 2 tokens, refill rate = 2/3600 ~= 0.000556 per sec
    // Requests are instant so no meaningful refill
    await rateLimitByIP("10.0.0.3", action, 2);
    await rateLimitByIP("10.0.0.3", action, 2);
    const result = await rateLimitByIP("10.0.0.3", action, 2);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("isolates different IPs", async () => {
    const action = "test-ip-isolate";
    // Exhaust tokens for IP A
    await rateLimitByIP("10.0.0.4", action, 1);
    const blockedA = await rateLimitByIP("10.0.0.4", action, 1);
    expect(blockedA.allowed).toBe(false);

    // IP B should still be allowed
    const allowedB = await rateLimitByIP("10.0.0.5", action, 1);
    expect(allowedB.allowed).toBe(true);
  });

  it("isolates different actions for the same IP", async () => {
    await rateLimitByIP("10.0.0.6", "action-a", 1);
    const blockedA = await rateLimitByIP("10.0.0.6", "action-a", 1);
    expect(blockedA.allowed).toBe(false);

    const allowedB = await rateLimitByIP("10.0.0.6", "action-b", 1);
    expect(allowedB.allowed).toBe(true);
  });
});

describe("rateLimit (in-memory fallback)", () => {
  it("allows the first request", async () => {
    const result = await rateLimit("test-rl-first", 10, 1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks after exhausting tokens", async () => {
    const key = "test-rl-exhaust";
    // 2 tokens, refillRate 0.001 (practically 0 within test duration)
    await rateLimit(key, 2, 0.001);
    await rateLimit(key, 2, 0.001);
    const result = await rateLimit(key, 2, 0.001);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("degrades gracefully by default on errors", async () => {
    // When Upstash is not configured and in-memory works, this always
    // succeeds. But we can verify the option is accepted without error.
    const result = await rateLimit("test-rl-degrade", 10, 1, {
      degradeGracefully: true,
    });
    expect(result.allowed).toBe(true);
  });
});
