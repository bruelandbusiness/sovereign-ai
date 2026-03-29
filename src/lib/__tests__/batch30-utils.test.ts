import { describe, it, expect } from "vitest";

// Competitor monitoring
import {
  MONITORING_POINTS,
  detectPriceChange,
  detectFeatureChange,
  calculateThreatLevel,
  suggestCounterStrategy,
  type CompetitorUpdate,
} from "../competitor-monitoring";

// Payment reconciliation
import {
  reconcilePayments,
  findMissingPayments,
  calculateRevenueSummary,
  detectAnomalies,
  projectRevenue,
  type StripePayment,
  type PaymentRecord,
  type ActiveSubscription,
} from "../payment-reconciliation";

// Feature usage
import {
  PLATFORM_FEATURES,
  calculateAdoptionRate,
  findUnderutilizedFeatures,
  identifyPowerUsers,
  suggestFeatureTraining,
  type FeatureUsage,
  type UsageMetric,
} from "../feature-usage";

// Compliance checker
import {
  REGULATIONS,
  checkEmailCompliance,
  checkSMSCompliance,
  generateComplianceReport,
  getRequiredDisclosures,
} from "../compliance-checker";

/* ------------------------------------------------------------------ */
/*  1. Competitor Monitoring                                           */
/* ------------------------------------------------------------------ */

