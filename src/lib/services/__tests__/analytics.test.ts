import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  lead: { findMany: vi.fn() },
  revenueEvent: { findMany: vi.fn() },
  booking: { findMany: vi.fn() },
  adCampaign: { findMany: vi.fn() },
  reviewResponse: { findMany: vi.fn() },
  emailCampaign: { findMany: vi.fn() },
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

import { generateInsightsReport } from "@/lib/services/analytics";
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
  mockPrisma.lead.findMany.mockResolvedValue([
    { source: "chatbot", status: "won", score: 80, value: 5000, createdAt: new Date() },
    { source: "website", status: "new", score: 50, value: 0, createdAt: new Date() },
    { source: "chatbot", status: "won", score: 90, value: 8000, createdAt: new Date() },
  ]);
  mockPrisma.revenueEvent.findMany.mockResolvedValue([
    { channel: "chatbot", amount: 5000, eventType: "payment", createdAt: new Date() },
    { channel: "website", amount: 3000, eventType: "payment", createdAt: new Date() },
  ]);
  mockPrisma.booking.findMany.mockResolvedValue([
    { status: "completed", serviceType: "repair", createdAt: new Date() },
  ]);
  mockPrisma.adCampaign.findMany.mockResolvedValue([
    { platform: "google", status: "active", budget: 2000, spent: 1500, impressions: 1000, clicks: 50, conversions: 5, costPerLead: 300 },
  ]);
  mockPrisma.reviewResponse.findMany.mockResolvedValue([
    { platform: "google", rating: 5, createdAt: new Date() },
    { platform: "yelp", rating: 4, createdAt: new Date() },
  ]);
  mockPrisma.emailCampaign.findMany.mockResolvedValue([
    { type: "broadcast", status: "sent", recipients: 100, opens: 30, clicks: 10 },
  ]);
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateInsightsReport
// ---------------------------------------------------------------------------

describe("generateInsightsReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a report with summary, insights, kpis, and generatedAt", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      summary: "Ace Plumbing is performing well with strong lead generation.",
      insights: [
        {
          category: "leads",
          title: "Strong chatbot leads",
          finding: "Chatbot generates most leads",
          recommendation: "Invest more in chatbot",
          priority: "high",
          estimatedImpact: "20% more leads",
        },
      ],
    });

    const result = await generateInsightsReport(CLIENT_ID);

    expect(result.summary).toBe("Ace Plumbing is performing well with strong lead generation.");
    expect(result.insights).toHaveLength(1);
    expect(result.kpis).toBeDefined();
    expect(result.generatedAt).toBeTruthy();
  });

  it("calculates KPIs correctly from the data", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      summary: "Summary",
      insights: [{ category: "leads", title: "T", finding: "F", recommendation: "R", priority: "high", estimatedImpact: "I" }],
    });

    const result = await generateInsightsReport(CLIENT_ID);

    expect(result.kpis.totalLeads).toBe(3);
    expect(result.kpis.totalRevenue).toBe(8000);
    expect(result.kpis.conversionRate).toBe(67); // 2 won / 3 total
    expect(result.kpis.avgLeadValue).toBe(6500); // (5000+8000)/2
    expect(result.kpis.activeChannels).toContain("chatbot");
    expect(result.kpis.activeChannels).toContain("website");
  });

  it("uses fallback summary when AI returns no summary", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      insights: [{ category: "leads", title: "T", finding: "F", recommendation: "R", priority: "high", estimatedImpact: "I" }],
    });

    const result = await generateInsightsReport(CLIENT_ID);

    expect(result.summary).toContain("Ace Plumbing");
    expect(result.summary).toContain("3 leads");
  });

  it("uses fallback insights when AI returns empty insights array", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      summary: "Summary",
      insights: [],
    });

    const result = await generateInsightsReport(CLIENT_ID);

    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights[0].category).toBeTruthy();
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateInsightsReport(CLIENT_ID)).rejects.toThrow("blocked");
  });

  it("uses fallback summary and insights on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network error"));

    const result = await generateInsightsReport(CLIENT_ID);

    expect(result.summary).toContain("Ace Plumbing");
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.kpis.totalLeads).toBe(3);
  });

  it("creates an activity event after generating the report", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      summary: "Summary",
      insights: [{ category: "leads", title: "T", finding: "F", recommendation: "R", priority: "high", estimatedImpact: "I" }],
    });

    await generateInsightsReport(CLIENT_ID);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "seo_update",
          title: "AI insights report generated",
        }),
      })
    );
  });
});
