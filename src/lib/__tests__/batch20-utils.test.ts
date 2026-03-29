import { describe, it, expect } from "vitest";

import {
  createExperiment,
  assignVariant,
  calculateConversionRate,
  calculateStatisticalSignificance,
  calculateSampleSize,
} from "@/lib/ab-testing";
import type { Variant } from "@/lib/ab-testing";

import {
  calculateHealthScore,
  classifyRisk,
  generateHealthAlerts,
  getRecommendedActions,
} from "@/lib/client-health-score";
import type { HealthFactorInputs } from "@/lib/client-health-score";

import {
  SEQUENCES,
  getNextStep,
  shouldSendToday,
  calculateSequenceProgress,
} from "@/lib/drip-sequences";
import type { EnrollmentRecord } from "@/lib/drip-sequences";

import {
  RATE_LIMIT_TIERS,
  getRateLimitForEndpoint,
  isRateLimitExceeded,
  calculateRetryAfter,
  formatRateLimitHeaders,
} from "@/lib/rate-limit-config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExperiment() {
  return createExperiment({
    id: "exp-1",
    name: "Button Color Test",
    controlId: "control",
    variants: [
      { id: "control", name: "Control", weight: 1 },
      { id: "variant-a", name: "Variant A", weight: 1 },
    ],
    startDate: new Date("2025-01-01"),
    maxDurationDays: 30,
    targetSampleSize: 1000,
  });
}

function makeVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    id: "v1",
    name: "Variant",
    weight: 0.5,
    conversions: 0,
    impressions: 0,
    ...overrides,
  };
}

const PERFECT_INPUTS: HealthFactorInputs = {
  loginFrequency: 100,
  featureAdoption: 100,
  supportTicketVolume: 0,
  paymentHistory: 100,
  serviceUtilization: 100,
  reviewRatingTrend: 100,
  leadConversionRate: 100,
  timeSinceLastEngagement: 100,
};

const ZERO_INPUTS: HealthFactorInputs = {
  loginFrequency: 0,
  featureAdoption: 0,
  supportTicketVolume: 100,
  paymentHistory: 0,
  serviceUtilization: 0,
  reviewRatingTrend: 0,
  leadConversionRate: 0,
  timeSinceLastEngagement: 0,
};

function makeEnrollment(
  overrides: Partial<EnrollmentRecord> = {},
): EnrollmentRecord {
  return {
    sequenceId: "welcome",
    enrolledAt: "2025-01-01T00:00:00Z",
    lastCompletedStepIndex: -1,
    status: "active",
    ...overrides,
  };
}

// ===========================================================================
// 1. A/B Testing
// ===========================================================================

describe("A/B Testing", () => {
  it("createExperiment creates valid experiment with control", () => {
    const exp = makeExperiment();
    expect(exp.id).toBe("exp-1");
    expect(exp.controlId).toBe("control");
    expect(exp.variants.length).toBe(2);

    const control = exp.variants.find((v) => v.id === "control");
    expect(control).toBeDefined();
    expect(control!.weight).toBeCloseTo(0.5);
    expect(control!.conversions).toBe(0);
    expect(control!.impressions).toBe(0);
  });

  it("assignVariant is deterministic (same input = same output)", () => {
    const exp = makeExperiment();
    const first = assignVariant(exp, "user-42");
    const second = assignVariant(exp, "user-42");
    expect(first.id).toBe(second.id);

    // Different user may get same or different variant, but same user is stable
    const third = assignVariant(exp, "user-42");
    expect(third.id).toBe(first.id);
  });

  it("calculateConversionRate returns correct rate and confidence interval", () => {
    const variant = makeVariant({ conversions: 50, impressions: 200 });
    const result = calculateConversionRate(variant);

    expect(result.rate).toBeCloseTo(0.25);
    expect(result.sampleSize).toBe(200);
    expect(result.confidenceInterval.lower).toBeGreaterThan(0);
    expect(result.confidenceInterval.lower).toBeLessThan(result.rate);
    expect(result.confidenceInterval.upper).toBeGreaterThan(result.rate);
    expect(result.confidenceInterval.upper).toBeLessThanOrEqual(1);
  });

  it("calculateStatisticalSignificance detects significant difference", () => {
    const control = makeVariant({
      id: "ctrl",
      conversions: 50,
      impressions: 1000,
    });
    const treatment = makeVariant({
      id: "treat",
      conversions: 120,
      impressions: 1000,
    });

    const result = calculateStatisticalSignificance(control, treatment);
    expect(result.isSignificant).toBe(true);
    expect(result.pValue).toBeLessThan(0.05);
    expect(result.confidenceLevel).toBe(0.95);
  });

  it("calculateSampleSize returns positive integer", () => {
    const size = calculateSampleSize(0.1, 0.05);
    expect(size).toBeGreaterThan(0);
    expect(Number.isInteger(size)).toBe(true);
  });
});

// ===========================================================================
// 2. Client Health Score
// ===========================================================================

