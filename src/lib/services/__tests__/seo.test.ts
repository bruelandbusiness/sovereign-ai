import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  sEOKeyword: { findFirst: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  contentJob: { create: vi.fn() },
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

import { generateMetaTags, analyzeKeywords } from "@/lib/services/seo";
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
  mockPrisma.activityEvent.create.mockResolvedValue({});
  mockPrisma.sEOKeyword.upsert.mockResolvedValue({});
  mockPrisma.contentJob.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateMetaTags
// ---------------------------------------------------------------------------

describe("generateMetaTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated meta tags when AI response has all fields", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      titleTag: "Best Plumber Austin TX | Ace Plumbing",
      metaDescription: "Austin's top-rated plumber. Call Ace Plumbing for fast, reliable service.",
      ogTitle: "Ace Plumbing - Austin's Trusted Plumber",
      ogDescription: "Professional plumbing services in Austin, TX.",
      h1Suggestion: "Expert Plumbing Services in Austin, TX",
    });

    const result = await generateMetaTags(CLIENT_ID, "/services", "We offer full plumbing services.");

    expect(result.titleTag).toBe("Best Plumber Austin TX | Ace Plumbing");
    expect(result.metaDescription).toContain("Austin");
    expect(result.ogTitle).toContain("Ace Plumbing");
    expect(result.h1Suggestion).toContain("Plumbing");
  });

  it("fills in fallback values for missing fields in AI response", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      titleTag: "Custom Title",
      // other fields missing
    });

    const result = await generateMetaTags(CLIENT_ID, "/about", "About us page");

    expect(result.titleTag).toBe("Custom Title");
    // Fallback values should include business name and vertical
    expect(result.metaDescription).toContain("plumbing");
    expect(result.metaDescription).toContain("Ace Plumbing");
    expect(result.h1Suggestion).toContain("plumbing");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      titleTag: "T",
      metaDescription: "D",
      ogTitle: "OT",
      ogDescription: "OD",
      h1Suggestion: "H",
    });

    await generateMetaTags(CLIENT_ID, "/services", "content");

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "seo_update",
        }),
      })
    );
  });

  it("returns fallback meta tags when AI call fails with generic error", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateMetaTags(CLIENT_ID, "/services", "content");

    expect(result.titleTag).toContain("plumbing");
    expect(result.titleTag).toContain("Ace Plumbing");
    expect(result.metaDescription).toContain("Austin, TX");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateMetaTags(CLIENT_ID, "/services", "content")).rejects.toThrow("blocked");
  });
});

// ---------------------------------------------------------------------------
// analyzeKeywords
// ---------------------------------------------------------------------------

describe("analyzeKeywords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated keywords when AI response is complete", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      primaryKeywords: [
        { keyword: "plumber austin", intent: "transactional", difficulty: "medium", priority: "high" },
      ],
      longTailKeywords: ["emergency plumber austin tx"],
      contentIdeas: ["How to prevent frozen pipes in Austin"],
    });

    const result = await analyzeKeywords(CLIENT_ID);

    expect(result.primaryKeywords).toHaveLength(1);
    expect(result.primaryKeywords[0].keyword).toBe("plumber austin");
    expect(result.longTailKeywords).toContain("emergency plumber austin tx");
    expect(result.contentIdeas).toHaveLength(1);
  });

  it("uses fallback primary keywords when AI returns non-array", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await analyzeKeywords(CLIENT_ID);

    // Fallback keywords should be generated from vertical + city
    expect(result.primaryKeywords.length).toBeGreaterThan(0);
    expect(result.primaryKeywords[0].keyword).toContain("plumbing");
  });

  it("tracks high-priority keywords in the database via upsert", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      primaryKeywords: [
        { keyword: "plumber austin", intent: "transactional", difficulty: "medium", priority: "high" },
        { keyword: "plumbing cost", intent: "informational", difficulty: "low", priority: "low" },
      ],
      longTailKeywords: [],
      contentIdeas: [],
    });

    await analyzeKeywords(CLIENT_ID);

    // Only "high" priority keywords get upserted
    expect(mockPrisma.sEOKeyword.upsert).toHaveBeenCalledTimes(1);
    expect(mockPrisma.sEOKeyword.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId_keyword: { clientId: CLIENT_ID, keyword: "plumber austin" } },
      })
    );
  });

  it("accepts optional vertical and city overrides", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      primaryKeywords: [],
      longTailKeywords: [],
      contentIdeas: [],
    });

    await analyzeKeywords(CLIENT_ID, "HVAC", "Dallas");

    expect(guardedAnthropicCall).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("HVAC"),
      })
    );
  });

  it("returns fallback keywords on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await analyzeKeywords(CLIENT_ID);

    expect(result.primaryKeywords.length).toBeGreaterThan(0);
    expect(result.longTailKeywords.length).toBeGreaterThan(0);
    expect(result.contentIdeas).toEqual([]);
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(analyzeKeywords(CLIENT_ID)).rejects.toThrow("blocked");
  });
});
