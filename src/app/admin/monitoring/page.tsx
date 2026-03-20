"use client";

import useSWR from "swr";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  Mail,
  RefreshCw,
  Server,
  Users,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonitoringData {
  system: {
    apiStatus: string;
    dbStatus: string;
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
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

import { fetcher } from "@/lib/fetcher";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityColor(severity: string) {
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

function formatRelativeTime(dateStr: string | null) {
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

const CRON_LABELS: Record<string, string> = {
  content_published: "Content Engine",
  email_sent: "Email Campaigns",
  review_response: "Review Automation",
  lead_captured: "Lead Generation",
  ad_optimized: "Ad Optimization",
  seo_update: "SEO Updates",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MonitoringPage() {
  const { data, error, mutate, isValidating } = useSWR<MonitoringData>(
    "/api/admin/monitoring",
    fetcher,
    { refreshInterval: 30000 }
  );

  async function resolveAlert(alertId: string) {
    await fetch("/api/admin/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alertId }),
    });
    mutate();
  }

  if (error) return <div className="p-4 text-red-600" role="alert">Failed to load monitoring data. Please try again later.</div>;

  if (!data) {
    return (
      <div className="space-y-6 page-enter">
        <h1 className="text-2xl font-bold text-foreground">System Monitoring</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalAlerts =
    (data.alerts.counts.critical || 0) +
    (data.alerts.counts.error || 0) +
    (data.alerts.counts.warning || 0) +
    (data.alerts.counts.info || 0);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">System Monitoring</h1>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(data.system.timestamp).toLocaleTimeString()}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isValidating}
            aria-label="Refresh monitoring data"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isValidating ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* API Status */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Server className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">API Status</p>
              <p className="text-sm font-semibold text-green-400 capitalize">
                {data.system.apiStatus}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* DB Status */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Database className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Database</p>
              <p className="text-sm font-semibold text-green-400 capitalize">
                {data.system.dbStatus}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Queue */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email Queue</p>
              <p className="text-sm font-semibold">
                {data.emailQueue.pending} pending
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unresolved Alerts */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                totalAlerts > 0 ? "bg-orange-500/10" : "bg-green-500/10"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  totalAlerts > 0 ? "text-orange-400" : "text-green-400"
                }`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unresolved Alerts</p>
              <p className="text-sm font-semibold">
                {totalAlerts} alert{totalAlerts !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue + Clients row */}
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
              {data.revenue.mrrGrowthRate >= 0 ? "+" : ""}
              {data.revenue.mrrGrowthRate}% growth
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
              +{data.clients.newThisWeek} this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Active Subscriptions</span>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.revenue.activeSubscriptions}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Queue + Cron Jobs row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Queue Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              Email Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-4 gap-2 text-center">
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

        {/* Cron Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Cron Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.cronJobs).map(([type, lastRun]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-foreground">
                    {CRON_LABELS[type] || type}
                  </span>
                  <div className="flex items-center gap-2">
                    {lastRun ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(lastRun)}
                        </span>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Alert Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.alerts.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts.</p>
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
                      <span className="text-sm font-medium">{alert.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs opacity-70">{alert.message}</p>
                    <p className="mt-0.5 text-xs opacity-50">
                      {formatRelativeTime(alert.createdAt)}
                    </p>
                  </div>
                  {!alert.resolved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 ml-2"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                  {alert.resolved && (
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

      {/* Recent Errors */}
      {data.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-red-400" />
              Recent Errors
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
    </div>
  );
}
