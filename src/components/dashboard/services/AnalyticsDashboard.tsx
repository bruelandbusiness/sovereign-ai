"use client";

import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Phone,
  Mail,
  Calendar,
  Star,
  FileText,
  Search,
  Share2,
  Megaphone,
  Clock,
  Loader2,
  Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCents, formatNumber as fmtNumber, formatCompactNumber } from "@/lib/formatters";

// ── Types ────────────────────────────────────────────────────

interface AnalyticsOverview {
  leads: {
    total: number;
    won: number;
    conversionRate: number;
    totalValue: number;
    wonValue: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
  };
  ads: {
    totalSpend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    avgCostPerLead: number;
    activeCampaigns: number;
  };
  seo: {
    trackedKeywords: number;
    rankingInTop10: number;
    avgPosition: number;
    totalSearchVolume: number;
  };
  social: {
    totalPosts: number;
    publishedPosts: number;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
    };
  };
  email: {
    campaigns: number;
    recipients: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
    totalEvents: number;
  };
  calls: {
    total: number;
    answered: number;
    avgDuration: number;
    positiveSentiment: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    completed: number;
    noShows: number;
    noShowRate: number;
  };
  reviews: {
    campaigns: number;
    completed: number;
    avgRating: number;
  };
  content: {
    total: number;
    published: number;
    byType: Record<string, number>;
  };
}

interface ROIData {
  totalInvestment: number;
  totalReturns: number;
  netProfit: number;
  roiMultiplier: number;
  monthlyInvestment: number;
  monthsActive: number;
  revenueBySource: Record<string, number>;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000) return formatCompactNumber(n);
  return fmtNumber(n);
}

// ── Component ────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const {
    data: overview,
    error: overviewError,
    isLoading: overviewLoading,
  } = useSWR<AnalyticsOverview>("/api/services/analytics/overview", fetcher, {
    refreshInterval: 60000,
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  });

  const {
    data: roi,
    isLoading: roiLoading,
  } = useSWR<ROIData>("/api/services/analytics/roi", fetcher, {
    refreshInterval: 60000,
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  });

  if (overviewLoading && roiLoading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-busy="true">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading analytics dashboard...
        </span>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="flex items-center justify-center py-20" role="alert">
        <p className="text-sm text-destructive">
          Failed to load analytics. Make sure the analytics service is provisioned.
        </p>
      </div>
    );
  }

  const data = overview;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" aria-label="Back to dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10" aria-hidden="true">
          <BarChart3 className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">AI Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Data-driven decisions across all channels
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="default">Active</Badge>
        </div>
      </div>

      {/* ROI Summary */}
      {roi && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label="ROI summary">
          <Card>
            <CardContent className="flex items-center gap-3 pt-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCents(roi.totalReturns)}
                </p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {roi.roiMultiplier}x
                </p>
                <p className="text-xs text-muted-foreground">ROI Multiplier</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCents(roi.netProfit)}
                </p>
                <p className="text-xs text-muted-foreground">Net Profit</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                <Clock className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {roi.monthsActive}
                </p>
                <p className="text-xs text-muted-foreground">Months Active</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lead Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Leads</span>
                <span className="text-lg font-semibold">{data.leads.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Won Deals</span>
                <span className="text-lg font-semibold text-green-400">{data.leads.won}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="text-lg font-semibold">{data.leads.conversionRate}%</span>
              </div>
              <Progress value={data.leads.conversionRate} aria-label={`Lead conversion rate: ${data.leads.conversionRate}%`} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pipeline Value</span>
                <span className="text-lg font-semibold">{formatCents(data.leads.totalValue)}</span>
              </div>
              {/* Lead Sources */}
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">By Source</p>
                {Object.entries(data.leads.bySource).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{source}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Channel Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Megaphone className="h-4 w-4 text-orange-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ads</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCents(data.ads.totalSpend)} spent | {data.ads.conversions} conversions | {data.ads.ctr}% CTR
                  </p>
                </div>
                <Badge variant="outline">{data.ads.activeCampaigns} active</Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Search className="h-4 w-4 text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">SEO</p>
                  <p className="text-xs text-muted-foreground">
                    {data.seo.rankingInTop10}/{data.seo.trackedKeywords} in Top 10 | Avg pos: {data.seo.avgPosition}
                  </p>
                </div>
                <Badge variant="outline">{formatNumber(data.seo.totalSearchVolume)} vol</Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Share2 className="h-4 w-4 text-pink-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Social</p>
                  <p className="text-xs text-muted-foreground">
                    {data.social.publishedPosts} posts | {formatNumber(data.social.engagement.likes)} likes | {formatNumber(data.social.engagement.reach)} reach
                  </p>
                </div>
                <Badge variant="outline">{data.social.totalPosts} total</Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Mail className="h-4 w-4 text-indigo-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">
                    {data.email.openRate}% open rate | {data.email.clickRate}% click rate | {data.email.recipients} recipients
                  </p>
                </div>
                <Badge variant="outline">{data.email.campaigns} campaigns</Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Phone className="h-4 w-4 text-purple-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Calls</p>
                  <p className="text-xs text-muted-foreground">
                    {data.calls.answered}/{data.calls.total} answered | {data.calls.avgDuration}s avg | {data.calls.positiveSentiment} positive
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Calendar className="h-4 w-4 text-teal-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Bookings</p>
                  <p className="text-xs text-muted-foreground">
                    {data.bookings.completed} completed | {data.bookings.confirmed} confirmed | {data.bookings.noShowRate}% no-show
                  </p>
                </div>
                <Badge variant="outline">{data.bookings.total} total</Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Star className="h-4 w-4 text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Reviews</p>
                  <p className="text-xs text-muted-foreground">
                    {data.reviews.completed} collected | {data.reviews.avgRating} avg rating
                  </p>
                </div>
                <Badge variant="outline">{data.reviews.campaigns} campaigns</Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="h-4 w-4 text-rose-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Content</p>
                  <p className="text-xs text-muted-foreground">
                    {data.content.published} published |{" "}
                    {Object.entries(data.content.byType).map(([type, count]) => `${count} ${type}`).join(", ") || "none"}
                  </p>
                </div>
                <Badge variant="outline">{data.content.total} total</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue by Source */}
      {roi && Object.keys(roi.revenueBySource).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(roi.revenueBySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, amount]) => {
                  const percentage = roi.totalReturns > 0 ? Math.round((amount / roi.totalReturns) * 100) : 0;
                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{source}</span>
                        <span className="font-medium">{formatCents(amount)} ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} aria-label={`${source}: ${percentage}%`} className="h-1.5" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
