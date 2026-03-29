/**
 * Payment reconciliation utility for matching Stripe payments against
 * internal records, detecting anomalies, and generating revenue reports.
 * Pure utility module — no API calls, no side effects.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type PlanTier = "free" | "starter" | "pro" | "enterprise";

export type PaymentStatus =
  | "succeeded"
  | "failed"
  | "pending"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type DiscrepancyType =
  | "amount_mismatch"
  | "status_mismatch"
  | "missing_internal"
  | "missing_stripe"
  | "duplicate_charge"
  | "date_mismatch"
  | "currency_mismatch";

export type AnomalyType =
  | "double_charge"
  | "refund_without_reason"
  | "large_amount"
  | "rapid_succession"
  | "unusual_currency"
  | "suspicious_refund_rate";

export type ActionItemPriority = "critical" | "high" | "medium" | "low";

export interface PaymentRecord {
  readonly id: string;
  readonly stripePaymentId: string;
  readonly customerId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly planTier: PlanTier;
  readonly createdAt: Date;
  readonly description?: string;
  readonly refundReason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface StripePayment {
  readonly id: string;
  readonly customerId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly created: Date;
  readonly description?: string;
  readonly refundReason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface Discrepancy {
  readonly type: DiscrepancyType;
  readonly stripePaymentId: string;
  readonly internalRecordId?: string;
  readonly expected: string;
  readonly actual: string;
  readonly severity: ActionItemPriority;
  readonly detectedAt: Date;
}

export interface Anomaly {
  readonly type: AnomalyType;
  readonly paymentIds: readonly string[];
  readonly description: string;
  readonly severity: ActionItemPriority;
  readonly detectedAt: Date;
}

export interface ActionItem {
  readonly id: string;
  readonly priority: ActionItemPriority;
  readonly description: string;
  readonly relatedDiscrepancies: readonly string[];
  readonly suggestedAction: string;
}

export interface RevenueSummary {
  readonly totalRevenue: number;
  readonly currency: string;
  readonly byPlanTier: Readonly<Record<PlanTier, number>>;
  readonly byMonth: Readonly<Record<string, number>>;
  readonly transactionCount: number;
  readonly averageTransactionAmount: number;
}

export interface ChurnRevenueSummary {
  readonly totalLostRevenue: number;
  readonly currency: string;
  readonly cancellationCount: number;
  readonly byPlanTier: Readonly<Record<PlanTier, number>>;
  readonly averageLostAmount: number;
}

export interface RevenueProjection {
  readonly projectedRevenue: number;
  readonly currency: string;
  readonly activeSubscriptionCount: number;
  readonly byPlanTier: Readonly<Record<PlanTier, number>>;
  readonly confidence: number;
  readonly basedOnMonths: number;
}

export interface ReconciliationResult {
  readonly matched: readonly MatchedPayment[];
  readonly discrepancies: readonly Discrepancy[];
  readonly unmatchedStripe: readonly StripePayment[];
  readonly unmatchedInternal: readonly PaymentRecord[];
}

export interface MatchedPayment {
  readonly stripePayment: StripePayment;
  readonly internalRecord: PaymentRecord;
  readonly isExactMatch: boolean;
}

export interface ReconciliationReport {
  readonly generatedAt: Date;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly reconciliation: ReconciliationResult;
  readonly anomalies: readonly Anomaly[];
  readonly revenueSummary: RevenueSummary;
  readonly actionItems: readonly ActionItem[];
  readonly summary: ReportSummary;
}

export interface ReportSummary {
  readonly totalStripePayments: number;
  readonly totalInternalRecords: number;
  readonly matchedCount: number;
  readonly discrepancyCount: number;
  readonly anomalyCount: number;
  readonly matchRate: number;
}

export interface CancelledSubscription {
  readonly customerId: string;
  readonly planTier: PlanTier;
  readonly monthlyAmount: number;
  readonly currency: string;
  readonly cancelledAt: Date;
  readonly reason?: string;
}

export interface ActiveSubscription {
  readonly customerId: string;
  readonly planTier: PlanTier;
  readonly monthlyAmount: number;
  readonly currency: string;
  readonly startedAt: Date;
}

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                    */
/* ------------------------------------------------------------------ */

