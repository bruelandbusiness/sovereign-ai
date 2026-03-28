"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  description: string;
}

interface StatusData {
  overall: "operational" | "degraded" | "down";
  services: ServiceStatus[];
  uptime: number;
  uptimeHistory: number[];
  lastChecked: string;
}

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

const SERVICE_STATUS_DOT = {
  operational: "bg-emerald-400",
  degraded: "bg-yellow-400",
  down: "bg-red-400",
} as const;

const SERVICE_STATUS_LABEL = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
} as const;

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

export function StatusPageContent() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StatusData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
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
        <span className="ml-2 text-sm text-muted-foreground">Loading status...</span>
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

  const config = STATUS_CONFIG[data.overall];

  return (
    <div className="mt-10 space-y-8">
      {/* Overall status banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-5",
          config.bgClass
        )}
      >
        <span className={cn("relative flex h-3 w-3")}>
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.dotClass
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-3 w-3 rounded-full",
              config.dotClass
            )}
          />
        </span>
        <span className={cn("text-lg font-semibold", config.textClass)}>
          {config.label}
        </span>
      </div>

      {/* Uptime display */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Uptime — Last 30 Days
          </h2>
          <span className="text-2xl font-bold tabular-nums text-emerald-400">
            {data.uptime.toFixed(1)}%
          </span>
        </div>

        {/* 30-day uptime bar chart */}
        <div className="mt-4 flex items-end gap-[3px]" aria-label="30-day uptime history">
          {data.uptimeHistory.map((value, i) => {
            const height = Math.max(8, (value / 100) * 48);
            const barColor =
              value >= 99.5
                ? "bg-emerald-400/80"
                : value >= 98
                  ? "bg-yellow-400/80"
                  : "bg-red-400/80";
            return (
              <div
                key={i}
                className={cn("flex-1 rounded-sm transition-colors", barColor)}
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

      {/* Service status rows */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Services
          </h2>
        </div>
        {data.services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between px-6 py-4"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {service.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {service.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  SERVICE_STATUS_DOT[service.status]
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  service.status === "operational"
                    ? "text-emerald-400"
                    : service.status === "degraded"
                      ? "text-yellow-400"
                      : "text-red-400"
                )}
              >
                {SERVICE_STATUS_LABEL[service.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Subscribe CTA */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          Subscribe to Updates
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Get notified when we have scheduled maintenance or incidents.
        </p>
        <a
          href="mailto:support@trysovereignai.com?subject=Status%20Updates%20Subscription"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Subscribe via Email
        </a>
      </div>

      {/* Last checked timestamp */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        <span>
          Last checked: {formatTimestamp(data.lastChecked)}
        </span>
      </div>
    </div>
  );
}
