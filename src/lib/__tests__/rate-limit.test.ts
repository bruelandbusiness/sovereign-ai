import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Ensure we use the in-memory path (no Redis env vars)
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

describe("rateLimit (in-memory)", () => {
  let rateLimit: typeof import("../rate-limit").rateLimit;
  let rateLimitByIP: typeof import("../rate-limit").rateLimitByIP;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import("../rate-limit");
    rateLimit = mod.rateLimit;
    rateLimitByIP = mod.rateLimitByIP;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", async () => {
    // 5 tokens, refill 1/sec
    const result = await rateLimit("test-key", 5, 1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows multiple requests up to the limit", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await rateLimit("burst-key", 5, 1);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests when tokens are exhausted", async () => {
    // Exhaust all 3 tokens
    for (let i = 0; i < 3; i++) {
      await rateLimit("exhaust-key", 3, 1);
    }

    const result = await rateLimit("exhaust-key", 3, 1);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("refills tokens over time", async () => {
    // Exhaust all 2 tokens
    await rateLimit("refill-key", 2, 1);
    await rateLimit("refill-key", 2, 1);

    const blocked = await rateLimit("refill-key", 2, 1);
    expect(blocked.allowed).toBe(false);

    // Advance 2 seconds — should refill 2 tokens (refillRate = 1/sec)
    vi.advanceTimersByTime(2000);

    const allowed = await rateLimit("refill-key", 2, 1);
    expect(allowed.allowed).toBe(true);
  });

  it("does not refill beyond maxTokens", async () => {
    // Use 1 token
    await rateLimit("cap-key", 3, 1);

    // Wait a long time
    vi.advanceTimersByTime(100_000);

    const result = await rateLimit("cap-key", 3, 1);
    expect(result.allowed).toBe(true);
    // remaining should be capped at maxTokens - 1 = 2
    expect(result.remaining).toBe(2);
  });

  describe("rateLimitByIP", () => {
    it("allows requests under the hourly limit", async () => {
      const result = await rateLimitByIP("127.0.0.1", "login", 10);
      expect(result.allowed).toBe(true);
    });

    it("blocks after exceeding the hourly limit", async () => {
      for (let i = 0; i < 3; i++) {
        await rateLimitByIP("127.0.0.1", "strict-action", 3);
      }

      const result = await rateLimitByIP("127.0.0.1", "strict-action", 3);
      expect(result.allowed).toBe(false);
    });
  });
});