function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function emptyTierRecord(): Record<PlanTier, number> {
  return { free: 0, starter: 0, pro: 0, enterprise: 0 };
}

function generateId(prefix: string, index: number): string {
  return `${prefix}_${Date.now()}_${index}`;
}

function isWithinDateRange(
  date: Date,
  start: Date,
  end: Date,
): boolean {
  return date >= start && date <= end;
}

function severityForAmountDifference(
  expected: number,
  actual: number,
): ActionItemPriority {
  const diff = Math.abs(expected - actual);
  const pct = expected > 0 ? diff / expected : 1;
  if (pct > 0.5) return "critical";
  if (pct > 0.2) return "high";
  if (pct > 0.05) return "medium";
  return "low";
}

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Match Stripe payments against internal records and identify mismatches.
 * Matching uses the stripePaymentId field on internal records.
 */
export function reconcilePayments(
  stripePayments: readonly StripePayment[],
  internalRecords: readonly PaymentRecord[],
): ReconciliationResult {
  const internalByStripeId = new Map<string, PaymentRecord>();
  for (const record of internalRecords) {
    internalByStripeId.set(record.stripePaymentId, record);
  }

  const matched: MatchedPayment[] = [];
  const discrepancies: Discrepancy[] = [];
  const unmatchedStripe: StripePayment[] = [];
  const matchedStripeIds = new Set<string>();

  for (const sp of stripePayments) {
    const internal = internalByStripeId.get(sp.id);

    if (!internal) {
      unmatchedStripe.push(sp);
      discrepancies.push({
        type: "missing_internal",
        stripePaymentId: sp.id,
        expected: "Internal record exists",
        actual: "No matching internal record",
        severity: "high",
        detectedAt: new Date(),
      });
      continue;
    }

    matchedStripeIds.add(sp.id);
    const paymentDiscrepancies = comparePayments(sp, internal);
    discrepancies.push(...paymentDiscrepancies);

    matched.push({
      stripePayment: sp,
      internalRecord: internal,
      isExactMatch: paymentDiscrepancies.length === 0,
    });
  }

  const unmatchedInternal = internalRecords.filter(
    (r) => !matchedStripeIds.has(r.stripePaymentId),
  );

  for (const orphan of unmatchedInternal) {
    discrepancies.push({
      type: "missing_stripe",
      stripePaymentId: orphan.stripePaymentId,
      internalRecordId: orphan.id,
      expected: "Stripe payment exists",
      actual: "No matching Stripe payment",
      severity: "critical",
      detectedAt: new Date(),
    });
  }

  return { matched, discrepancies, unmatchedStripe, unmatchedInternal };
}

function comparePayments(
  stripe: StripePayment,
  internal: PaymentRecord,
): Discrepancy[] {
  const issues: Discrepancy[] = [];
  const now = new Date();

  if (stripe.amount !== internal.amount) {
    issues.push({
      type: "amount_mismatch",
      stripePaymentId: stripe.id,
      internalRecordId: internal.id,
      expected: String(stripe.amount),
      actual: String(internal.amount),
      severity: severityForAmountDifference(stripe.amount, internal.amount),
      detectedAt: now,
    });
  }

  if (stripe.status !== internal.status) {
    issues.push({
      type: "status_mismatch",
      stripePaymentId: stripe.id,
      internalRecordId: internal.id,
      expected: stripe.status,
      actual: internal.status,
      severity: "high",
      detectedAt: now,
    });
  }

  if (stripe.currency !== internal.currency) {
    issues.push({
      type: "currency_mismatch",
      stripePaymentId: stripe.id,
      internalRecordId: internal.id,
      expected: stripe.currency,
      actual: internal.currency,
      severity: "critical",
      detectedAt: now,
    });
  }

  const timeDiffMs = Math.abs(
    stripe.created.getTime() - internal.createdAt.getTime(),
  );
  const ONE_HOUR_MS = 3_600_000;
  if (timeDiffMs > ONE_HOUR_MS) {
    issues.push({
      type: "date_mismatch",
      stripePaymentId: stripe.id,
      internalRecordId: internal.id,
      expected: stripe.created.toISOString(),
      actual: internal.createdAt.toISOString(),
      severity: "medium",
      detectedAt: now,
    });
  }

  return issues;
}

