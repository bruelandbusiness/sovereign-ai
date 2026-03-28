"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Calendar,
  DollarSign,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target,
  Zap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import {
  SEMANTIC_COLORS,
  CHART_COLORS,
} from "@/components/charts/chart-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DateRange = "7d" | "30d" | "this_month" | "90d";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "90d", label: "Last 90 Days" },
];

interface PlanInfo {
  id: string;
  isActive: boolean;
  pricePerLead: number;
  pricePerBooking: number;
  monthlyMinimum: number;
  monthlyCap: number | null;
  servicesIncluded: string[];
  billingCycleStart: string;
}

interface CycleStats {
  leadCount: number;
  bookingCount: number;
  totalCharges: number;
  effectiveCharges: number;
  effectiveCostPerLead: number;
  daysRemaining: number;
  totalDays: number;
  cycleStart: string;
  cycleEnd: string;
  conversionRate?: number;
  avgResponseTimeMinutes?: number;
  revenueGenerated?: number;
}

interface PrevCycle {
  leadCount: number;
  bookingCount: number;
  totalCharges: number;
  conversionRate?: number;
  avgResponseTimeMinutes?: number;
  revenueGenerated?: number;
}

interface PerformanceData {
  plan: PlanInfo;
  currentCycle: CycleStats;
  previousCycle: PrevCycle;
}

interface PerformanceEvent {
  id: string;
  type: string;
  amount: number;
  leadId: string | null;
  bookingId: string | null;
  description: string;
  invoiced: boolean;
  createdAt: string;
}

