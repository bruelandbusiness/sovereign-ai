/**
 * Reporting template system for generating client reports.
 *
 * Pure utility module — no database calls, no side effects.
 * All functions produce deterministic output from their inputs.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type MetricFormat = "number" | "percentage" | "currency" | "decimal";

export type ReportFrequency = "weekly" | "monthly" | "quarterly" | "annual";

export type TrendDirection = "up" | "down" | "flat";

export interface ReportMetric {
  readonly key: string;
  readonly label: string;
  readonly format: MetricFormat;
  readonly description: string;
  /** Optional threshold that flags the metric when exceeded. */
  readonly warningThreshold?: number;
}

export interface ReportSection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly metrics: readonly ReportMetric[];
  /** When true, section includes chart-ready data points. */
  readonly includesChart: boolean;
}

export interface ReportTemplate {
  readonly id: string;
  readonly name: string;
  readonly frequency: ReportFrequency;
  readonly description: string;
  readonly sections: readonly ReportSection[];
}

export interface ReportConfig {
  readonly templateId: string;
  readonly clientName: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly currency: string;
  readonly locale: string;
  readonly includeComparisons: boolean;
  readonly includeSummary: boolean;
}

/* ------------------------------------------------------------------ */
/*  Internal derived types used by public functions                    */
/* ------------------------------------------------------------------ */

export interface PeriodComparison {
  readonly metricKey: string;
  readonly currentValue: number;
  readonly previousValue: number;
  readonly delta: number;
  readonly deltaPercent: number;
  readonly direction: TrendDirection;
}

export interface BuiltReport {
  readonly templateId: string;
  readonly templateName: string;
  readonly clientName: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly generatedAt: string;
  readonly sections: readonly BuiltReportSection[];
  readonly executiveSummary: string | null;
}

export interface BuiltReportSection {
  readonly sectionId: string;
  readonly title: string;
  readonly values: readonly BuiltMetricValue[];
}

export interface BuiltMetricValue {
  readonly key: string;
  readonly label: string;
  readonly rawValue: number;
  readonly displayValue: string;
  readonly comparison: PeriodComparison | null;
}

export interface MetricsInput {
  readonly current: Readonly<Record<string, number>>;
  readonly previous?: Readonly<Record<string, number>>;
}

export interface ReportScheduleEntry {
  readonly templateId: string;
  readonly frequency: ReportFrequency;
  readonly dayOfWeek?: number;
  readonly dayOfMonth?: number;
  readonly monthOfQuarter?: number;
  readonly monthOfYear?: number;
  readonly description: string;
}

/* ------------------------------------------------------------------ */
/*  Report Templates                                                   */
/* ------------------------------------------------------------------ */

const WEEKLY_METRICS: readonly ReportMetric[] = [
  {
    key: "total_leads",
    label: "Total Leads",
    format: "number",
    description: "New leads captured this week",
  },
  {
    key: "lead_conversion_rate",
    label: "Lead Conversion Rate",
    format: "percentage",
    description: "Percentage of leads that converted",
  },
  {
    key: "new_reviews",
    label: "New Reviews",
    format: "number",
    description: "Reviews received this week",
  },
  {
    key: "avg_review_rating",
    label: "Average Review Rating",
    format: "decimal",
    description: "Mean star rating of new reviews",
    warningThreshold: 3.5,
  },
  {
    key: "bookings_count",
    label: "Bookings",
    format: "number",
    description: "Total bookings scheduled",
  },
  {
    key: "website_visits",
    label: "Website Visits",
    format: "number",
    description: "Unique website visitors",
  },
];

const MONTHLY_ROI_METRICS: readonly ReportMetric[] = [
  {
    key: "total_spend",
    label: "Total Spend",
    format: "currency",
    description: "Marketing and platform spend for the month",
  },
  {
    key: "total_revenue",
    label: "Total Revenue",
    format: "currency",
    description: "Revenue attributed to platform activities",
  },
  {
    key: "roi_percentage",
    label: "ROI",
    format: "percentage",
    description: "Return on investment: (revenue - spend) / spend",
  },
  {
    key: "cost_per_lead",
    label: "Cost Per Lead",
    format: "currency",
    description: "Average cost to acquire one lead",
  },
  {
    key: "cost_per_booking",
    label: "Cost Per Booking",
    format: "currency",
    description: "Average cost to acquire one booking",
  },
];

const MONTHLY_TREND_METRICS: readonly ReportMetric[] = [
  {
    key: "lead_trend",
    label: "Lead Volume Trend",
    format: "number",
    description: "Leads compared to previous month",
  },
  {
    key: "revenue_trend",
    label: "Revenue Trend",
    format: "currency",
    description: "Revenue compared to previous month",
  },
  {
    key: "review_trend",
    label: "Review Volume Trend",
    format: "number",
    description: "Reviews compared to previous month",
  },
];

