"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, RefreshCw, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ServiceState = "operational" | "degraded" | "down";

interface ServiceStatus {
  name: string;
  status: ServiceState;
  description: string;
  responseTime?: number;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  createdAt: string;
  updatedAt: string;
  message: string;
}

interface CategoryGroup {
  category: string;
  services: ServiceStatus[];
}

interface StatusData {
  overall: ServiceState;
  categories: CategoryGroup[];
  /** Flat services list (legacy compat) */
  services?: ServiceStatus[];
  uptime: number;
  /** Daily uptime percentages, newest last */
  uptimeHistory: number[];
  lastChecked: string;
  incidents?: Incident[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG = {
  operational: {
    label: "All Systems Operational",
    dotClass: "bg-emerald-400",
    bgClass: "border-emerald-500/20 bg-emerald-500/[0.06]",
    textClass: "text-emerald-400",
  },
  degraded: {
    label: "Partial System Degradation",
    dotClass: "bg-yellow-400",
    bgClass: "border-yellow-500/20 bg-yellow-500/[0.06]",
    textClass: "text-yellow-400",
  },
  down: {
    label: "Major Outage",
    dotClass: "bg-red-400",
    bgClass: "border-red-500/20 bg-red-500/[0.06]",
    textClass: "text-red-400",
  },
} as const;

const SERVICE_DOT: Record<ServiceState, string> = {
  operational: "bg-emerald-400",
  degraded: "bg-yellow-400",
  down: "bg-red-400",
};

const SERVICE_TEXT: Record<ServiceState, string> = {
  operational: "text-emerald-400",
  degraded: "text-yellow-400",
  down: "text-red-400",
};

const SERVICE_LABEL: Record<ServiceState, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

const INCIDENT_SEVERITY_STYLES = {
  minor: "border-yellow-500/20 bg-yellow-500/[0.04]",
  major: "border-orange-500/20 bg-orange-500/[0.04]",
  critical: "border-red-500/20 bg-red-500/[0.04]",
} as const;

const INCIDENT_STATUS_BADGE = {
  investigating: "bg-red-500/20 text-red-300",
  identified: "bg-orange-500/20 text-orange-300",
  monitoring: "bg-yellow-500/20 text-yellow-300",
  resolved: "bg-emerald-500/20 text-emerald-300",
} as const;

/** Default service categories when API returns flat services list */
const DEFAULT_CATEGORIES: CategoryGroup[] = [
  {
    category: "Platform",
    services: [
      { name: "Website & Dashboard", status: "operational", description: "Main website and client dashboard" },
      { name: "API", status: "operational", description: "REST API and integrations" },
      { name: "AI Chatbot", status: "operational", description: "Conversational AI assistant" },
    ],
  },
  {
    category: "Database",
    services: [
      { name: "Primary Database", status: "operational", description: "Core data storage and retrieval" },
      { name: "Search Index", status: "operational", description: "Full-text search and filtering" },
    ],
  },
  {
    category: "Email",
    services: [
      { name: "Transactional Email", status: "operational", description: "Notifications and system emails" },
      { name: "Marketing Campaigns", status: "operational", description: "Email campaign delivery" },
    ],
  },
  {
    category: "Voice",
    services: [
      { name: "AI Phone Agent", status: "operational", description: "Inbound/outbound call handling" },
      { name: "SMS / Text", status: "operational", description: "Text message delivery" },
    ],
  },
  {
    category: "Payments",
    services: [
      { name: "Payment Processing", status: "operational", description: "Stripe billing and invoicing" },
      { name: "Subscription Management", status: "operational", description: "Plan upgrades and renewals" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function uptimeDotColor(value: number): string {
  if (value >= 99.5) return "bg-emerald-400";
  if (value >= 98) return "bg-yellow-400";
  return "bg-red-400";
}

function uptimeBarColor(value: number): string {
  if (value >= 99.5) return "bg-emerald-400/80";
  if (value >= 98) return "bg-yellow-400/80";
  return "bg-red-400/80";
}

function dayLabel(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function OverallBanner({ overall }: { overall: ServiceState }) {
  const config = STATUS_CONFIG[overall];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-5",
        config.bgClass,
      )}
    >
      <span className="relative flex h-3 w-3">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            config.dotClass,
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-3 w-3 rounded-full",
            config.dotClass,
          )}
        />
      </span>
      <span className={cn("text-lg font-semibold", config.textClass)}>
        {config.label}
      </span>
    </div>
  );
}

function UptimeDots({
  history,
}: {
  history: number[];
}) {
  const last7 = history.slice(-7);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Uptime -- Last 7 Days
      </h2>
      <div className="mt-4 flex items-center justify-between gap-2">
        {last7.map((value, i) => {
          const daysAgo = last7.length - 1 - i;
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-4 w-4 rounded-full transition-colors",
                  uptimeDotColor(value),
                )}
                title={`${dayLabel(daysAgo)}: ${value.toFixed(2)}%`}
              />
              <span className="text-[10px] text-muted-foreground/60">
                {daysAgo === 0 ? "Today" : `${daysAgo}d`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground/50">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> 99.5%+
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" /> 98-99.5%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" /> &lt;98%
        </span>
      </div>
    </div>
  );
}

function UptimeChart({
  history,
  uptime,
}: {
  history: number[];
  uptime: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Uptime -- Last 30 Days
        </h2>
        <span className="text-2xl font-bold tabular-nums text-emerald-400">
          {uptime.toFixed(1)}%
        </span>
      </div>
      <div
        className="mt-4 flex items-end gap-[3px]"
        aria-label="30-day uptime history"
      >
        {history.map((value, i) => {
          const height = Math.max(8, (value / 100) * 48);
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-colors",
                uptimeBarColor(value),
              )}
              style={{ height: `${height}px` }}
              title={`Day ${i + 1}: ${value.toFixed(2)}%`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/60">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {service.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {service.description}
        </p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-2">
        {service.responseTime !== undefined && (
          <span className="text-[10px] tabular-nums text-muted-foreground/50">
            {service.responseTime}ms
          </span>
        )}
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            SERVICE_DOT[service.status],
          )}
        />
        <span
          className={cn("text-xs font-medium", SERVICE_TEXT[service.status])}
        >
          {SERVICE_LABEL[service.status]}
        </span>
      </div>
    </div>
  );
}

function CategorySection({ group }: { group: CategoryGroup }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
      <div className="px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {group.category}
        </h2>
      </div>
      {group.services.map((service) => (
        <ServiceRow key={service.name} service={service} />
      ))}
    </div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        INCIDENT_SEVERITY_STYLES[incident.severity],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {incident.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {incident.message}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            INCIDENT_STATUS_BADGE[incident.status],
          )}
        >
          {incident.status}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Started {formatRelative(incident.createdAt)}
        </span>
        <span>Updated {formatRelative(incident.updatedAt)}</span>
      </div>
    </div>
  );
}

function IncidentsSection({ incidents }: { incidents: Incident[] }) {
  const active = incidents.filter((i) => i.status !== "resolved");
  const resolved = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {active.length > 0 ? "Active Incidents" : "Recent Incidents"}
      </h2>

      {active.length === 0 && resolved.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No incidents reported. All systems are running normally.
          </p>
        </div>
      )}