/**
 * Find payments present in Stripe but missing from internal records.
 */
export function findMissingPayments(
  stripePayments: readonly StripePayment[],
  internalRecords: readonly PaymentRecord[],
): readonly StripePayment[] {
  const knownStripeIds = new Set(
    internalRecords.map((r) => r.stripePaymentId),
  );
  return stripePayments.filter((sp) => !knownStripeIds.has(sp.id));
}

/**
 * Find internal records with no matching Stripe payment.
 */
export function findOrphanedRecords(
  stripePayments: readonly StripePayment[],
  internalRecords: readonly PaymentRecord[],
): readonly PaymentRecord[] {
  const stripeIds = new Set(stripePayments.map((sp) => sp.id));
  return internalRecords.filter((r) => !stripeIds.has(r.stripePaymentId));
}

/* ------------------------------------------------------------------ */
/*  Revenue Analysis                                                   */
/* ------------------------------------------------------------------ */

/**
 * Calculate total revenue, broken down by plan tier and by month.
 * Only counts succeeded payments.
 */
export function calculateRevenueSummary(
  payments: readonly PaymentRecord[],
  currency: string = "usd",
): RevenueSummary {
  const succeeded = payments.filter(
    (p) => p.status === "succeeded" && p.currency === currency,
  );

  const byPlanTier = emptyTierRecord();
  const byMonth: Record<string, number> = {};

  for (const payment of succeeded) {
    byPlanTier[payment.planTier] += payment.amount;
    const month = formatMonth(payment.createdAt);
    byMonth[month] = (byMonth[month] ?? 0) + payment.amount;
  }

  const totalRevenue = succeeded.reduce((sum, p) => sum + p.amount, 0);
  const transactionCount = succeeded.length;

  return {
    totalRevenue,
    currency,
    byPlanTier,
    byMonth,
    transactionCount,
    averageTransactionAmount:
      transactionCount > 0 ? totalRevenue / transactionCount : 0,
  };
}

/**
 * Calculate revenue lost from subscription cancellations within a period.
 */
export function calculateChurnRevenue(
  cancellations: readonly CancelledSubscription[],
  periodStart: Date,
  periodEnd: Date,
  currency: string = "usd",
): ChurnRevenueSummary {
  const inPeriod = cancellations.filter(
    (c) =>
      c.currency === currency &&
      isWithinDateRange(c.cancelledAt, periodStart, periodEnd),
  );

  const byPlanTier = emptyTierRecord();
  for (const cancellation of inPeriod) {
    byPlanTier[cancellation.planTier] += cancellation.monthlyAmount;
  }

  const totalLostRevenue = inPeriod.reduce(
    (sum, c) => sum + c.monthlyAmount,
    0,
  );

  return {
    totalLostRevenue,
    currency,
    cancellationCount: inPeriod.length,
    byPlanTier,
    averageLostAmount:
      inPeriod.length > 0 ? totalLostRevenue / inPeriod.length : 0,
  };
}

/**
 * Project next month's revenue based on current active subscriptions
 * and recent historical trends.
 */
export function projectRevenue(
  activeSubscriptions: readonly ActiveSubscription[],
  historicalPayments: readonly PaymentRecord[],
  currency: string = "usd",
): RevenueProjection {
  const filteredSubs = activeSubscriptions.filter(
    (s) => s.currency === currency,
  );
  const byPlanTier = emptyTierRecord();

  for (const sub of filteredSubs) {
    byPlanTier[sub.planTier] += sub.monthlyAmount;
  }

  const projectedRevenue = filteredSubs.reduce(
    (sum, s) => sum + s.monthlyAmount,
    0,
  );

  // Calculate confidence from historical consistency
  const succeededHistorical = historicalPayments.filter(
    (p) => p.status === "succeeded" && p.currency === currency,
  );

  const monthlyTotals = new Map<string, number>();
  for (const p of succeededHistorical) {
    const month = formatMonth(p.createdAt);
    monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + p.amount);
  }

  const monthValues = Array.from(monthlyTotals.values());
  const basedOnMonths = monthValues.length;

  let confidence = 0.5; // baseline
  if (basedOnMonths >= 3) {
    const mean =
      monthValues.reduce((a, b) => a + b, 0) / basedOnMonths;
    const variance =
      monthValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      basedOnMonths;
    const coeffOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
    // Lower variance => higher confidence, capped at 0.95
    confidence = Math.min(0.95, Math.max(0.3, 1 - coeffOfVariation));
  }

  return {
    projectedRevenue,
    currency,
    activeSubscriptionCount: filteredSubs.length,
    byPlanTier,
    confidence: Math.round(confidence * 100) / 100,
    basedOnMonths,
  };
}

