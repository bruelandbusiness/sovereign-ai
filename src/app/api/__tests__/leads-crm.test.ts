/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks — available at vi.mock() factory time
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRequireClient,
  mockGetSession,
  mockRateLimitByIP,
  HoistedAuthError,
} = vi.hoisted(() => {
  class HoistedAuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  return {
    HoistedAuthError,
    mockPrisma: {
      lead: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      prospectLead: { create: vi.fn() },
      followUpSequence: { findFirst: vi.fn() },
      revenueEvent: { create: vi.fn() },
    },
    mockRequireClient: vi.fn(),
    mockGetSession: vi.fn(),
    mockRateLimitByIP: vi.fn(),
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

vi.mock("@/lib/auth", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...original,
    rateLimitByIP: mockRateLimitByIP,
  };
});

vi.mock("@/lib/api-response", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-response")>();
  return original;
});

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    wrap: vi.fn(
      (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
    ),
  },
}));

vi.mock("@/lib/followup", () => ({
  enrollInFollowUp: vi.fn(),
}));

vi.mock("@/lib/funnel-emails", () => ({
  NURTURE_SEQUENCE: [],
  renderNurtureEmail: vi.fn(),
}));

vi.mock("@/lib/email-queue", () => ({
  queueEmail: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Lazy route imports (after mocks are wired)
// ---------------------------------------------------------------------------
const dashboardLeadsRoute = () =>
  import("@/app/api/dashboard/leads/route");
const leadsOutcomeRoute = () =>
  import("@/app/api/dashboard/leads/[id]/outcome/route");
const leadsCaptureRoute = () =>
  import("@/app/api/leads/capture/route");
const leadsProxyRoute = () =>
  import("@/app/api/leads/route");
const leadsStatsRoute = () =>
  import("@/app/api/leads/stats/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CLIENT_ID = "client_test_123";
const ACCOUNT_ID = "account_test_456";
const LEAD_ID = "lead_abc";

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

function makePatchRequest(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

function authenticatedSession() {
  mockRequireClient.mockResolvedValue({
    clientId: CLIENT_ID,
    accountId: ACCOUNT_ID,
    session: { account: { id: ACCOUNT_ID, client: { id: CLIENT_ID } } },
  });
}

function unauthenticated() {
  mockRequireClient.mockRejectedValue(
    new HoistedAuthError("Unauthorized", 401),
  );
}

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: LEAD_ID,
    clientId: CLIENT_ID,
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "512-555-1234",
    source: "website",
    status: "new",
    score: 75,
    value: 5000,
    notes: "Interested in kitchen remodel",
    createdAt: new Date("2025-06-01T00:00:00Z"),
    lastContactedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  // Default: rate limiter allows requests
  mockRateLimitByIP.mockResolvedValue({ allowed: true, remaining: 9 });
});

// ===========================================================================
// 1. GET /api/dashboard/leads
// ===========================================================================
describe("GET /api/dashboard/leads", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await dashboardLeadsRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 200 with mapped leads on success", async () => {
    authenticatedSession();
    const dbLeads = [makeLead(), makeLead({ id: "lead_2", name: "Bob Smith" })];
    mockPrisma.lead.findMany.mockResolvedValue(dbLeads);

    const { GET } = await dashboardLeadsRoute();
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0]).toEqual({
      id: LEAD_ID,
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "512-555-1234",
      source: "website",
      date: "2025-06-01T00:00:00.000Z",
      status: "new",
      score: 75,
    });
  });

  it("queries leads for the authenticated client only", async () => {
    authenticatedSession();
    mockPrisma.lead.findMany.mockResolvedValue([]);

    const { GET } = await dashboardLeadsRoute();
    await GET();

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: CLIENT_ID },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    );
  });

  it("sets Cache-Control header", async () => {
    authenticatedSession();
    mockPrisma.lead.findMany.mockResolvedValue([]);

    const { GET } = await dashboardLeadsRoute();
    const res = await GET();

    expect(res.headers.get("Cache-Control")).toBe(
      "private, max-age=15, stale-while-revalidate=10",
    );
  });

  it("returns empty array when no leads exist", async () => {
    authenticatedSession();
    mockPrisma.lead.findMany.mockResolvedValue([]);

    const { GET } = await dashboardLeadsRoute();
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("defaults email and phone to empty string when null", async () => {
    authenticatedSession();
    mockPrisma.lead.findMany.mockResolvedValue([
      makeLead({ email: null, phone: null }),
    ]);

    const { GET } = await dashboardLeadsRoute();
    const res = await GET();

    const json = await res.json();
    expect(json.data[0].email).toBe("");
    expect(json.data[0].phone).toBe("");
  });

  it("returns 500 when database throws", async () => {
    authenticatedSession();
    mockPrisma.lead.findMany.mockRejectedValue(new Error("DB error"));

    const { GET } = await dashboardLeadsRoute();
    const res = await GET();

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch leads");
  });
});

