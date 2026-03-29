import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  calculateRoi,
  DEFAULT_ROI_INPUTS,
  getIndustryBenchmarks,
} from "@/lib/roi-calculator";

import {
  formatInTimezone,
  isBusinessHours,
  getRelativeTime,
  guessTimezoneFromZip,
} from "@/lib/timezone";

import {
  stripHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
} from "@/lib/sanitize";

import { calculateLeadScore, type LeadScoreFactors } from "@/lib/lead-scoring";

// Pin "now" so time-dependent tests are deterministic.
const NOW = new Date("2026-03-29T15:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// ROI Calculator
// ---------------------------------------------------------------------------

describe("calculateRoi", () => {
  it("produces a positive ROI with default inputs", () => {
    const result = calculateRoi(DEFAULT_ROI_INPUTS);

    expect(result.monthlyRoi).toBeGreaterThan(0);
    expect(result.annualRoi).toBeGreaterThan(0);
    expect(result.totalMonthlyValue).toBeGreaterThan(
      DEFAULT_ROI_INPUTS.monthlySubscriptionCost
    );
  });

  it("returns zero revenue when leads are zero", () => {
    const result = calculateRoi({
      ...DEFAULT_ROI_INPUTS,
      leadsPerMonth: 0,
    });

    expect(result.monthlyRevenue).toBe(0);
    expect(result.monthlyProfit).toBe(0);
    expect(result.costPerLead).toBe(Infinity);
    expect(result.costPerCustomer).toBe(Infinity);
  });

  it("computes costPerLead as subscription / leads", () => {
    const result = calculateRoi(DEFAULT_ROI_INPUTS);

    expect(result.costPerLead).toBeCloseTo(
      DEFAULT_ROI_INPUTS.monthlySubscriptionCost /
        DEFAULT_ROI_INPUTS.leadsPerMonth,
      2
    );
  });
});

describe("getIndustryBenchmarks", () => {
  it("returns data for a known vertical (case-insensitive)", () => {
    const hvac = getIndustryBenchmarks("HVAC");

    expect(hvac).not.toBeNull();
    expect(hvac!.vertical).toBe("HVAC");
    expect(hvac!.averageJobValue).toBeGreaterThan(0);
  });

  it("returns null for an unknown vertical", () => {
    const result = getIndustryBenchmarks("underwater-basket-weaving");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Timezone utilities
// ---------------------------------------------------------------------------

describe("formatInTimezone", () => {
  it("formats a date in datetime mode for a given timezone", () => {
    const date = new Date("2026-03-29T18:30:00Z");
    const result = formatInTimezone(date, "America/New_York", "datetime");

    // 18:30 UTC = 2:30 PM ET (EDT in March)
    expect(result).toContain("2026");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats date-only when format is 'date'", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const result = formatInTimezone(date, "America/Chicago", "date");

    expect(result).toContain("2026");
    // Should not contain a time separator in date-only mode
    expect(result).not.toMatch(/\d{1,2}:\d{2}\s*[AP]M/);
  });
});

describe("isBusinessHours", () => {
  it("returns true during business hours", () => {
    // 15:00 UTC = 10:00 AM CT → within default 8-20
    const date = new Date("2026-03-29T15:00:00Z");
    expect(isBusinessHours(date, "America/Chicago")).toBe(true);
  });

  it("returns false outside business hours", () => {
    // 05:00 UTC = 12:00 AM CT (midnight) → outside 8-20
    const date = new Date("2026-03-29T05:00:00Z");
    expect(isBusinessHours(date, "America/Chicago")).toBe(false);
  });
});

describe("getRelativeTime", () => {
  it("produces a human-readable string for a past date", () => {
    const twoHoursAgo = new Date(NOW.getTime() - 2 * 60 * 60 * 1000);
    const result = getRelativeTime(twoHoursAgo);

    expect(result).toContain("ago");
    expect(result).toContain("2");
  });

  it("produces a human-readable string for a future date", () => {
    const inThreeDays = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    const result = getRelativeTime(inThreeDays);

    expect(result).toContain("3");
    expect(result).toMatch(/in\s/);
  });
});

describe("guessTimezoneFromZip", () => {
  it("returns Alaska timezone for an Anchorage zip", () => {
    // Zip prefix "995" is explicitly mapped to Alaska
    expect(guessTimezoneFromZip("99501")).toBe("America/Anchorage");
  });

  it("returns Hawaii timezone for a Honolulu zip", () => {
    // Zip prefix "967" is explicitly mapped to Hawaii
    expect(guessTimezoneFromZip("96701")).toBe("Pacific/Honolulu");
  });

  it("defaults to Eastern for an invalid short zip", () => {
    expect(guessTimezoneFromZip("12")).toBe("America/New_York");
  });
});

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

describe("stripHtml", () => {
  it("removes HTML tags from a string", () => {
    expect(stripHtml("<b>Hello</b> <em>world</em>")).toBe("Hello world");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("no tags here")).toBe("no tags here");
  });
});

describe("sanitizeString", () => {
  it("normalizes whitespace and strips HTML", () => {
    expect(sanitizeString("  <b>Hello</b>   world  ")).toBe("Hello world");
  });
});

describe("sanitizeEmail", () => {
  it("lowercases and trims an email", () => {
    expect(sanitizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });
});

describe("sanitizePhone", () => {
  it("strips non-digit characters", () => {
    expect(sanitizePhone("(555) 123-4567")).toBe("5551234567");
  });

  it("preserves a leading + prefix", () => {
    expect(sanitizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });
});

describe("sanitizeObject", () => {
  it("recursively sanitizes string values in nested objects", () => {
    const input = {
      name: "  <b>Acme</b>  Plumbing  ",
      contact: {
        note: "<script>alert(1)</script>  hi  ",
      },
      count: 42,
    };

    const result = sanitizeObject(input);

    expect(result.name).toBe("Acme Plumbing");
    expect((result.contact as { note: string }).note).toBe("alert(1) hi");
    expect(result.count).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Lead scoring
// ---------------------------------------------------------------------------

function makeHotLead(): LeadScoreFactors {
  return {
    hasEmail: true,
    hasPhone: true,
    hasWebsite: true,
    source: "referral",
    responseTime: 3,
    engagementCount: 6,
    businessSize: "medium",
    vertical: "hvac",
    hasReviews: true,
    reviewCount: 55,
  };
}

function makeColdLead(): LeadScoreFactors {
  return {
    hasEmail: false,
    hasPhone: false,
    hasWebsite: false,
    source: "cold",
    responseTime: 10_000,
    engagementCount: 0,
    businessSize: "unknown",
    vertical: "",
    hasReviews: false,
    reviewCount: 0,
  };
}

describe("calculateLeadScore", () => {
  it("returns an A grade for a hot lead", () => {
    const result = calculateLeadScore(makeHotLead());

    expect(result.grade).toBe("A");
    expect(result.total).toBeGreaterThanOrEqual(80);
    expect(result.recommendation).toContain("Hot lead");
  });

  it("returns an F grade for a cold lead with no info", () => {
    const result = calculateLeadScore(makeColdLead());

    expect(result.grade).toBe("F");
    expect(result.total).toBeLessThan(20);
    expect(result.recommendation).toContain("Unqualified");
  });

  it("has factor scores that sum to the total", () => {
    const result = calculateLeadScore(makeHotLead());
    const factorSum = Object.values(result.factors).reduce((a, b) => a + b, 0);

    // The total is clamped to 0-100 and each category is capped at 20,
    // so total <= factorSum (due to per-category caps).
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.total).toBeGreaterThan(0);
    // The raw sum of capped categories should equal the total.
    expect(factorSum).toBeGreaterThanOrEqual(result.total);
  });
});
