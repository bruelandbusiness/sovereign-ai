import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks — available at vi.mock() factory time
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRequireClient,
  mockRateLimitByIP,
  mockSetRateLimitHeaders,
  mockSendSms,
  mockAssertStripeConfigured,
  mockStripe,
  mockValidateBody,
  HoistedAuthError,
} = vi.hoisted(() => {
  class HoistedAuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  const mockSetRateLimitHeaders = vi.fn((res: unknown) => res);

  return {
    HoistedAuthError,
    mockPrisma: {
      client: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      governanceRule: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      quote: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      invoice: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      activityEvent: { create: vi.fn() },
      notification: { create: vi.fn() },
      $transaction: vi.fn(),
    },
    mockRequireClient: vi.fn(),
    mockRateLimitByIP: vi.fn(),
    mockSetRateLimitHeaders,
    mockSendSms: vi.fn(),
    mockAssertStripeConfigured: vi.fn(),
    mockStripe: {
      prices: { create: vi.fn() },
      paymentLinks: { create: vi.fn() },
    },
    mockValidateBody: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/require-client", () => ({
  requireClient: mockRequireClient,
  AuthError: HoistedAuthError,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitByIP: mockRateLimitByIP,
  setRateLimitHeaders: mockSetRateLimitHeaders,
}));

vi.mock("@/lib/twilio", () => ({
  sendSms: mockSendSms,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: mockStripe,
  assertStripeConfigured: mockAssertStripeConfigured,
}));

vi.mock("@/lib/validate", () => ({
  validateBody: mockValidateBody,
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
// Lazy route imports (after mocks are wired)
// ---------------------------------------------------------------------------
const accountRoute = () =>
  import("@/app/api/dashboard/settings/account/route");
const automationRoute = () =>
  import("@/app/api/dashboard/settings/automation/route");
const quotesRoute = () =>
  import("@/app/api/dashboard/quotes/route");
const quoteByIdRoute = () =>
  import("@/app/api/dashboard/quotes/[id]/route");
const invoicesRoute = () =>
  import("@/app/api/dashboard/invoices/route");
const invoiceByIdRoute = () =>
  import("@/app/api/dashboard/invoices/[id]/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CLIENT_ID = "client_test_123";
const ACCOUNT_ID = "account_test_456";
const FIXED_RESET_AT = 1800000000;

function authenticatedSession() {
  mockRequireClient.mockResolvedValue({
    clientId: CLIENT_ID,
    accountId: ACCOUNT_ID,
    session: {
      account: {
        id: ACCOUNT_ID,
        email: "owner@test.com",
        client: { id: CLIENT_ID },
      },
    },
  });
}

function unauthenticated() {
  mockRequireClient.mockRejectedValue(
    new HoistedAuthError("Unauthorized", 401),
  );
}

function allowRateLimit() {
  const rl = {
    allowed: true,
    remaining: 19,
    limit: 20,
    resetAt: FIXED_RESET_AT,
  };
  mockRateLimitByIP.mockResolvedValue(rl);
  return rl;
}

function denyRateLimit() {
  const rl = {
    allowed: false,
    remaining: 0,
    limit: 20,
    resetAt: FIXED_RESET_AT,
  };
  mockRateLimitByIP.mockResolvedValue(rl);
  return rl;
}

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

function makePutRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePostRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  allowRateLimit();
});

// ===========================================================================
// 1. GET /api/dashboard/settings/account
// ===========================================================================
describe("GET /api/dashboard/settings/account", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await accountRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 404 when client not found", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockResolvedValue(null);
    const { GET } = await accountRoute();
    const res = await GET();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Client not found");
  });

  it("returns profile with default notifications when onboardingData is null", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockResolvedValue({
      ownerName: "Jane Doe",
      businessName: "Doe Plumbing",
      onboardingData: null,
    });
    const { GET } = await accountRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.profile.ownerName).toBe("Jane Doe");
    expect(json.profile.businessName).toBe("Doe Plumbing");
    expect(json.profile.email).toBe("owner@test.com");
    expect(json.profile.notifications.newLeads).toBe(true);
    expect(json.profile.notifications.frequency).toBe("realtime");
  });

  it("returns parsed notification preferences from onboardingData", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockResolvedValue({
      ownerName: "Jane",
      businessName: "Biz",
      onboardingData: JSON.stringify({
        notificationPreferences: {
          newLeads: false,
          reportsReady: true,
          billingAlerts: false,
          reviewAlerts: true,
          marketingEmails: false,
          pushEnabled: true,
          frequency: "daily_digest",
        },
      }),
    });
    const { GET } = await accountRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.profile.notifications.newLeads).toBe(false);
    expect(json.profile.notifications.pushEnabled).toBe(true);
    expect(json.profile.notifications.frequency).toBe("daily_digest");
  });

  it("returns 500 on DB failure", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockRejectedValue(new Error("DB down"));
    const { GET } = await accountRoute();
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch account settings");
  });
});