// ===========================================================================
// 2. PATCH /api/dashboard/leads/[id]/outcome
// ===========================================================================
describe("PATCH /api/dashboard/leads/[id]/outcome", () => {
  const url = "http://localhost/api/dashboard/leads/lead_abc/outcome";

  function callPatch(body: unknown) {
    return leadsOutcomeRoute().then(({ PATCH }) =>
      PATCH(makePatchRequest(url, body), {
        params: Promise.resolve({ id: LEAD_ID }),
      }),
    );
  }

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const res = await callPatch({ status: "contacted" });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 400 when status is missing", async () => {
    authenticatedSession();
    const res = await callPatch({});
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
    expect(json).toHaveProperty("details");
  });

  it("returns 400 when status is invalid enum value", async () => {
    authenticatedSession();
    const res = await callPatch({ status: "invalid" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when jobValue is negative", async () => {
    authenticatedSession();
    const res = await callPatch({ status: "won", jobValue: -100 });
    expect(res.status).toBe(400);
  });

  it("returns 400 when notes exceed max length", async () => {
    authenticatedSession();
    const res = await callPatch({
      status: "contacted",
      notes: "x".repeat(5001),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when lead does not belong to client", async () => {
    authenticatedSession();
    mockPrisma.lead.findFirst.mockResolvedValue(null);

    const res = await callPatch({ status: "contacted" });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Lead not found");
  });

  it("updates lead status to qualified when outcome is contacted", async () => {
    authenticatedSession();
    const lead = makeLead();
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue({
      ...lead,
      status: "qualified",
      lastContactedAt: new Date(),
    });

    const res = await callPatch({ status: "contacted" });
    expect(res.status).toBe(200);

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: LEAD_ID },
      data: expect.objectContaining({
        status: "qualified",
        lastContactedAt: expect.any(Date),
      }),
    });
  });

  it("updates lead status to appointment when outcome is booked", async () => {
    authenticatedSession();
    const lead = makeLead();
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue({
      ...lead,
      status: "appointment",
    });

    const res = await callPatch({ status: "booked" });
    expect(res.status).toBe(200);

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: LEAD_ID },
      data: expect.objectContaining({ status: "appointment" }),
    });
  });

  it("creates RevenueEvent when status is won with jobValue", async () => {
    authenticatedSession();
    const lead = makeLead({ source: "referral" });
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue({
      ...lead,
      status: "won",
      value: 150000,
    });
    mockPrisma.revenueEvent.create.mockResolvedValue({});

    const res = await callPatch({ status: "won", jobValue: 1500 });
    expect(res.status).toBe(200);

    expect(mockPrisma.revenueEvent.create).toHaveBeenCalledWith({
      data: {
        clientId: CLIENT_ID,
        leadId: LEAD_ID,
        eventType: "payment_received",
        channel: "referral",
        amount: 150000, // 1500 * 100 cents
      },
    });
  });

  it("does not create RevenueEvent when jobValue is 0", async () => {
    authenticatedSession();
    const lead = makeLead();
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue({ ...lead, status: "won" });

    await callPatch({ status: "won", jobValue: 0 });

    expect(mockPrisma.revenueEvent.create).not.toHaveBeenCalled();
  });

  it("does not create RevenueEvent when status is not won", async () => {
    authenticatedSession();
    const lead = makeLead();
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue({
      ...lead,
      status: "qualified",
    });

    await callPatch({ status: "contacted", jobValue: 500 });

    expect(mockPrisma.revenueEvent.create).not.toHaveBeenCalled();
  });

  it("preserves existing notes when notes not provided", async () => {
    authenticatedSession();
    const lead = makeLead({ notes: "Original notes" });
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue({
      ...lead,
      status: "qualified",
    });

    await callPatch({ status: "contacted" });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: LEAD_ID },
      data: expect.objectContaining({ notes: "Original notes" }),
    });
  });

  it("returns updated lead with value in dollars", async () => {
    authenticatedSession();
    const lead = makeLead();
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue({
      id: LEAD_ID,
      status: "won",
      value: 250000, // 2500 in cents
      notes: "Deal closed",
    });
    mockPrisma.revenueEvent.create.mockResolvedValue({});

    const res = await callPatch({
      status: "won",
      jobValue: 2500,
      notes: "Deal closed",
    });
    const json = await res.json();
    expect(json.value).toBe(2500); // 250000 / 100
    expect(json.status).toBe("won");
    expect(json.notes).toBe("Deal closed");
  });

  it("returns 500 when database update throws", async () => {
    authenticatedSession();
    mockPrisma.lead.findFirst.mockResolvedValue(makeLead());
    mockPrisma.lead.update.mockRejectedValue(new Error("DB write error"));

    const res = await callPatch({ status: "contacted" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to update lead outcome");
  });

  it("verifies lead ownership by querying with clientId", async () => {
    authenticatedSession();
    mockPrisma.lead.findFirst.mockResolvedValue(null);

    await callPatch({ status: "contacted" });

    expect(mockPrisma.lead.findFirst).toHaveBeenCalledWith({
      where: { id: LEAD_ID, clientId: CLIENT_ID },
      select: expect.objectContaining({ id: true, source: true }),
    });
  });
});