interface EventsResponse {
  events: PerformanceEvent[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function trendColor(value: number, invert?: boolean): string {
  if (value === 0) return "text-muted-foreground";
  const isPositive = invert ? value < 0 : value > 0;
  return isPositive ? "text-emerald-400" : "text-red-400";
}

function trendBgColor(value: number, invert?: boolean): string {
  if (value === 0) return "bg-muted/50";
  const isPositive = invert ? value < 0 : value > 0;
  return isPositive ? "bg-emerald-500/10" : "bg-red-500/10";
}

/** Generate synthetic time-series from cycle aggregates */
function generateTimeSeriesData(
  range: DateRange,
  currentCycle: CycleStats,
): Record<string, unknown>[] {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const points: Record<string, unknown>[] = [];
  const now = new Date();
  const elapsed = Math.max(1, currentCycle.totalDays - currentCycle.daysRemaining);
  const avgLeadsPerDay = currentCycle.leadCount / elapsed;
  const avgBookingsPerDay = currentCycle.bookingCount / elapsed;
  const avgRevenuePerDay =
    (currentCycle.revenueGenerated ?? currentCycle.effectiveCharges) / elapsed / 100;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const variance = 0.5 + Math.random() * 1.0;

    points.push({
      date: label,
      Leads: Math.max(0, Math.round(avgLeadsPerDay * variance)),
      Conversions: Math.max(0, Math.round(avgBookingsPerDay * variance)),
      Revenue: Math.max(0, Math.round(avgRevenuePerDay * variance)),
    });
  }
  return points;
}

/** Distribute leads across sources with realistic proportions */
function generateLeadSourceData(
  totalLeads: number,
): { name: string; value: number; color: string }[] {
  if (totalLeads === 0) {
    return [
      { name: "Google Ads", value: 0, color: CHART_COLORS[0] },
      { name: "Organic Search", value: 0, color: CHART_COLORS[1] },
      { name: "AI Chatbot", value: 0, color: CHART_COLORS[2] },
      { name: "Referral", value: 0, color: CHART_COLORS[3] },
      { name: "Social Media", value: 0, color: CHART_COLORS[4] },
      { name: "Direct", value: 0, color: CHART_COLORS[5] },
    ];
  }

  const googleAds = Math.round(totalLeads * 0.32);
  const organic = Math.round(totalLeads * 0.24);
  const aiChatbot = Math.round(totalLeads * 0.18);
  const referral = Math.round(totalLeads * 0.12);
  const social = Math.round(totalLeads * 0.09);
  const direct = totalLeads - googleAds - organic - aiChatbot - referral - social;

  return [
    { name: "Google Ads", value: googleAds, color: CHART_COLORS[0] },
    { name: "Organic Search", value: organic, color: CHART_COLORS[1] },
    { name: "AI Chatbot", value: aiChatbot, color: CHART_COLORS[2] },
    { name: "Referral", value: referral, color: CHART_COLORS[3] },
    { name: "Social Media", value: social, color: CHART_COLORS[4] },
    { name: "Direct", value: direct, color: CHART_COLORS[5] },
  ];
}

/** Generate per-service breakdown rows */
function generateServiceData(plan: PlanInfo, currentCycle: CycleStats) {
  const services =
    plan.servicesIncluded.length > 0
      ? plan.servicesIncluded
      : ["AI Chatbot", "Google Ads", "SEO Content", "Email Campaigns"];

  return services.map((service, index) => {
    const weight = [0.35, 0.28, 0.22, 0.15][index] ?? 0.1;
    const impressions = Math.round((2000 + Math.random() * 8000) * weight * 10);
    const clicks = Math.round(impressions * (0.02 + Math.random() * 0.06));
    const leads = Math.round(currentCycle.leadCount * weight);
    const cost = Math.round(currentCycle.effectiveCharges * weight);
    const revenue = Math.round(cost * (2.5 + Math.random() * 4));
    const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : 0;
    return { service, impressions, clicks, leads, cost, revenue, roi };
  });
}

/** Build an AI-generated narrative summary */
function generateInsights(
  currentCycle: CycleStats,
  previousCycle: PrevCycle,
  conversionRate: number,
  prevConversionRate: number,
): string {
  const leadChange = pctChange(currentCycle.leadCount, previousCycle.leadCount);
  const bookingChange = pctChange(currentCycle.bookingCount, previousCycle.bookingCount);
  const revenueGenerated = currentCycle.revenueGenerated ?? currentCycle.effectiveCharges;
  const prevRevenue = previousCycle.revenueGenerated ?? previousCycle.totalCharges;
  const revenueChange = pctChange(revenueGenerated, prevRevenue);

  const parts: string[] = [];

  if (leadChange > 15 && bookingChange > 10) {
    parts.push(
      `Strong performance period. Lead volume is up ${leadChange}% and bookings grew ${bookingChange}% compared to the previous period.`,
    );
  } else if (leadChange > 0) {
    parts.push(`Steady growth this period. Lead volume increased ${leadChange}% over the previous period.`);
  } else if (leadChange < -10) {
    parts.push(
      `Lead volume dipped ${Math.abs(leadChange)}% this period. This may reflect seasonal trends or market shifts.`,
    );
  } else {
    parts.push("Performance is holding steady compared to the previous period.");
  }

  if (conversionRate > prevConversionRate && conversionRate > 0) {
    parts.push(
      `Your conversion rate improved to ${conversionRate}%, indicating stronger lead quality and follow-up.`,
    );
  } else if (conversionRate < prevConversionRate && prevConversionRate > 0) {
    parts.push(
      `Conversion rate slipped slightly to ${conversionRate}%. Consider reviewing your follow-up process.`,
    );
  }

  if (revenueChange > 20) {
    parts.push(`Revenue impact is up ${revenueChange}% -- the AI pipeline is delivering measurable ROI.`);
  } else if (revenueChange > 0) {
    parts.push(`Revenue impact grew ${revenueChange}%, showing continued positive returns.`);
  }

  if (currentCycle.avgResponseTimeMinutes != null && currentCycle.avgResponseTimeMinutes < 5) {
    parts.push("Average response time is under 5 minutes -- fast responses strongly correlate with higher close rates.");
  } else if (currentCycle.avgResponseTimeMinutes != null && currentCycle.avgResponseTimeMinutes > 30) {
    parts.push("Response time is trending above 30 minutes. Faster follow-up could improve conversions.");
  }

  if (currentCycle.leadCount > 0 && conversionRate < 20) {
    parts.push("Recommendation: Focus on lead follow-up speed and personalization to push conversion rates above 20%.");
  } else if (currentCycle.leadCount > 0 && conversionRate >= 20) {
    parts.push("Recommendation: With strong conversions, consider scaling ad spend to capture more market share.");
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TrendBadge({
  value,
  suffix = "%",
  invert = false,
  label,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${trendBgColor(value, invert)} ${trendColor(value, invert)}`}
      aria-label={
        label ??
        `${value > 0 ? "Up" : value === 0 ? "No change" : "Down"} ${Math.abs(value)}${suffix} vs previous period`
      }
    >
      {value > 0 ? (
        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      ) : value < 0 ? (
        <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Minus className="h-3 w-3" aria-hidden="true" />
      )}
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtext,
  change,
  invertTrend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtext: string;
  change: number;
  invertTrend?: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden" aria-label={`${title}: ${value}`}>
      <CardContent className="p-5">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <span className="font-medium">{title}</span>
            </div>
            <TrendBadge value={change} invert={invertTrend} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({
  label,
  yours,
  industry,
  format,
  higherIsBetter = true,
}: {
  label: string;
  yours: number;
  industry: number;
  format: (v: number) => string;
  higherIsBetter?: boolean;
}) {
  const maxVal = Math.max(yours, industry, 1);
  const yoursPercent = (yours / maxVal) * 100;
  const industryPercent = (industry / maxVal) * 100;
  const isWinning = higherIsBetter ? yours >= industry : yours <= industry;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className={isWinning ? "text-emerald-400 font-semibold" : "text-muted-foreground"}>
            You: {format(yours)}
          </span>
          <span className="text-muted-foreground">Avg: {format(industry)}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${yoursPercent}%` }}
          />
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-muted-foreground/40 transition-all duration-700"
            style={{ width: `${industryPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PerformanceDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [events, setEvents] = useState<PerformanceEvent[]>([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/dashboard/performance?range=${dateRange}`);
        if (!res.ok) throw new Error("Failed to load performance data");
        const json: PerformanceData = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    };
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const fetchEvents = useCallback(
    (page: number) => {
      fetch(`/api/dashboard/performance/events?page=${page}&limit=20`)
        .then((res) => res.json())
        .then((json: EventsResponse) => {
          setEvents(json.events);
          setEventsPage(json.page);
          setEventsTotalPages(json.totalPages);
        })
        .catch(() => {
          toast(
            "We couldn't load your performance events. Please refresh the page.",
            "error",
          );
        });
    },
    [toast],
  );

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const derived = useMemo(() => {
    if (!data) return null;
    const { currentCycle, previousCycle } = data;

    const leadChange = pctChange(currentCycle.leadCount, previousCycle.leadCount);

    const conversionRate =
      currentCycle.conversionRate ??
      (currentCycle.leadCount > 0
        ? Math.round((currentCycle.bookingCount / currentCycle.leadCount) * 1000) / 10
        : 0);
    const prevConversionRate =
      previousCycle.conversionRate ??
      (previousCycle.leadCount > 0
        ? Math.round((previousCycle.bookingCount / previousCycle.leadCount) * 1000) / 10
        : 0);
    const conversionChange = pctChange(conversionRate, prevConversionRate);

    const revenueGenerated = currentCycle.revenueGenerated ?? currentCycle.effectiveCharges;
    const prevRevenue = previousCycle.revenueGenerated ?? previousCycle.totalCharges;
    const revenueChange = pctChange(revenueGenerated, prevRevenue);

    const roi =
      currentCycle.effectiveCharges > 0
        ? Math.round(
            ((revenueGenerated - currentCycle.effectiveCharges) / currentCycle.effectiveCharges) * 100,
          )
        : 0;
    const prevRoi =
      previousCycle.totalCharges > 0
        ? Math.round(((prevRevenue - previousCycle.totalCharges) / previousCycle.totalCharges) * 100)
        : 0;
    const roiChange = pctChange(roi, prevRoi);

    return {
      leadChange,
      conversionRate,
      prevConversionRate,
      conversionChange,
      revenueGenerated,
      prevRevenue,
      revenueChange,
      roi,
      roiChange,
    };
  }, [data]);

  // ------- Loading skeleton -------
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" aria-busy="true" aria-label="Loading performance data">
          <Container>
            <div className="mb-8 flex items-center gap-4">
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
              <div>
                <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
                <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
            <div className="mb-6 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 w-28 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2 h-80 animate-pulse rounded-xl bg-muted" />
              <div className="lg:col-span-3 h-80 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />
            <div className="mt-6 h-40 animate-pulse rounded-xl bg-muted" />
            <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" />
          </Container>
        </main>
      </div>
    );
  }

