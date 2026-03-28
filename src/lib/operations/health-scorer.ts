import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";
import { bundleToTier, getTier } from "@/lib/service-tiers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthScore {
  clientId: string;
  score: number;
  status: "healthy" | "monitor" | "at_risk" | "critical";
  breakdown: Record<string, number>;
}

type HealthStatus = HealthScore["status"];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAG = "[operations/health-scorer]";

const WEIGHTS = {
  // Delivery performance (40%)
  lead_delivery_vs_target: 15,
  lead_quality_trend: 10,
  pipeline_value: 10,
  outreach_deliverability: 5,

  // Client engagement (30%)
  dashboard_logins: 10,
  report_opens: 10,
  support_requests: 5,
  feedback_sentiment: 5,

  // Financial health (20%)
  payment_status: 10,
  plan_tenure: 5,
  overage_frequency: 5,
} as const;

const RISK_PENALTIES = {
  payment_failed_recently: -10,
  no_dashboard_login_14d: -8,
  support_complaint: -5,
  asked_about_cancellation: -15,
} as const;

const SCORE_DROP_ALERT_THRESHOLD = 15;
const DAYS_FOR_TREND_DEFAULT = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyStatus(score: number): HealthStatus {
  if (score > 80) return "healthy";
  if (score >= 60) return "monitor";
  if (score >= 40) return "at_risk";
  return "critical";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Ratio helper: returns a 0-1 fraction, safe when denominator is 0. */
function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return clamp(numerator / denominator, 0, 1);
}

// ---------------------------------------------------------------------------
// Individual metric calculators
// ---------------------------------------------------------------------------

async function calcLeadDeliveryVsTarget(clientId: string): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const leadCount = await prisma.lead.count({
    where: { clientId, createdAt: { gte: thirtyDaysAgo } },
  });

  // Determine target from tier (SERVICES.md) → service config → sensible default
  let target = 30; // fallback default

  // 1. Try tier-based contracted leads
  const sub = await prisma.subscription.findUnique({
    where: { clientId },
    select: { bundleId: true },
  });
  const tierId = bundleToTier(sub?.bundleId ?? null);
  if (tierId) {
    const tier = getTier(tierId);
    if (tier.contractedLeads > 0) {
      target = tier.contractedLeads;
    }
  }

  // 2. Override from client service config if explicitly set
  const services = await prisma.clientService.findMany({
    where: { clientId, status: "active" },
    select: { config: true },
  });
  for (const svc of services) {
    if (svc.config) {
      try {
        const cfg = JSON.parse(svc.config);
        if (cfg.monthlyLeadTarget && typeof cfg.monthlyLeadTarget === "number") {
          target = cfg.monthlyLeadTarget;
          break;
        }
      } catch {
        // ignore invalid config JSON
      }
    }
  }

  return Math.round(ratio(leadCount, target) * WEIGHTS.lead_delivery_vs_target);
}

async function calcLeadQualityTrend(clientId: string): Promise<number> {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [recentQualified, olderQualified, recentTotal, olderTotal] =
    await Promise.all([
      prisma.lead.count({
        where: {
          clientId,
          createdAt: { gte: fifteenDaysAgo },
          status: { in: ["qualified", "appointment", "won"] },
        },
      }),
      prisma.lead.count({
        where: {
          clientId,
          createdAt: { gte: thirtyDaysAgo, lt: fifteenDaysAgo },
          status: { in: ["qualified", "appointment", "won"] },
        },
      }),
      prisma.lead.count({
        where: { clientId, createdAt: { gte: fifteenDaysAgo } },
      }),
      prisma.lead.count({
        where: {
          clientId,
          createdAt: { gte: thirtyDaysAgo, lt: fifteenDaysAgo },
        },
      }),
    ]);

  const recentRate = ratio(recentQualified, recentTotal);
  const olderRate = ratio(olderQualified, olderTotal);

  // If no older data, give benefit of the doubt at 60% score
  if (olderTotal === 0) {
    return Math.round(0.6 * WEIGHTS.lead_quality_trend);
  }

  // Improving or stable trend = higher score
  const trendFactor = olderRate > 0 ? clamp(recentRate / olderRate, 0, 2) / 2 : 0.5;
  return Math.round(trendFactor * WEIGHTS.lead_quality_trend);
}