// ===========================================================================
// 3. POST /api/leads/capture
// ===========================================================================
describe("POST /api/leads/capture", () => {
  const url = "http://localhost/api/leads/capture";

  it("returns 429 when rate limited", async () => {
    mockRateLimitByIP.mockResolvedValue({ allowed: false, remaining: 0 });
    const { POST } = await leadsCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Test", email: "a@b.com" }),
    );
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Too many requests");
  });

  it("returns 400 when name is missing", async () => {
    const { POST } = await leadsCaptureRoute();
    const res = await POST(makePostRequest(url, { email: "a@b.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await leadsCaptureRoute();
    const res = await POST(makePostRequest(url, { name: "Test User" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid format", async () => {
    const { POST } = await leadsCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Test", email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    const { POST } = await leadsCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "", email: "a@b.com" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with success and id on valid minimal request", async () => {
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_001" });
    const { POST } = await leadsCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Alice", email: "alice@test.com" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBe("lead_001");
  });

  it("returns 200 with all optional fields", async () => {
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_002" });
    const { POST } = await leadsCaptureRoute();
    const res = await POST(
      makePostRequest(url, {
        name: "Bob",
        email: "bob@test.com",
        phone: "555-1234",
        source: "referral",
        trade: "plumbing",
        partnerSlug: "partner-1",
        referralCode: "REF123",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "spring_2025",
        metadata: { customField: "value" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("creates lead in database with correct data", async () => {
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_003" });
    const { POST } = await leadsCaptureRoute();
    await POST(
      makePostRequest(url, {
        name: "Carol",
        email: "carol@test.com",
        phone: "555-9999",
        source: "chatbot",
        trade: "hvac",
      }),
    );
    expect(mockPrisma.prospectLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Carol",
        email: "carol@test.com",
        phone: "555-9999",
        source: "chatbot",
        trade: "hvac",
      }),
    });
  });

  it("returns 500 when prisma create fails", async () => {
    mockPrisma.prospectLead.create.mockRejectedValue(new Error("DB error"));
    const { POST } = await leadsCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Dave", email: "dave@test.com" }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to capture lead");
  });

  it("does not require authentication (public endpoint)", async () => {
    unauthenticated();
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_public" });
    const { POST } = await leadsCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Public", email: "pub@test.com" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("extracts IP from x-forwarded-for header for rate limiting", async () => {
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_ip" });
    const { POST } = await leadsCaptureRoute();
    await POST(
      makePostRequest(url, { name: "IP Test", email: "ip@test.com" }, {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      }),
    );
    expect(mockRateLimitByIP).toHaveBeenCalledWith(
      "1.2.3.4",
      "lead-capture",
      10,
    );
  });
});

// ===========================================================================
// 4. GET /api/leads (proxy route)
// ===========================================================================
describe("GET /api/leads (proxy)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await leadsProxyRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns proxied data on success", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const leadsData = [{ id: "1", name: "Lead A" }];
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(leadsData),
    } as Response);

    const { GET } = await leadsProxyRoute();
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(leadsData);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");
  });

  it("returns backend status when backend returns error", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    const { GET } = await leadsProxyRoute();
    const res = await GET();

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch leads");
  });

  it("returns 502 when fetch throws (network error)", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("ECONNREFUSED"));

    const { GET } = await leadsProxyRoute();
    const res = await GET();

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Could not connect to backend");
  });
});

// ===========================================================================
// 5. GET /api/leads/stats (proxy with cache)
// ===========================================================================
describe("GET /api/leads/stats (proxy with cache)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await leadsStatsRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns stats data on success", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" }, clientId: "c1" });
    const statsData = { total: 42, converted: 10 };
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(statsData),
    } as Response);

    const { GET } = await leadsStatsRoute();
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(statsData);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");
  });

  it("returns 502 when backend returns error", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { GET } = await leadsStatsRoute();
    const res = await GET();

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Could not connect to backend");
  });

  it("returns 502 when fetch throws (network error)", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("timeout"));

    const { GET } = await leadsStatsRoute();
    const res = await GET();

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Could not connect to backend");
  });
});
