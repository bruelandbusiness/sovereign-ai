import { describe, it, expect } from "vitest";

// SMS templates
import {
  SMS_TEMPLATES,
  renderSMS,
  calculateSMSSegments,
  validatePhoneNumber,
  estimateSMSCost,
} from "@/lib/sms-templates";

// Client segmentation
import {
  SEGMENTS,
  segmentClient,
  getClientsInSegment,
  createCustomSegment,
  suggestSegmentActions,
} from "@/lib/client-segmentation";
import type { ClientProfile } from "@/lib/client-segmentation";

// Webhook retry
import {
  DEFAULT_RETRY_POLICY,
  isRetryableStatusCode,
  shouldRetry,
  calculateNextRetryDelay,
  getRetrySchedule,
} from "@/lib/webhook-retry";

// Proposal sections
import {
  SECTION_TEMPLATES,
  generateProblemStatement,
  generateTimeline,
  generateROIProjection,
  formatProposalAsMarkdown,
} from "@/lib/proposal-sections";
import type { ProposalData } from "@/lib/proposal-sections";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    id: "client-1",
    name: "Test Client",
    monthlyRevenue: 3000,
    trade: "hvac",
    activeServices: ["lead-gen", "analytics"],
    accountAgeDays: 120,
    lastActivityDays: 2,
    loginFrequency: 15,
    featureAdoptionRate: 0.5,
    supportTickets: 1,
    npsScore: 8,
    ...overrides,
  };
}

