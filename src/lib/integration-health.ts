/**
 * Integration Health Monitoring Utility
 *
 * Pure evaluation logic for assessing the health of all platform
 * integrations. No actual API calls — all inputs are passed as
 * function arguments and all outputs are returned as immutable
 * data structures.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Possible connection states for an integration. */
export type IntegrationStatus =
  | "connected"
  | "disconnected"
  | "degraded"
  | "unknown";

/** Category grouping for integrations. */
export type IntegrationCategory =
  | "advertising"
  | "analytics"
  | "listings"
  | "seo"
  | "social"
  | "payments"
  | "email"
  | "communications"
  | "ai"
  | "database"
  | "cache"
  | "hosting";

/** Business-impact tier used for issue prioritization. */
export type ImpactTier = "critical" | "high" | "medium" | "low";

/** Describes a single platform integration. */
export interface Integration {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly category: IntegrationCategory;
  readonly description: string;
  /** Business-impact tier when this integration is unavailable. */
  readonly impactTier: ImpactTier;
}

/** A single health-check record for an integration. */
export interface HealthCheck {
  readonly integrationId: string;
  readonly timestamp: string;
  readonly healthy: boolean;
  /** Response latency in milliseconds. */
  readonly latencyMs: number;
  /** Optional error message when unhealthy. */
  readonly errorMessage?: string;
}

/** Aggregated metrics for a single integration over a time window. */
export interface IntegrationMetrics {
  readonly integrationId: string;
  /** Total number of health checks in the window. */
  readonly totalChecks: number;
  /** Number of checks that returned healthy. */
  readonly healthyChecks: number;
  /** Error rate as a decimal between 0 and 1. */
  readonly errorRate: number;
  /** Average latency in milliseconds. */
  readonly averageLatencyMs: number;
  /** P95 latency in milliseconds. */
  readonly p95LatencyMs: number;
  /** Uptime percentage (0–100). */
  readonly uptimePercent: number;
  /** ISO timestamp of the most recent health check. */
  readonly lastCheckAt: string | null;
}

/** Evaluated health for a single integration. */
export interface IntegrationHealthResult {
  readonly integration: Integration;
  readonly status: IntegrationStatus;
  readonly metrics: IntegrationMetrics;
  /** Human-readable summary of current health. */
  readonly summary: string;
}

/** Report covering all integrations. */
export interface StatusReport {
  readonly generatedAt: string;
  readonly overall: IntegrationStatus;
  readonly results: readonly IntegrationHealthResult[];
  readonly connectedCount: number;
  readonly degradedCount: number;
  readonly disconnectedCount: number;
  readonly unknownCount: number;
}

