import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  adCampaign: { create: vi.fn(), findMany: vi.fn() },
  lead: { findMany: vi.fn() },
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

import { generateAdCopy, generateAdStrategy } from "@/lib/services/ads";
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

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.adCampaign.create.mockResolvedValue({ id: "ac-1" });
  mockPrisma.adCampaign.findMany.mockResolvedValue([]);
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateAdCopy
// ---------------------------------------------------------------------------

describe("generateAdCopy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns headlines, descriptions, callToAction, displayUrl, and campaignId", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      headlines: ["Ace Plumbing Austin", "Top Plumbers Near You", "Free Estimate Today"],
      descriptions: ["Licensed & insured plumbing pros.", "5-star rated. Call now."],
      callToAction: "Get Free Quote",
      displayUrl: "plumbing/free-quote",
    });

    const result = await generateAdCopy(CLIENT_ID, "google", "leads");

    expect(result.headlines).toHaveLength(3);
    expect(result.descriptions).toHaveLength(2);
    expect(result.callToAction).toBe("Get Free Quote");
    expect(result.displayUrl).toBe("plumbing/free-quote");
    expect(result.campaignId).toBe("ac-1");
  });

  it("creates an AdCampaign record in draft status", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      headlines: ["H1", "H2", "H3"],
      descriptions: ["D1", "D2"],
      callToAction: "Call Now",
      displayUrl: "plumbing/call",
    });

    await generateAdCopy(CLIENT_ID, "google", "calls");

    expect(mockPrisma.adCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          platform: "google",
          status: "draft",
        }),
      })
    );
  });

  it("uses fallback headlines and descriptions when AI returns non-array", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateAdCopy(CLIENT_ID, "google", "leads");

    expect(result.headlines).toHaveLength(3);
    expect(result.descriptions).toHaveLength(2);
    expect(result.callToAction).toBe("Get Free Quote");
    expect(result.headlines[0]).toContain("Ace Plumbing");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateAdCopy(CLIENT_ID, "google", "leads")).rejects.toThrow("blocked");
  });

  it("uses fallback on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateAdCopy(CLIENT_ID, "facebook", "traffic");

    expect(result.headlines).toHaveLength(3);
    expect(result.descriptions).toHaveLength(2);
    expect(result.campaignId).toBe("ac-1");
  });

  it("normalizes platform name to lowercase", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      headlines: ["H1", "H2", "H3"],
      descriptions: ["D1", "D2"],
      callToAction: "CTA",
      displayUrl: "url",
    });

    await generateAdCopy(CLIENT_ID, "Facebook", "leads");

    expect(mockPrisma.adCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ platform: "facebook" }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// generateAdStrategy
// ---------------------------------------------------------------------------

describe("generateAdStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns totalBudget, allocation, recommendations, and expectedOutcome", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      allocation: [
        { platform: "google", budgetPercent: 60, budgetAmount: 60000, campaignType: "Search", targetAudience: "Homeowners", expectedCPL: "$30", rationale: "High intent" },
        { platform: "facebook", budgetPercent: 40, budgetAmount: 40000, campaignType: "Lead Form", targetAudience: "Lookalike", expectedCPL: "$20", rationale: "Social reach" },
      ],
      recommendations: ["Tip 1", "Tip 2", "Tip 3"],
      expectedOutcome: "Expect 20-30 leads per month.",
    });

    const result = await generateAdStrategy(CLIENT_ID, 100000);

    expect(result.totalBudget).toBe(100000);
    expect(result.allocation).toHaveLength(2);
    expect(result.recommendations).toHaveLength(3);
    expect(result.expectedOutcome).toBe("Expect 20-30 leads per month.");
  });

  it("uses fallback allocation when AI returns non-array", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateAdStrategy(CLIENT_ID, 50000);

    expect(result.allocation).toHaveLength(3); // fallback has google, facebook, instagram
    expect(result.allocation[0].platform).toBe("google");
    expect(result.totalBudget).toBe(50000);
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateAdStrategy(CLIENT_ID, 50000)).rejects.toThrow("blocked");
  });

  it("uses fallback strategy on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateAdStrategy(CLIENT_ID, 80000);

    expect(result.totalBudget).toBe(80000);
    expect(result.allocation).toHaveLength(3);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.expectedOutcome).toContain("$800");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      allocation: [{ platform: "google", budgetPercent: 100, budgetAmount: 50000, campaignType: "Search", targetAudience: "All", expectedCPL: "$25", rationale: "Main channel" }],
      recommendations: ["Tip 1"],
      expectedOutcome: "Great results expected.",
    });

    await generateAdStrategy(CLIENT_ID, 50000);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "ad_optimized",
          title: "Ad strategy generated",
        }),
      })
    );
  });

  it("queries existing campaigns and leads for context", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      allocation: [],
      recommendations: [],
      expectedOutcome: "Outcome",
    });

    await generateAdStrategy(CLIENT_ID, 50000);

    expect(mockPrisma.adCampaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: CLIENT_ID } })
    );
    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: CLIENT_ID } })
    );
  });
});
