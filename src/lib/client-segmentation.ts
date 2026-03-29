/**
 * Client segmentation utility for targeting and personalization.
 *
 * Pure logic for segmenting home-service clients by revenue, engagement,
 * trade, lifecycle, and service adoption. No database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type SegmentCategory =
  | "revenue"
  | "engagement"
  | "trade"
  | "lifecycle"
  | "services";

export type RuleOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "contains"
  | "between";

export interface SegmentRule {
  readonly field: string;
  readonly operator: RuleOperator;
  readonly value: unknown;
}

export interface SegmentCriteria {
  readonly matchAll: boolean;
  readonly rules: readonly SegmentRule[];
}

export interface Segment {
  readonly id: string;
  readonly name: string;
  readonly category: SegmentCategory;
  readonly description: string;
  readonly criteria: SegmentCriteria;
}

export interface ClientProfile {
  readonly id: string;
  readonly name: string;
  readonly monthlyRevenue: number;
  readonly trade: string;
  readonly activeServices: readonly string[];
  readonly accountAgeDays: number;
  readonly lastActivityDays: number;
  readonly loginFrequency: number;
  readonly featureAdoptionRate: number;
  readonly supportTickets: number;
  readonly npsScore: number | null;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SegmentResult {
  readonly clientId: string;
  readonly segments: readonly Segment[];
  readonly primarySegment: Segment | null;
  readonly assignedAt: string;
}

export interface SegmentMetrics {
  readonly segmentId: string;
  readonly clientCount: number;
  readonly avgRevenue: number;
  readonly totalRevenue: number;
  readonly avgAccountAgeDays: number;
  readonly avgLoginFrequency: number;
  readonly avgFeatureAdoption: number;
  readonly avgNps: number | null;
  readonly avgSupportTickets: number;
}

export interface SegmentAction {
  readonly segmentId: string;
  readonly actionType: "upsell" | "retain" | "nurture" | "reactivate";
  readonly priority: "high" | "medium" | "low";
  readonly title: string;
  readonly description: string;
  readonly suggestedChannel: string;
}

export interface SegmentComparison {
  readonly segmentA: SegmentMetrics;
  readonly segmentB: SegmentMetrics;
  readonly revenueDiff: number;
  readonly revenueDiffPct: number;
  readonly clientCountDiff: number;
  readonly loginFrequencyDiff: number;
  readonly featureAdoptionDiff: number;
  readonly winner: string;
}

/* ------------------------------------------------------------------ */
/*  Pre-built Segments                                                 */
/* ------------------------------------------------------------------ */