describe("competitor-monitoring", () => {
  it("MONITORING_POINTS has 5 categories", () => {
    expect(MONITORING_POINTS).toHaveLength(5);
    const categories = MONITORING_POINTS.map((p) => p.category);
    expect(categories).toContain("Pricing changes");
    expect(categories).toContain("New feature launches");
    expect(categories).toContain("Marketing campaign changes");
    expect(categories).toContain("Market positioning shifts");
    expect(categories).toContain("Customer review sentiment");
  });

  it("detectPriceChange calculates percentage correctly", () => {
    const result = detectPriceChange("comp1", "Pro", 100, 120);
    expect(result).not.toBeNull();
    expect(result!.percentageChange).toBe(20);
    expect(result!.direction).toBe("increase");
    expect(result!.currency).toBe("USD");

    const decrease = detectPriceChange("comp1", "Pro", 200, 150, "EUR");
    expect(decrease).not.toBeNull();
    expect(decrease!.percentageChange).toBe(-25);
    expect(decrease!.direction).toBe("decrease");
    expect(decrease!.currency).toBe("EUR");

    // oldPrice = 0 returns null
    expect(detectPriceChange("comp1", "Pro", 0, 50)).toBeNull();
  });

  it("detectFeatureChange finds added/removed features", () => {
    const oldFeatures = ["auth", "billing", "dashboard"];
    const newFeatures = ["auth", "dashboard", "analytics", "reports"];

    const result = detectFeatureChange("comp1", oldFeatures, newFeatures);
    expect(result.competitorId).toBe("comp1");
    expect(result.added).toEqual(["analytics", "reports"]);
    expect(result.removed).toEqual(["billing"]);
  });

  it("calculateThreatLevel returns valid level", () => {
    const validLevels = ["low", "medium", "high", "critical"];

    // Low strength + feature_removal => low
    const low = calculateThreatLevel("feature_removal", 10);
    expect(validLevels).toContain(low);

    // High strength + pricing + large change => critical
    const critical = calculateThreatLevel("pricing", 90, 35);
    expect(critical).toBe("critical");

    // Medium strength + feature_launch
    const mid = calculateThreatLevel("feature_launch", 50);
    expect(validLevels).toContain(mid);
  });

  it("suggestCounterStrategy returns recommendations", () => {
    const update: CompetitorUpdate = {
      competitorId: "comp1",
      competitorName: "Rival Co",
      timestamp: new Date(),
      changeType: "pricing",
      description: "Price drop on Pro plan",
      priceChange: {
        competitorId: "comp1",
        planName: "Pro",
        oldPrice: 100,
        newPrice: 80,
        percentageChange: -20,
        direction: "decrease",
        detectedAt: new Date(),
        currency: "USD",
      },
    };

    const strategies = suggestCounterStrategy(update, ["auth", "billing"]);
    expect(strategies.length).toBeGreaterThan(0);
    expect(
      strategies.some((s) => s.toLowerCase().includes("price")),
    ).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  2. Payment Reconciliation                                          */
/* ------------------------------------------------------------------ */

describe("payment-reconciliation", () => {
  const now = new Date();

  function makeStripePayment(
    overrides: Partial<StripePayment> = {},
  ): StripePayment {
    return {
      id: "sp_1",
      customerId: "cust_1",
      amount: 5000,
      currency: "usd",
      status: "succeeded",
      created: now,
      ...overrides,
    };
  }

  function makeInternalRecord(
    overrides: Partial<PaymentRecord> = {},
  ): PaymentRecord {
    return {
      id: "rec_1",
      stripePaymentId: "sp_1",
      customerId: "cust_1",
      amount: 5000,
      currency: "usd",
      status: "succeeded",
      planTier: "pro",
      createdAt: now,
      ...overrides,
    };
  }

  it("reconcilePayments matches by stripePaymentId", () => {
    const stripe = [makeStripePayment()];
    const internal = [makeInternalRecord()];

    const result = reconcilePayments(stripe, internal);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].isExactMatch).toBe(true);
    expect(result.unmatchedStripe).toHaveLength(0);
    expect(result.unmatchedInternal).toHaveLength(0);
  });

  it("findMissingPayments detects unmatched Stripe payments", () => {
    const stripe = [
      makeStripePayment({ id: "sp_1" }),
      makeStripePayment({ id: "sp_2" }),
    ];
    const internal = [makeInternalRecord({ stripePaymentId: "sp_1" })];

    const missing = findMissingPayments(stripe, internal);
    expect(missing).toHaveLength(1);
    expect(missing[0].id).toBe("sp_2");
  });

  it("calculateRevenueSummary totals correctly", () => {
    const payments: PaymentRecord[] = [
      makeInternalRecord({ amount: 3000, planTier: "pro" }),
      makeInternalRecord({
        id: "rec_2",
        stripePaymentId: "sp_2",
        amount: 2000,
        planTier: "starter",
      }),
      makeInternalRecord({
        id: "rec_3",
        stripePaymentId: "sp_3",
        amount: 1000,
        status: "failed",
      }),
    ];

    const summary = calculateRevenueSummary(payments, "usd");
    // Only succeeded payments count
    expect(summary.totalRevenue).toBe(5000);
    expect(summary.transactionCount).toBe(2);
    expect(summary.averageTransactionAmount).toBe(2500);
    expect(summary.byPlanTier.pro).toBe(3000);
    expect(summary.byPlanTier.starter).toBe(2000);
  });

  it("detectAnomalies flags double charges", () => {
    const t1 = new Date("2025-06-01T10:00:00Z");
    const t2 = new Date("2025-06-01T10:01:00Z"); // 1 minute later

    const payments: PaymentRecord[] = [
      makeInternalRecord({
        id: "pay_1",
        customerId: "cust_1",
        amount: 5000,
        createdAt: t1,
      }),
      makeInternalRecord({
        id: "pay_2",
        stripePaymentId: "sp_2",
        customerId: "cust_1",
        amount: 5000,
        createdAt: t2,
      }),
    ];

    const anomalies = detectAnomalies(payments);
    const doubleCharges = anomalies.filter((a) => a.type === "double_charge");
    expect(doubleCharges.length).toBeGreaterThanOrEqual(1);
    expect(doubleCharges[0].severity).toBe("critical");
  });

  it("projectRevenue returns positive projection", () => {
    const subs: ActiveSubscription[] = [
      {
        customerId: "c1",
        planTier: "pro",
        monthlyAmount: 9900,
        currency: "usd",
        startedAt: new Date("2025-01-01"),
      },
      {
        customerId: "c2",
        planTier: "starter",
        monthlyAmount: 2900,
        currency: "usd",
        startedAt: new Date("2025-02-01"),
      },
    ];

    const projection = projectRevenue(subs, [], "usd");
    expect(projection.projectedRevenue).toBe(12800);
    expect(projection.activeSubscriptionCount).toBe(2);
    expect(projection.projectedRevenue).toBeGreaterThan(0);
    expect(projection.byPlanTier.pro).toBe(9900);
    expect(projection.byPlanTier.starter).toBe(2900);
  });
});

/* ------------------------------------------------------------------ */
/*  3. Feature Usage                                                   */
/* ------------------------------------------------------------------ */

describe("feature-usage", () => {
  it("PLATFORM_FEATURES has 15 features", () => {
    expect(PLATFORM_FEATURES).toHaveLength(15);
    const ids = PLATFORM_FEATURES.map((f) => f.id);
    expect(ids).toContain("dashboard_views");
    expect(ids).toContain("api_usage");
  });

  function makeMetric(
    clientId: string,
    usageCount: number,
  ): UsageMetric {
    return {
      featureId: "dashboard_views",
      clientId,
      usageCount,
      lastUsedAt: new Date(),
      firstUsedAt: new Date(),
      averageSessionDurationMs: 5000,
    };
  }

  function makeFeatureUsage(
    featureId: string,
    featureName: string,
    uniqueClients: number,
    metrics: UsageMetric[] = [],
  ): FeatureUsage {
    return {
      featureId,
      featureName,
      category: "Analytics",
      totalUsageCount: metrics.reduce((s, m) => s + m.usageCount, 0),
      uniqueClientCount: uniqueClients,
      metrics,
    };
  }

  it("calculateAdoptionRate returns percentages", () => {
    const usages: FeatureUsage[] = [
      makeFeatureUsage("dashboard_views", "Dashboard Views", 80),
      makeFeatureUsage("api_usage", "API Usage", 20),
    ];

    const rates = calculateAdoptionRate(usages, 100);
    expect(rates).toHaveLength(2);
    expect(rates[0].rate).toBe(0.8);
    expect(rates[1].rate).toBe(0.2);
    expect(rates[0].totalClients).toBe(100);
  });

  it("findUnderutilizedFeatures filters below 20%", () => {
    const usages: FeatureUsage[] = [
      makeFeatureUsage("dashboard_views", "Dashboard Views", 80),
      makeFeatureUsage("api_usage", "API Usage", 10),
      makeFeatureUsage("seo_tools", "SEO Tools", 5),
    ];

    const underutilized = findUnderutilizedFeatures(usages, 100);
    expect(underutilized).toHaveLength(2);
    const ids = underutilized.map((u) => u.featureId);
    expect(ids).toContain("api_usage");
    expect(ids).toContain("seo_tools");
  });

  it("identifyPowerUsers finds users with 80%+ features", () => {
    // 15 features total, so 80% = 12 features
    const allFeatureIds = PLATFORM_FEATURES.map((f) => f.id);
    const powerUserFeatures = allFeatureIds.slice(0, 13); // 13 out of 15

    const usages: FeatureUsage[] = powerUserFeatures.map((fId) => ({
      featureId: fId,
      featureName: fId,
      category: "Test",
      totalUsageCount: 50,
      uniqueClientCount: 1,
      metrics: [
        {
          featureId: fId,
          clientId: "power_client",
          usageCount: 50,
          lastUsedAt: new Date(),
          firstUsedAt: new Date(),
          averageSessionDurationMs: 3000,
        },
      ],
    }));

    const powerUsers = identifyPowerUsers(usages, ["power_client", "other_client"]);
    expect(powerUsers.length).toBeGreaterThanOrEqual(1);
    const powerClient = powerUsers.find((u) => u.clientId === "power_client");
    expect(powerClient).toBeDefined();
    expect(powerClient!.isPowerUser).toBe(true);
    expect(powerClient!.adoptionPercentage).toBeGreaterThanOrEqual(0.8);
  });

  it("suggestFeatureTraining returns suggestions", () => {
    const usages: FeatureUsage[] = [
      makeFeatureUsage("dashboard_views", "Dashboard Views", 90),
      makeFeatureUsage("voice_agent_setup", "Voice Agent Setup", 3),
    ];

    const suggestions = suggestFeatureTraining(usages, 100);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].featureId).toBe("voice_agent_setup");
    expect(suggestions[0].adoptionRate).toBeLessThan(0.2);
    expect(suggestions[0].suggestedAction.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/*  4. Compliance Checker                                              */
/* ------------------------------------------------------------------ */

describe("compliance-checker", () => {
  it("REGULATIONS has 6 regulations", () => {
    expect(REGULATIONS).toHaveLength(6);
    const ids = REGULATIONS.map((r) => r.id);
    expect(ids).toContain("CAN-SPAM");
    expect(ids).toContain("TCPA");
    expect(ids).toContain("GDPR");
    expect(ids).toContain("CCPA");
    expect(ids).toContain("ADA");
    expect(ids).toContain("FTC");
  });

  it("checkEmailCompliance passes for compliant email", () => {
    const result = checkEmailCompliance({
      hasUnsubscribeLink: true,
      hasPhysicalAddress: true,
      hasAccurateFromField: true,
      hasAccurateSubjectLine: true,
      isTransactional: false,
    });

    expect(result.status).toBe("compliant");
    expect(result.violations).toHaveLength(0);
    expect(result.regulationId).toBe("CAN-SPAM");
  });

  it("checkSMSCompliance flags missing consent", () => {
    const result = checkSMSCompliance({
      hasRecipientConsent: false,
      hasOptOutMechanism: true,
      sendHour: 10,
      sendTimezone: "America/New_York",
      isAutomated: true,
    });

    expect(result.status).not.toBe("compliant");
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
    const consentViolation = result.violations.find(
      (v) => v.requirementKey === "consent",
    );
    expect(consentViolation).toBeDefined();
    expect(consentViolation!.severity).toBe("critical");
  });

  it("generateComplianceReport aggregates checks", () => {
    const emailCheck = checkEmailCompliance({
      hasUnsubscribeLink: true,
      hasPhysicalAddress: true,
      hasAccurateFromField: true,
      hasAccurateSubjectLine: true,
      isTransactional: false,
    });

    const smsCheck = checkSMSCompliance({
      hasRecipientConsent: false,
      hasOptOutMechanism: false,
      sendHour: 22, // outside allowed hours
      sendTimezone: "America/New_York",
      isAutomated: true,
    });

    const report = generateComplianceReport([emailCheck, smsCheck]);
    expect(report.totalViolations).toBe(smsCheck.violations.length);
    expect(report.criticalViolations).toBeGreaterThanOrEqual(1);
    expect(report.overallStatus).toBe("partial");
    expect(report.checks).toHaveLength(2);
  });

  it("getRequiredDisclosures returns disclosures for email", () => {
    const disclosures = getRequiredDisclosures("email");
    expect(disclosures.length).toBeGreaterThanOrEqual(1);
    const regulationIds = disclosures.map((d) => d.regulationId);
    expect(regulationIds).toContain("CAN-SPAM");
    expect(disclosures.every((d) => d.text.length > 0)).toBe(true);
  });
});
