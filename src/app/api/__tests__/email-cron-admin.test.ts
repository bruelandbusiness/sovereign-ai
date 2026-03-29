import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRateLimitByIP,
  mockSetRateLimitHeaders,
  mockRequireAdmin,
  mockSendEmail,
  mockBuildBookingNoshowEmail,
  mockVerifyCronSecret,
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
      client: { findUnique: vi.fn() },
      emailPreference: { upsert: vi.fn() },
      activityEvent: {
        findFirst: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      booking: { findMany: vi.fn(), update: vi.fn() },
      auditLog: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      notification: { create: vi.fn() },
      clientService: { findMany: vi.fn() },
    },
    mockRateLimitByIP: vi.fn(),
    mockSetRateLimitHeaders,
    mockRequireAdmin: vi.fn(),
    mockSendEmail: vi.fn(),
    mockBuildBookingNoshowEmail: vi.fn(),
    mockVerifyCronSecret: vi.fn(),
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

vi.mock("@/lib/require-admin", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/require-client", () => ({
  AuthError: HoistedAuthError,
  getErrorMessage: (e: unknown) =>
    e instanceof Error ? e.message : String(e),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("@/lib/emails/booking-noshow", () => ({
  buildBookingNoshowEmail: mockBuildBookingNoshowEmail,
}));

vi.mock("@/lib/cron", () => ({
  verifyCronSecret: mockVerifyCronSecret,
  withCronErrorHandler: (_name: string, handler: Function) => handler,
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

vi.mock("@/lib/telegram", () => ({
  sendTelegramAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@sentry/node", () => ({
  captureCheckIn: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Lazy route imports (after mocks)
// ---------------------------------------------------------------------------
const emailPreferencesRoute = () =>
  import("@/app/api/email/preferences/route");
const emailUnsubscribeRoute = () =>
  import("@/app/api/email/unsubscribe/route");
const bookingNoshowRoute = () =>
  import("@/app/api/cron/booking-noshow/route");
const cronStatusRoute = () =>
  import("@/app/api/admin/cron-status/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

function makeGetRequest(
  url: string,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(url, { method: "GET", headers });
}

const FIXED_RESET_AT = 1800000000;

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

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  allowRateLimit();
  mockVerifyCronSecret.mockReturnValue(null); // authorized by default
  mockSendEmail.mockResolvedValue(undefined);
  mockBuildBookingNoshowEmail.mockReturnValue({
    subject: "We missed you!",
    html: "<p>Rebook</p>",
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ===========================================================================
// 1. POST /api/email/preferences
// ===========================================================================
describe("POST /api/email/preferences", () => {
  const url = "http://localhost/api/email/preferences";

  it("returns 200 with updated preferences on valid request", async () => {
    mockPrisma.client.findUnique.mockResolvedValue({ id: "client_1" });
    mockPrisma.emailPreference.upsert.mockResolvedValue({
      clientId: "client_1",
      marketing: false,
      weeklyReports: true,
      productUpdates: true,
      transactional: true,
    });
    mockPrisma.activityEvent.deleteMany.mockResolvedValue({ count: 0 });

    const { POST } = await emailPreferencesRoute();
    const res = await POST(
      makePostRequest(url, {
        clientId: "client_1",
        preferences: { marketing: false },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.preferences.marketing).toBe(false);
    expect(body.preferences.transactional).toBe(true);
  });

  it("returns 400 when clientId is missing", async () => {
    const { POST } = await emailPreferencesRoute();
    const res = await POST(
      makePostRequest(url, { preferences: { marketing: true } }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("clientId");
  });

  it("returns 400 when preferences object is missing", async () => {
    const { POST } = await emailPreferencesRoute();
    const res = await POST(makePostRequest(url, { clientId: "client_1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("preferences");
  });

  it("returns 404 when client does not exist", async () => {
    mockPrisma.client.findUnique.mockResolvedValue(null);

    const { POST } = await emailPreferencesRoute();
    const res = await POST(
      makePostRequest(url, {
        clientId: "nonexistent",
        preferences: { marketing: false },
      }),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Client not found");
  });

  it("returns 400 for unknown preference category", async () => {
    mockPrisma.client.findUnique.mockResolvedValue({ id: "client_1" });

    const { POST } = await emailPreferencesRoute();
    const res = await POST(
      makePostRequest(url, {
        clientId: "client_1",
        preferences: { unknown_category: true },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Unknown preference category");
  });

  it("returns 400 when preference value is not boolean", async () => {
    mockPrisma.client.findUnique.mockResolvedValue({ id: "client_1" });

    const { POST } = await emailPreferencesRoute();
    const res = await POST(
      makePostRequest(url, {
        clientId: "client_1",
        preferences: { marketing: "yes" },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("must be a boolean");
  });

  it("silently ignores transactional preference (cannot be disabled)", async () => {
    mockPrisma.client.findUnique.mockResolvedValue({ id: "client_1" });
    mockPrisma.emailPreference.upsert.mockResolvedValue({
      clientId: "client_1",
      marketing: true,
      weeklyReports: true,
      productUpdates: true,
      transactional: true,
    });
    mockPrisma.activityEvent.deleteMany.mockResolvedValue({ count: 0 });

    const { POST } = await emailPreferencesRoute();
    const res = await POST(
      makePostRequest(url, {
        clientId: "client_1",
        preferences: { transactional: false },
      }),
    );
    // Should succeed, ignoring the transactional field
    expect(res.status).toBe(200);
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await emailPreferencesRoute();
    const res = await POST(
      makePostRequest(url, {
        clientId: "client_1",
        preferences: { marketing: false },
      }),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await emailPreferencesRoute();
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
});

// ===========================================================================
// 2. GET /api/email/preferences
// ===========================================================================
describe("GET /api/email/preferences", () => {
  const baseUrl = "http://localhost/api/email/preferences";

  it("returns 200 with preferences for valid clientId", async () => {
    mockPrisma.client.findUnique.mockResolvedValue({
      id: "client_1",
      businessName: "Test Co",
    });
    mockPrisma.emailPreference.upsert.mockResolvedValue({
      clientId: "client_1",
      marketing: true,
      weeklyReports: false,
      productUpdates: true,
      transactional: true,
    });

    const { GET } = await emailPreferencesRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?clientId=client_1`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientId).toBe("client_1");
    expect(body.preferences.marketing).toBe(true);
    expect(body.preferences.weekly_reports).toBe(false);
  });

  it("returns 400 when clientId is missing", async () => {
    const { GET } = await emailPreferencesRoute();
    const res = await GET(makeGetRequest(baseUrl));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("clientId");
  });

  it("returns 404 when client does not exist", async () => {
    mockPrisma.client.findUnique.mockResolvedValue(null);
    const { GET } = await emailPreferencesRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?clientId=bad_id`));
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 3. GET /api/email/unsubscribe
// ===========================================================================
describe("GET /api/email/unsubscribe", () => {
  const baseUrl = "http://localhost/api/email/unsubscribe";

  it("returns 200 HTML success page when client exists", async () => {
    mockPrisma.client.findUnique.mockResolvedValue({
      id: "client_1",
      businessName: "Test Co",
    });
    mockPrisma.activityEvent.findFirst.mockResolvedValue(null);
    mockPrisma.activityEvent.create.mockResolvedValue({});

    const { GET } = await emailUnsubscribeRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?clientId=client_1`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("Unsubscribed");
  });

  it("returns 400 when clientId is missing", async () => {
    const { GET } = await emailUnsubscribeRoute();
    const res = await GET(makeGetRequest(baseUrl));
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain("Missing client identifier");
  });

  it("returns 404 when client does not exist", async () => {
    mockPrisma.client.findUnique.mockResolvedValue(null);
    const { GET } = await emailUnsubscribeRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?clientId=bad_id`));
    expect(res.status).toBe(404);
  });

  it("is idempotent - does not create duplicate activity events", async () => {
    mockPrisma.client.findUnique.mockResolvedValue({
      id: "client_1",
      businessName: "Test Co",
    });
    // Simulate existing unsubscribe event
    mockPrisma.activityEvent.findFirst.mockResolvedValue({
      id: "evt_1",
      type: "email_unsubscribe",
    });

    const { GET } = await emailUnsubscribeRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?clientId=client_1`));
    expect(res.status).toBe(200);
    // Should not create a new activity event
    expect(mockPrisma.activityEvent.create).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { GET } = await emailUnsubscribeRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?clientId=client_1`));
    expect(res.status).toBe(429);
  });
});

// ===========================================================================
// 4. GET /api/cron/booking-noshow
// ===========================================================================
describe("GET /api/cron/booking-noshow", () => {
  const url = "http://localhost/api/cron/booking-noshow";

  it("returns 401 when cron secret is invalid", async () => {
    mockVerifyCronSecret.mockReturnValue(
      new (await import("next/server")).NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 },
      ),
    );

    const { GET } = await bookingNoshowRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
  });

  it("returns 200 with processed=0 when no overdue bookings", async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const { GET } = await bookingNoshowRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(0);
    expect(body.message).toContain("No overdue bookings");
  });

  it("processes overdue bookings and sends emails", async () => {
    const overdueBooking = {
      id: "booking_1",
      clientId: "client_1",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      serviceType: "HVAC repair",
      startsAt: new Date("2025-01-01T10:00:00Z"),
      client: {
        businessName: "Cool Air LLC",
        account: {
          id: "account_1",
          email: "owner@coolair.com",
          name: "Owner",
        },
      },
    };

    mockPrisma.booking.findMany.mockResolvedValue([overdueBooking]);
    mockPrisma.auditLog.findMany.mockResolvedValue([]); // batch dedup
    mockPrisma.auditLog.findFirst.mockResolvedValue(null); // per-item dedup
    mockPrisma.booking.update.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({});
    mockPrisma.activityEvent.create.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.clientService.findMany.mockResolvedValue([]);

    const { GET } = await bookingNoshowRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.markedCount).toBe(1);
    expect(body.emailCount).toBe(1);

    // Verify booking status was updated
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: "booking_1" },
      data: { status: "no_show" },
    });

    // Verify email was sent
    expect(mockSendEmail).toHaveBeenCalledWith(
      "john@example.com",
      "We missed you!",
      "<p>Rebook</p>",
    );
  });

  it("skips already-processed bookings (idempotency)", async () => {
    const overdueBooking = {
      id: "booking_1",
      clientId: "client_1",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      serviceType: null,
      startsAt: new Date("2025-01-01T10:00:00Z"),
      client: {
        businessName: "Cool Air LLC",
        account: { id: "account_1", email: "o@c.com", name: "Owner" },
      },
    };

    mockPrisma.booking.findMany.mockResolvedValue([overdueBooking]);
    // Batch dedup returns this booking as already processed
    mockPrisma.auditLog.findMany.mockResolvedValue([
      { resourceId: "booking_1" },
    ]);
    mockPrisma.clientService.findMany.mockResolvedValue([]);

    const { GET } = await bookingNoshowRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    // The booking is found but skipped
    expect(body.markedCount).toBe(0);
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });

  it("returns 500 when database query fails", async () => {
    mockPrisma.booking.findMany.mockRejectedValue(
      new Error("DB connection lost"),
    );

    const { GET } = await bookingNoshowRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("failed");
  });
});

// ===========================================================================
// 5. GET /api/admin/cron-status
// ===========================================================================
describe("GET /api/admin/cron-status", () => {
  const url = "http://localhost/api/admin/cron-status";

  function authenticatedAdmin() {
    mockRequireAdmin.mockResolvedValue({
      accountId: "admin_1",
      session: { account: { id: "admin_1", role: "admin" } },
    });
  }

  function unauthenticatedAdmin() {
    mockRequireAdmin.mockRejectedValue(
      new HoistedAuthError("Unauthorized", 401),
    );
  }

  function forbiddenAdmin() {
    mockRequireAdmin.mockRejectedValue(
      new HoistedAuthError("Forbidden", 403),
    );
  }

  it("returns 401 when not authenticated as admin", async () => {
    unauthenticatedAdmin();
    const { GET } = await cronStatusRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when authenticated but not admin role", async () => {
    forbiddenAdmin();
    const { GET } = await cronStatusRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with summary and crons array on success", async () => {
    authenticatedAdmin();
    mockPrisma.auditLog.findMany.mockResolvedValue([]);

    const { GET } = await cronStatusRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toHaveProperty("total");
    expect(body.summary).toHaveProperty("stale");
    expect(body.summary).toHaveProperty("healthy");
    expect(body.summary).toHaveProperty("withErrors");
    expect(body.summary).toHaveProperty("checkedAt");
    expect(Array.isArray(body.crons)).toBe(true);
    expect(body.crons.length).toBeGreaterThan(0);
  });

  it("marks all jobs as stale when no audit logs exist", async () => {
    authenticatedAdmin();
    mockPrisma.auditLog.findMany.mockResolvedValue([]);

    const { GET } = await cronStatusRoute();
    const res = await GET(makeGetRequest(url));
    const body = await res.json();
    expect(body.summary.stale).toBe(body.summary.total);
    expect(body.summary.healthy).toBe(0);
  });

  it("returns 429 when rate limited", async () => {
    authenticatedAdmin();
    denyRateLimit();
    const { GET } = await cronStatusRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 500 when database query fails", async () => {
    authenticatedAdmin();
    mockPrisma.auditLog.findMany.mockRejectedValue(
      new Error("Query timeout"),
    );

    const { GET } = await cronStatusRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