/* ------------------------------------------------------------------ */
/*  Anomaly Detection                                                  */
/* ------------------------------------------------------------------ */

/** Default threshold for flagging a payment as unusually large. */
const LARGE_AMOUNT_THRESHOLD = 50_000; // in smallest currency unit
/** Window in ms for detecting rapid-succession charges. */
const RAPID_SUCCESSION_WINDOW_MS = 300_000; // 5 minutes
/** Refund rate above this fraction is suspicious. */
const SUSPICIOUS_REFUND_RATE = 0.25;

/**
 * Detect anomalous patterns in a set of payments.
 */
export function detectAnomalies(
  payments: readonly PaymentRecord[],
  options?: {
    readonly largeAmountThreshold?: number;
    readonly rapidSuccessionWindowMs?: number;
    readonly suspiciousRefundRate?: number;
  },
): readonly Anomaly[] {
  const largeThreshold =
    options?.largeAmountThreshold ?? LARGE_AMOUNT_THRESHOLD;
  const rapidWindow =
    options?.rapidSuccessionWindowMs ?? RAPID_SUCCESSION_WINDOW_MS;
  const refundRateThreshold =
    options?.suspiciousRefundRate ?? SUSPICIOUS_REFUND_RATE;

  const anomalies: Anomaly[] = [];
  const now = new Date();

  // 1. Double charges: same customer, same amount, within rapid window
  anomalies.push(...detectDoubleCharges(payments, rapidWindow, now));

  // 2. Refunds without reason
  anomalies.push(...detectRefundsWithoutReason(payments, now));

  // 3. Large amounts
  anomalies.push(...detectLargeAmounts(payments, largeThreshold, now));

  // 4. Rapid succession: many charges for same customer in short window
  anomalies.push(...detectRapidSuccession(payments, rapidWindow, now));

  // 5. Suspicious refund rate per customer
  anomalies.push(
    ...detectSuspiciousRefundRate(payments, refundRateThreshold, now),
  );

  return anomalies;
}

function detectDoubleCharges(
  payments: readonly PaymentRecord[],
  windowMs: number,
  now: Date,
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byCustomer = groupByCustomer(payments);

  byCustomer.forEach((customerPayments) => {
    const sorted = customerPayments.slice().sort(
      (a: PaymentRecord, b: PaymentRecord) =>
        a.createdAt.getTime() - b.createdAt.getTime(),
    );

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const timeDiff =
          sorted[j].createdAt.getTime() - sorted[i].createdAt.getTime();
        if (timeDiff > windowMs) break;

        if (
          sorted[i].amount === sorted[j].amount &&
          sorted[i].currency === sorted[j].currency &&
          sorted[i].status === "succeeded" &&
          sorted[j].status === "succeeded"
        ) {
          anomalies.push({
            type: "double_charge",
            paymentIds: [sorted[i].id, sorted[j].id],
            description:
              `Possible double charge: ${sorted[i].amount} ` +
              `${sorted[i].currency} for customer ` +
              `${sorted[i].customerId} within ` +
              `${Math.round(timeDiff / 1000)}s`,
            severity: "critical",
            detectedAt: now,
          });
        }
      }
    }
  });

  return anomalies;
}

