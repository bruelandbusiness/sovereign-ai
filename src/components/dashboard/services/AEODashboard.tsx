"use client";

import { useState, useMemo } from "react";
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
  BarChart3,
  TrendingUp,
  XCircle,
  ArrowUpRight,
  PlayCircle,
  Eye,
  Quote,
  Users,
  AlertTriangle,
  MessageSquare,
  Zap,
  Target,
  ArrowUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-context";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { SEMANTIC_COLORS } from "@/components/charts/chart-theme";

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

// ── Mock data for new sections ──────────────────────────────

const MOCK_CONTENT_GAPS = [
  {
    id: "cg1",
    question: "How much does emergency plumbing cost on weekends?",
    searchVolume: 1400,
    aiMentions: 12,
    difficulty: "Low",
    opportunity: "High",
  },
  {
    id: "cg2",
    question: "What is the average cost of HVAC repair in my area?",
    searchVolume: 2200,
    aiMentions: 28,
    difficulty: "Medium",
    opportunity: "High",
  },
  {
    id: "cg3",
    question: "How long does a water heater installation take?",
    searchVolume: 890,
    aiMentions: 8,
    difficulty: "Low",
    opportunity: "Medium",
  },
  {
    id: "cg4",
    question: "Signs you need to replace your electrical panel",
    searchVolume: 1100,
    aiMentions: 15,
    difficulty: "Medium",
    opportunity: "Medium",
  },
  {
    id: "cg5",
    question: "Best time of year to service your furnace",
    searchVolume: 3100,
    aiMentions: 35,
    difficulty: "High",
    opportunity: "Low",
  },
];

const MOCK_CITATIONS = [
  {
    id: "ct1",
    platform: "chatgpt",
    query: "best plumber near me for emergency leak repair",
    snippet:
      "Based on customer reviews and availability, [Your Business] is highly rated for emergency plumbing services with 24/7 availability...",
    citedAt: "2026-03-27T14:30:00Z",
    position: 1,
    url: "https://chat.openai.com/share/abc123",
  },
  {
    id: "ct2",
    platform: "google_ai",
    query: "how much does drain cleaning cost",
    snippet:
      "According to [Your Business], professional drain cleaning typically costs between $150-$350 depending on the severity...",
    citedAt: "2026-03-26T10:15:00Z",
    position: 2,
    url: null,
  },
  {
    id: "ct3",
    platform: "perplexity",
    query: "top rated HVAC companies with financing",
    snippet:
      "[Your Business] offers 0% financing for 12 months on all HVAC installations, with a 4.9-star rating across 200+ reviews...",
    citedAt: "2026-03-25T16:45:00Z",
    position: 1,
    url: "https://perplexity.ai/search/abc",
  },
  {
    id: "ct4",
    platform: "gemini",
    query: "licensed electricians for panel upgrade",
    snippet:
      "For electrical panel upgrades, [Your Business] is a licensed and insured contractor specializing in residential panel upgrades...",
    citedAt: "2026-03-24T09:20:00Z",
    position: 3,
    url: null,
  },
  {
    id: "ct5",
    platform: "chatgpt",
    query: "water heater replacement same day service",
    snippet:
      "[Your Business] provides same-day water heater replacement services with upfront pricing and no hidden fees...",
    citedAt: "2026-03-23T11:00:00Z",
    position: 2,
    url: "https://chat.openai.com/share/def456",
  },
];

const MOCK_COMPETITOR_DATA = [
  { name: "You", score: 72, citations: 34, queries: 48 },
  { name: "Competitor A", score: 58, citations: 21, queries: 35 },
  { name: "Competitor B", score: 45, citations: 14, queries: 29 },
  { name: "Competitor C", score: 31, citations: 8, queries: 22 },
];

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

function getScoreRingColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

function getPlatformConfig(platform: string) {
  const config: Record<string, { label: string; className: string; dotColor: string }> = {
    chatgpt: {
      label: "ChatGPT",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dotColor: "bg-emerald-400",
    },
    perplexity: {
      label: "Perplexity",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dotColor: "bg-blue-400",
    },
    google_ai: {
      label: "Google AI",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dotColor: "bg-amber-400",
    },
    gemini: {
      label: "Gemini",
      className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      dotColor: "bg-purple-400",
    },
  };
  return config[platform] || {
    label: platform,
    className: "bg-muted text-muted-foreground",
    dotColor: "bg-muted-foreground",
  };
}

