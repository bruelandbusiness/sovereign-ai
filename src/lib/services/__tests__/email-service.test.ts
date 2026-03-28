import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  emailCampaign: { create: vi.fn() },
  activityEvent: { create: vi.fn() },
  $transaction: vi.fn(),
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

import { generateEmailCampaign, generateDripSequence } from "@/lib/services/email";
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
  mockPrisma.emailCampaign.create.mockResolvedValue({ id: "ec-1" });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  // $transaction receives an array of promises and resolves them all
  mockPrisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
    Promise.all(promises)
  );
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateEmailCampaign
// ---------------------------------------------------------------------------

describe("generateEmailCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns subject, body, campaignId, and campaignType from AI response", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "Spring Special!",
      body: "<h2>Spring Savings</h2><p>Book now!</p>",
    });

    const result = await generateEmailCampaign(CLIENT_ID, "seasonal_promo");

    expect(result).toEqual({
      subject: "Spring Special!",
      body: "<h2>Spring Savings</h2><p>Book now!</p>",
      campaignId: "ec-1",
      campaignType: "seasonal_promo",
    });
  });

  it("creates an EmailCampaign record in draft status", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "Test Subject",
      body: "<p>Test body</p>",
    });

    await generateEmailCampaign(CLIENT_ID, "newsletter");

    expect(mockPrisma.emailCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          status: "draft",
        }),
      })
    );
  });

  it("uses fallback subject and body when AI returns empty JSON", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateEmailCampaign(CLIENT_ID, "seasonal_promo");

    expect(result.subject).toContain("Ace Plumbing");
    expect(result.body).toContain("Ace Plumbing");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateEmailCampaign(CLIENT_ID, "newsletter")).rejects.toThrow("blocked");
  });

  it("uses fallback on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateEmailCampaign(CLIENT_ID, "referral_ask");

    expect(result.subject).toContain("Ace Plumbing");
    expect(result.body).toContain("Ace Plumbing");
    expect(result.campaignId).toBe("ec-1");
  });

  it("sets campaign type to 'reengagement' for reengagement campaigns", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "We miss you!",
      body: "<p>Come back</p>",
    });

    await generateEmailCampaign(CLIENT_ID, "reengagement");

    expect(mockPrisma.emailCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "reengagement" }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// generateDripSequence
// ---------------------------------------------------------------------------

describe("generateDripSequence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
    // Return incrementing campaign IDs
    let callCount = 0;
    mockPrisma.emailCampaign.create.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ id: `ec-${callCount}` });
    });
  });

  it("returns trigger, emails array, and campaignIds from AI response", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      emails: [
        { subject: "Welcome!", body: "<p>Hi</p>", delayDays: 0, purpose: "Welcome" },
        { subject: "Follow up", body: "<p>Tip</p>", delayDays: 2, purpose: "Value" },
        { subject: "Last chance", body: "<p>Act now</p>", delayDays: 5, purpose: "Urgency" },
      ],
    });

    const result = await generateDripSequence(CLIENT_ID, "new_lead");

    expect(result.trigger).toBe("new_lead");
    expect(result.emails).toHaveLength(3);
    expect(result.campaignIds).toHaveLength(3);
  });

  it("creates 3 EmailCampaign records in draft status", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      emails: [
        { subject: "E1", body: "<p>1</p>", delayDays: 0, purpose: "Welcome" },
        { subject: "E2", body: "<p>2</p>", delayDays: 2, purpose: "Value" },
        { subject: "E3", body: "<p>3</p>", delayDays: 5, purpose: "Convert" },
      ],
    });

    await generateDripSequence(CLIENT_ID, "new_lead");

    expect(mockPrisma.emailCampaign.create).toHaveBeenCalledTimes(3);
  });

  it("uses fallback drip sequence when AI returns fewer than 3 emails", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      emails: [{ subject: "Only one", body: "<p>One</p>", delayDays: 0, purpose: "Intro" }],
    });

    const result = await generateDripSequence(CLIENT_ID, "new_lead");

    expect(result.emails).toHaveLength(3);
    expect(result.emails[0].subject).toContain("Ace Plumbing");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateDripSequence(CLIENT_ID, "new_lead")).rejects.toThrow("blocked");
  });

  it("uses fallback drip sequence on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network error"));

    const result = await generateDripSequence(CLIENT_ID, "job_completed");

    expect(result.emails).toHaveLength(3);
    expect(result.emails[0].delayDays).toBeDefined();
    expect(result.emails[0].subject).toBeTruthy();
  });

  it("ensures each email has required fields with defaults", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      emails: [
        { subject: "", body: "", delayDays: null, purpose: "" },
        { subject: "", body: "", delayDays: null, purpose: "" },
        { subject: "", body: "", delayDays: null, purpose: "" },
      ],
    });

    const result = await generateDripSequence(CLIENT_ID, "estimate_sent");

    for (const email of result.emails) {
      expect(email.subject).toBeTruthy();
      expect(email.body).toBeTruthy();
      expect(typeof email.delayDays).toBe("number");
      expect(email.purpose).toBeTruthy();
    }
  });
});