async function calcPipelineValue(clientId: string): Promise<number> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const wonLeads = await prisma.lead.findMany({
    where: {
      clientId,
      status: "won",
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { value: true },
  });

  const totalValue = wonLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);

  // Revenue events as secondary signal
  const revenueSum = await prisma.revenueEvent.aggregate({
    where: { clientId, createdAt: { gte: ninetyDaysAgo } },
    _sum: { amount: true },
  });

  const pipelineCents = totalValue + (revenueSum._sum.amount ?? 0);

  // Benchmark: $5000 (500000 cents) in 90 days is strong
  const pipelineRatio = ratio(pipelineCents, 500000);
  return Math.round(pipelineRatio * WEIGHTS.pipeline_value);
}

async function calcOutreachDeliverability(clientId: string): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Use EmailQueue as proxy for deliverability
  const [sent, bounced] = await Promise.all([
    prisma.emailQueue.count({
      where: { clientId, status: "sent", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.emailQueue.count({
      where: {
        clientId,
        status: { in: ["bounced", "failed"] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  if (sent + bounced === 0) {
    // No outreach data, neutral score
    return Math.round(0.7 * WEIGHTS.outreach_deliverability);
  }

  const deliveryRate = ratio(sent, sent + bounced);
  return Math.round(deliveryRate * WEIGHTS.outreach_deliverability);
}

async function calcDashboardLogins(clientId: string): Promise<number> {
  // Proxy: use Session recency for the client's account
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { accountId: true },
  });

  if (!client) return 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentSessions = await prisma.session.count({
    where: { accountId: client.accountId, createdAt: { gte: sevenDaysAgo } },
  });

  const monthlySessions = await prisma.session.count({
    where: { accountId: client.accountId, createdAt: { gte: thirtyDaysAgo } },
  });

  // 3+ sessions in 7 days = full marks; scale by monthly activity
  if (recentSessions >= 3) return WEIGHTS.dashboard_logins;
  if (monthlySessions >= 8) return Math.round(0.8 * WEIGHTS.dashboard_logins);
  if (monthlySessions >= 4) return Math.round(0.5 * WEIGHTS.dashboard_logins);
  if (monthlySessions >= 1) return Math.round(0.3 * WEIGHTS.dashboard_logins);
  return 0;
}

async function calcReportOpens(clientId: string): Promise<number> {
  // Proxy: use EmailEvent opens on campaigns linked to this client
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const campaigns = await prisma.emailCampaign.findMany({
    where: { clientId, sentAt: { gte: thirtyDaysAgo } },
    select: { id: true, opens: true, recipients: true },
  });

  if (campaigns.length === 0) {
    return Math.round(0.5 * WEIGHTS.report_opens);
  }

  const totalOpens = campaigns.reduce((s, c) => s + c.opens, 0);
  const totalRecipients = campaigns.reduce((s, c) => s + c.recipients, 0);

  const openRate = ratio(totalOpens, totalRecipients);
  return Math.round(clamp(openRate * 2, 0, 1) * WEIGHTS.report_opens);
}

async function calcSupportRequests(clientId: string): Promise<number> {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const ticketCount = await prisma.supportTicket.count({
    where: { clientId, createdAt: { gte: sixtyDaysAgo } },
  });

  // Some support interaction is a positive engagement signal
  if (ticketCount >= 1 && ticketCount <= 3) return WEIGHTS.support_requests;
  if (ticketCount > 3) return Math.round(0.6 * WEIGHTS.support_requests);
  return Math.round(0.3 * WEIGHTS.support_requests); // no interaction = less engaged
}

async function calcFeedbackSentiment(clientId: string): Promise<number> {
  // Use NPS responses as feedback proxy
  const nps = await prisma.nPSResponse.findMany({
    where: { clientId, respondedAt: { not: null } },
    orderBy: { sentAt: "desc" },
    take: 3,
    select: { score: true },
  });

  if (nps.length === 0) {
    return Math.round(0.5 * WEIGHTS.feedback_sentiment);
  }

  const avgScore = nps.reduce((s, n) => s + n.score, 0) / nps.length;
  // NPS is 1-10; 7+ is promoter territory
  const sentimentRatio = clamp((avgScore - 1) / 9, 0, 1);
  return Math.round(sentimentRatio * WEIGHTS.feedback_sentiment);
}

async function calcPaymentStatus(clientId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where: { clientId },
    select: { status: true, currentPeriodEnd: true },
  });

  if (!sub) return 0;

  if (sub.status === "active") {
    return WEIGHTS.payment_status;
  }
  if (sub.status === "past_due") {
    return Math.round(0.3 * WEIGHTS.payment_status);
  }
  // canceled / expired
  return 0;
}

async function calcPlanTenure(clientId: string): Promise<number> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { createdAt: true },
  });

  if (!client) return 0;

  const monthsActive =
    (Date.now() - client.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000);

  // 12+ months = full score, scale linearly
  return Math.round(clamp(monthsActive / 12, 0, 1) * WEIGHTS.plan_tenure);
}

async function calcOverageFrequency(clientId: string): Promise<number> {
  // Proxy: performance events indicate billable activity beyond base plan
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const perfEventCount = await prisma.performanceEvent.count({
    where: { clientId, createdAt: { gte: ninetyDaysAgo } },
  });

  // Having performance events suggests the client is exceeding base usage
  if (perfEventCount >= 10) return WEIGHTS.overage_frequency;
  if (perfEventCount >= 3) return Math.round(0.6 * WEIGHTS.overage_frequency);
  return Math.round(0.2 * WEIGHTS.overage_frequency);
}

// ---------------------------------------------------------------------------
// Risk signal calculators (negative scoring)
// ---------------------------------------------------------------------------

async function calcPaymentFailedRecently(clientId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where: { clientId },
    select: { status: true },
  });

  return sub?.status === "past_due" ? RISK_PENALTIES.payment_failed_recently : 0;
}

