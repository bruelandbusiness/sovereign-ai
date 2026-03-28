"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  ChevronRight,
  Users,
  MapPin,
  Crown,
  Globe,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeInView } from "@/components/shared/FadeInView";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BenchmarkMetric {
  metric: string;
  label: string;
  yourValue: number;
  industryAvg: number;
  top10: number;
  percentile: number;
  unit: string;
  higherIsBetter: boolean;
  sampleSize: number;
  format: "number" | "percent" | "currency" | "time";
}

interface TrendPoint {
  month: string;
  percentile: number;
}

type PeerGroup = "trade" | "region" | "plan" | "all";

/* ------------------------------------------------------------------ */
/*  Demo Data by Peer Group                                            */
/* ------------------------------------------------------------------ */

const TRADE = "HVAC";

function getDemoMetrics(group: PeerGroup): readonly BenchmarkMetric[] {
  const base: readonly BenchmarkMetric[] = [
    {
      metric: "monthly_leads",
      label: "Monthly Leads",
      yourValue: 47,
      industryAvg: 32,
      top10: 68,
      percentile: 72,
      unit: "",
      higherIsBetter: true,
      sampleSize: 1842,
      format: "number",
    },
    {
      metric: "conversion_rate",
      label: "Conversion Rate",
      yourValue: 18.4,
      industryAvg: 22.1,
      top10: 34.5,
      percentile: 38,
      unit: "%",
      higherIsBetter: true,
      sampleSize: 1842,
      format: "percent",
    },
    {
      metric: "review_score",
      label: "Review Score",
      yourValue: 4.8,
      industryAvg: 4.2,
      top10: 4.9,
      percentile: 91,
      unit: "",
      higherIsBetter: true,
      sampleSize: 1842,
      format: "number",
    },
    {
      metric: "response_time",
      label: "Avg Response Time",
      yourValue: 12,
      industryAvg: 47,
      top10: 8,
      percentile: 88,
      unit: "min",
      higherIsBetter: false,
      sampleSize: 1842,
      format: "time",
    },
    {
      metric: "revenue_per_lead",
      label: "Revenue per Lead",
      yourValue: 285,
      industryAvg: 210,
      top10: 420,
      percentile: 65,
      unit: "$",
      higherIsBetter: true,
      sampleSize: 1842,
      format: "currency",
    },
    {
      metric: "review_response_rate",
      label: "Review Response Rate",
      yourValue: 94,
      industryAvg: 58,
      top10: 96,
      percentile: 95,
      unit: "%",
      higherIsBetter: true,
      sampleSize: 1842,
      format: "percent",
    },
  ];

  const modifiers: Record<PeerGroup, (m: BenchmarkMetric) => BenchmarkMetric> =
    {
      trade: (m) => m,
      region: (m) => ({
        ...m,
        percentile: Math.min(99, Math.round(m.percentile * 1.04)),
        industryAvg: Math.round(m.industryAvg * 0.95 * 10) / 10,
        sampleSize: 312,
      }),
      plan: (m) => ({
        ...m,
        percentile: Math.max(5, Math.round(m.percentile * 0.92)),
        industryAvg: Math.round(m.industryAvg * 1.08 * 10) / 10,
        top10: Math.round(m.top10 * 1.05 * 10) / 10,
        sampleSize: 487,
      }),
      all: (m) => ({
        ...m,
        percentile: Math.min(99, Math.round(m.percentile * 1.06)),
        industryAvg: Math.round(m.industryAvg * 0.9 * 10) / 10,
        sampleSize: 5230,
      }),
    };

  return base.map(modifiers[group]);
}

const TREND_DATA: readonly TrendPoint[] = [
  { month: "Oct", percentile: 54 },
  { month: "Nov", percentile: 58 },
  { month: "Dec", percentile: 61 },
  { month: "Jan", percentile: 64 },
  { month: "Feb", percentile: 68 },
  { month: "Mar", percentile: 71 },
];

