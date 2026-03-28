/**
 * Digest Generator
 *
 * Formats operational metrics into scannable Telegram messages for Seth's
 * daily operating rhythm. All formatters return plain strings with Telegram
 * MarkdownV2-compatible formatting and emoji severity indicators.
 *
 * Timing:
 *   - Morning brief:  8 AM AZ time
 *   - Daily digest:   6 PM AZ time
 *   - Weekly digest:  Monday morning
 *   - Monthly report: 1st of each month
 */

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

export interface DailyDigestData {
  mrr: number;
  leadsDiscovered: number;
  outreachSent: number;
  repliesReceived: number;
  appointmentsBooked: number;
  revenueEvents: { count: number; total: number };
  apiCostToday: number;
  errorsRequiringAttention: number;
  pendingApprovals: number;
  criticalAlerts: string[];
}

export interface WeeklyDigestData {
  mrrChange: number;
  mrrChangePercent: number;
  leadsDeliveredPerClient: Array<{
    clientName: string;
    delivered: number;
    target: number;
    percentage: number;
  }>;
  avgLeadScore: number;
  responseRateByChannel: { email: number; sms: number; voice: number };
  clientHealthSummary: { green: number; yellow: number; red: number };
  prospectPipeline: {
    newProspects: number;
    contacted: number;
    callsScheduled: number;
  };
  totalApiSpend: number;
  churnRisk: Array<{
    clientName: string;
    healthScore: number;
    trend: "declining" | "stable";
  }>;
}

