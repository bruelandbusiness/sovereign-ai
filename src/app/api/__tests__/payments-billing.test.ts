import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRateLimitByIP,
  mockSetRateLimitHeaders,
  mockGetSession,
  mockAssertStripeConfigured,
  mockStripe,
  mockGetBundleById,
  mockGetServiceById,
} = vi.hoisted(() => {
  const mockSetRateLimitHeaders = vi.fn((res: unknown) => res);

  return {
    mockPrisma: {
      subscription: { findUnique: vi.fn() },
      clientService: { findMany: vi.fn() },
      newsletterSubscriber: { upsert: vi.fn() },
      lead: { findFirst: vi.fn(), create: vi.fn() },
      client: { findFirst: vi.fn() },
    },
    mockRateLimitByIP: vi.fn(),
    mockSetRateLimitHeaders,
    mockGetSession: vi.fn(),
    mockAssertStripeConfigured: vi.fn(),
    mockStripe: {
      checkout: {
        sessions: { create: vi.fn() },
      },
      billingPortal: {
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
  setRateLimitHeaders: mockSetRateLimitHeaders,
}));

vi.mock("@/lib/auth", () => ({
  getSession: mockGetSession,
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
    warnWithCause: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Lazy route imports (after mocks)
// ---------------------------------------------------------------------------
const checkoutRoute = () =>
  import("@/app/api/payments/checkout/route");
const billingRoute = () =>
  import("@/app/api/dashboard/billing/route");
const billingPortalRoute = () =>
  import("@/app/api/dashboard/billing/portal/route");
const paymentsPortalRoute = () =>
  import("@/app/api/payments/portal/route");
const newsletterRoute = () =>
  import("@/app/api/newsletter/route");
const newsletterSubscribeRoute = () =>
  import("@/app/api/newsletter/subscribe/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CLIENT_ID = "client_test_123";
const ACCOUNT_ID = "account_test_456";
const FIXED_RESET_AT = 1800000000;

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

function _makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

function allowRateLimit() {
  const rl = {
    allowed: true,
    remaining: 9,
    limit: 10,
    resetAt: FIXED_RESET_AT,
  };
  mockRateLimitByIP.mockResolvedValue(rl);
  return rl;
}

function denyRateLimit() {
  const rl = {
    allowed: false,
    remaining: 0,
    limit: 10,
    resetAt: FIXED_RESET_AT,
  };
  mockRateLimitByIP.mockResolvedValue(rl);
  return rl;
}

function authenticatedSession(
  opts?: { noClient?: boolean },
) {
  mockGetSession.mockResolvedValue({
    account: {
      id: ACCOUNT_ID,
      email: "user@test.com",
      name: "Test User",
      client: opts?.noClient
        ? undefined
        : { id: CLIENT_ID, businessName: "Test Business" },
    },
  });
}

function unauthenticatedSession() {
  mockGetSession.mockResolvedValue(null);
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  allowRateLimit();
});

// ===========================================================================
// 1. POST /api/payments/checkout
// ===========================================================================
describe("POST /api/payments/checkout", () => {
  const url = "http://localhost/api/payments/checkout";

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { bundleId: "starter" }),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 401 when not authenticated", async () => {
    unauthenticatedSession();
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { bundleId: "starter" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid JSON body", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 with validation errors for invalid billingInterval", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { billingInterval: "weekly" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body).toHaveProperty("errors");
  });

  it("returns 400 when neither bundleId nor services provided", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { billingInterval: "monthly" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No bundle or services specified");
  });

  it("returns 400 when bundleId is invalid", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetBundleById.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { bundleId: "nonexistent" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid bundle");
  });

  it("returns 400 when a service ID is invalid", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetServiceById.mockReturnValue(undefined);
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { services: ["bad-service"] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid service");
  });

  it("returns 200 with checkout URL for valid bundle (monthly)", async () => {
    authenticatedSession();
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
    const res = await POST(
      makePostRequest(url, { bundleId: "starter" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe(
      "https://checkout.stripe.com/session/cs_test_123",
    );
    expect(body.sessionId).toBe("cs_test_123");
  });

  it("creates Stripe session with annual pricing when billingInterval is annual", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetBundleById.mockReturnValue({
      id: "starter",
      name: "Starter",
      price: 99,
      annualPrice: 79,
      services: ["seo"],
    });
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_annual",
      url: "https://checkout.stripe.com/annual",
    });

    const { POST } = await checkoutRoute();
    await POST(
      makePostRequest(url, {
        bundleId: "starter",
        billingInterval: "annual",
      }),
    );
    expect(
      mockStripe.checkout.sessions.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: Math.round(79 * 12 * 100),
              recurring: { interval: "year" },
            }),
          }),
        ],
      }),
    );
  });

  it("returns 200 with checkout URL for valid services list", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetServiceById.mockImplementation((id: string) => {
      if (id === "seo") return { id: "seo", name: "SEO", price: 50 };
      if (id === "social")
        return { id: "social", name: "Social", price: 30 };
      return undefined;
    });
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_svc_456",
      url: "https://checkout.stripe.com/session/cs_svc_456",
    });

    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { services: ["seo", "social"] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe("cs_svc_456");
  });

  it("uses existing Stripe customer ID when available", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetBundleById.mockReturnValue({
      id: "starter",
      name: "Starter",
      price: 99,
      annualPrice: 79,
      services: ["seo"],
    });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      stripeCustId: "cus_existing_123",
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_reuse",
      url: "https://checkout.stripe.com/reuse",
    });

    const { POST } = await checkoutRoute();
    await POST(
      makePostRequest(url, { bundleId: "starter" }),
    );
    expect(
      mockStripe.checkout.sessions.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing_123",
      }),
    );
  });

  it("returns 500 when Stripe is not configured", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockImplementation(() => {
      throw new Error(
        "STRIPE_SECRET_KEY is required but not configured",
      );
    });
    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { bundleId: "starter" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create checkout session");
  });

  it("returns 500 when Stripe session creation fails", async () => {
    authenticatedSession();
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockGetBundleById.mockReturnValue({
      id: "starter",
      name: "Starter",
      price: 99,
      annualPrice: 79,
      services: ["seo"],
    });
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockStripe.checkout.sessions.create.mockRejectedValue(
      new Error("Stripe API down"),
    );

    const { POST } = await checkoutRoute();
    const res = await POST(
      makePostRequest(url, { bundleId: "starter" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create checkout session");
  });
});

// ===========================================================================
// 2. GET /api/dashboard/billing
// ===========================================================================
describe("GET /api/dashboard/billing", () => {
  const _url = "http://localhost/api/dashboard/billing";

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await billingRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session has no client", async () => {
    mockGetSession.mockResolvedValue({
      account: { id: ACCOUNT_ID, email: "user@test.com" },
    });
    const { GET } = await billingRoute();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns plan:null when no subscription exists", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockPrisma.clientService.findMany.mockResolvedValue([]);

    const { GET } = await billingRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan).toBeNull();
    expect(body.status).toBe("none");
    expect(body.monthlyAmount).toBe(0);
    expect(body.services).toEqual([]);
  });

  it("returns billing data with bundle plan", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      bundleId: "diy",
      monthlyAmount: 49700,
      status: "active",
      currentPeriodEnd: "2026-04-28T00:00:00Z",
      stripeCustId: "cus_abc",
      isTrial: false,
      trialEndsAt: null,
    });
    mockPrisma.clientService.findMany.mockResolvedValue([
      {
        serviceId: "chatbot",
        status: "active",
        activatedAt: "2026-03-01T00:00:00Z",
      },
    ]);
    mockGetBundleById.mockReturnValue({
      id: "diy",
      name: "DIY",
      price: 497,
    });
    mockGetServiceById.mockReturnValue({
      id: "chatbot",
      name: "AI Chatbot",
    });

    const { GET } = await billingRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.id).toBe("diy");
    expect(body.plan.name).toBe("DIY");
    expect(body.status).toBe("active");
    expect(body.monthlyAmount).toBe(497);
    expect(body.hasStripeCustomer).toBe(true);
    expect(body.services).toHaveLength(1);
    expect(body.services[0].name).toBe("AI Chatbot");
  });

  it("returns trialing status when isTrial is true", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      bundleId: null,
      monthlyAmount: 10000,
      status: "active",
      currentPeriodEnd: "2026-04-28T00:00:00Z",
      stripeCustId: "cus_trial",
      isTrial: true,
      trialEndsAt: "2026-04-11T00:00:00Z",
    });
    mockPrisma.clientService.findMany.mockResolvedValue([]);
    mockGetBundleById.mockReturnValue(null);

    const { GET } = await billingRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("trialing");
    expect(body.plan.id).toBe("custom");
    expect(body.trialEnd).toBe("2026-04-11T00:00:00Z");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockGetSession.mockRejectedValue(new Error("DB crash"));
    const { GET } = await billingRoute();
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch billing information");
  });
});

