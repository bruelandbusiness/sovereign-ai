import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRateLimitByIP,
  mockRateLimit,
  mockSetRateLimitHeaders,
  mockGenerateMagicLink,
  mockSendMagicLinkEmail,
  mockGetSession,
  mockRequireClient,
  mockAssertStripeConfigured,
  mockStripe,
  mockGetBundleById,
  mockGetServiceById,
  HoistedAuthError,
} = vi.hoisted(() => {
  class HoistedAuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  // NextResponse.json passthrough for setRateLimitHeaders
  const mockSetRateLimitHeaders = vi.fn((res: unknown) => res);

  return {
    HoistedAuthError,
    mockPrisma: {
      $queryRaw: vi.fn(),
      $queryRawUnsafe: vi.fn(),
      lead: { findMany: vi.fn() },
      activityEvent: { findMany: vi.fn() },
      subscription: { findUnique: vi.fn() },
    },
    mockRateLimitByIP: vi.fn(),
    mockRateLimit: vi.fn(),
    mockSetRateLimitHeaders,
    mockGenerateMagicLink: vi.fn(),
    mockSendMagicLinkEmail: vi.fn(),
    mockGetSession: vi.fn(),
    mockRequireClient: vi.fn(),
    mockAssertStripeConfigured: vi.fn(),
    mockStripe: {
      checkout: {
        sessions: { create: vi.fn() },
      },
    },
    mockGetBundleById: vi.fn(),
    mockGetServiceById: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitByIP: mockRateLimitByIP,
  rateLimit: mockRateLimit,
  setRateLimitHeaders: mockSetRateLimitHeaders,
}));

vi.mock("@/lib/auth", () => ({
  generateMagicLink: mockGenerateMagicLink,
  getSession: mockGetSession,
}));

vi.mock("@/lib/email", () => ({
  sendMagicLinkEmail: mockSendMagicLinkEmail,
}));

vi.mock("@/lib/require-client", () => ({
  requireClient: mockRequireClient,
  AuthError: HoistedAuthError,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: mockStripe,
  assertStripeConfigured: mockAssertStripeConfigured,
}));

vi.mock("@/lib/constants", () => ({
  getBundleById: mockGetBundleById,
  getServiceById: mockGetServiceById,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

// Mock package.json require for health route
vi.mock("../../../../package.json", () => ({ version: "1.0.0-test" }));

// ---------------------------------------------------------------------------
// Lazy route imports (after mocks)
// ---------------------------------------------------------------------------
const healthRoute = () => import("@/app/api/health/route");
const magicLinkRoute = () => import("@/app/api/auth/send-magic-link/route");
const exportRoute = () => import("@/app/api/dashboard/export/route");
const checkoutRoute = () => import("@/app/api/payments/checkout/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CLIENT_ID = "client_test_123";
const ACCOUNT_ID = "account_test_456";

function makePostRequest(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

// Use a fixed resetAt timestamp instead of Date.now() to avoid time-sensitive flakiness.
const FIXED_RESET_AT = 1800000000;

function allowRateLimit() {
  const rl = { allowed: true, remaining: 9, limit: 10, resetAt: FIXED_RESET_AT };
  mockRateLimitByIP.mockResolvedValue(rl);
  mockRateLimit.mockResolvedValue(rl);
  return rl;
}

function denyRateLimit() {
  const rl = { allowed: false, remaining: 0, limit: 10, resetAt: FIXED_RESET_AT };
  mockRateLimitByIP.mockResolvedValue(rl);
  mockRateLimit.mockResolvedValue(rl);
  return rl;
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  allowRateLimit();
});

afterEach(() => {
  // Ensure fake timers are always restored to prevent leakage between tests
  vi.useRealTimers();
});

// ===========================================================================
// 1. GET /api/health
// ===========================================================================
describe("GET /api/health", () => {
  it("returns 200 with status ok when database is connected", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    const { GET } = await healthRoute();
    const res = await GET(makeGetRequest("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("checks");
  });

  it("returns 200 with status degraded when database times out", async () => {
    vi.useFakeTimers();
    // Simulate a query that never resolves within the 2-second timeout
    mockPrisma.$queryRaw.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([{ ok: 1 }]), 5000)),
    );
    const { GET } = await healthRoute();
    const resPromise = GET(makeGetRequest("http://localhost/api/health"));
    // Advance past the 2-second Promise.race timeout in the health route
    await vi.advanceTimersByTimeAsync(3000);
    const res = await resPromise;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("timeout");
    vi.useRealTimers();
  });

  it("returns 503 with status error when database throws", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("ECONNREFUSED"));
    const { GET } = await healthRoute();
    const res = await GET(makeGetRequest("http://localhost/api/health"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.checks.database.status).toBe("error");
    expect(body.checks.database.message).toBe("ECONNREFUSED");
  });

  it("includes memory and uptime checks", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    const { GET } = await healthRoute();
    const res = await GET(makeGetRequest("http://localhost/api/health"));
    const body = await res.json();
    expect(body.checks.memory).toHaveProperty("heapUsedMB");
    expect(body.checks.memory).toHaveProperty("rssMB");
    expect(body.checks.uptime).toHaveProperty("seconds");
    expect(body.checks.uptime).toHaveProperty("human");
  });
});

