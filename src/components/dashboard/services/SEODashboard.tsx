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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  if (current < previous) return "up"; // lower position = better in SEO
  if (current > previous) return "down";
  return "neutral";
}

function getPositionChange(current: number, previous: number | null): number {
  if (previous === null) return 0;
  return previous - current; // positive = improved
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
    isLoading,
    mutate,
  } = useSWR<KeywordsResponse>("/api/services/seo/keywords", fetcher);

  const [newKeyword, setNewKeyword] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const keywordList = keywordsResponse?.keywords || [];
  const isMock = keywordsResponse?.isMock || false;
  const trackedCount = keywordList.length;
  const avgPosition =
    keywordList.length > 0
      ? (
          keywordList.reduce((sum, k) => sum + k.position, 0) / keywordList.length
        ).toFixed(1)
      : "--";
  const improved = keywordList.filter(
    (k) => k.previousPosition !== null && k.position < k.previousPosition
  ).length;
  const declined = keywordList.filter(
    (k) => k.previousPosition !== null && k.position > k.previousPosition
  ).length;

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

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <Search className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">SEO Domination</h1>
            <p className="text-sm text-muted-foreground">
              Keyword tracking and site audit tools
            </p>
          </div>
        </div>
        <Button
          onClick={handleRunAudit}
          size="sm"
          variant="outline"
          disabled={isAuditing}
        >
          {isAuditing ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Auditing...
            </>
          ) : (
            <>
              <FileSearch className="mr-1.5 h-4 w-4" />
              Run Audit
            </>
          )}
        </Button>
      </div>

      {/* Sample Data Banner */}
      {isMock && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-center gap-2 mb-4" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sample Data — Connect DataForSEO to see real keyword rankings</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              <p className="text-xs">Tracked Keywords</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{trackedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs">Avg Position</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{avgPosition}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs">Improved</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
              {improved}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              <p className="text-xs">Declined</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-red-400">
              {declined}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Keyword Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4" />
            Track a Keyword
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  Add Keyword
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

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
                aria-label={`SEO score: ${auditResult.score} out of 100, ${auditResult.score >= 80 ? "Good" : auditResult.score >= 50 ? "Fair" : "Needs improvement"}`}
              >
                <span className="text-xl font-bold">{auditResult.score}</span>
              </div>
              <div>
                <p className="font-medium">
                  SEO Score: {auditResult.score}/100
                </p>
                <p className="text-sm text-muted-foreground">
                  {auditResult.issues.length} issue
                  {auditResult.issues.length !== 1 ? "s" : ""} found
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
                    <span className="font-medium capitalize">{issue.severity}:</span>{" "}
                    {issue.message}
                  </div>
                ))}
              </div>
            )}

            {auditResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations:</p>
                <ul className="space-y-1">
                  {auditResult.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
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
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">
                      Keyword
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">
                      Position
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">
                      Previous
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">
                      Trend
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground" scope="col">
                      Volume
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground" scope="col">
                      Difficulty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {keywordList.map((kw) => {
                    const trend = getTrend(kw.position, kw.previousPosition);
                    const change = getPositionChange(kw.position, kw.previousPosition);
                    return (
                      <tr key={kw.id}>
                        <td className="py-3 pr-4 font-medium">{kw.keyword}</td>
                        <td className="py-3 pr-4 tabular-nums font-semibold">
                          #{kw.position}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                          {kw.previousPosition !== null
                            ? `#${kw.previousPosition}`
                            : "--"}
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
    </div>
  );
}
