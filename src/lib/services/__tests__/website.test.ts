import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  contentJob: { create: vi.fn(), update: vi.fn() },
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

vi.mock("@/lib/notifications", () => ({
  createNotificationForClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { generateLandingPage, generateHomepageCopy } from "@/lib/services/website";
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
  phone: "5125551234",
};

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.contentJob.create.mockResolvedValue({ id: "job-1" });
  mockPrisma.contentJob.update.mockResolvedValue({});
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateLandingPage
// ---------------------------------------------------------------------------

describe("generateLandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated landing page when response is complete", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      html: "<section>Landing page content</section>",
      title: "AC Repair Austin | Ace Plumbing",
      metaDescription: "Professional AC repair in Austin by Ace Plumbing.",
    });

    const result = await generateLandingPage(CLIENT_ID, "AC Repair", "Austin");

    expect(result.html).toContain("Landing page content");
    expect(result.title).toContain("AC Repair");
    expect(result.metaDescription).toContain("Austin");
    expect(result.contentJobId).toBe("job-1");
  });

  it("creates a ContentJob and updates it on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      html: "<section>HTML</section>",
      title: "Title",
      metaDescription: "Desc",
    });

    await generateLandingPage(CLIENT_ID, "Drain Cleaning", "Dallas");

    expect(mockPrisma.contentJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "service_page",
          status: "generating",
        }),
      })
    );
    expect(mockPrisma.contentJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job-1" },
        data: expect.objectContaining({ status: "published" }),
      })
    );
  });

  it("uses fallback HTML when AI returns empty html", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      html: "",
      title: "Title",
      metaDescription: "Desc",
    });

    const result = await generateLandingPage(CLIENT_ID, "Pipe Repair", "Austin");

    expect(result.html).toContain("Pipe Repair");
    expect(result.html).toContain("Ace Plumbing");
    expect(result.html).toContain("Austin");
  });

  it("returns fallback landing page on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateLandingPage(CLIENT_ID, "AC Repair", "Austin");

    expect(result.html).toContain("AC Repair");
    expect(result.html).toContain("Ace Plumbing");
    expect(result.title).toContain("AC Repair");
  });

  it("re-throws GovernanceBlockedError and marks job failed", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateLandingPage(CLIENT_ID, "AC Repair", "Austin")).rejects.toThrow("blocked");

    expect(mockPrisma.contentJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      })
    );
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      html: "<section>HTML</section>",
      title: "T",
      metaDescription: "D",
    });

    await generateLandingPage(CLIENT_ID, "AC Repair", "Austin");

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "content_published",
          title: expect.stringContaining("AC Repair"),
        }),
      })
    );
  });

  it("fills fallback title and meta when AI omits them", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      html: "<section>Content</section>",
    });

    const result = await generateLandingPage(CLIENT_ID, "Sewer Line", "Dallas");

    expect(result.title).toContain("Sewer Line");
    expect(result.title).toContain("Dallas");
    expect(result.metaDescription).toContain("Sewer Line");
  });
});

// ---------------------------------------------------------------------------
// generateHomepageCopy
// ---------------------------------------------------------------------------

describe("generateHomepageCopy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated homepage copy when response is complete", async () => {
    const fullCopy = {
      hero: { headline: "Austin's Best Plumbers", subheadline: "Reliable plumbing services.", ctaText: "Get Estimate" },
      about: { heading: "About Ace Plumbing", body: "We are the best." },
      services: [{ name: "Drain Cleaning", description: "Professional drain cleaning." }],
      testimonials: { heading: "Reviews", placeholder: "Coming soon" },
      cta: { heading: "Get Started", subheading: "Call us today", buttonText: "Book Now" },
    };
    vi.mocked(extractJSONContent).mockReturnValue(fullCopy);

    const result = await generateHomepageCopy(CLIENT_ID);

    expect(result.hero.headline).toBe("Austin's Best Plumbers");
    expect(result.services).toHaveLength(1);
    expect(result.cta.buttonText).toBe("Book Now");
  });

  it("fills fallback sections when AI returns partial data", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      hero: { headline: "Custom Headline", subheadline: "Sub", ctaText: "CTA" },
    });

    const result = await generateHomepageCopy(CLIENT_ID);

    expect(result.hero.headline).toBe("Custom Headline");
    // Fallback about section should include business name
    expect(result.about.heading).toContain("Ace Plumbing");
    expect(result.services.length).toBeGreaterThan(0);
    expect(result.cta.buttonText).toBeDefined();
  });

  it("returns full fallback on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateHomepageCopy(CLIENT_ID);

    expect(result.hero.headline).toContain("plumbing");
    expect(result.about.heading).toContain("Ace Plumbing");
    expect(result.services.length).toBeGreaterThan(0);
    expect(result.cta.heading).toBeDefined();
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateHomepageCopy(CLIENT_ID)).rejects.toThrow("blocked");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      hero: { headline: "H", subheadline: "S", ctaText: "C" },
      about: { heading: "A", body: "B" },
      services: [{ name: "S", description: "D" }],
      testimonials: { heading: "T", placeholder: "P" },
      cta: { heading: "C", subheading: "S", buttonText: "B" },
    });

    await generateHomepageCopy(CLIENT_ID);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "content_published",
          title: "Homepage copy generated",
        }),
      })
    );
  });

  it("uses fallback services array when AI returns empty services", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      hero: { headline: "H", subheadline: "S", ctaText: "C" },
      services: [],
    });

    const result = await generateHomepageCopy(CLIENT_ID);

    expect(result.services.length).toBeGreaterThan(0);
    expect(result.services[0].name).toBeDefined();
  });
});
