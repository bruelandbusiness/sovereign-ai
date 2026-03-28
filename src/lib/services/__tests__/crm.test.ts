import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  lead: { findFirstOrThrow: vi.fn(), update: vi.fn() },
  booking: { findMany: vi.fn() },
  conversationThread: { findMany: vi.fn() },
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

vi.mock("@/lib/notifications", () => ({
  createNotificationForClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { scoreAndPrioritizeLead, generateFollowUpMessage } from "@/lib/services/crm";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractJSONContent } from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CLIENT_ID = "client-1";
const LEAD_ID = "lead-1";

const CLIENT = {
  id: CLIENT_ID,
  businessName: "Ace Plumbing",
  ownerName: "John",
  vertical: "plumbing",
  city: "Austin",
  state: "TX",
  phone: "512-555-0000",
};

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: LEAD_ID,
    clientId: CLIENT_ID,
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "512-555-1234",
    source: "website",
    status: "new",
    stage: null,
    score: null,
    value: 50000,
    notes: "Interested in kitchen remodel",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastContactedAt: null,
    nextFollowUpAt: null,
    ...overrides,
  };
}

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.lead.findFirstOrThrow.mockResolvedValue(makeLead());
  mockPrisma.lead.update.mockResolvedValue({});
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.conversationThread.findMany.mockResolvedValue([]);
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// scoreAndPrioritizeLead
// ---------------------------------------------------------------------------

describe("scoreAndPrioritizeLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a score and stage from AI response", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      score: 75,
      stage: "hot",
      reasoning: "Lead has complete contact info and recent inquiry.",
      nextBestAction: "Call immediately.",
      factors: [{ factor: "contact_info", impact: "positive", detail: "Has email and phone" }],
    });

    const result = await scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID);

    expect(result.score).toBe(75);
    expect(result.stage).toBe("hot");
    expect(result.reasoning).toContain("complete contact info");
    expect(result.factors).toHaveLength(1);
  });

  it("clamps the score to 0-100 range", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      score: 150,
      stage: "hot",
      reasoning: "Very high score",
      nextBestAction: "Call now",
      factors: [],
    });

    const result = await scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID);

    expect(result.score).toBe(100);
  });

  it("updates the lead record with score and stage", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      score: 60,
      stage: "warm",
      reasoning: "Medium engagement",
      nextBestAction: "Send follow-up",
      factors: [],
    });

    await scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID);

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: LEAD_ID },
      data: { score: 60, stage: "warm" },
    });
  });

  it("derives stage from score when AI does not return a stage", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      score: 35,
      reasoning: "Low engagement",
      nextBestAction: "Add to nurture",
      factors: [],
    });

    const result = await scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID);

    expect(result.stage).toBe("cold");
  });

  it("uses fallback scoring when AI returns non-numeric score", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID);

    // Fallback: base 30 + email(10) + phone(15) + website source(10) + value(5) = 70
    expect(result.score).toBe(70);
    expect(result.stage).toBe("hot");
  });

  it("calculates higher fallback score for referral leads with bookings", async () => {
    mockPrisma.lead.findFirstOrThrow.mockResolvedValue(
      makeLead({ source: "referral", status: "qualified" })
    );
    mockPrisma.booking.findMany.mockResolvedValue([
      { status: "confirmed", serviceType: "plumbing", startsAt: new Date() },
    ]);
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID);

    // base(30) + email(10) + phone(15) + referral(20) + qualified(10) + booking(15) + value(5) = 105 -> clamped to 100
    expect(result.score).toBe(100);
    expect(result.stage).toBe("hot");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID)).rejects.toThrow("blocked");
  });

  it("uses fallback scoring on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network error"));

    const result = await scoreAndPrioritizeLead(CLIENT_ID, LEAD_ID);

    expect(result.score).toBeGreaterThan(0);
    expect(["hot", "warm", "cold"]).toContain(result.stage);
    expect(result.nextBestAction).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// generateFollowUpMessage
// ---------------------------------------------------------------------------

describe("generateFollowUpMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated follow-up for email channel", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      message: "Hi Jane, just following up on your plumbing inquiry...",
      subject: "Quick follow-up from Ace Plumbing",
      tone: "friendly",
    });

    const result = await generateFollowUpMessage(CLIENT_ID, LEAD_ID, "email");

    expect(result.message).toContain("Jane");
    expect(result.subject).toContain("Ace Plumbing");
    expect(result.channel).toBe("email");
    expect(result.tone).toBe("friendly");
    expect(result.leadName).toBe("Jane Doe");
  });

  it("returns AI-generated follow-up for sms channel", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      message: "Hi Jane, this is John from Ace Plumbing...",
      tone: "casual",
    });

    const result = await generateFollowUpMessage(CLIENT_ID, LEAD_ID, "sms");

    expect(result.channel).toBe("sms");
    expect(result.message).toContain("Jane");
  });

  it("uses fallback SMS message when AI returns empty", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateFollowUpMessage(CLIENT_ID, LEAD_ID, "sms");

    expect(result.message).toContain("Jane Doe");
    expect(result.message).toContain("Ace Plumbing");
    expect(result.message).toContain("John");
  });

  it("uses fallback email message when AI returns empty", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateFollowUpMessage(CLIENT_ID, LEAD_ID, "email");

    expect(result.message).toContain("Jane Doe");
    expect(result.subject).toContain("Ace Plumbing");
    expect(result.message).toContain("John");
  });

  it("uses fallback call script when AI returns empty", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateFollowUpMessage(CLIENT_ID, LEAD_ID, "call");

    expect(result.message).toContain("Jane Doe");
    expect(result.message).toContain("John");
    expect(result.message).toContain("free estimate");
  });

  it("updates the lead lastContactedAt timestamp", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      message: "Following up...",
      tone: "professional",
    });

    await generateFollowUpMessage(CLIENT_ID, LEAD_ID, "email");

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: LEAD_ID },
      data: { lastContactedAt: expect.any(Date) },
    });
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(
      generateFollowUpMessage(CLIENT_ID, LEAD_ID, "email")
    ).rejects.toThrow("blocked");
  });

  it("falls back gracefully on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateFollowUpMessage(CLIENT_ID, LEAD_ID, "sms");

    expect(result.message).toContain("Jane Doe");
    expect(result.message).toContain("Ace Plumbing");
  });
});
