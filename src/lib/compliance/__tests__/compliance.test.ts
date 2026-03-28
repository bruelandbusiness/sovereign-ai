import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock Prisma ──────────────────────────────────────────────────────
// vi.mock is hoisted, so the factory must not reference variables declared
// in the module scope. We use vi.hoisted() to create mocks that are
// available at hoist time.
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      complianceConfig: {
        findUnique: vi.fn(),
      },
      suppressionList: {
        findFirst: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      consentRecord: {
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      contactAttemptLog: {
        count: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      lead: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Imports (after mocks) ────────────────────────────────────────────
import { canSendEmail, canSendSms, canMakeCall } from "../index";
import {
  validateEmailContent,
  injectCanSpamFooter,
} from "../can-spam";
import {
  isQuietHours,
  isInContactCooldown,
  processStopKeyword,
  logContactAttempt,
} from "../tcpa";
import {
  addToSuppressionList,
  isOnSuppressionList,
  removeFromSuppressionList,
} from "../suppression";
import { recordConsent, revokeConsent, hasValidConsent } from "../consent";
import {
  purgeUnconvertedLeads,
  purgeOldContactAttemptLogs,
  runPrivacyMaintenanceForClient,
} from "../data-privacy";

// ── Helpers ──────────────────────────────────────────────────────────
const CLIENT_ID = "client_123";
const TEST_EMAIL = "user@example.com";
const TEST_PHONE = "+15551234567";

function defaultConfig() {
  return {
    clientId: CLIENT_ID,
    physicalAddress: "123 Main St, Springfield, IL 62704",
    fromName: "Acme Corp",
    fromEmail: "noreply@acme.com",
    tcpaConsentRequired: true,
    smsQuietStartHour: 8,
    smsQuietEndHour: 21,
    timezone: "America/Chicago",
    maxContactAttempts: 3,
    cooldownDays: 30,
    dataPurgeDays: 90,
  };
}

function compliantHtml(address: string) {
  return `<html><body><p>Hello</p><a href="https://example.com/unsubscribe">Unsubscribe</a><p>${address}</p></body></html>`;
}

beforeEach(() => {
  vi.resetAllMocks();
  // By default: not suppressed, has consent, not in cooldown, config exists
  mockPrisma.suppressionList.findFirst.mockResolvedValue(null);
  mockPrisma.consentRecord.findFirst.mockResolvedValue({ id: "consent_1" });
  mockPrisma.contactAttemptLog.count.mockResolvedValue(0);
  mockPrisma.contactAttemptLog.create.mockResolvedValue({});
  mockPrisma.complianceConfig.findUnique.mockResolvedValue(defaultConfig());
});

afterEach(() => {
  vi.useRealTimers();
});

// =====================================================================
// CAN-SPAM validation
// =====================================================================
describe("CAN-SPAM: validateEmailContent", () => {
  const config = {
    physicalAddress: "123 Main St, Springfield, IL 62704",
    fromEmail: "noreply@acme.com",
    fromName: "Acme Corp",
  };

  it("returns valid when all requirements are met", () => {
    const html = compliantHtml(config.physicalAddress);
    const result = validateEmailContent(html, config);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("fails when physical address is missing from HTML body", () => {
    const html = `<html><body><a href="/unsub">Unsubscribe</a></body></html>`;
    const result = validateEmailContent(html, config);
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Physical mailing address must appear"),
      ])
    );
  });

  it("fails when physical address config is too short", () => {
    const result = validateEmailContent("<html></html>", {
      ...config,
      physicalAddress: "short",
    });
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Physical mailing address is required but not configured"),
      ])
    );
  });

  it("fails when physical address config is empty string", () => {
    const result = validateEmailContent("<html></html>", {
      ...config,
      physicalAddress: "",
    });
    expect(result.valid).toBe(false);
  });

  it("fails when unsubscribe link is missing", () => {
    const html = `<html><body><p>${config.physicalAddress}</p></body></html>`;
    const result = validateEmailContent(html, config);
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("unsubscribe link is required"),
      ])
    );
  });

  it("fails when unsubscribe text exists but no href", () => {
    const html = `<html><body><p>Unsubscribe</p><p>${config.physicalAddress}</p></body></html>`;
    const result = validateEmailContent(html, config);
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("unsubscribe link is required"),
      ])
    );
  });

  it("fails when fromEmail is invalid (no @)", () => {
    const html = compliantHtml(config.physicalAddress);
    const result = validateEmailContent(html, {
      ...config,
      fromEmail: "invalid-email",
    });
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("From email address must be a valid"),
      ])
    );
  });

  it("fails when fromEmail is empty", () => {
    const html = compliantHtml(config.physicalAddress);
    const result = validateEmailContent(html, { ...config, fromEmail: "" });
    expect(result.valid).toBe(false);
  });

  it("fails when fromName is empty", () => {
    const html = compliantHtml(config.physicalAddress);
    const result = validateEmailContent(html, { ...config, fromName: "" });
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("From name must accurately identify"),
      ])
    );
  });

  it("fails when fromName is whitespace only", () => {
    const html = compliantHtml(config.physicalAddress);
    const result = validateEmailContent(html, { ...config, fromName: "   " });
    expect(result.valid).toBe(false);
  });

  it("collects multiple violations at once", () => {
    const result = validateEmailContent("<p>Hello</p>", {
      physicalAddress: "",
      fromEmail: "",
      fromName: "",
    });
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
  });
});

