import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock NextRequest since we're in a Node test environment
function createMockRequest(
  method: string,
  headers: Record<string, string> = {}
) {
  return {
    method,
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  } as unknown as import("next/server").NextRequest;
}

// We need to set NODE_ENV before importing the module so the ALLOWED_ORIGINS
// set is computed correctly.
describe("validateOrigin", () => {
  let validateOrigin: typeof import("../csrf").validateOrigin;

  beforeEach(async () => {
    vi.resetModules();
    // Import fresh each time so env changes take effect
    const mod = await import("../csrf");
    validateOrigin = mod.validateOrigin;
  });

  it("allows GET requests regardless of origin", () => {
    const req = createMockRequest("GET", {
      origin: "https://evil.com",
    });
    expect(validateOrigin(req)).toBeNull();
  });

  it("allows HEAD requests regardless of origin", () => {
    const req = createMockRequest("HEAD", {
      origin: "https://evil.com",
    });
    expect(validateOrigin(req)).toBeNull();
  });

  it("allows OPTIONS requests regardless of origin", () => {
    const req = createMockRequest("OPTIONS", {
      origin: "https://evil.com",
    });
    expect(validateOrigin(req)).toBeNull();
  });

  it("allows POST from an allowed origin", () => {
    const req = createMockRequest("POST", {
      origin: "https://www.trysovereignai.com",
    });
    expect(validateOrigin(req)).toBeNull();
  });

  it("rejects POST from a disallowed origin", () => {
    const req = createMockRequest("POST", {
      origin: "https://evil.com",
    });
    expect(validateOrigin(req)).toBe('Origin "https://evil.com" is not allowed');
  });

  it("allows POST with no origin and no referer (non-browser client)", () => {
    const req = createMockRequest("POST");
    expect(validateOrigin(req)).toBeNull();
  });

  it("allows POST with no origin but valid referer", () => {
    const req = createMockRequest("POST", {
      referer: "https://www.trysovereignai.com/some/page",
    });
    expect(validateOrigin(req)).toBeNull();
  });

  it("rejects POST with no origin but invalid referer", () => {
    const req = createMockRequest("POST", {
      referer: "https://evil.com/attack",
    });
    expect(validateOrigin(req)).toBe("Missing or invalid Origin header");
  });

  it("rejects DELETE from a disallowed origin", () => {
    const req = createMockRequest("DELETE", {
      origin: "https://evil.com",
    });
    expect(validateOrigin(req)).toContain("is not allowed");
  });
});
