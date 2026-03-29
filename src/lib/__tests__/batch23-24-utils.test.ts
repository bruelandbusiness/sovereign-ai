import { describe, it, expect } from "vitest";

// Pricing calculator
import {
  SERVICE_PRICES,
  calculateBundlePrice,
  formatPrice,
  calculateAnnualSavings,
  type ServiceId,
} from "../pricing-calculator";

// Webhook events
import {
  WebhookEventType,
  createWebhookEvent,
  describeEvent,
} from "../webhook-events";

// Performance benchmarks
import {
  INDUSTRY_BENCHMARKS,
  evaluatePerformance,
  calculatePercentile,
} from "../performance-benchmarks";

// Report templates
import {
  REPORT_TEMPLATES,
  formatMetricForDisplay,
  getReportSchedule,
} from "../report-templates";

// Referral tracking
import {
  generateReferralCode,
  getReferralTier,
  isEligibleToRefer,
  REFERRAL_PROGRAM,
} from "../referral-tracking";

// Communication templates
import {
  TEMPLATES,
  renderTemplate,
  getTemplatesForCategory,
} from "../communication-templates";

/* ------------------------------------------------------------------ */
/*  1. Pricing Calculator                                              */
/* ------------------------------------------------------------------ */

describe("Pricing Calculator", () => {
  it("SERVICE_PRICES has 18 services", () => {
    const serviceIds = Object.keys(SERVICE_PRICES);
    expect(serviceIds).toHaveLength(18);
  });

  it("calculateBundlePrice applies correct discount for 5+ services", () => {
    const fiveServices: ServiceId[] = [
      "chatbot",
      "reviews",
      "content",
      "email",
      "booking",
    ];
    const breakdown = calculateBundlePrice(fiveServices);

    // 5 services should hit the "Growth" tier at 15%
    expect(breakdown.discountPercent).toBe(15);
    expect(breakdown.applicableTier).not.toBeNull();
    expect(breakdown.applicableTier!.label).toBe("Growth");

    const expectedSubtotal =
      149 + 99 + 199 + 129 + 79; // 655
    expect(breakdown.subtotal).toBe(expectedSubtotal);
    expect(breakdown.total).toBe(
      Math.round((expectedSubtotal * 0.85) * 100) / 100,
    );
  });

  it("formatPrice returns formatted currency string", () => {
    const formatted = formatPrice(1234.5);
    expect(formatted).toBe("$1,234.50");
  });

  it("calculateAnnualSavings returns annual breakdown", () => {
    const services: ServiceId[] = [
      "chatbot",
      "reviews",
      "content",
      "email",
      "booking",
    ];
    const annual = calculateAnnualSavings(services);

    expect(annual.monthlyTotal).toBeGreaterThan(0);
    expect(annual.annualTotal).toBe(
      Math.round(annual.monthlyTotal * 12 * 100) / 100,
    );
    expect(annual.annualWithoutDiscount).toBeGreaterThan(annual.annualTotal);
    expect(annual.annualSavings).toBe(
      Math.round(
        (annual.annualWithoutDiscount - annual.annualTotal) * 100,
      ) / 100,
    );
  });
});

/* ------------------------------------------------------------------ */
/*  2. Webhook Events                                                  */
/* ------------------------------------------------------------------ */

describe("Webhook Events", () => {
  it("WebhookEventType has 20 event types", () => {
    const eventValues = Object.values(WebhookEventType);
    expect(eventValues.length).toBe(20);
  });

  it("createWebhookEvent creates event with id and timestamp", () => {
    const event = createWebhookEvent("lead.created", {
      accountId: "acct_1",
      leadId: "lead_1",
      source: "website",
    });

    expect(event.id).toBeDefined();
    expect(typeof event.id).toBe("string");
    expect(event.id.length).toBeGreaterThan(0);
    expect(event.timestamp).toBeDefined();
    // Timestamp should be a valid ISO string
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
    expect(event.type).toBe("lead.created");
    expect(event.payload.accountId).toBe("acct_1");
  });

  it("describeEvent returns human-readable description", () => {
    const description = describeEvent("lead.created");
    expect(description).toBe("A new lead was created");
    expect(typeof description).toBe("string");

    const paymentDesc = describeEvent("payment.succeeded");
    expect(paymentDesc).toBe("A payment was processed successfully");
  });
});

