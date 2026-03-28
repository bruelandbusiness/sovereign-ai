import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  reviewResponse: { create: vi.fn() },
  reviewCampaign: { create: vi.fn() },
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
  extractTextContent: vi.fn((_response: unknown, fallback: string) => fallback),
  extractJSONContent: vi.fn((_response: unknown, fallback: unknown) => fallback),
  sanitizeForPrompt: vi.fn((input: string) => input),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), errorWithCause: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  generateReviewResponse,
  generateReviewRequest,
  type Review,
} from "@/lib/services/reviews";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractTextContent, extractJSONContent } from "@/lib/ai-utils";

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

const positiveReview: Review = {
  platform: "google",
  reviewerName: "Alice",
  rating: 5,
  reviewText: "Fantastic service! Very professional.",
};

const negativeReview: Review = {
  platform: "yelp",
  reviewerName: "Bob",
  rating: 1,
  reviewText: "Terrible experience. Showed up late and overcharged.",
};

const neutralReview: Review = {
  platform: "facebook",
  reviewerName: "Carol",
  rating: 3,
  reviewText: "Okay work but could improve communication.",
};

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.reviewResponse.create.mockResolvedValue({ id: "rr-1" });
  mockPrisma.reviewCampaign.create.mockResolvedValue({ id: "rc-1" });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
  vi.mocked(extractTextContent).mockReturnValue("Thank you for your kind words, Alice!");
}

// ---------------------------------------------------------------------------
// generateReviewResponse
// ---------------------------------------------------------------------------

describe("generateReviewResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a grateful tone for a 5-star review", async () => {
    const result = await generateReviewResponse(CLIENT_ID, positiveReview);

    expect(result.tone).toBe("grateful");
    expect(result.reviewResponseId).toBe("rr-1");
    expect(result.responseText).toBeTruthy();
  });

  it("returns an empathetic tone for a 1-star review", async () => {
    const result = await generateReviewResponse(CLIENT_ID, negativeReview);

    expect(result.tone).toBe("empathetic");
  });

  it("returns a professional tone for a 3-star review", async () => {
    const result = await generateReviewResponse(CLIENT_ID, neutralReview);

    expect(result.tone).toBe("professional");
  });

  it("stores the response as a draft in the database", async () => {
    await generateReviewResponse(CLIENT_ID, positiveReview);

    expect(mockPrisma.reviewResponse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          platform: "google",
          reviewerName: "Alice",
          rating: 5,
          status: "draft",
        }),
      })
    );
  });

  it("uses a fallback response when AI returns empty text", async () => {
    vi.mocked(extractTextContent).mockReturnValue("");

    const result = await generateReviewResponse(CLIENT_ID, positiveReview);

    // Fallback for positive review should contain the reviewer name and owner name
    expect(result.responseText).toContain("Alice");
    expect(result.responseText).toContain("John");
    expect(result.responseText).toContain("Ace Plumbing");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateReviewResponse(CLIENT_ID, positiveReview)).rejects.toThrow("blocked");
  });

  it("uses a fallback response on generic AI errors instead of throwing", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network error"));

    const result = await generateReviewResponse(CLIENT_ID, negativeReview);

    // Negative fallback should contain apology language
    expect(result.responseText).toContain("apologize");
    expect(result.responseText).toContain("Bob");
  });
});

// ---------------------------------------------------------------------------
// generateReviewRequest
// ---------------------------------------------------------------------------

describe("generateReviewRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "Thanks for choosing Ace Plumbing!",
      message: "Hi Dave, thanks for letting us help with your faucet repair...",
    });
  });

  it("returns a subject and message from the AI response", async () => {
    const result = await generateReviewRequest(
      CLIENT_ID,
      "Dave",
      "faucet repair",
      "dave@example.com"
    );

    expect(result.subject).toBe("Thanks for choosing Ace Plumbing!");
    expect(result.message).toContain("Dave");
    expect(result.campaignId).toBe("rc-1");
  });

  it("creates a ReviewCampaign record in pending status", async () => {
    await generateReviewRequest(CLIENT_ID, "Dave", "faucet repair", "dave@example.com", "512-555-0000");

    expect(mockPrisma.reviewCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          customerName: "Dave",
          customerEmail: "dave@example.com",
          customerPhone: "512-555-0000",
          status: "pending",
        }),
      })
    );
  });

  it("uses fallback subject and message when AI returns empty JSON", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});
    vi.mocked(extractTextContent).mockReturnValue("");

    const result = await generateReviewRequest(
      CLIENT_ID,
      "Dave",
      "faucet repair",
      "dave@example.com"
    );

    // Fallback subject should include business name and customer name
    expect(result.subject).toContain("Ace Plumbing");
    expect(result.subject).toContain("Dave");
    // Fallback message should include customer name and service
    expect(result.message).toContain("Dave");
    expect(result.message).toContain("faucet repair");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(
      generateReviewRequest(CLIENT_ID, "Dave", "faucet repair", "dave@example.com")
    ).rejects.toThrow("blocked");
  });

  it("uses fallback on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateReviewRequest(
      CLIENT_ID,
      "Dave",
      "faucet repair",
      "dave@example.com"
    );

    expect(result.subject).toContain("Ace Plumbing");
    expect(result.message).toContain("Dave");
    expect(result.message).toContain("faucet repair");
  });
});