describe("CAN-SPAM: injectCanSpamFooter", () => {
  const config = {
    physicalAddress: "123 Main St",
    fromEmail: "a@b.com",
    fromName: "Acme",
  };

  it("inserts footer before </body> when present", () => {
    const html = "<html><body><p>Hi</p></body></html>";
    const result = injectCanSpamFooter(html, config, "https://unsub.com");
    expect(result).toContain("Unsubscribe");
    expect(result).toContain("Acme");
    expect(result).toContain("</body>");
    expect(result.indexOf("Unsubscribe")).toBeLessThan(result.indexOf("</body>"));
  });

  it("appends footer when no </body> tag exists", () => {
    const html = "<p>Hi</p>";
    const result = injectCanSpamFooter(html, config, "https://unsub.com");
    expect(result).toContain("Unsubscribe");
    expect(result.startsWith("<p>Hi</p>")).toBe(true);
  });

  it("escapes HTML entities in config values", () => {
    const result = injectCanSpamFooter(
      "<body></body>",
      { ...config, fromName: "A<B&C" },
      "https://unsub.com"
    );
    expect(result).toContain("A&lt;B&amp;C");
    expect(result).not.toContain("A<B&C");
  });
});

// =====================================================================
// TCPA: Quiet Hours
// =====================================================================
describe("TCPA: isQuietHours", () => {
  it("returns true before start hour (early morning)", () => {
    vi.useFakeTimers();
    // Set to 3 AM UTC — in America/Chicago (UTC-6 in winter) this is ~9 PM previous day
    // Use a time that is definitively early morning in UTC:
    // 11 AM UTC = 5 AM Central (before 8 AM) -> quiet
    vi.setSystemTime(new Date("2026-03-22T11:00:00Z"));
    expect(isQuietHours("America/Chicago", 8, 21)).toBe(true);
  });

  it("returns true after end hour (late night)", () => {
    vi.useFakeTimers();
    // 3 AM UTC = 9 PM Central (>= 21) -> quiet
    vi.setSystemTime(new Date("2026-03-23T03:00:00Z"));
    expect(isQuietHours("America/Chicago", 8, 21)).toBe(true);
  });

  it("returns false during allowed hours (midday)", () => {
    vi.useFakeTimers();
    // 6 PM UTC = 12 PM (noon) Central -> allowed
    vi.setSystemTime(new Date("2026-03-22T18:00:00Z"));
    expect(isQuietHours("America/Chicago", 8, 21)).toBe(false);
  });

  it("returns false at exactly start hour boundary", () => {
    vi.useFakeTimers();
    // 2 PM UTC = 8 AM Central (CDT in March) -> exactly startHour -> allowed
    // March 22 2026, CDT (UTC-5 after spring forward Mar 8)
    vi.setSystemTime(new Date("2026-03-22T13:00:00Z"));
    expect(isQuietHours("America/Chicago", 8, 21)).toBe(false);
  });

  it("returns true at exactly end hour boundary", () => {
    vi.useFakeTimers();
    // 2 AM UTC Mar 23 = 9 PM CDT Mar 22 -> exactly endHour -> quiet
    vi.setSystemTime(new Date("2026-03-23T02:00:00Z"));
    expect(isQuietHours("America/Chicago", 8, 21)).toBe(true);
  });

  it("returns true (safe default) for invalid timezone", () => {
    expect(isQuietHours("Invalid/Timezone", 8, 21)).toBe(true);
  });
});