// ===========================================================================
// 2. PUT /api/dashboard/settings/account
// ===========================================================================
describe("PUT /api/dashboard/settings/account", () => {
  const url = "http://localhost/api/dashboard/settings/account";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { PUT } = await accountRoute();
    const res = await PUT(
      makePutRequest(url, { ownerName: "New Name" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { PUT } = await accountRoute();
    const res = await PUT(
      makePutRequest(url, { ownerName: "New Name" }),
    );
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Too many requests");
  });

  it("returns 400 on invalid JSON body", async () => {
    authenticatedSession();
    const { PUT } = await accountRoute();
    const req = new NextRequest(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "not-json{",
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON body");
  });

  it("returns 400 on validation failure (ownerName too long)", async () => {
    authenticatedSession();
    const { PUT } = await accountRoute();
    const res = await PUT(
      makePutRequest(url, { ownerName: "x".repeat(201) }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 404 when client not found", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockResolvedValue(null);
    const { PUT } = await accountRoute();
    const res = await PUT(
      makePutRequest(url, { ownerName: "Name" }),
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Client not found");
  });

  it("updates ownerName and businessName successfully", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockResolvedValue({
      id: CLIENT_ID,
      onboardingData: null,
    });
    mockPrisma.client.update.mockResolvedValue({});
    const { PUT } = await accountRoute();
    const res = await PUT(
      makePutRequest(url, {
        ownerName: "Updated Name",
        businessName: "Updated Biz",
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockPrisma.client.update).toHaveBeenCalledWith({
      where: { id: CLIENT_ID },
      data: expect.objectContaining({
        ownerName: "Updated Name",
        businessName: "Updated Biz",
      }),
    });
  });

  it("merges notification preferences into onboardingData", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockResolvedValue({
      id: CLIENT_ID,
      onboardingData: JSON.stringify({ existingField: "keep" }),
    });
    mockPrisma.client.update.mockResolvedValue({});
    const { PUT } = await accountRoute();
    const res = await PUT(
      makePutRequest(url, {
        notifications: { newLeads: false, frequency: "weekly_digest" },
      }),
    );
    expect(res.status).toBe(200);
    const updateCall = mockPrisma.client.update.mock.calls[0][0];
    const savedData = JSON.parse(updateCall.data.onboardingData as string);
    expect(savedData.existingField).toBe("keep");
    expect(savedData.notificationPreferences.newLeads).toBe(false);
    expect(savedData.notificationPreferences.frequency).toBe("weekly_digest");
  });

  it("returns 500 on DB failure during update", async () => {
    authenticatedSession();
    mockPrisma.client.findUnique.mockResolvedValue({
      id: CLIENT_ID,
      onboardingData: null,
    });
    mockPrisma.client.update.mockRejectedValue(new Error("DB error"));
    const { PUT } = await accountRoute();
    const res = await PUT(
      makePutRequest(url, { ownerName: "Test" }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to update account settings");
  });
});

// ===========================================================================
// 3. GET /api/dashboard/settings/automation
// ===========================================================================
describe("GET /api/dashboard/settings/automation", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await automationRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns default settings when no rules exist", async () => {
    authenticatedSession();
    mockPrisma.governanceRule.findMany.mockResolvedValue([]);
    const { GET } = await automationRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.settings.dailyBudgetCents).toBe(5000);
    expect(json.settings.monthlyBudgetCents).toBe(100000);
    expect(json.settings.requireContentApproval).toBe(false);
    expect(json.settings.requireReviewApproval).toBe(false);
    expect(json.settings.requireAdApproval).toBe(false);
  });

  it("reconstructs settings from existing rules", async () => {
    authenticatedSession();
    mockPrisma.governanceRule.findMany.mockResolvedValue([
      {
        ruleType: "budget_limit",
        config: JSON.stringify({
          dailyLimitCents: 8000,
          monthlyLimitCents: 200000,
        }),
      },
      {
        ruleType: "approval_required",
        config: JSON.stringify({
          actions: ["content.publish", "review.respond"],
          adBudgetThreshold: 100,
        }),
      },
    ]);
    const { GET } = await automationRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.settings.dailyBudgetCents).toBe(8000);
    expect(json.settings.monthlyBudgetCents).toBe(200000);
    expect(json.settings.requireContentApproval).toBe(true);
    expect(json.settings.requireReviewApproval).toBe(true);
    expect(json.settings.requireAdApproval).toBe(false);
    expect(json.settings.adBudgetThreshold).toBe(100);
  });

  it("returns 500 on DB failure", async () => {
    authenticatedSession();
    mockPrisma.governanceRule.findMany.mockRejectedValue(
      new Error("DB error"),
    );
    const { GET } = await automationRoute();
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch automation settings");
  });
});

// ===========================================================================
// 4. PUT /api/dashboard/settings/automation
// ===========================================================================
describe("PUT /api/dashboard/settings/automation", () => {
  const url = "http://localhost/api/dashboard/settings/automation";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { PUT } = await automationRoute();
    const req = new Request(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dailyBudgetCents: 5000 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on validation failure", async () => {
    authenticatedSession();
    const { PUT } = await automationRoute();
    const req = new Request(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dailyBudgetCents: -1 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("creates new budget rule when none exists", async () => {
    authenticatedSession();
    mockPrisma.governanceRule.findFirst.mockResolvedValue(null);
    mockPrisma.governanceRule.create.mockResolvedValue({});
    const { PUT } = await automationRoute();
    const req = new Request(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dailyBudgetCents: 7000 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockPrisma.governanceRule.create).toHaveBeenCalled();
  });

  it("updates existing budget rule", async () => {
    authenticatedSession();
    // First findFirst returns existing budget rule, second returns null (no approval rule)
    mockPrisma.governanceRule.findFirst
      .mockResolvedValueOnce({ id: "rule_1", ruleType: "budget_limit" })
      .mockResolvedValueOnce(null);
    mockPrisma.governanceRule.update.mockResolvedValue({});
    mockPrisma.governanceRule.create.mockResolvedValue({});
    const { PUT } = await automationRoute();
    const req = new Request(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dailyBudgetCents: 9000,
        requireContentApproval: true,
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.governanceRule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "rule_1" },
      }),
    );
  });

  it("returns 500 on DB failure", async () => {
    authenticatedSession();
    mockPrisma.governanceRule.findFirst.mockRejectedValue(
      new Error("DB error"),
    );
    const { PUT } = await automationRoute();
    const req = new Request(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dailyBudgetCents: 5000 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to update automation settings");
  });
});

// ===========================================================================
// 5. GET /api/dashboard/quotes
// ===========================================================================
describe("GET /api/dashboard/quotes", () => {
  const url = "http://localhost/api/dashboard/quotes";
  const NOW = new Date("2026-01-15T12:00:00Z");

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await quotesRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns paginated quotes list", async () => {
    authenticatedSession();
    mockPrisma.quote.findMany.mockResolvedValue([
      {
        id: "q1",
        customerName: "Alice",
        customerPhone: null,
        customerEmail: null,
        title: "Roof Repair",
        description: "Fix roof",
        lineItems: JSON.stringify([]),
        subtotal: 10000,
        tax: 800,
        total: 10800,
        status: "draft",
        sentAt: null,
        expiresAt: null,
        acceptedAt: null,
        createdAt: NOW,
      },
    ]);
    mockPrisma.quote.count.mockResolvedValue(1);
    const { GET } = await quotesRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.quotes).toHaveLength(1);
    expect(json.quotes[0].customerName).toBe("Alice");
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
  });

  it("applies status filter from query params", async () => {
    authenticatedSession();
    mockPrisma.quote.findMany.mockResolvedValue([]);
    mockPrisma.quote.count.mockResolvedValue(0);
    const { GET } = await quotesRoute();
    await GET(makeGetRequest(`${url}?status=sent`));
    expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: CLIENT_ID, status: "sent" },
      }),
    );
  });
});