const PEER_GROUP_OPTIONS: readonly {
  value: PeerGroup;
  label: string;
  icon: typeof Users;
}[] = [
  { value: "trade", label: `Same Trade (${TRADE})`, icon: Users },
  { value: "region", label: "Same Region", icon: MapPin },
  { value: "plan", label: "Same Plan Tier", icon: Crown },
  { value: "all", label: "All Businesses", icon: Globe },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatMetricValue(value: number, format: string, unit: string): string {
  switch (format) {
    case "currency":
      return `$${value.toLocaleString()}`;
    case "percent":
      return `${value}%`;
    case "time":
      return `${value} ${unit}`;
    default:
      return `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
  }
}

function percentileColor(p: number): string {
  if (p >= 80) return "text-emerald-400";
  if (p >= 60) return "text-blue-400";
  if (p >= 40) return "text-amber-400";
  return "text-red-400";
}

function percentileBadgeClass(p: number): string {
  if (p >= 80)
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (p >= 60) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (p >= 40) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

function barGradient(p: number): string {
  if (p >= 80) return "bg-gradient-to-r from-emerald-500 to-emerald-400";
  if (p >= 60) return "bg-gradient-to-r from-blue-500 to-blue-400";
  if (p >= 40) return "bg-gradient-to-r from-amber-500 to-amber-400";
  return "bg-gradient-to-r from-red-500 to-red-400";
}

/* ------------------------------------------------------------------ */
/*  Actionable Tips Mapping                                            */
/* ------------------------------------------------------------------ */

const IMPROVEMENT_TIPS: Record<string, string> = {
  monthly_leads:
    "Boost lead volume by adding a click-to-call button on every page and running Google Local Services Ads targeting emergency HVAC searches.",
  conversion_rate:
    "Improve conversions by following up within 5 minutes of each inquiry. Businesses that respond in under 5 min convert at 3x the rate.",
  review_score:
    "Increase your score by sending a review request text within 30 minutes of job completion, when satisfaction is highest.",
  response_time:
    "Set up auto-reply texts for after-hours inquiries so leads know you received their message and will follow up.",
  revenue_per_lead:
    "Upsell maintenance plans during service calls. Top performers bundle a 1-year plan with every install, lifting average revenue by 40%.",
  review_response_rate:
    "Reply to every review (positive and negative) within 24 hours. Personalized responses increase repeat bookings by 18%.",
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function PercentileRing({ percentile }: { percentile: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentile / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width="140"
        height="140"
        viewBox="0 0 128 128"
        className="-rotate-90"
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/40"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary) / 0.6)"
            />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-primary">
          {percentile}
          <span className="text-lg">{ordinalSuffix(percentile)}</span>
        </span>
        <span className="text-xs text-muted-foreground">percentile</span>
      </div>
    </div>
  );
}

function MetricCard({ m }: { m: BenchmarkMetric }) {
  const yourFormatted = formatMetricValue(m.yourValue, m.format, m.unit);
  const avgFormatted = formatMetricValue(m.industryAvg, m.format, m.unit);
  const top10Formatted = formatMetricValue(m.top10, m.format, m.unit);

  const isAboveAvg = m.higherIsBetter
    ? m.yourValue >= m.industryAvg
    : m.yourValue <= m.industryAvg;

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            {m.label}
          </p>
          <Badge variant="outline" className={percentileBadgeClass(m.percentile)}>
            {m.percentile}
            {ordinalSuffix(m.percentile)} pctl
          </Badge>
        </div>

        {/* Your value */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold">{yourFormatted}</span>
          {isAboveAvg ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
        </div>

        {/* Comparison rows */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Industry Avg</span>
            <span className="font-medium">{avgFormatted}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Top 10%</span>
            <span className="font-medium text-emerald-400">
              {top10Formatted}
            </span>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="space-y-1">
          <div
            className="relative h-2.5 w-full rounded-full bg-muted/50 overflow-hidden"
            role="progressbar"
            aria-valuenow={m.percentile}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${m.label}: ${m.percentile}${ordinalSuffix(m.percentile)} percentile`}
          >
            {/* Background track markers */}
            <div className="absolute left-1/2 top-0 h-full w-px bg-muted-foreground/20" />
            <div className="absolute left-[90%] top-0 h-full w-px bg-emerald-500/30" />
            {/* Fill */}
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${barGradient(m.percentile)}`}
              style={{ width: `${m.percentile}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0th</span>
            <span>50th</span>
            <span>90th</span>
            <span>100th</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-right mt-2">
          {m.sampleSize.toLocaleString()} businesses sampled
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function BenchmarksPage() {
  const [peerGroup, setPeerGroup] = useState<PeerGroup>("trade");

  const metrics = useMemo(() => getDemoMetrics(peerGroup), [peerGroup]);

  const overallPercentile = useMemo(
    () =>
      metrics.length > 0
        ? Math.round(
            metrics.reduce((s, m) => s + m.percentile, 0) / metrics.length,
          )
        : 50,
    [metrics],
  );

  const strengths = useMemo(
    () =>
      [...metrics]
        .filter((m) => m.percentile >= 70)
        .sort((a, b) => b.percentile - a.percentile),
    [metrics],
  );

  const weaknesses = useMemo(
    () =>
      [...metrics]
        .filter((m) => m.percentile < 70)
        .sort((a, b) => a.percentile - b.percentile),
    [metrics],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          {/* Page header */}
          <FadeInView>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Industry Benchmarks
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                See how your business stacks up against other {TRADE}{" "}
                companies
              </p>
            </div>
          </FadeInView>

          {/* ── Peer Group Selector ── */}
          <FadeInView>
            <div className="mb-8">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Compare against
              </p>
              <div className="flex flex-wrap gap-2">
                {PEER_GROUP_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = peerGroup === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setPeerGroup(opt.value)}
                      className={`
                        inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                        border transition-all
                        ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </FadeInView>

          {/* ── Overall Ranking Hero ── */}
          <FadeInView>
            <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                <PercentileRing percentile={overallPercentile} />
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-semibold mb-1">
                    You rank in the{" "}
                    <span className={`font-bold ${percentileColor(overallPercentile)}`}>
                      top {100 - overallPercentile}%
                    </span>{" "}
                    of {TRADE} businesses
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Based on {metrics.length} key performance metrics across{" "}
                    {metrics[0]?.sampleSize.toLocaleString() ?? "---"} businesses
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeInView>

          {/* ── Metric Comparison Cards ── */}
          <FadeInView>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-lg font-semibold">Metric Comparison</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your value vs. industry average and top 10% benchmark
            </p>
          </FadeInView>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {metrics.map((m) => (
              <FadeInView key={m.metric}>
                <MetricCard m={m} />
              </FadeInView>
            ))}
          </div>

          {/* ── Strengths & Weaknesses ── */}
          <div className="grid gap-6 md:grid-cols-2 mb-10">
            {/* Strengths */}
            <FadeInView>
              <Card className="border-emerald-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold">Your Strengths</h2>
                  </div>
                  {strengths.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Keep improving — you are getting there!
                    </p>
                  )}
                  <ul className="space-y-3">
                    {strengths.map((s) => (
                      <li key={s.metric} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                          {s.percentile}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{s.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Top {100 - s.percentile}% — You excel here
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeInView>

            {/* Weaknesses */}
            <FadeInView>
              <Card className="border-amber-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-semibold">Room to Improve</h2>
                  </div>
                  {weaknesses.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Amazing — no weak spots detected!
                    </p>
                  )}
                  <ul className="space-y-3">
                    {weaknesses.map((w) => (
                      <li key={w.metric} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                          {w.percentile}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{w.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Bottom {w.percentile < 50 ? w.percentile : 100 - w.percentile}% — Focus area
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeInView>
          </div>

          {/* ── Trend Over Time ── */}
          <FadeInView>
            <Card className="mb-10">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Ranking Trend (Last 6 Months)
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Your overall percentile ranking over time
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={TREND_DATA as TrendPoint[]}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--muted))"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}th`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                          fontSize: 13,
                        }}
                        formatter={(value) => {
                          const v = Number(value);
                          return [`${v}${ordinalSuffix(v)} percentile`, "Ranking"];
                        }}
                      />
                      <ReferenceLine
                        y={50}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        opacity={0.4}
                        label={{
                          value: "Median",
                          position: "left",
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentile"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{
                          fill: "hsl(var(--primary))",
                          r: 5,
                          strokeWidth: 2,
                          stroke: "hsl(var(--card))",
                        }}
                        activeDot={{
                          r: 7,
                          fill: "hsl(var(--primary))",
                          stroke: "hsl(var(--card))",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">
                    +{TREND_DATA[TREND_DATA.length - 1].percentile - TREND_DATA[0].percentile}{" "}
                    percentile points
                  </span>
                  <span className="text-muted-foreground">
                    improvement over 6 months
                  </span>
                </div>
              </CardContent>
            </Card>
          </FadeInView>

          {/* ── Actionable Tips ── */}
          {weaknesses.length > 0 && (
            <FadeInView>
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold">
                  Actionable Tips to Improve
                </h2>
              </div>
              <div className="space-y-3 mb-10">
                {weaknesses.map((w) => (
                  <Card
                    key={w.metric}
                    className="border-amber-500/10 hover:border-amber-500/30 transition-colors"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                          <ChevronRight className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{w.label}</p>
                            <Badge
                              variant="outline"
                              className={percentileBadgeClass(w.percentile)}
                            >
                              {w.percentile}
                              {ordinalSuffix(w.percentile)} pctl
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {IMPROVEMENT_TIPS[w.metric] ??
                              "Focus on consistent improvement in this area to move up the rankings."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInView>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
