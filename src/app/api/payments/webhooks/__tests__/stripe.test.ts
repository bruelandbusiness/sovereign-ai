import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks (vi.hoisted ensures these are available before vi.mock calls)
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  auditLog: { findFirst: vi.fn(), create: vi.fn() },
  client: { upsert: vi.fn() },
  subscription: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  clientService: { updateMany: vi.fn() },
  activityEvent: { create: vi.fn() },
  notification: { create: vi.fn() },
  account: { findUnique: vi.fn() },
  affiliateReferral: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  affiliatePartner: { update: vi.fn() },
  revenueEvent: { create: vi.fn() },
}));

const mockStripeInstance = vi.hoisted(() => ({
  webhooks: {
    constructEvent: vi.fn(),
  },
  subscriptions: {
    retrieve: vi.fn(),
  },
  customers: {
    createBalanceTransaction: vi.fn(),
  },
}));

const mockSentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

vi.mock("@/lib/stripe", () => ({
  stripe: mockStripeInstance,
  assertStripeConfigured: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => mockSentry);

vi.mock("@/lib/auth", () => ({
  createAccountWithMagicLink: vi.fn().mockResolvedValue({
    account: { id: "account-1" },
    url: "https://example.com/magic-link",
  }),
}));

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendEmailQueued: vi.fn().mockResolvedValue(undefined),
  emailLayout: vi.fn().mockReturnValue("<html>email</html>"),
  emailButton: vi.fn().mockReturnValue("<a>button</a>"),
}));

