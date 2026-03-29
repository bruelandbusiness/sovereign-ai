import { describe, it, expect } from "vitest";

// Multi-location
import {
  createLocation,
  rankLocations,
  aggregateMetrics,
  detectUnderperformers,
  type LocationMetrics,
} from "../multi-location";

// Seasonal trends
import {
  SEASONAL_PATTERNS,
  getSeasonalIndex,
  identifyPeakPeriods,
  forecastDemand,
} from "../seasonal-trends";

// Goal tracking
import {
  GOAL_TEMPLATES,
  createGoal,
  calculateGoalProgress,
  isOnTrack,
} from "../goal-tracking";

// API docs
import {
  API_ENDPOINTS,
  generateOpenAPISpec,
  getEndpointsByTag,
  generateEndpointDocs,
} from "../api-docs";

// SEO meta
import {
  generatePageMeta,
  generateBreadcrumbs,
  validateMetaLength,
  generateSchemaOrg,
} from "../seo-meta";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMetrics(
  overrides: Partial<LocationMetrics> & { locationId: string },
): LocationMetrics {
  return {
    period: { start: new Date("2025-01-01"), end: new Date("2025-03-31") },
    leads: 0,
    revenue: 0,
    adSpend: 0,
    reviews: 0,
    averageRating: 4.0,
    bookings: 0,
    conversionRate: 0,
    growthRate: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Multi-location
// ---------------------------------------------------------------------------

describe("multi-location", () => {
  it("createLocation produces a location with an id", () => {
    const loc = createLocation({
      name: "North Office",
      address: "123 Main St",
      phone: "555-0100",
      timezone: "America/Chicago",
      serviceAreaZipCodes: ["60601", "60602"],
    });

    expect(loc.id).toBeDefined();
    expect(loc.id).toMatch(/^loc_/);
    expect(loc.name).toBe("North Office");
    expect(loc.serviceAreaZipCodes).toEqual(["60601", "60602"]);
    expect(loc.createdAt).toBeInstanceOf(Date);
  });

  it("rankLocations sorts by the chosen metric in descending order", () => {
    const metrics: LocationMetrics[] = [
      makeMetrics({ locationId: "a", revenue: 5000 }),
      makeMetrics({ locationId: "b", revenue: 12000 }),
      makeMetrics({ locationId: "c", revenue: 8000 }),
    ];

    const ranking = rankLocations(metrics, "revenue");

    expect(ranking.metric).toBe("revenue");
    expect(ranking.rankings[0].locationId).toBe("b");
    expect(ranking.rankings[0].rank).toBe(1);
    expect(ranking.rankings[1].locationId).toBe("c");
    expect(ranking.rankings[2].locationId).toBe("a");
  });

  it("aggregateMetrics sums totals correctly", () => {
    const metrics: LocationMetrics[] = [
      makeMetrics({
        locationId: "a",
        leads: 10,
        revenue: 1000,
        adSpend: 200,
        reviews: 5,
        bookings: 8,
        conversionRate: 4,
        growthRate: 10,
        averageRating: 4.5,
      }),
      makeMetrics({
        locationId: "b",
        leads: 20,
        revenue: 3000,
        adSpend: 400,
        reviews: 10,
        bookings: 12,
        conversionRate: 6,
        growthRate: 20,
        averageRating: 4.0,
      }),
    ];

    const agg = aggregateMetrics(metrics);

    expect(agg.totalLeads).toBe(30);
    expect(agg.totalRevenue).toBe(4000);
    expect(agg.totalAdSpend).toBe(600);
    expect(agg.totalReviews).toBe(15);
    expect(agg.totalBookings).toBe(20);
    expect(agg.averageConversionRate).toBe(5);
    expect(agg.averageGrowthRate).toBe(15);
    expect(agg.averageRating).toBe(4.25);
    expect(agg.locationCount).toBe(2);
  });

  it("detectUnderperformers flags locations below average", () => {
    const metrics: LocationMetrics[] = [
      makeMetrics({ locationId: "high", revenue: 10000, leads: 100 }),
      makeMetrics({ locationId: "low", revenue: 2000, leads: 20 }),
    ];

    const flags = detectUnderperformers(metrics);

    // "low" should be flagged for revenue and leads (below average)
    const lowFlag = flags.find((f) => f.locationId === "low");
    expect(lowFlag).toBeDefined();
    const flaggedMetricNames = lowFlag!.underperformingMetrics.map(
      (m) => m.metric,
    );
    expect(flaggedMetricNames).toContain("revenue");
    expect(flaggedMetricNames).toContain("leads");
  });
});

// ---------------------------------------------------------------------------
// 2. Seasonal trends
// ---------------------------------------------------------------------------

describe("seasonal-trends", () => {
  it("SEASONAL_PATTERNS has 7 trades", () => {
    const trades = Object.keys(SEASONAL_PATTERNS);
    expect(trades).toHaveLength(7);
    expect(trades).toContain("hvac");
    expect(trades).toContain("plumbing");
    expect(trades).toContain("painting");
  });

  it("getSeasonalIndex returns a valid multiplier", () => {
    const index = getSeasonalIndex("hvac", 7);
    expect(index).toBe(1.6); // July is HVAC peak
    expect(typeof index).toBe("number");
    expect(index).toBeGreaterThan(0);
  });

  it("identifyPeakPeriods returns correct months for HVAC", () => {
    const peaks = identifyPeakPeriods("hvac", 3);

    expect(peaks).toHaveLength(3);
    // Top 3 HVAC months by demand index: Jul(1.6), Jun(1.5), Aug(1.5)
    expect(peaks[0].rank).toBe(1);
    expect(peaks[0].demandIndex).toBe(1.6);
    expect(peaks[0].monthName).toBe("July");
    expect(peaks[1].rank).toBe(2);
  });

  it("forecastDemand returns projected values", () => {
    const historical = [
      { month: 1 as const, year: 2025, value: 100 },
      { month: 2 as const, year: 2025, value: 110 },
      { month: 3 as const, year: 2025, value: 90 },
    ];

    const forecast = forecastDemand("hvac", historical, 4, 2025, 3);

    expect(forecast).toHaveLength(3);
    expect(forecast[0].month).toBe(4);
    expect(forecast[0].year).toBe(2025);
    expect(forecast[0].projectedDemand).toBeGreaterThan(0);
    expect(forecast[0].seasonalMultiplier).toBe(0.7); // April HVAC
    expect(forecast[0].confidence).toBeLessThanOrEqual(1);
    expect(forecast[0].confidence).toBeGreaterThanOrEqual(0.5);
  });
});

// ---------------------------------------------------------------------------
// 3. Goal tracking
// ---------------------------------------------------------------------------

describe("goal-tracking", () => {
  it("GOAL_TEMPLATES has 12 templates", () => {
    const keys = Object.keys(GOAL_TEMPLATES);
    expect(keys).toHaveLength(12);
    expect(keys).toContain("revenue_mrr");
    expect(keys).toContain("leads_monthly");
    expect(keys).toContain("seo_rankings");
    expect(keys).toContain("bookings_weekly");
    expect(keys).toContain("engagement_email");
  });

  it("createGoal generates a goal with milestones", () => {
    const deadline = new Date(Date.now() + 90 * 86_400_000);
    const goal = createGoal({
      title: "Reach 100 leads",
      category: "leads",
      targetValue: 100,
      deadline,
      milestoneCount: 3,
    });

    expect(goal.id).toMatch(/^goal_/);
    expect(goal.title).toBe("Reach 100 leads");
    expect(goal.category).toBe("leads");
    expect(goal.targetValue).toBe(100);
    expect(goal.status).toBe("not_started");
    expect(goal.milestones).toHaveLength(3);
    expect(goal.milestones[0].label).toBe("Milestone 1");
    expect(goal.milestones[0].isCompleted).toBe(false);
  });

  it("calculateGoalProgress returns percentage", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 86_400_000);
    const deadline = new Date(now.getTime() + 60 * 86_400_000);

    const goal = createGoal({
      title: "Revenue goal",
      category: "revenue",
      targetValue: 10000,
      currentValue: 5000,
      startDate: start,
      deadline,
    });

    const progress = calculateGoalProgress(goal);

    expect(progress.percentage).toBe(50);
    expect(progress.currentValue).toBe(5000);
    expect(progress.targetValue).toBe(10000);
    expect(typeof progress.isOnTrack).toBe("boolean");
    expect(progress.daysRemaining).toBeGreaterThan(0);
  });

  it("isOnTrack returns a boolean based on pace", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 10 * 86_400_000);
    const deadline = new Date(now.getTime() + 90 * 86_400_000);

    const goal = createGoal({
      title: "Reviews goal",
      category: "reviews",
      targetValue: 50,
      currentValue: 5,
      startDate: start,
      deadline,
    });

    const result = isOnTrack(goal);
    expect(typeof result).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// 4. API docs
// ---------------------------------------------------------------------------

describe("api-docs", () => {
  it("API_ENDPOINTS has 15+ endpoints", () => {
    expect(API_ENDPOINTS.length).toBeGreaterThanOrEqual(15);
  });

  it("generateOpenAPISpec returns a valid spec with paths", () => {
    const spec = generateOpenAPISpec();

    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info).toBeDefined();
    expect((spec.info as Record<string, unknown>).title).toBe(
      "Sovereign AI Platform API",
    );
    expect(spec.paths).toBeDefined();
    const paths = spec.paths as Record<string, unknown>;
    const pathKeys = Object.keys(paths);
    expect(pathKeys.length).toBeGreaterThan(0);
    // Verify a known path exists (bracket syntax converted to OpenAPI)
    expect(pathKeys).toContain("/api/auth/magic-link");
  });

  it("getEndpointsByTag groups correctly", () => {
    const grouped = getEndpointsByTag();

    expect(grouped).toHaveProperty("Auth");
    expect(grouped).toHaveProperty("Dashboard");
    expect(grouped).toHaveProperty("Leads");
    expect(grouped).toHaveProperty("Payments");
    expect(grouped.Auth.length).toBeGreaterThanOrEqual(2);
    expect(grouped.Leads.length).toBeGreaterThanOrEqual(2);
  });

  it("generateEndpointDocs returns a markdown string", () => {
    const endpoint = API_ENDPOINTS[0];
    const docs = generateEndpointDocs(endpoint);

    expect(typeof docs).toBe("string");
    expect(docs).toContain("##");
    expect(docs).toContain(endpoint.path);
    expect(docs).toContain(endpoint.method);
    expect(docs).toContain("Parameters");
    expect(docs).toContain("Responses");
  });
});

// ---------------------------------------------------------------------------
// 5. SEO meta
// ---------------------------------------------------------------------------

describe("seo-meta", () => {
  it("generatePageMeta includes title with suffix", () => {
    const meta = generatePageMeta({
      title: "Dashboard",
      description: "View your business dashboard with key metrics and insights.",
      path: "/dashboard",
    });

    expect(meta.title).toBe("Dashboard | Sovereign AI");
    expect(meta.description).toContain("dashboard");
    expect(meta.canonicalUrl).toContain("/dashboard");
    expect(meta.robots).toBe("index, follow");
  });

  it("generateBreadcrumbs creates a trail from path", () => {
    const crumbs = generateBreadcrumbs("/features/analytics");

    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].name).toBe("Home");
    expect(crumbs[0].position).toBe(1);
    expect(crumbs[1].name).toBe("Features");
    expect(crumbs[1].position).toBe(2);
    expect(crumbs[2].name).toBe("Analytics");
    expect(crumbs[2].position).toBe(3);
    expect(crumbs[2].url).toContain("/features/analytics");
  });

  it("validateMetaLength flags long titles", () => {
    const longTitle = "A".repeat(80);
    const shortDesc = "A valid description that is not too long at all.";

    const result = validateMetaLength(longTitle, shortDesc);

    expect(result.valid).toBe(false);
    expect(result.titleValid).toBe(false);
    expect(result.titleLength).toBe(80);
    expect(result.descriptionValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("Title"))).toBe(true);
  });

  it("generateSchemaOrg returns valid JSON-LD", () => {
    const schema = generateSchemaOrg("Organization", {
      name: "Sovereign AI",
      url: "https://www.sovereignai.com",
      logo: "https://www.sovereignai.com/logo.png",
      description: "AI-powered platform for home service businesses.",
    });

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("Sovereign AI");
    expect(schema.url).toBe("https://www.sovereignai.com");
    expect(schema.logo).toBe("https://www.sovereignai.com/logo.png");
    expect(schema.description).toBe(
      "AI-powered platform for home service businesses.",
    );
  });
});
