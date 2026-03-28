"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  Loader2,
  FileSearch,
  BarChart3,
  AlertTriangle,
  Settings,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// Textarea reserved for future SEO content editing features
import {
  ServiceHero,
  MetricCard,
  ActivityFeed,
  HowItWorks,
  PerformanceChart,
  type ActivityItem,
} from "./ServiceDetailLayout";

// ── Types ────────────────────────────────────────────────────

interface Keyword {
  id: string;
  keyword: string;
  position: number;
  previousPosition: number | null;
  searchVolume: number;
  difficulty: number;
  updatedAt: string;
}

interface AuditResult {
  score: number;
  issues: { severity: "error" | "warning" | "info"; message: string }[];
  recommendations: string[];
}

interface KeywordsResponse {
  keywords: Keyword[];
  isMock: boolean;
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

function getTrend(current: number, previous: number | null): "up" | "down" | "neutral" {
  if (previous === null) return "neutral";
  if (current < previous) return "up";
  if (current > previous) return "down";
  return "neutral";
}

function getPositionChange(current: number, previous: number | null): number {
  if (previous === null) return 0;
  return previous - current;
}

function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 30) return "text-emerald-400";
  if (difficulty <= 60) return "text-yellow-400";
  return "text-red-400";
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 30) return "Easy";
  if (difficulty <= 60) return "Medium";
  return "Hard";
}

// ── Component ────────────────────────────────────────────────