// =====================================================================
// TCPA: Contact Cooldown
// =====================================================================
describe("TCPA: isInContactCooldown", () => {
  it("returns false when attempt count is below max", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(2);
    const result = await isInContactCooldown(CLIENT_ID, TEST_EMAIL, "email", 3, 30);
    expect(result).toBe(false);
  });

  it("returns true when attempt count equals max", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(3);
    const result = await isInContactCooldown(CLIENT_ID, TEST_EMAIL, "email", 3, 30);
    expect(result).toBe(true);
  });

  it("returns true when attempt count exceeds max", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(5);
    const result = await isInContactCooldown(CLIENT_ID, TEST_PHONE, "sms", 3, 30);
    expect(result).toBe(true);
  });

  it("uses phone-based lookup for non-email identifiers", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(0);
    await isInContactCooldown(CLIENT_ID, TEST_PHONE, "sms", 3, 30);
    expect(mockPrisma.contactAttemptLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          contactPhone: TEST_PHONE,
        }),
      })
    );
  });

  it("uses email-based lookup for email identifiers", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(0);
    await isInContactCooldown(CLIENT_ID, TEST_EMAIL, "email", 3, 30);
    expect(mockPrisma.contactAttemptLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          contactEmail: TEST_EMAIL,
        }),
      })
    );
  });
});

// =====================================================================
// TCPA: STOP keyword processing
// =====================================================================
describe("TCPA: processStopKeyword", () => {
  beforeEach(() => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue(null);
    mockPrisma.suppressionList.create.mockResolvedValue({});
    mockPrisma.consentRecord.updateMany.mockResolvedValue({ count: 1 });
  });

  it("returns true and suppresses for 'stop'", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "stop");
    expect(result).toBe(true);
    // Should add to suppression for both sms and voice
    expect(mockPrisma.suppressionList.create).toHaveBeenCalledTimes(2);
  });

  it("returns true for 'STOP' (case-insensitive)", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "STOP");
    expect(result).toBe(true);
  });

  it("returns true for 'unsubscribe'", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "unsubscribe");
    expect(result).toBe(true);
  });

  it("returns true for 'cancel'", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "cancel");
    expect(result).toBe(true);
  });

  it("returns true for 'end'", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "end");
    expect(result).toBe(true);
  });

  it("returns true for 'quit'", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "quit");
    expect(result).toBe(true);
  });

  it("returns true for keyword with trailing text (e.g. 'stop please')", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "stop please");
    expect(result).toBe(true);
  });

  it("returns false for non-stop messages", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "Hello there");
    expect(result).toBe(false);
    expect(mockPrisma.suppressionList.create).not.toHaveBeenCalled();
  });

  it("returns false for empty message", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "");
    expect(result).toBe(false);
  });

  it("returns false when stop keyword is embedded (not at start)", async () => {
    const result = await processStopKeyword(CLIENT_ID, TEST_PHONE, "don't stop");
    expect(result).toBe(false);
  });

  it("revokes consent for both sms and voice channels", async () => {
    await processStopKeyword(CLIENT_ID, TEST_PHONE, "stop");
    expect(mockPrisma.consentRecord.updateMany).toHaveBeenCalledTimes(2);
  });
});

// =====================================================================
// TCPA: logContactAttempt
// =====================================================================
describe("TCPA: logContactAttempt", () => {
  it("creates a contact attempt log entry", async () => {
    mockPrisma.contactAttemptLog.create.mockResolvedValue({});
    await logContactAttempt({
      clientId: CLIENT_ID,
      contactEmail: TEST_EMAIL,
      channel: "email",
      status: "sent",
    });
    expect(mockPrisma.contactAttemptLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: CLIENT_ID,
        contactEmail: TEST_EMAIL,
        channel: "email",
        status: "sent",
      }),
    });
  });
});

