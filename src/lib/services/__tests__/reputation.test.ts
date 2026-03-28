import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  reviewResponse: { findMany: vi.fn() },
  reviewCampaign: { findMany: vi.fn() },
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

import { monitorReputation, generateReputationStrategy } from "@/lib/services/reputation";
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
const FIXED_NOW = new Date("2026-03-15T12:00:00Z");
const now = FIXED_NOW;
const thirtyOneDaysAgo = new Date(FIXED_NOW.getTime() - 31 * 24 * 60 * 60 * 1000);

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.reviewResponse.findMany.mockResolvedValue([
    { platform: "google", rating: 5, reviewText: "Great service!", createdAt: now },
    { platform: "google", rating: 4, reviewText: "Good work", createdAt: now },
    { platform: "yelp", rating: 2, reviewText: "Not happy", createdAt: thirtyOneDaysAgo },
  ]);
  mockPrisma.reviewCampaign.findMany.mockResolvedValue([
    { rating: 5, completedAt: now },
    { rating: 4, completedAt: thirtyOneDaysAgo },
  ]);
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({
    content: [{ type: "text", text: "Ace Plumbing has a solid reputation with room for improvement." }],
  } as never);
}

// ---------------------------------------------------------------------------
// monitorReputation
// ---------------------------------------------------------------------------

describe("monitorReputation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a reputation score with all expected fields", async () => {
    const result = await monitorReputation(CLIENT_ID);

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.avgRating).toBeGreaterThan(0);
    expect(result.totalReviews).toBe(5); // 3 reviewResponses + 2 reviewCampaigns
    expect(result.sentimentBreakdown).toBeDefined();
    expect(result.platformBreakdown).toBeDefined();
    expect(result.trend).toBeDefined();
    expect(result.summary).toBeTruthy();
  });

  it("calculates sentiment breakdown correctly", async () => {
    const result = await monitorReputation(CLIENT_ID);

    // Ratings: 5, 4, 2, 5, 4 => positive (>=4): 4, neutral (3): 0, negative (<=2): 1
    expect(result.sentimentBreakdown.positive).toBe(4);
    expect(result.sentimentBreakdown.neutral).toBe(0);
    expect(result.sentimentBreakdown.negative).toBe(1);
  });

  it("calculates platform breakdown correctly", async () => {
    const result = await monitorReputation(CLIENT_ID);

    const googlePlatform = result.platformBreakdown.find((p) => p.platform === "google");
    expect(googlePlatform).toBeDefined();
    expect(googlePlatform!.count).toBe(2);
    expect(googlePlatform!.avgRating).toBe(4.5);
  });

  it("uses AI-generated summary from response content", async () => {
    const result = await monitorReputation(CLIENT_ID);

    expect(result.summary).toBe("Ace Plumbing has a solid reputation with room for improvement.");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(monitorReputation(CLIENT_ID)).rejects.toThrow("blocked");
  });

  it("uses fallback summary on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await monitorReputation(CLIENT_ID);

    expect(result.summary).toContain("Ace Plumbing");
    expect(result.summary).toContain("/5");
    expect(result.totalReviews).toBe(5);
  });

  it("creates an activity event after generating the report", async () => {
    await monitorReputation(CLIENT_ID);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "review_received",
          title: "Reputation monitoring report generated",
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// generateReputationStrategy
// ---------------------------------------------------------------------------

describe("generateReputationStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns currentState, strategies, and immediateActions from AI response", async () => {
    // First call is monitorReputation (returns text content), second is strategy call
    let callCount = 0;
    vi.mocked(guardedAnthropicCall).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // monitorReputation call
        return Promise.resolve({
          content: [{ type: "text", text: "Good reputation." }],
        } as never);
      }
      // strategy call
      return Promise.resolve({} as never);
    });

    vi.mocked(extractJSONContent).mockReturnValue({
      currentState: "Ace Plumbing has a strong online presence.",
      strategies: [
        { title: "Get More Reviews", description: "Ask every customer.", priority: "high", timeline: "1 week", expectedOutcome: "More reviews" },
      ],
      immediateActions: ["Respond to all reviews today."],
    });

    const result = await generateReputationStrategy(CLIENT_ID);

    expect(result.currentState).toBe("Ace Plumbing has a strong online presence.");
    expect(result.strategies).toHaveLength(1);
    expect(result.immediateActions).toHaveLength(1);
  });

  it("uses fallback strategies when AI returns non-array", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateReputationStrategy(CLIENT_ID);

    expect(result.strategies.length).toBeGreaterThan(0);
    expect(result.strategies[0].title).toBeTruthy();
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("re-throws GovernanceBlockedError from strategy call", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;

    // First call (monitorReputation) succeeds, second (strategy) throws
    let callCount = 0;
    vi.mocked(guardedAnthropicCall).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          content: [{ type: "text", text: "Summary" }],
        } as never);
      }
      throw new BlockedError("blocked");
    });

    await expect(generateReputationStrategy(CLIENT_ID)).rejects.toThrow("blocked");
  });

  it("uses fallback on generic AI errors for strategy call", async () => {
    let callCount = 0;
    vi.mocked(guardedAnthropicCall).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          content: [{ type: "text", text: "Summary" }],
        } as never);
      }
      throw new Error("network error");
    });

    const result = await generateReputationStrategy(CLIENT_ID);

    expect(result.currentState).toContain("Ace Plumbing");
    expect(result.strategies.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("includes negative review recovery strategy when negative reviews exist", async () => {
    let callCount = 0;
    vi.mocked(guardedAnthropicCall).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          content: [{ type: "text", text: "Summary" }],
        } as never);
      }
      throw new Error("fail to trigger fallback");
    });

    const result = await generateReputationStrategy(CLIENT_ID);

    const negativeStrategy = result.strategies.find((s) =>
      s.title.toLowerCase().includes("negative")
    );
    expect(negativeStrategy).toBeDefined();
  });
});
