"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { CumulativeAreaChart } from "@/components/charts/CumulativeAreaChart";
import { SEMANTIC_COLORS } from "@/components/charts/chart-theme";
import { formatCompactCurrency } from "@/lib/formatters";
import type { KPIData, DashboardLead, ROIData } from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardChartsProps {
  leads: DashboardLead[];
  kpis: KPIData[];
  roiData: ROIData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Aggregate leads by date into daily counts for the last 30 days.
 * Returns data sorted chronologically (oldest first).
 */
function buildLeadTrendData(leads: DashboardLead[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    buckets.set(key, 0);
  }

  for (const lead of leads) {
    const d = new Date(lead.date);
    if (d >= thirtyDaysAgo) {
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }
  }

  let cumulative = 0;
  return Array.from(buckets.entries()).map(([date, count]) => {
    cumulative += count;
    return { date, leads: count, cumulative };
  });
}

/**
 * Build source breakdown from lead data for the donut chart.
 */
function buildSourceBreakdown(leads: DashboardLead[]) {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const source = lead.source || "Unknown";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Generate mock service performance data for bar chart */
function buildServicePerformanceData(leads: DashboardLead[]) {
  // If we have real leads, group by source as a proxy for service
  if (leads.length > 0) {
    const sourceMap = new Map<string, { leads: number; conversions: number }>();
    for (const lead of leads) {
      const source = lead.source || "Direct";
      const existing = sourceMap.get(source) ?? { leads: 0, conversions: 0 };
      existing.leads += 1;
      if (lead.status === "won" || lead.status === "appointment") {
        existing.conversions += 1;
      }
      sourceMap.set(source, existing);
    }
    return Array.from(sourceMap.entries())
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 6);
  }

  // Fallback: sample data so the chart is never empty
  return [
    { service: "SEO", leads: 28, conversions: 12 },
    { service: "Google Ads", leads: 22, conversions: 9 },
    { service: "Chatbot", leads: 18, conversions: 14 },
    { service: "Social", leads: 15, conversions: 6 },
    { service: "Email", leads: 12, conversions: 8 },
    { service: "Referrals", leads: 9, conversions: 5 },
  ];
}

/** Generate monthly revenue trend data */
function buildRevenueTrendData(roiData: ROIData) {
  const months = [
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  ];

  // Scale mock data relative to actual ROI revenue if available
  const baseRevenue = roiData.revenue > 0 ? roiData.revenue / 12 : 2400;
  const baseInvestment = roiData.investment > 0 ? roiData.investment / 12 : 800;

  return months.map((month, i) => {
    const growth = 1 + i * 0.06;
    const variance = 0.85 + Math.sin(i * 1.2) * 0.15;
    return {
      month,
      revenue: Math.round(baseRevenue * growth * variance),
      investment: Math.round(baseInvestment * (1 + i * 0.02)),
    };
  });
}

function formatDollars(amount: number): string {
  return formatCompactCurrency(amount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardCharts({
  leads,
  kpis,
  roiData,
}: DashboardChartsProps) {
  const trendData = useMemo(() => buildLeadTrendData(leads), [leads]);
  const sourceData = useMemo(() => buildSourceBreakdown(leads), [leads]);
  const serviceData = useMemo(
    () => buildServicePerformanceData(leads),
    [leads],
  );
  const revenueData = useMemo(
    () => buildRevenueTrendData(roiData),
    [roiData],
  );

  // Don't render if there's no meaningful data at all
  if (leads.length === 0 && kpis.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Lead trend line + Lead sources donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead Trend Line Chart (2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Lead Activity (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Lead trend data will appear once you receive your first leads.
              </div>
            ) : (
              <TrendLineChart
                data={trendData}
                xKey="date"
                series={[
                  {
                    dataKey: "leads",
                    label: "Daily Leads",
                    color: SEMANTIC_COLORS.leads,
                  },
                  {
                    dataKey: "cumulative",
                    label: "Cumulative",
                    color: SEMANTIC_COLORS.bookings,
                    dashed: true,
                  },
                ]}
                height={260}
                xTickFormatter={(v) => {
                  const parts = v.split(" ");
                  return parts.length === 2 ? `${parts[1]}` : v;
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Lead Sources Donut (1/3 width) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Source breakdown will appear once leads arrive.
              </div>
            ) : (
              <CategoryPieChart
                data={sourceData}
                height={240}
                centreLabel={String(leads.length)}
                centreSubLabel="Total Leads"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Service performance bar chart + Revenue trend area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Service Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Service Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonBarChart
              data={serviceData}
              xKey="service"
              series={[
                {
                  dataKey: "leads",
                  label: "Leads",
                  color: SEMANTIC_COLORS.leads,
                },
                {
                  dataKey: "conversions",
                  label: "Conversions",
                  color: SEMANTIC_COLORS.conversions,
                },
              ]}
              height={280}
              barRadius={3}
            />
          </CardContent>
        </Card>

        {/* Revenue Trend Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenue vs. Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CumulativeAreaChart
              data={revenueData}
              xKey="month"
              series={[
                {
                  dataKey: "revenue",
                  label: "Revenue",
                  color: SEMANTIC_COLORS.revenue,
                },
                {
                  dataKey: "investment",
                  label: "Investment",
                  color: SEMANTIC_COLORS.cost,
                },
              ]}
              height={280}
              fillOpacity={0.18}
              valueFormatter={formatDollars}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
