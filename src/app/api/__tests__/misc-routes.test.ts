import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRequireClient,
  mockRateLimitByIP,
  mockCalculateROI,
  mockGetAllCircuitBreakerStatus,
  mockScoreLead,
  mockTrackRevenueEvent,
  mockSendEmail,
  mockNurtureSequence,
  mockRenderNurtureEmail,
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
      $queryRaw: vi.fn(),
      franchiseLocation: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      activityEvent: { create: vi.fn() },
      client: { findFirst: vi.fn() },
      lead: { create: vi.fn() },
    },
    mockRequireClient: vi.fn(),
    mockRateLimitByIP: vi.fn(),
    mockCalculateROI: vi.fn(),
    mockGetAllCircuitBreakerStatus: vi.fn(),
    mockScoreLead: vi.fn(),
    mockTrackRevenueEvent: vi.fn(),
    mockSendEmail: vi.fn(),
    mockNurtureSequence: [
      { subject: "Welcome!", body: "Hello {{name}}" },
    ],
    mockRenderNurtureEmail: vi.fn(),
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
}));

vi.mock("@/lib/roi", () => ({
  calculateROI: mockCalculateROI,
}));

vi.mock("@/lib/circuit-breaker", () => ({
  getAllCircuitBreakerStatus: mockGetAllCircuitBreakerStatus,
}));

vi.mock("@/lib/lead-scoring", () => ({
  scoreLead: mockScoreLead,
}));

vi.mock("@/lib/revenue-attribution", () => ({
  trackRevenueEvent: mockTrackRevenueEvent,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("@/lib/funnel-emails", () => ({
  NURTURE_SEQUENCE: mockNurtureSequence,
  renderNurtureEmail: mockRenderNurtureEmail,
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

// Mock package.json for health route
vi.mock("../../../../package.json", () => ({ version: "1.0.0-test" }));

// ---------------------------------------------------------------------------
// Lazy route imports (after mocks)
// ---------------------------------------------------------------------------
const roiRoute = () => import("@/app/api/dashboard/roi/route");
const franchiseRoute = () => import("@/app/api/dashboard/franchise/route");
const healthRoute = () => import("@/app/api/health/route");
const funnelCaptureRoute = () => import("@/app/api/funnel-capture/route");

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

function allowRateLimit() {
  mockRateLimitByIP.mockResolvedValue({ allowed: true, remaining: 9 });
}

function denyRateLimit() {
  mockRateLimitByIP.mockResolvedValue({ allowed: false, remaining: 0 });
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  allowRateLimit();
  mockGetAllCircuitBreakerStatus.mockReturnValue({});
  mockTrackRevenueEvent.mockResolvedValue(undefined);
  mockSendEmail.mockResolvedValue(undefined);
  mockRenderNurtureEmail.mockReturnValue("<html>Welcome</html>");
});

afterEach(() => {
  vi.useRealTimers();
});

// ===========================================================================
// 1. GET /api/dashboard/roi
// ===========================================================================
describe("GET /api/dashboard/roi", () => {
  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await roiRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 200 with investment, revenue, and roi on success", async () => {
    authenticatedSession();
    mockCalculateROI.mockResolvedValue({
      totalSpend: 50000, // 500.00 in cents
      totalRevenue: 150000, // 1500.00 in cents
      roi: 200,
    });
    const { GET } = await roiRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.investment).toBe(500);
    expect(body.revenue).toBe(1500);
    expect(body.roi).toBe(200);
  });

  it("calls calculateROI with clientId and a 30-day period", async () => {
    authenticatedSession();
    mockCalculateROI.mockResolvedValue({
      totalSpend: 0,
      totalRevenue: 0,
      roi: 0,
    });
    const { GET } = await roiRoute();
    await GET();
    expect(mockCalculateROI).toHaveBeenCalledWith(
      CLIENT_ID,
      expect.any(Date),
      expect.any(Date),
    );
    const [, start, end] = mockCalculateROI.mock.calls[0];
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it("sets Cache-Control header", async () => {
    authenticatedSession();
    mockCalculateROI.mockResolvedValue({
      totalSpend: 0,
      totalRevenue: 0,
      roi: 0,
    });
    const { GET } = await roiRoute();
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toContain("private");
  });

  it("returns 500 when calculateROI throws", async () => {
    authenticatedSession();
    mockCalculateROI.mockRejectedValue(new Error("DB error"));
    const { GET } = await roiRoute();
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch ROI data");
  });
});

// ===========================================================================
// 2. GET /api/dashboard/franchise
// ===========================================================================
describe("GET /api/dashboard/franchise", () => {
  const makeFranchiseLocation = (overrides: Record<string, unknown> = {}) => ({
    id: "loc_1",
    name: "Downtown",
    address: "123 Main St",
    city: "Portland",
    state: "OR",
    zip: "97201",
    phone: "555-0101",
    manager: "Jane Doe",
    isActive: true,
    leadsThisMonth: 10,
    revenueThisMonth: 5000,
    bookingsThisMonth: 8,
    avgRating: 4.5,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  });

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await franchiseRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 200 with kpis and locations on success", async () => {
    authenticatedSession();
    const locations = [
      makeFranchiseLocation(),
      makeFranchiseLocation({
        id: "loc_2",
        name: "Uptown",
        leadsThisMonth: 5,
        revenueThisMonth: 3000,
        avgRating: 4.0,
      }),
    ];
    mockPrisma.franchiseLocation.findMany.mockResolvedValue(locations);
    const { GET } = await franchiseRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.kpis.totalLocations).toBe(2);
    expect(body.kpis.combinedRevenue).toBe(8000);
    expect(body.kpis.totalLeads).toBe(15);
    expect(body.kpis.avgRating).toBe(4.3); // (4.5 + 4.0) / 2 = 4.25, rounded to 4.3
    expect(body.locations).toHaveLength(2);
  });

  it("returns empty locations with zeroed kpis when no locations exist", async () => {
    authenticatedSession();
    mockPrisma.franchiseLocation.findMany.mockResolvedValue([]);
    const { GET } = await franchiseRoute();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.kpis.totalLocations).toBe(0);
    expect(body.kpis.combinedRevenue).toBe(0);
    expect(body.kpis.totalLeads).toBe(0);
    expect(body.kpis.avgRating).toBe(0);
    expect(body.locations).toHaveLength(0);
  });

  it("excludes inactive locations from avgRating calculation", async () => {
    authenticatedSession();
    const locations = [
      makeFranchiseLocation({ avgRating: 5.0, isActive: true }),
      makeFranchiseLocation({
        id: "loc_inactive",
        avgRating: 1.0,
        isActive: false,
      }),
    ];
    mockPrisma.franchiseLocation.findMany.mockResolvedValue(locations);
    const { GET } = await franchiseRoute();
    const res = await GET();
    const body = await res.json();
    expect(body.kpis.avgRating).toBe(5.0);
  });

  it("sets Cache-Control header", async () => {
    authenticatedSession();
    mockPrisma.franchiseLocation.findMany.mockResolvedValue([]);
    const { GET } = await franchiseRoute();
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toContain("private");
  });
});

