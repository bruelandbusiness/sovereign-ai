 
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — no external variables inside vi.mock factories (hoisted)
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

vi.mock("@/lib/telegram", () => ({
  sendTelegramAlert: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { captureError, captureMessage } from "@/lib/monitoring/error-logger";
import { sendTelegramAlert } from "@/lib/telegram";

const mockAuditLogCreate = vi.mocked(prisma.auditLog.create);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockAuditLogCreate.mockResolvedValue({} as any);
});

describe("captureError", () => {
  it("persists an Error object with message and stack to AuditLog", async () => {
    const err = new Error("something broke");

    await captureError(err, { source: "test-module" });

    expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
    const metadata = JSON.parse(
      mockAuditLogCreate.mock.calls[0]![0].data.metadata as string
    );
    expect(metadata.message).toBe("something broke");
    expect(metadata.stack).toBeDefined();
    expect(metadata.source).toBe("test-module");
    expect(metadata.severity).toBe("error");
  });

  it("extracts a message from a plain string error", async () => {
    await captureError("string error");

    const metadata = JSON.parse(
      mockAuditLogCreate.mock.calls[0]![0].data.metadata as string
    );
    expect(metadata.message).toBe("string error");
    expect(metadata.stack).toBeUndefined();
  });

  it("uses the severity from context when provided", async () => {
    await captureError(new Error("warn-level"), { severity: "warn" });

    const metadata = JSON.parse(
      mockAuditLogCreate.mock.calls[0]![0].data.metadata as string
    );
    expect(metadata.severity).toBe("warn");
  });

  it("sends a Telegram alert for critical severity errors", async () => {
    await captureError(new Error("server on fire"), {
      severity: "critical",
      source: "infra",
    });

    expect(sendTelegramAlert).toHaveBeenCalledWith(
      "critical",
      "Error Monitor",
      expect.stringContaining("server on fire")
    );
  });

  it("sends a Telegram alert for error severity (critical and error both alert)", async () => {
    await captureError(new Error("server error"), { severity: "error" });

    expect(sendTelegramAlert).toHaveBeenCalledWith(
      "critical",
      "Error Monitor",
      expect.stringContaining("server error")
    );
  });

  it("does NOT send a Telegram alert for warn severity", async () => {
    await captureError(new Error("minor issue"), { severity: "warn" });

    expect(sendTelegramAlert).not.toHaveBeenCalled();
  });

  it("does NOT send a Telegram alert for info severity", async () => {
    await captureError(new Error("informational"), { severity: "info" });

    expect(sendTelegramAlert).not.toHaveBeenCalled();
  });

  it("merges accountId and userId from context", async () => {
    await captureError(new Error("auth fail"), {
      accountId: "acct-1",
      route: "/dashboard",
      method: "GET",
    });

    const metadata = JSON.parse(
      mockAuditLogCreate.mock.calls[0]![0].data.metadata as string
    );
    expect(metadata.accountId).toBe("acct-1");
    expect(metadata.userId).toBe("acct-1");
    expect(metadata.route).toBe("/dashboard");
    expect(metadata.method).toBe("GET");
  });

  it("does not throw when AuditLog persistence fails", async () => {
    mockAuditLogCreate.mockRejectedValue(new Error("DB down"));

    // Should not throw — errors in monitoring are swallowed
    await expect(
      captureError(new Error("original error"), { source: "test" })
    ).resolves.toBeUndefined();
  });
});

describe("captureMessage", () => {
  it("persists an info-level message to AuditLog", async () => {
    await captureMessage("deploy completed", "info", {
      source: "deploy-pipeline",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
    const data = mockAuditLogCreate.mock.calls[0]![0].data;
    expect(data.action).toBe("error_captured");
    expect(data.resource).toBe("monitoring");

    const metadata = JSON.parse(data.metadata as string);
    expect(metadata.severity).toBe("info");
    expect(metadata.message).toBe("deploy completed");
    expect(metadata.source).toBe("deploy-pipeline");
  });
});