export const SEGMENTS: readonly Segment[] = [
  /* --- Revenue --- */
  {
    id: "rev-high",
    name: "High-Value",
    category: "revenue",
    description: "Clients generating $5,000+/month in revenue",
    criteria: {
      matchAll: true,
      rules: [{ field: "monthlyRevenue", operator: "gte", value: 5000 }],
    },
  },
  {
    id: "rev-mid",
    name: "Mid-Tier",
    category: "revenue",
    description: "Clients generating $2,000-$5,000/month in revenue",
    criteria: {
      matchAll: true,
      rules: [
        { field: "monthlyRevenue", operator: "gte", value: 2000 },
        { field: "monthlyRevenue", operator: "lt", value: 5000 },
      ],
    },
  },
  {
    id: "rev-starter",
    name: "Starter",
    category: "revenue",
    description: "Clients generating less than $2,000/month in revenue",
    criteria: {
      matchAll: true,
      rules: [{ field: "monthlyRevenue", operator: "lt", value: 2000 }],
    },
  },

  /* --- Engagement --- */
  {
    id: "eng-high",
    name: "Highly Active",
    category: "engagement",
    description: "Clients logging in 20+ times/month with high adoption",
    criteria: {
      matchAll: true,
      rules: [
        { field: "loginFrequency", operator: "gte", value: 20 },
        { field: "featureAdoptionRate", operator: "gte", value: 0.7 },
      ],
    },
  },
  {
    id: "eng-moderate",
    name: "Moderately Active",
    category: "engagement",
    description: "Clients logging in 8-19 times/month",
    criteria: {
      matchAll: true,
      rules: [
        { field: "loginFrequency", operator: "gte", value: 8 },
        { field: "loginFrequency", operator: "lt", value: 20 },
      ],
    },
  },
  {
    id: "eng-atrisk",
    name: "At-Risk",
    category: "engagement",
    description: "Clients with declining activity (1-7 logins, 14+ days idle)",
    criteria: {
      matchAll: true,
      rules: [
        { field: "loginFrequency", operator: "gte", value: 1 },
        { field: "loginFrequency", operator: "lt", value: 8 },
        { field: "lastActivityDays", operator: "gte", value: 14 },
      ],
    },
  },
  {
    id: "eng-churned",
    name: "Churned",
    category: "engagement",
    description: "Clients with no logins and 30+ days since last activity",
    criteria: {
      matchAll: true,
      rules: [
        { field: "loginFrequency", operator: "eq", value: 0 },
        { field: "lastActivityDays", operator: "gte", value: 30 },
      ],
    },
  },

  /* --- Trade --- */
  {
    id: "trade-hvac",
    name: "HVAC",
    category: "trade",
    description: "HVAC contractors",
    criteria: {
      matchAll: true,
      rules: [{ field: "trade", operator: "eq", value: "hvac" }],
    },
  },
  {
    id: "trade-plumbing",
    name: "Plumbing",
    category: "trade",
    description: "Plumbing contractors",
    criteria: {
      matchAll: true,
      rules: [{ field: "trade", operator: "eq", value: "plumbing" }],
    },
  },
  {
    id: "trade-electrical",
    name: "Electrical",
    category: "trade",
    description: "Electrical contractors",
    criteria: {
      matchAll: true,
      rules: [{ field: "trade", operator: "eq", value: "electrical" }],
    },
  },
  {
    id: "trade-roofing",
    name: "Roofing",
    category: "trade",
    description: "Roofing contractors",
    criteria: {
      matchAll: true,
      rules: [{ field: "trade", operator: "eq", value: "roofing" }],
    },
  },
  {
    id: "trade-landscaping",
    name: "Landscaping",
    category: "trade",
    description: "Landscaping contractors",
    criteria: {
      matchAll: true,
      rules: [{ field: "trade", operator: "eq", value: "landscaping" }],
    },
  },
  {
    id: "trade-general",
    name: "General",
    category: "trade",
    description: "General contractors",
    criteria: {
      matchAll: true,
      rules: [{ field: "trade", operator: "eq", value: "general" }],
    },
  },

  /* --- Lifecycle --- */
  {
    id: "lc-trial",
    name: "Trial",
    category: "lifecycle",
    description: "Clients currently in trial period",
    criteria: {
      matchAll: true,
      rules: [{ field: "accountAgeDays", operator: "lte", value: 14 }],
    },
  },
  {
    id: "lc-new",
    name: "New",
    category: "lifecycle",
    description: "Clients in their first 0-3 months",
    criteria: {
      matchAll: true,
      rules: [
        { field: "accountAgeDays", operator: "gt", value: 14 },
        { field: "accountAgeDays", operator: "lte", value: 90 },
      ],
    },
  },
  {
    id: "lc-established",
    name: "Established",
    category: "lifecycle",
    description: "Clients with 3-12 months tenure",
    criteria: {
      matchAll: true,
      rules: [
        { field: "accountAgeDays", operator: "gt", value: 90 },
        { field: "accountAgeDays", operator: "lte", value: 365 },
      ],
    },
  },
  {
    id: "lc-mature",
    name: "Mature",
    category: "lifecycle",
    description: "Clients with 12+ months tenure",
    criteria: {
      matchAll: true,
      rules: [{ field: "accountAgeDays", operator: "gt", value: 365 }],
    },
  },

  /* --- Services --- */
  {
    id: "svc-single",
    name: "Single-Service",
    category: "services",
    description: "Clients using exactly one service",
    criteria: {
      matchAll: true,
      rules: [{ field: "activeServices.length", operator: "eq", value: 1 }],
    },
  },
  {
    id: "svc-multi",
    name: "Multi-Service",
    category: "services",
    description: "Clients using 2-4 services",
    criteria: {
      matchAll: true,
      rules: [
        { field: "activeServices.length", operator: "gte", value: 2 },
        { field: "activeServices.length", operator: "lte", value: 4 },
      ],
    },
  },
  {
    id: "svc-fullstack",
    name: "Full-Stack",
    category: "services",
    description: "Clients using 5+ services",
    criteria: {
      matchAll: true,
      rules: [
        { field: "activeServices.length", operator: "gte", value: 5 },
      ],
    },
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Resolve a dotted field path to its value on a client profile.
 */
function resolveField(
  client: ClientProfile,
  field: string
): unknown {
  const parts = field.split(".");
  let current: unknown = client;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (
      part === "length" &&
      Array.isArray(current)
    ) {
      return current.length;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluate a single rule against a client profile.
 */
function evaluateRule(
  client: ClientProfile,
  rule: SegmentRule
): boolean {
  const fieldValue = resolveField(client, rule.field);

  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  switch (rule.operator) {
    case "eq":
      return fieldValue === rule.value;
    case "neq":
      return fieldValue !== rule.value;
    case "gt":
      return (fieldValue as number) > (rule.value as number);
    case "gte":
      return (fieldValue as number) >= (rule.value as number);
    case "lt":
      return (fieldValue as number) < (rule.value as number);
    case "lte":
      return (fieldValue as number) <= (rule.value as number);
    case "in":
      return (rule.value as readonly unknown[]).includes(fieldValue);
    case "notIn":
      return !(rule.value as readonly unknown[]).includes(fieldValue);
    case "contains":
      if (typeof fieldValue === "string") {
        return fieldValue.includes(rule.value as string);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value);
      }
      return false;
    case "between": {
      const [min, max] = rule.value as readonly [number, number];
      const num = fieldValue as number;
      return num >= min && num <= max;
    }
    default:
      return false;
  }
}

/**
 * Check whether a client matches all criteria of a segment.
 */
function matchesSegment(
  client: ClientProfile,
  segment: Segment
): boolean {
  const { matchAll, rules } = segment.criteria;

  if (rules.length === 0) {
    return false;
  }

  if (matchAll) {
    return rules.every((rule) => evaluateRule(client, rule));
  }

  return rules.some((rule) => evaluateRule(client, rule));
}

/**
 * Safely compute an average. Returns 0 when the list is empty.
 */
function avg(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compute the percentage difference between two numbers.
 * Returns 0 when the base is 0 to avoid division by zero.
 */
function pctDiff(a: number, b: number): number {
  if (b === 0) {
    return 0;
  }
  return ((a - b) / Math.abs(b)) * 100;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Assign a client to every matching segment from the built-in list
 * and any additional custom segments provided.
 */
export function segmentClient(
  client: ClientProfile,
  customSegments: readonly Segment[] = []
): SegmentResult {
  const allSegments = [...SEGMENTS, ...customSegments];
  const matched = allSegments.filter((seg) => matchesSegment(client, seg));

  const primary =
    matched.find((s) => s.category === "revenue") ??
    matched[0] ??
    null;

  return {
    clientId: client.id,
    segments: matched,
    primarySegment: primary,
    assignedAt: new Date().toISOString(),
  };
}

/**
 * Return all clients from a list that belong to the given segment.
 */
export function getClientsInSegment(
  clients: readonly ClientProfile[],
  segmentId: string,
  customSegments: readonly Segment[] = []
): readonly ClientProfile[] {
  const allSegments = [...SEGMENTS, ...customSegments];
  const segment = allSegments.find((s) => s.id === segmentId);

  if (!segment) {
    return [];
  }

  return clients.filter((client) => matchesSegment(client, segment));
}

/**
 * Aggregate key metrics for every client that falls into a segment.
 */
export function calculateSegmentMetrics(
  clients: readonly ClientProfile[],
  segmentId: string,
  customSegments: readonly Segment[] = []
): SegmentMetrics | null {
  const matched = getClientsInSegment(clients, segmentId, customSegments);

  if (matched.length === 0) {
    return null;
  }

  const revenues = matched.map((c) => c.monthlyRevenue);
  const ages = matched.map((c) => c.accountAgeDays);
  const logins = matched.map((c) => c.loginFrequency);
  const adoptions = matched.map((c) => c.featureAdoptionRate);
  const tickets = matched.map((c) => c.supportTickets);
  const npsValues = matched
    .map((c) => c.npsScore)
    .filter((n): n is number => n !== null);

  return {
    segmentId,
    clientCount: matched.length,
    avgRevenue: avg(revenues),
    totalRevenue: revenues.reduce((s, v) => s + v, 0),
    avgAccountAgeDays: avg(ages),
    avgLoginFrequency: avg(logins),
    avgFeatureAdoption: avg(adoptions),
    avgNps: npsValues.length > 0 ? avg(npsValues) : null,
    avgSupportTickets: avg(tickets),
  };
}

/**
 * Recommend actions for a segment based on its category and traits.
 */
export function suggestSegmentActions(
  segmentId: string,
  clients: readonly ClientProfile[],
  customSegments: readonly Segment[] = []
): readonly SegmentAction[] {
  const allSegments = [...SEGMENTS, ...customSegments];
  const segment = allSegments.find((s) => s.id === segmentId);

  if (!segment) {
    return [];
  }

  const metrics = calculateSegmentMetrics(clients, segmentId, customSegments);
  const actions: SegmentAction[] = [];

  /* --- Revenue-based actions --- */
  if (segment.id === "rev-high") {
    actions.push({
      segmentId,
      actionType: "retain",
      priority: "high",
      title: "VIP retention program",
      description:
        "Assign a dedicated account manager and offer priority support to protect high-value revenue.",
      suggestedChannel: "phone",
    });
    actions.push({
      segmentId,
      actionType: "upsell",
      priority: "medium",
      title: "Premium add-on bundle",
      description:
        "Present premium analytics and automation add-ons that complement their current usage.",
      suggestedChannel: "email",
    });
  }

  if (segment.id === "rev-mid") {
    actions.push({
      segmentId,
      actionType: "upsell",
      priority: "high",
      title: "Growth plan upgrade",
      description:
        "Highlight the ROI of upgrading to a higher tier with additional features and capacity.",
      suggestedChannel: "in-app",
    });
  }

  if (segment.id === "rev-starter") {
    actions.push({
      segmentId,
      actionType: "nurture",
      priority: "medium",
      title: "Onboarding acceleration",
      description:
        "Send a guided onboarding sequence showcasing quick wins to demonstrate value early.",
      suggestedChannel: "email",
    });
  }

  /* --- Engagement-based actions --- */
  if (segment.id === "eng-high") {
    actions.push({
      segmentId,
      actionType: "upsell",
      priority: "medium",
      title: "Power-user expansion",
      description:
        "Offer beta access to new features and invite to a referral program.",
      suggestedChannel: "in-app",
    });
  }

  if (segment.id === "eng-moderate") {
    actions.push({
      segmentId,
      actionType: "nurture",
      priority: "medium",
      title: "Feature discovery campaign",
      description:
        "Deliver targeted tips highlighting underused features to deepen engagement.",
      suggestedChannel: "email",
    });
  }

  if (segment.id === "eng-atrisk") {
    actions.push({
      segmentId,
      actionType: "retain",
      priority: "high",
      title: "Re-engagement outreach",
      description:
        "Trigger a personalized win-back email and schedule a check-in call.",
      suggestedChannel: "email",
    });
  }

  if (segment.id === "eng-churned") {
    actions.push({
      segmentId,
      actionType: "reactivate",
      priority: "high",
      title: "Win-back campaign",
      description:
        "Offer a limited-time discount or free month to reactivate the account.",
      suggestedChannel: "email",
    });
  }

  /* --- Lifecycle-based actions --- */
  if (segment.id === "lc-trial") {
    actions.push({
      segmentId,
      actionType: "nurture",
      priority: "high",
      title: "Trial conversion sequence",
      description:
        "Deliver a daily drip of success stories and feature walkthroughs to drive conversion.",
      suggestedChannel: "email",
    });
  }

  if (segment.id === "lc-new") {
    actions.push({
      segmentId,
      actionType: "nurture",
      priority: "high",
      title: "90-day success plan",
      description:
        "Guide new clients through milestones with scheduled check-ins and training resources.",
      suggestedChannel: "in-app",
    });
  }

  if (segment.id === "lc-established") {
    actions.push({
      segmentId,
      actionType: "upsell",
      priority: "medium",
      title: "Annual plan incentive",
      description:
        "Encourage commitment with discounted annual pricing and loyalty perks.",
      suggestedChannel: "email",
    });
  }

  if (segment.id === "lc-mature") {
    actions.push({
      segmentId,
      actionType: "retain",
      priority: "medium",
      title: "Loyalty recognition",
      description:
        "Celebrate their tenure with exclusive benefits and ask for a case study or testimonial.",
      suggestedChannel: "phone",
    });
  }

  /* --- Services-based actions --- */
  if (segment.id === "svc-single") {
    actions.push({
      segmentId,
      actionType: "upsell",
      priority: "high",
      title: "Cross-sell complementary service",
      description:
        "Recommend the next most-adopted service for their trade to increase stickiness.",
      suggestedChannel: "in-app",
    });
  }

  if (segment.id === "svc-multi") {
    actions.push({
      segmentId,
      actionType: "upsell",
      priority: "medium",
      title: "Full-stack bundle offer",
      description:
        "Present a bundled discount for adopting the remaining services in the platform.",
      suggestedChannel: "email",
    });
  }

  if (segment.id === "svc-fullstack") {
    actions.push({
      segmentId,
      actionType: "retain",
      priority: "high",
      title: "Platform champion program",
      description:
        "Enroll in a champion program with early access, dedicated support, and co-marketing.",
      suggestedChannel: "phone",
    });
  }

  /* --- Trade-based actions (generic for all trades) --- */
  if (segment.category === "trade") {
    actions.push({
      segmentId,
      actionType: "nurture",
      priority: "low",
      title: `${segment.name} industry insights`,
      description:
        `Send curated ${segment.name.toLowerCase()} industry benchmarks, tips, and seasonal playbooks.`,
      suggestedChannel: "email",
    });
  }

  /* --- Metrics-driven fallback actions --- */
  if (
    metrics &&
    actions.length === 0
  ) {
    if (metrics.avgFeatureAdoption < 0.3) {
      actions.push({
        segmentId,
        actionType: "nurture",
        priority: "medium",
        title: "Feature adoption boost",
        description:
          "Low feature adoption detected. Deliver in-app guidance and tutorial sequences.",
        suggestedChannel: "in-app",
      });
    }

    if (metrics.avgSupportTickets > 5) {
      actions.push({
        segmentId,
        actionType: "retain",
        priority: "high",
        title: "Proactive support intervention",
        description:
          "High ticket volume detected. Schedule proactive training to reduce friction.",
        suggestedChannel: "phone",
      });
    }
  }

  return actions;
}

/**
 * Build a custom segment from user-defined rules.
 */
export function createCustomSegment(
  id: string,
  name: string,
  category: SegmentCategory,
  description: string,
  rules: readonly SegmentRule[],
  matchAll: boolean = true
): Segment {
  return {
    id,
    name,
    category,
    description,
    criteria: { matchAll, rules },
  };
}

/**
 * Compare aggregate metrics between two segments side by side.
 */
export function compareSegments(
  clients: readonly ClientProfile[],
  segmentIdA: string,
  segmentIdB: string,
  customSegments: readonly Segment[] = []
): SegmentComparison | null {
  const metricsA = calculateSegmentMetrics(
    clients,
    segmentIdA,
    customSegments
  );
  const metricsB = calculateSegmentMetrics(
    clients,
    segmentIdB,
    customSegments
  );

  if (!metricsA || !metricsB) {
    return null;
  }

  const revDiff = metricsA.avgRevenue - metricsB.avgRevenue;
  const loginDiff = metricsA.avgLoginFrequency - metricsB.avgLoginFrequency;
  const adoptionDiff =
    metricsA.avgFeatureAdoption - metricsB.avgFeatureAdoption;

  const aScore =
    metricsA.avgRevenue +
    metricsA.avgLoginFrequency * 100 +
    metricsA.avgFeatureAdoption * 1000;
  const bScore =
    metricsB.avgRevenue +
    metricsB.avgLoginFrequency * 100 +
    metricsB.avgFeatureAdoption * 1000;

  return {
    segmentA: metricsA,
    segmentB: metricsB,
    revenueDiff: revDiff,
    revenueDiffPct: pctDiff(metricsA.avgRevenue, metricsB.avgRevenue),
    clientCountDiff: metricsA.clientCount - metricsB.clientCount,
    loginFrequencyDiff: loginDiff,
    featureAdoptionDiff: adoptionDiff,
    winner: aScore >= bScore ? segmentIdA : segmentIdB,
  };
}