// ===========================================================================
// 6. POST /api/dashboard/quotes
// ===========================================================================
describe("POST /api/dashboard/quotes", () => {
  const url = "http://localhost/api/dashboard/quotes";

  const validQuoteBody = {
    customerName: "Bob",
    title: "Plumbing Job",
    description: "Fix pipes",
    lineItems: [{ description: "Labor", quantity: 2, unitPrice: 5000, total: 10000 }],
    subtotal: 10000,
    total: 10000,
  };

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    mockValidateBody.mockResolvedValue({
      success: true,
      data: validQuoteBody,
    });
    const { POST } = await quotesRoute();
    const res = await POST(makePostRequest(url, validQuoteBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 on validation failure", async () => {
    authenticatedSession();
    const { NextResponse } = await import("next/server");
    mockValidateBody.mockResolvedValue({
      success: false,
      response: NextResponse.json(
        { error: "Validation failed", details: {} },
        { status: 400 },
      ),
    });
    const { POST } = await quotesRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
  });

  it("creates a quote and returns 201", async () => {
    authenticatedSession();
    const NOW = new Date("2026-01-15T12:00:00Z");
    mockValidateBody.mockResolvedValue({
      success: true,
      data: validQuoteBody,
    });
    mockPrisma.quote.create.mockResolvedValue({
      id: "q_new",
      customerName: "Bob",
      title: "Plumbing Job",
      total: 10000,
      status: "draft",
      createdAt: NOW,
    });
    const { POST } = await quotesRoute();
    const res = await POST(makePostRequest(url, validQuoteBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("q_new");
    expect(json.status).toBe("draft");
  });
});

// ===========================================================================
// 7. GET /api/dashboard/quotes/[id]
// ===========================================================================
describe("GET /api/dashboard/quotes/[id]", () => {
  const NOW = new Date("2026-01-15T12:00:00Z");

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await quoteByIdRoute();
    const res = await GET(
      makeGetRequest("http://localhost/api/dashboard/quotes/q1"),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when quote not found", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue(null);
    const { GET } = await quoteByIdRoute();
    const res = await GET(
      makeGetRequest("http://localhost/api/dashboard/quotes/q_missing"),
      { params: Promise.resolve({ id: "q_missing" }) },
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Quote not found");
  });

  it("returns quote detail on success", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue({
      id: "q1",
      customerName: "Alice",
      customerPhone: "555-1234",
      customerEmail: "alice@test.com",
      title: "Roof Repair",
      description: "Fix it",
      lineItems: JSON.stringify([{ description: "Labor", quantity: 1, unitPrice: 5000, total: 5000 }]),
      subtotal: 5000,
      tax: 400,
      total: 5400,
      status: "draft",
      sentAt: null,
      expiresAt: null,
      acceptedAt: null,
      createdAt: NOW,
    });
    const { GET } = await quoteByIdRoute();
    const res = await GET(
      makeGetRequest("http://localhost/api/dashboard/quotes/q1"),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("q1");
    expect(json.customerName).toBe("Alice");
    expect(json.lineItems).toHaveLength(1);
  });
});

// ===========================================================================
// 8. PATCH /api/dashboard/quotes/[id]
// ===========================================================================
describe("PATCH /api/dashboard/quotes/[id]", () => {
  const url = "http://localhost/api/dashboard/quotes/q1";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { PATCH } = await quoteByIdRoute();
    const res = await PATCH(
      makePatchRequest(url, { title: "New Title" }),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when quote not found", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue(null);
    const { PATCH } = await quoteByIdRoute();
    const res = await PATCH(
      makePatchRequest(url, { title: "New Title" }),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid JSON body", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue({ id: "q1", clientId: CLIENT_ID });
    const { PATCH } = await quoteByIdRoute();
    const req = new NextRequest(url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: "bad-json{",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "q1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON body");
  });

  it("returns 400 on validation failure (title too long)", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue({ id: "q1", clientId: CLIENT_ID });
    const { PATCH } = await quoteByIdRoute();
    const res = await PATCH(
      makePatchRequest(url, { title: "x".repeat(201) }),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("updates quote successfully", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue({ id: "q1", clientId: CLIENT_ID });
    mockPrisma.quote.update.mockResolvedValue({
      id: "q1",
      status: "sent",
      total: 9999,
    });
    const { PATCH } = await quoteByIdRoute();
    const res = await PATCH(
      makePatchRequest(url, { status: "sent", total: 9999 }),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Quote updated");
    expect(json.status).toBe("sent");
  });
});

// ===========================================================================
// 9. POST /api/dashboard/quotes/[id] (send quote)
// ===========================================================================
describe("POST /api/dashboard/quotes/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await quoteByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/quotes/q1", {}),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when quote not found", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue(null);
    const { POST } = await quoteByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/quotes/q1", {}),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("sends quote via SMS and updates status", async () => {
    authenticatedSession();
    mockPrisma.quote.findFirst.mockResolvedValue({
      id: "q1",
      clientId: CLIENT_ID,
      customerName: "Alice",
      customerPhone: "+15551234567",
      title: "Roof Repair",
      total: 10000,
      shareToken: "tok_abc",
      expiresAt: null,
    });
    mockPrisma.client.findUnique.mockResolvedValue({
      businessName: "Doe Plumbing",
    });
    mockSendSms.mockResolvedValue({ success: true });
    mockPrisma.quote.update.mockResolvedValue({});
    mockPrisma.activityEvent.create.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({});

    const { POST } = await quoteByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/quotes/q1", {}),
      { params: Promise.resolve({ id: "q1" }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSendSms).toHaveBeenCalled();
    expect(mockPrisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "sent" }),
      }),
    );
  });
});