// =====================================================================
// Suppression List
// =====================================================================
describe("Suppression: addToSuppressionList", () => {
  it("creates a new suppression entry", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue(null);
    mockPrisma.suppressionList.create.mockResolvedValue({});
    await addToSuppressionList({
      clientId: CLIENT_ID,
      contactEmail: TEST_EMAIL,
      channel: "email",
      reason: "unsubscribe",
      source: "web_form",
    });
    expect(mockPrisma.suppressionList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: CLIENT_ID,
        contactEmail: TEST_EMAIL,
        channel: "email",
        reason: "unsubscribe",
      }),
    });
  });

  it("skips creation when identical entry already exists", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue({ id: "existing" });
    await addToSuppressionList({
      clientId: CLIENT_ID,
      contactEmail: TEST_EMAIL,
      channel: "email",
      reason: "unsubscribe",
    });
    expect(mockPrisma.suppressionList.create).not.toHaveBeenCalled();
  });

  it("does nothing when neither phone nor email provided", async () => {
    await addToSuppressionList({
      channel: "email",
      reason: "manual",
    });
    expect(mockPrisma.suppressionList.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.suppressionList.create).not.toHaveBeenCalled();
  });
});

describe("Suppression: isOnSuppressionList", () => {
  it("returns true when contact is suppressed for channel", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue({ id: "sup_1" });
    const result = await isOnSuppressionList({
      clientId: CLIENT_ID,
      contactEmail: TEST_EMAIL,
      channel: "email",
    });
    expect(result).toBe(true);
  });

  it("returns false when contact is not suppressed", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue(null);
    const result = await isOnSuppressionList({
      clientId: CLIENT_ID,
      contactEmail: TEST_EMAIL,
      channel: "email",
    });
    expect(result).toBe(false);
  });

  it("returns false when neither phone nor email provided", async () => {
    const result = await isOnSuppressionList({
      clientId: CLIENT_ID,
      channel: "email",
    });
    expect(result).toBe(false);
    expect(mockPrisma.suppressionList.findFirst).not.toHaveBeenCalled();
  });

  it("checks both phone-specific and 'all' channel suppressions", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue(null);
    await isOnSuppressionList({
      clientId: CLIENT_ID,
      contactPhone: TEST_PHONE,
      channel: "sms",
    });
    const callArgs = mockPrisma.suppressionList.findFirst.mock.calls[0][0];
    const orConditions = callArgs.where.OR;
    expect(orConditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ contactPhone: TEST_PHONE, channel: "sms" }),
        expect.objectContaining({ contactPhone: TEST_PHONE, channel: "all" }),
      ])
    );
  });
});

describe("Suppression: removeFromSuppressionList", () => {
  it("deletes matching entries and returns count", async () => {
    mockPrisma.suppressionList.deleteMany.mockResolvedValue({ count: 1 });
    const result = await removeFromSuppressionList({
      contactEmail: TEST_EMAIL,
      channel: "email",
      clientId: CLIENT_ID,
    });
    expect(result).toBe(1);
  });

  it("returns 0 when no entries match", async () => {
    mockPrisma.suppressionList.deleteMany.mockResolvedValue({ count: 0 });
    const result = await removeFromSuppressionList({
      contactEmail: "nobody@example.com",
      channel: "email",
    });
    expect(result).toBe(0);
  });
});

// =====================================================================
// Consent
// =====================================================================
describe("Consent: recordConsent", () => {
  it("creates a new consent record when none exists", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);
    mockPrisma.consentRecord.create.mockResolvedValue({ id: "consent_new" });
    const id = await recordConsent({
      clientId: CLIENT_ID,
      contactPhone: TEST_PHONE,
      channel: "sms",
      consentType: "express_written",
      consentSource: "form",
    });
    expect(id).toBe("consent_new");
    expect(mockPrisma.consentRecord.create).toHaveBeenCalled();
  });

  it("returns existing consent ID when active consent exists (idempotent)", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue({ id: "consent_existing" });
    const id = await recordConsent({
      clientId: CLIENT_ID,
      contactPhone: TEST_PHONE,
      channel: "sms",
      consentType: "express_written",
      consentSource: "form",
    });
    expect(id).toBe("consent_existing");
    expect(mockPrisma.consentRecord.create).not.toHaveBeenCalled();
  });

  it("throws when neither phone nor email is provided", async () => {
    await expect(
      recordConsent({
        clientId: CLIENT_ID,
        channel: "sms",
        consentType: "express_written",
        consentSource: "form",
      })
    ).rejects.toThrow("At least one of contactPhone or contactEmail is required");
  });
});