async function calcNoDashboardLogin14d(clientId: string): Promise<number> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { accountId: true },
  });

  if (!client) return RISK_PENALTIES.no_dashboard_login_14d;

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const recentSession = await prisma.session.findFirst({
    where: { accountId: client.accountId, createdAt: { gte: fourteenDaysAgo } },
    select: { id: true },
  });

  return recentSession ? 0 : RISK_PENALTIES.no_dashboard_login_14d;
}

async function calcSupportComplaint(clientId: string): Promise<number> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const highPriorityTicket = await prisma.supportTicket.findFirst({
    where: {
      clientId,
      priority: "high",
      createdAt: { gte: fourteenDaysAgo },
    },
    select: { id: true },
  });

  return highPriorityTicket ? RISK_PENALTIES.support_complaint : 0;
}

async function calcAskedAboutCancellation(clientId: string): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Check support tickets for cancellation-related keywords
  const tickets = await prisma.supportTicket.findMany({
    where: { clientId, createdAt: { gte: thirtyDaysAgo } },
    select: { subject: true, description: true },
  });

  const cancelKeywords = ["cancel", "cancellation", "downgrade", "stop service", "end subscription"];
  const hasCancelSignal = tickets.some((t) => {
    const text = `${t.subject} ${t.description}`.toLowerCase();
    return cancelKeywords.some((kw) => text.includes(kw));
  });

  return hasCancelSignal ? RISK_PENALTIES.asked_about_cancellation : 0;
}

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

export async function calculateClientHealth(
  clientId: string,
): Promise<HealthScore> {
  // Calculate all positive metrics in parallel
  const [
    leadDelivery,
    leadQuality,
    pipeline,
    deliverability,
    dashboardLogins,
    reportOpens,
    supportRequests,
    feedbackSentiment,
    paymentStatus,
    planTenure,
    overageFrequency,
  ] = await Promise.all([
    calcLeadDeliveryVsTarget(clientId),
    calcLeadQualityTrend(clientId),
    calcPipelineValue(clientId),
    calcOutreachDeliverability(clientId),
    calcDashboardLogins(clientId),
    calcReportOpens(clientId),
    calcSupportRequests(clientId),
    calcFeedbackSentiment(clientId),
    calcPaymentStatus(clientId),
    calcPlanTenure(clientId),
    calcOverageFrequency(clientId),
  ]);

  // Calculate risk signals in parallel
  const [paymentFailed, noLogin14d, complaint, cancelSignal] =
    await Promise.all([
      calcPaymentFailedRecently(clientId),
      calcNoDashboardLogin14d(clientId),
      calcSupportComplaint(clientId),
      calcAskedAboutCancellation(clientId),
    ]);

  const breakdown: Record<string, number> = {
    lead_delivery_vs_target: leadDelivery,
    lead_quality_trend: leadQuality,
    pipeline_value: pipeline,
    outreach_deliverability: deliverability,
    dashboard_logins: dashboardLogins,
    report_opens: reportOpens,
    support_requests: supportRequests,
    feedback_sentiment: feedbackSentiment,
    payment_status: paymentStatus,
    plan_tenure: planTenure,
    overage_frequency: overageFrequency,
    payment_failed_recently: paymentFailed,
    no_dashboard_login_14d: noLogin14d,
    support_complaint: complaint,
    asked_about_cancellation: cancelSignal,
  };

  const rawScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const score = clamp(Math.round(rawScore), 0, 100);
  const status = classifyStatus(score);

  return { clientId, score, status, breakdown };
}