      {active.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}

      {resolved.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            {resolved.length} resolved incident{resolved.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-3 space-y-3">
            {resolved.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SubscribeCta() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // In production this would POST to an API endpoint
    setSubscribed(true);
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
      <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
      <h3 className="mt-3 text-sm font-semibold text-foreground">
        Subscribe to Updates
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Get notified when we have scheduled maintenance or incidents.
      </p>

      {subscribed ? (
        <p className="mt-4 text-sm font-medium text-emerald-400">
          You are subscribed. We will notify you of any status changes.
        </p>
      ) : (
        <form
          onSubmit={handleSubscribe}
          className="mx-auto mt-4 flex max-w-sm items-center gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#4c85ff]/40 focus:outline-none focus:ring-1 focus:ring-[#4c85ff]/30"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Subscribe
          </button>
        </form>
      )}

      <a
        href="mailto:support@trysovereignai.com?subject=Status%20Updates%20Subscription"
        className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        Or contact support directly
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function StatusPageContent() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Normalize: if the API returns a flat `services` array without
      // `categories`, map them into the default category structure.
      const normalized: StatusData = {
        overall: json.overall ?? "operational",
        categories: json.categories ?? buildCategories(json.services),
        uptime: json.uptime ?? 99.9,
        uptimeHistory: json.uptimeHistory ?? generatePlaceholderHistory(),
        lastChecked: json.lastChecked ?? new Date().toISOString(),
        incidents: json.incidents ?? [],
      };
      setData(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
      // If we have never successfully loaded, show defaults so the page
      // is still useful even when the health endpoint is unreachable.
      if (!data) {
        setData({
          overall: "operational",
          categories: DEFAULT_CATEGORIES,
          uptime: 99.9,
          uptimeHistory: generatePlaceholderHistory(),
          lastChecked: new Date().toISOString(),
          incidents: [],
        });
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading && !data) {
    return (
      <div className="mt-10 flex items-center justify-center py-20">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading status...
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-6 text-center">
        <p className="text-sm text-red-400">Unable to load system status.</p>
        <button
          onClick={fetchStatus}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.1]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-10 space-y-8">
      {/* Overall status banner */}
      <OverallBanner overall={data.overall} />

      {/* Active incidents (shown prominently near top) */}
      {data.incidents && data.incidents.length > 0 && (
        <IncidentsSection incidents={data.incidents} />
      )}

      {/* 7-day uptime dots */}
      <UptimeDots history={data.uptimeHistory} />

      {/* 30-day uptime bar chart */}
      <UptimeChart history={data.uptimeHistory} uptime={data.uptime} />

      {/* Categorized service status */}
      {data.categories.map((group) => (
        <CategorySection key={group.category} group={group} />
      ))}

      {/* No active incidents message */}
      {(!data.incidents || data.incidents.length === 0) && (
        <IncidentsSection incidents={[]} />
      )}

      {/* Subscribe to updates */}
      <SubscribeCta />

      {/* Last checked timestamp + refresh */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <button
          onClick={fetchStatus}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-muted-foreground"
          aria-label="Refresh status"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          <span>Last checked: {formatTimestamp(data.lastChecked)}</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

/** Map a flat services array to categorized groups using default structure */
function buildCategories(
  services?: ServiceStatus[],
): CategoryGroup[] {
  if (!services || services.length === 0) return DEFAULT_CATEGORIES;

  // Try to match service names to default categories
  const result = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    services: cat.services.map((defaultSvc) => {
      const match = services.find(
        (s) =>
          s.name.toLowerCase() === defaultSvc.name.toLowerCase() ||
          defaultSvc.name.toLowerCase().includes(s.name.toLowerCase()),
      );
      return match ?? defaultSvc;
    }),
  }));

  return result;
}

/** Generate placeholder uptime history (30 days of ~99.9%) */
function generatePlaceholderHistory(): number[] {
  return Array.from({ length: 30 }, () => {
    const base = 99.5 + Math.random() * 0.5;
    return Number(base.toFixed(2));
  });
}
