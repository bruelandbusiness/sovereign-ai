"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Target,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientText } from "@/components/shared/GradientText";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { CHART_COLORS, SEMANTIC_COLORS } from "@/components/charts/chart-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChannelBreakdown {
  channel: string;
  leads: number;
  won: number;
  revenue: number;
}

interface MonthOverMonth {
  revenueChange: number;
  leadChange: number;
  winChange: number;
  prevRevenue: number;
  prevLeads: number;
  prevWon: number;
}

interface RealtimeROIData {
  totalLeads: number;
  leadsContacted: number;
  leadsBooked: number;
  leadsWon: number;
  totalRevenue: number;
  totalInvestment: number;
  roi: number;
  costPerLead: number;
  costPerBooking: number;
  conversionRate: number;
  channelBreakdown: ChannelBreakdown[];
  monthOverMonth: MonthOverMonth;
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

function ChangeIndicator({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value)}% {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ROIRealtimeDashboard() {
  const [data, setData] = useState<RealtimeROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dashboard/roi/realtime", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ROI data");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-sm text-muted-foreground">
            Loading ROI metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-sm text-red-400">
            {error || "Failed to load ROI data"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxChannelRevenue = Math.max(
    ...data.channelBreakdown.map((c) => c.revenue),
    1,
  );

  return (
    <FadeInView>
      <div className="space-y-6">
        {/* ── Hero Metrics ─────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Revenue */}
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Total Revenue Generated
              </div>
              <p className="mt-2 text-3xl font-bold text-emerald-400">
                <AnimatedCounter
                  target={data.totalRevenue}
                  prefix="$"
                  decimals={0}
                />
              </p>
              <ChangeIndicator
                value={data.monthOverMonth.revenueChange}
                label="vs last month"
              />
            </CardContent>
          </Card>

          {/* ROI Multiplier */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center p-5">
              <div className="text-sm text-muted-foreground">
                ROI Multiplier
              </div>
              <GradientText
                as="p"
                className="text-5xl font-bold tracking-tight"
              >
                <AnimatedCounter
                  target={data.roi}
                  suffix="x"
                  decimals={1}
                />
              </GradientText>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDollars(data.totalRevenue)} earned on{" "}
                {formatDollars(data.totalInvestment)} invested
              </p>
            </CardContent>
          </Card>

          {/* Investment */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                Total Investment
              </div>
              <p className="mt-2 text-3xl font-bold">
                <AnimatedCounter
                  target={data.totalInvestment}
                  prefix="$"
                  decimals={0}
                />
              </p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Conversion Funnel ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Target className="h-5 w-5 text-primary" />
              Lead Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FunnelBar
                label="Total Leads"
                count={data.totalLeads}
                percent={100}
                color="bg-blue-500"
              />
              <FunnelBar
                label="Contacted"
                count={data.leadsContacted}
                percent={
                  data.totalLeads > 0
                    ? (data.leadsContacted / data.totalLeads) * 100
                    : 0
                }
                color="bg-amber-500"
              />
              <FunnelBar
                label="Booked"
                count={data.leadsBooked}
                percent={
                  data.totalLeads > 0
                    ? (data.leadsBooked / data.totalLeads) * 100
                    : 0
                }
                color="bg-orange-500"
              />
              <FunnelBar
                label="Won"
                count={data.leadsWon}
                percent={
                  data.totalLeads > 0
                    ? (data.leadsWon / data.totalLeads) * 100
                    : 0
                }
                color="bg-emerald-500"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-muted-foreground">
                Conversion rate:{" "}
                <span className="font-semibold text-emerald-400">
                  {data.conversionRate}%
                </span>
              </span>
              <ChangeIndicator
                value={data.monthOverMonth.winChange}
                label="vs last month"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Cost Metrics + Channel Breakdown ───────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cost Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <DollarSign className="h-5 w-5 text-primary" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CostMetric
                  label="Cost per Lead"
                  value={data.costPerLead}
                  context={`${data.totalLeads} leads this month`}
                />
                <CostMetric
                  label="Cost per Booking"
                  value={data.costPerBooking}
                  context={`${data.leadsBooked} bookings this month`}
                />
                <CostMetric
                  label="Cost per Won Job"
                  value={
                    data.leadsWon > 0
                      ? Math.round(
                          (data.totalInvestment / data.leadsWon) * 100,
                        ) / 100
                      : 0
                  }
                  context={`${data.leadsWon} jobs won this month`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Channel Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-5 w-5 text-primary" />
                Revenue by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.channelBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No channel data yet. Mark leads as won to see revenue by
                  source.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Donut chart visualization */}
                  <CategoryPieChart
                    data={data.channelBreakdown.map((ch, i) => ({
                      name: ch.channel,
                      value: ch.revenue,
                      color: CHART_COLORS[i % CHART_COLORS.length],
                    }))}
                    height={240}
                    centreLabel={formatDollars(
                      data.channelBreakdown.reduce((sum, ch) => sum + ch.revenue, 0),
                    )}
                    centreSubLabel="Total Revenue"
                    valueFormatter={formatDollars}
                  />

                  {/* Detailed bars underneath */}
                  <div className="space-y-3">
                    {data.channelBreakdown.map((ch) => (
                      <ChannelBar
                        key={ch.channel}
                        channel={ch.channel}
                        revenue={ch.revenue}
                        leads={ch.leads}
                        won={ch.won}
                        maxRevenue={maxChannelRevenue}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Month Over Month Trend ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Month-over-Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Bar chart comparing this month vs last month */}
            <ComparisonBarChart
              data={[
                {
                  metric: "Revenue",
                  "This Month": data.totalRevenue,
                  "Last Month": data.monthOverMonth.prevRevenue,
                },
                {
                  metric: "Leads",
                  "This Month": data.totalLeads,
                  "Last Month": data.monthOverMonth.prevLeads,
                },
                {
                  metric: "Wins",
                  "This Month": data.leadsWon,
                  "Last Month": data.monthOverMonth.prevWon,
                },
              ]}
              xKey="metric"
              series={[
                { dataKey: "This Month", label: "This Month", color: SEMANTIC_COLORS.revenue },
                { dataKey: "Last Month", label: "Last Month", color: SEMANTIC_COLORS.neutral },
              ]}
              height={240}
              showGrid
            />

            {/* Summary stats below chart */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TrendStat
                label="Revenue"
                current={formatDollars(data.totalRevenue)}
                change={data.monthOverMonth.revenueChange}
              />
              <TrendStat
                label="Leads"
                current={String(data.totalLeads)}
                change={data.monthOverMonth.leadChange}
              />
              <TrendStat
                label="Wins"
                current={String(data.leadsWon)}
                change={data.monthOverMonth.winChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FunnelBar({
  label,
  count,
  percent,
  color,
}: {
  label: string;
  count: number;
  percent: number;
  color: string;
}) {
  const displayPercent = Math.max(percent, 2); // min width for visibility
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {count}{" "}
          <span className="text-xs text-muted-foreground">
            ({Math.round(percent)}%)
          </span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
    </div>
  );
}

function CostMetric({
  label,
  value,
  context,
}: {
  label: string;
  value: number;
  context: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{context}</p>
      </div>
      <p className="text-lg font-bold tabular-nums">{formatDollars(value)}</p>
    </div>
  );
}

function ChannelBar({
  channel,
  revenue,
  leads,
  won,
  maxRevenue,
}: {
  channel: string;
  revenue: number;
  leads: number;
  won: number;
  maxRevenue: number;
}) {
  const widthPercent = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium capitalize">{channel}</span>
        <span className="tabular-nums text-emerald-400">
          {formatDollars(revenue)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${Math.max(widthPercent, 2)}%` }}
        />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>{leads} leads</span>
        <span>{won} won</span>
      </div>
    </div>
  );
}

function TrendStat({
  label,
  current,
  change,
}: {
  label: string;
  current: string;
  change: number;
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{current}</p>
      {!isNeutral && (
        <p
          className={`mt-0.5 text-sm font-semibold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "\u2191" : "\u2193"} {Math.abs(change)}% vs last month
        </p>
      )}
      {isNeutral && (
        <p className="mt-0.5 text-sm text-muted-foreground">No change</p>
      )}
    </div>
  );
}
