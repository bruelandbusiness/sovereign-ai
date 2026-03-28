import { describe, it, expect, vi } from "vitest";

// Mock the dependencies that rate-limit.ts imports at module scope.
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(vi.fn(), {
    slidingWindow: vi.fn(),
  }),
}));

// Ensure no Upstash env vars
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const { setRateLimitHeaders } = await import("@/lib/rate-limit");

describe("setRateLimitHeaders", () => {
  function makeFakeResponse(): {
    headers: Map<string, string>;
  } {
    return { headers: new Map<string, string>() };
  }

  it("sets X-RateLimit-Limit header", () => {
    const res = makeFakeResponse();
    setRateLimitHeaders(res as never, {
      allowed: true,
      remaining: 8,
      limit: 10,
      resetAt: 1711641600,
    });
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
  });

  it("sets X-RateLimit-Remaining header", () => {
    const res = makeFakeResponse();
    setRateLimitHeaders(res as never, {
      allowed: true,
      remaining: 3,
      limit: 10,
      resetAt: 1711641600,
    });
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("3");
  });

  it("sets X-RateLimit-Reset header", () => {
    const res = makeFakeResponse();
    setRateLimitHeaders(res as never, {
      allowed: false,
      remaining: 0,
      limit: 5,
      resetAt: 1711641999,
    });
    expect(res.headers.get("X-RateLimit-Reset")).toBe("1711641999");
  });

  it("returns the response object for chaining", () => {
    const res = makeFakeResponse();
    const returned = setRateLimitHeaders(res as never, {
      allowed: true,
      remaining: 1,
      limit: 1,
      resetAt: 0,
    });
    expect(returned).toBe(res);
  });
});