vi.mock("@/lib/services/activator", () => ({
  activateServices: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

vi.mock("@/lib/referral-tracker", () => ({
  trackReferralConversion: vi.fn().mockResolvedValue({
    credited: false,
    referrerId: null,
  }),
}));

vi.mock("@/lib/telegram", () => ({
  sendTelegramAlert: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Import the handler under test (after mocks are registered)
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/payments/webhooks/stripe/route";
import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  body = "raw-body",
  signature: string | null = "sig_test",
): Request {
  const headers = new Headers();
  if (signature !== null) {
    headers.set("stripe-signature", signature);
  }
  return new Request("https://localhost/api/payments/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

function makeStripeEvent(
  type: string,
  data: Record<string, unknown>,
  id = `evt_${type}_${Date.now()}`,
): Stripe.Event {
  return {
    id,
    type,
    data: { object: data },
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as unknown as Stripe.Event;
}

const ORIGINAL_ENV = { ...process.env };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Stripe webhook handler (POST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    // Default: event has not been processed yet
    mockPrisma.auditLog.findFirst.mockResolvedValue(null);
    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  // ── Signature & configuration checks ───────────────────────────────

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = makeRequest("body", null);
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/missing/i);
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const req = makeRequest();
    const res = await POST(req as never);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/not configured/i);
  });

  it("returns 400 when signature verification fails", async () => {
    mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = makeRequest();
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/verification failed/i);
  });

  // ── Idempotency ────────────────────────────────────────────────────

  it("skips duplicate events (same event ID processed twice)", async () => {
    const event = makeStripeEvent(
      "checkout.session.completed",
      { id: "cs_1" },
      "evt_duplicate",
    );

    // First call: not yet processed
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);
    mockPrisma.auditLog.findFirst.mockResolvedValueOnce(null);
    mockPrisma.client.upsert.mockResolvedValue({
      id: "client-1",
    });
    mockPrisma.subscription.upsert.mockResolvedValue({});
    mockPrisma.activityEvent.create.mockResolvedValue({});

    const res1 = await POST(makeRequest() as never);
    expect(res1.status).toBe(200);

    // Second call: already processed
    mockPrisma.auditLog.findFirst.mockResolvedValueOnce({
      id: "existing-audit",
    });
    const res2 = await POST(makeRequest() as never);
    expect(res2.status).toBe(200);

    const json2 = await res2.json();
    expect(json2.deduplicated).toBe(true);
  });

  // ── checkout.session.completed ─────────────────────────────────────

  it("handles checkout.session.completed — creates subscription", async () => {
    const event = makeStripeEvent("checkout.session.completed", {
      id: "cs_1",
      customer: "cus_1",
      customer_email: "user@example.com",
      subscription: "sub_1",
      amount_total: 29900,
      metadata: {
        customer_name: "Jane",
        business_name: "Jane's Bakery",
        services: '["seo","chatbot"]',
      },
    });
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
      status: "active",
    });

    mockPrisma.client.upsert.mockResolvedValue({ id: "client-1" });
    mockPrisma.subscription.upsert.mockResolvedValue({});
    mockPrisma.activityEvent.create.mockResolvedValue({});

    const { activateServices } = await import("@/lib/services/activator");
    const { sendWelcomeEmail } = await import("@/lib/email");

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);

    // Subscription upserted with correct data
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          clientId: "client-1",
          stripeSubId: "sub_1",
          stripeCustId: "cus_1",
          status: "active",
          monthlyAmount: 29900,
        }),
      }),
    );

    // Services activated
    expect(activateServices).toHaveBeenCalledWith("client-1", [
      "seo",
      "chatbot",
    ]);

    // Welcome email sent
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Jane",
      "Jane's Bakery",
      expect.any(String),
    );

    // Event marked as processed
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "webhook_processed",
          resource: "stripe_webhook",
        }),
      }),
    );
  });

  // ── invoice.payment_failed ─────────────────────────────────────────

  it("handles invoice.payment_failed — marks subscription past_due", async () => {
    const event = makeStripeEvent("invoice.payment_failed", {
      id: "in_fail_1",
      customer: "cus_2",
      subscription: "sub_2",
    });
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);

    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: "sub-db-1",
      clientId: "client-2",
      client: {
        accountId: "account-2",
        businessName: "Acme Co",
        ownerName: "Bob",
        account: { email: "bob@example.com" },
      },
    });
    mockPrisma.subscription.update.mockResolvedValue({});
    mockPrisma.clientService.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.activityEvent.create.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({});

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);

    // Subscription set to past_due
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-db-1" },
        data: { status: "past_due" },
      }),
    );

    // Services paused
    expect(mockPrisma.clientService.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "client-2", status: "active" },
        data: { status: "paused" },
      }),
    );

    // Notification created
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: "account-2",
          type: "billing",
          title: "Payment Failed",
        }),
      }),
    );
  });

  // ── customer.subscription.deleted ──────────────────────────────────

  it("handles customer.subscription.deleted — marks canceled", async () => {
    const event = makeStripeEvent("customer.subscription.deleted", {
      id: "sub_del_1",
      customer: "cus_3",
      status: "canceled",
    });
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);

    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: "sub-db-2",
      clientId: "client-3",
      stripeSubId: "sub_del_1",
      client: {
        accountId: "account-3",
        ownerName: "Alice",
        businessName: "Alice's Store",
      },
    });
    mockPrisma.subscription.update.mockResolvedValue({});
    mockPrisma.clientService.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.affiliateReferral.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.activityEvent.create.mockResolvedValue({});
    mockPrisma.account.findUnique.mockResolvedValue({
      email: "alice@example.com",
    });

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);

    // Subscription canceled
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "canceled",
          isTrial: false,
        }),
      }),
    );

    // Services deactivated
    expect(mockPrisma.clientService.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "client-3", status: "active" },
        data: { status: "canceled" },
      }),
    );

    // Affiliate referrals marked as churned
    expect(mockPrisma.affiliateReferral.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "client-3", status: "paying" },
        data: { status: "churned", monthlyAmount: 0 },
      }),
    );
  });

  // ── charge.dispute.created ─────────────────────────────────────────

  it("handles charge.dispute.created — marks past_due and creates notification", async () => {
    const event = makeStripeEvent("charge.dispute.created", {
      id: "dp_1",
      charge: "ch_1",
      customer: "cus_4",
      amount: 29900,
      currency: "usd",
      status: "needs_response",
      reason: "fraudulent",
    });
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);

    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: "sub-db-3",
      clientId: "client-4",
      client: {
        accountId: "account-4",
        ownerName: "Dave",
        businessName: "Dave's Diner",
        account: { email: "dave@example.com" },
      },
    });
    mockPrisma.subscription.update.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.activityEvent.create.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({});

    const { sendTelegramAlert } = await import("@/lib/telegram");

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);

    // Subscription set to past_due
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-db-3" },
        data: { status: "past_due" },
      }),
    );

    // Notification created for dashboard
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: "account-4",
          type: "billing",
          title: "Chargeback Received",
        }),
      }),
    );

    // Sentry captures warning
    expect(mockSentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("Chargeback received"),
      "warning",
    );

    // Telegram alert sent
    expect(sendTelegramAlert).toHaveBeenCalledWith(
      "warning",
      "Chargeback Received",
      expect.stringContaining("Dave's Diner"),
    );
  });

  // ── Unhandled event types ──────────────────────────────────────────

  it("returns 200 for unhandled event types", async () => {
    const event = makeStripeEvent("some.unknown.event", {
      id: "obj_1",
    });
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received).toBe(true);
  });

  // ── Critical handler failures return 500 ───────────────────────────

  it("returns 500 when a critical event handler throws", async () => {
    const event = makeStripeEvent("invoice.payment_failed", {
      id: "in_crash",
      subscription: "sub_crash",
    });
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);

    // Handler will throw because findFirst returns a subscription
    // but update throws
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: "sub-db-crash",
      clientId: "client-crash",
      client: { accountId: "acc-crash" },
    });
    mockPrisma.subscription.update.mockRejectedValue(
      new Error("DB connection lost"),
    );

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("handler_failed");
    expect(json.eventType).toBe("invoice.payment_failed");

    // Event should NOT be marked as processed (so Stripe retries)
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "webhook_processed",
        }),
      }),
    );
  });

  // ── Non-critical handler failures return 200 ───────────────────────

  it("absorbs non-critical handler failures and returns 200", async () => {
    const event = makeStripeEvent("customer.subscription.updated", {
      id: "sub_update_crash",
      status: "active",
    });
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);

    // findFirst returns a subscription, but update throws
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: "sub-db-nc",
      clientId: "client-nc",
      status: "active",
      monthlyAmount: 10000,
      bundleId: null,
      isTrial: false,
      trialEndsAt: null,
      currentPeriodEnd: null,
    });
    mockPrisma.subscription.update.mockRejectedValue(
      new Error("Transient DB error"),
    );

    const res = await POST(makeRequest() as never);

    // customer.subscription.updated is NOT in CRITICAL_EVENTS
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.error).toBe("non_critical_handler_failed");

    // Sentry should still capture the error
    expect(mockSentry.captureException).toHaveBeenCalled();
  });
});