// ===========================================================================
// 2. POST /api/auth/send-magic-link
// ===========================================================================
describe("POST /api/auth/send-magic-link", () => {
  const url = "http://localhost/api/auth/send-magic-link";

  it("returns 200 with success on valid email", async () => {
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com/auth?token=abc" });
    mockSendMagicLinkEmail.mockResolvedValue(undefined);
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "user@example.com" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 200 even when account does not exist (no information leakage)", async () => {
    mockGenerateMagicLink.mockResolvedValue(null);
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "nonexistent@example.com" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // Should NOT call sendMagicLinkEmail when no account
    expect(mockSendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body).toHaveProperty("details");
  });

  it("returns 400 when email is invalid format", async () => {
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "user@example.com" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockGenerateMagicLink.mockRejectedValue(new Error("DB down"));
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "user@example.com" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to send magic link");
  });
});

// ===========================================================================
// 3. GET /api/dashboard/export
// ===========================================================================
describe("GET /api/dashboard/export", () => {
  const baseUrl = "http://localhost/api/dashboard/export";

  function authenticatedSession() {
    mockRequireClient.mockResolvedValue({
      clientId: CLIENT_ID,
      accountId: ACCOUNT_ID,
      session: { account: { id: ACCOUNT_ID, client: { id: CLIENT_ID } } },
    });
  }

  function unauthenticated() {
    mockRequireClient.mockRejectedValue(new HoistedAuthError("Unauthorized", 401));
  }

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await exportRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?type=leads`));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when type parameter is missing", async () => {
    authenticatedSession();
    const { GET } = await exportRoute();
    const res = await GET(makeGetRequest(baseUrl));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid type");
  });

  it("returns 400 when type parameter is invalid", async () => {
    authenticatedSession();
    const { GET } = await exportRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?type=unknown`));
    expect(res.status).toBe(400);
  });

  it("returns CSV for leads export with correct headers", async () => {
    authenticatedSession();
    const mockLeads = [
      {
        id: "lead_1",
        name: "Alice",
        email: "alice@test.com",
        phone: "555-1234",
        source: "web",
        status: "new",
        score: 85,
        stage: "prospect",
        value: 1000,
        createdAt: new Date("2025-06-01T00:00:00Z"),
      },
    ];
    mockPrisma.lead.findMany.mockResolvedValue(mockLeads);

    const { GET } = await exportRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?type=leads`));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toContain("leads-");
    expect(res.headers.get("content-disposition")).toContain(".csv");

    const csv = await res.text();
    expect(csv).toContain("id,name,email,phone,source,status,score,stage,value,createdAt");
    expect(csv).toContain("lead_1");
    expect(csv).toContain("Alice");
  });

  it("returns CSV for activities export", async () => {
    authenticatedSession();
    const mockActivities = [
      {
        id: "act_1",
        type: "email_sent",
        title: "Outreach sent",
        description: "Sent intro email",
        createdAt: new Date("2025-06-01T00:00:00Z"),
      },
    ];
    mockPrisma.activityEvent.findMany.mockResolvedValue(mockActivities);

    const { GET } = await exportRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?type=activities`));

    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain("id,type,title,description,createdAt");
    expect(csv).toContain("act_1");
  });

  it("returns 429 when rate limited", async () => {
    authenticatedSession();
    denyRateLimit();
    const { GET } = await exportRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?type=leads`));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Rate limit exceeded");
  });
});

// ===========================================================================
// 4. POST /api/payments/checkout
// ===========================================================================
describe("POST /api/payments/checkout", () => {
  const url = "http://localhost/api/payments/checkout";

  function authenticatedCheckoutSession() {
    mockGetSession.mockResolvedValue({
      account: {
        id: ACCOUNT_ID,
        email: "user@test.com",
        name: "Test User",
        client: { id: CLIENT_ID, businessName: "Test Business" },
      },
    });
  }

  function unauthenticatedCheckoutSession() {
    mockGetSession.mockResolvedValue(null);
  }

  it("returns 401 when not authenticated", async () => {
    unauthenticatedCheckoutSession();
    const { POST } = await checkoutRoute();
    const res = await POST(makePostRequest(url, { bundleId: "starter" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await checkoutRoute();
    const res = await POST(makePostRequest(url, { bundleId: "starter" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 400 when neither bundleId nor services provided", async () => {
    authenticatedCheckoutSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(makePostRequest(url, { billingInterval: "monthly" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No bundle or services specified");
  });

  it("returns 400 when bundleId is invalid", async () => {
    authenticatedCheckoutSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetBundleById.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(makePostRequest(url, { bundleId: "nonexistent" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid bundle");
  });

  it("returns 400 when service ID is invalid", async () => {
    authenticatedCheckoutSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetServiceById.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(makePostRequest(url, { services: ["bad-service"] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid service");
  });

  it("returns 400 with validation errors for malformed input", async () => {
    authenticatedCheckoutSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { billingInterval: "weekly" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 200 with checkout URL for valid bundle", async () => {
    authenticatedCheckoutSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetBundleById.mockReturnValue({
      id: "starter",
      name: "Starter",
      price: 99,
      annualPrice: 79,
      services: ["seo", "social"],
    });
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/session/cs_test_123",
    });

    const { POST } = await checkoutRoute();
    const res = await POST(makePostRequest(url, { bundleId: "starter" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session/cs_test_123");
    expect(body.sessionId).toBe("cs_test_123");
  });

  it("returns 500 when Stripe is not configured", async () => {
    authenticatedCheckoutSession();
    mockAssertStripeConfigured.mockImplementation(() => {
      throw new Error("STRIPE_SECRET_KEY is required but not configured");
    });
    const { POST } = await checkoutRoute();
    const res = await POST(makePostRequest(url, { bundleId: "starter" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create checkout session");
  });
});
