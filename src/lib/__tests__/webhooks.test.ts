import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  prisma: {
    webhookEndpoint: { findMany: vi.fn() },
    webhookLog: { create: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
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

vi.mock("@/lib/telegram/alerts", () => ({
  routeAlert: vi.fn().mockResolvedValue(undefined),
}));

const { mockDeliverWebhook } = vi.hoisted(() => ({
  mockDeliverWebhook: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/webhook-delivery", () => ({
  deliverWebhook: mockDeliverWebhook,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { isValidWebhookUrl, dispatchWebhook } from "../webhooks";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// isValidWebhookUrl — SSRF protection
// ---------------------------------------------------------------------------

describe("isValidWebhookUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Should REJECT ---

  it("rejects localhost", () => {
    expect(isValidWebhookUrl("https://localhost/hook")).toBe(false);
  });

  it("rejects 127.0.0.1", () => {
    expect(isValidWebhookUrl("http://127.0.0.1/hook")).toBe(false);
  });

  it("rejects 0.0.0.0", () => {
    expect(isValidWebhookUrl("http://0.0.0.0/hook")).toBe(false);
  });

  it("rejects IPv6 loopback ::1", () => {
    expect(isValidWebhookUrl("http://::1/hook")).toBe(false);
  });

  it("rejects AWS metadata endpoint 169.254.169.254", () => {
    expect(isValidWebhookUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("rejects GCP metadata endpoint", () => {
    expect(isValidWebhookUrl("http://metadata.google.internal/computeMetadata/")).toBe(false);
  });

  it("rejects private 10.x.x.x range", () => {
    expect(isValidWebhookUrl("http://10.0.0.1/hook")).toBe(false);
    expect(isValidWebhookUrl("http://10.255.255.255/hook")).toBe(false);
  });

  it("rejects private 172.16.x.x - 172.31.x.x range", () => {
    expect(isValidWebhookUrl("http://172.16.0.1/hook")).toBe(false);
    expect(isValidWebhookUrl("http://172.31.255.255/hook")).toBe(false);
  });

  it("allows 172.15.x.x (not private)", () => {
    expect(isValidWebhookUrl("http://172.15.0.1/hook")).toBe(true);
  });

  it("allows 172.32.x.x (not private)", () => {
    expect(isValidWebhookUrl("http://172.32.0.1/hook")).toBe(true);
  });

  it("rejects private 192.168.x.x range", () => {
    expect(isValidWebhookUrl("http://192.168.0.1/hook")).toBe(false);
    expect(isValidWebhookUrl("http://192.168.255.255/hook")).toBe(false);
  });

  it("rejects non-http/https protocols", () => {
    expect(isValidWebhookUrl("ftp://example.com/hook")).toBe(false);
    expect(isValidWebhookUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidWebhookUrl("not a url")).toBe(false);
    expect(isValidWebhookUrl("")).toBe(false);
  });

  it("rejects bracketed IPv6 notation", () => {
    expect(isValidWebhookUrl("http://[::1]/hook")).toBe(false);
  });

  it("rejects IPv4-mapped IPv6 addresses", () => {
    expect(isValidWebhookUrl("http://::ffff:127.0.0.1/hook")).toBe(false);
  });

  it("rejects IPv6 unique local addresses (fd00::)", () => {
    expect(isValidWebhookUrl("http://fd12:3456::1/hook")).toBe(false);
  });

  it("rejects IPv6 link-local addresses (fe80::)", () => {
    expect(isValidWebhookUrl("http://fe80::1/hook")).toBe(false);
  });

  // --- Should ACCEPT ---

  it("accepts valid HTTPS URL", () => {
    expect(isValidWebhookUrl("https://hooks.example.com/webhook")).toBe(true);
  });

  it("accepts valid HTTP URL", () => {
    expect(isValidWebhookUrl("http://hooks.example.com/webhook")).toBe(true);
  });

  it("accepts URL with port", () => {
    expect(isValidWebhookUrl("https://hooks.example.com:8443/webhook")).toBe(true);
  });

  it("accepts URL with path and query params", () => {
    expect(isValidWebhookUrl("https://hooks.example.com/api/v1/webhook?key=abc")).toBe(true);
  });

  it("allows URL with credentials in authority (not checked by current impl)", () => {
    // Documents current behavior — credentials in URLs are not blocked.
    // This is a known gap worth considering for a future hardening pass.
    expect(isValidWebhookUrl("https://admin:password@example.com/hook")).toBe(true);
  });

  it("rejects hex-encoded localhost (URL parser resolves to 127.0.0.1)", () => {
    // The URL constructor resolves 0x7f000001 to 127.0.0.1,
    // which is then caught by the blocklist.
    expect(isValidWebhookUrl("http://0x7f000001/hook")).toBe(false);
  });

  it("allows 192.0.0.x (only 192.168.x.x is blocked)", () => {
    expect(isValidWebhookUrl("http://192.0.0.1/hook")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// dispatchWebhook
// ---------------------------------------------------------------------------

describe("dispatchWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when no endpoints match", async () => {
    vi.mocked(prisma.webhookEndpoint.findMany).mockResolvedValue([]);

    await dispatchWebhook("client-1", "lead.created", { id: "123" });

    expect(mockDeliverWebhook).not.toHaveBeenCalled();
  });

  it("calls deliverWebhook for each matching endpoint", async () => {
    vi.mocked(prisma.webhookEndpoint.findMany).mockResolvedValue([
      { id: "ep-1", url: "https://hooks.example.com/wh", secret: "s3cret", events: "lead.created", isActive: true },
      { id: "ep-2", url: "https://hooks2.example.com/wh", secret: "s3cret2", events: "lead.created", isActive: true },
    ] as never);

    await dispatchWebhook("client-1", "lead.created", { id: "123" });

    // Give the async fire-and-forget calls a tick to start
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockDeliverWebhook).toHaveBeenCalledTimes(2);
    expect(mockDeliverWebhook).toHaveBeenCalledWith(
      "ep-1",
      "https://hooks.example.com/wh",
      "s3cret",
      "lead.created",
      { id: "123" },
    );
    expect(mockDeliverWebhook).toHaveBeenCalledWith(
      "ep-2",
      "https://hooks2.example.com/wh",
      "s3cret2",
      "lead.created",
      { id: "123" },
    );
  });

  it("passes correct endpoint details to deliverWebhook", async () => {
    vi.mocked(prisma.webhookEndpoint.findMany).mockResolvedValue([
      { id: "ep-1", url: "https://hooks.example.com/wh", secret: "s3cret", events: "lead.created", isActive: true },
    ] as never);

    await dispatchWebhook("client-1", "lead.created", { id: "456" });

    // Give the async call a tick to start
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockDeliverWebhook).toHaveBeenCalledWith(
      "ep-1",
      "https://hooks.example.com/wh",
      "s3cret",
      "lead.created",
      { id: "456" },
    );
  });
});
