import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  lead: { findMany: vi.fn() },
  booking: { findMany: vi.fn() },
  adCampaign: { findMany: vi.fn(), create: vi.fn() },
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

import { generateRetargetingAudience, generateRetargetingAdCopy } from "@/lib/services/retargeting";
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
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.adCampaign.findMany.mockResolvedValue([]);
  mockPrisma.adCampaign.create.mockResolvedValue({ id: "campaign-1" });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateRetargetingAudience
// ---------------------------------------------------------------------------

describe("generateRetargetingAudience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated audience segments when response is complete", async () => {
    const segments = [
      { name: "Website Visitors", description: "Recent visitors", criteria: "30 days", estimatedSize: "large", recommendedPlatform: "facebook", priority: "high" as const },
    ];
    vi.mocked(extractJSONContent).mockReturnValue({ strategy: "Focus on high-intent visitors", segments });

    const result = await generateRetargetingAudience(CLIENT_ID);

    expect(result.strategy).toBe("Focus on high-intent visitors");
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].name).toBe("Website Visitors");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      strategy: "Strategy",
      segments: [{ name: "S1", description: "D", criteria: "C", estimatedSize: "small", recommendedPlatform: "google", priority: "high" }],
    });

    await generateRetargetingAudience(CLIENT_ID);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "ad_optimized",
        }),
      })
    );
  });

  it("uses fallback segments when AI returns non-array segments", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({ strategy: "S" });

    const result = await generateRetargetingAudience(CLIENT_ID);

    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments[0].name).toBeDefined();
    expect(result.segments[0].priority).toBeDefined();
  });

  it("returns fallback strategy and segments on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateRetargetingAudience(CLIENT_ID);

    expect(result.strategy).toContain("Ace Plumbing");
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateRetargetingAudience(CLIENT_ID)).rejects.toThrow("blocked");
  });

  it("gathers lead and booking data for context", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { source: "website", status: "new", stage: null, value: 100, createdAt: new Date() },
    ]);
    mockPrisma.booking.findMany.mockResolvedValue([
      { status: "completed", serviceType: "drain repair", createdAt: new Date() },
    ]);
    vi.mocked(extractJSONContent).mockReturnValue({ strategy: "S", segments: [] });

    await generateRetargetingAudience(CLIENT_ID);

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: CLIENT_ID } })
    );
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: CLIENT_ID } })
    );
  });
});

// ---------------------------------------------------------------------------
// generateRetargetingAdCopy
// ---------------------------------------------------------------------------

describe("generateRetargetingAdCopy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated ad copy when response is complete", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      headline: "Still Need a Plumber?",
      description: "Ace Plumbing is here to help. Get a free estimate today.",
      callToAction: "Book Now",
      emotionalHook: "FOMO",
    });

    const result = await generateRetargetingAdCopy(CLIENT_ID, "website visitors", "facebook");

    expect(result.headline).toBe("Still Need a Plumber?");
    expect(result.description).toContain("Ace Plumbing");
    expect(result.callToAction).toBe("Book Now");
    expect(result.emotionalHook).toBe("FOMO");
  });

  it("creates an AdCampaign record in draft status", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      headline: "H", description: "D", callToAction: "CTA", emotionalHook: "urgency",
    });

    const result = await generateRetargetingAdCopy(CLIENT_ID, "past visitors", "google");

    expect(mockPrisma.adCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          platform: "google",
          status: "draft",
        }),
      })
    );
    expect(result.campaignId).toBe("campaign-1");
  });

  it("fills fallback values for missing fields in AI response", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateRetargetingAdCopy(CLIENT_ID, "high-intent visitors", "facebook");

    expect(result.headline).toContain("Ace Plumbing");
    expect(result.callToAction).toBe("Get Free Quote");
    expect(result.emotionalHook).toBe("urgency");
  });

  it("returns fallback ad copy on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateRetargetingAdCopy(CLIENT_ID, "website visitors", "google");

    expect(result.headline).toContain("Ace Plumbing");
    expect(result.description).toContain("plumbing");
    expect(result.callToAction).toBe("Get Free Quote");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(
      generateRetargetingAdCopy(CLIENT_ID, "audience", "facebook")
    ).rejects.toThrow("blocked");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      headline: "H", description: "D", callToAction: "C", emotionalHook: "social proof",
    });

    await generateRetargetingAdCopy(CLIENT_ID, "past customers", "instagram");

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "ad_optimized",
          title: expect.stringContaining("instagram"),
        }),
      })
    );
  });
});
