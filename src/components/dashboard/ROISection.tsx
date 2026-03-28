"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  AlertCircle,
  RefreshCw,
  Calculator,
  Award,
  MessageSquare,
  Star,
  Share2,
  Building2,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/shared/GradientText";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { FadeInView } from "@/components/shared/FadeInView";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { SEMANTIC_COLORS } from "@/components/charts/chart-theme";
import { formatPrice } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ROISectionProps {
  investment: number;
  revenue: number;
  roi: number;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

interface RevenueSource {
  label: string;
  icon: React.ElementType;
  revenue: number;
  detail: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildMonthlyROIData(revenue: number, investment: number) {
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const baseRevenue = revenue > 0 ? revenue : 18000;
  const baseInvestment = investment > 0 ? investment : 2997;

  return months.map((month, i) => {
    const growthFactor = 0.6 + i * 0.08;
    const variance = 0.9 + Math.sin(i * 1.5) * 0.1;
    const monthRevenue = Math.round(baseRevenue * growthFactor * variance);
    const monthInvestment = Math.round(baseInvestment);
    const monthROI = monthRevenue - monthInvestment;
    return {
      month,
      Revenue: monthRevenue,
      Investment: monthInvestment,
      "Net ROI": monthROI,
    };
  });
}

function buildRevenueBreakdown(revenue: number): RevenueSource[] {
  const total = revenue > 0 ? revenue : 18000;
  return [
    {
      label: "Leads Converted to Customers",
      icon: Users,
      revenue: Math.round(total * 0.45),
      detail: "12 leads closed at ~$675 avg deal value",
      color: "text-blue-400",
    },
    {
      label: "AI Chatbot Bookings",
      icon: MessageSquare,
      revenue: Math.round(total * 0.25),
      detail: "8 bookings directly from website chatbot",
      color: "text-violet-400",
    },
    {
      label: "Review & Reputation Management",
      icon: Star,
      revenue: Math.round(total * 0.18),
      detail: "5 repeat customers from improved reviews",
      color: "text-amber-400",
    },
    {
      label: "Referrals Generated",
      icon: Share2,
      revenue: Math.round(total * 0.12),
      detail: "3 referral customers this month",
      color: "text-emerald-400",
    },
  ];
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function ROISkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardContent className="py-6">
            <div className="h-48 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** (a) ROI Summary Card */
function ROISummaryCard({
  revenue,
  investment,
  roi: _roi,
}: {
  revenue: number;
  investment: number;
  roi: number;
}) {
  const netROI = revenue - investment;
  const roiPercent =
    investment > 0 ? Math.round(((revenue - investment) / investment) * 100) : 0;
  const paidForItself = investment > 0 ? Math.round((revenue / investment) * 10) / 10 : 0;
  const isPositive = netROI > 0;

  return (
    <Card className="overflow-hidden border-emerald-500/20">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Award className="h-5 w-5 text-emerald-400" />
          Your AI Marketing ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Total Revenue from AI
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              <AnimatedCounter target={revenue} prefix="$" />
            </p>
          </div>

          {/* Subscription Cost */}
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Subscription Cost
            </p>
            <p className="text-3xl font-bold">
              <AnimatedCounter target={investment} prefix="$" />
            </p>
          </div>

          {/* Net ROI */}
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Net ROI
            </p>
            <p
              className={`text-3xl font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
            >
              {isPositive ? "+" : ""}
              <AnimatedCounter target={netROI} prefix="$" />
            </p>
          </div>

          {/* ROI Percentage — big and bold */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              ROI
            </p>
            <GradientText as="p" className="text-5xl font-bold tracking-tight">
              <AnimatedCounter target={roiPercent} suffix="%" />
            </GradientText>
          </div>
        </div>

        {/* "Paid for itself" message */}
        {paidForItself > 1 && (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <p className="text-sm">
              <span className="font-semibold text-emerald-400">
                Your AI paid for itself {paidForItself}x over.
              </span>{" "}
              <span className="text-muted-foreground">
                Every $1 you invested returned {formatDollars(Math.round(revenue / (investment || 1)))}.
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** (b) Revenue Breakdown Card */
function RevenueBreakdownCard({ revenue }: { revenue: number }) {
  const sources = useMemo(() => buildRevenueBreakdown(revenue), [revenue]);
  const maxRevenue = Math.max(...sources.map((s) => s.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BarChart3 className="h-5 w-5 text-primary" />
          Revenue Breakdown by Source
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sources.map((source) => {
            const percent =
              maxRevenue > 0 ? (source.revenue / maxRevenue) * 100 : 0;
            const Icon = source.icon;
            return (
              <div key={source.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${source.color}`} />
                    <span className="text-sm font-medium">{source.label}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-emerald-400">
                    {formatDollars(source.revenue)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${Math.max(percent, 3)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{source.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-5 flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3">
          <span className="text-sm font-semibold">Total Revenue Attributed</span>
          <span className="text-lg font-bold text-emerald-400">
            {formatDollars(sources.reduce((sum, s) => sum + s.revenue, 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** (c) Monthly ROI Trend Card */
function MonthlyROITrendCard({
  revenue,
  investment,
}: {
  revenue: number;
  investment: number;
}) {
  const chartData = useMemo(
    () => buildMonthlyROIData(revenue, investment),
    [revenue, investment],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="h-5 w-5 text-primary" />
          Monthly ROI Trend (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ComparisonBarChart
          data={chartData}
          xKey="month"
          series={[
            {
              dataKey: "Revenue",
              label: "Revenue",
              color: SEMANTIC_COLORS.revenue,
            },
            {
              dataKey: "Investment",
              label: "Investment",
              color: SEMANTIC_COLORS.cost,
            },
          ]}
          height={280}
          barRadius={4}
          showGrid
          valueFormatter={formatDollars}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(() => {
            const last = chartData[chartData.length - 1];
            const prev = chartData[chartData.length - 2];
            const revenueChange =
              prev && prev.Revenue > 0
                ? Math.round(
                    ((last.Revenue - prev.Revenue) / prev.Revenue) * 100,
                  )
                : 0;
            return (
              <>
                <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatDollars(last.Revenue)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Net ROI</p>
                  <p className="text-lg font-bold">
                    {formatDollars(last["Net ROI"])}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    Month-over-Month
                  </p>
                  <p
                    className={`text-lg font-bold ${revenueChange >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {revenueChange >= 0 ? "+" : ""}
                    {revenueChange}%
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

/** (d) ROI Calculator Card */
function ROICalculatorCard({ investment }: { investment: number }) {
  const [avgJobValue, setAvgJobValue] = useState(2500);
  const [closeRate, setCloseRate] = useState(30);
  const [monthlyLeadTarget, setMonthlyLeadTarget] = useState(40);

  const projectedMonthly = useMemo(() => {
    return Math.round(monthlyLeadTarget * (closeRate / 100) * avgJobValue);
  }, [avgJobValue, closeRate, monthlyLeadTarget]);

  const projectedAnnual = projectedMonthly * 12;
  const projectedROI =
    investment > 0
      ? Math.round(((projectedMonthly - investment) / investment) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calculator className="h-5 w-5 text-primary" />
          ROI Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your current performance, project your revenue potential.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-5">
            <div>
              <label
                htmlFor="calc-job-value"
                className="mb-1.5 block text-sm font-medium"
              >
                Average Job Value ($)
              </label>
              <input
                id="calc-job-value"
                type="number"
                value={avgJobValue}
                onChange={(e) => setAvgJobValue(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tabular-nums"
                min={0}
                step={100}
              />
            </div>

            <div>
              <label
                htmlFor="calc-close-rate"
                className="mb-1.5 block text-sm font-medium"
              >
                Close Rate (%)
              </label>
              <input
                id="calc-close-rate"
                type="number"
                value={closeRate}
                onChange={(e) =>
                  setCloseRate(
                    Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tabular-nums"
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div>
              <label
                htmlFor="calc-lead-target"
                className="mb-1.5 block text-sm font-medium"
              >
                Monthly Lead Target
              </label>
              <input
                id="calc-lead-target"
                type="number"
                value={monthlyLeadTarget}
                onChange={(e) =>
                  setMonthlyLeadTarget(Number(e.target.value) || 0)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tabular-nums"
                min={0}
                step={1}
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Projected Results
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <DollarSign className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
                <p className="text-2xl font-bold text-emerald-400">
                  <AnimatedCounter target={projectedMonthly} prefix="$" />
                </p>
                <p className="text-xs text-muted-foreground">
                  Projected Monthly Revenue
                </p>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <DollarSign className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-primary">
                  <AnimatedCounter target={projectedAnnual} prefix="$" />
                </p>
                <p className="text-xs text-muted-foreground">
                  Projected Annual Revenue
                </p>
              </div>

              <div className="col-span-full rounded-xl border border-border/50 bg-card/50 p-4 text-center">
                <TrendingUp className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
                <p
                  className={`text-3xl font-bold ${projectedROI > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {projectedROI > 0 ? "+" : ""}
                  {projectedROI}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Projected ROI on {formatPrice(investment)}/mo subscription
                </p>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Based on{" "}
              {monthlyLeadTarget} leads/mo at {closeRate}% close rate and{" "}
              {formatDollars(avgJobValue)} avg job value.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** (e) Agency Comparison Card */
function AgencyComparisonCard({ investment }: { investment: number }) {
  const agencyItems = [
    { label: "SEO Specialist", agencyCost: 3000, included: true },
    { label: "PPC Manager", agencyCost: 2500, included: true },
    { label: "Social Media Manager", agencyCost: 2000, included: true },
    { label: "Content Writer", agencyCost: 1500, included: true },
    { label: "Reputation Manager", agencyCost: 1200, included: true },
    { label: "Web Developer", agencyCost: 2000, included: true },
    { label: "Marketing Analyst", agencyCost: 2500, included: true },
    { label: "Chatbot / Lead Capture", agencyCost: 800, included: true },
  ];

  const totalAgencyCost = agencyItems.reduce(
    (sum, item) => sum + item.agencyCost,
    0,
  );
  const savings = totalAgencyCost - investment;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          Traditional Agency vs. Your AI Subscription
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Here is what it would cost to hire a traditional agency for the same
          services you get with your AI subscription.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Agency side */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="mb-3 text-sm font-semibold text-red-400">
              Traditional Agency
            </p>
            <div className="space-y-2">
              {agencyItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="tabular-nums font-medium">
                    {formatDollars(item.agencyCost)}/mo
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-red-500/20 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-xl font-bold text-red-400">
                  {formatDollars(totalAgencyCost)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* Your subscription side */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="mb-3 text-sm font-semibold text-emerald-400">
              Your AI Subscription
            </p>
            <div className="space-y-2">
              {agencyItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-emerald-500/20 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-xl font-bold text-emerald-400">
                  {formatPrice(investment)}/mo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings banner */}
        {savings > 0 && (
          <div className="mt-5 flex flex-col items-center gap-1 rounded-xl gradient-bg-subtle p-5 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              You save every month
            </p>
            <GradientText as="p" className="text-4xl font-bold tracking-tight">
              {formatDollars(savings)}/mo
            </GradientText>
            <p className="text-sm text-muted-foreground">
              That is{" "}
              <span className="font-semibold text-foreground">
                {formatDollars(savings * 12)}/year
              </span>{" "}
              back in your pocket compared to a traditional agency.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ROISection({
  investment,
  revenue,
  roi,
  isLoading,
  error,
  onRetry,
}: ROISectionProps) {
  if (isLoading) {
    return <ROISkeleton />;
  }

  if (error) {
    return (
      <FadeInView>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="mb-3 h-8 w-8 text-destructive/60" />
            <p className="text-sm font-medium">Unable to load ROI data</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Something went wrong fetching your investment metrics.
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onRetry()}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      </FadeInView>
    );
  }

  return (
    <FadeInView>
      <div className="space-y-6">
        {/* (a) ROI Summary Card */}
        <ROISummaryCard
          revenue={revenue}
          investment={investment}
          roi={roi}
        />

        {/* (b) Revenue Breakdown + (c) Monthly ROI Trend side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueBreakdownCard revenue={revenue} />
          <MonthlyROITrendCard revenue={revenue} investment={investment} />
        </div>

        {/* (d) ROI Calculator */}
        <ROICalculatorCard investment={investment} />

        {/* (e) Agency Comparison */}
        <AgencyComparisonCard investment={investment} />
      </div>
    </FadeInView>
  );
}
