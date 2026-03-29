import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockPrisma, mockVerifyCronSecret, mockCreateNotification } =
  vi.hoisted(() => {
    return {
      mockPrisma: {
        auditLog: { deleteMany: vi.fn(), create: vi.fn(), count: vi.fn() },
        activityEvent: { deleteMany: vi.fn() },
        emailQueue: { deleteMany: vi.fn() },
        webhookLog: { deleteMany: vi.fn() },
        notification: { deleteMany: vi.fn() },
        client: { count: vi.fn() },
        lead: { count: vi.fn() },
        booking: { count: vi.fn() },
        subscription: { count: vi.fn() },
        quote: { findMany: vi.fn(), update: vi.fn() },
      },
      mockVerifyCronSecret: vi.fn(),
      mockCreateNotification: vi.fn(),
    };
  });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/cron", () => ({
  verifyCronSecret: mockVerifyCronSecret,
  withCronErrorHandler: (_name: string, handler: Function) => handler,
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: mockCreateNotification,
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
const dataRetentionRoute = () =>
  import("@/app/api/cron/data-retention/route");
const backupVerifyRoute = () =>
  import("@/app/api/cron/backup-verify/route");
const quoteExpiryRoute = () =>
  import("@/app/api/cron/quote-expiry/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeGetRequest(
  url: string,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(url, { method: "GET", headers });
}

function mockUnauthorized() {
  mockVerifyCronSecret.mockReturnValue(
    NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  );
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyCronSecret.mockReturnValue(null); // authorized by default
  mockCreateNotification.mockResolvedValue({});
});

// ===========================================================================
// 1. Cron secret verification (shared pattern)
// ===========================================================================
describe("Cron secret verification", () => {
  const url = "http://localhost/api/cron/data-retention";

  it("rejects requests when verifyCronSecret returns 401", async () => {
    mockUnauthorized();

    const { GET } = await dataRetentionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("proceeds when verifyCronSecret returns null (authorized)", async () => {
    mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.activityEvent.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.emailQueue.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.webhookLog.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const { GET } = await dataRetentionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 2. GET /api/cron/data-retention
// ===========================================================================
describe("GET /api/cron/data-retention", () => {
  const url = "http://localhost/api/cron/data-retention";

  it("returns 401 when cron secret is invalid", async () => {
    mockUnauthorized();

    const { GET } = await dataRetentionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
  });

  it("deletes old records and returns counts", async () => {
    mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 15 });
    mockPrisma.activityEvent.deleteMany.mockResolvedValue({ count: 8 });
    mockPrisma.emailQueue.deleteMany.mockResolvedValue({ count: 3 });
    mockPrisma.webhookLog.deleteMany.mockResolvedValue({ count: 22 });
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 5 });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const { GET } = await dataRetentionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deleted.auditLogs).toBe(15);
    expect(body.deleted.activityEvents).toBe(8);
    expect(body.deleted.emailQueue).toBe(3);
    expect(body.deleted.webhookLogs).toBe(22);
    expect(body.deleted.notifications).toBe(5);
    expect(body.totalDeleted).toBe(53);
  });

  it("handles empty state with zero deletions", async () => {
    mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.activityEvent.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.emailQueue.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.webhookLog.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const { GET } = await dataRetentionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.totalDeleted).toBe(0);
  });

  it("creates an audit log entry after purge", async () => {
    mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.activityEvent.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.emailQueue.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.webhookLog.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const { GET } = await dataRetentionRoute();
    await GET(makeGetRequest(url));

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "data_retention_purge",
        resource: "system",
        accountId: "system",
      }),
    });
  });
});

