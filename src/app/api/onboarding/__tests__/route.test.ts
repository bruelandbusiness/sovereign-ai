import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockStripe,
  mockAssertStripeConfigured,
  mockCreateAccountWithMagicLink,
  mockSendWelcomeEmail,
} = vi.hoisted(() => ({
  mockPrisma: {
    agency: { findUnique: vi.fn() },
    auditLog: { findFirst: vi.fn(), create: vi.fn() },
    client: { upsert: vi.fn(), findUnique: vi.fn() },
    referralCode: { updateMany: vi.fn() },
    affiliateReferral: { updateMany: vi.fn() },
  },
  mockStripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  mockAssertStripeConfigured: vi.fn(),
  mockCreateAccountWithMagicLink: vi.fn(),
  mockSendWelcomeEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: mockStripe,
  assertStripeConfigured: mockAssertStripeConfigured,
}));

vi.mock("@/lib/auth", () => ({
  createAccountWithMagicLink: mockCreateAccountWithMagicLink,
}));

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
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

// Lazy import after mocks
const onboardingRoute = () => import("@/app/api/onboarding/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    step1: {
      businessName: "Test Plumbing",
      ownerName: "Jane Doe",
      email: "jane@example.com",
      phone: "555-1234",
      website: "https://testplumbing.com",
      city: "Denver",
      state: "CO",
      industry: "plumbing",
      serviceAreaRadius: "25 miles",
    },
    step2: {
      averageJobValue: "$500",
      monthlyMarketingBudget: "$1000",
      currentMarketingActivities: ["google_ads"],
      topCompetitors: "Competitor A",
      googleBusinessProfile: "yes",
      primaryGoal: "More leads",
      biggestChallenge: "Visibility",
    },
    step3: {
      selectedServices: ["lead-gen"],
    },
    step4: {
      gbpEmail: "",
      gaEmail: "",
      socialAccounts: "",
      additionalNotes: "",
    },
    billingInterval: "monthly",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  // Default: stripe works, returns a checkout session
  mockAssertStripeConfigured.mockReturnValue(undefined);
  mockStripe.checkout.sessions.create.mockResolvedValue({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/test",
  });
  // No duplicate checkout found by default
  mockPrisma.auditLog.findFirst.mockResolvedValue(null);
  mockPrisma.auditLog.create.mockResolvedValue({});
  // Default: account creation works
  mockCreateAccountWithMagicLink.mockResolvedValue({
    account: { id: "acc_1" },
    url: "https://app.test/api/auth/verify?token=abc",
  });
  mockSendWelcomeEmail.mockResolvedValue(undefined);
  mockPrisma.client.upsert.mockResolvedValue({});
});

// ===========================================================================
// Input validation
// ===========================================================================
describe("POST /api/onboarding — validation", () => {
  it("returns 400 when body is empty object", async () => {
    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.detail).toBe("Invalid input");
    expect(json.errors).toBeDefined();
    expect(json.errors.length).toBeGreaterThan(0);
  });

  it("returns 400 when step1.businessName is missing", async () => {
    const payload = validPayload();
    (payload.step1 as Record<string, unknown>).businessName = "";

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Business name")]),
    );
  });

  it("returns 400 when step1.email is invalid", async () => {
    const payload = validPayload();
    (payload.step1 as Record<string, unknown>).email = "not-an-email";

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
  });

  it("returns 400 when step3.selectedServices is empty", async () => {
    const payload = validPayload();
    payload.step3.selectedServices = [];

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("At least one service")]),
    );
  });

  it("returns 400 when billingInterval is invalid", async () => {
    const payload = validPayload({ billingInterval: "weekly" });

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// Nullable optional fields (agencySlug, coupon)
// ===========================================================================
describe("POST /api/onboarding — nullable optional fields", () => {
  it("accepts null agencySlug", async () => {
    const payload = validPayload({ agencySlug: null });

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(payload));
    // Should not be a 400 — the endpoint either creates checkout or account
    expect(res.status).toBe(200);
  });

  it("accepts null coupon", async () => {
    const payload = validPayload({ coupon: null });

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
  });

  it("accepts undefined (omitted) agencySlug and coupon", async () => {
    const payload = validPayload();
    // agencySlug and coupon are not set

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// Happy path — Stripe checkout created
// ===========================================================================
describe("POST /api/onboarding — happy path with Stripe", () => {
  it("returns success with checkout_url and session_id", async () => {
    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(validPayload()));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.checkout_url).toBe("https://checkout.stripe.com/test");
    expect(json.session_id).toBe("cs_test_123");
  });

  it("calls stripe.checkout.sessions.create with correct email", async () => {
    const { POST } = await onboardingRoute();
    await POST(makeRequest(validPayload()));

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
    const params = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(params.customer_email).toBe("jane@example.com");
    expect(params.mode).toBe("subscription");
  });
});

// ===========================================================================
// Stripe failure fallback — free account creation
// ===========================================================================
describe("POST /api/onboarding — Stripe fallback", () => {
  it("creates a free account when Stripe throws", async () => {
    mockAssertStripeConfigured.mockImplementation(() => {
      throw new Error("STRIPE_SECRET_KEY is required but not configured");
    });

    const { POST } = await onboardingRoute();
    const res = await POST(makeRequest(validPayload()));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toBe("Onboarding submitted successfully");

    expect(mockCreateAccountWithMagicLink).toHaveBeenCalledWith(
      "jane@example.com",
      "Jane Doe",
    );
    expect(mockSendWelcomeEmail).toHaveBeenCalled();
  });
});

// ===========================================================================
// Agency slug lookup
// ===========================================================================
describe("POST /api/onboarding — agency slug", () => {
  it("looks up agency when agencySlug is provided", async () => {
    mockPrisma.agency.findUnique.mockResolvedValue({
      id: "agency_1",
      slug: "my-agency",
    });

    const { POST } = await onboardingRoute();
    await POST(makeRequest(validPayload({ agencySlug: "my-agency" })));

    expect(mockPrisma.agency.findUnique).toHaveBeenCalledWith({
      where: { slug: "my-agency" },
    });
  });
});

// ===========================================================================
// Coupon handling
// ===========================================================================
describe("POST /api/onboarding — coupon", () => {
  it("applies allowed coupon to checkout params", async () => {
    const { POST } = await onboardingRoute();
    await POST(makeRequest(validPayload({ coupon: "reactivation_20" })));

    const params = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(params.discounts).toEqual([{ coupon: "reactivation_20" }]);
    // Trial should be removed when coupon is applied
    expect(params.subscription_data).toBeUndefined();
  });

  it("ignores unknown coupon codes", async () => {
    const { POST } = await onboardingRoute();
    await POST(makeRequest(validPayload({ coupon: "fake_coupon_99" })));

    const params = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(params.discounts).toBeUndefined();
    expect(params.subscription_data).toBeDefined();
  });
});

// ===========================================================================
// Error case — malformed JSON
// ===========================================================================
describe("POST /api/onboarding — server error", () => {
  it("returns 500 when request.json() throws", async () => {
    const { POST } = await onboardingRoute();
    const badRequest = new NextRequest("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json{{{",
    });
    const res = await POST(badRequest);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.detail).toBe("Onboarding submission failed");
  });
});
