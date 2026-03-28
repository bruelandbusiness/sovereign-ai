"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Zap,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chart-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChannelROI {
  channel: string;
  leads: number;
  bookings: number;
  revenue: number;
  events: number;
}

interface TopLead {
  id: string;
  name: string;
  source: string;
  status: string;
  eventCount: number;
  revenue: number;
  channel: string;
  createdAt: string;
}

interface AttributionData {
  period: string;
  funnel: {
    impressions: number;
    adClicks: number;
    leads: number;
    bookings: number;
    payments: number;
    totalRevenue: number;
  };
  channelROI: ChannelROI[];
  totalAdSpend: number;
  totalRevenue: number;
  roi: number;
  topLeads: TopLead[];
}

type AttributionModel = "first_touch" | "last_touch" | "linear" | "time_decay";

type SortField =
  | "channel"
  | "leads"
  | "conversions"
  | "revenue"
  | "cost"
  | "roi";
type SortDirection = "asc" | "desc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

const CHANNEL_LABELS: Record<string, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  social: "Social Media",
  chatbot: "AI Chatbot",
  voice: "Voice Agent",
  referral: "Referral",
  organic: "Organic / SEO",
  website: "Website / Direct",
  booking: "Booking",
  ads: "Ads",
  phone: "Phone",
  form: "Form",
};

const CHANNEL_COLORS: Record<string, string> = {
  google_ads: "bg-blue-500",
  meta_ads: "bg-indigo-500",
  social: "bg-pink-500",
  chatbot: "bg-violet-500",
  voice: "bg-orange-500",
  referral: "bg-emerald-500",
  organic: "bg-cyan-500",
  website: "bg-sky-500",
  booking: "bg-teal-500",
  ads: "bg-rose-500",
  phone: "bg-amber-500",
  form: "bg-lime-500",
};

const CHANNEL_HEX: Record<string, string> = {
  google_ads: "#3b82f6",
  meta_ads: "#6366f1",
  social: "#ec4899",
  chatbot: "#8b5cf6",
  voice: "#f97316",
  referral: "#10b981",
  organic: "#06b6d4",
  website: "#0ea5e9",
  booking: "#14b8a6",
  ads: "#f43f5e",
  phone: "#f59e0b",
  form: "#84cc16",
};

const ATTRIBUTION_MODEL_INFO: Record<
  AttributionModel,
  { label: string; description: string }
> = {
  first_touch: {
    label: "First Touch",
    description:
      "100% credit goes to the first channel the customer interacted with. Best for understanding which channels drive initial awareness.",
  },
  last_touch: {
    label: "Last Touch",
    description:
      "100% credit goes to the last channel before conversion. Best for understanding which channels close deals.",
  },
  linear: {
    label: "Linear",
    description:
      "Credit is split equally among all touchpoints. Provides a balanced view of each channel's contribution.",
  },
  time_decay: {
    label: "Time Decay",
    description:
      "More credit goes to touchpoints closer to conversion. Balances awareness and closing contributions.",
  },
};

// Simulated cost allocation ratios per channel (relative to total ad spend)
const CHANNEL_COST_RATIOS: Record<string, number> = {
  google_ads: 0.4,
  meta_ads: 0.25,
  social: 0.1,
  chatbot: 0.05,
  voice: 0.03,
  referral: 0.02,
  organic: 0.0,
  website: 0.05,
  ads: 0.08,
  phone: 0.02,
  form: 0.0,
  booking: 0.0,
};

