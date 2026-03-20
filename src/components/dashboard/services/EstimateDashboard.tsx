"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Camera,
  DollarSign,
  TrendingUp,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-context";

// ─── Types ──────────────────────────────────────────────────

interface EstimateStats {
  estimatesToday: number;
  totalEstimates: number;
  avgEstimateValue: number;
  conversionRate: number;
  totalRevenue: number;
  confidenceBreakdown: { high: number; medium: number; low: number };
  statusBreakdown: {
    pending: number;
    analyzed: number;
    quoted: number;
    booked: number;
    expired: number;
  };
}

interface EstimateRecord {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  imageUrl: string;
  vertical: string;
  issueCategory: string | null;
  issueDescription: string | null;
  estimateLow: number | null;
  estimateHigh: number | null;
  confidence: string | null;
  status: string;
  leadId: string | null;
  bookingId: string | null;
  createdAt: string;
}

interface EstimateListResponse {
  estimates: EstimateRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCategory(cat: string | null): string {
  if (!cat) return "--";
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  analyzed: "secondary",
  quoted: "secondary",
  booked: "default",
  expired: "destructive",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-red-500/10 text-red-400",
};

// ─── Component ──────────────────────────────────────────────

export function EstimateDashboard() {
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useSWR<EstimateStats>(
    "/api/services/estimate/stats",
    fetcher
  );
  const {
    data: listData,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSWR<EstimateListResponse>(
    "/api/services/estimate?limit=50",
    fetcher
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isLoading = statsLoading || listLoading;

  async function handleStatusUpdate(
    estimateId: string,
    newStatus: string
  ) {
    setUpdatingId(estimateId);
    try {
      const res = await fetch(`/api/services/estimate/${estimateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast("We couldn't update the estimate. Please try again.", "error");
        return;
      }
      mutateList();
    } catch {
      toast("We couldn't update the estimate. Please try again.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleCopyWidgetCode() {
    const code = `<script src="${window.location.origin}/embed/estimate.js" data-client-id="YOUR_CLIENT_ID" data-vertical="hvac"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyEstimateLink() {
    const link = `${window.location.origin}/estimate?biz=YOUR_CLIENT_ID`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Loading estimate data...</span>
      </div>
    );
  }

  const st = stats || {
    estimatesToday: 0,
    totalEstimates: 0,
    avgEstimateValue: 0,
    conversionRate: 0,
    totalRevenue: 0,
    confidenceBreakdown: { high: 0, medium: 0, low: 0 },
    statusBreakdown: {
      pending: 0,
      analyzed: 0,
      quoted: 0,
      booked: 0,
      expired: 0,
    },
  };

  const estimates = listData?.estimates || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Camera className="h-6 w-6 text-amber-400" />
          AI Photo Estimating
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Homeowners snap a photo, get an instant AI estimate before a tech
          ever visits.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="estimates">
            Estimates ({st.totalEstimates})
          </TabsTrigger>
          <TabsTrigger value="settings">Embed & Settings</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ──────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Camera className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {st.estimatesToday}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimates Today
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCents(st.avgEstimateValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg Estimate Value
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {st.conversionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Conversion Rate
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <BarChart3 className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCents(st.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Revenue from Estimates
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Confidence Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  AI Confidence Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/50 p-4 text-center">
                    <div className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400">
                      High
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">
                      {st.confidenceBreakdown.high}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-4 text-center">
                    <div className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-400">
                      Medium
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">
                      {st.confidenceBreakdown.medium}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-4 text-center">
                    <div className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-red-500/10 text-red-400">
                      Low
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">
                      {st.confidenceBreakdown.low}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Estimate Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {(
                    ["pending", "analyzed", "quoted", "booked", "expired"] as const
                  ).map((s) => (
                    <div
                      key={s}
                      className="rounded-lg border border-border/50 p-4 text-center"
                    >
                      <Badge variant={STATUS_BADGE_VARIANT[s] || "outline"}>
                        {s}
                      </Badge>
                      <p className="mt-2 text-2xl font-bold tabular-nums">
                        {st.statusBreakdown[s]}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Estimates Tab ─────────────────────────────────── */}
        <TabsContent value="estimates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                All Estimates ({estimates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {estimates.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No photo estimates yet. Share your estimate link or embed the
                  widget on your website to start receiving estimates.
                </p>
              ) : (
                <div className="space-y-2">
                  {estimates.map((est) => {
                    const isExpanded = expandedId === est.id;
                    return (
                      <div
                        key={est.id}
                        className="rounded-lg border border-border/50 transition-colors hover:border-border"
                      >
                        {/* Summary row */}
                        <button
                          className="flex w-full items-center gap-4 p-4 text-left"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : est.id)
                          }
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} estimate for ${est.customerName || "Anonymous"}`}
                        >
                          {/* Thumbnail */}
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {est.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={est.imageUrl}
                                alt={`Estimate photo from ${est.customerName || "Anonymous"}`}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {est.customerName || "Anonymous"}
                              </span>
                              <Badge
                                variant={
                                  STATUS_BADGE_VARIANT[est.status] ||
                                  "outline"
                                }
                              >
                                {est.status}
                              </Badge>
                              {est.confidence && (
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONFIDENCE_COLORS[est.confidence] || ""}`}
                                >
                                  {est.confidence}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {formatCategory(est.issueCategory)} &middot;{" "}
                              {est.vertical} &middot;{" "}
                              {formatDate(est.createdAt)}{" "}
                              {formatTime(est.createdAt)}
                            </div>
                          </div>

                          {/* Estimate range */}
                          <div className="text-right shrink-0">
                            {est.estimateLow && est.estimateHigh ? (
                              <span className="font-bold tabular-nums">
                                {formatCents(est.estimateLow)} &ndash;{" "}
                                {formatCents(est.estimateHigh)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                --
                              </span>
                            )}
                          </div>

                          {/* Expand icon */}
                          <div className="shrink-0 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-border/50 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              {/* Customer details */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Customer Details
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-muted-foreground">
                                      Name:
                                    </span>{" "}
                                    {est.customerName || "--"}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">
                                      Email:
                                    </span>{" "}
                                    {est.customerEmail || "--"}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">
                                      Phone:
                                    </span>{" "}
                                    {est.customerPhone || "--"}
                                  </p>
                                </div>
                              </div>

                              {/* AI Analysis */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  AI Analysis
                                </h4>
                                <p className="text-sm leading-relaxed">
                                  {est.issueDescription || "No analysis available."}
                                </p>
                              </div>
                            </div>

                            {/* Photo */}
                            {est.imageUrl && (
                              <div className="mt-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={est.imageUrl}
                                  alt={`Photo submitted by ${est.customerName || "Anonymous"} for ${formatCategory(est.issueCategory)} estimate`}
                                  className="max-h-64 rounded-lg object-cover"
                                />
                              </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {est.status === "analyzed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId === est.id}
                                  onClick={() =>
                                    handleStatusUpdate(est.id, "quoted")
                                  }
                                >
                                  Mark as Quoted
                                </Button>
                              )}
                              {(est.status === "analyzed" ||
                                est.status === "quoted") && (
                                <Button
                                  size="sm"
                                  disabled={updatingId === est.id}
                                  onClick={() =>
                                    handleStatusUpdate(est.id, "booked")
                                  }
                                >
                                  Convert to Booking
                                </Button>
                              )}
                              {est.status !== "expired" &&
                                est.status !== "booked" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={updatingId === est.id}
                                    onClick={() =>
                                      handleStatusUpdate(est.id, "expired")
                                    }
                                  >
                                    Mark Expired
                                  </Button>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Settings Tab ──────────────────────────────────── */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Public Estimate Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Public Estimate Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Share this link with homeowners so they can submit photos
                  and get instant AI estimates.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/estimate?biz=YOUR_CLIENT_ID`
                      : "/estimate?biz=YOUR_CLIENT_ID"}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyEstimateLink}
                    aria-label={copied ? "Copied estimate link" : "Copy estimate link"}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Replace YOUR_CLIENT_ID with your actual client ID from the
                  dashboard URL.
                </p>
              </CardContent>
            </Card>

            {/* Embed Widget Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Embed Widget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Add this script to your website to show a floating
                  &ldquo;Get Instant Estimate&rdquo; button.
                </p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all">
                    {`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/estimate.js" data-client-id="YOUR_CLIENT_ID" data-vertical="hvac"></script>`}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyWidgetCode}
                    aria-label={copied ? "Copied widget code" : "Copy widget code"}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Set <code className="text-xs">data-vertical</code> to
                  your industry: hvac, plumbing, roofing, or electrical.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
