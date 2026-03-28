import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  customerLifetimeValue: { findMany: vi.fn(), updateMany: vi.fn() },
  lead: { findMany: vi.fn() },
  emailCampaign: { create: vi.fn() },
  activityEvent: { create: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

vi.mock("@/lib/governance/ai-guard", () => ({
  guardedAnthropicCall: vi.fn(),
  GovernanceBlockedError: class extends Error {
    reason: string;
    constructor(reason: string) {
      super(reason);
      this.reason = reason;
    }
  },
}));

vi.mock("@/lib/ai-utils", () => ({
  extractJSONContent: vi.fn((_response: unknown, fallback: unknown) => fallback),
  sanitizeForPrompt: vi.fn((input: string) => input),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), errorWithCause: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { identifyAtRiskCustomers, generateReactivationCampaign } from "@/lib/services/ltv-activator";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractJSONContent } from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CLIENT_ID = "client-1";
const CLIENT = {
  id: CLIENT_ID,
  businessName: "Ace Plumbing",
  ownerName: "John",
  vertical: "plumbing",
  city: "Austin",
  state: "TX",
};

// Use a fixed reference date instead of new Date() at module load time to
// avoid flakiness when the test file is cached across different execution times.
const now = new Date("2026-03-15T12:00:00Z");
const twoHundredDaysAgo = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000);
const oneHundredDaysAgo = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([]);
  mockPrisma.customerLifetimeValue.updateMany.mockResolvedValue({});
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.emailCampaign.create.mockResolvedValue({ id: "campaign-1" });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// identifyAtRiskCustomers
// ---------------------------------------------------------------------------

describe("identifyAtRiskCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns empty result when no at-risk customers exist", async () => {
    mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([
      { customerEmail: "a@test.com", customerName: "Alice", lastJobDate: new Date(), totalRevenue: 5000, totalJobs: 3 },
    ]);

    const result = await identifyAtRiskCustomers(CLIENT_ID);

    expect(result.totalAtRisk).toBe(0);
    expect(result.atRiskCustomers).toHaveLength(0);
    expect(result.summary).toContain("No at-risk customers");
  });

  it("identifies high-risk customers with no activity in 180+ days", async () => {
    mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([
      { customerEmail: "old@test.com", customerName: "Old Customer", lastJobDate: twoHundredDaysAgo, totalRevenue: 10000, totalJobs: 5 },
    ]);
    vi.mocked(extractJSONContent).mockReturnValue({
      summary: "1 at-risk customer found",
      recommendations: [{ customerEmail: "old@test.com", recommendedAction: "Send win-back email" }],
    });

    const result = await identifyAtRiskCustomers(CLIENT_ID);

    expect(result.totalAtRisk).toBe(1);
    expect(result.atRiskCustomers[0].churnRisk).toBe("high");
    expect(result.atRiskCustomers[0].recommendedAction).toBe("Send win-back email");
  });

  it("identifies medium-risk customers with 90-180 days inactivity", async () => {
    mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([
      { customerEmail: "med@test.com", customerName: "Med Customer", lastJobDate: oneHundredDaysAgo, totalRevenue: 5000, totalJobs: 2 },
    ]);
    vi.mocked(extractJSONContent).mockReturnValue({ summary: "S", recommendations: [] });

    const result = await identifyAtRiskCustomers(CLIENT_ID);

    expect(result.totalAtRisk).toBe(1);
    expect(result.atRiskCustomers[0].churnRisk).toBe("medium");
  });

  it("creates activity event with at-risk summary", async () => {
    mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([
      { customerEmail: "old@test.com", customerName: "Old", lastJobDate: twoHundredDaysAgo, totalRevenue: 10000, totalJobs: 5 },
    ]);
    vi.mocked(extractJSONContent).mockReturnValue({ summary: "S", recommendations: [] });

    await identifyAtRiskCustomers(CLIENT_ID);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "email_sent",
        }),
      })
    );
  });

  it("returns fallback recommendations on generic AI errors", async () => {
    mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([
      { customerEmail: "old@test.com", customerName: "Old", lastJobDate: twoHundredDaysAgo, totalRevenue: 10000, totalJobs: 5 },
    ]);
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await identifyAtRiskCustomers(CLIENT_ID);

    expect(result.totalAtRisk).toBe(1);
    expect(result.atRiskCustomers[0].recommendedAction).toContain("re-engagement");
  });

  it("re-throws GovernanceBlockedError", async () => {
    mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([
      { customerEmail: "x@test.com", customerName: "X", lastJobDate: twoHundredDaysAgo, totalRevenue: 100, totalJobs: 1 },
    ]);
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(identifyAtRiskCustomers(CLIENT_ID)).rejects.toThrow("blocked");
  });

  it("includes won leads with no recent activity", async () => {
    mockPrisma.customerLifetimeValue.findMany.mockResolvedValue([]);
    mockPrisma.lead.findMany.mockResolvedValue([
      { name: "Lead Person", email: "lead@test.com", phone: "555", value: 2000, updatedAt: twoHundredDaysAgo },
    ]);
    vi.mocked(extractJSONContent).mockReturnValue({ summary: "S", recommendations: [] });

    const result = await identifyAtRiskCustomers(CLIENT_ID);

    expect(result.totalAtRisk).toBe(1);
    expect(result.atRiskCustomers[0].customerEmail).toBe("lead@test.com");
    expect(result.atRiskCustomers[0].churnRisk).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// generateReactivationCampaign
// ---------------------------------------------------------------------------

describe("generateReactivationCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated reactivation campaign when response is complete", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "We miss you!",
      emailBody: "<h2>Come back</h2><p>We'd love to see you again.</p>",
      smsMessage: "Hi! We miss you at Ace Plumbing. Book today for 15% off!",
      offer: "15% off next service",
    });

    const result = await generateReactivationCampaign(CLIENT_ID, "inactive 6+ months");

    expect(result.subject).toBe("We miss you!");
    expect(result.emailBody).toContain("Come back");
    expect(result.smsMessage).toContain("Ace Plumbing");
    expect(result.offer).toContain("15%");
    expect(result.segment).toBe("inactive 6+ months");
  });

  it("creates an EmailCampaign record in draft status", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "S", emailBody: "B", smsMessage: "T", offer: "O",
    });

    const result = await generateReactivationCampaign(CLIENT_ID, "past AC customers");

    expect(mockPrisma.emailCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "reengagement",
          status: "draft",
        }),
      })
    );
    expect(result.campaignId).toBe("campaign-1");
  });

  it("uses fallback content when AI omits fields", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateReactivationCampaign(CLIENT_ID, "dormant segment");

    expect(result.subject).toContain("Ace Plumbing");
    expect(result.emailBody).toContain("Ace Plumbing");
    expect(result.smsMessage).toContain("John");
    expect(result.offer).toContain("15%");
  });

  it("returns fallback campaign on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateReactivationCampaign(CLIENT_ID, "inactive customers");

    expect(result.subject).toContain("Ace Plumbing");
    expect(result.emailBody).toContain("John");
    expect(result.smsMessage).toContain("Ace Plumbing");
    expect(result.offer).toContain("15%");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(
      generateReactivationCampaign(CLIENT_ID, "segment")
    ).rejects.toThrow("blocked");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "S", emailBody: "B", smsMessage: "T", offer: "O",
    });

    await generateReactivationCampaign(CLIENT_ID, "inactive 6+ months");

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "email_sent",
          title: "Reactivation campaign created",
        }),
      })
    );
  });
});