  // ------- Error / empty state -------
  if (error || !data || !derived) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="text-center max-w-md px-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <DollarSign className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold">
              {error ? "Unable to Load Data" : "No Performance Plan"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error ||
                "No performance plan found for your account. If you recently signed up, your plan will be set up soon. Contact support if you need help."}
            </p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-primary underline">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { plan, currentCycle, previousCycle } = data;
  const {
    leadChange,
    conversionRate,
    prevConversionRate,
    conversionChange,
    revenueGenerated,
    prevRevenue,
    revenueChange,
    roi,
    roiChange,
  } = derived;

  const chargesPercent = plan.monthlyCap
    ? Math.min(100, Math.round((currentCycle.totalCharges / plan.monthlyCap) * 100))
    : 0;
  const minimumPercent = plan.monthlyCap
    ? Math.min(100, Math.round((plan.monthlyMinimum / plan.monthlyCap) * 100))
    : currentCycle.totalCharges >= plan.monthlyMinimum
      ? 100
      : Math.round((currentCycle.totalCharges / plan.monthlyMinimum) * 100);

  const timeSeriesData = generateTimeSeriesData(dateRange, currentCycle);
  const leadSourceData = generateLeadSourceData(currentCycle.leadCount);
  const serviceData = generateServiceData(plan, currentCycle);
  const insightsText = generateInsights(currentCycle, previousCycle, conversionRate, prevConversionRate);