describe("Consent: revokeConsent", () => {
  it("revokes active consent records and returns count", async () => {
    mockPrisma.consentRecord.updateMany.mockResolvedValue({ count: 2 });
    const count = await revokeConsent(CLIENT_ID, "sms", TEST_PHONE);
    expect(count).toBe(2);
    expect(mockPrisma.consentRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: CLIENT_ID,
          channel: "sms",
          revokedAt: null,
          contactPhone: TEST_PHONE,
        }),
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      })
    );
  });

  it("uses contactEmail for email identifiers", async () => {
    mockPrisma.consentRecord.updateMany.mockResolvedValue({ count: 1 });
    await revokeConsent(CLIENT_ID, "email", TEST_EMAIL);
    expect(mockPrisma.consentRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          contactEmail: TEST_EMAIL,
        }),
      })
    );
  });

  it("returns 0 when no active consent exists", async () => {
    mockPrisma.consentRecord.updateMany.mockResolvedValue({ count: 0 });
    const count = await revokeConsent(CLIENT_ID, "voice", TEST_PHONE);
    expect(count).toBe(0);
  });
});

describe("Consent: hasValidConsent", () => {
  it("returns true when active consent exists", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue({ id: "c1" });
    const result = await hasValidConsent(CLIENT_ID, "sms", TEST_PHONE);
    expect(result).toBe(true);
  });

  it("returns false when no active consent exists", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);
    const result = await hasValidConsent(CLIENT_ID, "sms", TEST_PHONE);
    expect(result).toBe(false);
  });

  it("uses contactEmail for email identifiers", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);
    await hasValidConsent(CLIENT_ID, "email", TEST_EMAIL);
    expect(mockPrisma.consentRecord.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          contactEmail: TEST_EMAIL,
        }),
      })
    );
  });
});

// =====================================================================
// Data Privacy
// =====================================================================
describe("Data Privacy: purgeUnconvertedLeads", () => {
  it("deletes stale leads in a transaction", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: "lead_1", clientId: CLIENT_ID },
      { id: "lead_2", clientId: CLIENT_ID },
    ]);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<number>) => {
      return fn(mockPrisma);
    });
    mockPrisma.lead.deleteMany.mockResolvedValue({ count: 2 });

    const count = await purgeUnconvertedLeads(90);
    expect(count).toBe(2);
  });

  it("returns 0 when no stale leads exist", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    const count = await purgeUnconvertedLeads(90);
    expect(count).toBe(0);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("Data Privacy: purgeOldContactAttemptLogs", () => {
  it("deletes old logs and returns count", async () => {
    mockPrisma.contactAttemptLog.deleteMany.mockResolvedValue({ count: 50 });
    const count = await purgeOldContactAttemptLogs(180);
    expect(count).toBe(50);
  });

  it("returns 0 when no old logs exist", async () => {
    mockPrisma.contactAttemptLog.deleteMany.mockResolvedValue({ count: 0 });
    const count = await purgeOldContactAttemptLogs(180);
    expect(count).toBe(0);
  });
});

describe("Data Privacy: runPrivacyMaintenanceForClient", () => {
  it("uses client config dataPurgeDays", async () => {
    mockPrisma.complianceConfig.findUnique.mockResolvedValue({ dataPurgeDays: 60 });
    mockPrisma.lead.findMany.mockResolvedValue([]);
    const result = await runPrivacyMaintenanceForClient(CLIENT_ID);
    expect(result).toEqual({ leadsPurged: 0 });
  });

  it("defaults to 90 days when no config found", async () => {
    mockPrisma.complianceConfig.findUnique.mockResolvedValue(null);
    mockPrisma.lead.findMany.mockResolvedValue([]);
    const result = await runPrivacyMaintenanceForClient(CLIENT_ID);
    expect(result).toEqual({ leadsPurged: 0 });
  });

  it("purges stale leads for the client", async () => {
    mockPrisma.complianceConfig.findUnique.mockResolvedValue({ dataPurgeDays: 30 });
    mockPrisma.lead.findMany.mockResolvedValue([{ id: "lead_x" }]);
    mockPrisma.lead.deleteMany.mockResolvedValue({ count: 1 });
    const result = await runPrivacyMaintenanceForClient(CLIENT_ID);
    expect(result).toEqual({ leadsPurged: 1 });
  });
});

// =====================================================================
// Integration: canSendEmail
// =====================================================================
describe("canSendEmail", () => {
  it("returns allowed: true when all checks pass (no HTML)", async () => {
    const result = await canSendEmail(CLIENT_ID, TEST_EMAIL);
    expect(result.allowed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("returns allowed: true when HTML is compliant", async () => {
    const config = defaultConfig();
    const html = compliantHtml(config.physicalAddress);
    const result = await canSendEmail(CLIENT_ID, TEST_EMAIL, html);
    expect(result.allowed).toBe(true);
  });

  it("returns allowed: false when contact is suppressed", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue({ id: "sup_1" });
    const result = await canSendEmail(CLIENT_ID, TEST_EMAIL);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("suppression list");
    expect(result.checks.find((c) => c.check === "suppression_list")?.passed).toBe(false);
  });

  it("returns allowed: false when contact cooldown is active", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(5);
    const result = await canSendEmail(CLIENT_ID, TEST_EMAIL);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cooldown");
  });

  it("returns allowed: false when HTML fails CAN-SPAM validation", async () => {
    const html = "<p>Hello, no address or unsub</p>";
    const result = await canSendEmail(CLIENT_ID, TEST_EMAIL, html);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("CAN-SPAM violation");
  });

  it("logs blocked attempt when suppressed", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue({ id: "sup_1" });
    await canSendEmail(CLIENT_ID, TEST_EMAIL);
    expect(mockPrisma.contactAttemptLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "blocked",
          blockReason: "suppressed",
        }),
      })
    );
  });
});

