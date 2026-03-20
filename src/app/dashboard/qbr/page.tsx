"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QBRSummary {
  id: string;
  quarter: string;
  summary: string;
  sentAt: string | null;
  createdAt: string;
}

interface QBRMetrics {
  totalLeads: number;
  conversionRate: number;
  totalRevenue: number;
  adSpend: number;
  roi: number;
  chatbotConversations: number;
  reviewsCollected: number;
  contentPublished: number;
  impressions: number;
  clicks: number;
  costPerLead: number;
  leadsBySource: Record<string, number>;
  revenueByChannel: Record<string, number>;
}

interface QBRDetail {
  id: string;
  quarter: string;
  summary: string;
  metrics: QBRMetrics;
  highlights: string[];
  recommendations: string[];
  sentAt: string | null;
  createdAt: string;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QBRPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<QBRSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<QBRDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/dashboard/qbr");
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch {
        toast("We couldn't load your reports. Please refresh the page.", "error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, [toast]);

  async function openDetail(id: string) {
    setIsDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/dashboard/qbr/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch {
      toast("We couldn't load the report details. Please try again.", "error");
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8" aria-label="Quarterly business reviews">
        <Container>
          {/* Header */}
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
                Quarterly Business Reviews
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Automated quarterly performance reviews with AI-generated insights.
              </p>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="py-8 space-y-3" role="status" aria-label="Loading quarterly reviews">
              <span className="sr-only">Loading quarterly business reviews...</span>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && reports.length === 0 && (
            <Card className="border-white/[0.06]">
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  No QBR Reports Yet
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Quarterly Business Reviews are generated automatically at the end of each quarter.
                  Your first QBR will appear after your first full quarter of service.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Report List */}
          {!isLoading && reports.length > 0 && !detail && (
            <div className="space-y-3" role="list" aria-label="Quarterly business reviews">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  role="listitem"
                  tabIndex={0}
                  className="border-white/[0.06] cursor-pointer transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => openDetail(report.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(report.id); } }}
                  aria-label={`View ${report.quarter} quarterly review`}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{report.quarter}</Badge>
                        {report.sentAt && (
                          <span className="text-xs text-muted-foreground">
                            Sent {new Date(report.sentAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.summary.length > 200 ? `${report.summary.slice(0, 200)}...` : report.summary}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-4" aria-hidden="true" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Detail Loading */}
          {isDetailLoading && (
            <div className="space-y-6" role="status" aria-label="Loading report details">
              <span className="sr-only">Loading report details...</span>
              <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-40 animate-pulse rounded-xl bg-muted" />
                <div className="h-40 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          )}

          {/* Detail View */}
          {detail && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" size="sm" onClick={() => setDetail(null)} aria-label="Back to report list">
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Back to List
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/dashboard/reports/generate?period=quarterly`, "_blank")}
                  aria-label={`Download ${detail.quarter} report as PDF`}
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Download PDF
                </Button>
              </div>

              {/* Quarter Header */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                    <Badge variant="default">{detail.quarter}</Badge>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Quarterly Business Review
                  </h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {detail.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="region" aria-label="Key quarterly metrics">
                <Card aria-label={`Total Leads: ${detail.metrics.totalLeads.toLocaleString()}`}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-primary sm:text-2xl">{detail.metrics.totalLeads.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                  </CardContent>
                </Card>
                <Card aria-label={`Revenue: ${formatCurrency(detail.metrics.totalRevenue)}`}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-emerald-400 sm:text-2xl">
                      {formatCurrency(detail.metrics.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </CardContent>
                </Card>
                <Card aria-label={`ROI: ${detail.metrics.roi}%`}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-blue-400 sm:text-2xl">{detail.metrics.roi}%</p>
                    <p className="text-xs text-muted-foreground">ROI</p>
                  </CardContent>
                </Card>
                <Card aria-label={`Conversion Rate: ${detail.metrics.conversionRate}%`}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-amber-400 sm:text-2xl">
                      {detail.metrics.conversionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Highlights */}
                <Card className="border-white/[0.06]">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                      <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                      Quarter Highlights
                    </h3>
                    {detail.highlights.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No highlights for this quarter.</p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                            <span className="text-muted-foreground">{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="border-white/[0.06]">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                      AI Recommendations
                    </h3>
                    {detail.recommendations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recommendations for this quarter.</p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                            <span className="text-muted-foreground">{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Performance Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(detail.metrics.adSpend)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ad Spend</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {detail.metrics.impressions.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {detail.metrics.clicks.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {detail.metrics.chatbotConversations.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Chatbot Convos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {detail.metrics.reviewsCollected.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