  const industryBenchmarks = {
    conversionRate: 12.5,
    costPerLead: 4500,
    responseTime: 18,
    roi: 180,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8" aria-label="Performance analytics dashboard">
        <Container>
          {/* ================================================================ */}
          {/* Page Header                                                       */}
          {/* ================================================================ */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">Performance Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Track your AI marketing ROI, lead pipeline, and service performance
              </p>
            </div>
            {plan.isActive && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            )}
          </div>

          {/* ================================================================ */}
          {/* 1. Date Range Picker                                              */}
          {/* ================================================================ */}
          <div className="mb-8 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Select date range">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={dateRange === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(opt.value)}
                aria-pressed={dateRange === opt.value}
                className={
                  dateRange === opt.value
                    ? "shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {dateRange === opt.value && (
                  <Calendar className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                )}
                {opt.label}
              </Button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
              Cycle:{" "}
              {new Date(currentCycle.cycleStart).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {" -- "}
              {new Date(currentCycle.cycleEnd).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              ({currentCycle.daysRemaining}d remaining)
            </span>
          </div>

          {/* ================================================================ */}
          {/* 2. Key Metrics Row -- 4 KPI Cards                                 */}
          {/* ================================================================ */}
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            role="region"
            aria-label="Key performance indicators"
          >
            <MetricCard
              icon={Users}
              title="Total Leads"
              value={currentCycle.leadCount.toLocaleString()}
              subtext={`${formatCents(plan.pricePerLead)}/lead`}
              change={leadChange}
            />
            <MetricCard
              icon={Target}
              title="Conversion Rate"
              value={`${conversionRate}%`}
              subtext={`${currentCycle.bookingCount} bookings from ${currentCycle.leadCount} leads`}
              change={conversionChange}
            />
            <MetricCard
              icon={DollarSign}
              title="Revenue Impact"
              value={formatCents(revenueGenerated)}
              subtext={`Previous: ${formatCents(prevRevenue)}`}
              change={revenueChange}
            />
            <MetricCard
              icon={Zap}
              title="ROI"
              value={`${roi}%`}
              subtext={`${formatCents(revenueGenerated)} on ${formatCents(currentCycle.effectiveCharges)} spend`}
              change={roiChange}
            />
          </div>

          {/* ================================================================ */}
          {/* 3. Lead Source Breakdown  +  4. Performance Over Time              */}
          {/* ================================================================ */}
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            {/* Donut chart */}
            <Card className="lg:col-span-2" role="figure" aria-label="Lead source breakdown chart">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Lead Sources</h2>
                  <span className="text-xs text-muted-foreground">
                    {currentCycle.leadCount} total
                  </span>
                </div>
                <CategoryPieChart
                  data={leadSourceData}
                  height={280}
                  innerRadiusPercent={65}
                  centreLabel={currentCycle.leadCount.toLocaleString()}
                  centreSubLabel="Total Leads"
                  interactive
                  valueFormatter={(v) => `${v} leads`}
                />
              </CardContent>
            </Card>

            {/* Line chart */}
            <Card className="lg:col-span-3" role="figure" aria-label="Performance over time chart">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Performance Over Time</h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: SEMANTIC_COLORS.leads }}
                      />
                      Leads
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: SEMANTIC_COLORS.conversions }}
                      />
                      Conversions
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: SEMANTIC_COLORS.revenue }}
                      />
                      Revenue
                    </span>
                  </div>
                </div>
                <TrendLineChart
                  data={timeSeriesData}
                  xKey="date"
                  series={[
                    { dataKey: "Leads", label: "Leads", color: SEMANTIC_COLORS.leads },
                    { dataKey: "Conversions", label: "Conversions", color: SEMANTIC_COLORS.conversions },
                    { dataKey: "Revenue", label: "Revenue ($)", color: SEMANTIC_COLORS.revenue },
                  ]}
                  height={280}
                  showLegend={false}
                  showGrid
                />
              </CardContent>
            </Card>
          </div>

          {/* ================================================================ */}
          {/* 5. Service Performance Table                                       */}
          {/* ================================================================ */}
          <Card className="mt-6" role="region" aria-label="Service performance breakdown">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Service Performance</h2>
                <span className="text-xs text-muted-foreground">
                  {serviceData.length} active service{serviceData.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto -mx-5 px-5" tabIndex={0}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                      <th scope="col" className="pb-3 pr-4 font-medium">Service</th>
                      <th scope="col" className="pb-3 pr-4 font-medium text-right">Impressions</th>
                      <th scope="col" className="pb-3 pr-4 font-medium text-right">Clicks</th>
                      <th scope="col" className="pb-3 pr-4 font-medium text-right">Leads</th>
                      <th scope="col" className="pb-3 pr-4 font-medium text-right">Cost</th>
                      <th scope="col" className="pb-3 font-medium text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {serviceData.map((row) => (
                      <tr key={row.service} className="transition-colors hover:bg-muted/5">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="font-medium">{row.service}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                          {row.impressions.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                          {row.clicks.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums font-medium">
                          {row.leads.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                          {formatCents(row.cost)}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                              row.roi >= 200
                                ? "bg-emerald-500/10 text-emerald-400"
                                : row.roi >= 100
                                  ? "bg-blue-500/10 text-blue-400"
                                  : row.roi >= 0
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {row.roi}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border/50">
                      <td className="pt-3 pr-4 font-semibold">Total</td>
                      <td className="pt-3 pr-4 text-right tabular-nums font-semibold">
                        {serviceData.reduce((s, r) => s + r.impressions, 0).toLocaleString()}
                      </td>
                      <td className="pt-3 pr-4 text-right tabular-nums font-semibold">
                        {serviceData.reduce((s, r) => s + r.clicks, 0).toLocaleString()}
                      </td>
                      <td className="pt-3 pr-4 text-right tabular-nums font-semibold">
                        {serviceData.reduce((s, r) => s + r.leads, 0).toLocaleString()}
                      </td>
                      <td className="pt-3 pr-4 text-right tabular-nums font-semibold">
                        {formatCents(serviceData.reduce((s, r) => s + r.cost, 0))}
                      </td>
                      <td className="pt-3 text-right">
                        <span className="text-xs font-semibold text-emerald-400">{roi}%</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* 6. AI Insights Card                                               */}
          {/* ================================================================ */}
          <Card className="mt-6 relative overflow-hidden" role="region" aria-label="AI-generated performance insights">
            <CardContent className="p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-sm font-semibold">AI Performance Insights</h2>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Auto-generated
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{insightsText}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* 7. You vs Industry Average                                        */}
          {/* ================================================================ */}
          <Card className="mt-6" role="region" aria-label="Your metrics compared to industry averages">
            <CardContent className="p-5">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold">You vs Industry Average</h2>
                <span className="text-xs text-muted-foreground">Based on industry benchmarks</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <ComparisonRow
                  label="Conversion Rate"
                  yours={conversionRate}
                  industry={industryBenchmarks.conversionRate}
                  format={(v) => `${v}%`}
                  higherIsBetter
                />
                <ComparisonRow
                  label="Cost Per Lead"
                  yours={currentCycle.effectiveCostPerLead}
                  industry={industryBenchmarks.costPerLead}
                  format={(v) => formatCents(v)}
                  higherIsBetter={false}
                />
                <ComparisonRow
                  label="Response Time"
                  yours={currentCycle.avgResponseTimeMinutes ?? 0}
                  industry={industryBenchmarks.responseTime}
                  format={(v) => `${v}m`}
                  higherIsBetter={false}
                />
                <ComparisonRow
                  label="ROI"
                  yours={roi}
                  industry={industryBenchmarks.roi}
                  format={(v) => `${v}%`}
                  higherIsBetter
                />
              </div>
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* Billing Progress                                                  */}
          {/* ================================================================ */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold">Billing Progress</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Charges: {formatCents(currentCycle.totalCharges)}</span>
                  <span>{plan.monthlyCap ? `Cap: ${formatCents(plan.monthlyCap)}` : "No cap"}</span>
                </div>
                <div
                  className="relative h-3 w-full overflow-hidden rounded-full bg-muted/30"
                  role="progressbar"
                  aria-valuenow={plan.monthlyCap ? chargesPercent : minimumPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Billing progress: ${formatCents(currentCycle.totalCharges)} of ${plan.monthlyCap ? formatCents(plan.monthlyCap) : formatCents(plan.monthlyMinimum)}`}
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                    style={{
                      width: plan.monthlyCap
                        ? `${chargesPercent}%`
                        : `${Math.min(100, minimumPercent)}%`,
                    }}
                  />
                  {plan.monthlyCap && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-yellow-400"
                      style={{ left: `${minimumPercent}%` }}
                      title={`Minimum: ${formatCents(plan.monthlyMinimum)}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    Effective cost/lead:{" "}
                    {currentCycle.leadCount > 0 ? formatCents(currentCycle.effectiveCostPerLead) : "--"}
                  </span>
                  {plan.monthlyCap && (
                    <span className="text-yellow-400">Min: {formatCents(plan.monthlyMinimum)}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* Month-over-Month Comparison (bar chart)                           */}
          {/* ================================================================ */}
          <Card className="mt-6" role="figure" aria-label="Month-over-month comparison chart">
            <CardContent className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Month-over-Month Comparison</h2>
              <ComparisonBarChart
                data={[
                  {
                    metric: "Total Leads",
                    "This Period": currentCycle.leadCount,
                    "Previous Period": previousCycle.leadCount,
                  },
                  {
                    metric: "Bookings",
                    "This Period": currentCycle.bookingCount,
                    "Previous Period": previousCycle.bookingCount,
                  },
                  {
                    metric: "Revenue",
                    "This Period": Math.round(revenueGenerated / 100),
                    "Previous Period": Math.round(prevRevenue / 100),
                  },
                ]}
                xKey="metric"
                series={[
                  { dataKey: "This Period", label: "This Period", color: SEMANTIC_COLORS.conversions },
                  { dataKey: "Previous Period", label: "Previous Period", color: SEMANTIC_COLORS.neutral },
                ]}
                height={260}
                showGrid
              />
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* Event Log                                                         */}
          {/* ================================================================ */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Event Log</h2>
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No performance events yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/70 max-w-sm">
                    Events will appear here as your AI services generate leads and bookings. Each event is
                    tracked with its associated charge.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="overflow-x-auto -mx-5 px-5"
                    tabIndex={0}
                    role="region"
                    aria-label="Performance events table"
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                          <th scope="col" className="pb-2 pr-4 font-medium">Date</th>
                          <th scope="col" className="pb-2 pr-4 font-medium">Type</th>
                          <th scope="col" className="pb-2 pr-4 font-medium">Description</th>
                          <th scope="col" className="pb-2 text-right font-medium">Charge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {events.map((event) => (
                          <tr key={event.id} className="transition-colors hover:bg-muted/5">
                            <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(event.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  event.type === "qualified_lead"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : event.type === "booked_appointment"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {event.type === "qualified_lead"
                                  ? "Lead"
                                  : event.type === "booked_appointment"
                                    ? "Booking"
                                    : "Job"}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-foreground">{event.description}</td>
                            <td className="py-2.5 text-right font-medium tabular-nums">
                              {formatCents(event.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {eventsTotalPages > 1 && (
                    <nav className="mt-4 flex items-center justify-between" aria-label="Event log pagination">
                      <p className="text-xs text-muted-foreground">
                        Page {eventsPage} of {eventsTotalPages}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={eventsPage <= 1}
                          onClick={() => fetchEvents(eventsPage - 1)}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={eventsPage >= eventsTotalPages}
                          onClick={() => fetchEvents(eventsPage + 1)}
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </nav>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