/* ------------------------------------------------------------------ */
/*  3. Performance Benchmarks                                          */
/* ------------------------------------------------------------------ */

describe("Performance Benchmarks", () => {
  it("INDUSTRY_BENCHMARKS has entries across 8 categories", () => {
    expect(INDUSTRY_BENCHMARKS.length).toBeGreaterThanOrEqual(8);

    const categories = new Set(
      INDUSTRY_BENCHMARKS.map((b) => b.category),
    );
    expect(categories.size).toBe(8);
    expect(categories).toContain("lead_generation");
    expect(categories).toContain("reviews");
    expect(categories).toContain("seo");
    expect(categories).toContain("ads");
    expect(categories).toContain("email");
    expect(categories).toContain("social");
    expect(categories).toContain("booking");
    expect(categories).toContain("revenue");
  });

  it("evaluatePerformance returns valid rating", () => {
    // Use "Lead Conversion Rate" (higherIsBetter = true)
    const benchmark = INDUSTRY_BENCHMARKS.find(
      (b) => b.name === "Lead Conversion Rate",
    )!;
    expect(benchmark).toBeDefined();

    const excellent = evaluatePerformance(benchmark, 40);
    expect(excellent.rating).toBe("excellent");

    const poor = evaluatePerformance(benchmark, 2);
    expect(poor.rating).toBe("poor");

    const validRatings = [
      "poor",
      "below_average",
      "average",
      "above_average",
      "excellent",
    ];
    expect(validRatings).toContain(excellent.rating);
  });

  it("calculatePercentile returns 0-100 value", () => {
    const benchmark = INDUSTRY_BENCHMARKS.find(
      (b) => b.name === "Lead Conversion Rate",
    )!;

    const percentile = calculatePercentile(benchmark, 15);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(100);

    // Excellent value should have a high percentile
    const highPercentile = calculatePercentile(benchmark, 40);
    expect(highPercentile).toBeGreaterThanOrEqual(70);

    // Poor value should have a low percentile
    const lowPercentile = calculatePercentile(benchmark, 3);
    expect(lowPercentile).toBeLessThanOrEqual(30);
  });
});

/* ------------------------------------------------------------------ */
/*  4. Report Templates                                                */
/* ------------------------------------------------------------------ */