// ===========================================================================
// 10. GET /api/dashboard/invoices
// ===========================================================================
describe("GET /api/dashboard/invoices", () => {
  const url = "http://localhost/api/dashboard/invoices";
  const NOW = new Date("2026-01-15T12:00:00Z");

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await invoicesRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns paginated invoices list", async () => {
    authenticatedSession();
    mockPrisma.invoice.findMany.mockResolvedValue([
      {
        id: "inv1",
        customerName: "Carol",
        customerPhone: "+15551234567",
        customerEmail: null,
        description: "Pipe repair",
        amount: 15000,
        status: "sent",
        stripePaymentLinkUrl: "https://pay.stripe.com/test",
        paidAt: null,
        sentAt: NOW,
        createdAt: NOW,
      },
    ]);
    mockPrisma.invoice.count.mockResolvedValue(1);
    const { GET } = await invoicesRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].customerName).toBe("Carol");
    expect(json.pagination.total).toBe(1);
  });

  it("applies status filter", async () => {
    authenticatedSession();
    mockPrisma.invoice.findMany.mockResolvedValue([]);
    mockPrisma.invoice.count.mockResolvedValue(0);
    const { GET } = await invoicesRoute();
    await GET(makeGetRequest(`${url}?status=paid`));
    expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: CLIENT_ID, status: "paid" },
      }),
    );
  });

  it("returns 500 on DB failure", async () => {
    authenticatedSession();
    mockPrisma.invoice.findMany.mockRejectedValue(new Error("DB error"));
    const { GET } = await invoicesRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});

