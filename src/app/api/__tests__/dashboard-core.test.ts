import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — available at vi.mock() factory time
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRequireClient,
  mockCacheWrap,
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
      lead: { count: vi.fn() },
      reviewCampaign: { aggregate: vi.fn() },
      clientService: { count: vi.fn() },
      chatbotConfig: { findUnique: vi.fn() },
      chatbotConversation: { count: vi.fn() },
      booking: { count: vi.fn() },
      activityEvent: { findMany: vi.fn() },
    },
    mockRequireClient: vi.fn(),
    mockCacheWrap: vi.fn(),
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

vi.mock("@/lib/cache", () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    wrap: mockCacheWrap,
  },
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

// ---------------------------------------------------------------------------
// Lazy route imports (after mocks)
// ---------------------------------------------------------------------------
const kpisRoute = () => import("@/app/api/dashboard/kpis/route");
const activityRoute = () => import("@/app/api/dashboard/activity/route");
const profileRoute = () => import("@/app/api/dashboard/profile/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CLIENT_ID = "client_test_123";
const ACCOUNT_ID = "account_test_456";

function authenticatedSession() {
  mockRequireClient.mockResolvedValue({
    clientId: CLIENT_ID,
    accountId: ACCOUNT_ID,
    session: {
      account: {
        id: ACCOUNT_ID,
        client: {
          id: CLIENT_ID,
          businessName: "Acme Plumbing",
          ownerName: "John Doe",
          city: "Denver",
          state: "CO",
          vertical: "plumbing",
        },
      },
    },
  });
}

function unauthenticated() {
  mockRequireClient.mockRejectedValue(
    new HoistedAuthError("Unauthorized", 401),
  );
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// 1. GET /api/dashboard/kpis
// ===========================================================================
describe("GET /api/dashboard/kpis", () => {
  function setupCachePassthrough() {
    // Make cache.wrap execute the factory function directly
    mockCacheWrap.mockImplementation(
      async (
        _key: string,
        _ttl: number,
        fn: () => Promise<unknown>,
      ) => fn(),
    );
  }

  function setupPrismaDefaults() {
    mockPrisma.lead.count.mockResolvedValue(0);
    mockPrisma.reviewCampaign.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: 0,
    });
    mockPrisma.clientService.count.mockResolvedValue(0);
    mockPrisma.chatbotConfig.findUnique.mockResolvedValue(null);
    mockPrisma.booking.count.mockResolvedValue(0);
  }

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await kpisRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with an array of KPI objects on success", async () => {
    authenticatedSession();
    setupCachePassthrough();
    setupPrismaDefaults();

    // 10 leads this month, 5 last month => +100% change
    mockPrisma.lead.count
      .mockResolvedValueOnce(10)  // leadsThisMonth
      .mockResolvedValueOnce(5);  // leadsLastMonth
    mockPrisma.reviewCampaign.aggregate.mockResolvedValue({
      _avg: { rating: 4.5 },
      _count: 12,
    });
    mockPrisma.clientService.count.mockResolvedValue(3);
    mockPrisma.chatbotConfig.findUnique.mockResolvedValue({ id: "chatbot_1" });
    mockPrisma.chatbotConversation.count.mockResolvedValue(42);
    mockPrisma.booking.count.mockResolvedValue(7);

    const { GET } = await kpisRoute();
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(5);

    // Verify each KPI has the expected shape
    const [leads, services, reviews, chatbot, bookings] = body;

    expect(leads.label).toBe("Leads This Month");
    expect(leads.value).toBe(10);
    expect(leads.change).toBe("+100%");
    expect(leads.changeType).toBe("positive");

    expect(services.label).toBe("Active Services");
    expect(services.value).toBe(3);
    expect(services.subtext).toContain("of 16 available");

    expect(reviews.label).toBe("Avg Review Rating");
    expect(reviews.value).toBe("4.5");
    expect(reviews.subtext).toBe("12 total reviews");

    expect(chatbot.label).toBe("Chatbot Conversations");
    expect(chatbot.value).toBe(42);
    expect(chatbot.subtext).toBe("this month");

    expect(bookings.label).toBe("Today's Bookings");
    expect(bookings.value).toBe(7);
    expect(bookings.subtext).toBe("appointments scheduled");
  });

  it("computes negative lead change correctly", async () => {
    authenticatedSession();
    setupCachePassthrough();
    setupPrismaDefaults();

    mockPrisma.lead.count
      .mockResolvedValueOnce(3)   // leadsThisMonth
      .mockResolvedValueOnce(10); // leadsLastMonth

    const { GET } = await kpisRoute();
    const res = await GET();
    const body = await res.json();

    expect(body[0].change).toBe("-70%");
    expect(body[0].changeType).toBe("negative");
  });

  it("omits change when both months are zero", async () => {
    authenticatedSession();
    setupCachePassthrough();
    setupPrismaDefaults();

    mockPrisma.lead.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const { GET } = await kpisRoute();
    const res = await GET();
    const body = await res.json();

    expect(body[0].changeType).toBe("neutral");
  });

  it("shows 100% change when last month was zero but this month has leads", async () => {
    authenticatedSession();
    setupCachePassthrough();
    setupPrismaDefaults();

    mockPrisma.lead.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);

    const { GET } = await kpisRoute();
    const res = await GET();
    const body = await res.json();

    expect(body[0].change).toBe("+100%");
    expect(body[0].changeType).toBe("positive");
  });

  it("skips chatbot conversation query when client has no chatbot", async () => {
    authenticatedSession();
    setupCachePassthrough();
    setupPrismaDefaults();

    mockPrisma.chatbotConfig.findUnique.mockResolvedValue(null);

    const { GET } = await kpisRoute();
    await GET();

    expect(mockPrisma.chatbotConversation.count).not.toHaveBeenCalled();
  });

  it("shows em-dash for avg rating when no reviews exist", async () => {
    authenticatedSession();
    setupCachePassthrough();
    setupPrismaDefaults();

    mockPrisma.reviewCampaign.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: 0,
    });

    const { GET } = await kpisRoute();
    const res = await GET();
    const body = await res.json();

    expect(body[2].value).toBe("\u2014");
    expect(body[2].subtext).toBe("0 total reviews");
  });

  it("sets Cache-Control header on success", async () => {
    authenticatedSession();
    setupCachePassthrough();
    setupPrismaDefaults();

    const { GET } = await kpisRoute();
    const res = await GET();

    expect(res.headers.get("Cache-Control")).toBe(
      "private, max-age=30, stale-while-revalidate=15",
    );
  });

  it("returns 500 when prisma throws an unexpected error", async () => {
    authenticatedSession();
    setupCachePassthrough();

    mockPrisma.lead.count.mockRejectedValue(new Error("DB connection lost"));

    const { GET } = await kpisRoute();
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch KPIs");
  });

  it("uses cache.wrap with the client-specific key", async () => {
    authenticatedSession();
    mockCacheWrap.mockResolvedValue([]);

    const { GET } = await kpisRoute();
    await GET();

    expect(mockCacheWrap).toHaveBeenCalledWith(
      `kpis:${CLIENT_ID}`,
      30,
      expect.any(Function),
    );
  });
});

