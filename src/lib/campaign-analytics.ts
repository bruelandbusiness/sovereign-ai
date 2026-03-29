export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

/**
 * Calculate campaign metrics from raw counts.
 * Rates are expressed as decimals (e.g. 0.22 = 22%).
 */
export function calculateCampaignMetrics(raw: {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
}): CampaignMetrics {
  const { sent, delivered, opened, clicked, replied, bounced, unsubscribed } =
    raw;

  return {
    sent,
    delivered,
    opened,
    clicked,
    replied,
    bounced,
    unsubscribed,
    deliveryRate: sent > 0 ? delivered / sent : 0,
    openRate: delivered > 0 ? opened / delivered : 0,
    clickRate: opened > 0 ? clicked / opened : 0,
    replyRate: delivered > 0 ? replied / delivered : 0,
    bounceRate: sent > 0 ? bounced / sent : 0,
    unsubscribeRate: delivered > 0 ? unsubscribed / delivered : 0,
  };
}

// ---------------------------------------------------------------------------
// Industry benchmarks for home-service verticals
// ---------------------------------------------------------------------------

const EMAIL_BENCHMARKS = {
  openRate: 0.225, // 22.5% — home services average
  clickRate: 0.032, // 3.2% of opens
  replyRate: 0.008, // 0.8% of delivered
  bounceRate: 0.02, // 2% of sent
  unsubscribeRate: 0.004, // 0.4% of delivered
} as const;

const SMS_BENCHMARKS = {
  openRate: 0.97, // 97% — SMS near-universal open
  clickRate: 0.19, // 19% of opens
  replyRate: 0.12, // 12% of delivered
  bounceRate: 0.03, // 3% of sent (invalid numbers)
  unsubscribeRate: 0.005, // 0.5% of delivered
} as const;

/**
 * Get industry benchmarks for home service email/SMS campaigns.
 */
export function getIndustryBenchmarks(type: "email" | "sms"): {
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  unsubscribeRate: number;
} {
  return type === "email" ? { ...EMAIL_BENCHMARKS } : { ...SMS_BENCHMARKS };
}

// ---------------------------------------------------------------------------
// Campaign grading
// ---------------------------------------------------------------------------

type Grade = "A" | "B" | "C" | "D" | "F";

function letterGrade(ratio: number, higherIsBetter: boolean): Grade {
  // ratio = actual / benchmark
  // For "higher is better" metrics (open, click, reply):
  //   >=1.2x benchmark → A, >=1.0 → B, >=0.75 → C, >=0.5 → D, else F
  // For "lower is better" metrics (bounce, unsubscribe):
  //   <=0.5x benchmark → A, <=0.8 → B, <=1.0 → C, <=1.3 → D, else F
  if (higherIsBetter) {
    if (ratio >= 1.2) return "A";
    if (ratio >= 1.0) return "B";
    if (ratio >= 0.75) return "C";
    if (ratio >= 0.5) return "D";
    return "F";
  }
  // lower is better
  if (ratio <= 0.5) return "A";
  if (ratio <= 0.8) return "B";
  if (ratio <= 1.0) return "C";
  if (ratio <= 1.3) return "D";
  return "F";
}

const GRADE_ORDER: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
const ORDER_GRADE: Grade[] = ["F", "D", "C", "B", "A"];

/**
 * Grade a campaign's performance against industry benchmarks.
 */
export function gradeCampaign(
  metrics: CampaignMetrics,
  type: "email" | "sms",
): {
  overall: Grade;
  details: Record<string, { value: number; benchmark: number; grade: string }>;
} {
  const benchmarks = getIndustryBenchmarks(type);

  const entries: [string, { value: number; benchmark: number; higherIsBetter: boolean }][] = [
    ["openRate", { value: metrics.openRate, benchmark: benchmarks.openRate, higherIsBetter: true }],
    ["clickRate", { value: metrics.clickRate, benchmark: benchmarks.clickRate, higherIsBetter: true }],
    ["replyRate", { value: metrics.replyRate, benchmark: benchmarks.replyRate, higherIsBetter: true }],
    ["bounceRate", { value: metrics.bounceRate, benchmark: benchmarks.bounceRate, higherIsBetter: false }],
    ["unsubscribeRate", { value: metrics.unsubscribeRate, benchmark: benchmarks.unsubscribeRate, higherIsBetter: false }],
  ];

  const details: Record<string, { value: number; benchmark: number; grade: string }> = {};
  let gradeSum = 0;

  for (const [key, { value, benchmark, higherIsBetter }] of entries) {
    const ratio = benchmark > 0 ? value / benchmark : 0;
    const grade = letterGrade(ratio, higherIsBetter);
    details[key] = { value, benchmark, grade };
    gradeSum += GRADE_ORDER[grade];
  }

  const avgIndex = Math.round(gradeSum / entries.length);
  const overall = ORDER_GRADE[Math.min(avgIndex, ORDER_GRADE.length - 1)];

  return { overall, details };
}
