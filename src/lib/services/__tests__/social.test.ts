import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  socialPost: { create: vi.fn() },
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

import { generateContentCalendar, generatePostCaption } from "@/lib/services/social";
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
  mockPrisma.socialPost.create.mockResolvedValue({ id: "post-1" });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateContentCalendar
// ---------------------------------------------------------------------------

describe("generateContentCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated calendar entries when AI response is complete", async () => {
    const entries = [
      { week: 1, day: "Monday", platform: "facebook", topic: "Pro tip", caption: "Tip caption", hashtags: ["plumbing"], contentType: "photo" },
      { week: 1, day: "Wednesday", platform: "instagram", topic: "Before/after", caption: "Before after caption", hashtags: ["homeservice"], contentType: "carousel" },
    ];
    vi.mocked(extractJSONContent).mockReturnValue({ theme: "Spring plumbing", entries });

    const result = await generateContentCalendar(CLIENT_ID, 2);

    expect(result.theme).toBe("Spring plumbing");
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].platform).toBe("facebook");
  });

  it("creates SocialPost records for each calendar entry", async () => {
    const entries = [
      { week: 1, day: "Monday", platform: "facebook", topic: "Tip", caption: "Caption", hashtags: ["plumbing"], contentType: "photo" },
    ];
    vi.mocked(extractJSONContent).mockReturnValue({ theme: "Theme", entries });

    const result = await generateContentCalendar(CLIENT_ID);

    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          platform: "facebook",
          status: "draft",
        }),
      })
    );
    expect(result.socialPostIds).toContain("post-1");
  });

  it("uses fallback calendar when AI returns empty entries", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({ theme: "Theme", entries: [] });

    const result = await generateContentCalendar(CLIENT_ID, 2);

    // Fallback generates 3 posts per week
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.entries[0].day).toBeDefined();
    expect(result.entries[0].platform).toBeDefined();
  });

  it("returns fallback calendar on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateContentCalendar(CLIENT_ID, 1);

    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.theme).toContain("Ace Plumbing");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateContentCalendar(CLIENT_ID)).rejects.toThrow("blocked");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      theme: "Theme",
      entries: [{ week: 1, day: "Monday", platform: "facebook", topic: "T", caption: "C", hashtags: [], contentType: "photo" }],
    });

    await generateContentCalendar(CLIENT_ID, 4);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "content_published",
        }),
      })
    );
  });

  it("clamps weeks to valid range 1-8", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({ theme: "T", entries: [] });

    await generateContentCalendar(CLIENT_ID, 20);

    expect(guardedAnthropicCall).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("8-week"),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// generatePostCaption
// ---------------------------------------------------------------------------

describe("generatePostCaption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated caption when response is complete", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      caption: "Check out our latest project!",
      hashtags: ["plumbing", "Austin"],
      callToAction: "Call us today!",
    });

    const result = await generatePostCaption(CLIENT_ID, "instagram", "Before and after drain repair");

    expect(result.caption).toBe("Check out our latest project!");
    expect(result.hashtags).toContain("plumbing");
    expect(result.callToAction).toBe("Call us today!");
  });

  it("creates a SocialPost record in draft status", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      caption: "Caption text",
      hashtags: ["test"],
      callToAction: "CTA",
    });

    const result = await generatePostCaption(CLIENT_ID, "facebook", "New project");

    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          platform: "facebook",
          status: "draft",
        }),
      })
    );
    expect(result.socialPostId).toBe("post-1");
  });

  it("uses fallback caption and hashtags on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generatePostCaption(CLIENT_ID, "instagram", "Drain repair photo");

    expect(result.caption).toContain("Ace Plumbing");
    expect(result.caption).toContain("Drain repair photo");
    expect(result.hashtags.length).toBeGreaterThan(0);
    expect(result.callToAction).toContain("free estimate");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generatePostCaption(CLIENT_ID, "facebook", "description")).rejects.toThrow("blocked");
  });

  it("fills fallback CTA when AI omits callToAction", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      caption: "Nice caption",
      hashtags: [],
    });

    const result = await generatePostCaption(CLIENT_ID, "google", "Service photo");

    expect(result.callToAction).toBe("Contact us today!");
  });

  it("handles empty caption from AI by generating fallback", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      caption: "",
      hashtags: [],
      callToAction: "CTA",
    });

    const result = await generatePostCaption(CLIENT_ID, "facebook", "Water heater install");

    expect(result.caption).toContain("Ace Plumbing");
    expect(result.caption).toContain("Water heater install");
  });
});
