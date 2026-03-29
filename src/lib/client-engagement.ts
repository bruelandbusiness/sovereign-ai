/**
 * Client engagement scoring utility.
 *
 * Measures how actively a client uses the platform over the last 30 days,
 * producing a 0-100 composite score broken into five weighted factors:
 *   - Dashboard visits   (0-25)
 *   - Service usage      (0-25)
 *   - Lead response time (0-20)
 *   - Feature adoption   (0-15)
 *   - Support tickets    (0-15)
 *
 * Also computes a churn-risk probability and contextual recommendations.
 */

import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FactorDetail {
  score: number;
  detail: string;
}

export interface EngagementScore {
  /** Composite score, 0-100. */
  score: number;
  /** Human-readable engagement level. */
  level: "power_user" | "active" | "moderate" | "at_risk" | "churning";
  /** Per-factor breakdown. */
  factors: {
    dashboardVisits: FactorDetail;
    serviceUsage: FactorDetail;
    leadResponseTime: FactorDetail;
    featureAdoption: FactorDetail;
    supportTickets: FactorDetail;
  };
  /** Contextual suggestions to boost engagement. */
  recommendations: string[];
  /** 0-100 probability of churning. */
  churnRisk: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total platform services a client could subscribe to. */
const TOTAL_PLATFORM_SERVICES = 16;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Factor weight caps (must sum to 100)
const MAX_DASHBOARD = 25;
const MAX_SERVICE = 25;
const MAX_LEAD_RESPONSE = 20;
const MAX_FEATURE = 15;
const MAX_SUPPORT = 15;

// ---------------------------------------------------------------------------
// Helpers — pure functions for each factor
// ---------------------------------------------------------------------------

function scoreDashboardVisits(sessionCount: number): FactorDetail {
  // 1+ visit/day (30+) = perfect, linear falloff below that
  const ratio = Math.min(sessionCount / 30, 1);
  const score = Math.round(ratio * MAX_DASHBOARD);

  let detail: string;
  if (sessionCount >= 30) {
    detail = `${sessionCount} sessions — daily active user`;
  } else if (sessionCount >= 15) {
    detail = `${sessionCount} sessions — visits roughly every other day`;
  } else if (sessionCount >= 5) {
    detail = `${sessionCount} sessions — weekly visitor`;
  } else if (sessionCount >= 1) {
    detail = `${sessionCount} session(s) — rarely logs in`;
  } else {
    detail = "No sessions in the last 30 days";
  }

  return { score, detail };
}

function scoreServiceUsage(
  activeCount: number,
  totalCount: number,
): FactorDetail {
  if (totalCount === 0) {
    return { score: 0, detail: "No services provisioned" };
  }

  const ratio = activeCount / totalCount;
  const score = Math.round(ratio * MAX_SERVICE);

  const detail =
    `${activeCount} of ${totalCount} subscribed services active` +
    (ratio >= 1 ? " — fully utilised" : "");

  return { score, detail };
}

function scoreLeadResponseTime(
  avgResponseHours: number | null,
  leadCount: number,
): FactorDetail {
  if (leadCount === 0) {
    // No leads to respond to — neutral, give partial credit
    return {
      score: Math.round(MAX_LEAD_RESPONSE * 0.5),
      detail: "No leads received in the last 30 days",
    };
  }

  if (avgResponseHours === null) {
    return { score: 0, detail: `${leadCount} leads received — none contacted` };
  }

  // < 1 hr = perfect, degrades toward 72 hr
  let ratio: number;
  if (avgResponseHours <= 1) {
    ratio = 1;
  } else if (avgResponseHours <= 72) {
    ratio = 1 - (avgResponseHours - 1) / 71;
  } else {
    ratio = 0;
  }

  const score = Math.round(ratio * MAX_LEAD_RESPONSE);
  const detail =
    avgResponseHours < 1
      ? `Avg response under 1 hour across ${leadCount} leads — excellent`
      : `Avg response ${avgResponseHours.toFixed(1)} hours across ${leadCount} leads`;

  return { score, detail };
}

function scoreFeatureAdoption(
  distinctServiceIds: number,
): FactorDetail {
  const ratio = Math.min(distinctServiceIds / TOTAL_PLATFORM_SERVICES, 1);
  const score = Math.round(ratio * MAX_FEATURE);

  const pct = Math.round(ratio * 100);
  const detail = `Using ${distinctServiceIds} of ${TOTAL_PLATFORM_SERVICES} platform features (${pct}%)`;

  return { score, detail };
}

function scoreSupportTickets(
  openCount: number,
  resolvedCount: number,
  totalCount: number,
): FactorDetail {
  if (totalCount === 0) {
    // No tickets — slightly positive (no issues)
    return {
      score: Math.round(MAX_SUPPORT * 0.7),
      detail: "No support tickets — no reported issues",
    };
  }

  // Resolved tickets are a positive signal; excessive open tickets
  // indicate frustration.
  const resolutionRatio = totalCount > 0 ? resolvedCount / totalCount : 0;

  // Base: engagement from filing tickets (cap at 5 for positive signal)
  const engagementBonus = Math.min(totalCount, 5) / 5;

  // Penalty: too many open tickets implies frustration
  const frustrationPenalty = Math.min(openCount / 5, 1);

  const raw = engagementBonus * 0.4 + resolutionRatio * 0.6 - frustrationPenalty * 0.4;
  const score = Math.round(Math.max(0, Math.min(1, raw)) * MAX_SUPPORT);

  let detail: string;
  if (openCount > 3) {
    detail = `${openCount} open tickets — possible frustration`;
  } else {
    detail = `${totalCount} ticket(s), ${resolvedCount} resolved`;
  }

  return { score, detail };
}

// ---------------------------------------------------------------------------
// Level & churn derivation
// ---------------------------------------------------------------------------

type EngagementLevel = EngagementScore["level"];

function levelFromScore(score: number): EngagementLevel {
  if (score >= 80) return "power_user";
  if (score >= 60) return "active";
  if (score >= 40) return "moderate";
  if (score >= 20) return "at_risk";
  return "churning";
}

function churnRiskFromScore(score: number): number {
  // Inverse relationship: low engagement = high churn risk.
  // Apply a slight exponential curve so risk climbs faster at the low end.
  const linear = 100 - score;
  const curved = Math.round(linear ** 1.3 / 100 ** 0.3);
  return Math.max(0, Math.min(100, curved));
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

function buildRecommendations(
  factors: EngagementScore["factors"],
): string[] {
  const recs: string[] = [];

  if (factors.dashboardVisits.score < MAX_DASHBOARD * 0.5) {
    recs.push(
      "Schedule a weekly check-in email with dashboard highlights to drive login frequency.",
    );
  }

  if (factors.serviceUsage.score < MAX_SERVICE * 0.5) {
    recs.push(
      "Offer a guided walkthrough of inactive services to demonstrate value.",
    );
  }

  if (factors.leadResponseTime.score < MAX_LEAD_RESPONSE * 0.5) {
    recs.push(
      "Enable real-time lead notifications via SMS or push to reduce response time.",
    );
  }

  if (factors.featureAdoption.score < MAX_FEATURE * 0.5) {
    recs.push(
      "Send a personalised feature-discovery email highlighting unused platform capabilities.",
    );
  }

  if (factors.supportTickets.score < MAX_SUPPORT * 0.3) {
    recs.push(
      "Proactively reach out — multiple unresolved tickets may signal frustration.",
    );
  }

  if (recs.length === 0) {
    recs.push(
      "Client is highly engaged — consider inviting them to a case study or referral program.",
    );
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Calculate the engagement score for a client over the last 30 days.
 *
 * @param clientId - The client's primary key (`Client.id`).
 * @param now      - Optional reference timestamp (defaults to `new Date()`).
 *                   Pass an explicit value for deterministic testing.
 */
export async function calculateEngagement(
  clientId: string,
  now: Date = new Date(),
): Promise<EngagementScore> {
  const windowStart = new Date(now.getTime() - THIRTY_DAYS_MS);

  // Run all five queries in parallel for minimal latency.
  const [
    sessionCount,
    clientServices,
    leads,
    distinctServiceCount,
    supportTickets,
  ] = await Promise.all([
    // 1. Dashboard visits — count sessions created/used in window
    prisma.session.count({
      where: {
        account: { client: { id: clientId } },
        createdAt: { gte: windowStart },
      },
    }),

    // 2. Service usage — all subscribed services and their statuses
    prisma.clientService.findMany({
      where: { clientId },
      select: { serviceId: true, status: true },
    }),

    // 3. Lead response time — leads created in window with contact timestamps
    prisma.lead.findMany({
      where: {
        clientId,
        createdAt: { gte: windowStart },
      },
      select: { createdAt: true, lastContactedAt: true },
    }),

    // 4. Feature adoption — count distinct service IDs ever activated
    prisma.clientService.findMany({
      where: { clientId },
      distinct: ["serviceId"],
      select: { serviceId: true },
    }),

    // 5. Support tickets in window
    prisma.supportTicket.findMany({
      where: {
        clientId,
        createdAt: { gte: windowStart },
      },
      select: { status: true },
    }),
  ]);

  // --- Factor 1: Dashboard visits ---
  const dashboardVisits = scoreDashboardVisits(sessionCount);

  // --- Factor 2: Service usage ---
  const activeServiceCount = clientServices.filter(
    (s) => s.status === "active",
  ).length;
  const serviceUsage = scoreServiceUsage(
    activeServiceCount,
    clientServices.length,
  );

  // --- Factor 3: Lead response time ---
  const contactedLeads = leads.filter((l) => l.lastContactedAt !== null);
  let avgResponseHours: number | null = null;
  if (contactedLeads.length > 0) {
    const totalHours = contactedLeads.reduce((sum, l) => {
      const diffMs =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        l.lastContactedAt!.getTime() - l.createdAt.getTime();
      return sum + Math.max(diffMs, 0) / (1000 * 60 * 60);
    }, 0);
    avgResponseHours = totalHours / contactedLeads.length;
  }
  const leadResponseTime = scoreLeadResponseTime(
    avgResponseHours,
    leads.length,
  );

  // --- Factor 4: Feature adoption ---
  const featureAdoption = scoreFeatureAdoption(distinctServiceCount.length);

  // --- Factor 5: Support tickets ---
  const openTicketCount = supportTickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;
  const resolvedTicketCount = supportTickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;
  const supportTicketsFactor = scoreSupportTickets(
    openTicketCount,
    resolvedTicketCount,
    supportTickets.length,
  );

  // --- Composite ---
  const factors = {
    dashboardVisits,
    serviceUsage,
    leadResponseTime,
    featureAdoption,
    supportTickets: supportTicketsFactor,
  };

  const compositeScore =
    dashboardVisits.score +
    serviceUsage.score +
    leadResponseTime.score +
    featureAdoption.score +
    supportTicketsFactor.score;

  const score = Math.max(0, Math.min(100, compositeScore));
  const level = levelFromScore(score);
  const churnRisk = churnRiskFromScore(score);
  const recommendations = buildRecommendations(factors);

  return { score, level, factors, recommendations, churnRisk };
}