// ===========================================================================
// 3. POST /api/dashboard/billing/portal
// ===========================================================================
describe("POST /api/dashboard/billing/portal", () => {
  const url = "http://localhost/api/dashboard/billing/portal";

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await billingPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 401 when not authenticated", async () => {
    unauthenticatedSession();
    const { POST } = await billingPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session has no client", async () => {
    mockGetSession.mockResolvedValue({
      account: { id: ACCOUNT_ID, email: "user@test.com" },
    });
    const { POST } = await billingPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no Stripe customer found", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    const { POST } = await billingPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("No Stripe customer found");
  });

  it("returns 400 when subscription exists but has no stripeCustId", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      stripeCustId: null,
    });
    const { POST } = await billingPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
  });

  it("returns 200 with portal URL on success", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      stripeCustId: "cus_portal_123",
    });
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/portal_abc",
    });

    const { POST } = await billingPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe(
      "https://billing.stripe.com/session/portal_abc",
    );
  });

  it("passes correct customer and return_url to Stripe", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      stripeCustId: "cus_portal_456",
    });
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/test",
    });

    const { POST } = await billingPortalRoute();
    await POST(makePostRequest(url, {}));
    expect(
      mockStripe.billingPortal.sessions.create,
    ).toHaveBeenCalledWith({
      customer: "cus_portal_456",
      return_url: expect.stringContaining("/dashboard/billing"),
    });
  });

  it("returns 500 when Stripe portal creation fails", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      stripeCustId: "cus_err",
    });
    mockAssertStripeConfigured.mockReturnValue(undefined);
    mockStripe.billingPortal.sessions.create.mockRejectedValue(
      new Error("Stripe error"),
    );

    const { POST } = await billingPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe(
      "Failed to create billing portal session",
    );
  });
});