// ===========================================================================
// 11. POST /api/dashboard/invoices
// ===========================================================================
describe("POST /api/dashboard/invoices", () => {
  const url = "http://localhost/api/dashboard/invoices";

  const validInvoiceBody = {
    customerName: "Dave",
    customerPhone: "+15551234567",
    description: "AC Repair",
    amount: 25000,
  };

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    mockValidateBody.mockResolvedValue({
      success: true,
      data: validInvoiceBody,
    });
    const { POST } = await invoicesRoute();
    const res = await POST(makePostRequest(url, validInvoiceBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 on validation failure", async () => {
    authenticatedSession();
    const { NextResponse } = await import("next/server");
    mockValidateBody.mockResolvedValue({
      success: false,
      response: NextResponse.json(
        { error: "Validation failed", details: {} },
        { status: 400 },
      ),
    });
    const { POST } = await invoicesRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
  });

  it("creates invoice with Stripe payment link and sends SMS", async () => {
    authenticatedSession();
    const NOW = new Date("2026-01-15T12:00:00Z");
    mockValidateBody.mockResolvedValue({
      success: true,
      data: validInvoiceBody,
    });
    mockPrisma.client.findUnique.mockResolvedValue({
      businessName: "Doe HVAC",
    });
    mockStripe.prices.create.mockResolvedValue({ id: "price_123" });
    mockStripe.paymentLinks.create.mockResolvedValue({
      id: "plink_123",
      url: "https://pay.stripe.com/plink_123",
    });
    const createdInvoice = {
      id: "inv_new",
      customerName: "Dave",
      customerPhone: "+15551234567",
      customerEmail: null,
      description: "AC Repair",
      amount: 25000,
      status: "sent",
      stripePaymentLinkUrl: "https://pay.stripe.com/plink_123",
      sentAt: NOW,
      createdAt: NOW,
    };
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          invoice: { create: vi.fn().mockResolvedValue(createdInvoice) },
          activityEvent: { create: vi.fn().mockResolvedValue({}) },
          notification: { create: vi.fn().mockResolvedValue({}) },
        });
      },
    );
    mockSendSms.mockResolvedValue({ success: true });

    const { POST } = await invoicesRoute();
    const res = await POST(makePostRequest(url, validInvoiceBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("inv_new");
    expect(mockStripe.prices.create).toHaveBeenCalled();
    expect(mockStripe.paymentLinks.create).toHaveBeenCalled();
    expect(mockSendSms).toHaveBeenCalled();
  });

  it("returns 500 when Stripe payment link creation fails", async () => {
    authenticatedSession();
    mockValidateBody.mockResolvedValue({
      success: true,
      data: validInvoiceBody,
    });
    mockPrisma.client.findUnique.mockResolvedValue({
      businessName: "Doe HVAC",
    });
    mockStripe.prices.create.mockRejectedValue(new Error("Stripe error"));

    const { POST } = await invoicesRoute();
    const res = await POST(makePostRequest(url, validInvoiceBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Failed to create payment link");
  });
});