// ===========================================================================
// 2. GET /api/dashboard/activity
// ===========================================================================
describe("GET /api/dashboard/activity", () => {
  const mockActivities = [
    {
      id: "act_1",
      type: "lead_created",
      title: "New lead captured",
      description: "Alice submitted form",
      createdAt: new Date("2025-07-01T10:00:00Z"),
    },
    {
      id: "act_2",
      type: "email_sent",
      title: "Email sent",
      description: "Follow-up email to Bob",
      createdAt: new Date("2025-07-01T09:00:00Z"),
    },
  ];

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await activityRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with mapped activity objects on success", async () => {
    authenticatedSession();
    mockPrisma.activityEvent.findMany.mockResolvedValue(mockActivities);

    const { GET } = await activityRoute();
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);

    expect(body[0]).toEqual({
      id: "act_1",
      type: "lead_created",
      title: "New lead captured",
      description: "Alice submitted form",
      timestamp: "2025-07-01T10:00:00.000Z",
    });

    expect(body[1]).toEqual({
      id: "act_2",
      type: "email_sent",
      title: "Email sent",
      description: "Follow-up email to Bob",
      timestamp: "2025-07-01T09:00:00.000Z",
    });
  });

  it("converts createdAt to ISO timestamp string", async () => {
    authenticatedSession();
    mockPrisma.activityEvent.findMany.mockResolvedValue([mockActivities[0]]);

    const { GET } = await activityRoute();
    const res = await GET();
    const body = await res.json();

    expect(body[0].timestamp).toBe("2025-07-01T10:00:00.000Z");
    expect(body[0]).not.toHaveProperty("createdAt");
  });

  it("returns an empty array when no activities exist", async () => {
    authenticatedSession();
    mockPrisma.activityEvent.findMany.mockResolvedValue([]);

    const { GET } = await activityRoute();
    const res = await GET();
    const body = await res.json();

    expect(body).toEqual([]);
  });

  it("queries with correct clientId, ordering, and limit", async () => {
    authenticatedSession();
    mockPrisma.activityEvent.findMany.mockResolvedValue([]);

    const { GET } = await activityRoute();
    await GET();

    expect(mockPrisma.activityEvent.findMany).toHaveBeenCalledWith({
      where: { clientId: CLIENT_ID },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });
  });

  it("sets Cache-Control header on success", async () => {
    authenticatedSession();
    mockPrisma.activityEvent.findMany.mockResolvedValue([]);

    const { GET } = await activityRoute();
    const res = await GET();

    expect(res.headers.get("Cache-Control")).toBe(
      "private, max-age=15, stale-while-revalidate=10",
    );
  });

  it("returns 500 when prisma throws an unexpected error", async () => {
    authenticatedSession();
    mockPrisma.activityEvent.findMany.mockRejectedValue(
      new Error("Connection timeout"),
    );

    const { GET } = await activityRoute();
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch activity");
  });

  it("returns AuthError status when requireClient throws a 403", async () => {
    mockRequireClient.mockRejectedValue(
      new HoistedAuthError("Forbidden: no client linked to this account", 403),
    );

    const { GET } = await activityRoute();
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden: no client linked to this account");
  });
});