const QUARTERLY_PERFORMANCE_METRICS: readonly ReportMetric[] = [
  {
    key: "quarterly_revenue",
    label: "Quarterly Revenue",
    format: "currency",
    description: "Total revenue for the quarter",
  },
  {
    key: "quarterly_leads",
    label: "Quarterly Leads",
    format: "number",
    description: "Total leads generated in the quarter",
  },
  {
    key: "quarterly_bookings",
    label: "Quarterly Bookings",
    format: "number",
    description: "Total bookings in the quarter",
  },
  {
    key: "quarterly_reviews",
    label: "Quarterly Reviews",
    format: "number",
    description: "Total reviews received in the quarter",
  },
  {
    key: "avg_monthly_growth",
    label: "Avg Monthly Growth",
    format: "percentage",
    description: "Average month-over-month growth rate",
  },
];

const QUARTERLY_COMPARISON_METRICS: readonly ReportMetric[] = [
  {
    key: "revenue_vs_prev_quarter",
    label: "Revenue vs Previous Quarter",
    format: "currency",
    description: "Revenue comparison to prior quarter",
  },
  {
    key: "leads_vs_prev_quarter",
    label: "Leads vs Previous Quarter",
    format: "number",
    description: "Lead volume comparison to prior quarter",
  },
  {
    key: "conversion_vs_prev_quarter",
    label: "Conversion vs Previous Quarter",
    format: "percentage",
    description: "Conversion rate comparison to prior quarter",
  },
];

const QUARTERLY_RECOMMENDATION_METRICS: readonly ReportMetric[] = [
  {
    key: "top_channel_revenue",
    label: "Top Revenue Channel",
    format: "currency",
    description: "Highest-performing revenue channel",
  },
  {
    key: "underperforming_areas",
    label: "Underperforming Areas",
    format: "number",
    description: "Count of metrics below target",
    warningThreshold: 3,
  },
];

const ANNUAL_TOTALS_METRICS: readonly ReportMetric[] = [
  {
    key: "annual_revenue",
    label: "Annual Revenue",
    format: "currency",
    description: "Total revenue for the year",
  },
  {
    key: "annual_leads",
    label: "Annual Leads",
    format: "number",
    description: "Total leads generated in the year",
  },
  {
    key: "annual_bookings",
    label: "Annual Bookings",
    format: "number",
    description: "Total bookings in the year",
  },
  {
    key: "annual_reviews",
    label: "Annual Reviews",
    format: "number",
    description: "Total reviews received in the year",
  },
  {
    key: "annual_spend",
    label: "Annual Spend",
    format: "currency",
    description: "Total platform and marketing spend",
  },
];

const ANNUAL_GROWTH_METRICS: readonly ReportMetric[] = [
  {
    key: "revenue_growth_yoy",
    label: "Revenue Growth (YoY)",
    format: "percentage",
    description: "Year-over-year revenue growth",
  },
  {
    key: "lead_growth_yoy",
    label: "Lead Growth (YoY)",
    format: "percentage",
    description: "Year-over-year lead growth",
  },
  {
    key: "booking_growth_yoy",
    label: "Booking Growth (YoY)",
    format: "percentage",
    description: "Year-over-year booking growth",
  },
  {
    key: "review_growth_yoy",
    label: "Review Growth (YoY)",
    format: "percentage",
    description: "Year-over-year review growth",
  },
];

const ANNUAL_MILESTONES_METRICS: readonly ReportMetric[] = [
  {
    key: "best_month_revenue",
    label: "Best Month Revenue",
    format: "currency",
    description: "Highest single-month revenue",
  },
  {
    key: "best_month_leads",
    label: "Best Month Leads",
    format: "number",
    description: "Highest single-month lead count",
  },
  {
    key: "total_review_rating_avg",
    label: "Overall Avg Rating",
    format: "decimal",
    description: "Average review rating across the year",
  },
];