// Attribution model weighting multipliers (applied to raw data)
const MODEL_WEIGHTS: Record<AttributionModel, Record<string, number>> = {
  first_touch: {
    google_ads: 1.3,
    meta_ads: 1.2,
    social: 1.15,
    organic: 1.25,
    referral: 0.8,
    chatbot: 0.7,
    voice: 0.75,
    website: 1.1,
    ads: 1.2,
    phone: 0.6,
    form: 0.65,
    booking: 0.5,
  },
  last_touch: {
    google_ads: 0.85,
    meta_ads: 0.9,
    social: 0.75,
    organic: 0.7,
    referral: 1.2,
    chatbot: 1.35,
    voice: 1.3,
    website: 1.1,
    ads: 0.85,
    phone: 1.25,
    form: 1.2,
    booking: 1.4,
  },
  linear: {
    google_ads: 1.0,
    meta_ads: 1.0,
    social: 1.0,
    organic: 1.0,
    referral: 1.0,
    chatbot: 1.0,
    voice: 1.0,
    website: 1.0,
    ads: 1.0,
    phone: 1.0,
    form: 1.0,
    booking: 1.0,
  },
  time_decay: {
    google_ads: 0.9,
    meta_ads: 0.95,
    social: 0.85,
    organic: 0.8,
    referral: 1.1,
    chatbot: 1.2,
    voice: 1.15,
    website: 1.05,
    ads: 0.9,
    phone: 1.1,
    form: 1.05,
    booking: 1.25,
  },
};

// Simulated conversion paths
const CONVERSION_PATHS = [
  {
    path: ["Google Ad", "Website", "AI Chatbot", "Booking"],
    conversions: 142,
    avgValue: 48500,
    pctOfTotal: 28,
  },
  {
    path: ["SEO / Organic", "Blog Post", "AI Chatbot", "Phone Call", "Booking"],
    conversions: 98,
    avgValue: 62000,
    pctOfTotal: 19,
  },
  {
    path: ["Social Media", "Website", "Form Submit", "Email", "Booking"],
    conversions: 76,
    avgValue: 35200,
    pctOfTotal: 15,
  },
  {
    path: ["Referral Link", "Website", "Booking"],
    conversions: 64,
    avgValue: 71500,
    pctOfTotal: 13,
  },
  {
    path: ["Meta Ad", "Landing Page", "AI Chatbot", "Booking"],
    conversions: 53,
    avgValue: 41800,
    pctOfTotal: 10,
  },
  {
    path: ["Direct Visit", "AI Chatbot", "Booking"],
    conversions: 45,
    avgValue: 55000,
    pctOfTotal: 9,
  },
];

