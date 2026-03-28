"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cloud,
  CreditCard,
  Database,
  DollarSign,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  MousePointerClick,
  Phone,
  RefreshCw,
  Send,
  Server,
  Shield,
  Trash2,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthData {
  status: "ok" | "degraded" | "error";
  version: string;
  timestamp: string;
  checks: {
    database: {
      status: string;
      latencyMs: number;
      message?: string;
    };
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
      heapPercent: number;
    };
    uptime: {
      seconds: number;
      human: string;
    };
  };
}

interface MonitoringData {
  system: {
    apiStatus: string;
    dbStatus: string;
    dbLatencyMs?: number;
    timestamp: string;
  };
  emailQueue: {
    pending: number;
    sent: number;
    failed: number;
    bounced: number;
    recentFailures: Array<{
      id: string;
      to: string;
      subject: string;
      error: string | null;
      createdAt: string;
    }>;
  };
  clients: {
    active: number;
    newThisWeek: number;
  };
  revenue: {
    mrr: number;
    mrrGrowthRate: number;
    activeSubscriptions: number;
  };
  alerts: {
    counts: Record<string, number>;
    recent: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      severity: string;
      resolved: boolean;
      createdAt: string;
    }>;
  };
  cronJobs: Record<string, string | null>;
  recentErrors: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    createdAt: string;
  }>;
  emailTracking: Record<string, number>;
  activeSessions: number;
  auditErrors: Array<{
    id: string;
    accountId: string | null;
    resource: string;
    resourceId: string | null;
    severity: string;
    message: string;
    source: string | null;
    route: string | null;
    user: string | null;
    createdAt: string;
  }>;
  errorTrend: Array<{ date: string; count: number }>;
  apiUsage: Array<{ endpoint: string; count: number }>;
}

// ---------------------------------------------------------------------------
// External services config
// ---------------------------------------------------------------------------

interface ExternalService {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  envKey: string;
}

const EXTERNAL_SERVICES: ExternalService[] = [
  {
    id: "stripe",
    name: "Stripe",
    icon: <CreditCard className="h-4 w-4" />,
    description: "Payment processing",
    envKey: "STRIPE_SECRET_KEY",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    icon: <Send className="h-4 w-4" />,
    description: "Email delivery",
    envKey: "SENDGRID_API_KEY",
  },
  {
    id: "twilio",
    name: "Twilio",
    icon: <Phone className="h-4 w-4" />,
    description: "SMS & Voice",
    envKey: "TWILIO_AUTH_TOKEN",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: <Zap className="h-4 w-4" />,
    description: "AI / Claude API",
    envKey: "ANTHROPIC_API_KEY",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "error":
      return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    case "warning":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    default:
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  }
}