export const REPORT_TEMPLATES: readonly ReportTemplate[] = [
  {
    id: "weekly-performance",
    name: "Weekly Performance Summary",
    frequency: "weekly",
    description:
      "High-level KPIs covering leads, reviews, bookings, and top actions for the week.",
    sections: [
      {
        id: "kpis",
        title: "Key Performance Indicators",
        description: "Core weekly metrics at a glance",
        metrics: WEEKLY_METRICS,
        includesChart: false,
      },
      {
        id: "top-actions",
        title: "Top Actions",
        description:
          "Recommended actions based on this week's performance",
        metrics: [
          {
            key: "actions_taken",
            label: "Actions Completed",
            format: "number",
            description: "Automated or manual actions completed",
          },
          {
            key: "actions_pending",
            label: "Actions Pending",
            format: "number",
            description: "Outstanding recommended actions",
            warningThreshold: 5,
          },
        ],
        includesChart: false,
      },
    ],
  },
  {
    id: "monthly-roi",
    name: "Monthly ROI Report",
    frequency: "monthly",
    description:
      "Detailed spend vs revenue analysis with ROI calculations and month-over-month trend data.",
    sections: [
      {
        id: "roi-analysis",
        title: "ROI Analysis",
        description: "Spend versus revenue with ROI calculation",
        metrics: MONTHLY_ROI_METRICS,
        includesChart: true,
      },
      {
        id: "trend-analysis",
        title: "Trend Analysis",
        description: "Month-over-month trend comparisons",
        metrics: MONTHLY_TREND_METRICS,
        includesChart: true,
      },
    ],
  },
  {
    id: "quarterly-review",
    name: "Quarterly Business Review",
    frequency: "quarterly",
    description:
      "Comprehensive quarterly review with chart data, quarter-over-quarter comparisons, and strategic recommendations.",
    sections: [
      {
        id: "quarterly-performance",
        title: "Quarterly Performance",
        description: "Aggregate performance for the quarter",
        metrics: QUARTERLY_PERFORMANCE_METRICS,
        includesChart: true,
      },
      {
        id: "quarter-comparison",
        title: "Quarter-over-Quarter Comparison",
        description: "Performance deltas against the previous quarter",
        metrics: QUARTERLY_COMPARISON_METRICS,
        includesChart: true,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        description:
          "Strategic recommendations based on quarterly data",
        metrics: QUARTERLY_RECOMMENDATION_METRICS,
        includesChart: false,
      },
    ],
  },
  {
    id: "annual-review",
    name: "Annual Year-in-Review",
    frequency: "annual",
    description:
      "Full-year totals, year-over-year growth metrics, and key milestones achieved.",
    sections: [
      {
        id: "yearly-totals",
        title: "Yearly Totals",
        description: "Aggregate numbers for the entire year",
        metrics: ANNUAL_TOTALS_METRICS,
        includesChart: true,
      },
      {
        id: "growth-metrics",
        title: "Growth Metrics",
        description: "Year-over-year growth across key areas",
        metrics: ANNUAL_GROWTH_METRICS,
        includesChart: true,
      },
      {
        id: "milestones",
        title: "Milestones",
        description: "Notable achievements and peak performance",
        metrics: ANNUAL_MILESTONES_METRICS,
        includesChart: false,
      },
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Helper: find a template by ID                                      */
/* ------------------------------------------------------------------ */

function findTemplate(templateId: string): ReportTemplate {
  const template = REPORT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Unknown report template: ${templateId}`);
  }
  return template;
}

/* ------------------------------------------------------------------ */
/*  formatMetricForDisplay                                             */
/* ------------------------------------------------------------------ */

/**
 * Format a raw numeric value for human-readable display in reports.
 *
 * @param value   - The raw number to format.
 * @param format  - The target format type.
 * @param currency - ISO 4217 currency code (default "USD").
 * @param locale  - BCP 47 locale string (default "en-US").
 * @returns A formatted string suitable for report display.
 */
export function formatMetricForDisplay(
  value: number,
  format: MetricFormat,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    case "percentage":
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value / 100);

    case "decimal":
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }).format(value);

    case "number":
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(value);
  }
}

/* ------------------------------------------------------------------ */
/*  calculatePeriodComparison                                          */
/* ------------------------------------------------------------------ */

const FLAT_THRESHOLD = 0.5;

/**
 * Compare a metric's current value against its previous-period value.
 *
 * @param metricKey     - Identifier for the metric being compared.
 * @param currentValue  - Value in the current period.
 * @param previousValue - Value in the previous period.
 * @returns A PeriodComparison with delta, percentage change, and direction.
 */
export function calculatePeriodComparison(
  metricKey: string,
  currentValue: number,
  previousValue: number,
): PeriodComparison {
  const delta = currentValue - previousValue;

  const deltaPercent =
    previousValue === 0
      ? currentValue === 0
        ? 0
        : 100
      : (delta / Math.abs(previousValue)) * 100;

  const direction: TrendDirection =
    Math.abs(deltaPercent) < FLAT_THRESHOLD
      ? "flat"
      : deltaPercent > 0
        ? "up"
        : "down";

  return {
    metricKey,
    currentValue,
    previousValue,
    delta,
    deltaPercent: Math.round(deltaPercent * 10) / 10,
    direction,
  };
}

/* ------------------------------------------------------------------ */
/*  buildReport                                                        */
/* ------------------------------------------------------------------ */

/**
 * Assemble a full report from a template ID, config, and metrics input.
 *
 * @param config  - Report configuration (template, client, period, options).
 * @param metrics - Current and optionally previous period metric values.
 * @returns A fully assembled BuiltReport ready for rendering.
 */
export function buildReport(
  config: ReportConfig,
  metrics: MetricsInput,
): BuiltReport {
  const template = findTemplate(config.templateId);

  const sections: BuiltReportSection[] = template.sections.map(
    (section) => {
      const values: BuiltMetricValue[] = section.metrics.map(
        (metric) => {
          const rawValue = metrics.current[metric.key] ?? 0;
          const displayValue = formatMetricForDisplay(
            rawValue,
            metric.format,
            config.currency,
            config.locale,
          );

          const comparison =
            config.includeComparisons && metrics.previous
              ? calculatePeriodComparison(
                  metric.key,
                  rawValue,
                  metrics.previous[metric.key] ?? 0,
                )
              : null;

          return {
            key: metric.key,
            label: metric.label,
            rawValue,
            displayValue,
            comparison,
          };
        },
      );

      return {
        sectionId: section.id,
        title: section.title,
        values,
      };
    },
  );

  const executiveSummary =
    config.includeSummary
      ? generateExecutiveSummary(
          template,
          sections,
          config.clientName,
          config.periodStart,
          config.periodEnd,
        )
      : null;

  return {
    templateId: template.id,
    templateName: template.name,
    clientName: config.clientName,
    periodStart: config.periodStart,
    periodEnd: config.periodEnd,
    generatedAt: new Date().toISOString(),
    sections,
    executiveSummary,
  };
}

/* ------------------------------------------------------------------ */
/*  generateExecutiveSummary                                           */
/* ------------------------------------------------------------------ */

/**
 * Produce a 3-5 sentence executive summary from assembled report data.
 *
 * Summarises total metrics, highlights top performers, and flags
 * any notable changes when comparison data is available.
 */
export function generateExecutiveSummary(
  template: ReportTemplate,
  sections: readonly BuiltReportSection[],
  clientName: string,
  periodStart: string,
  periodEnd: string,
): string {
  const sentences: string[] = [];

  // Opening sentence: report scope
  sentences.push(
    `This ${template.name} for ${clientName} covers the period from ${periodStart} to ${periodEnd}.`,
  );

  // Collect all values with comparisons for analysis
  const allValues = sections.flatMap((s) => s.values);
  const withComparison = allValues.filter(
    (v): v is BuiltMetricValue & { comparison: PeriodComparison } =>
      v.comparison !== null,
  );

  // Summary of metric count
  sentences.push(
    `The report covers ${allValues.length} metrics across ${sections.length} sections.`,
  );

  // Highlight top improving metric
  if (withComparison.length > 0) {
    const improving = [...withComparison].sort(
      (a, b) => b.comparison.deltaPercent - a.comparison.deltaPercent,
    );

    const best = improving[0];
    if (best.comparison.direction === "up") {
      sentences.push(
        `${best.label} showed the strongest improvement at +${best.comparison.deltaPercent}% compared to the previous period.`,
      );
    }

    // Flag any declining metrics
    const declining = improving.filter(
      (v) => v.comparison.direction === "down",
    );
    if (declining.length > 0) {
      sentences.push(
        `${declining.length} metric${declining.length > 1 ? "s" : ""} declined period-over-period and may require attention.`,
      );
    } else {
      sentences.push(
        "All tracked metrics held steady or improved compared to the previous period.",
      );
    }
  }

  // Closing recommendation
  sentences.push(
    "Review the detailed sections below for actionable insights.",
  );

  return sentences.join(" ");
}

/* ------------------------------------------------------------------ */
/*  getReportSchedule                                                  */
/* ------------------------------------------------------------------ */

/**
 * Determine when each report template should be generated.
 *
 * Returns a schedule entry per template describing the recurrence
 * cadence in human-readable and machine-usable terms.
 */
export function getReportSchedule(): readonly ReportScheduleEntry[] {
  return REPORT_TEMPLATES.map((template): ReportScheduleEntry => {
    switch (template.frequency) {
      case "weekly":
        return {
          templateId: template.id,
          frequency: "weekly",
          dayOfWeek: 1, // Monday
          description:
            "Generated every Monday covering the previous Mon-Sun period.",
        };

      case "monthly":
        return {
          templateId: template.id,
          frequency: "monthly",
          dayOfMonth: 1,
          description:
            "Generated on the 1st of each month covering the previous calendar month.",
        };

      case "quarterly":
        return {
          templateId: template.id,
          frequency: "quarterly",
          dayOfMonth: 1,
          monthOfQuarter: 1,
          description:
            "Generated on the 1st day of each new quarter covering the previous quarter (Q1-Q4).",
        };

      case "annual":
        return {
          templateId: template.id,
          frequency: "annual",
          dayOfMonth: 1,
          monthOfYear: 1,
          description:
            "Generated on January 1st covering the previous calendar year.",
        };
    }
  });
}
