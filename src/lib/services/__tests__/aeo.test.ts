import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  aEOContent: { create: vi.fn() },
  aEOQuery: { create: vi.fn(), createMany: vi.fn() },
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

import { generateFAQSchema, generateStructuredAnswers } from "@/lib/services/aeo";
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
  mockPrisma.aEOContent.create.mockResolvedValue({ id: "content-1" });
  mockPrisma.aEOQuery.create.mockResolvedValue({});
  mockPrisma.aEOQuery.createMany.mockResolvedValue({ count: 0 });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
    Promise.all(promises)
  );
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateFAQSchema
// ---------------------------------------------------------------------------

describe("generateFAQSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated FAQ items with schema markup", async () => {
    const faqs = [
      { question: "How much does AC repair cost?", answer: "AC repair costs vary. Contact Ace Plumbing for a free estimate." },
      { question: "Is Ace Plumbing licensed?", answer: "Yes, fully licensed and insured in Austin, TX." },
    ];
    vi.mocked(extractJSONContent).mockReturnValue({ faqs });

    const result = await generateFAQSchema(CLIENT_ID, "AC Repair");

    expect(result.faqs).toHaveLength(2);
    expect(result.faqs[0].question).toContain("AC repair");
    expect(result.schemaMarkup).toContain("FAQPage");
    expect(result.schemaMarkup).toContain("application/ld+json");
    expect(result.contentId).toBe("content-1");
  });

  it("stores FAQ as AEOContent record", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      faqs: [{ question: "Q", answer: "A" }],
    });

    await generateFAQSchema(CLIENT_ID, "Drain Cleaning");

    expect(mockPrisma.aEOContent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "faq",
          status: "draft",
        }),
      })
    );
  });

  it("tracks target queries via AEOQuery", async () => {
    const faqs = [
      { question: "Q1?", answer: "A1" },
      { question: "Q2?", answer: "A2" },
    ];
    vi.mocked(extractJSONContent).mockReturnValue({ faqs });

    await generateFAQSchema(CLIENT_ID, "Pipe Repair");

    expect(mockPrisma.aEOQuery.createMany).toHaveBeenCalled();
  });

  it("uses fallback FAQs when AI returns empty array", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({ faqs: [] });

    const result = await generateFAQSchema(CLIENT_ID, "AC Repair");

    expect(result.faqs.length).toBeGreaterThan(0);
    expect(result.faqs[0].question).toContain("AC Repair");
    expect(result.faqs[0].answer).toContain("Ace Plumbing");
  });

  it("returns fallback FAQs on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateFAQSchema(CLIENT_ID, "Water Heater");

    expect(result.faqs.length).toBeGreaterThan(0);
    expect(result.faqs[0].question).toContain("Water Heater");
    expect(result.schemaMarkup).toContain("FAQPage");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateFAQSchema(CLIENT_ID, "AC Repair")).rejects.toThrow("blocked");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      faqs: [{ question: "Q", answer: "A" }],
    });

    await generateFAQSchema(CLIENT_ID, "Drain Cleaning");

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "seo_update",
          title: expect.stringContaining("Drain Cleaning"),
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// generateStructuredAnswers
// ---------------------------------------------------------------------------

describe("generateStructuredAnswers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated structured answers", async () => {
    const answers = [
      { question: "How much does plumbing cost?", answer: "Costs vary by job.", sources: ["/faq"], format: "paragraph" as const },
    ];
    vi.mocked(extractJSONContent).mockReturnValue({ answers });

    const result = await generateStructuredAnswers(CLIENT_ID, ["How much does plumbing cost?"]);

    expect(result.answers).toHaveLength(1);
    expect(result.answers[0].question).toContain("plumbing");
    expect(result.answers[0].format).toBe("paragraph");
  });

  it("stores each answer as AEOContent", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      answers: [
        { question: "Q1", answer: "A1", sources: ["/faq"], format: "paragraph" },
        { question: "Q2", answer: "A2", sources: ["/services"], format: "list" },
      ],
    });

    await generateStructuredAnswers(CLIENT_ID, ["Q1", "Q2"]);

    expect(mockPrisma.aEOContent.create).toHaveBeenCalledTimes(2);
  });

  it("fills fallback answers for questions AI did not answer", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({ answers: [] });

    const result = await generateStructuredAnswers(CLIENT_ID, ["How long does repair take?", "What are your hours?"]);

    expect(result.answers).toHaveLength(2);
    expect(result.answers[0].answer).toContain("Ace Plumbing");
    expect(result.answers[0].format).toBe("paragraph");
    expect(result.answers[0].sources).toContain("/faq");
  });

  it("returns fallback answers on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateStructuredAnswers(CLIENT_ID, ["What services do you offer?"]);

    expect(result.answers).toHaveLength(1);
    expect(result.answers[0].answer).toContain("Ace Plumbing");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(
      generateStructuredAnswers(CLIENT_ID, ["question"])
    ).rejects.toThrow("blocked");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      answers: [{ question: "Q", answer: "A", sources: [], format: "paragraph" }],
    });

    await generateStructuredAnswers(CLIENT_ID, ["Q"]);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "seo_update",
        }),
      })
    );
  });

  it("limits input to 10 questions maximum", async () => {
    const manyQuestions = Array.from({ length: 15 }, (_, i) => `Question ${i}?`);
    vi.mocked(extractJSONContent).mockReturnValue({ answers: [] });

    const result = await generateStructuredAnswers(CLIENT_ID, manyQuestions);

    // Fallback fills missing answers up to sanitizedQuestions.length (capped at 10)
    expect(result.answers.length).toBeLessThanOrEqual(10);
  });
});