// ===========================================================================
// 3. GET /api/dashboard/profile
// ===========================================================================
describe("GET /api/dashboard/profile", () => {
  function authenticatedWithClient(clientOverrides = {}) {
    const client = {
      id: CLIENT_ID,
      businessName: "Acme Plumbing",
      ownerName: "John Doe",
      city: "Denver",
      state: "CO",
      vertical: "plumbing",
      ...clientOverrides,
    };
    mockRequireClient.mockResolvedValue({
      clientId: CLIENT_ID,
      accountId: ACCOUNT_ID,
      session: {
        account: {
          id: ACCOUNT_ID,
          client,
        },
      },
    });
  }

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { GET } = await profileRoute();
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with correct profile shape on success", async () => {
    authenticatedWithClient();

    const { GET } = await profileRoute();
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      businessName: "Acme Plumbing",
      ownerName: "John Doe",
      initials: "AP",
      city: "Denver, CO",
      vertical: "plumbing",
      plan: "",
    });
  });

  it("computes initials from multi-word business name", async () => {
    authenticatedWithClient({ businessName: "Best Home Services" });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.initials).toBe("BH");
  });

  it("computes initials from single-word business name", async () => {
    authenticatedWithClient({ businessName: "Plumbers" });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.initials).toBe("P");
  });

  it("returns ?? for initials when business name is null", async () => {
    authenticatedWithClient({ businessName: null });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.initials).toBe("??");
  });

  it("returns ?? for initials when business name is empty string", async () => {
    authenticatedWithClient({ businessName: "" });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.initials).toBe("??");
  });

  it("returns empty city when city is missing", async () => {
    authenticatedWithClient({ city: null, state: "CO" });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.city).toBe("");
  });

  it("returns empty city when state is missing", async () => {
    authenticatedWithClient({ city: "Denver", state: null });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.city).toBe("");
  });

  it("returns empty vertical when vertical is null", async () => {
    authenticatedWithClient({ vertical: null });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.vertical).toBe("");
  });

  it("sets Cache-Control header on success", async () => {
    authenticatedWithClient();

    const { GET } = await profileRoute();
    const res = await GET();

    expect(res.headers.get("Cache-Control")).toBe("private, max-age=300");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockRequireClient.mockRejectedValue(new Error("Unexpected failure"));

    const { GET } = await profileRoute();
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch profile");
  });

  it("returns AuthError status when requireClient throws a 403", async () => {
    mockRequireClient.mockRejectedValue(
      new HoistedAuthError("Forbidden: subscription is inactive", 403),
    );

    const { GET } = await profileRoute();
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden: subscription is inactive");
  });

  it("truncates initials to 2 characters for long names", async () => {
    authenticatedWithClient({
      businessName: "Alpha Beta Charlie Delta",
    });

    const { GET } = await profileRoute();
    const res = await GET();
    const body = await res.json();

    expect(body.initials).toBe("AB");
  });
});
