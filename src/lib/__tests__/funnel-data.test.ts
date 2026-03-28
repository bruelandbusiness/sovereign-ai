import { describe, it, expect } from "vitest";
import { TRADES, TRADE_SLUGS, getTradeData } from "../funnel-data";

describe("TRADES", () => {
  it("defines all expected trade slugs", () => {
    expect(TRADE_SLUGS).toContain("plumber");
    expect(TRADE_SLUGS).toContain("hvac");
    expect(TRADE_SLUGS).toContain("roofing");
    expect(TRADE_SLUGS).toContain("electrician");
    expect(TRADE_SLUGS).toContain("landscaping");
  });

  it("has 5 trades total", () => {
    expect(TRADE_SLUGS).toHaveLength(5);
  });

  it("each trade has the required fields", () => {
    for (const slug of TRADE_SLUGS) {
      const trade = TRADES[slug];
      expect(trade.slug).toBe(slug);
      expect(trade.label).toBeTruthy();
      expect(trade.headline).toBeTruthy();
      expect(trade.subheadline).toBeTruthy();
      expect(trade.painPoints.length).toBeGreaterThan(0);
      expect(trade.stats.length).toBeGreaterThan(0);
      expect(trade.testimonial).toBeDefined();
      expect(trade.testimonial.quote).toBeTruthy();
      expect(trade.testimonial.name).toBeTruthy();
      expect(trade.auditChecks.length).toBeGreaterThan(0);
    }
  });

  it("each trade has exactly 4 stats", () => {
    for (const slug of TRADE_SLUGS) {
      expect(TRADES[slug].stats).toHaveLength(4);
    }
  });

  it("each stat has value and label", () => {
    for (const slug of TRADE_SLUGS) {
      for (const stat of TRADES[slug].stats) {
        expect(stat.value).toBeTruthy();
        expect(stat.label).toBeTruthy();
      }
    }
  });
});

describe("getTradeData", () => {
  it("returns trade data for a valid slug", () => {
    const plumber = getTradeData("plumber");
    expect(plumber).toBeDefined();
    expect(plumber!.label).toBe("Plumbing");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getTradeData("carpenter")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getTradeData("")).toBeUndefined();
  });

  it("returns correct data for each known slug", () => {
    const expectedLabels: Record<string, string> = {
      plumber: "Plumbing",
      hvac: "HVAC",
      roofing: "Roofing",
      electrician: "Electrical",
      landscaping: "Landscaping",
    };

    for (const [slug, label] of Object.entries(expectedLabels)) {
      const data = getTradeData(slug);
      expect(data).toBeDefined();
      expect(data!.label).toBe(label);
    }
  });
});