// ===========================================================================
// 12. GET /api/dashboard/invoices/[id]
// ===========================================================================
describe("GET /api/dashboard/invoices/[id]", () => {
  const NOW = new Date("2026-01-15T12:00:00Z");

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await invoiceByIdRoute();
    const res = await GET(
      makeGetRequest("http://localhost/api/dashboard/invoices/inv1"),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when invoice not found", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    const { GET } = await invoiceByIdRoute();
    const res = await GET(
      makeGetRequest("http://localhost/api/dashboard/invoices/inv_missing"),
      { params: Promise.resolve({ id: "inv_missing" }) },
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Invoice not found");
  });

  it("returns invoice detail on success", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      customerName: "Carol",
      customerPhone: "+15551234567",
      customerEmail: "carol@test.com",
      description: "Pipe repair",
      amount: 15000,
      status: "sent",
      stripePaymentLinkUrl: "https://pay.stripe.com/test",
      paidAt: null,
      sentAt: NOW,
      createdAt: NOW,
    });
    const { GET } = await invoiceByIdRoute();
    const res = await GET(
      makeGetRequest("http://localhost/api/dashboard/invoices/inv1"),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("inv1");
    expect(json.customerEmail).toBe("carol@test.com");
  });

  it("returns 500 on DB failure", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockRejectedValue(new Error("DB error"));
    const { GET } = await invoiceByIdRoute();
    const res = await GET(
      makeGetRequest("http://localhost/api/dashboard/invoices/inv1"),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});