describe("Client Health Score", () => {
  it("perfect inputs yield score near 100", () => {
    const score = calculateHealthScore(PERFECT_INPUTS);
    expect(score.overall).toBeGreaterThanOrEqual(95);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.risk).toBe("healthy");
  });

  it("all-zero inputs yield score near 0", () => {
    const score = calculateHealthScore(ZERO_INPUTS);
    expect(score.overall).toBeLessThanOrEqual(5);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.risk).toBe("critical");
  });

  it("classifyRisk returns correct categories at boundaries", () => {
    expect(classifyRisk(100)).toBe("healthy");
    expect(classifyRisk(60)).toBe("healthy");
    expect(classifyRisk(59)).toBe("at-risk");
    expect(classifyRisk(35)).toBe("at-risk");
    expect(classifyRisk(34)).toBe("critical");
    expect(classifyRisk(0)).toBe("critical");
  });

  it("generateHealthAlerts produces alerts for low factors", () => {
    const score = calculateHealthScore(ZERO_INPUTS);
    const alerts = generateHealthAlerts(score);
    expect(alerts.length).toBeGreaterThan(0);
    for (const alert of alerts) {
      expect(alert.actual).toBeLessThan(alert.threshold);
      expect(["info", "warning", "critical"]).toContain(alert.severity);
    }
  });

  it("getRecommendedActions returns max N actions", () => {
    const score = calculateHealthScore(ZERO_INPUTS);
    const actions2 = getRecommendedActions(score, 2);
    expect(actions2.length).toBeLessThanOrEqual(2);
    expect(actions2.length).toBeGreaterThan(0);

    const actions5 = getRecommendedActions(score, 5);
    expect(actions5.length).toBeLessThanOrEqual(5);
  });
});

// ===========================================================================
// 3. Drip Sequences
// ===========================================================================

describe("Drip Sequences", () => {
  it("SEQUENCES has 5 sequences", () => {
    expect(SEQUENCES).toHaveLength(5);
    const ids = SEQUENCES.map((s) => s.id);
    expect(ids).toContain("welcome");
    expect(ids).toContain("trial-to-paid");
    expect(ids).toContain("re-engagement");
    expect(ids).toContain("upsell");
    expect(ids).toContain("onboarding");
  });

  it("getNextStep returns first step for new enrollment", () => {
    const enrollment = makeEnrollment({ lastCompletedStepIndex: -1 });
    const step = getNextStep(enrollment);
    expect(step).not.toBeNull();
    expect(step!.index).toBe(0);
    expect(step!.stepId).toBe("welcome-1");
  });

  it("shouldSendToday returns true when delay is met", () => {
    const enrolledAt = "2025-01-01T00:00:00Z";
    const step = SEQUENCES[0].steps[1]; // welcome-2, delayDays: 2
    const today = new Date("2025-01-04T00:00:00Z"); // 3 days later

    expect(shouldSendToday(enrolledAt, step, today)).toBe(true);

    // Day 1 is too early for a 2-day delay
    const tooEarly = new Date("2025-01-02T00:00:00Z"); // 1 day later
    expect(shouldSendToday(enrolledAt, step, tooEarly)).toBe(false);
  });

  it("calculateSequenceProgress returns 0 for no completed steps", () => {
    const enrollment = makeEnrollment({ lastCompletedStepIndex: -1 });
    expect(calculateSequenceProgress(enrollment)).toBe(0);
  });

  it("calculateSequenceProgress returns 100 for all completed", () => {
    const enrollment = makeEnrollment({
      lastCompletedStepIndex: 4,
      status: "completed",
    });
    expect(calculateSequenceProgress(enrollment)).toBe(100);
  });
});

// ===========================================================================
// 4. Rate Limit Config
// ===========================================================================

describe("Rate Limit Config", () => {
  it("RATE_LIMIT_TIERS has 4 tiers", () => {
    const tiers = Object.keys(RATE_LIMIT_TIERS);
    expect(tiers).toHaveLength(4);
    expect(tiers).toContain("free");
    expect(tiers).toContain("starter");
    expect(tiers).toContain("professional");
    expect(tiers).toContain("enterprise");
  });

  it("getRateLimitForEndpoint returns stricter limits for auth endpoints", () => {
    const authLimit = getRateLimitForEndpoint("/api/auth/login", "free");
    const dashLimit = getRateLimitForEndpoint("/api/dashboard/stats", "free");

    expect(authLimit.maxPerHour).toBeLessThan(dashLimit.maxPerHour);
    expect(authLimit.maxPerMinute).toBeLessThanOrEqual(dashLimit.maxPerMinute);
  });

  it("isRateLimitExceeded returns true when at limit", () => {
    expect(isRateLimitExceeded(10, 10)).toBe(true);
    expect(isRateLimitExceeded(11, 10)).toBe(true);
    expect(isRateLimitExceeded(9, 10)).toBe(false);
  });

  it("calculateRetryAfter returns non-negative seconds", () => {
    const futureReset = Math.ceil(Date.now() / 1000) + 60;
    const retry = calculateRetryAfter(futureReset);
    expect(retry).toBeGreaterThan(0);

    // Past reset should return 0
    const pastReset = Math.ceil(Date.now() / 1000) - 60;
    expect(calculateRetryAfter(pastReset)).toBe(0);
  });

  it("formatRateLimitHeaders includes all required headers", () => {
    const resetAt = Math.ceil(Date.now() / 1000) + 120;
    const headers = formatRateLimitHeaders(100, 50, resetAt);

    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("50");
    expect(headers["X-RateLimit-Reset"]).toBe(String(resetAt));
    expect(headers["Retry-After"]).toBeUndefined();

    // When remaining is 0, Retry-After should be present
    const limitedHeaders = formatRateLimitHeaders(100, 0, resetAt);
    expect(limitedHeaders["Retry-After"]).toBeDefined();
  });
});
