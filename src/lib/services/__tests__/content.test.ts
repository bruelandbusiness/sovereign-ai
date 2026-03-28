import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  contentJob: { create: vi.fn(), update: vi.fn() },
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

import { generateBlogPost, generateSocialPost } from "@/lib/services/content";
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
  phone: "512-555-1234",
};

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.contentJob.create.mockResolvedValue({ id: "job-1" });
  mockPrisma.contentJob.update.mockResolvedValue({});
  mockPrisma.socialPost.create.mockResolvedValue({ id: "sp-1" });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateBlogPost
// ---------------------------------------------------------------------------

describe("generateBlogPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a blog post with title, content, metaDescription, and contentJobId", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      title: "Top 5 Plumbing Tips",
      content: "## Introduction\nGreat plumbing content...",
      metaDescription: "Learn plumbing tips from Ace Plumbing in Austin.",
    });

    const result = await generateBlogPost(CLIENT_ID, "Plumbing Tips", "plumbing tips, Austin");

    expect(result).toEqual({
      title: "Top 5 Plumbing Tips",
      content: "## Introduction\nGreat plumbing content...",
      metaDescription: "Learn plumbing tips from Ace Plumbing in Austin.",
      contentJobId: "job-1",
    });
  });

  it("creates a content job in 'generating' status and updates to 'published' on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      title: "Blog Title",
      content: "Some content",
      metaDescription: "Meta desc",
    });

    await generateBlogPost(CLIENT_ID, "Topic");

    expect(mockPrisma.contentJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "blog",
          status: "generating",
        }),
      })
    );
    expect(mockPrisma.contentJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "published" }),
      })
    );
  });

  it("uses fallback metaDescription when AI returns none", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      title: "My Title",
      content: "Some content here",
    });

    const result = await generateBlogPost(CLIENT_ID, "Drain Cleaning");

    expect(result.metaDescription).toContain("Drain Cleaning");
    expect(result.metaDescription).toContain("Ace Plumbing");
  });

  it("returns empty content and marks job as failed when AI returns no content", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateBlogPost(CLIENT_ID, "Topic");

    expect(result.content).toBe("");
    expect(result.contentJobId).toBe("job-1");
    expect(mockPrisma.contentJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      })
    );
  });

  it("re-throws GovernanceBlockedError and marks job as failed", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateBlogPost(CLIENT_ID, "Topic")).rejects.toThrow("blocked");
    expect(mockPrisma.contentJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      })
    );
  });

  it("returns fallback result on generic AI errors instead of throwing", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network error"));

    const result = await generateBlogPost(CLIENT_ID, "My Topic");

    expect(result.title).toBe("My Topic");
    expect(result.content).toBe("");
    expect(result.contentJobId).toBe("job-1");
  });
});

// ---------------------------------------------------------------------------
// generateSocialPost
// ---------------------------------------------------------------------------

describe("generateSocialPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a social post with platform, content, hashtags, and socialPostId", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      content: "Check out our plumbing services!",
      hashtags: ["plumbing", "Austin"],
    });

    const result = await generateSocialPost(CLIENT_ID, "facebook", "spring promo");

    expect(result).toEqual({
      platform: "facebook",
      content: "Check out our plumbing services!",
      hashtags: ["plumbing", "Austin"],
      socialPostId: "sp-1",
    });
  });

  it("creates a socialPost record in draft status", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      content: "Some post content",
      hashtags: [],
    });

    await generateSocialPost(CLIENT_ID, "Instagram", "tips");

    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          platform: "instagram",
          status: "draft",
        }),
      })
    );
  });

  it("uses fallback content and hashtags when AI returns empty", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateSocialPost(CLIENT_ID, "facebook", "spring cleaning");

    expect(result.content).toContain("Ace Plumbing");
    expect(result.content).toContain("spring cleaning");
    expect(result.hashtags.length).toBeGreaterThan(0);
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateSocialPost(CLIENT_ID, "facebook", "topic")).rejects.toThrow("blocked");
  });

  it("uses fallback content on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateSocialPost(CLIENT_ID, "google", "winter prep");

    expect(result.content).toContain("Ace Plumbing");
    expect(result.content).toContain("winter prep");
    expect(result.hashtags).toContain("plumbing");
  });

  it("normalizes platform name to lowercase", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      content: "Post content",
      hashtags: ["test"],
    });

    const result = await generateSocialPost(CLIENT_ID, "Facebook", "topic");

    expect(result.platform).toBe("facebook");
  });
});