function severityBadgeVariant(severity: string) {
  switch (severity) {
    case "critical":
    case "error":
      return "destructive" as const;
    case "warning":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function healthIndicator(status: string): {
  color: string;
  bgColor: string;
  label: string;
} {
  switch (status) {
    case "healthy":
    case "connected":
    case "active":
      return {
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        label: "Healthy",
      };
    case "degraded":
    case "slow":
      return {
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        label: "Degraded",
      };
    case "down":
    case "disconnected":
    case "error":
      return {
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        label: "Down",
      };
    default:
      return {
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        label: "Unknown",
      };
  }
}

const CRON_LABELS: Record<string, { label: string; description: string }> = {
  content_published: {
    label: "Content Engine",
    description: "Blog posts, social content generation",
  },
  email_sent: {
    label: "Email Campaigns",
    description: "Drip sequences, newsletters",
  },
  review_response: {
    label: "Review Automation",
    description: "Google/Yelp review responses",
  },
  lead_captured: {
    label: "Lead Generation",
    description: "Outbound prospecting, lead scoring",
  },
  ad_optimized: {
    label: "Ad Optimization",
    description: "PPC bid adjustments, budget allocation",
  },
  seo_update: {
    label: "SEO Updates",
    description: "Keyword tracking, on-page optimization",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MonitoringPage() {
  const { data, error, mutate, isValidating } = useSWR<MonitoringData>(
    "/api/admin/monitoring",
    fetcher,
    { refreshInterval: 30000, dedupingInterval: 10000, revalidateOnFocus: false }
  );
  const { data: health, mutate: mutateHealth } = useSWR<HealthData>(
    "/api/health",
    fetcher,
    { refreshInterval: 15000, dedupingInterval: 5000, revalidateOnFocus: false }
  );
  const [resolvingAlerts, setResolvingAlerts] = useState<Set<string>>(
    new Set()
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(
    null
  );

  const handleHealthCheck = useCallback(async () => {
    setQuickActionLoading("health");
    setActionError(null);
    try {
      await mutateHealth();
      await mutate();
    } catch {
      setActionError("Failed to trigger health check.");
    } finally {
      setQuickActionLoading(null);
    }
  }, [mutate, mutateHealth]);

  const handleClearCache = useCallback(async () => {
    if (!confirm("Clear the application cache? This may briefly slow responses.")) return;
    setQuickActionLoading("cache");
    setActionError(null);
    try {
      const res = await fetch("/api/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_cache" }),
      });
      if (!res.ok) {
        setActionError("Failed to clear cache.");
      }
      await mutate();
    } catch {
      setActionError("Connection issue while clearing cache.");
    } finally {
      setQuickActionLoading(null);
    }
  }, [mutate]);

  async function resolveAlert(alertId: string) {
    if (!confirm("Are you sure you want to resolve this alert?")) return;

    setResolvingAlerts((prev) => new Set(prev).add(alertId));
    setActionError(null);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId }),
      });
      if (res.ok) {
        mutate();
      } else {
        setActionError("Failed to resolve alert. Please try again.");
      }
    } catch {
      setActionError("Connection issue while resolving alert.");
    } finally {
      setResolvingAlerts((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 page-enter">
        <h1 className="text-2xl font-bold text-foreground">
          System Monitoring
        </h1>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm text-red-400">
            Failed to load monitoring data. The API may be unreachable.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => mutate()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!data) {
    return (
      <div className="space-y-6 page-enter">
        <h1 className="text-2xl font-bold text-foreground">
          System Monitoring
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalAlerts =
    (data.alerts.counts.critical || 0) +
    (data.alerts.counts.error || 0) +
    (data.alerts.counts.warning || 0) +
    (data.alerts.counts.info || 0);

  // Email delivery rate
  const totalEmails =
    (data.emailQueue.sent || 0) +
    (data.emailQueue.failed || 0) +
    (data.emailQueue.bounced || 0);
  const deliveryRate =
    totalEmails > 0
      ? Math.round(
          ((data.emailQueue.sent || 0) / totalEmails) * 10000
        ) / 100
      : 100;

  // Determine overall system health color
  const systemHealthStatus =
    data.alerts.counts.critical > 0
      ? "critical"
      : data.alerts.counts.error > 0
      ? "degraded"
      : "healthy";

  const apiHealth = healthIndicator(data.system.apiStatus);
  const dbHealth = healthIndicator(data.system.dbStatus);

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            System Monitoring
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time health, performance, and alert monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                systemHealthStatus === "healthy"
                  ? "bg-emerald-400"
                  : systemHealthStatus === "degraded"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-400 animate-pulse"
              }`}
            />
            <p className="text-xs text-muted-foreground">
              {new Date(data.system.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isValidating}
            aria-label="Refresh monitoring data"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${
                isValidating ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {actionError}
        </div>
      )}

      {/* ================================================================= */}
      {/* API Health Indicators (Green / Yellow / Red)                       */}
      {/* ================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* API Status */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${apiHealth.bgColor}`}
            >
              <Server className={`h-5 w-5 ${apiHealth.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">API Status</p>
              <p className={`text-sm font-semibold capitalize ${apiHealth.color}`}>
                {data.system.apiStatus}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${dbHealth.bgColor}`}
            >
              <Database className={`h-5 w-5 ${dbHealth.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Database</p>
              <p className={`text-sm font-semibold capitalize ${dbHealth.color}`}>
                {data.system.dbStatus}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Pool: 10 max connections
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Queue */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                data.emailQueue.failed > 0
                  ? "bg-orange-500/10"
                  : "bg-blue-500/10"
              }`}
            >
              <Mail
                className={`h-5 w-5 ${
                  data.emailQueue.failed > 0
                    ? "text-orange-400"
                    : "text-blue-400"
                }`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email Queue</p>
              <p className="text-sm font-semibold">
                {data.emailQueue.pending} pending
              </p>
              <p className="text-[11px] text-muted-foreground">
                {deliveryRate}% delivery rate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unresolved Alerts */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                totalAlerts > 0 ? "bg-orange-500/10" : "bg-emerald-500/10"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  totalAlerts > 0 ? "text-orange-400" : "text-emerald-400"
                }`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Unresolved Alerts
              </p>
              <p className="text-sm font-semibold">
                {totalAlerts} alert{totalAlerts !== 1 ? "s" : ""}
              </p>
              {data.alerts.counts.critical > 0 && (
                <p className="text-[11px] text-red-400">
                  {data.alerts.counts.critical} critical
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Sessions</p>
              <p className="text-sm font-semibold tabular-nums">
                {data.activeSessions}
              </p>
              <p className="text-[11px] text-muted-foreground">
                authenticated users
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* System Health (from /api/health)                                   */}
      {/* ================================================================= */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              System Health
              <Badge
                variant={
                  health.status === "ok"
                    ? "outline"
                    : health.status === "degraded"
                    ? "secondary"
                    : "destructive"
                }
                className="ml-2"
              >
                {health.status}
              </Badge>
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                v{health.version}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">DB Latency</p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    health.checks.database.latencyMs > 1000
                      ? "text-yellow-400"
                      : health.checks.database.status === "error"
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {health.checks.database.status === "error"
                    ? "ERR"
                    : `${health.checks.database.latencyMs}ms`}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">Heap Usage</p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    health.checks.memory.heapPercent > 90
                      ? "text-red-400"
                      : health.checks.memory.heapPercent > 70
                      ? "text-yellow-400"
                      : "text-emerald-400"
                  }`}
                >
                  {health.checks.memory.heapPercent}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {health.checks.memory.heapUsedMB} / {health.checks.memory.heapTotalMB} MB
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">RSS Memory</p>
                <p className="text-xl font-bold tabular-nums">
                  {health.checks.memory.rssMB} MB
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-xl font-bold tabular-nums text-emerald-400">
                  {health.checks.uptime.human}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* Revenue + Client Metrics                                           */}
      {/* ================================================================= */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">MRR</span>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatPrice(data.revenue.mrr / 100)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span
                className={
                  data.revenue.mrrGrowthRate >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {data.revenue.mrrGrowthRate >= 0 ? "+" : ""}
                {data.revenue.mrrGrowthRate}%
              </span>{" "}
              growth
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Active Clients</span>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.clients.active}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className="text-emerald-400">
                +{data.clients.newThisWeek}
              </span>{" "}
              this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">
                Active Subscriptions
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.revenue.activeSubscriptions}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* External Service Status + Cron Jobs                                */}
      {/* ================================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* External Service Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4 text-primary" />
              External Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {EXTERNAL_SERVICES.map((svc) => {
                // Determine status based on email queue health for SendGrid,
                // MRR data for Stripe, etc. This is a heuristic since we
                // don't ping these APIs directly from the monitoring endpoint.
                let status: "operational" | "issues" | "unknown" = "unknown";
                let detail = "";

                if (svc.id === "stripe") {
                  status =
                    data.revenue.activeSubscriptions > 0
                      ? "operational"
                      : "unknown";
                  detail = `${data.revenue.activeSubscriptions} active subs`;
                } else if (svc.id === "sendgrid") {
                  status =
                    data.emailQueue.failed > 5
                      ? "issues"
                      : data.emailQueue.sent > 0
                      ? "operational"
                      : "unknown";
                  detail = `${data.emailQueue.sent} sent, ${data.emailQueue.failed} failed`;
                } else if (svc.id === "twilio") {
                  // Check if voice/sms cron ran recently
                  status = data.cronJobs.lead_captured
                    ? "operational"
                    : "unknown";
                  detail = data.cronJobs.lead_captured
                    ? `Last active ${formatRelativeTime(data.cronJobs.lead_captured)}`
                    : "No recent activity";
                } else if (svc.id === "anthropic") {
                  // Check if content cron ran recently
                  status = data.cronJobs.content_published
                    ? "operational"
                    : "unknown";
                  detail = data.cronJobs.content_published
                    ? `Last active ${formatRelativeTime(data.cronJobs.content_published)}`
                    : "No recent activity";
                }

                const statusMeta = {
                  operational: {
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    dot: "bg-emerald-400",
                  },
                  issues: {
                    color: "text-yellow-400",
                    bg: "bg-yellow-500/10",
                    dot: "bg-yellow-400 animate-pulse",
                  },
                  unknown: {
                    color: "text-muted-foreground",
                    bg: "bg-muted",
                    dot: "bg-muted-foreground",
                  },
                }[status];

                return (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusMeta.bg}`}
                      >
                        <span className={statusMeta.color}>{svc.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {svc.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {svc.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                        />
                        <span
                          className={`text-xs font-medium capitalize ${statusMeta.color}`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cron Job Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Cron Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.cronJobs).map(([type, lastRun]) => {
                const meta = CRON_LABELS[type] || {
                  label: type,
                  description: "",
                };
                const isRecent =
                  lastRun &&
                  Date.now() - new Date(lastRun).getTime() <
                    24 * 60 * 60 * 1000;
                const isStale =
                  lastRun &&
                  Date.now() - new Date(lastRun).getTime() >
                    48 * 60 * 60 * 1000;

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {meta.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lastRun ? (
                        <>
                          {isStale ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          <div className="text-right">
                            <span
                              className={`text-xs ${
                                isStale
                                  ? "text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatRelativeTime(lastRun)}
                            </span>
                            {isRecent && (
                              <p className="text-[10px] text-emerald-400/70">
                                Running normally
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            No recent activity
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* Email Delivery + Email Engagement                                  */}
      {/* ================================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Queue Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              Email Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Stats grid */}
            <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              {(["pending", "sent", "failed", "bounced"] as const).map(
                (status) => (
                  <div key={status}>
                    <p className="text-lg font-bold tabular-nums">
                      {data.emailQueue[status]}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {status}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Delivery rate bar */}
            <div className="mb-4 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Delivery Rate</span>
                <span
                  className={`font-medium ${
                    deliveryRate >= 95
                      ? "text-emerald-400"
                      : deliveryRate >= 80
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {deliveryRate}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    deliveryRate >= 95
                      ? "bg-emerald-500"
                      : deliveryRate >= 80
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${deliveryRate}%` }}
                />
              </div>
            </div>

            {/* Recent failures */}
            {data.emailQueue.recentFailures.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Recent Failures
                </p>
                {data.emailQueue.recentFailures.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-foreground">
                      {f.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      To: {f.to} &middot; {formatRelativeTime(f.createdAt)}
                    </p>
                    {f.error && (
                      <p className="mt-1 text-xs text-red-400">{f.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Engagement (30 days) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" />
              Email Engagement (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                {
                  key: "delivered",
                  label: "Delivered",
                  icon: Mail,
                  color: "text-blue-400",
                },
                {
                  key: "open",
                  label: "Opens",
                  icon: Eye,
                  color: "text-emerald-400",
                },
                {
                  key: "click",
                  label: "Clicks",
                  icon: MousePointerClick,
                  color: "text-violet-400",
                },
                {
                  key: "bounce",
                  label: "Bounces",
                  icon: XCircle,
                  color: "text-red-400",
                },
                {
                  key: "unsubscribe",
                  label: "Unsubs",
                  icon: XCircle,
                  color: "text-orange-400",
                },
              ].map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="text-center">
                  <div className="mb-1 flex items-center justify-center">
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className="text-xl font-bold tabular-nums">
                    {data.emailTracking[key] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Rate calculations */}
            {(data.emailTracking.open || 0) > 0 &&
              (data.emailTracking.delivered || 0) > 0 && (
                <div className="mt-4 flex items-center gap-6 rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Open Rate
                    </p>
                    <p className="text-lg font-bold tabular-nums text-emerald-400">
                      {(
                        (data.emailTracking.open /
                          data.emailTracking.delivered) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  {(data.emailTracking.click || 0) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Click Rate
                      </p>
                      <p className="text-lg font-bold tabular-nums text-violet-400">
                        {(
                          (data.emailTracking.click /
                            data.emailTracking.delivered) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  )}
                  {(data.emailTracking.click || 0) > 0 &&
                    (data.emailTracking.open || 0) > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Click-to-Open
                        </p>
                        <p className="text-lg font-bold tabular-nums text-primary">
                          {(
                            (data.emailTracking.click /
                              data.emailTracking.open) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    )}
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* Database Connection Pool Status                                    */}
      {/* ================================================================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            Database Connection Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
              <p className="text-xl font-bold tabular-nums text-emerald-400">
                10
              </p>
              <p className="text-xs text-muted-foreground">Max Connections</p>
            </div>
            <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
              <p className="text-xl font-bold tabular-nums">30s</p>
              <p className="text-xs text-muted-foreground">
                Idle Timeout
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
              <p className="text-xl font-bold tabular-nums">10s</p>
              <p className="text-xs text-muted-foreground">
                Connect Timeout
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.04] px-4 py-3 text-center">
              <p className={`text-xl font-bold tabular-nums ${dbHealth.color}`}>
                {data.system.dbLatencyMs != null
                  ? `${data.system.dbLatencyMs}ms`
                  : data.system.dbStatus === "connected"
                  ? "OK"
                  : "ERR"}
              </p>
              <p className="text-xs text-muted-foreground">
                Health Check
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Alert Feed                                                         */}
      {/* ================================================================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Alert Feed
            {totalAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalAlerts} unresolved
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.alerts.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No alerts. All systems running smoothly.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.alerts.recent.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between rounded-lg border px-3 py-2.5 ${severityColor(alert.severity)}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-sm font-medium">
                        {alert.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs opacity-70">
                      {alert.message}
                    </p>
                    <p className="mt-0.5 text-xs opacity-50">
                      {formatRelativeTime(alert.createdAt)}
                    </p>
                  </div>
                  {!alert.resolved ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 ml-2"
                      disabled={resolvingAlerts.has(alert.id)}
                      onClick={() => resolveAlert(alert.id)}
                    >
                      {resolvingAlerts.has(alert.id)
                        ? "Resolving..."
                        : "Resolve"}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="shrink-0 ml-2">
                      Resolved
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Recent Errors                                                      */}
      {/* ================================================================= */}
      {data.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-red-400" />
              Recent Errors ({data.recentErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentErrors.map((err) => (
                <div
                  key={err.id}
                  className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{err.severity}</Badge>
                    <span className="text-sm font-medium text-foreground">
                      {err.title}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelativeTime(err.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {err.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* Error Trends (14 days) + API Usage (24h)                           */}
      {/* ================================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Error Trends Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Error Trends (14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.errorTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.errorTrend}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#888" }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#888" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => `Date: ${String(v)}`}
                  />
                  <Bar
                    dataKey="count"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="Errors"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No error data available for the last 14 days.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Usage (24h) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              API Usage (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.apiUsage.length > 0 ? (
              <div className="space-y-2">
                {data.apiUsage.map((row) => {
                  const maxCount = data.apiUsage[0]?.count || 1;
                  const pct = Math.round((row.count / maxCount) * 100);
                  return (
                    <div key={row.endpoint}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="truncate font-mono text-foreground max-w-[200px]">
                          {row.endpoint}
                        </span>
                        <span className="tabular-nums text-muted-foreground ml-2">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No API usage data recorded in the last 24 hours.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* Audit Log Errors (error_captured)                                  */}
      {/* ================================================================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Recent Errors (Audit Log)
            {data.auditErrors.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {data.auditErrors.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.auditErrors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No captured errors in the audit log.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Timestamp</th>
                    <th className="pb-2 pr-3 font-medium">Severity</th>
                    <th className="pb-2 pr-3 font-medium">Message</th>
                    <th className="pb-2 pr-3 font-medium">Source</th>
                    <th className="pb-2 pr-3 font-medium">Route</th>
                    <th className="pb-2 font-medium">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.auditErrors.map((err) => (
                    <tr key={err.id} className="hover:bg-muted/20">
                      <td className="py-2 pr-3 whitespace-nowrap tabular-nums text-muted-foreground">
                        {new Date(err.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant={severityBadgeVariant(err.severity)}
                          className="text-[10px]"
                        >
                          {err.severity}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 max-w-[280px] truncate text-foreground">
                        {err.message}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {err.source || "--"}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap font-mono text-muted-foreground">
                        {err.route || "--"}
                      </td>
                      <td className="py-2 whitespace-nowrap text-muted-foreground">
                        {err.user || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Quick Actions                                                      */}
      {/* ================================================================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={quickActionLoading === "cache"}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {quickActionLoading === "cache"
                ? "Clearing..."
                : "Clear Cache"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleHealthCheck}
              disabled={quickActionLoading === "health"}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${
                  quickActionLoading === "health" ? "animate-spin" : ""
                }`}
              />
              {quickActionLoading === "health"
                ? "Checking..."
                : "Trigger Health Check"}
            </Button>
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View Sentry Dashboard
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