function getPlatformBadge(platform: string) {
  const c = getPlatformConfig(platform);
  return (
    <Badge variant="outline" className={`text-xs ${c.className}`}>
      {c.label}
    </Badge>
  );
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
    case "High":
      return (
        <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-xs text-red-400">
          High
        </Badge>
      );
    case "medium":
    case "Medium":
      return (
        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-xs text-amber-400">
          Medium
        </Badge>
      );
    case "low":
    case "Low":
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

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ── Circular Progress Ring ──────────────────────────────────

function ScoreRing({
  score,
  size = 160,
  strokeWidth = 10,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const color = getScoreRingColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        role="img"
        aria-label={`AEO Score: ${score} out of 100`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s ease-out",
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold tracking-tight ${getScoreTextColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">out of 100</span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest mt-1 ${getScoreTextColor(score)}`}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────

export function AEODashboard() {
  const { toast } = useToast();
  const swrOpts = {
    refreshInterval: 60000,
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  } as const;

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
  } = useSWR<{ content: AEOContentItem[] }>(
    "/api/services/aeo",
    fetcher,
    swrOpts,
  );

  const {
    data: queryData,
    isLoading: queriesLoading,
    error: queriesError,
    mutate: mutateQueries,
  } = useSWR<{ queries: AEOQueryItem[] }>(
    "/api/services/aeo/queries",
    fetcher,
    swrOpts,
  );

  const {
    data: strategyData,
    isLoading: strategiesLoading,
    error: strategiesError,
    mutate: mutateStrategies,
  } = useSWR<{ strategies: AEOStrategyItem[] }>(
    "/api/services/aeo/strategies",
    fetcher,
    swrOpts,
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
    null,
  );

  // Derived data
  const trendChartData = useMemo(() => {
    const trend = scoreData?.trend || [];
    return trend.map((t) => ({
      week: t.week,
      cited: t.cited,
      total: t.total,
      rate: t.total > 0 ? Math.round((t.cited / t.total) * 100) : 0,
    }));
  }, [scoreData?.trend]);

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
    status: "pending" | "in_progress" | "completed",
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
      <div
        className="flex items-center justify-center py-20"
        role="status"
        aria-busy="true"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="ml-2 text-muted-foreground">
          Loading AEO Dashboard...
        </span>
      </div>
    );
  }

  if (scoreError || contentError || queriesError || strategiesError) {
    return (
      <div
        className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        role="alert"
      >
        Failed to load AEO data. Please try refreshing the page.
      </div>
    );
  }

  const aeoScore = scoreData?.score || 0;
  const breakdown = scoreData?.breakdown;
  const recommendations = scoreData?.recommendations || [];
  const stats = scoreData?.stats;
  const contentList = contentData?.content || [];
  const queryList = queryData?.queries || [];
  const strategyList = strategyData?.strategies || [];

  const pendingStrategies = strategyList.filter(
    (s) => s.status !== "completed",
  );
  const optimizationSuggestions = [
    ...pendingStrategies.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      priority: s.priority,
      impact: s.impact,
      contentType: s.contentType,
      status: s.status,
    })),
    ...(pendingStrategies.length === 0
      ? [
          {
            id: "sug-1",
            title: "Add FAQ schema to service pages",
            description:
              "Structured FAQ data helps AI engines extract and cite your answers directly.",
            priority: "high",
            impact: "Could improve citation rate by 15-25%",
            contentType: "schema_markup",
            status: "pending",
          },
          {
            id: "sug-2",
            title: "Improve Google Business Profile completeness",
            description:
              "A complete GBP with services, hours, and Q&A is heavily weighted by AI overviews.",
            priority: "high",
            impact: "Increases local AI visibility by up to 40%",
            contentType: "gbp_post",
            status: "pending",
          },
          {
            id: "sug-3",
            title: "Create how-to guides for common repairs",
            description:
              "Step-by-step guides with HowTo schema markup are frequently cited by AI assistants.",
            priority: "medium",
            impact: "Establishes authority for informational queries",
            contentType: "blog",
            status: "pending",
          },
          {
            id: "sug-4",
            title: "Add pricing transparency content",
            description:
              'AI engines prioritize businesses with clear, published pricing for "cost" queries.',
            priority: "medium",
            impact: "Captures high-intent cost-related queries",
            contentType: "faq",
            status: "pending",
          },
          {
            id: "sug-5",
            title: "Build local citation consistency",
            description:
              "Ensure NAP (Name, Address, Phone) consistency across 40+ directories for AI trust signals.",
            priority: "low",
            impact: "Strengthens entity recognition across AI models",
            contentType: "citation",
            status: "pending",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" aria-label="Back to dashboard">
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
            Get cited in ChatGPT, Perplexity, Google AI Overviews &amp; Gemini
          </p>
        </div>
      </div>

      {/* ── 1. AEO Score Ring + Score Breakdown ────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score Ring */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ScoreRing score={aeoScore} />
            <p className="mt-4 text-sm text-muted-foreground text-center max-w-[200px]">
              Your AI answer engine readiness score based on 7 ranking factors
            </p>
          </CardContent>
        </Card>

        {/* Score Breakdown Bars */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-4 w-4 text-violet-400" />
              Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown ? (
              <div className="space-y-3">
                {[
                  {
                    label: "FAQ Schema",
                    value: breakdown.faqSchema,
                    max: 15,
                    icon: <HelpCircle className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "Local Business Schema",
                    value: breakdown.localBusinessSchema,
                    max: 10,
                    icon: <MapPin className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "HowTo Schema",
                    value: breakdown.howToSchema,
                    max: 10,
                    icon: <ListOrdered className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "Content Optimization",
                    value: breakdown.contentOptimization,
                    max: 10,
                    icon: <FileCode className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "Knowledge Panel",
                    value: breakdown.knowledgePanel,
                    max: 5,
                    icon: <Brain className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "Citation Rate",
                    value: breakdown.citationRate,
                    max: 30,
                    icon: <Quote className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "Platform Coverage",
                    value: breakdown.platformCoverage,
                    max: 20,
                    icon: <Globe className="h-3.5 w-3.5" />,
                  },
                ].map((item) => {
                  const pct =
                    item.max > 0 ? (item.value / item.max) * 100 : 0;
                  return (
                    <div
                      key={item.label}
                      className="group flex items-center gap-3"
                      role="meter"
                      aria-label={item.label}
                      aria-valuenow={item.value}
                      aria-valuemin={0}
                      aria-valuemax={item.max}
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="w-36 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.label}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct >= 80
                                ? "linear-gradient(90deg, #22c55e, #10b981)"
                                : pct >= 50
                                  ? "linear-gradient(90deg, #f59e0b, #eab308)"
                                  : "linear-gradient(90deg, #ef4444, #f87171)",
                          }}
                        />
                      </div>
                      <span className="w-14 text-right text-xs font-medium tabular-nums text-muted-foreground">
                        {item.value}/{item.max}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  Score data will appear after your first AEO audit.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 2. AI Visibility Metrics ──────────────────────── */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        role="region"
        aria-label="AI Visibility Metrics"
      >
        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-500/30">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500/80 to-violet-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  AI Mentions
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums">
                  {stats?.citedQueries || 0}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-500/10">
                <Eye className="h-5 w-5 text-violet-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                <ArrowUp className="h-3 w-3" />
                +12%
              </span>
              <span className="text-xs text-muted-foreground">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/30">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/80 to-emerald-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Citation Rate
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums text-emerald-400">
                  {stats?.citationRate || 0}%
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {stats?.citedQueries || 0} of {stats?.totalQueries || 0} queries
                cited
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-500/30">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500/80 to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Platforms Monitored
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums">
                  {stats?.platformsMonitored || 0}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                ChatGPT, Perplexity, Google AI, Gemini
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/30">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-500/80 to-amber-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  vs Competitors
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums text-amber-400">
                  #1
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                <ArrowUp className="h-3 w-3" />
                +14 pts
              </span>
              <span className="text-xs text-muted-foreground">
                ahead of nearest
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Citation Trend Chart ──────────────────────────── */}
      {trendChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              Citation Trend (Last 8 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={trendChartData}
              xKey="week"
              series={[
                { dataKey: "total", label: "Total Checked", color: SEMANTIC_COLORS.neutral },
                { dataKey: "cited", label: "Cited", color: "#7c5cfc" },
              ]}
              height={240}
              showLegend
              showGrid
            />
          </CardContent>
        </Card>
      )}

      {/* ── Competitor Comparison Chart ───────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-amber-400" />
            Competitor AEO Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonBarChart
            data={MOCK_COMPETITOR_DATA}
            xKey="name"
            series={[
              { dataKey: "score", label: "AEO Score", color: "#7c5cfc" },
              { dataKey: "citations", label: "Citations", color: "#22c55e" },
            ]}
            height={220}
            showLegend
            barRadius={6}
          />
        </CardContent>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <Tabs defaultValue="suggestions">
        <TabsList>
          <TabsTrigger value="suggestions">
            Optimization Suggestions
          </TabsTrigger>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="citations">AI Citation Feed</TabsTrigger>
          <TabsTrigger value="queries">Query Tracking</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* ── 3. Optimization Suggestions Tab ──────────────── */}
        <TabsContent value="suggestions">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    Actionable Optimization Steps
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
                        Generate New
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick recommendations banner */}
                {recommendations.length > 0 && (
                  <div className="mb-6 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                      AI-Powered Recommendations
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

                {/* Suggestion cards */}
                {optimizationSuggestions.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-emerald-400/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      All optimization tasks are complete. Generate new
                      strategies to find more opportunities.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {optimizationSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className={`group rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                          sug.priority === "high"
                            ? "border-red-500/20 bg-red-500/[0.03] hover:border-red-500/40"
                            : sug.priority === "medium"
                              ? "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/40"
                              : "border-border/50 bg-muted/10 hover:border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              {sug.priority === "high" ? (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              ) : sug.priority === "medium" ? (
                                <Zap className="h-4 w-4 text-amber-400" />
                              ) : (
                                <Target className="h-4 w-4 text-blue-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-sm">
                                  {sug.title}
                                </p>
                                {getPriorityBadge(sug.priority)}
                                {getContentTypeBadge(sug.contentType)}
                              </div>
                              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                {sug.description}
                              </p>
                              {sug.impact && (
                                <p className="mt-1.5 text-xs font-medium text-violet-400">
                                  {sug.impact}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {"status" in sug && sug.status === "pending" && (
                          <div className="mt-3 flex gap-2 pl-7">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingStrategyId === sug.id}
                              onClick={() =>
                                handleUpdateStrategy(sug.id, "in_progress")
                              }
                            >
                              {updatingStrategyId === sug.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Start
                            </Button>
                          </div>
                        )}
                        {"status" in sug && sug.status === "in_progress" && (
                          <div className="mt-3 flex gap-2 pl-7">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingStrategyId === sug.id}
                              onClick={() =>
                                handleUpdateStrategy(sug.id, "completed")
                              }
                            >
                              {updatingStrategyId === sug.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Mark Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── 4. Content Gap Analysis Tab ──────────────────── */}
        <TabsContent value="gaps">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    Content Gap Analysis
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Questions customers ask AI that you don&apos;t have content
                    for
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  aria-label="Content gap analysis"
                >
                  <thead>
                    <tr className="border-b border-border/50">
                      <th
                        scope="col"
                        className="pb-3 text-left font-medium text-muted-foreground"
                      >
                        Question
                      </th>
                      <th
                        scope="col"
                        className="pb-3 text-center font-medium text-muted-foreground"
                      >
                        Search Volume
                      </th>
                      <th
                        scope="col"
                        className="pb-3 text-center font-medium text-muted-foreground"
                      >
                        AI Mentions
                      </th>
                      <th
                        scope="col"
                        className="pb-3 text-center font-medium text-muted-foreground"
                      >
                        Difficulty
                      </th>
                      <th
                        scope="col"
                        className="pb-3 text-center font-medium text-muted-foreground"
                      >
                        Opportunity
                      </th>
                      <th
                        scope="col"
                        className="pb-3 text-right font-medium text-muted-foreground"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {MOCK_CONTENT_GAPS.map((gap) => (
                      <tr
                        key={gap.id}
                        className="group hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3.5 pr-4">
                          <p className="font-medium">{gap.question}</p>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="tabular-nums">
                            {gap.searchVolume.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            /mo
                          </span>
                        </td>
                        <td className="py-3.5 text-center tabular-nums">
                          {gap.aiMentions}
                        </td>
                        <td className="py-3.5 text-center">
                          {getPriorityBadge(
                            gap.difficulty === "Low"
                              ? "low"
                              : gap.difficulty === "Medium"
                                ? "medium"
                                : "high",
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              gap.opportunity === "High"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : gap.opportunity === "Medium"
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                  : "border-border/50 text-muted-foreground"
                            }`}
                          >
                            {gap.opportunity}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                            onClick={() => setTargetQuery(gap.question)}
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            Create
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 5. AI Citation Feed Tab ─────────────────────── */}
        <TabsContent value="citations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Quote className="h-4 w-4 text-emerald-400" />
                Recent AI Citations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {MOCK_CITATIONS.length === 0 ? (
                <div className="py-8 text-center">
                  <Quote className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No citations detected yet. Track queries to start monitoring
                    your AI visibility.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {MOCK_CITATIONS.map((citation) => {
                    const pConfig = getPlatformConfig(citation.platform);
                    return (
                      <div
                        key={citation.id}
                        className="group rounded-lg border border-border/50 bg-muted/10 p-4 transition-all duration-200 hover:border-border hover:bg-muted/20"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pConfig.className}`}
                            >
                              <div
                                className={`h-2 w-2 rounded-full ${pConfig.dotColor}`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {getPlatformBadge(citation.platform)}
                                <span className="text-xs text-muted-foreground">
                                  {timeAgo(citation.citedAt)}
                                </span>
                                {citation.position && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      citation.position <= 2
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                        : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                    }`}
                                  >
                                    Position #{citation.position}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1.5 text-sm font-medium">
                                &quot;{citation.query}&quot;
                              </p>
                              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {citation.snippet}
                              </p>
                            </div>
                          </div>
                          {citation.url && (
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                              aria-label={`View citation (opens in new tab)`}
                            >
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Query Tracking Tab ─────────────────────────── */}
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
                    <table
                      className="w-full text-sm"
                      aria-label="Tracked queries"
                    >
                      <thead>
                        <tr className="border-b border-border/50">
                          <th
                            scope="col"
                            className="pb-3 text-left font-medium text-muted-foreground"
                          >
                            Query
                          </th>
                          <th
                            scope="col"
                            className="pb-3 text-left font-medium text-muted-foreground"
                          >
                            Platform
                          </th>
                          <th
                            scope="col"
                            className="pb-3 text-center font-medium text-muted-foreground"
                          >
                            Cited
                          </th>
                          <th
                            scope="col"
                            className="pb-3 text-center font-medium text-muted-foreground"
                          >
                            Position
                          </th>
                          <th
                            scope="col"
                            className="pb-3 text-left font-medium text-muted-foreground"
                          >
                            Last Checked
                          </th>
                          <th
                            scope="col"
                            className="pb-3 text-right font-medium text-muted-foreground"
                          >
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
                                  <CheckCircle
                                    className="mx-auto h-5 w-5 text-emerald-400"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">Yes, cited</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center">
                                  <XCircle
                                    className="mx-auto h-5 w-5 text-red-400/60"
                                    aria-hidden="true"
                                  />
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
                                      <ExternalLink
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                      />
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

        {/* ── Content Tab ────────────────────────────────── */}
        <TabsContent value="content">
          <div className="space-y-4">
            {/* Generate Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  Generate AEO Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Enter a query your customers might ask AI assistants. We will
                  generate optimized FAQ content, structured data, and service
                  pages to help your business appear in AI search results.
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
                                expandedId === item.id ? null : item.id,
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
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
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