function detectRefundsWithoutReason(
  payments: readonly PaymentRecord[],
  now: Date,
): Anomaly[] {
  return payments
    .filter(
      (p) =>
        (p.status === "refunded" || p.status === "partially_refunded") &&
        !p.refundReason,
    )
    .map((p) => ({
      type: "refund_without_reason" as const,
      paymentIds: [p.id],
      description:
        `Refund issued for ${p.amount} ${p.currency} ` +
        `(payment ${p.id}) without a documented reason`,
      severity: "medium" as const,
      detectedAt: now,
    }));
}

function detectLargeAmounts(
  payments: readonly PaymentRecord[],
  threshold: number,
  now: Date,
): Anomaly[] {
  return payments
    .filter((p) => p.amount >= threshold && p.status === "succeeded")
    .map((p) => ({
      type: "large_amount" as const,
      paymentIds: [p.id],
      description:
        `Unusually large payment of ${p.amount} ${p.currency} ` +
        `from customer ${p.customerId}`,
      severity: "high" as const,
      detectedAt: now,
    }));
}

function detectRapidSuccession(
  payments: readonly PaymentRecord[],
  windowMs: number,
  now: Date,
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byCustomer = groupByCustomer(payments);
  const RAPID_THRESHOLD = 3;

  byCustomer.forEach((customerPayments: PaymentRecord[], customerId: string) => {
    const succeeded = customerPayments
      .filter((p: PaymentRecord) => p.status === "succeeded")
      .sort((a: PaymentRecord, b: PaymentRecord) =>
        a.createdAt.getTime() - b.createdAt.getTime(),
      );

    if (succeeded.length < RAPID_THRESHOLD) return;

    for (let i = 0; i <= succeeded.length - RAPID_THRESHOLD; i++) {
      const windowEnd = succeeded[i].createdAt.getTime() + windowMs;
      const inWindow = succeeded.filter(
        (p: PaymentRecord, idx: number) =>
          idx >= i &&
          p.createdAt.getTime() <= windowEnd,
      );

      if (inWindow.length >= RAPID_THRESHOLD) {
        anomalies.push({
          type: "rapid_succession",
          paymentIds: inWindow.map((p: PaymentRecord) => p.id),
          description:
            `${inWindow.length} charges for customer ${customerId} ` +
            `within ${Math.round(windowMs / 1000)}s window`,
          severity: "high",
          detectedAt: now,
        });
        break; // one anomaly per customer is enough
      }
    }
  });

  return anomalies;
}

function detectSuspiciousRefundRate(
  payments: readonly PaymentRecord[],
  threshold: number,
  now: Date,
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byCustomer = groupByCustomer(payments);

  byCustomer.forEach((customerPayments: PaymentRecord[], customerId: string) => {
    if (customerPayments.length < 4) return;

    const refundCount = customerPayments.filter(
      (p: PaymentRecord) =>
        p.status === "refunded" || p.status === "partially_refunded",
    ).length;
    const rate = refundCount / customerPayments.length;

    if (rate >= threshold) {
      anomalies.push({
        type: "suspicious_refund_rate",
        paymentIds: customerPayments.map((p: PaymentRecord) => p.id),
        description:
          `Customer ${customerId} has a ${Math.round(rate * 100)}% ` +
          `refund rate (${refundCount}/${customerPayments.length} payments)`,
        severity: "high",
        detectedAt: now,
      });
    }
  });

  return anomalies;
}

function groupByCustomer(
  payments: readonly PaymentRecord[],
): Map<string, PaymentRecord[]> {
  const grouped = new Map<string, PaymentRecord[]>();
  for (const p of payments) {
    const existing = grouped.get(p.customerId);
    if (existing) {
      existing.push(p);
    } else {
      grouped.set(p.customerId, [p]);
    }
  }
  return grouped;
}

/* ------------------------------------------------------------------ */
/*  Report Generation                                                  */
/* ------------------------------------------------------------------ */

/**
 * Generate a comprehensive reconciliation report with discrepancies,
 * anomaly detection, revenue summary, and prioritized action items.
 */