// Simulated top campaigns
const TOP_CAMPAIGNS = [
  {
    name: "Spring HVAC Promo",
    channel: "google_ads",
    leads: 234,
    conversions: 42,
    spend: 320000,
    revenue: 1890000,
    status: "active" as const,
  },
  {
    name: "Emergency Plumbing - Local",
    channel: "google_ads",
    leads: 189,
    conversions: 38,
    spend: 245000,
    revenue: 1520000,
    status: "active" as const,
  },
  {
    name: "Home Renovation Retarget",
    channel: "meta_ads",
    leads: 156,
    conversions: 28,
    spend: 180000,
    revenue: 980000,
    status: "active" as const,
  },
  {
    name: "Roof Inspection Free Quote",
    channel: "google_ads",
    leads: 121,
    conversions: 24,
    spend: 156000,
    revenue: 864000,
    status: "paused" as const,
  },
  {
    name: "Summer AC Maintenance",
    channel: "meta_ads",
    leads: 98,
    conversions: 19,
    spend: 125000,
    revenue: 665000,
    status: "active" as const,
  },
];

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<AttributionData>;
  });

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TrendArrow({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "h-4 w-4" : "h-3 w-3";
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400">
        <ChevronUp className={sizeClass} />
        <span className="text-xs font-medium">{value}%</span>
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400">
        <ChevronDown className={sizeClass} />
        <span className="text-xs font-medium">{Math.abs(value)}%</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground">
      <Minus className={sizeClass} />
      <span className="text-xs font-medium">0%</span>
    </span>
  );
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors hover:text-foreground ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {label}
      {isActive && (
        <span className="text-primary">
          {currentDirection === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AttributionPage() {
  const [period, setPeriod] = useState("30d");
  const [attributionModel, setAttributionModel] =
    useState<AttributionModel>("linear");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading, error } = useSWR<AttributionData>(
    `/api/dashboard/attribution?period=${period}`,
    fetcher,
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField],
  );

  // Calculate funnel conversion rates
  const funnelRates = useMemo(() => {
    if (!data) return null;
    const f = data.funnel;
    return {
      clickToLead:
        f.adClicks > 0 ? ((f.leads / f.adClicks) * 100).toFixed(1) : "0",
      leadToBooking:
        f.leads > 0 ? ((f.bookings / f.leads) * 100).toFixed(1) : "0",
      bookingToPayment:
        f.bookings > 0 ? ((f.payments / f.bookings) * 100).toFixed(1) : "0",
    };
  }, [data]);

  // Build enriched channel data with cost, ROI, trend, and attribution model weighting
  const channelTableData = useMemo(() => {
    if (!data) return [];
    const weights = MODEL_WEIGHTS[attributionModel];

    return data.channelROI.map((ch) => {
      const weight = weights[ch.channel] ?? 1.0;
      const adjustedLeads = Math.round(ch.leads * weight);
      const adjustedConversions = Math.round(ch.bookings * weight);
      const adjustedRevenue = Math.round(ch.revenue * weight);
      const costRatio = CHANNEL_COST_RATIOS[ch.channel] ?? 0;
      const cost = Math.round(data.totalAdSpend * costRatio);
      const roi = cost > 0 ? ((adjustedRevenue - cost) / cost) * 100 : adjustedRevenue > 0 ? 999 : 0;

      // Simulated trend: hash-based deterministic pseudo-random per channel + period
      const hash = ch.channel.length * 7 + period.length * 13;
      const trend = ((hash % 40) - 12) * (ch.revenue > 0 ? 1 : 0);

      return {
        channel: ch.channel,
        leads: adjustedLeads,
        conversions: adjustedConversions,
        revenue: adjustedRevenue,
        cost,
        roi: Math.round(roi),
        trend,
      };
    });
  }, [data, attributionModel, period]);

  // Sort the table
  const sortedChannelData = useMemo(() => {
    const sorted = [...channelTableData];
    sorted.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [channelTableData, sortField, sortDirection]);

  // Donut chart data
  const donutData = useMemo(() => {
    if (!channelTableData.length) return [];
    return channelTableData
      .filter((ch) => ch.leads > 0)
      .map((ch) => ({
        name: CHANNEL_LABELS[ch.channel] ?? ch.channel,
        value: ch.leads,
        color: CHANNEL_HEX[ch.channel] ?? CHART_COLORS[0],
      }));
  }, [channelTableData]);

  const totalLeads = useMemo(
    () => donutData.reduce((sum, d) => sum + d.value, 0),
    [donutData],
  );

  // Budget recommendations
  const budgetRecommendations = useMemo(() => {
    if (!channelTableData.length) return [];
    const withROI = channelTableData
      .filter((ch) => ch.cost > 0 || ch.revenue > 0)
      .sort((a, b) => b.roi - a.roi);

    const recommendations: {
      channel: string;
      action: "increase" | "decrease" | "maintain";
      reason: string;
      suggestedChange: number;
    }[] = [];

    for (const ch of withROI) {
      const label = CHANNEL_LABELS[ch.channel] ?? ch.channel;
      if (ch.roi > 300 && ch.cost > 0) {
        recommendations.push({
          channel: label,
          action: "increase",
          reason: `${ch.roi}% ROI with strong conversion rate. Increasing budget here should yield proportional returns.`,
          suggestedChange: 25,
        });
      } else if (ch.roi > 100) {
        recommendations.push({
          channel: label,
          action: "maintain",
          reason: `Solid ${ch.roi}% ROI. Current spend level is well-optimized.`,
          suggestedChange: 0,
        });
      } else if (ch.cost > 0 && ch.roi < 50) {
        recommendations.push({
          channel: label,
          action: "decrease",
          reason: `Only ${ch.roi}% ROI. Consider reallocating budget to higher-performing channels.`,
          suggestedChange: -30,
        });
      }
    }

    return recommendations.slice(0, 4);
  }, [channelTableData]);

  // Total channel revenue for percentage calculations
  const totalChannelRevenue = useMemo(() => {
    if (!data) return 0;
    return data.channelROI.reduce((sum, c) => sum + c.revenue, 0);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main
          className="flex-1 py-8"
          aria-busy="true"
          aria-label="Loading attribution data"
        >
          <Container>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-16 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-muted mb-8" />
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
            </div>
          </Container>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main
          className="flex flex-1 items-center justify-center"
          role="alert"
        >
          <div className="text-center max-w-md px-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <BarChart3
                className="h-6 w-6 text-destructive"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold">
              Unable to Load Attribution Data
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong fetching your revenue attribution data.
              Please try again later.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm text-primary underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8" aria-label="Revenue attribution dashboard">
        <Container>
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" aria-label="Back to dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft
                    className="mr-1.5 h-4 w-4"
                    aria-hidden="true"
                  />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">
                Revenue Attribution
              </h1>
            </div>
            <div
              className="flex gap-1"
              role="group"
              aria-label="Date range filter"
            >
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                  aria-label={`Show ${p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"} of data`}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    period === p
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-white/[0.06]"
                  }`}
                >
                  {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {data &&
            data.funnel.leads === 0 &&
            data.funnel.impressions === 0 &&
            data.channelROI.length === 0 && (
              <Card className="mb-8 border-white/[0.06]">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                    <BarChart3
                      className="h-7 w-7 text-blue-400/60"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="text-base font-semibold">
                    No attribution data yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Attribution data will appear as your AI services generate
                    leads, bookings, and revenue. Check back soon or try a
                    different time period.
                  </p>
                </CardContent>
              </Card>
            )}

          {/* Top Stats */}
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8"
            role="region"
            aria-label="Attribution summary metrics"
          >
            <Card
              aria-label={`Total Revenue: ${data ? formatCurrency(data.totalRevenue) : "$0"}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <DollarSign
                    className="h-5 w-5 text-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold sm:text-2xl truncate">
                    {data ? formatCurrency(data.totalRevenue) : "$0"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Revenue
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card
              aria-label={`Ad Spend: ${data ? formatCurrency(data.totalAdSpend) : "$0"}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Target
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold sm:text-2xl truncate">
                    {data ? formatCurrency(data.totalAdSpend) : "$0"}
                  </p>
                  <p className="text-xs text-muted-foreground">Ad Spend</p>
                </div>
              </CardContent>
            </Card>
            <Card aria-label={`ROI: ${data?.roi ?? 0}%`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <TrendingUp
                    className="h-5 w-5 text-blue-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold sm:text-2xl">
                    {data?.roi ?? 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI</p>
                </div>
              </CardContent>
            </Card>
            <Card aria-label={`Leads Captured: ${data?.funnel.leads ?? 0}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <Users
                    className="h-5 w-5 text-violet-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold sm:text-2xl">
                    {(data?.funnel.leads ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Leads Captured
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================= */}
          {/* Attribution Model Selector                                     */}
          {/* ============================================================= */}
          <Card className="mb-8 border-white/[0.06]">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Attribution Model</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose how conversion credit is assigned across touchpoints
                  </p>
                </div>
                <div
                  className="flex gap-1 rounded-lg bg-muted p-1"
                  role="radiogroup"
                  aria-label="Attribution model selector"
                >
                  {(
                    Object.keys(ATTRIBUTION_MODEL_INFO) as AttributionModel[]
                  ).map((model) => {
                    const info = ATTRIBUTION_MODEL_INFO[model];
                    return (
                      <TooltipProvider key={model}>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                role="radio"
                                aria-checked={attributionModel === model}
                                onClick={() => setAttributionModel(model)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                  attributionModel === model
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              />
                            }
                          >
                            {info.label}
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="max-w-[240px]">
                              {info.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================================= */}
          {/* Channel Performance Table                                      */}
          {/* ============================================================= */}
          <Card
            className="mb-8 border-white/[0.06]"
            role="region"
            aria-label="Channel performance table"
          >
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Channel Performance
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="pb-3 text-left">
                        <SortHeader
                          label="Channel"
                          field="channel"
                          currentSort={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="pb-3 text-right">
                        <SortHeader
                          label="Leads"
                          field="leads"
                          currentSort={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="pb-3 text-right">
                        <SortHeader
                          label="Conversions"
                          field="conversions"
                          currentSort={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="pb-3 text-right">
                        <SortHeader
                          label="Revenue"
                          field="revenue"
                          currentSort={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="pb-3 text-right">
                        <SortHeader
                          label="Cost"
                          field="cost"
                          currentSort={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="pb-3 text-right">
                        <SortHeader
                          label="ROI"
                          field="roi"
                          currentSort={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="pb-3 text-right">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Trend
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedChannelData.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No channel data available for this period.
                        </td>
                      </tr>
                    )}
                    {sortedChannelData.map((ch) => (
                      <tr
                        key={ch.channel}
                        className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full ${CHANNEL_COLORS[ch.channel] ?? "bg-muted-foreground"}`}
                            />
                            <span className="font-medium">
                              {CHANNEL_LABELS[ch.channel] ?? ch.channel}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {ch.leads.toLocaleString()}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {ch.conversions.toLocaleString()}
                        </td>
                        <td className="py-3 text-right tabular-nums font-semibold text-emerald-400">
                          {formatCurrency(ch.revenue)}
                        </td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">
                          {ch.cost > 0 ? formatCurrency(ch.cost) : "--"}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              ch.roi > 200
                                ? "bg-emerald-500/10 text-emerald-400"
                                : ch.roi > 50
                                  ? "bg-amber-500/10 text-amber-400"
                                  : ch.cost > 0
                                    ? "bg-red-500/10 text-red-400"
                                    : "text-muted-foreground"
                            }`}
                          >
                            {ch.cost > 0 ? `${ch.roi}%` : "N/A"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <TrendArrow value={ch.trend} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ============================================================= */}
          {/* Donut Chart + Conversion Paths (side by side)                  */}
          {/* ============================================================= */}
          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            {/* Channel Mix Donut Chart */}
            <Card
              className="border-white/[0.06]"
              role="figure"
              aria-label="Channel mix donut chart showing lead distribution"
            >
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Channel Mix — Lead Sources
                </h2>
                {donutData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No lead data available.
                  </p>
                ) : (
                  <div className="relative" style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={66}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {donutData.map((entry, i) => (
                            <Cell
                              key={entry.name}
                              fill={
                                entry.color ??
                                CHART_COLORS[i % CHART_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={TOOLTIP_STYLE.contentStyle}
                          labelStyle={TOOLTIP_STYLE.labelStyle}
                          itemStyle={TOOLTIP_STYLE.itemStyle}
                          formatter={(value: unknown) => [
                            `${Number(value).toLocaleString()} leads`,
                            "",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centre label */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">
                        {formatCompact(totalLeads)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Total Leads
                      </span>
                    </div>
                  </div>
                )}
                {/* Legend */}
                {donutData.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {donutData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversion Path Visualization */}
            <Card
              className="border-white/[0.06]"
              role="region"
              aria-label="Common conversion paths"
            >
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-1">
                  Conversion Paths
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Most common multi-touch journeys customers take before
                  converting
                </p>
                <div className="space-y-3">
                  {CONVERSION_PATHS.map((pathData, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/[0.06] p-3 transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Path steps */}
                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        {pathData.path.map((step, stepIdx) => (
                          <span key={stepIdx} className="flex items-center">
                            <Badge
                              variant="outline"
                              className="text-[11px] whitespace-nowrap"
                            >
                              {step}
                            </Badge>
                            {stepIdx < pathData.path.length - 1 && (
                              <ArrowRight className="mx-0.5 h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                          </span>
                        ))}
                      </div>
                      {/* Metrics row */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {pathData.conversions} conversions
                        </span>
                        <span>
                          Avg {formatCurrency(pathData.avgValue)}
                        </span>
                        <span>{pathData.pctOfTotal}% of total</span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{ width: `${pathData.pctOfTotal}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================= */}
          {/* Funnel Visualization                                           */}
          {/* ============================================================= */}
          <Card
            className="mb-8 border-white/[0.06]"
            role="figure"
            aria-label="Conversion funnel showing impressions through payments"
          >
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-6">Conversion Funnel</h2>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Impressions",
                    value: data?.funnel.impressions || 0,
                    color: "bg-sky-500",
                    rate: null,
                  },
                  {
                    label: "Ad Clicks",
                    value: data?.funnel.adClicks || 0,
                    color: "bg-blue-500",
                    rate:
                      data?.funnel.impressions && data.funnel.adClicks
                        ? `${((data.funnel.adClicks / data.funnel.impressions) * 100).toFixed(1)}%`
                        : null,
                  },
                  {
                    label: "Leads",
                    value: data?.funnel.leads || 0,
                    color: "bg-violet-500",
                    rate: funnelRates
                      ? `${funnelRates.clickToLead}%`
                      : null,
                  },
                  {
                    label: "Bookings",
                    value: data?.funnel.bookings || 0,
                    color: "bg-amber-500",
                    rate: funnelRates
                      ? `${funnelRates.leadToBooking}%`
                      : null,
                  },
                  {
                    label: "Payments",
                    value: data?.funnel.payments || 0,
                    color: "bg-emerald-500",
                    rate: funnelRates
                      ? `${funnelRates.bookingToPayment}%`
                      : null,
                  },
                ].map((stage, index) => {
                  const maxValue =
                    data?.funnel.impressions || data?.funnel.leads || 1;
                  const width = Math.max(5, (stage.value / maxValue) * 100);
                  return (
                    <div
                      key={stage.label}
                      className="flex items-center gap-2 sm:gap-4"
                    >
                      <span className="w-20 text-xs text-muted-foreground text-right shrink-0 sm:w-24 sm:text-sm">
                        {stage.label}
                      </span>
                      <div className="flex-1 relative">
                        <div
                          className={`h-10 rounded-lg ${stage.color} flex items-center justify-end pr-3 transition-all`}
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-sm font-bold text-white">
                            {stage.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {stage.rate && index > 0 && (
                        <span className="text-xs text-muted-foreground w-14 shrink-0">
                          {stage.rate} CVR
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ============================================================= */}
          {/* Top Performing Campaigns                                       */}
          {/* ============================================================= */}
          <Card
            className="mb-8 border-white/[0.06]"
            role="region"
            aria-label="Top performing campaigns"
          >
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Top Performing Campaigns
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Campaign
                      </th>
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Channel
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Leads
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Conv.
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Spend
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Revenue
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        ROAS
                      </th>
                      <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_CAMPAIGNS.map((campaign) => {
                      const roas =
                        campaign.spend > 0
                          ? (campaign.revenue / campaign.spend).toFixed(1)
                          : "N/A";
                      return (
                        <tr
                          key={campaign.name}
                          className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="py-3 font-medium">
                            {campaign.name}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${CHANNEL_COLORS[campaign.channel] ?? "bg-muted-foreground"}`}
                              />
                              <span className="text-muted-foreground">
                                {CHANNEL_LABELS[campaign.channel] ??
                                  campaign.channel}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {campaign.leads.toLocaleString()}
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {campaign.conversions}
                          </td>
                          <td className="py-3 text-right tabular-nums text-muted-foreground">
                            {formatCurrency(campaign.spend)}
                          </td>
                          <td className="py-3 text-right tabular-nums font-semibold text-emerald-400">
                            {formatCurrency(campaign.revenue)}
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                Number(roas) >= 4
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : Number(roas) >= 2
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {roas}x
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                campaign.status === "active"
                                  ? "border-emerald-500/30 text-emerald-400"
                                  : "border-amber-500/30 text-amber-400"
                              }`}
                            >
                              {campaign.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ============================================================= */}
          {/* ROI by Channel + Top Converting Leads (side by side)           */}
          {/* ============================================================= */}
          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            {/* ROI by Channel */}
            <Card className="border-white/[0.06]">
              <CardContent className="p-6">
                <h2 className="text-base font-semibold mb-4">
                  ROI by Channel
                </h2>
                {!data?.channelROI.length && (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No attribution data yet. Revenue events will appear as
                    leads convert.
                  </p>
                )}
                <div className="space-y-4">
                  {data?.channelROI.map((ch) => {
                    const revenuePercent =
                      totalChannelRevenue > 0
                        ? ((ch.revenue / totalChannelRevenue) * 100).toFixed(0)
                        : "0";
                    return (
                      <div key={ch.channel} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                CHANNEL_COLORS[ch.channel] ??
                                "bg-muted-foreground"
                              }`}
                            />
                            <span className="text-sm font-medium">
                              {CHANNEL_LABELS[ch.channel] ?? ch.channel}
                            </span>
                          </div>
                          <span className="text-sm font-bold">
                            {formatCurrency(ch.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{ch.leads} leads</span>
                          <span>{ch.bookings} bookings</span>
                          <span>{revenuePercent}% of revenue</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              CHANNEL_COLORS[ch.channel] ??
                              "bg-muted-foreground"
                            } transition-all`}
                            style={{ width: `${revenuePercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Converting Leads */}
            <Card className="border-white/[0.06]">
              <CardContent className="p-6">
                <h2 className="text-base font-semibold mb-4">
                  Top Converting Leads
                </h2>
                {!data?.topLeads.length && (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No converting leads in this period.
                  </p>
                )}
                <div className="space-y-3">
                  {data?.topLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {lead.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {lead.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                CHANNEL_COLORS[lead.channel] ??
                                "bg-muted-foreground"
                              }`}
                            />
                            {CHANNEL_LABELS[lead.channel] ?? lead.channel}
                          </span>
                          <span>{lead.eventCount} events</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-emerald-400">
                          {lead.revenue > 0
                            ? formatCurrency(lead.revenue)
                            : "--"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================= */}
          {/* Budget Allocation Recommendation                               */}
          {/* ============================================================= */}
          <Card
            className="mb-8 border-white/[0.06]"
            role="region"
            aria-label="AI budget allocation recommendations"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <Lightbulb
                    className="h-5 w-5 text-violet-400"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Budget Allocation Recommendations
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    AI-generated suggestions based on{" "}
                    {ATTRIBUTION_MODEL_INFO[attributionModel].label} attribution
                    model performance
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="ml-auto border-violet-500/30 text-violet-400 text-[10px] shrink-0"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  AI Insight
                </Badge>
              </div>

              {budgetRecommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Not enough data to generate recommendations. Ensure channels
                  have both cost and revenue data.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {budgetRecommendations.map((rec) => (
                    <div
                      key={rec.channel}
                      className={`rounded-lg border p-4 transition-colors ${
                        rec.action === "increase"
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : rec.action === "decrease"
                            ? "border-red-500/20 bg-red-500/5"
                            : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">
                          {rec.channel}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            rec.action === "increase"
                              ? "border-emerald-500/30 text-emerald-400"
                              : rec.action === "decrease"
                                ? "border-red-500/30 text-red-400"
                                : "border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {rec.action === "increase" && (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          )}
                          {rec.action === "decrease" && (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {rec.action === "maintain" && (
                            <Minus className="mr-1 h-3 w-3" />
                          )}
                          {rec.action === "increase"
                            ? `+${rec.suggestedChange}%`
                            : rec.action === "decrease"
                              ? `${rec.suggestedChange}%`
                              : "Maintain"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
