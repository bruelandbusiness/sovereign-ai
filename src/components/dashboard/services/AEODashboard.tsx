"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  FileCode,
  HelpCircle,
  MapPin,
  ListOrdered,
  Globe,
  Lightbulb,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Circle,
  Clock,
  BarChart3,
  TrendingUp,
  XCircle,
  ArrowUpRight,
  PlayCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-context";

// ── Types ────────────────────────────────────────────────────

interface AEOContentItem {
  id: string;
  type: string;
  title: string;
  content: string;
  targetQuery: string;
  status: string;
  createdAt: string;
}

interface AEOQueryItem {
  id: string;
  query: string;
  platform: string;
  isCited: boolean;
  citationUrl: string | null;
  position: number | null;
  snippet: string | null;
  checkedAt: string;
}

interface AEOStrategyItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  impact: string | null;
  contentType: string;
  completedAt: string | null;
  createdAt: string;
}

interface AEOScoreData {
  score: number;
  breakdown: {
    faqSchema: number;
    localBusinessSchema: number;
    howToSchema: number;
    contentOptimization: number;
    knowledgePanel: number;
    citationRate: number;
    platformCoverage: number;
  };
  recommendations: string[];
  stats: {
    totalContent: number;
    totalQueries: number;
    citedQueries: number;
    citationRate: number;
    platformsMonitored: number;
    pendingActions: number;
  };
  trend: Array<{ week: string; cited: number; total: number }>;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

function getTypeIcon(type: string) {
  switch (type) {
    case "faq_schema":
      return <HelpCircle className="h-4 w-4" />;
    case "local_business_schema":
      return <MapPin className="h-4 w-4" />;
    case "how_to_schema":
      return <ListOrdered className="h-4 w-4" />;
    case "service_page":
      return <Globe className="h-4 w-4" />;
    case "knowledge_panel":
      return <Brain className="h-4 w-4" />;
    default:
      return <FileCode className="h-4 w-4" />;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "faq_schema":
      return "FAQ Schema";
    case "local_business_schema":
      return "Local Business Schema";
    case "how_to_schema":
      return "HowTo Schema";
    case "service_page":
      return "Service Page";
    case "knowledge_panel":
      return "Knowledge Panel";
    default:
      return type;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-500";
  if (score >= 50) return "text-yellow-400 border-yellow-500";
  return "text-red-400 border-red-500";
}

function getPlatformBadge(platform: string) {
  const config: Record<string, { label: string; className: string }> = {
    chatgpt: {
      label: "ChatGPT",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    perplexity: {
      label: "Perplexity",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    google_ai: {
      label: "Google AI",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    gemini: {
      label: "Gemini",
      className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
  };
  const c = config[platform] || {
    label: platform,
    className: "bg-gray-500/10 text-gray-400",
  };
  return (
    <Badge variant="outline" className={`text-xs ${c.className}`}>
      {c.label}
    </Badge>
  );
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return (
        <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-xs text-red-400">
          High
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-xs text-amber-400">
          Medium
        </Badge>
      );
    case "low":
      return (
        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-xs text-blue-400">
          Low
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="text-xs">{priority}</Badge>;
  }
}

function getContentTypeBadge(contentType: string) {
  const labels: Record<string, string> = {
    faq: "FAQ",
    blog: "Blog",
    schema_markup: "Schema",
    gbp_post: "GBP Post",
    citation: "Citation",
  };
  return (
    <Badge variant="secondary" className="text-xs">
      {labels[contentType] || contentType}
    </Badge>
  );
}

// ── Component ────────────────────────────────────────────────

export function AEODashboard() {
  const { toast } = useToast();
  const swrOpts = { refreshInterval: 60000, dedupingInterval: 10000, revalidateOnFocus: false } as const;

  const {
    data: scoreData,
    isLoading: scoreLoading,
    error: scoreError,
    mutate: mutateScore,
  } = useSWR<AEOScoreData>("/api/services/aeo/score", fetcher, swrOpts);

  const {
    data: contentData,
    isLoading: contentLoading,
    error: contentError,
    mutate: mutateContent,
  } = useSWR<{ content: AEOContentItem[] }>("/api/services/aeo", fetcher, swrOpts);

  const {
    data: queryData,
    isLoading: queriesLoading,
    error: queriesError,
    mutate: mutateQueries,
  } = useSWR<{ queries: AEOQueryItem[] }>(
    "/api/services/aeo/queries",
    fetcher,
    swrOpts
  );

  const {
    data: strategyData,
    isLoading: strategiesLoading,
    error: strategiesError,
    mutate: mutateStrategies,
  } = useSWR<{ strategies: AEOStrategyItem[] }>(
    "/api/services/aeo/strategies",
    fetcher,
    swrOpts
  );

  // Content generation state
  const [targetQuery, setTargetQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Query tracking state
  const [newQuery, setNewQuery] = useState("");
  const [newPlatform, setNewPlatform] = useState("chatgpt");
  const [addingQuery, setAddingQuery] = useState(false);

  // Strategy generation state
  const [generatingStrategies, setGeneratingStrategies] = useState(false);
  const [updatingStrategyId, setUpdatingStrategyId] = useState<string | null>(
    null
  );

  // ── Handlers ─────────────────────────────────────────────

  async function handleGenerateContent() {
    if (!targetQuery.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/services/aeo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetQuery: targetQuery.trim() }),
      });
      if (res.ok) {
        setTargetQuery("");
        mutateContent();
        mutateScore();
      }
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDeleteContent(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/services/aeo/${id}`, { method: "DELETE" });
      mutateContent();
      mutateScore();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddQuery() {
    if (!newQuery.trim() || addingQuery) return;
    setAddingQuery(true);
    try {
      const res = await fetch("/api/services/aeo/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: newQuery.trim(),
          platform: newPlatform,
        }),
      });
      if (res.ok) {
        setNewQuery("");
        mutateQueries();
        mutateScore();
      }
    } finally {
      setAddingQuery(false);
    }
  }

  async function handleDeleteQuery(id: string) {
    try {
      await fetch("/api/services/aeo/queries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      mutateQueries();
      mutateScore();
    } catch {
      toast("We couldn't delete the query. Please try again.", "error");
    }
  }

  async function handleGenerateStrategies() {
    if (generatingStrategies) return;
    setGeneratingStrategies(true);
    try {
      const res = await fetch("/api/services/aeo/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      if (res.ok) {
        mutateStrategies();
        mutateScore();
      }
    } finally {
      setGeneratingStrategies(false);
    }
  }

  async function handleUpdateStrategy(
    id: string,
    status: "pending" | "in_progress" | "completed"
  ) {
    setUpdatingStrategyId(id);
    try {
      const res = await fetch("/api/services/aeo/strategies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        mutateStrategies();
        mutateScore();
      }
    } finally {
      setUpdatingStrategyId(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (scoreLoading && contentLoading && queriesLoading && strategiesLoading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-muted-foreground">
          Loading AEO Dashboard...
        </span>
      </div>
    );
  }

  if (scoreError || contentError || queriesError || strategiesError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
        Failed to load AEO data. Please try refreshing the page.
      </div>
    );
  }

  const aeoScore = scoreData?.score || 0;
  const breakdown = scoreData?.breakdown;
  const recommendations = scoreData?.recommendations || [];
  const stats = scoreData?.stats;
  const trend = scoreData?.trend || [];
  const contentList = contentData?.content || [];
  const queryList = queryData?.queries || [];
  const strategyList = strategyData?.strategies || [];

  const maxTrendValue = Math.max(...trend.map((t) => t.total), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Brain className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            Answer Engine Optimization
          </h1>
          <p className="text-sm text-muted-foreground">
            Get cited in ChatGPT, Perplexity, Google AI Overviews & Gemini
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Key metrics">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">AEO Score</p>
                <p className={`mt-1 text-2xl font-bold ${aeoScore >= 80 ? "text-emerald-400" : aeoScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                  {aeoScore}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${getScoreColor(aeoScore)}`}
              >
                <Brain className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">out of 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Queries Tracked</p>
                <p className="mt-1 text-2xl font-bold">
                  {stats?.totalQueries || 0}
                </p>
              </div>
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              across {stats?.platformsMonitored || 0} platforms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Citation Rate</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">
                  {stats?.citationRate || 0}%
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats?.citedQueries || 0} of {stats?.totalQueries || 0} queries
              cited
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Action Items
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-400">
                  {stats?.pendingActions || 0}
                </p>
              </div>
              <Lightbulb className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              pending strategies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Citation Trend */}
      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-4 w-4" />
              Citation Trend (Last 8 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2" style={{ height: 120 }} role="img" aria-label={`Citation trend chart showing ${trend.length} weeks of data. Latest week: ${trend.length > 0 ? `${trend[trend.length - 1].cited} cited out of ${trend[trend.length - 1].total} total` : "no data"}`}>
              {trend.map((week, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div className="flex w-full flex-col items-center gap-0.5" style={{ height: 80 }}>
                    {/* Total bar (background) */}
                    <div className="relative w-full max-w-[40px] flex-1">
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-muted"
                        style={{
                          height: `${(week.total / maxTrendValue) * 100}%`,
                          minHeight: week.total > 0 ? 4 : 0,
                        }}
                      />
                      {/* Cited bar (foreground) */}
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-violet-500"
                        style={{
                          height: `${(week.cited / maxTrendValue) * 100}%`,
                          minHeight: week.cited > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {week.week}
                  </span>
                  <span className="text-[10px] font-medium">
                    {week.cited}/{week.total}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-500" />
                Cited
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" />
                Total Checked
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="queries">
        <TabsList>
          <TabsTrigger value="queries">Query Tracking</TabsTrigger>
          <TabsTrigger value="strategies">AI Strategies</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* ── Query Tracking Tab ─────────────────────────────── */}
        <TabsContent value="queries">
          <div className="space-y-4">
            {/* Add Query Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Plus className="h-4 w-4" />
                  Track a New Query
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newQuery}
                    onChange={(e) => setNewQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddQuery();
                    }}
                    placeholder='e.g., "best plumber in Denver" or "how to fix a leaky faucet"'
                    aria-label="Search query to track"
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    aria-label="AI platform"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="chatgpt">ChatGPT</option>
                    <option value="perplexity">Perplexity</option>
                    <option value="google_ai">Google AI</option>
                    <option value="gemini">Gemini</option>
                  </select>
                  <Button
                    disabled={!newQuery.trim() || addingQuery}
                    onClick={handleAddQuery}
                  >
                    {addingQuery ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-1.5 h-4 w-4" />
                    )}
                    Add Query
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Query Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Search className="h-4 w-4" />
                    Tracked Queries ({queryList.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {queryList.length === 0 ? (
                  <div className="py-8 text-center">
                    <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No queries tracked yet. Add queries above to monitor your
                      AI citation visibility.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="Tracked queries">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th scope="col" className="pb-3 text-left font-medium text-muted-foreground">
                            Query
                          </th>
                          <th scope="col" className="pb-3 text-left font-medium text-muted-foreground">
                            Platform
                          </th>
                          <th scope="col" className="pb-3 text-center font-medium text-muted-foreground">
                            Cited
                          </th>
                          <th scope="col" className="pb-3 text-center font-medium text-muted-foreground">
                            Position
                          </th>
                          <th scope="col" className="pb-3 text-left font-medium text-muted-foreground">
                            Last Checked
                          </th>
                          <th scope="col" className="pb-3 text-right font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {queryList.map((q) => (
                          <tr key={q.id} className="group">
                            <td className="py-3 pr-4">
                              <p className="font-medium">{q.query}</p>
                              {q.snippet && (
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                  {q.snippet}
                                </p>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              {getPlatformBadge(q.platform)}
                            </td>
                            <td className="py-3 text-center">
                              {q.isCited ? (
                                <span className="inline-flex items-center">
                                  <CheckCircle className="mx-auto h-5 w-5 text-emerald-400" aria-hidden="true" />
                                  <span className="sr-only">Yes, cited</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center">
                                  <XCircle className="mx-auto h-5 w-5 text-red-400/60" aria-hidden="true" />
                                  <span className="sr-only">Not cited</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {q.position ? (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${q.position <= 3 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-400"}`}
                                >
                                  #{q.position}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  --
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-xs text-muted-foreground">
                              {new Date(q.checkedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {q.citationUrl && (
                                  <a
                                    href={q.citationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`View citation for: ${q.query} (opens in new tab)`}
                                  >
                                    <Button variant="ghost" size="icon-sm">
                                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                    </Button>
                                  </a>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                                  onClick={() => handleDeleteQuery(q.id)}
                                  aria-label={`Delete query: ${q.query}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AI Strategies Tab ──────────────────────────────── */}
        <TabsContent value="strategies">
          <div className="space-y-4">
            {/* Generate Button + Recommendations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Lightbulb className="h-4 w-4" />
                    AEO Strategies
                  </CardTitle>
                  <Button
                    onClick={handleGenerateStrategies}
                    disabled={generatingStrategies}
                  >
                    {generatingStrategies ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        Generate New Strategies
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 && (
                  <div className="mb-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                      Quick Recommendations
                    </p>
                    <ul className="space-y-1.5">
                      {recommendations.slice(0, 3).map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {strategyList.length === 0 ? (
                  <div className="py-8 text-center">
                    <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No strategies yet. Click &quot;Generate New
                      Strategies&quot; to get AI-powered recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {strategyList.map((strategy) => (
                      <div
                        key={strategy.id}
                        className={`rounded-lg border p-4 ${strategy.status === "completed" ? "border-emerald-500/20 bg-emerald-500/5" : "border-border/50 bg-muted/20"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {strategy.status === "completed" ? (
                              <CheckCircle className="h-5 w-5 text-emerald-400" />
                            ) : strategy.status === "in_progress" ? (
                              <Clock className="h-5 w-5 text-amber-400" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`font-medium ${strategy.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                              >
                                {strategy.title}
                              </p>
                              {getPriorityBadge(strategy.priority)}
                              {getContentTypeBadge(strategy.contentType)}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {strategy.description}
                            </p>
                            {strategy.impact && (
                              <p className="mt-1 text-xs font-medium text-violet-400">
                                {strategy.impact}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2 pl-8">
                          {strategy.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingStrategyId === strategy.id}
                              onClick={() =>
                                handleUpdateStrategy(
                                  strategy.id,
                                  "in_progress"
                                )
                              }
                            >
                              {updatingStrategyId === strategy.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Start
                            </Button>
                          )}
                          {strategy.status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingStrategyId === strategy.id}
                              onClick={() =>
                                handleUpdateStrategy(
                                  strategy.id,
                                  "completed"
                                )
                              }
                            >
                              {updatingStrategyId === strategy.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Complete
                            </Button>
                          )}
                          {strategy.status === "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={updatingStrategyId === strategy.id}
                              onClick={() =>
                                handleUpdateStrategy(strategy.id, "pending")
                              }
                            >
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Reopen
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Content Tab ────────────────────────────────────── */}
        <TabsContent value="content">
          <div className="space-y-4">
            {/* AEO Score Breakdown */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Brain className="h-4 w-4" />
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${getScoreColor(aeoScore)}`}
                  >
                    <span className="text-2xl font-bold">{aeoScore}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    out of 100
                  </p>

                  {breakdown && (
                    <div className="mt-4 w-full space-y-2">
                      {[
                        {
                          label: "FAQ Schema",
                          value: breakdown.faqSchema,
                          max: 15,
                        },
                        {
                          label: "Local Business",
                          value: breakdown.localBusinessSchema,
                          max: 10,
                        },
                        {
                          label: "HowTo Schema",
                          value: breakdown.howToSchema,
                          max: 10,
                        },
                        {
                          label: "Content",
                          value: breakdown.contentOptimization,
                          max: 10,
                        },
                        {
                          label: "Knowledge Panel",
                          value: breakdown.knowledgePanel,
                          max: 5,
                        },
                        {
                          label: "Citation Rate",
                          value: breakdown.citationRate,
                          max: 30,
                        },
                        {
                          label: "Platform Coverage",
                          value: breakdown.platformCoverage,
                          max: 20,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2"
                          role="meter"
                          aria-label={item.label}
                          aria-valuenow={item.value}
                          aria-valuemin={0}
                          aria-valuemax={item.max}
                        >
                          <span className="w-28 text-xs text-muted-foreground">
                            {item.label}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                            <div
                              className="h-full rounded-full bg-violet-400 transition-all"
                              style={{
                                width: `${item.max > 0 ? (item.value / item.max) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs text-muted-foreground">
                            {item.value}/{item.max}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generate Content */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Sparkles className="h-4 w-4" />
                    Generate AEO Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Enter a query your customers might ask AI assistants. We
                    will generate optimized FAQ content, structured data, and
                    service pages to help your business appear in AI search
                    results.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={targetQuery}
                      onChange={(e) => setTargetQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGenerateContent();
                      }}
                      placeholder='e.g., "Best plumber in Austin TX" or "How much does drain cleaning cost?"'
                      aria-label="Target query for content generation"
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button
                      disabled={!targetQuery.trim() || generating}
                      onClick={handleGenerateContent}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1.5 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileCode className="h-4 w-4" />
                  AEO Content ({contentList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentList.length === 0 ? (
                  <div className="py-8 text-center">
                    <Brain className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No AEO content yet. Use the form above to generate
                      optimized content for AI search engines.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contentList.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border/50 bg-muted/20 p-4"
                      >
                        <div className="flex items-center gap-3">
                          {getTypeIcon(item.type)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Target: &quot;{item.targetQuery}&quot;
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(item.type)}
                          </Badge>
                          <Badge
                            variant={
                              item.status === "published"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        </div>

                        {expandedId === item.id && (
                          <div className="mt-3 rounded-lg border border-border/50 bg-background p-3">
                            <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                              {item.content}
                            </pre>
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setExpandedId(
                                expandedId === item.id ? null : item.id
                              )
                            }
                          >
                            {expandedId === item.id ? "Collapse" : "Preview"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCopy(item.id, item.content)
                            }
                          >
                            {copiedId === item.id ? (
                              <>
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto text-destructive hover:text-destructive"
                            disabled={deletingId === item.id}
                            onClick={() => handleDeleteContent(item.id)}
                            aria-label={`Delete content: ${item.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