/** A prioritized issue requiring attention. */
export interface IntegrationIssue {
  readonly integration: Integration;
  readonly status: IntegrationStatus;
  readonly errorRate: number;
  readonly impactTier: ImpactTier;
  /** Numeric priority score — higher means more urgent. */
  readonly priorityScore: number;
  readonly recommendation: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** All platform integrations. */
export const INTEGRATIONS: readonly Integration[] = [
  // Google
  {
    id: "google-ads",
    name: "Google Ads",
    provider: "Google",
    category: "advertising",
    description: "Paid search and display advertising campaigns.",
    impactTier: "critical",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    provider: "Google",
    category: "analytics",
    description: "Website traffic and user behavior analytics.",
    impactTier: "high",
  },
  {
    id: "google-business-profile",
    name: "Google Business Profile",
    provider: "Google",
    category: "listings",
    description: "Local business listing and reviews on Google.",
    impactTier: "high",
  },
  {
    id: "google-search-console",
    name: "Google Search Console",
    provider: "Google",
    category: "seo",
    description: "Organic search performance and indexing status.",
    impactTier: "medium",
  },

  // Meta
  {
    id: "meta-facebook",
    name: "Facebook",
    provider: "Meta",
    category: "social",
    description: "Facebook pages, posts, and advertising.",
    impactTier: "high",
  },
  {
    id: "meta-instagram",
    name: "Instagram",
    provider: "Meta",
    category: "social",
    description: "Instagram content and engagement management.",
    impactTier: "high",
  },

  // Payments
  {
    id: "stripe",
    name: "Stripe",
    provider: "Stripe",
    category: "payments",
    description: "Payment processing, subscriptions, and invoicing.",
    impactTier: "critical",
  },

  // Email
  {
    id: "sendgrid",
    name: "SendGrid",
    provider: "SendGrid",
    category: "email",
    description: "Transactional and marketing email delivery.",
    impactTier: "high",
  },

  // Communications
  {
    id: "twilio",
    name: "Twilio",
    provider: "Twilio",
    category: "communications",
    description: "Voice calls and SMS messaging.",
    impactTier: "high",
  },

  // AI
  {
    id: "openai",
    name: "OpenAI",
    provider: "OpenAI",
    category: "ai",
    description: "GPT models for content generation and analysis.",
    impactTier: "medium",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    provider: "Anthropic",
    category: "ai",
    description: "Claude models for reasoning and content tasks.",
    impactTier: "medium",
  },

  // Database
  {
    id: "prisma",
    name: "Prisma",
    provider: "Prisma",
    category: "database",
    description: "ORM and database toolkit for PostgreSQL access.",
    impactTier: "critical",
  },
  {
    id: "neon",
    name: "Neon",
    provider: "Neon",
    category: "database",
    description: "Serverless PostgreSQL database hosting.",
    impactTier: "critical",
  },

  // Cache / Rate limiting
  {
    id: "upstash",
    name: "Upstash",
    provider: "Upstash",
    category: "cache",
    description: "Serverless Redis for caching and rate limiting.",
    impactTier: "high",
  },

  // Hosting
  {
    id: "vercel",
    name: "Vercel",
    provider: "Vercel",
    category: "hosting",
    description: "Application hosting, edge functions, and CDN.",
    impactTier: "critical",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Thresholds                                                         */
/* ------------------------------------------------------------------ */

/** How many minutes without a check before we consider status unknown. */
const STALE_CHECK_THRESHOLD_MINUTES = 10;

/** Error rate above which an integration is considered degraded. */
const DEGRADED_ERROR_RATE_THRESHOLD = 0.05;

/** Error rate above which an integration is considered disconnected. */
const DISCONNECTED_ERROR_RATE_THRESHOLD = 0.5;

/** Latency (ms) above which an integration is considered degraded. */
const DEGRADED_LATENCY_THRESHOLD_MS = 2_000;

/** Latency (ms) above which an integration is considered disconnected. */
const DISCONNECTED_LATENCY_THRESHOLD_MS = 10_000;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Compute the number of minutes between two ISO timestamps.
 *
 * @param a - Earlier timestamp (ISO 8601).
 * @param b - Later timestamp (ISO 8601).
 * @returns Minutes elapsed, always non-negative.
 */
function minutesBetween(a: string, b: string): number {
  const diff = Math.abs(
    new Date(b).getTime() - new Date(a).getTime()
  );
  return diff / 60_000;
}

/**
 * Compute the P95 value from a sorted numeric array.
 *
 * @param sorted - Values in ascending order.
 * @returns The value at the 95th percentile, or 0 for empty input.
 */
function p95(sorted: readonly number[]): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.min(index, sorted.length - 1)];
}

/* ------------------------------------------------------------------ */
/*  Core functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Calculate uptime percentage from a history of health checks.
 *
 * @param checks - Array of health check records (order does not matter).
 * @returns Uptime percentage from 0 to 100, or 100 when no checks exist.
 */
export function calculateUptime(
  checks: readonly HealthCheck[]
): number {
  if (checks.length === 0) return 100;

  const healthy = checks.filter((c) => c.healthy).length;
  return (healthy / checks.length) * 100;
}

/**
 * Determine the status of an integration based on its recent checks.
 *
 * Decision logic:
 *   1. No checks at all → "unknown".
 *   2. Last check is stale (older than threshold) → "unknown".
 *   3. Error rate ≥ 50% → "disconnected".
 *   4. Error rate ≥ 5% or avg latency ≥ 2 s → "degraded".
 *   5. Otherwise → "connected".
 *
 * @param checks - Health check history, newest first preferred.
 * @param now    - Current ISO timestamp for staleness comparison.
 * @returns Computed integration status.
 */
export function getIntegrationStatus(
  checks: readonly HealthCheck[],
  now: string
): IntegrationStatus {
  if (checks.length === 0) return "unknown";

  const sorted = [...checks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const latest = sorted[0];
  if (minutesBetween(latest.timestamp, now) > STALE_CHECK_THRESHOLD_MINUTES) {
    return "unknown";
  }

  const errorRate = sorted.filter((c) => !c.healthy).length / sorted.length;
  if (errorRate >= DISCONNECTED_ERROR_RATE_THRESHOLD) return "disconnected";

  const avgLatency =
    sorted.reduce((sum, c) => sum + c.latencyMs, 0) / sorted.length;

  if (
    errorRate >= DEGRADED_ERROR_RATE_THRESHOLD ||
    avgLatency >= DEGRADED_LATENCY_THRESHOLD_MS
  ) {
    return "degraded";
  }

  return "connected";
}

/**
 * Evaluate the overall health of a single integration by computing
 * its metrics and status from raw health check history.
 *
 * @param integration - The integration definition.
 * @param checks      - Health check history for this integration.
 * @param now         - Current ISO timestamp.
 * @returns An immutable health result containing status and metrics.
 */
export function evaluateIntegrationHealth(
  integration: Integration,
  checks: readonly HealthCheck[],
  now: string
): IntegrationHealthResult {
  const relevant = checks.filter(
    (c) => c.integrationId === integration.id
  );

  const status = getIntegrationStatus(relevant, now);
  const metrics = buildMetrics(integration.id, relevant);

  const summary = buildSummary(integration.name, status, metrics);

  return { integration, status, metrics, summary };
}

/**
 * Generate a comprehensive status report across all integrations.
 *
 * @param checks - All health check records across all integrations.
 * @param now    - Current ISO timestamp.
 * @returns Immutable status report with per-integration results.
 */
export function generateStatusReport(
  checks: readonly HealthCheck[],
  now: string
): StatusReport {
  const results = INTEGRATIONS.map((integration) =>
    evaluateIntegrationHealth(integration, checks, now)
  );

  const connectedCount = results.filter(
    (r) => r.status === "connected"
  ).length;
  const degradedCount = results.filter(
    (r) => r.status === "degraded"
  ).length;
  const disconnectedCount = results.filter(
    (r) => r.status === "disconnected"
  ).length;
  const unknownCount = results.filter(
    (r) => r.status === "unknown"
  ).length;

  const overall = deriveOverallStatus(results);

  return {
    generatedAt: now,
    overall,
    results,
    connectedCount,
    degradedCount,
    disconnectedCount,
    unknownCount,
  };
}

/**
 * Rank integration issues by business impact.
 *
 * Priority score formula:
 *   impactWeight * (1 + errorRate) * statusMultiplier
 *
 * Only integrations with status "degraded" or "disconnected" are
 * included. Results are sorted descending by priority score.
 *
 * @param results - Per-integration health results.
 * @returns Sorted array of prioritized issues, most urgent first.
 */
export function prioritizeIssues(
  results: readonly IntegrationHealthResult[]
): readonly IntegrationIssue[] {
  const impactWeights: Record<ImpactTier, number> = {
    critical: 100,
    high: 70,
    medium: 40,
    low: 10,
  };

  const statusMultipliers: Record<IntegrationStatus, number> = {
    disconnected: 3,
    degraded: 1.5,
    unknown: 1,
    connected: 0,
  };

  const issues: IntegrationIssue[] = results
    .filter((r) => r.status === "degraded" || r.status === "disconnected")
    .map((r) => {
      const weight = impactWeights[r.integration.impactTier];
      const multiplier = statusMultipliers[r.status];
      const priorityScore =
        Math.round(weight * (1 + r.metrics.errorRate) * multiplier * 100) / 100;

      return {
        integration: r.integration,
        status: r.status,
        errorRate: r.metrics.errorRate,
        impactTier: r.integration.impactTier,
        priorityScore,
        recommendation: buildRecommendation(r),
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return issues;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Build aggregated metrics from a set of health checks.
 *
 * @param integrationId - The integration these checks belong to.
 * @param checks        - Health check records for a single integration.
 * @returns Computed metrics.
 */
function buildMetrics(
  integrationId: string,
  checks: readonly HealthCheck[]
): IntegrationMetrics {
  if (checks.length === 0) {
    return {
      integrationId,
      totalChecks: 0,
      healthyChecks: 0,
      errorRate: 0,
      averageLatencyMs: 0,
      p95LatencyMs: 0,
      uptimePercent: 100,
      lastCheckAt: null,
    };
  }

  const healthyChecks = checks.filter((c) => c.healthy).length;
  const errorRate =
    Math.round(((checks.length - healthyChecks) / checks.length) * 10_000) /
    10_000;

  const latencies = checks.map((c) => c.latencyMs);
  const averageLatencyMs =
    Math.round(
      (latencies.reduce((s, l) => s + l, 0) / latencies.length) * 100
    ) / 100;

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const p95LatencyMs = p95(sortedLatencies);

  const uptimePercent =
    Math.round(calculateUptime(checks) * 100) / 100;

  const sorted = [...checks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const lastCheckAt = sorted[0].timestamp;

  return {
    integrationId,
    totalChecks: checks.length,
    healthyChecks,
    errorRate,
    averageLatencyMs,
    p95LatencyMs,
    uptimePercent,
    lastCheckAt,
  };
}

/**
 * Produce a human-readable health summary.
 *
 * @param name    - Integration display name.
 * @param status  - Computed status.
 * @param metrics - Computed metrics.
 * @returns Summary string.
 */
function buildSummary(
  name: string,
  status: IntegrationStatus,
  metrics: IntegrationMetrics
): string {
  switch (status) {
    case "connected":
      return (
        `${name} is operating normally. ` +
        `Uptime: ${metrics.uptimePercent.toFixed(2)}%, ` +
        `avg latency: ${metrics.averageLatencyMs.toFixed(0)}ms.`
      );
    case "degraded":
      return (
        `${name} is experiencing degraded performance. ` +
        `Error rate: ${(metrics.errorRate * 100).toFixed(1)}%, ` +
        `avg latency: ${metrics.averageLatencyMs.toFixed(0)}ms.`
      );
    case "disconnected":
      return (
        `${name} appears disconnected. ` +
        `Error rate: ${(metrics.errorRate * 100).toFixed(1)}%. ` +
        `Immediate attention required.`
      );
    case "unknown":
      return metrics.lastCheckAt
        ? `${name} status is unknown. Last check: ${metrics.lastCheckAt}.`
        : `${name} has no health check data available.`;
  }
}

/**
 * Generate an actionable recommendation for a failing integration.
 *
 * @param result - The health evaluation result for the integration.
 * @returns A recommendation string.
 */
function buildRecommendation(result: IntegrationHealthResult): string {
  const { integration, status, metrics } = result;

  if (status === "disconnected") {
    return (
      `${integration.name} is down (${(metrics.errorRate * 100).toFixed(1)}% error rate). ` +
      `Verify API credentials, check ${integration.provider} status page, ` +
      `and confirm network connectivity.`
    );
  }

  if (metrics.averageLatencyMs >= DISCONNECTED_LATENCY_THRESHOLD_MS) {
    return (
      `${integration.name} has extreme latency ` +
      `(${metrics.averageLatencyMs.toFixed(0)}ms avg). ` +
      `Check ${integration.provider} for regional outages or rate limiting.`
    );
  }

  if (metrics.errorRate >= DEGRADED_ERROR_RATE_THRESHOLD) {
    return (
      `${integration.name} has elevated errors ` +
      `(${(metrics.errorRate * 100).toFixed(1)}%). ` +
      `Review recent error logs and check API quota limits.`
    );
  }

  if (metrics.averageLatencyMs >= DEGRADED_LATENCY_THRESHOLD_MS) {
    return (
      `${integration.name} has high latency ` +
      `(${metrics.averageLatencyMs.toFixed(0)}ms avg). ` +
      `Consider adding caching or reviewing request patterns.`
    );
  }

  return `${integration.name} requires investigation. Review recent health checks.`;
}

/**
 * Derive an overall platform status from individual results.
 *
 * Rules:
 *   - Any disconnected critical integration → "disconnected"
 *   - Any disconnected or multiple degraded → "degraded"
 *   - All connected → "connected"
 *   - Otherwise → "degraded"
 *
 * @param results - Per-integration health results.
 * @returns The worst applicable status.
 */
function deriveOverallStatus(
  results: readonly IntegrationHealthResult[]
): IntegrationStatus {
  const hasCriticalDisconnect = results.some(
    (r) =>
      r.status === "disconnected" &&
      r.integration.impactTier === "critical"
  );
  if (hasCriticalDisconnect) return "disconnected";

  const hasDisconnected = results.some(
    (r) => r.status === "disconnected"
  );
  if (hasDisconnected) return "degraded";

  const degradedCount = results.filter(
    (r) => r.status === "degraded"
  ).length;
  if (degradedCount >= 2) return "degraded";

  const allConnected = results.every(
    (r) => r.status === "connected" || r.status === "unknown"
  );
  if (allConnected) return "connected";

  return "degraded";
}