// ===========================================================================
// 3. GET /api/cron/backup-verify
// ===========================================================================
describe("GET /api/cron/backup-verify", () => {
  const url = "http://localhost/api/cron/backup-verify";

  it("returns 401 when cron secret is invalid", async () => {
    mockUnauthorized();

    const { GET } = await backupVerifyRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
  });

  it("returns metrics on success", async () => {
    mockPrisma.client.count.mockResolvedValue(42);
    mockPrisma.lead.count.mockResolvedValue(150);
    mockPrisma.booking.count.mockResolvedValue(88);
    mockPrisma.subscription.count.mockResolvedValue(12);
    mockPrisma.auditLog.count.mockResolvedValue(300);
    mockPrisma.auditLog.create.mockResolvedValue({});

    const { GET } = await backupVerifyRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics.clients).toBe(42);
    expect(body.metrics.leads).toBe(150);
    expect(body.metrics.bookings).toBe(88);
    expect(body.metrics.subscriptions).toBe(12);
    expect(body.metrics.auditLogsLast24h).toBe(300);
    expect(body.metrics.timestamp).toBeDefined();
  });

  it("returns zero counts when database is empty", async () => {
    mockPrisma.client.count.mockResolvedValue(0);
    mockPrisma.lead.count.mockResolvedValue(0);
    mockPrisma.booking.count.mockResolvedValue(0);
    mockPrisma.subscription.count.mockResolvedValue(0);
    mockPrisma.auditLog.count.mockResolvedValue(0);
    mockPrisma.auditLog.create.mockResolvedValue({});

    const { GET } = await backupVerifyRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics.clients).toBe(0);
    expect(body.metrics.leads).toBe(0);
  });

  it("creates an audit log entry for the health check", async () => {
    mockPrisma.client.count.mockResolvedValue(1);
    mockPrisma.lead.count.mockResolvedValue(1);
    mockPrisma.booking.count.mockResolvedValue(1);
    mockPrisma.subscription.count.mockResolvedValue(1);
    mockPrisma.auditLog.count.mockResolvedValue(1);
    mockPrisma.auditLog.create.mockResolvedValue({});

    const { GET } = await backupVerifyRoute();
    await GET(makeGetRequest(url));

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "database_health_check",
        resource: "system",
        accountId: "system",
      }),
    });
  });
});

// ===========================================================================
// 4. GET /api/cron/quote-expiry
// ===========================================================================
describe("GET /api/cron/quote-expiry", () => {
  const url = "http://localhost/api/cron/quote-expiry";

  it("returns 401 when cron secret is invalid", async () => {
    mockUnauthorized();

    const { GET } = await quoteExpiryRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
  });

  it("expires old quotes and sends notifications", async () => {
    const expiredQuote = {
      id: "quote_1",
      customerName: "Jane Doe",
      status: "sent",
      expiresAt: new Date("2025-01-01"),
      client: { accountId: "account_1" },
    };

    mockPrisma.quote.findMany.mockResolvedValue([expiredQuote]);
    mockPrisma.quote.update.mockResolvedValue({});

    const { GET } = await quoteExpiryRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.expired).toBe(1);
    expect(body.total).toBe(1);

    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: "quote_1" },
      data: { status: "expired" },
    });

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "account_1",
        type: "billing",
        title: "Quote Expired",
      }),
    );
  });

  it("returns expired=0 when no quotes need expiring", async () => {
    mockPrisma.quote.findMany.mockResolvedValue([]);

    const { GET } = await quoteExpiryRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.expired).toBe(0);
    expect(body.total).toBe(0);
    expect(body.errors).toBeUndefined();
  });

  it("reports partial failures without crashing", async () => {
    const quotes = [
      {
        id: "quote_ok",
        customerName: "Alice",
        status: "sent",
        expiresAt: new Date("2025-01-01"),
        client: { accountId: "acc_1" },
      },
      {
        id: "quote_fail",
        customerName: "Bob",
        status: "sent",
        expiresAt: new Date("2025-01-01"),
        client: { accountId: "acc_2" },
      },
    ];

    mockPrisma.quote.findMany.mockResolvedValue(quotes);
    mockPrisma.quote.update
      .mockResolvedValueOnce({}) // first succeeds
      .mockRejectedValueOnce(new Error("DB write failed")); // second fails

    const { GET } = await quoteExpiryRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.expired).toBe(1);
    expect(body.total).toBe(2);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toContain("quote_fail");
  });
});