// ---------------------------------------------------------------------------
// Batch runner
// ---------------------------------------------------------------------------

export async function runHealthScoreForAllClients(): Promise<{
  processed: number;
  critical: number;
  atRisk: number;
}> {
  logger.info(`${TAG} Starting daily health score calculation`);

  const clients = await prisma.client.findMany({
    where: { subscription: { status: "active" } },
    select: { id: true, businessName: true },
  });

  let processed = 0;
  let critical = 0;
  let atRisk = 0;

  for (const client of clients) {
    try {
      const healthScore = await calculateClientHealth(client.id);

      // Store the score for trend analysis
      await prisma.activityEvent.create({
        data: {
          clientId: client.id,
          type: "health_score",
          title: `Health Score: ${healthScore.score}`,
          description: `Status: ${healthScore.status}`,
          metadata: JSON.stringify({
            score: healthScore.score,
            status: healthScore.status,
            breakdown: healthScore.breakdown,
            calculatedAt: new Date().toISOString(),
          }),
        },
      });

      // Check for weekly score drop
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const previousScoreEvent = await prisma.activityEvent.findFirst({
        where: {
          clientId: client.id,
          type: "health_score",
          createdAt: { lte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
        select: { metadata: true },
      });

      let scoreDrop = 0;
      if (previousScoreEvent?.metadata) {
        try {
          const prev = JSON.parse(previousScoreEvent.metadata);
          if (typeof prev.score === "number") {
            scoreDrop = prev.score - healthScore.score;
          }
        } catch {
          // ignore invalid JSON
        }
      }

      // Handle status-based actions
      if (healthScore.status === "critical") {
        critical++;
        await sendTelegramAlert(
          "critical",
          "Client Health Critical",
          `Client "${client.businessName}" (${client.id}) health score dropped to ${healthScore.score}/100.\n\nStatus: ${healthScore.status}\nTop issues: ${formatTopIssues(healthScore.breakdown)}`,
        );
      } else if (healthScore.status === "at_risk") {
        atRisk++;
      }

      // Score drop alert regardless of current status
      if (scoreDrop >= SCORE_DROP_ALERT_THRESHOLD) {
        await sendTelegramAlert(
          "warning",
          "Rapid Health Score Decline",
          `Client "${client.businessName}" (${client.id}) score dropped ${scoreDrop} points in the past week (now ${healthScore.score}/100).\n\nThis exceeds the ${SCORE_DROP_ALERT_THRESHOLD}-point threshold.`,
        );
      }

      processed++;
    } catch (err) {
      logger.errorWithCause(`${TAG} Failed to calculate health for client`, err, {
        clientId: client.id,
      });
    }
  }

  logger.info(`${TAG} Done: ${processed} processed, ${critical} critical, ${atRisk} at-risk`);

  return { processed, critical, atRisk };
}

// ---------------------------------------------------------------------------
// Trend retrieval
// ---------------------------------------------------------------------------

export async function getHealthTrend(
  clientId: string,
  days: number = DAYS_FOR_TREND_DEFAULT,
): Promise<HealthScore[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.activityEvent.findMany({
    where: {
      clientId,
      type: "health_score",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
    select: { metadata: true },
  });

  const scores: HealthScore[] = [];

  for (const event of events) {
    if (!event.metadata) continue;
    try {
      const data = JSON.parse(event.metadata);
      if (typeof data.score === "number" && data.breakdown) {
        scores.push({
          clientId,
          score: data.score,
          status: classifyStatus(data.score),
          breakdown: data.breakdown,
        });
      }
    } catch {
      // skip malformed entries
    }
  }

  return scores;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatTopIssues(breakdown: Record<string, number>): string {
  return Object.entries(breakdown)
    .filter(([, v]) => v <= 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ") || "No negative signals";
}