// ===========================================================================
// 3. POST /api/dashboard/franchise
// ===========================================================================
describe("POST /api/dashboard/franchise", () => {
  const url = "http://localhost/api/dashboard/franchise";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await franchiseRoute();
    const res = await POST(makePostRequest(url, { name: "Test Location" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    authenticatedSession();
    const { POST } = await franchiseRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body).toHaveProperty("details");
  });

  it("returns 400 when name is empty string", async () => {
    authenticatedSession();
    const { POST } = await franchiseRoute();
    const res = await POST(makePostRequest(url, { name: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    authenticatedSession();
    const { POST } = await franchiseRoute();
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("creates a franchise location and returns it", async () => {
    authenticatedSession();
    const createdLocation = {
      id: "loc_new",
      name: "New Location",
      address: null,
      city: "Seattle",
      state: "WA",
      zip: null,
      phone: null,
      manager: null,
      isActive: true,
      leadsThisMonth: 0,
      revenueThisMonth: 0,
      bookingsThisMonth: 0,
      avgRating: 0,
      createdAt: new Date("2025-06-15T00:00:00Z"),
    };
    mockPrisma.franchiseLocation.create.mockResolvedValue(createdLocation);
    mockPrisma.activityEvent.create.mockResolvedValue({});

    const { POST } = await franchiseRoute();
    const res = await POST(
      makePostRequest(url, { name: "New Location", city: "Seattle", state: "WA" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("loc_new");
    expect(body.name).toBe("New Location");
    expect(body.city).toBe("Seattle");
  });

  it("passes correct data to prisma.franchiseLocation.create", async () => {
    authenticatedSession();
    mockPrisma.franchiseLocation.create.mockResolvedValue({
      id: "loc_x",
      name: "Full",
      address: "456 Oak Ave",
      city: "Denver",
      state: "CO",
      zip: "80202",
      phone: "555-9999",
      manager: "Bob Smith",
      isActive: true,
      leadsThisMonth: 0,
      revenueThisMonth: 0,
      bookingsThisMonth: 0,
      avgRating: 0,
      createdAt: new Date(),
    });

    const { POST } = await franchiseRoute();
    await POST(
      makePostRequest(url, {
        name: "Full",
        city: "Denver",
        state: "CO",
        address: "456 Oak Ave",
        zip: "80202",
        phone: "555-9999",
        manager: "Bob Smith",
      }),
    );
    expect(mockPrisma.franchiseLocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: CLIENT_ID,
        name: "Full",
        city: "Denver",
        state: "CO",
        address: "456 Oak Ave",
      }),
    });
  });

  it("returns 500 when prisma create fails", async () => {
    authenticatedSession();
    mockPrisma.franchiseLocation.create.mockRejectedValue(
      new Error("DB write error"),
    );
    const { POST } = await franchiseRoute();
    const res = await POST(makePostRequest(url, { name: "Fail Location" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create franchise location");
  });

  it("still succeeds when activity event creation fails", async () => {
    authenticatedSession();
    mockPrisma.franchiseLocation.create.mockResolvedValue({
      id: "loc_ok",
      name: "OK",
      address: null,
      city: "",
      state: "",
      zip: null,
      phone: null,
      manager: null,
      isActive: true,
      leadsThisMonth: 0,
      revenueThisMonth: 0,
      bookingsThisMonth: 0,
      avgRating: 0,
      createdAt: new Date(),
    });
    mockPrisma.activityEvent.create.mockRejectedValue(
      new Error("Activity log failed"),
    );
    const { POST } = await franchiseRoute();
    const res = await POST(makePostRequest(url, { name: "OK" }));
    // Non-critical failure should not affect the response
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 4. GET /api/health
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
    mockPrisma.$queryRaw.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve([{ ok: 1 }]), 5000),
        ),
    );
    const { GET } = await healthRoute();
    const resPromise = GET(makeGetRequest("http://localhost/api/health"));
    await vi.advanceTimersByTimeAsync(3000);
    const res = await resPromise;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("timeout");
  });

  it("returns 503 with status error when database throws", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("ECONNREFUSED"));
    const { GET } = await healthRoute();
    const res = await GET(makeGetRequest("http://localhost/api/health"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.checks.database.status).toBe("error");
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

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { GET } = await healthRoute();
    const res = await GET(makeGetRequest("http://localhost/api/health"));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("reports circuit breaker status when breakers exist", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    mockGetAllCircuitBreakerStatus.mockReturnValue({
      email: { state: "closed", failures: 0 },
    });
    const { GET } = await healthRoute();
    const res = await GET(makeGetRequest("http://localhost/api/health"));
    const body = await res.json();
    expect(body.checks.circuitBreakers).toEqual({
      email: { state: "closed", failures: 0 },
    });
  });

  it("degrades status when a circuit breaker is open", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    mockGetAllCircuitBreakerStatus.mockReturnValue({
      email: { state: "open", failures: 5 },
    });
    const { GET } = await healthRoute();
    const res = await GET(makeGetRequest("http://localhost/api/health"));
    const body = await res.json();
    expect(body.status).toBe("degraded");
  });
});

// ===========================================================================
// 5. POST /api/funnel-capture
// ===========================================================================
describe("POST /api/funnel-capture", () => {
  const url = "http://localhost/api/funnel-capture";

  const validBody = {
    name: "Alice Johnson",
    email: "alice@example.com",
    source: "free-audit",
  };

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await funnelCaptureRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 400 when name is missing", async () => {
    const { POST } = await funnelCaptureRoute();
    const res = await POST(
      makePostRequest(url, { email: "a@b.com", source: "webinar" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await funnelCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Test", source: "webinar" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid format", async () => {
    const { POST } = await funnelCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Test", email: "bad", source: "webinar" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when source is missing", async () => {
    const { POST } = await funnelCaptureRoute();
    const res = await POST(
      makePostRequest(url, { name: "Test", email: "a@b.com" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when source is invalid enum value", async () => {
    const { POST } = await funnelCaptureRoute();
    const res = await POST(
      makePostRequest(url, {
        name: "Test",
        email: "a@b.com",
        source: "invalid-source",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await funnelCaptureRoute();
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 201 on successful capture", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "platform_client" });
    mockPrisma.lead.create.mockResolvedValue({ id: "lead_funnel_1" });
    mockScoreLead.mockReturnValue(75);

    const { POST } = await funnelCaptureRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("creates lead with correct data including score", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "platform_client" });
    mockPrisma.lead.create.mockResolvedValue({ id: "lead_funnel_2" });
    mockScoreLead.mockReturnValue(80);

    const { POST } = await funnelCaptureRoute();
    await POST(
      makePostRequest(url, {
        ...validBody,
        phone: "555-1234",
        business: "Acme Plumbing",
        trade: "plumbing",
      }),
    );

    expect(mockScoreLead).toHaveBeenCalled();
    expect(mockPrisma.lead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: "platform_client",
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "555-1234",
        score: 80,
        status: "new",
      }),
    });
  });

  it("tracks revenue event after creating lead", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "platform_client" });
    mockPrisma.lead.create.mockResolvedValue({ id: "lead_funnel_3" });
    mockScoreLead.mockReturnValue(70);

    const { POST } = await funnelCaptureRoute();
    await POST(makePostRequest(url, validBody));

    expect(mockTrackRevenueEvent).toHaveBeenCalledWith(
      "platform_client",
      expect.objectContaining({
        leadId: "lead_funnel_3",
        channel: "funnel-free-audit",
        eventType: "lead_captured",
      }),
    );
  });

  it("sends welcome nurture email", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "platform_client" });
    mockPrisma.lead.create.mockResolvedValue({ id: "lead_funnel_4" });
    mockScoreLead.mockReturnValue(60);

    const { POST } = await funnelCaptureRoute();
    await POST(makePostRequest(url, validBody));

    expect(mockRenderNurtureEmail).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      "alice@example.com",
      "Welcome!",
      expect.any(String),
    );
  });

  it("returns 201 even when no platform client exists (empty clientId)", async () => {
    mockPrisma.client.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: "lead_funnel_5" });
    mockScoreLead.mockReturnValue(50);

    const { POST } = await funnelCaptureRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(201);
  });

  it("returns 500 when lead creation fails", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "platform_client" });
    mockPrisma.lead.create.mockRejectedValue(new Error("DB error"));
    mockScoreLead.mockReturnValue(50);

    const { POST } = await funnelCaptureRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("accepts all valid source enum values", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "c" });
    mockPrisma.lead.create.mockResolvedValue({ id: "l" });
    mockScoreLead.mockReturnValue(50);

    const sources = ["free-audit", "webinar", "playbook", "strategy-call"];
    const { POST } = await funnelCaptureRoute();

    for (const source of sources) {
      const res = await POST(
        makePostRequest(url, { name: "Test", email: "a@b.com", source }),
      );
      expect(res.status).toBe(201);
    }
  });

  it("includes utm parameters in lead notes", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "c" });
    mockPrisma.lead.create.mockResolvedValue({ id: "l" });
    mockScoreLead.mockReturnValue(50);

    const { POST } = await funnelCaptureRoute();
    await POST(
      makePostRequest(url, {
        ...validBody,
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "spring_2026",
      }),
    );

    const createCall = mockPrisma.lead.create.mock.calls[0][0];
    expect(createCall.data.notes).toContain("utm_source: google");
    expect(createCall.data.notes).toContain("utm_medium: cpc");
    expect(createCall.data.notes).toContain("utm_campaign: spring_2026");
  });

  it("does not require authentication (public endpoint)", async () => {
    unauthenticated();
    mockPrisma.client.findFirst.mockResolvedValue({ id: "c" });
    mockPrisma.lead.create.mockResolvedValue({ id: "l" });
    mockScoreLead.mockReturnValue(50);

    const { POST } = await funnelCaptureRoute();
    const res = await POST(makePostRequest(url, validBody));
    // requireClient is not called — should succeed regardless
    expect(res.status).toBe(201);
  });
});