describe("Report Templates", () => {
  it("REPORT_TEMPLATES has 4 templates", () => {
    expect(REPORT_TEMPLATES).toHaveLength(4);
    const frequencies = REPORT_TEMPLATES.map((t) => t.frequency);
    expect(frequencies).toContain("weekly");
    expect(frequencies).toContain("monthly");
    expect(frequencies).toContain("quarterly");
    expect(frequencies).toContain("annual");
  });

  it("formatMetricForDisplay formats currency correctly", () => {
    const formatted = formatMetricForDisplay(1234.56, "currency");
    expect(formatted).toBe("$1,234.56");

    const percentage = formatMetricForDisplay(75, "percentage");
    expect(percentage).toBe("75.0%");

    const number = formatMetricForDisplay(1234, "number");
    expect(number).toBe("1,234");
  });

  it("getReportSchedule returns entries for all frequencies", () => {
    const schedule = getReportSchedule();
    expect(schedule).toHaveLength(REPORT_TEMPLATES.length);

    const frequencies = schedule.map((s) => s.frequency);
    expect(frequencies).toContain("weekly");
    expect(frequencies).toContain("monthly");
    expect(frequencies).toContain("quarterly");
    expect(frequencies).toContain("annual");

    // Each entry should have a description
    for (const entry of schedule) {
      expect(entry.description).toBeDefined();
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.templateId).toBeDefined();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  5. Referral Tracking                                               */
/* ------------------------------------------------------------------ */

describe("Referral Tracking", () => {
  it("generateReferralCode produces unique codes", () => {
    const code1 = generateReferralCode("John Doe", "client_1");
    const code2 = generateReferralCode("Jane Smith", "client_2");

    expect(code1).toMatch(/^REF-/);
    expect(code2).toMatch(/^REF-/);
    // Different inputs should produce different codes
    expect(code1).not.toBe(code2);
    // Code has expected segment structure: REF-XXXX-XXXX-XXXX
    expect(code1.split("-").length).toBeGreaterThanOrEqual(4);
  });

  it("getReferralTier returns correct tier for counts", () => {
    expect(getReferralTier(1)).toBe("Bronze");
    expect(getReferralTier(2)).toBe("Bronze");
    expect(getReferralTier(3)).toBe("Silver");
    expect(getReferralTier(5)).toBe("Silver");
    expect(getReferralTier(6)).toBe("Gold");
    expect(getReferralTier(10)).toBe("Gold");
    expect(getReferralTier(11)).toBe("Platinum");
    expect(getReferralTier(50)).toBe("Platinum");
  });

  it("isEligibleToRefer checks minimum subscription", () => {
    const eligible = isEligibleToRefer(6);
    expect(eligible.eligible).toBe(true);
    expect(eligible.reason).toContain("meets minimum");

    const notEligible = isEligibleToRefer(1);
    expect(notEligible.eligible).toBe(false);
    expect(notEligible.reason).toContain("at least");
    expect(notEligible.minimumRequired).toBe(
      REFERRAL_PROGRAM.minimumSubscriptionMonths,
    );
  });

  it("REFERRAL_PROGRAM has correct reward amounts", () => {
    expect(REFERRAL_PROGRAM.referrerRewardAmount).toBe(500);
    expect(REFERRAL_PROGRAM.refereeDiscountPercent).toBe(10);
    expect(REFERRAL_PROGRAM.refereeDiscountMonths).toBe(3);
    expect(REFERRAL_PROGRAM.minimumSubscriptionMonths).toBe(3);
    expect(REFERRAL_PROGRAM.tiers).toHaveLength(4);
  });
});

/* ------------------------------------------------------------------ */
/*  6. Communication Templates                                         */
/* ------------------------------------------------------------------ */

describe("Communication Templates", () => {
  it("TEMPLATES has 20+ templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(20);
  });

  it("renderTemplate replaces variables", () => {
    const template = TEMPLATES.find((t) => t.id === "welcome-email")!;
    expect(template).toBeDefined();

    const rendered = renderTemplate(template, {
      firstName: "Alex",
      platformName: "Sovereign AI",
      dashboardUrl: "https://app.example.com/dashboard",
      supportEmail: "support@example.com",
    });

    expect(rendered.templateId).toBe("welcome-email");
    expect(rendered.subject).toContain("Alex");
    expect(rendered.subject).toContain("Sovereign AI");
    expect(rendered.body).toContain("Alex");
    expect(rendered.body).toContain("https://app.example.com/dashboard");
    // No remaining placeholders
    expect(rendered.subject).not.toMatch(/\{\{\w+\}\}/);
    expect(rendered.body).not.toMatch(/\{\{\w+\}\}/);
  });

  it("getTemplatesForCategory filters correctly", () => {
    const welcomeTemplates = getTemplatesForCategory("welcome");
    expect(welcomeTemplates.length).toBeGreaterThan(0);
    for (const t of welcomeTemplates) {
      expect(t.category).toBe("welcome");
    }

    const alertTemplates = getTemplatesForCategory("alert");
    expect(alertTemplates.length).toBeGreaterThan(0);
    for (const t of alertTemplates) {
      expect(t.category).toBe("alert");
    }

    // All categories combined should equal total
    const categories = [
      "welcome",
      "milestone",
      "alert",
      "report",
      "support",
      "upsell",
    ] as const;
    let total = 0;
    for (const cat of categories) {
      total += getTemplatesForCategory(cat).length;
    }
    expect(total).toBe(TEMPLATES.length);
  });
});
