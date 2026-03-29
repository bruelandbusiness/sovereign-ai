import { describe, it, expect } from "vitest";

// Content calendar
import {
  generateMonthlyCalendar,
  getOptimalPostTimes,
  CONTENT_THEMES,
  calculateContentMix,
} from "../content-calendar";

// Customer journey
import {
  JOURNEY_STAGES,
  identifyCurrentStage,
  calculateFunnelMetrics,
  suggestNextAction,
  mapJourneyFromEvents,
  type JourneyEvent,
} from "../customer-journey";

// Integration health
import {
  INTEGRATIONS,
  getIntegrationStatus,
  calculateUptime,
  type HealthCheck,
} from "../integration-health";

// Service onboarding
import {
  getChecklistForService,
  calculateOnboardingProgress,
  isOnboardingComplete,
} from "../service-onboarding";

// Audit trail
import {
  createAuditEntry,
  filterAuditLog,
  formatAuditEntry,
} from "../audit-trail";

// Data export
import {
  formatAsCSV,
  formatAsJSON,
  generateExportFilename,
} from "../data-export";

/* ------------------------------------------------------------------ */
/*  1. Content Calendar                                                */
/* ------------------------------------------------------------------ */

describe("Content Calendar", () => {
  it("generateMonthlyCalendar returns posts for a given month", () => {
    const calendar = generateMonthlyCalendar(2026, 3, "hvac");

    expect(calendar.month).toBe(3);
    expect(calendar.year).toBe(2026);
    expect(calendar.trade).toBe("hvac");
    expect(calendar.posts.length).toBeGreaterThan(0);
    // Every post should have a scheduled date in March 2026
    for (const post of calendar.posts) {
      expect(post.scheduledDate).toMatch(/^2026-03-\d{2}$/);
      expect(post.status).toBe("draft");
    }
  });

  it("getOptimalPostTimes returns results for each platform", () => {
    const allTimes = getOptimalPostTimes();
    expect(allTimes.length).toBeGreaterThan(0);

    const platforms = new Set(allTimes.map((t) => t.platform));
    expect(platforms).toContain("facebook");
    expect(platforms).toContain("instagram");
    expect(platforms).toContain("google");
    expect(platforms).toContain("email");

    // Should be sorted by engagementScore descending
    for (let i = 1; i < allTimes.length; i++) {
      expect(allTimes[i - 1].engagementScore).toBeGreaterThanOrEqual(
        allTimes[i].engagementScore,
      );
    }
  });

  it("CONTENT_THEMES has 12 themes", () => {
    expect(CONTENT_THEMES).toHaveLength(12);
    const ids = CONTENT_THEMES.map((t) => t.id);
    expect(ids).toContain("spring_home_maintenance");
    expect(ids).toContain("industry_news");
  });

  it("calculateContentMix percentages sum to 100", () => {
    const mix = calculateContentMix();
    const total = mix.reduce((sum, m) => sum + m.percentage, 0);
    expect(total).toBe(100);
    // Each entry should have postsPerMonth >= 1
    for (const entry of mix) {
      expect(entry.postsPerMonth).toBeGreaterThanOrEqual(1);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  2. Customer Journey                                                */
/* ------------------------------------------------------------------ */

describe("Customer Journey", () => {
  it("JOURNEY_STAGES has 8 stages", () => {
    expect(JOURNEY_STAGES).toHaveLength(8);
    expect(JOURNEY_STAGES[0].name).toBe("awareness");
    expect(JOURNEY_STAGES[7].name).toBe("advocacy");
  });

  it("identifyCurrentStage returns the highest stage from events", () => {
    const events: JourneyEvent[] = [
      { customerId: "c1", eventType: "ad_click", timestamp: new Date("2026-01-01") },
      { customerId: "c1", eventType: "blog_visit", timestamp: new Date("2026-01-02") },
      { customerId: "c1", eventType: "pricing_page_view", timestamp: new Date("2026-01-03") },
    ];

    const stage = identifyCurrentStage(events);
    expect(stage).toBe("consideration");
  });

  it("calculateFunnelMetrics returns stage metrics", () => {
    // Build a simple journey map via mapJourneyFromEvents
    const events: JourneyEvent[] = [
      { customerId: "c1", eventType: "ad_click", timestamp: new Date("2026-01-01") },
      { customerId: "c1", eventType: "blog_visit", timestamp: new Date("2026-01-02") },
      { customerId: "c1", eventType: "purchase_complete", timestamp: new Date("2026-01-10") },
    ];
    const journey = mapJourneyFromEvents("c1", events);
    expect(journey).not.toBeNull();

    const funnel = calculateFunnelMetrics([journey!]);
    expect(funnel.totalCustomers).toBe(1);
    expect(funnel.stages.length).toBe(8);
    // Customer reached purchase (order 5), so awareness through purchase should have 1
    const awarenessMetric = funnel.stages.find((s) => s.stage === "awareness");
    expect(awarenessMetric?.customersAtStage).toBe(1);
  });

  it("suggestNextAction returns a recommendation", () => {
    const action = suggestNextAction("awareness");
    expect(action).not.toBeNull();
    expect(action!.currentStage).toBe("awareness");
    expect(action!.targetStage).toBe("interest");
    expect(action!.recommendedTouchpoint).toBeTruthy();
    expect(action!.rationale).toContain("Interest");
  });
});

/* ------------------------------------------------------------------ */
/*  3. Integration Health                                              */
/* ------------------------------------------------------------------ */

describe("Integration Health", () => {
  it("INTEGRATIONS has entries for all major platforms", () => {
    expect(INTEGRATIONS.length).toBeGreaterThanOrEqual(10);
    const ids = INTEGRATIONS.map((i) => i.id);
    expect(ids).toContain("google-ads");
    expect(ids).toContain("stripe");
    expect(ids).toContain("vercel");
    expect(ids).toContain("meta-facebook");
    expect(ids).toContain("openai");
  });

  it("getIntegrationStatus returns valid status values", () => {
    const now = new Date().toISOString();
    const checks: HealthCheck[] = [
      { integrationId: "x", timestamp: now, healthy: true, latencyMs: 50 },
    ];
    const status = getIntegrationStatus(checks, now);
    expect(["connected", "disconnected", "degraded", "unknown"]).toContain(status);
    expect(status).toBe("connected");

    // No checks should return unknown
    const unknownStatus = getIntegrationStatus([], now);
    expect(unknownStatus).toBe("unknown");
  });

  it("calculateUptime returns 100 for all-success checks", () => {
    const checks: HealthCheck[] = [
      { integrationId: "a", timestamp: "2026-01-01T00:00:00Z", healthy: true, latencyMs: 50 },
      { integrationId: "a", timestamp: "2026-01-01T01:00:00Z", healthy: true, latencyMs: 60 },
      { integrationId: "a", timestamp: "2026-01-01T02:00:00Z", healthy: true, latencyMs: 40 },
    ];
    expect(calculateUptime(checks)).toBe(100);
  });
});

/* ------------------------------------------------------------------ */
/*  4. Service Onboarding                                              */
/* ------------------------------------------------------------------ */

describe("Service Onboarding", () => {
  it('getChecklistForService returns checklist for "chatbot"', () => {
    const checklist = getChecklistForService("chatbot");
    expect(checklist).not.toBeNull();
    expect(checklist!.serviceId).toBe("chatbot");
    expect(checklist!.serviceName).toBe("AI Chat Assistant");
    expect(checklist!.steps.length).toBeGreaterThan(0);
  });

  it("calculateOnboardingProgress returns 0 for no completed steps", () => {
    const progress = calculateOnboardingProgress("chatbot", {});
    expect(progress).not.toBeNull();
    expect(progress!.completedSteps).toBe(0);
    expect(progress!.percentComplete).toBe(0);
    expect(progress!.isComplete).toBe(false);
  });

  it("isOnboardingComplete returns false when steps remain", () => {
    // Only complete 1 of 5 chatbot steps
    const result = isOnboardingComplete("chatbot", {
      chatbot_business_info: "completed",
    });
    expect(result).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  5. Audit Trail                                                     */
/* ------------------------------------------------------------------ */

describe("Audit Trail", () => {
  it("createAuditEntry creates entry with id and timestamp", () => {
    const entry = createAuditEntry({
      actor: "admin@example.com",
      action: "login",
    });
    expect(entry.id).toMatch(/^audit_/);
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.actor).toBe("admin@example.com");
    expect(entry.action).toBe("login");
    expect(entry.category).toBe("auth");
    expect(entry.description).toContain("admin@example.com");
  });

  it("filterAuditLog filters by category", () => {
    const entries = [
      createAuditEntry({ actor: "a", action: "login" }),
      createAuditEntry({ actor: "b", action: "payment_processed" }),
      createAuditEntry({ actor: "c", action: "logout" }),
    ];

    const authOnly = filterAuditLog(entries, { categories: ["auth"] });
    expect(authOnly).toHaveLength(2);
    for (const e of authOnly) {
      expect(e.category).toBe("auth");
    }
  });

  it("formatAuditEntry returns human-readable string", () => {
    const entry = createAuditEntry({
      actor: "admin@co.com",
      action: "login",
      timestamp: new Date("2026-03-29T14:05:30"),
    });
    const formatted = formatAuditEntry(entry);
    expect(formatted).toContain("[auth]");
    expect(formatted).toContain("admin@co.com");
    expect(formatted).toContain("2026-03-29");
  });
});

/* ------------------------------------------------------------------ */
/*  6. Data Export                                                     */
/* ------------------------------------------------------------------ */

describe("Data Export", () => {
  const sampleData = [
    { name: "Alice", age: 30, city: "Portland" },
    { name: "Bob", age: 25, city: "Seattle" },
  ];

  it("formatAsCSV produces valid CSV with headers", () => {
    const csv = formatAsCSV(sampleData);
    const lines = csv.split("\n");
    // First line is the header
    expect(lines[0]).toContain("name");
    expect(lines[0]).toContain("age");
    expect(lines[0]).toContain("city");
    // Should have header + 2 data rows
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Alice");
    expect(lines[2]).toContain("Bob");
  });

  it("formatAsJSON returns parseable JSON", () => {
    const json = formatAsJSON(sampleData);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe("Alice");
    expect(parsed[1].name).toBe("Bob");
  });

  it("generateExportFilename includes date", () => {
    const date = new Date(2026, 2, 29); // March 29, 2026 in local time
    const filename = generateExportFilename("leads", "csv", date);
    expect(filename).toBe("leads-export-2026-03-29.csv");
  });
});