// ===========================================================================
// 13. POST /api/dashboard/invoices/[id] (resend SMS)
// ===========================================================================
describe("POST /api/dashboard/invoices/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await invoiceByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when invoice not found", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    const { POST } = await invoiceByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when invoice is already paid", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "paid",
    });
    const { POST } = await invoiceByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invoice is already paid");
  });

  it("returns 400 when invoice is canceled", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "canceled",
    });
    const { POST } = await invoiceByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invoice has been canceled");
  });

  it("resends SMS and updates sentAt on success", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "sent",
      customerPhone: "+15551234567",
      description: "Pipe repair",
      amount: 15000,
      stripePaymentLinkUrl: "https://pay.stripe.com/test",
    });
    mockPrisma.client.findUnique.mockResolvedValue({
      businessName: "Doe Plumbing",
    });
    mockSendSms.mockResolvedValue({ success: true });
    mockPrisma.invoice.update.mockResolvedValue({});

    const { POST } = await invoiceByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSendSms).toHaveBeenCalled();
    expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "sent" }),
      }),
    );
  });

  it("returns 500 when SMS sending fails", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "sent",
      customerPhone: "+15551234567",
      description: "Pipe repair",
      amount: 15000,
      stripePaymentLinkUrl: "https://pay.stripe.com/test",
    });
    mockPrisma.client.findUnique.mockResolvedValue({
      businessName: "Doe Plumbing",
    });
    mockSendSms.mockResolvedValue({ success: false, error: "Twilio error" });

    const { POST } = await invoiceByIdRoute();
    const res = await POST(
      makePostRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to send SMS");
  });
});

// ===========================================================================
// 14. PUT /api/dashboard/invoices/[id] (mark as paid)
// ===========================================================================
describe("PUT /api/dashboard/invoices/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { PUT } = await invoiceByIdRoute();
    const res = await PUT(
      makePutRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when invoice not found", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    const { PUT } = await invoiceByIdRoute();
    const res = await PUT(
      makePutRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when invoice is already paid", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "paid",
    });
    const { PUT } = await invoiceByIdRoute();
    const res = await PUT(
      makePutRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invoice is already paid");
  });

  it("returns 400 when invoice is canceled", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "canceled",
    });
    const { PUT } = await invoiceByIdRoute();
    const res = await PUT(
      makePutRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cannot mark a canceled invoice as paid");
  });

  it("marks invoice as paid via transaction", async () => {
    authenticatedSession();
    const NOW = new Date("2026-01-15T12:00:00Z");
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "sent",
      amount: 15000,
      customerName: "Carol",
    });
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          invoice: {
            update: vi.fn().mockResolvedValue({
              id: "inv1",
              status: "paid",
              paidAt: NOW,
            }),
          },
          activityEvent: { create: vi.fn().mockResolvedValue({}) },
          notification: { create: vi.fn().mockResolvedValue({}) },
        });
      },
    );

    const { PUT } = await invoiceByIdRoute();
    const res = await PUT(
      makePutRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("paid");
    expect(json.message).toBe("Invoice marked as paid");
  });

  it("returns 500 on DB failure", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "sent",
      amount: 15000,
      customerName: "Carol",
    });
    mockPrisma.$transaction.mockRejectedValue(new Error("DB error"));

    const { PUT } = await invoiceByIdRoute();
    const res = await PUT(
      makePutRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});

// ===========================================================================
// 15. PATCH /api/dashboard/invoices/[id] (cancel invoice)
// ===========================================================================
describe("PATCH /api/dashboard/invoices/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { PATCH } = await invoiceByIdRoute();
    const res = await PATCH(
      makePatchRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when invoice not found", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    const { PATCH } = await invoiceByIdRoute();
    const res = await PATCH(
      makePatchRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when trying to cancel a paid invoice", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "paid",
    });
    const { PATCH } = await invoiceByIdRoute();
    const res = await PATCH(
      makePatchRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cannot cancel a paid invoice");
  });

  it("cancels invoice successfully", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "sent",
    });
    mockPrisma.invoice.update.mockResolvedValue({
      id: "inv1",
      status: "canceled",
    });

    const { PATCH } = await invoiceByIdRoute();
    const res = await PATCH(
      makePatchRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("canceled");
    expect(json.message).toBe("Invoice canceled");
  });

  it("returns 500 on DB failure", async () => {
    authenticatedSession();
    mockPrisma.invoice.findFirst.mockResolvedValue({
      id: "inv1",
      clientId: CLIENT_ID,
      status: "sent",
    });
    mockPrisma.invoice.update.mockRejectedValue(new Error("DB error"));

    const { PATCH } = await invoiceByIdRoute();
    const res = await PATCH(
      makePatchRequest("http://localhost/api/dashboard/invoices/inv1", {}),
      { params: Promise.resolve({ id: "inv1" }) },
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});