export interface MonthlyReportData {
  mrr: number;
  mrrGrowthRate: number;
  projectedAnnualRevenue: number;
  totalClients: number;
  newClients: number;
  churnedClients: number;
  netRevenueRetention: number;
  avgClientLifetimeMonths: number;
  avgRevenuePerClient: number;
  costPerClient: number;
  grossMarginPercent: number;
  leadsDeliveredVsContracted: number;
  topClient: { name: string; roi: number };
  worstClient: { name: string; roi: number };
  acquisitionMetrics: {
    prospects: number;
    calls: number;
    signedClients: number;
    costPerAcquisition: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a dollar amount with commas and two decimals. */
function usd(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format a percentage with one decimal place. */
function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Pick a trend arrow based on sign. */
function trendIcon(value: number): string {
  if (value > 0) return "\u{1F4C8}"; // 📈
  if (value < 0) return "\u{1F4C9}"; // 📉
  return "\u{27A1}\u{FE0F}"; // ➡️
}

/** Severity dot based on count: 0 = green, 1-2 = yellow, 3+ = red. */
function severityDot(count: number): string {
  if (count === 0) return "\u{1F7E2}"; // 🟢
  if (count <= 2) return "\u{1F7E1}"; // 🟡
  return "\u{1F534}"; // 🔴
}

/** Status dot from explicit status string. */
function statusDot(status: "green" | "yellow" | "red"): string {
  switch (status) {
    case "green":
      return "\u{1F7E2}";
    case "yellow":
      return "\u{1F7E1}";
    case "red":
      return "\u{1F534}";
  }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/**
 * Format the 6 PM daily digest for Telegram.
 *
 * Designed to be scanned in 10-15 minutes. Critical alerts surface first,
 * then KPIs, then operational counts.
 *
 * @param data - Aggregated daily metrics
 * @returns Telegram-ready message string
 */
export function formatDailyDigest(data: DailyDigestData): string {
  const lines: string[] = [];

  lines.push("\u{1F4CA} DAILY DIGEST");
  lines.push("");

  // Critical alerts block — always first
  if (data.criticalAlerts.length > 0) {
    lines.push("\u{1F534} CRITICAL ALERTS");
    for (const alert of data.criticalAlerts) {
      lines.push(`  \u{26A0}\u{FE0F} ${alert}`);
    }
    lines.push("");
  }

  // Revenue
  lines.push("\u{1F4B0} Revenue");
  lines.push(`  MRR: ${usd(data.mrr)}`);
  if (data.revenueEvents.count > 0) {
    lines.push(
      `  Payments today: ${data.revenueEvents.count} (${usd(data.revenueEvents.total)})`,
    );
  } else {
    lines.push("  Payments today: none");
  }
  lines.push("");

  // Pipeline activity
  lines.push("\u{1F4E3} Pipeline");
  lines.push(`  Leads discovered: ${data.leadsDiscovered}`);
  lines.push(`  Outreach sent: ${data.outreachSent}`);
  lines.push(`  Replies received: ${data.repliesReceived}`);
  lines.push(`  Appointments booked: ${data.appointmentsBooked}`);
  lines.push("");

  // Operations
  lines.push("\u{2699}\u{FE0F} Operations");
  lines.push(`  API cost today: ${usd(data.apiCostToday)}`);
  lines.push(
    `  ${severityDot(data.errorsRequiringAttention)} Errors needing attention: ${data.errorsRequiringAttention}`,
  );
  lines.push(`  Pending approvals: ${data.pendingApprovals}`);

  return lines.join("\n");
}

/**
 * Format the Monday morning weekly digest for Telegram.
 *
 * More detailed than the daily — includes per-client delivery tables,
 * pipeline summary, and churn risks.
 *
 * @param data - Aggregated weekly metrics
 * @returns Telegram-ready message string
 */
export function formatWeeklyDigest(data: WeeklyDigestData): string {
  const lines: string[] = [];

  lines.push("\u{1F4CA} WEEKLY DIGEST");
  lines.push("");

  // MRR change
  const mrrIcon = trendIcon(data.mrrChange);
  lines.push(
    `${mrrIcon} MRR Change: ${data.mrrChange >= 0 ? "+" : ""}${usd(data.mrrChange)} (${data.mrrChangePercent >= 0 ? "+" : ""}${pct(data.mrrChangePercent)})`,
  );
  lines.push("");

  // Per-client delivery table
  lines.push("\u{1F4E6} Lead Delivery by Client");
  for (const c of data.leadsDeliveredPerClient) {
    const dot =
      c.percentage >= 90
        ? "\u{1F7E2}"
        : c.percentage >= 70
          ? "\u{1F7E1}"
          : "\u{1F534}";
    lines.push(
      `  ${dot} ${c.clientName}: ${c.delivered}/${c.target} (${pct(c.percentage)})`,
    );
  }
  lines.push(`  Avg lead score: ${data.avgLeadScore.toFixed(1)}`);
  lines.push("");

  // Response rates
  lines.push("\u{1F4EC} Response Rates");
  lines.push(`  Email: ${pct(data.responseRateByChannel.email)}`);
  lines.push(`  SMS: ${pct(data.responseRateByChannel.sms)}`);
  lines.push(`  Voice: ${pct(data.responseRateByChannel.voice)}`);
  lines.push("");

  // Client health
  const h = data.clientHealthSummary;
  lines.push("\u{1F3E5} Client Health");
  lines.push(
    `  \u{1F7E2} ${h.green}  \u{1F7E1} ${h.yellow}  \u{1F534} ${h.red}`,
  );
  lines.push("");

  // Prospect pipeline
  const pp = data.prospectPipeline;
  lines.push("\u{1F50D} Prospect Pipeline");
  lines.push(`  New prospects: ${pp.newProspects}`);
  lines.push(`  Contacted: ${pp.contacted}`);
  lines.push(`  Calls scheduled: ${pp.callsScheduled}`);
  lines.push("");

  // Costs
  lines.push(`\u{1F4B8} API Spend: ${usd(data.totalApiSpend)}`);
  lines.push("");

  // Churn risk
  if (data.churnRisk.length > 0) {
    lines.push("\u{26A0}\u{FE0F} Churn Risk");
    for (const r of data.churnRisk) {
      const dot = r.healthScore < 40 ? "\u{1F534}" : "\u{1F7E1}";
      lines.push(
        `  ${dot} ${r.clientName}: score ${r.healthScore} (${r.trend})`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Format the monthly report for Telegram.
 *
 * Comprehensive but still scannable — uses clear section headers.
 *
 * @param data - Aggregated monthly metrics
 * @returns Telegram-ready message string
 */
export function formatMonthlyReport(data: MonthlyReportData): string {
  const lines: string[] = [];

  lines.push("\u{1F4CA} MONTHLY REPORT");
  lines.push("");

  // Revenue overview
  lines.push("\u{1F4B0} Revenue");
  lines.push(`  MRR: ${usd(data.mrr)}`);
  lines.push(`  ${trendIcon(data.mrrGrowthRate)} Growth: ${pct(data.mrrGrowthRate)}`);
  lines.push(`  Projected ARR: ${usd(data.projectedAnnualRevenue)}`);
  lines.push(`  Net Revenue Retention: ${pct(data.netRevenueRetention)}`);
  lines.push("");

  // Client metrics
  lines.push("\u{1F465} Clients");
  lines.push(`  Total: ${data.totalClients}`);
  lines.push(`  New: +${data.newClients}`);
  lines.push(`  Churned: -${data.churnedClients}`);
  lines.push(`  Avg lifetime: ${data.avgClientLifetimeMonths.toFixed(1)} months`);
  lines.push(`  Avg revenue/client: ${usd(data.avgRevenuePerClient)}`);
  lines.push("");

  // Unit economics
  lines.push("\u{1F9EE} Unit Economics");
  lines.push(`  Cost/client: ${usd(data.costPerClient)}`);
  lines.push(`  Gross margin: ${pct(data.grossMarginPercent)}`);
  lines.push(`  Lead delivery vs contracted: ${pct(data.leadsDeliveredVsContracted)}`);
  lines.push("");

  // Top / bottom clients
  lines.push("\u{1F3C6} Client Highlights");
  lines.push(
    `  \u{1F7E2} Best: ${data.topClient.name} (${pct(data.topClient.roi)} ROI)`,
  );
  lines.push(
    `  \u{1F534} Needs attention: ${data.worstClient.name} (${pct(data.worstClient.roi)} ROI)`,
  );
  lines.push("");

  // Acquisition funnel
  const acq = data.acquisitionMetrics;
  lines.push("\u{1F50D} Acquisition");
  lines.push(`  Prospects: ${acq.prospects}`);
  lines.push(`  Calls: ${acq.calls}`);
  lines.push(`  Signed: ${acq.signedClients}`);
  lines.push(`  CPA: ${usd(acq.costPerAcquisition)}`);

  return lines.join("\n");
}

/**
 * Format the 8 AM morning brief for Telegram.
 *
 * Kept extremely short — critical alerts first, system status, then
 * a count of pending approvals.
 *
 * @param criticalAlerts  - List of alerts requiring immediate attention
 * @param pendingApprovals - Number of items awaiting Seth's approval
 * @param systemStatus     - Overall system health indicator
 * @returns Telegram-ready message string
 */
export function formatMorningBrief(
  criticalAlerts: string[],
  pendingApprovals: number,
  systemStatus: "green" | "yellow" | "red",
): string {
  const lines: string[] = [];

  lines.push("\u{2600}\u{FE0F} MORNING BRIEF");
  lines.push("");

  // Critical alerts — always first
  if (criticalAlerts.length > 0) {
    lines.push("\u{1F534} CRITICAL");
    for (const alert of criticalAlerts) {
      lines.push(`  \u{26A0}\u{FE0F} ${alert}`);
    }
  } else {
    lines.push("\u{1F7E2} No critical alerts");
  }
  lines.push("");

  // System status
  lines.push(`${statusDot(systemStatus)} System: ${systemStatus.toUpperCase()}`);
  lines.push("");

  // Pending approvals
  if (pendingApprovals > 0) {
    lines.push(`\u{1F4CB} ${pendingApprovals} pending approval${pendingApprovals === 1 ? "" : "s"}`);
  } else {
    lines.push("\u{2705} No pending approvals");
  }

  return lines.join("\n");
}

/**
 * Format the /costs command response for Telegram.
 *
 * Shows daily spend, weekly total, percentage of budget consumed,
 * and projected monthly total.
 *
 * @param daily       - Today's API spend in dollars
 * @param weeklyTotal - Total API spend this week in dollars
 * @param budgetLimit - Monthly API budget in dollars
 * @returns Telegram-ready message string
 */
export function formatCostsSummary(
  daily: number,
  weeklyTotal: number,
  budgetLimit: number,
): string {
  const projectedMonthly = daily * 30;
  const percentOfBudget =
    budgetLimit === 0 ? 0 : (weeklyTotal / budgetLimit) * 100;
  const projectedPercent =
    budgetLimit === 0 ? 0 : (projectedMonthly / budgetLimit) * 100;

  const budgetIcon =
    projectedPercent > 100
      ? "\u{1F534}"
      : projectedPercent > 80
        ? "\u{1F7E1}"
        : "\u{1F7E2}";

  const lines: string[] = [];

  lines.push("\u{1F4B8} API COSTS");
  lines.push("");
  lines.push(`  Today: ${usd(daily)}`);
  lines.push(`  This week: ${usd(weeklyTotal)}`);
  lines.push(`  Budget used: ${pct(percentOfBudget)}`);
  lines.push("");
  lines.push(
    `${budgetIcon} Projected monthly: ${usd(projectedMonthly)} / ${usd(budgetLimit)} (${pct(projectedPercent)})`,
  );

  return lines.join("\n");
}
