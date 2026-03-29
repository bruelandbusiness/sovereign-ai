/**
 * Competitive intelligence utility for the Sovereign AI platform.
 *
 * Provides structured competitor data, comparison matrices, market
 * positioning analysis, and sales battle-card generation.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export interface Competitor {
  readonly name: string;
  readonly category: string;
  readonly targetMarket: string;
  readonly pricingRange: { readonly min: number; readonly max: number };
  readonly keyFeatures: readonly string[];
  readonly weaknesses: readonly string[];
}

export interface CompetitiveAdvantage {
  readonly area: string;
  readonly sovereignCapability: string;
  readonly competitorGap: string;
  readonly impactLevel: "high" | "medium" | "low";
}

export interface MarketPosition {
  readonly competitor: string;
  readonly pricePoint: "budget" | "mid-market" | "premium" | "enterprise";
  readonly featureCoverage: number; // 0-100 percentage
  readonly aiCapability: "none" | "basic" | "moderate" | "advanced";
}

export interface ComparisonMatrix {
  readonly features: readonly string[];
  readonly competitors: readonly {
    readonly name: string;
    readonly ratings: ReadonlyMap<string, boolean>;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Battle Card Type                                                   */
/* ------------------------------------------------------------------ */

export interface BattleCard {
  readonly competitorName: string;
  readonly overview: string;
  readonly theirStrengths: readonly string[];
  readonly theirWeaknesses: readonly string[];
  readonly ourAdvantages: readonly CompetitiveAdvantage[];
  readonly talkingPoints: readonly string[];
  readonly objectionHandlers: readonly {
    readonly objection: string;
    readonly response: string;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Sovereign AI Feature Set (internal reference)                      */
/* ------------------------------------------------------------------ */

const SOVEREIGN_FEATURES: readonly string[] = [
  "AI-powered review responses",
  "AI content generation",
  "Multi-location management",
  "Reputation monitoring",
  "SEO optimization",
  "Social media management",
  "Booking & scheduling",
  "CRM & lead management",
  "Invoice & payments",
  "Workflow automation",
  "Analytics dashboard",
  "White-label capability",
  "Answer engine optimization",
  "Custom AI agents",
  "Unified inbox",
] as const;

/* ------------------------------------------------------------------ */
/*  Competitors Data                                                   */
/* ------------------------------------------------------------------ */

export const COMPETITORS: readonly Competitor[] = [
  {
    name: "Scorpion",
    category: "Digital Marketing Agency Platform",
    targetMarket: "Home services, legal, medical",
    pricingRange: { min: 1500, max: 5000 },
    keyFeatures: [
      "Website design",
      "SEO & PPC management",
      "Reputation management",
      "Lead tracking",
      "Content marketing",
    ],
    weaknesses: [
      "Long-term contracts required",
      "High price point for small businesses",
      "Limited AI automation",
      "No built-in booking or invoicing",
      "Opaque pricing model",
    ],
  },
  {
    name: "Thryv",
    category: "Small Business Management Platform",
    targetMarket: "Small businesses across industries",
    pricingRange: { min: 199, max: 499 },
    keyFeatures: [
      "CRM & contact management",
      "Social media management",
      "Online presence management",
      "Payment processing",
      "Appointment scheduling",
    ],
    weaknesses: [
      "Dated user interface",
      "Limited AI capabilities",
      "Weak reporting and analytics",
      "Poor third-party integrations",
      "Customer support inconsistency",
    ],
  },
  {
    name: "Vendasta",
    category: "White-Label Marketing Platform",
    targetMarket: "Agencies and resellers",
    pricingRange: { min: 299, max: 1099 },
    keyFeatures: [
      "White-label marketplace",
      "Reputation management",
      "Listing management",
      "Social media marketing",
      "CRM & sales pipeline",
    ],
    weaknesses: [
      "Steep learning curve",
      "Primarily agency-focused, not direct SMB",
      "Marketplace quality varies",
      "Limited native AI features",
      "Complex pricing tiers",
    ],
  },
  {
    name: "ServiceTitan",
    category: "Field Service Management",
    targetMarket: "Home services contractors",
    pricingRange: { min: 245, max: 745 },
    keyFeatures: [
      "Dispatching & scheduling",
      "Invoicing & payments",
      "Marketing automation",
      "Pricebook management",
      "Reporting & analytics",
    ],
    weaknesses: [
      "Very expensive for small teams",
      "Complex implementation process",
      "No built-in AI content generation",
      "Limited reputation management",
      "Requires long onboarding",
    ],
  },
  {
    name: "Podium",
    category: "Customer Communication Platform",
    targetMarket: "Local businesses, automotive, healthcare",
    pricingRange: { min: 289, max: 599 },
    keyFeatures: [
      "Webchat & messaging",
      "Review generation",
      "Text-based payments",
      "Team inbox",
      "Feedback surveys",
    ],
    weaknesses: [
      "Narrow feature set beyond messaging",
      "No SEO or content tools",
      "Limited workflow automation",
      "High per-location pricing",
      "No booking or field service features",
    ],
  },
  {
    name: "Housecall Pro",
    category: "Home Service Business Management",
    targetMarket: "Home services professionals",
    pricingRange: { min: 65, max: 229 },
    keyFeatures: [
      "Job scheduling & dispatching",
      "Invoicing & estimates",
      "Online booking",
      "Customer notifications",
      "QuickBooks integration",
    ],
    weaknesses: [
      "No AI-powered features",
      "Limited marketing tools",
      "Basic reputation management",
      "Weak reporting capabilities",
      "No multi-location support",
    ],
  },
  {
    name: "Jobber",
    category: "Field Service Management",
    targetMarket: "Small home service businesses",
    pricingRange: { min: 49, max: 249 },
    keyFeatures: [
      "Quoting & invoicing",
      "Scheduling & dispatching",
      "Client hub portal",
      "Route optimization",
      "Automated follow-ups",
    ],
    weaknesses: [
      "No AI content or review tools",
      "Limited marketing capabilities",
      "No reputation management",
      "Basic CRM functionality",
      "No social media features",
    ],
  },
  {
    name: "GoHighLevel",
    category: "All-in-One Marketing Platform",
    targetMarket: "Marketing agencies and SMBs",
    pricingRange: { min: 97, max: 497 },
    keyFeatures: [
      "Funnel & website builder",
      "CRM & pipeline management",
      "Email & SMS marketing",
      "Reputation management",
      "White-label capability",
    ],
    weaknesses: [
      "Overwhelming interface complexity",
      "Inconsistent feature quality",
      "Limited field service tools",
      "AI features feel bolted on",
      "Documentation gaps",
    ],
  },
  {
    name: "Broadly",
    category: "Reputation & Communication Platform",
    targetMarket: "Local service businesses",
    pricingRange: { min: 249, max: 499 },
    keyFeatures: [
      "Review generation",
      "Webchat widget",
      "Team inbox",
      "Payment requests",
      "Customer feedback",
    ],
    weaknesses: [
      "Very narrow feature set",
      "No SEO or content tools",
      "No scheduling or dispatch",
      "Limited automation capabilities",
      "No AI content generation",
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Helper: find a competitor by name (case-insensitive)               */
/* ------------------------------------------------------------------ */

function findCompetitor(name: string): Competitor | undefined {
  const normalized = name.toLowerCase();
  return COMPETITORS.find((c) => c.name.toLowerCase() === normalized);
}

/* ------------------------------------------------------------------ */
/*  Advantage Mappings (internal)                                      */
/* ------------------------------------------------------------------ */

const ADVANTAGE_MAP: ReadonlyMap<
  string,
  readonly CompetitiveAdvantage[]
> = new Map([
  [
    "scorpion",
    [
      {
        area: "Pricing",
        sovereignCapability: "Transparent, affordable monthly plans",
        competitorGap: "Opaque pricing with $1,500+ minimums",
        impactLevel: "high",
      },
      {
        area: "AI Automation",
        sovereignCapability: "Native AI agents for reviews, content, and SEO",
        competitorGap: "Minimal AI; relies on manual agency work",
        impactLevel: "high",
      },
      {
        area: "Contract Flexibility",
        sovereignCapability: "Month-to-month, cancel anytime",
        competitorGap: "Requires long-term contracts",
        impactLevel: "medium",
      },
    ],
  ],
  [
    "thryv",
    [
      {
        area: "AI Capabilities",
        sovereignCapability: "Advanced AI content and review response",
        competitorGap: "Limited to no AI features",
        impactLevel: "high",
      },
      {
        area: "User Experience",
        sovereignCapability: "Modern, intuitive dashboard",
        competitorGap: "Dated, cluttered interface",
        impactLevel: "medium",
      },
      {
        area: "Analytics",
        sovereignCapability: "Real-time analytics with actionable insights",
        competitorGap: "Weak, surface-level reporting",
        impactLevel: "medium",
      },
    ],
  ],
  [
    "vendasta",
    [
      {
        area: "Direct SMB Focus",
        sovereignCapability: "Built for business owners, not resellers",
        competitorGap: "Agency-first model adds middleman cost",
        impactLevel: "high",
      },
      {
        area: "Ease of Use",
        sovereignCapability: "Simple onboarding in under 15 minutes",
        competitorGap: "Steep learning curve with complex setup",
        impactLevel: "medium",
      },
      {
        area: "Native AI",
        sovereignCapability: "AI woven into every feature",
        competitorGap: "Limited native AI; relies on third-party add-ons",
        impactLevel: "high",
      },
    ],
  ],
  [
    "servicetitan",
    [
      {
        area: "Affordability",
        sovereignCapability: "Accessible pricing for teams of any size",
        competitorGap: "Expensive; overkill for small operations",
        impactLevel: "high",
      },
      {
        area: "AI Content & Reviews",
        sovereignCapability: "AI-generated content and review responses",
        competitorGap: "No built-in AI content generation",
        impactLevel: "high",
      },
      {
        area: "Onboarding Speed",
        sovereignCapability: "Quick self-service setup",
        competitorGap: "Lengthy, resource-heavy onboarding process",
        impactLevel: "medium",
      },
    ],
  ],
  [
    "podium",
    [
      {
        area: "Feature Breadth",
        sovereignCapability: "Full marketing + operations suite",
        competitorGap: "Primarily messaging and reviews only",
        impactLevel: "high",
      },
      {
        area: "SEO & Content",
        sovereignCapability: "AI-driven SEO and content generation",
        competitorGap: "No SEO or content tools at all",
        impactLevel: "high",
      },
      {
        area: "Workflow Automation",
        sovereignCapability: "End-to-end automated workflows",
        competitorGap: "Limited automation beyond messaging",
        impactLevel: "medium",
      },
    ],
  ],
  [
    "housecall pro",
    [
      {
        area: "AI Features",
        sovereignCapability: "AI agents for content, reviews, and SEO",
        competitorGap: "Zero AI-powered features",
        impactLevel: "high",
      },
      {
        area: "Marketing Tools",
        sovereignCapability: "Full digital marketing suite",
        competitorGap: "Minimal marketing capabilities",
        impactLevel: "high",
      },
      {
        area: "Multi-Location",
        sovereignCapability: "Built-in multi-location management",
        competitorGap: "No multi-location support",
        impactLevel: "medium",
      },
    ],
  ],
  [
    "jobber",
    [
      {
        area: "AI & Automation",
        sovereignCapability: "AI-powered review responses and content",
        competitorGap: "No AI tools; basic automation only",
        impactLevel: "high",
      },
      {
        area: "Reputation Management",
        sovereignCapability: "Full reputation monitoring and response",
        competitorGap: "No reputation management features",
        impactLevel: "high",
      },
      {
        area: "Marketing Suite",
        sovereignCapability: "SEO, social media, and content tools",
        competitorGap: "No marketing capabilities",
        impactLevel: "medium",
      },
    ],
  ],
  [
    "gohighlevel",
    [
      {
        area: "Ease of Use",
        sovereignCapability: "Clean, focused interface for SMBs",
        competitorGap: "Overwhelming complexity; steep learning curve",
        impactLevel: "high",
      },
      {
        area: "AI Integration Quality",
        sovereignCapability: "AI is core to the platform, not an add-on",
        competitorGap: "AI features feel bolted on and inconsistent",
        impactLevel: "high",
      },
      {
        area: "Field Service Tools",
        sovereignCapability: "Booking, scheduling, and job management",
        competitorGap: "Limited field service capabilities",
        impactLevel: "medium",
      },
    ],
  ],
  [
    "broadly",
    [
      {
        area: "Feature Completeness",
        sovereignCapability: "All-in-one platform: marketing + operations",
        competitorGap: "Very narrow: reviews and messaging only",
        impactLevel: "high",
      },
      {
        area: "AI Capabilities",
        sovereignCapability: "Custom AI agents and content generation",
        competitorGap: "No AI content generation at all",
        impactLevel: "high",
      },
      {
        area: "Scheduling & Dispatch",
        sovereignCapability: "Built-in booking and scheduling",
        competitorGap: "No scheduling or dispatch features",
        impactLevel: "high",
      },
    ],
  ],
]);

/* ------------------------------------------------------------------ */
/*  Public Functions                                                   */
/* ------------------------------------------------------------------ */

/**
 * List competitive advantages Sovereign AI has over a specific competitor.
 *
 * @param competitorName - Case-insensitive competitor name.
 * @returns Array of advantages, or an empty array if the competitor is unknown.
 */
export function getCompetitiveAdvantages(
  competitorName: string,
): readonly CompetitiveAdvantage[] {
  return ADVANTAGE_MAP.get(competitorName.toLowerCase()) ?? [];
}

/**
 * Generate a feature comparison matrix for selected competitors.
 *
 * @param competitorNames - Names of competitors to include. If empty, all
 *   competitors are included.
 * @returns A ComparisonMatrix with feature presence for each competitor.
 */
export function generateComparisonMatrix(
  competitorNames: readonly string[] = [],
): ComparisonMatrix {
  const selected: readonly Competitor[] =
    competitorNames.length > 0
      ? competitorNames
          .map((n) => findCompetitor(n))
          .filter((c): c is Competitor => c !== undefined)
      : COMPETITORS;

  const competitors = selected.map((competitor) => {
    const ratings = new Map<string, boolean>();
    for (const feature of SOVEREIGN_FEATURES) {
      const featureLower = feature.toLowerCase();
      const hasFeature = competitor.keyFeatures.some((kf) => {
        const kfLower = kf.toLowerCase();
        return (
          featureLower.includes(kfLower) ||
          kfLower.includes(featureLower) ||
          hasPartialOverlap(featureLower, kfLower)
        );
      });
      ratings.set(feature, hasFeature);
    }
    return { name: competitor.name, ratings };
  });

  return { features: SOVEREIGN_FEATURES, competitors };
}

/**
 * Check whether two feature descriptions share meaningful keyword overlap.
 */
function hasPartialOverlap(a: string, b: string): boolean {
  const STOP_WORDS = new Set([
    "and",
    "or",
    "the",
    "a",
    "an",
    "for",
    "to",
    "of",
    "in",
    "&",
  ]);
  const wordsA = a.split(/\s+/).filter((w) => !STOP_WORDS.has(w));
  const wordsB = new Set(b.split(/\s+/).filter((w) => !STOP_WORDS.has(w)));
  return wordsA.some((word) => word.length > 3 && wordsB.has(word));
}

/**
 * Analyze market positioning for all competitors.
 *
 * @returns Array of MarketPosition entries for every tracked competitor.
 */
export function getMarketPositioning(): readonly MarketPosition[] {
  return COMPETITORS.map((competitor) => {
    const avgPrice =
      (competitor.pricingRange.min + competitor.pricingRange.max) / 2;

    const pricePoint: MarketPosition["pricePoint"] =
      avgPrice < 150
        ? "budget"
        : avgPrice < 400
          ? "mid-market"
          : avgPrice < 1000
            ? "premium"
            : "enterprise";

    const featureCoverage = Math.round(
      (competitor.keyFeatures.length / SOVEREIGN_FEATURES.length) * 100,
    );

    const nameL = competitor.name.toLowerCase();
    const aiKeywords = competitor.keyFeatures.some((f) =>
      f.toLowerCase().includes("ai"),
    );
    const hasAutomation = competitor.keyFeatures.some(
      (f) =>
        f.toLowerCase().includes("automat") ||
        f.toLowerCase().includes("intelligence"),
    );

    let aiCapability: MarketPosition["aiCapability"];
    if (nameL === "gohighlevel") {
      aiCapability = "basic";
    } else if (aiKeywords) {
      aiCapability = "moderate";
    } else if (hasAutomation) {
      aiCapability = "basic";
    } else {
      aiCapability = "none";
    }

    return {
      competitor: competitor.name,
      pricePoint,
      featureCoverage,
      aiCapability,
    };
  });
}

/**
 * Identify competitors weakest in a specific feature area.
 *
 * @param featureArea - A keyword or phrase describing the feature area
 *   (e.g. "AI", "reputation", "scheduling").
 * @returns Competitors sorted by relevance (most weak first).
 */
export function findWeakCompetitors(
  featureArea: string,
): readonly Competitor[] {
  const areaLower = featureArea.toLowerCase();

  const scored = COMPETITORS.map((competitor) => {
    let weaknessScore = 0;

    // Check if any weakness explicitly mentions the area
    for (const weakness of competitor.weaknesses) {
      if (weakness.toLowerCase().includes(areaLower)) {
        weaknessScore += 3;
      }
    }

    // Check if they lack the feature in their key features
    const hasFeature = competitor.keyFeatures.some((f) =>
      f.toLowerCase().includes(areaLower),
    );
    if (!hasFeature) {
      weaknessScore += 2;
    }

    return { competitor, weaknessScore };
  });

  return scored
    .filter((s) => s.weaknessScore > 0)
    .sort((a, b) => b.weaknessScore - a.weaknessScore)
    .map((s) => s.competitor);
}

/**
 * Generate a sales battle card for a specific competitor.
 *
 * @param competitorName - Case-insensitive competitor name.
 * @returns A BattleCard, or null if the competitor is not tracked.
 */
export function generateBattleCard(
  competitorName: string,
): BattleCard | null {
  const competitor = findCompetitor(competitorName);
  if (!competitor) {
    return null;
  }

  const advantages = getCompetitiveAdvantages(competitorName);

  const overview =
    `${competitor.name} is a ${competitor.category.toLowerCase()} ` +
    `targeting ${competitor.targetMarket}. ` +
    `Their pricing ranges from $${competitor.pricingRange.min} to ` +
    `$${competitor.pricingRange.max}/month.`;

  const talkingPoints = advantages
    .filter((a) => a.impactLevel === "high")
    .map(
      (a) =>
        `In ${a.area.toLowerCase()}, we offer ${a.sovereignCapability.toLowerCase()}, ` +
        `while ${competitor.name} ${a.competitorGap.toLowerCase()}.`,
    );

  const objectionHandlers = buildObjectionHandlers(competitor);

  return {
    competitorName: competitor.name,
    overview,
    theirStrengths: competitor.keyFeatures,
    theirWeaknesses: competitor.weaknesses,
    ourAdvantages: advantages,
    talkingPoints,
    objectionHandlers,
  };
}

/* ------------------------------------------------------------------ */
/*  Objection Handler Builder (internal)                               */
/* ------------------------------------------------------------------ */

function buildObjectionHandlers(
  competitor: Competitor,
): readonly { objection: string; response: string }[] {
  const handlers: { objection: string; response: string }[] = [];

  if (competitor.pricingRange.min > 200) {
    handlers.push({
      objection: `${competitor.name} is an established brand with a proven track record.`,
      response:
        "Sovereign AI combines that same proven approach with modern AI " +
        "automation, delivering better results at a fraction of the cost. " +
        "Our clients typically see ROI within the first 30 days.",
    });
  }

  if (
    competitor.weaknesses.some((w) =>
      w.toLowerCase().includes("ai"),
    )
  ) {
    handlers.push({
      objection: `We're already using ${competitor.name} and it works fine.`,
      response:
        "While they cover the basics, Sovereign AI's native AI capabilities " +
        "automate review responses, generate SEO-optimized content, and " +
        "provide intelligent insights that save hours of manual work weekly.",
    });
  }

  if (
    competitor.keyFeatures.some((f) =>
      f.toLowerCase().includes("scheduling"),
    )
  ) {
    handlers.push({
      objection: `${competitor.name} already handles our scheduling needs.`,
      response:
        "Sovereign AI includes scheduling plus a full marketing and " +
        "reputation suite, so you get one platform instead of juggling " +
        "multiple tools. Our AI even optimizes your booking availability.",
    });
  }

  handlers.push({
    objection: `Why should we switch from ${competitor.name}?`,
    response:
      `Unlike ${competitor.name}, Sovereign AI is built AI-first. Every ` +
      "feature is designed to reduce manual effort and grow your business " +
      "on autopilot: AI review responses, AI content creation, AI-driven " +
      "SEO, and intelligent analytics — all in one affordable platform.",
  });

  return handlers;
}
