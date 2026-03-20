"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  Copy,
  Check,
  Plus,
  Users,
  Loader2,
  Code,
  Eye,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ── Types ────────────────────────────────────────────────────

interface AudienceCriteria {
  pages?: string[];
  minVisits?: number;
  daysActive?: number;
  excludeConverted?: boolean;
}

interface Audience {
  id: string;
  clientId: string;
  name: string;
  description: string;
  criteria: AudienceCriteria;
  size: number;
  createdAt: string;
}

interface RetargetingStats {
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: Array<{ url: string; views: number }>;
  audienceCount: number;
}

interface AudiencesResponse {
  audiences: Audience[];
  stats: RetargetingStats;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// ── Component ────────────────────────────────────────────────

export function RetargetingDashboard() {
  const {
    data: audiencesData,
    error: audiencesError,
    isLoading,
    mutate,
  } = useSWR<AudiencesResponse>("/api/services/retargeting/audiences", fetcher);

  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [audienceName, setAudienceName] = useState("");
  const [audiencePages, setAudiencePages] = useState("");
  const [daysActive, setDaysActive] = useState("30");
  const [minVisits, setMinVisits] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audiences = audiencesData?.audiences || [];
  const stats = audiencesData?.stats || {
    totalPageViews: 0,
    uniqueVisitors: 0,
    topPages: [],
    audienceCount: 0,
  };

  // Build pixel snippet dynamically
  const pixelSnippet = `<!-- Sovereign AI Retargeting Pixel -->
<script src="${typeof window !== "undefined" ? window.location.origin : ""}/api/services/retargeting/pixel?clientId=YOUR_CLIENT_ID"></script>`;

  // ── Handlers ─────────────────────────────────────────────

  function handleCopyPixel() {
    void navigator.clipboard.writeText(pixelSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreateAudience(e: React.FormEvent) {
    e.preventDefault();
    if (!audienceName.trim()) return;
    setIsSubmitting(true);
    try {
      const criteria: AudienceCriteria = {
        daysActive: parseInt(daysActive) || 30,
        minVisits: parseInt(minVisits) || 1,
      };
      if (audiencePages.trim()) {
        criteria.pages = audiencePages.split(",").map((p) => p.trim()).filter(Boolean);
      }

      const res = await fetch("/api/services/retargeting/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: audienceName.trim(),
          description: `Active ${daysActive} days, min ${minVisits} visits`,
          criteria,
        }),
      });
      if (res.ok) {
        setAudienceName("");
        setAudiencePages("");
        setDaysActive("30");
        setMinVisits("1");
        setShowForm(false);
        mutate();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading retargeting data...
        </span>
      </div>
    );
  }

  if (audiencesError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load retargeting data. Make sure the service is provisioned.
        </p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-500/10">
            <Target className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Retargeting</h1>
            <p className="text-sm text-muted-foreground">
              Bring back lost visitors with AI-powered retargeting
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">Active</Badge>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Audience
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <p className="text-xs">Page Views</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatNumber(stats.totalPageViews)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <p className="text-xs">Unique Visitors</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatNumber(stats.uniqueVisitors)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <p className="text-xs">Audiences</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {audiences.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs">Top Pages</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {stats.topPages.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pixel Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Code className="h-4 w-4" />
            Pixel Installation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add this tracking pixel to your website to start collecting visitor data
            for retargeting campaigns. Place it in the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
              &lt;head&gt;
            </code>{" "}
            section of every page.
          </p>
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed">
              <code>{pixelSnippet}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={handleCopyPixel}
              aria-label={copied ? "Pixel code copied" : "Copy pixel code"}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
            <div aria-live="polite" className="sr-only">
              {copied && "Pixel code copied to clipboard"}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Instructions:</span>{" "}
              Copy the code above and paste it into the{" "}
              <code className="font-mono">&lt;head&gt;</code> tag on every page of
              your website. Replace{" "}
              <code className="font-mono">YOUR_CLIENT_ID</code> with your actual
              client ID from your account settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Audience Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Create New Audience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAudience} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="audience-name">Audience Name</Label>
                  <Input
                    id="audience-name"
                    placeholder="e.g. High-Intent Visitors"
                    value={audienceName}
                    onChange={(e) => setAudienceName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience-pages">
                    Page URLs{" "}
                    <span className="font-normal text-muted-foreground">
                      (comma-separated, optional)
                    </span>
                  </Label>
                  <Input
                    id="audience-pages"
                    placeholder="e.g. /pricing, /contact"
                    value={audiencePages}
                    onChange={(e) => setAudiencePages(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days-active">Days Active</Label>
                  <Input
                    id="days-active"
                    type="number"
                    min="1"
                    max="365"
                    value={daysActive}
                    onChange={(e) => setDaysActive(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-visits">Min Visits</Label>
                  <Input
                    id="min-visits"
                    type="number"
                    min="1"
                    value={minVisits}
                    onChange={(e) => setMinVisits(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create Audience
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Top Pages */}
      {stats.topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-4 w-4" />
              Top Tracked Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topPages.map((page, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <span className="min-w-0 truncate text-muted-foreground" title={page.url}>{page.url}</span>
                  <Badge variant="secondary" className="shrink-0">{formatNumber(page.views)} views</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4" />
            Audience Segments ({audiences.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audiences.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No audience segments yet. Install the tracking pixel on your website, then create your first audience to start retargeting visitors.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {audiences.map((audience) => (
                <div
                  key={audience.id}
                  className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/20 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-500/10">
                    <Users className="h-5 w-5 text-lime-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{audience.name}</p>
                    {audience.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {audience.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Created {new Date(audience.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold tabular-nums">
                      {formatNumber(audience.size)}
                    </p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