// ===========================================================================
// 4. POST /api/payments/portal
// ===========================================================================
describe("POST /api/payments/portal", () => {
  const url = "http://localhost/api/payments/portal";

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await paymentsPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 401 when not authenticated", async () => {
    unauthenticatedSession();
    const { POST } = await paymentsPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when no client profile found", async () => {
    authenticatedSession({ noClient: true });
    const { POST } = await paymentsPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No client profile found");
  });

  it("returns 404 when no Stripe customer found", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    const { POST } = await paymentsPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No Stripe customer found");
  });

  it("returns 200 with portal URL on success", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      stripeCustId: "cus_pay_portal",
    });
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/pay_portal",
    });

    const { POST } = await paymentsPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe(
      "https://billing.stripe.com/pay_portal",
    );
  });

  it("returns 500 when Stripe throws an error", async () => {
    authenticatedSession();
    mockPrisma.subscription.findUnique.mockResolvedValue({
      stripeCustId: "cus_fail",
    });
    mockStripe.billingPortal.sessions.create.mockRejectedValue(
      new Error("Stripe unavailable"),
    );

    const { POST } = await paymentsPortalRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe(
      "Failed to create billing portal session",
    );
  });
});

// ===========================================================================
// 5. POST /api/newsletter
// ===========================================================================
describe("POST /api/newsletter", () => {
  const url = "http://localhost/api/newsletter";

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await newsletterRoute();
    const res = await POST(
      makePostRequest(url, { email: "user@test.com" }),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Too many requests");
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await newsletterRoute();
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "broken{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await newsletterRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body).toHaveProperty("details");
  });

  it("returns 400 when email is invalid format", async () => {
    const { POST } = await newsletterRoute();
    const res = await POST(
      makePostRequest(url, { email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 200 with success on valid email", async () => {
    mockPrisma.newsletterSubscriber.upsert.mockResolvedValue({});
    const { POST } = await newsletterRoute();
    const res = await POST(
      makePostRequest(url, { email: "valid@example.com" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("normalizes email to lowercase", async () => {
    mockPrisma.newsletterSubscriber.upsert.mockResolvedValue({});
    const { POST } = await newsletterRoute();
    await POST(
      makePostRequest(url, { email: "User@Example.COM" }),
    );
    expect(
      mockPrisma.newsletterSubscriber.upsert,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "user@example.com" },
        create: { email: "user@example.com" },
      }),
    );
  });

  it("returns 200 even when DB upsert fails (graceful degradation)", async () => {
    mockPrisma.newsletterSubscriber.upsert.mockRejectedValue(
      new Error("Model not found"),
    );
    const { POST } = await newsletterRoute();
    const res = await POST(
      makePostRequest(url, { email: "user@test.com" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ===========================================================================
// 6. POST /api/newsletter/subscribe
// ===========================================================================
describe("POST /api/newsletter/subscribe", () => {
  const url = "http://localhost/api/newsletter/subscribe";

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await newsletterSubscribeRoute();
    const res = await POST(
      makePostRequest(url, { email: "user@test.com" }),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await newsletterSubscribeRoute();
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "bad-json!!!",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await newsletterSubscribeRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body).toHaveProperty("details");
  });

  it("returns 400 when email is invalid", async () => {
    const { POST } = await newsletterSubscribeRoute();
    const res = await POST(
      makePostRequest(url, { email: "not-valid" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 201 for a new subscriber", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({
      id: "default_client",
    });
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: "lead_new" });

    const { POST } = await newsletterSubscribeRoute();
    const res = await POST(
      makePostRequest(url, { email: "new@example.com" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 200 for a duplicate subscriber (idempotent)", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({
      id: "default_client",
    });
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead_existing",
      email: "dup@example.com",
    });

    const { POST } = await newsletterSubscribeRoute();
    const res = await POST(
      makePostRequest(url, { email: "dup@example.com" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
  });

  it("creates lead with correct data fields", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({
      id: "client_default",
    });
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: "lead_x" });

    const { POST } = await newsletterSubscribeRoute();
    await POST(
      makePostRequest(url, { email: "alice@example.com" }),
    );
    expect(mockPrisma.lead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: "client_default",
        email: "alice@example.com",
        source: "newsletter",
        status: "new",
        score: 20,
        name: "alice",
      }),
    });
  });

  it("returns 500 when database throws", async () => {
    mockPrisma.client.findFirst.mockRejectedValue(
      new Error("DB error"),
    );

    const { POST } = await newsletterSubscribeRoute();
    const res = await POST(
      makePostRequest(url, { email: "err@example.com" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