// =====================================================================
// Integration: canSendSms
// =====================================================================
describe("canSendSms", () => {
  beforeEach(() => {
    // Ensure we're in allowed hours
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T18:00:00Z")); // noon Central
  });

  it("returns allowed: true when all checks pass", async () => {
    const result = await canSendSms(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(true);
  });

  it("returns allowed: false when contact is suppressed", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue({ id: "sup_1" });
    const result = await canSendSms(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("SMS suppression list");
  });

  it("returns allowed: false when no TCPA consent", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);
    const result = await canSendSms(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("TCPA");
    expect(result.reason).toContain("consent");
  });

  it("returns allowed: false during quiet hours", async () => {
    // 11 AM UTC = 5 AM Central -> before 8 AM -> quiet
    vi.setSystemTime(new Date("2026-03-22T11:00:00Z"));
    const result = await canSendSms(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Quiet hours");
  });

  it("returns allowed: false when cooldown active", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(10);
    const result = await canSendSms(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cooldown");
  });

  it("skips consent check when tcpaConsentRequired is false", async () => {
    // Use a unique client ID to avoid the internal config cache from prior tests
    const uncachedClient = "client_no_consent_required";
    mockPrisma.complianceConfig.findUnique.mockResolvedValue({
      ...defaultConfig(),
      clientId: uncachedClient,
      tcpaConsentRequired: false,
    });
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);
    const result = await canSendSms(uncachedClient, TEST_PHONE);
    // Should not fail on consent since it's not required
    expect(result.checks.find((c) => c.check === "tcpa_consent")).toBeUndefined();
  });
});

// =====================================================================
// Integration: canMakeCall
// =====================================================================
describe("canMakeCall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T18:00:00Z")); // noon Central
  });

  it("returns allowed: true when all checks pass", async () => {
    const result = await canMakeCall(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(true);
  });

  it("returns allowed: false when contact is on voice suppression list", async () => {
    mockPrisma.suppressionList.findFirst.mockResolvedValue({ id: "sup_1" });
    const result = await canMakeCall(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("voice suppression list");
  });

  it("returns allowed: false when no consent for voice calls", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);
    const result = await canMakeCall(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("TCPA");
    expect(result.reason).toContain("voice");
  });

  it("returns allowed: false during quiet hours", async () => {
    vi.setSystemTime(new Date("2026-03-22T11:00:00Z")); // 5 AM Central
    const result = await canMakeCall(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Quiet hours");
  });

  it("returns allowed: false when cooldown active", async () => {
    mockPrisma.contactAttemptLog.count.mockResolvedValue(10);
    const result = await canMakeCall(CLIENT_ID, TEST_PHONE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cooldown");
  });

  it("includes all check details in the result", async () => {
    const result = await canMakeCall(CLIENT_ID, TEST_PHONE);
    const checkNames = result.checks.map((c) => c.check);
    expect(checkNames).toContain("suppression_list");
    expect(checkNames).toContain("tcpa_consent");
    expect(checkNames).toContain("quiet_hours");
    expect(checkNames).toContain("contact_cooldown");
  });
});