export function SEODashboard() {
  const {
    data: keywordsResponse,
    error: keywordsError,
    isLoading,
    mutate,
  } = useSWR<KeywordsResponse>("/api/services/seo/keywords", fetcher);

  const [newKeyword, setNewKeyword] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [targetLocation, setTargetLocation] = useState<string | null>(null);

  const keywordList = keywordsResponse?.keywords || [];
  const isMock = keywordsResponse?.isMock || false;
  const trackedCount = keywordList.length;
  const avgPosition =
    keywordList.length > 0
      ? (keywordList.reduce((sum, k) => sum + k.position, 0) / keywordList.length).toFixed(1)
      : "--";
  const improved = keywordList.filter(
    (k) => k.previousPosition !== null && k.position < k.previousPosition
  ).length;
  const declined = keywordList.filter(
    (k) => k.previousPosition !== null && k.position > k.previousPosition
  ).length;
  const topTenCount = keywordList.filter((k) => k.position <= 10).length;
  const totalSearchVolume = keywordList.reduce((sum, k) => sum + k.searchVolume, 0);

  // ── Handlers ─────────────────────────────────────────────

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/services/seo/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      if (res.ok) {
        setNewKeyword("");
        mutate();
      }
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRunAudit() {
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const res = await fetch("/api/services/seo/audit", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
      }
    } finally {
      setIsAuditing(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading SEO data...</span>
      </div>
    );
  }

  if (keywordsError) {
    return (
      <div className="flex items-center justify-center py-20" role="alert">
        <p className="text-sm text-destructive">
          Failed to load SEO data. Make sure the SEO service is provisioned.
        </p>
      </div>
    );
  }

  // Activity feed from keyword movements
  const activityItems: ActivityItem[] = keywordList
    .filter((k) => k.previousPosition !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .map((k) => {
      const change = getPositionChange(k.position, k.previousPosition);
      const isImproved = change > 0;
      return {
        id: k.id,
        icon: isImproved ? TrendingUp : TrendingDown,
        iconColor: isImproved ? "text-emerald-400" : "text-red-400",
        iconBg: isImproved ? "bg-emerald-500/10" : "bg-red-500/10",
        title: isImproved
          ? `"${k.keyword}" moved up ${change} positions`
          : `"${k.keyword}" dropped ${Math.abs(change)} positions`,
        description: `Now at position #${k.position} (was #${k.previousPosition}) -- ${formatNumber(k.searchVolume)} monthly searches`,
        timestamp: new Date(k.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      };
    });

  const howItWorksSteps = [
    {
      step: 1,
      title: "Keyword research & targeting",
      description: "AI identifies the highest-value local keywords your customers are searching for -- terms like 'plumber near me' and 'emergency AC repair'.",
    },
    {
      step: 2,
      title: "On-page optimization",
      description: "Your website pages are optimized with proper title tags, meta descriptions, header structure, and content that matches search intent.",
    },
    {
      step: 3,
      title: "Content creation",
      description: "AI generates SEO-optimized blog posts, service pages, and location pages that build your topical authority.",
    },
    {
      step: 4,
      title: "Technical SEO & monitoring",
      description: "Site speed, mobile-friendliness, schema markup, and crawlability are continuously monitored and improved.",
    },
  ];

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Hero */}
      <ServiceHero
        serviceName="AI SEO Domination"
        tagline="Rank #1 in your local market with AI-powered optimization"
        icon={Search}
        iconBg="bg-green-500/10"
        iconColor="text-green-400"
        isActive
        sinceDate={keywordList.length > 0 ? keywordList[0].updatedAt : null}
      />

      {/* Sample Data Banner */}
      {isMock && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-center gap-2" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sample Data -- Connect DataForSEO to see real keyword rankings</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Keywords Tracked"
          value={trackedCount}
          icon={Search}
          iconColor="text-green-400"
          iconBg="bg-green-500/10"
        />
        <MetricCard
          label="Avg Position"
          value={avgPosition}
          icon={BarChart3}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          trend={improved > 0 ? `${improved} keywords improved` : undefined}
          trendUp={improved > 0}
        />
        <MetricCard
          label="Page 1 Rankings"
          value={topTenCount}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          trend={topTenCount > 0 ? `${((topTenCount / Math.max(trackedCount, 1)) * 100).toFixed(0)}% of keywords` : undefined}
          trendUp={topTenCount > 0}
        />
        <MetricCard
          label="Total Search Volume"
          value={formatNumber(totalSearchVolume)}
          icon={Eye}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          trend="Monthly potential impressions"
        />
        <MetricCard
          label="Declined"
          value={declined}
          icon={TrendingDown}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
        />
      </div>

      {/* Performance Chart */}
      <PerformanceChart
        title="Organic Traffic Trend"
        description="Estimated organic traffic growth over the current billing period."
        color="bg-green-500/60"
      />

      {/* Activity Feed */}
      <ActivityFeed
        items={activityItems}
        title="Recent SEO Activity"
        emptyMessage="No ranking changes yet. Add keywords to start tracking your SEO progress."
      />

      {/* Add Keyword + Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Plus className="h-4 w-4" />
              Track a Keyword
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddKeyword} className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="e.g. plumber near me"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  required
                  aria-label="Keyword to track"
                />
              </div>
              <Button type="submit" size="sm" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add
                  </>
                )}
              </Button>
            </form>
            <Button
              onClick={handleRunAudit}
              size="sm"
              variant="outline"
              disabled={isAuditing}
              className="w-full"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Running Audit...
                </>
              ) : (
                <>
                  <FileSearch className="mr-1.5 h-4 w-4" />
                  Run Site Audit
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              SEO Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-optimize">Auto-Optimize Pages</Label>
              <Switch id="auto-optimize" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-reports">Weekly SEO Reports</Label>
              <Switch id="weekly-reports" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="content-creation">AI Content Creation</Label>
              <Switch id="content-creation" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-location">Target Location</Label>
              <Input
                id="target-location"
                value={targetLocation ?? "Austin, TX"}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="e.g. Denver, CO"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Results */}
      {auditResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileSearch className="h-4 w-4" />
              Audit Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${
                  auditResult.score >= 80
                    ? "border-emerald-500 text-emerald-400"
                    : auditResult.score >= 50
                      ? "border-yellow-500 text-yellow-400"
                      : "border-red-500 text-red-400"
                }`}
                role="meter"
                aria-valuenow={auditResult.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`SEO score: ${auditResult.score} out of 100`}
              >
                <span className="text-xl font-bold">{auditResult.score}</span>
              </div>
              <div>
                <p className="font-medium">SEO Score: {auditResult.score}/100</p>
                <p className="text-sm text-muted-foreground">
                  {auditResult.issues.length} issue{auditResult.issues.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {auditResult.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Issues:</p>
                {auditResult.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 text-sm ${
                      issue.severity === "error"
                        ? "border-red-500/20 bg-red-500/5 text-red-400"
                        : issue.severity === "warning"
                          ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
                          : "border-blue-500/20 bg-blue-500/5 text-blue-400"
                    }`}
                  >
                    <span className="font-medium capitalize">{issue.severity}:</span> {issue.message}
                  </div>
                ))}
              </div>
            )}

            {auditResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations:</p>
                <ul className="space-y-1">
                  {auditResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keyword Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Keywords ({keywordList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywordList.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No keywords tracked yet. Add your first keyword above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Keywords table">
              <table className="w-full text-sm" aria-label="Tracked keywords">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">Keyword</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">Position</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">Previous</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">Trend</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">Volume</th>
                    <th className="pb-3 font-medium text-muted-foreground" scope="col">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {keywordList.map((kw) => {
                    const trend = getTrend(kw.position, kw.previousPosition);
                    const change = getPositionChange(kw.position, kw.previousPosition);
                    return (
                      <tr key={kw.id}>
                        <td className="py-3 pr-4 font-medium">{kw.keyword}</td>
                        <td className="py-3 pr-4 tabular-nums font-semibold">#{kw.position}</td>
                        <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                          {kw.previousPosition !== null ? `#${kw.previousPosition}` : "--"}
                        </td>
                        <td className="py-3 pr-4">
                          {trend === "up" && (
                            <span className="flex items-center gap-1 text-emerald-400" aria-label={`Improved by ${change} positions`}>
                              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="text-xs font-medium">+{change}</span>
                            </span>
                          )}
                          {trend === "down" && (
                            <span className="flex items-center gap-1 text-red-400" aria-label={`Declined by ${Math.abs(change)} positions`}>
                              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="text-xs font-medium">{change}</span>
                            </span>
                          )}
                          {trend === "neutral" && (
                            <span className="flex items-center gap-1 text-muted-foreground" aria-label="No change">
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="text-xs">--</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                          {formatNumber(kw.searchVolume)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`font-medium tabular-nums ${getDifficultyColor(kw.difficulty)}`}
                            title={getDifficultyLabel(kw.difficulty)}
                          >
                            {kw.difficulty}/100
                            <span className="sr-only"> ({getDifficultyLabel(kw.difficulty)})</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <HowItWorks steps={howItWorksSteps} />
    </div>
  );
}