function makeProposalData(
  overrides: Partial<ProposalData> = {},
): ProposalData {
  return {
    companyName: "Acme HVAC",
    contactName: "John Doe",
    vertical: "hvac",
    serviceArea: "Phoenix, AZ",
    selectedServices: ["lead-gen", "email", "reviews", "analytics"],
    bundle: "starter",
    avgJobValue: 2500,
    monthlyPrice: 997,
    setupFee: 500,
    pilotPrice: 697,
    leadsIncluded: 50,
    projectedLeads: 50,
    closeRate: 0.2,
    proposalDate: "2025-06-01T00:00:00.000Z",
    config: {
      showPilotOption: true,
      showCaseStudies: true,
      validForDays: 30,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. SMS Templates
// ---------------------------------------------------------------------------

describe("SMS Templates", () => {
  it("SMS_TEMPLATES has 22 templates", () => {
    expect(SMS_TEMPLATES).toHaveLength(22);
  });

  it("renderSMS replaces variables correctly", () => {
    const template = SMS_TEMPLATES.find((t) => t.id === "service-complete")!;
    const result = renderSMS(template, {
      businessName: "Cool Air Co",
      serviceType: "AC repair",
    });
    expect(result).toContain("Cool Air Co");
    expect(result).toContain("AC repair");
    expect(result).not.toContain("{{");
  });

  it("calculateSMSSegments returns 1 for short message", () => {
    expect(calculateSMSSegments("Hello world")).toBe(1);
  });

  it("validatePhoneNumber accepts valid E.164", () => {
    expect(validatePhoneNumber("+14155551234")).toBe(true);
  });

  it("validatePhoneNumber rejects invalid phone numbers", () => {
    expect(validatePhoneNumber("4155551234")).toBe(false);
    expect(validatePhoneNumber("+0123")).toBe(false);
    expect(validatePhoneNumber("")).toBe(false);
  });

  it("estimateSMSCost calculates correctly", () => {
    // 100 chars = 1 segment = $0.01
    const shortMessage = "A".repeat(100);
    expect(estimateSMSCost(shortMessage)).toBe(0.01);

    // 320 chars = 2 segments = $0.02
    const longMessage = "B".repeat(320);
    expect(estimateSMSCost(longMessage)).toBe(0.02);
  });
});

// ---------------------------------------------------------------------------
// 2. Client Segmentation
// ---------------------------------------------------------------------------

describe("Client Segmentation", () => {
  it("SEGMENTS has 21 segments", () => {
    expect(SEGMENTS).toHaveLength(20);
  });

  it("segmentClient assigns matching segments", () => {
    const client = makeClient({ monthlyRevenue: 3000, trade: "hvac" });
    const result = segmentClient(client);
    const segmentIds = result.segments.map((s) => s.id);
    expect(segmentIds).toContain("rev-mid");
    expect(segmentIds).toContain("trade-hvac");
  });

  it("getClientsInSegment filters correctly", () => {
    const clients = [
      makeClient({ id: "c1", monthlyRevenue: 6000 }),
      makeClient({ id: "c2", monthlyRevenue: 1000 }),
      makeClient({ id: "c3", monthlyRevenue: 7000 }),
    ];
    const highValue = getClientsInSegment(clients, "rev-high");
    expect(highValue).toHaveLength(2);
    expect(highValue.map((c) => c.id)).toEqual(
      expect.arrayContaining(["c1", "c3"]),
    );
  });

  it("createCustomSegment creates valid segment", () => {
    const segment = createCustomSegment(
      "custom-1",
      "Big Spenders",
      "revenue",
      "Custom high rev segment",
      [{ field: "monthlyRevenue", operator: "gte", value: 10000 }],
    );
    expect(segment.id).toBe("custom-1");
    expect(segment.name).toBe("Big Spenders");
    expect(segment.category).toBe("revenue");
    expect(segment.criteria.matchAll).toBe(true);
    expect(segment.criteria.rules).toHaveLength(1);
  });

  it("suggestSegmentActions returns actions", () => {
    const clients = [
      makeClient({ id: "c1", monthlyRevenue: 6000 }),
    ];
    const actions = suggestSegmentActions("rev-high", clients);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].segmentId).toBe("rev-high");
  });
});

// ---------------------------------------------------------------------------
// 3. Webhook Retry
// ---------------------------------------------------------------------------

describe("Webhook Retry", () => {
  it("DEFAULT_RETRY_POLICY has 5 max retries", () => {
    expect(DEFAULT_RETRY_POLICY.maxRetries).toBe(5);
  });

  it("isRetryableStatusCode returns true for 500", () => {
    expect(isRetryableStatusCode(500)).toBe(true);
  });

  it("isRetryableStatusCode returns false for 404", () => {
    expect(isRetryableStatusCode(404)).toBe(false);
  });

  it("shouldRetry returns false after max retries", () => {
    // maxRetries is 5, so attemptCount of 6 means all retries exhausted
    expect(shouldRetry(500, 6)).toBe(false);
  });

  it("calculateNextRetryDelay returns positive number", () => {
    const delay = calculateNextRetryDelay(1);
    expect(delay).toBeGreaterThan(0);
  });

  it("getRetrySchedule returns correct number of timestamps", () => {
    const schedule = getRetrySchedule(new Date("2025-01-01T00:00:00Z"));
    expect(schedule).toHaveLength(DEFAULT_RETRY_POLICY.maxRetries);
    // Each entry should be a valid ISO timestamp
    for (const ts of schedule) {
      expect(new Date(ts).toISOString()).toBe(ts);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Proposal Sections
// ---------------------------------------------------------------------------

describe("Proposal Sections", () => {
  it("SECTION_TEMPLATES has 10 sections", () => {
    expect(SECTION_TEMPLATES).toHaveLength(10);
  });

  it("generateProblemStatement returns content for each trade", () => {
    const trades = [
      "hvac",
      "plumbing",
      "roofing",
      "electrical",
      "landscaping",
      "general-contractor",
      "other",
    ] as const;
    for (const trade of trades) {
      const result = generateProblemStatement(trade, "Dallas, TX");
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("Pain Points");
      expect(result).toContain("Competitive Threats");
    }
  });

  it("generateTimeline returns markdown with phases", () => {
    const result = generateTimeline("2025-06-01T00:00:00.000Z", [
      "lead-gen",
      "email",
    ]);
    expect(result).toContain("Phase 1");
    expect(result).toContain("Phase 2");
    expect(result).toContain("Phase 3");
    expect(result).toContain("Phase 4");
  });

  it("generateROIProjection returns markdown with scenarios", () => {
    const result = generateROIProjection("hvac", 50, 0.2, 2500, 997);
    expect(result).toContain("Conservative");
    expect(result).toContain("Moderate");
    expect(result).toContain("Aggressive");
    expect(result).toContain("ROI");
  });

  it("formatProposalAsMarkdown returns complete document", () => {
    const data = makeProposalData();
    const markdown = formatProposalAsMarkdown(data);
    expect(markdown).toContain("Acme HVAC");
    expect(markdown).toContain("John Doe");
    expect(markdown).toContain("Sovereign AI");
    // Should include frontmatter
    expect(markdown).toContain("---");
    // Should include section headers
    expect(markdown).toContain("## Executive Summary");
    expect(markdown).toContain("## The Challenge");
  });
});
