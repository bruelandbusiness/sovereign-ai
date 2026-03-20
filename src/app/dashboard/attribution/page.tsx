"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Target,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const CHANNEL_LABELS: Record<string, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  social: "Social Media",
  chatbot: "AI Chatbot",
  voice: "Voice Agent",
  referral: "Referral",
  organic: "Organic",
  website: "Website",
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

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<AttributionData>;
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttributionPage() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading } = useSWR<AttributionData>(
    `/api/dashboard/attribution?period=${period}`,
    fetcher
  );

  // Calculate funnel conversion rates
  const funnelRates = useMemo(() => {
    if (!data) return null;
    const f = data.funnel;
    return {
      clickToLead: f.adClicks > 0 ? ((f.leads / f.adClicks) * 100).toFixed(1) : "0",
      leadToBooking: f.leads > 0 ? ((f.bookings / f.leads) * 100).toFixed(1) : "0",
      bookingToPayment: f.bookings > 0 ? ((f.payments / f.bookings) * 100).toFixed(1) : "0",
    };
  }, [data]);

  // Calculate total channel revenue for pie chart percentages
  const totalChannelRevenue = useMemo(() => {
    if (!data) return 0;
    return data.channelROI.reduce((sum, c) => sum + c.revenue, 0);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" aria-busy="true" aria-label="Loading attribution data">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 w-16 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
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
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">Revenue Attribution</h1>
            </div>
            <div className="flex gap-1" role="group" aria-label="Date range filter">
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

          {/* Empty state when no attribution data at all */}
          {data && data.funnel.leads === 0 && data.funnel.impressions === 0 && data.channelROI.length === 0 && (
            <Card className="mb-8 border-white/[0.06]">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                  <BarChart3 className="h-7 w-7 text-blue-400/60" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">No attribution data yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Attribution data will appear as your AI services generate leads, bookings, and revenue. Check back soon or try a different time period.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Top Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8" role="region" aria-label="Attribution summary metrics">
            <Card aria-label={`Total Revenue: ${data ? formatCurrency(data.totalRevenue) : "$0"}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold sm:text-2xl truncate">
                    {data ? formatCurrency(data.totalRevenue) : "$0"}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card aria-label={`Ad Spend: ${data ? formatCurrency(data.totalAdSpend) : "$0"}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Target className="h-5 w-5 text-red-400" aria-hidden="true" />
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
                  <TrendingUp className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold sm:text-2xl">{data?.roi ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">ROI</p>
                </div>
              </CardContent>
            </Card>
            <Card aria-label={`Leads Captured: ${data?.funnel.leads ?? 0}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <Users className="h-5 w-5 text-violet-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold sm:text-2xl">{(data?.funnel.leads ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Leads Captured</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Visualization */}
          <Card className="mb-8 border-white/[0.06]" role="figure" aria-label="Conversion funnel showing impressions through payments">
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
                    rate: data?.funnel.impressions && data.funnel.adClicks
                      ? `${((data.funnel.adClicks / data.funnel.impressions) * 100).toFixed(1)}%`
                      : null,
                  },
                  {
                    label: "Leads",
                    value: data?.funnel.leads || 0,
                    color: "bg-violet-500",
                    rate: funnelRates ? `${funnelRates.clickToLead}%` : null,
                  },
                  {
                    label: "Bookings",
                    value: data?.funnel.bookings || 0,
                    color: "bg-amber-500",
                    rate: funnelRates ? `${funnelRates.leadToBooking}%` : null,
                  },
                  {
                    label: "Payments",
                    value: data?.funnel.payments || 0,
                    color: "bg-emerald-500",
                    rate: funnelRates ? `${funnelRates.bookingToPayment}%` : null,
                  },
                ].map((stage, index) => {
                  const maxValue = data?.funnel.impressions || data?.funnel.leads || 1;
                  const width = Math.max(
                    5,
                    (stage.value / maxValue) * 100
                  );
                  return (
                    <div key={stage.label} className="flex items-center gap-2 sm:gap-4">
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

          <div className="grid gap-8 lg:grid-cols-2">
            {/* ROI by Channel */}
            <Card className="border-white/[0.06]">
              <CardContent className="p-6">
                <h2 className="text-base font-semibold mb-4">ROI by Channel</h2>
                {!data?.channelROI.length && (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No attribution data yet. Revenue events will appear as leads convert.
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
                                CHANNEL_COLORS[ch.channel] || "bg-zinc-500"
                              }`}
                            />
                            <span className="text-sm font-medium">
                              {CHANNEL_LABELS[ch.channel] || ch.channel}
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
                              CHANNEL_COLORS[ch.channel] || "bg-zinc-500"
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
                <h2 className="text-base font-semibold mb-4">Top Converting Leads</h2>
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
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                          >
                            {lead.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`inline-flex items-center gap-1`}>
                            <div
                              className={`h-2 w-2 rounded-full ${
                                CHANNEL_COLORS[lead.channel] || "bg-zinc-500"
                              }`}
                            />
                            {CHANNEL_LABELS[lead.channel] || lead.channel}
                          </span>
                          <span>{lead.eventCount} events</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-emerald-400">
                          {lead.revenue > 0 ? formatCurrency(lead.revenue) : "--"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Source - Pie chart representation */}
          <Card className="mt-8 border-white/[0.06]">
            <CardContent className="p-6">
              <h2 className="text-base font-semibold mb-4">Revenue by Source</h2>
              <div className="flex flex-wrap gap-4 items-center justify-center py-4 sm:gap-6">
                {data?.channelROI.length === 0 && (
                  <p className="text-sm text-muted-foreground">No revenue data available.</p>
                )}
                {data?.channelROI.map((ch) => {
                  const pct =
                    totalChannelRevenue > 0
                      ? ((ch.revenue / totalChannelRevenue) * 100).toFixed(0)
                      : "0";
                  return (
                    <div
                      key={ch.channel}
                      className="flex items-center gap-3 rounded-lg border border-white/[0.06] px-4 py-3"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          CHANNEL_COLORS[ch.channel] || "bg-zinc-500"
                        }`}
                      >
                        {pct}%
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {CHANNEL_LABELS[ch.channel] || ch.channel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(ch.revenue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