export function generateReconciliationReport(
  stripePayments: readonly StripePayment[],
  internalRecords: readonly PaymentRecord[],
  periodStart: Date,
  periodEnd: Date,
  currency: string = "usd",
): ReconciliationReport {
  const filteredStripe = stripePayments.filter((sp) =>
    isWithinDateRange(sp.created, periodStart, periodEnd),
  );
  const filteredInternal = internalRecords.filter((r) =>
    isWithinDateRange(r.createdAt, periodStart, periodEnd),
  );

  const reconciliation = reconcilePayments(filteredStripe, filteredInternal);
  const anomalies = detectAnomalies(filteredInternal);
  const revenueSummary = calculateRevenueSummary(filteredInternal, currency);
  const actionItems = buildActionItems(reconciliation, anomalies);

  const matchedCount = reconciliation.matched.length;
  const totalStripe = filteredStripe.length;

  const summary: ReportSummary = {
    totalStripePayments: totalStripe,
    totalInternalRecords: filteredInternal.length,
    matchedCount,
    discrepancyCount: reconciliation.discrepancies.length,
    anomalyCount: anomalies.length,
    matchRate: totalStripe > 0 ? matchedCount / totalStripe : 1,
  };

  return {
    generatedAt: new Date(),
    periodStart,
    periodEnd,
    reconciliation,
    anomalies,
    revenueSummary,
    actionItems,
    summary,
  };
}

function buildActionItems(
  reconciliation: ReconciliationResult,
  anomalies: readonly Anomaly[],
): ActionItem[] {
  const items: ActionItem[] = [];
  let idx = 0;

  // Action items from unmatched Stripe payments
  if (reconciliation.unmatchedStripe.length > 0) {
    items.push({
      id: generateId("action", idx++),
      priority: "high",
      description:
        `${reconciliation.unmatchedStripe.length} Stripe payment(s) ` +
        `have no matching internal record`,
      relatedDiscrepancies: reconciliation.discrepancies
        .filter((d) => d.type === "missing_internal")
        .map((d) => d.stripePaymentId),
      suggestedAction:
        "Create internal records for these payments or investigate " +
        "why they were not recorded",
    });
  }

  // Action items from orphaned internal records
  if (reconciliation.unmatchedInternal.length > 0) {
    items.push({
      id: generateId("action", idx++),
      priority: "critical",
      description:
        `${reconciliation.unmatchedInternal.length} internal record(s) ` +
        `have no matching Stripe payment`,
      relatedDiscrepancies: reconciliation.discrepancies
        .filter((d) => d.type === "missing_stripe")
        .map((d) => d.stripePaymentId),
      suggestedAction:
        "Verify these records against Stripe dashboard. " +
        "Remove or correct invalid records",
    });
  }

  // Action items from amount mismatches
  const amountMismatches = reconciliation.discrepancies.filter(
    (d) => d.type === "amount_mismatch",
  );
  if (amountMismatches.length > 0) {
    items.push({
      id: generateId("action", idx++),
      priority: "high",
      description:
        `${amountMismatches.length} payment(s) have amount discrepancies`,
      relatedDiscrepancies: amountMismatches.map((d) => d.stripePaymentId),
      suggestedAction:
        "Review each mismatched amount and update internal records " +
        "to match Stripe as the source of truth",
    });
  }

  // Action items from anomalies
  const criticalAnomalies = anomalies.filter(
    (a) => a.severity === "critical",
  );
  if (criticalAnomalies.length > 0) {
    items.push({
      id: generateId("action", idx++),
      priority: "critical",
      description:
        `${criticalAnomalies.length} critical anomaly/anomalies detected ` +
        `(possible double charges)`,
      relatedDiscrepancies: criticalAnomalies.flatMap((a) => [...a.paymentIds]),
      suggestedAction:
        "Immediately review flagged payments for possible " +
        "duplicate charges and issue refunds if confirmed",
    });
  }

  const refundAnomalies = anomalies.filter(
    (a) => a.type === "refund_without_reason",
  );
  if (refundAnomalies.length > 0) {
    items.push({
      id: generateId("action", idx++),
      priority: "medium",
      description:
        `${refundAnomalies.length} refund(s) issued without a documented reason`,
      relatedDiscrepancies: refundAnomalies.flatMap((a) => [...a.paymentIds]),
      suggestedAction:
        "Document the reason for each refund and update internal records",
    });
  }

  return items.sort((a, b) => {
    const order: Record<ActionItemPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return order[a.priority] - order[b.priority];
  });
}
