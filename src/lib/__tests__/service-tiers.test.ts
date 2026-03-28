import { describe, it, expect } from "vitest";
import {
  getTier,
  bundleToTier,
  classifyMetric,
  checkGuarantee,
  getAllowedChannels,
  hasFeature,
  calculateOverage,
  formatGuaranteeStatus,
  TIER_DEFINITIONS,
  QUALITY_BENCHMARKS,
} from "../service-tiers";

describe("getTier", () => {
  it("returns the correct tier definition", () => {
    const starter = getTier("starter");
    expect(starter.name).toBe("Starter");
    expect(starter.monthlyPrice).toBe(150_000);
  });

  it("returns enterprise tier", () => {
    const enterprise = getTier("enterprise");
    expect(enterprise.name).toBe("Enterprise");
    expect(enterprise.crmIntegration).toBe(true);
  });
});

describe("bundleToTier", () => {
  it("maps known bundle IDs to tier IDs", () => {
    expect(bundleToTier("starter")).toBe("starter");
    expect(bundleToTier("growth")).toBe("growth");
    expect(bundleToTier("scale")).toBe("scale");
    expect(bundleToTier("empire")).toBe("enterprise");
  });

  it("returns null for unknown bundle ID", () => {
    expect(bundleToTier("unknown")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(bundleToTier(null)).toBeNull();
  });
});

describe("classifyMetric", () => {
  it("returns 'good' when value meets good threshold", () => {
    expect(classifyMetric("lead_delivery", 100)).toBe("good");
    expect(classifyMetric("lead_delivery", 150)).toBe("good");
  });

  it("returns 'acceptable' when value is between thresholds", () => {
    expect(classifyMetric("lead_delivery", 80)).toBe("acceptable");
    expect(classifyMetric("lead_delivery", 99)).toBe("acceptable");
  });

  it("returns 'poor' when value is below acceptable threshold", () => {
    expect(classifyMetric("lead_delivery", 79)).toBe("poor");
    expect(classifyMetric("lead_delivery", 0)).toBe("poor");
  });

  it("returns 'unknown' for unrecognized metric", () => {
    expect(classifyMetric("nonexistent_metric", 50)).toBe("unknown");
  });

  it("works for lead_quality_score metric", () => {
    expect(classifyMetric("lead_quality_score", 75)).toBe("good");
    expect(classifyMetric("lead_quality_score", 70)).toBe("acceptable");
    expect(classifyMetric("lead_quality_score", 60)).toBe("poor");
  });
});

describe("checkGuarantee", () => {
  it("returns 'met' when delivery is at or above 80%", () => {
    const result = checkGuarantee("client-1", "starter", "2026-03", 40);
    // 40/50 = 80%
    expect(result.status).toBe("met");
    expect(result.creditAmount).toBe(0);
    expect(result.deliveryPercent).toBe(80);
  });

  it("returns 'met' when delivery exceeds 100%", () => {
    const result = checkGuarantee("client-1", "starter", "2026-03", 60);
    expect(result.status).toBe("met");
    expect(result.deliveryPercent).toBe(120);
  });

  it("returns 'credit' when delivery is 50-79%", () => {
    const result = checkGuarantee("client-1", "starter", "2026-03", 30);
    // 30/50 = 60%
    expect(result.status).toBe("credit");
    expect(result.deliveryPercent).toBe(60);
    // Shortfall: 50 - 30 = 20 leads. Credit per lead: 150000/50 = 3000. Total: 60000
    expect(result.creditAmount).toBe(60_000);
  });

  it("returns 'full_credit' when delivery is below 50%", () => {
    const result = checkGuarantee("client-1", "starter", "2026-03", 20);
    // 20/50 = 40%
    expect(result.status).toBe("full_credit");
    expect(result.creditAmount).toBe(150_000); // full monthly price
  });

  it("always returns 'met' for enterprise with no custom target", () => {
    const result = checkGuarantee("client-1", "enterprise", "2026-03", 0);
    expect(result.status).toBe("met");
    expect(result.deliveryPercent).toBe(100);
  });

  it("uses customTarget when provided", () => {
    const result = checkGuarantee("client-1", "starter", "2026-03", 80, 100);
    // 80/100 = 80%
    expect(result.status).toBe("met");
    expect(result.contractedLeads).toBe(100);
  });
});

describe("getAllowedChannels", () => {
  it("returns only email for starter tier", () => {
    expect(getAllowedChannels("starter")).toEqual(["email"]);
  });

  it("returns email and sms for growth tier", () => {
    expect(getAllowedChannels("growth")).toEqual(["email", "sms"]);
  });

  it("returns all channels for scale tier", () => {
    expect(getAllowedChannels("scale")).toEqual(["email", "sms", "voice"]);
  });

  it("returns all channels for enterprise tier", () => {
    expect(getAllowedChannels("enterprise")).toEqual(["email", "sms", "voice"]);
  });
});

describe("hasFeature", () => {
  it("returns false for abTesting on starter", () => {
    expect(hasFeature("starter", "abTesting")).toBe(false);
  });

  it("returns true for abTesting on growth", () => {
    expect(hasFeature("growth", "abTesting")).toBe(true);
  });

  it("returns false for crmIntegration on scale", () => {
    expect(hasFeature("scale", "crmIntegration")).toBe(false);
  });

  it("returns true for crmIntegration on enterprise", () => {
    expect(hasFeature("enterprise", "crmIntegration")).toBe(true);
  });

  it("returns true for voiceReceptionist on scale", () => {
    expect(hasFeature("scale", "voiceReceptionist")).toBe(true);
  });
});

describe("calculateOverage", () => {
  it("returns zero when delivered equals target", () => {
    const result = calculateOverage("starter", 50);
    expect(result.overageLeads).toBe(0);
    expect(result.overageAmount).toBe(0);
  });

  it("returns zero when delivered is below target", () => {
    const result = calculateOverage("starter", 30);
    expect(result.overageLeads).toBe(0);
    expect(result.overageAmount).toBe(0);
  });

  it("calculates overage for leads above target", () => {
    const result = calculateOverage("starter", 60);
    // 60 - 50 = 10 overage leads * 2500 cents = 25000
    expect(result.overageLeads).toBe(10);
    expect(result.overageAmount).toBe(25_000);
  });

  it("uses custom target when provided", () => {
    const result = calculateOverage("starter", 120, 100);
    // 120 - 100 = 20 overage leads * 2500 = 50000
    expect(result.overageLeads).toBe(20);
    expect(result.overageAmount).toBe(50_000);
  });

  it("returns zero for enterprise with no contracted leads", () => {
    const result = calculateOverage("enterprise", 500);
    expect(result.overageLeads).toBe(0);
    expect(result.overageAmount).toBe(0);
  });
});

describe("formatGuaranteeStatus", () => {
  it("formats 'met' status with check mark", () => {
    const result = formatGuaranteeStatus({
      clientId: "c1",
      tierId: "starter",
      month: "2026-03",
      contractedLeads: 50,
      deliveredLeads: 45,
      deliveryPercent: 90,
      status: "met",
      creditAmount: 0,
    });
    expect(result).toContain("Starter");
    expect(result).toContain("45/50");
    expect(result).toContain("90%");
  });

  it("formats 'credit' status with credit amount", () => {
    const result = formatGuaranteeStatus({
      clientId: "c1",
      tierId: "growth",
      month: "2026-03",
      contractedLeads: 150,
      deliveredLeads: 100,
      deliveryPercent: 67,
      status: "credit",
      creditAmount: 60_000,
    });
    expect(result).toContain("Growth");
    expect(result).toContain("$600 credit due");
  });

  it("formats 'full_credit' status with exit notice", () => {
    const result = formatGuaranteeStatus({
      clientId: "c1",
      tierId: "scale",
      month: "2026-03",
      contractedLeads: 300,
      deliveredLeads: 100,
      deliveryPercent: 33,
      status: "full_credit",
      creditAmount: 600_000,
    });
    expect(result).toContain("Scale");
    expect(result).toContain("FULL MONTH CREDIT");
    expect(result).toContain("exit-eligible");
  });
});

describe("TIER_DEFINITIONS", () => {
  it("has all four tiers defined", () => {
    expect(Object.keys(TIER_DEFINITIONS)).toEqual([
      "starter",
      "growth",
      "scale",
      "enterprise",
    ]);
  });

  it("tiers have increasing monthly prices", () => {
    expect(TIER_DEFINITIONS.starter.monthlyPrice).toBeLessThan(
      TIER_DEFINITIONS.growth.monthlyPrice
    );
    expect(TIER_DEFINITIONS.growth.monthlyPrice).toBeLessThan(
      TIER_DEFINITIONS.scale.monthlyPrice
    );
    expect(TIER_DEFINITIONS.scale.monthlyPrice).toBeLessThan(
      TIER_DEFINITIONS.enterprise.monthlyPrice
    );
  });
});

describe("QUALITY_BENCHMARKS", () => {
  it("has benchmarks defined", () => {
    expect(QUALITY_BENCHMARKS.length).toBeGreaterThan(0);
  });

  it("each benchmark has good threshold >= acceptable threshold", () => {
    for (const b of QUALITY_BENCHMARKS) {
      expect(b.goodThreshold).toBeGreaterThanOrEqual(b.acceptableThreshold);
    }
  });
});
