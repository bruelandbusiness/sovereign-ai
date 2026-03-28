"use client";

import Link from "next/link";
import { type LucideIcon, ArrowLeft, Clock, CheckCircle2, Zap, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Metric Card ─────────────────────────────────────────────

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: string;
  trendUp?: boolean;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-blue-400",
  iconBg = "bg-blue-500/10",
  trend,
  trendUp,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <p className="text-xs">{label}</p>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
        {trend && (
          <p className={cn(
            "mt-1 text-xs font-medium",
            trendUp ? "text-emerald-400" : "text-red-400"
          )}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Activity Feed ───────────────────────────────────────────

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
  timestamp: string;
}

export function ActivityFeed({
  items,
  title = "Recent AI Activity",
  emptyMessage = "No activity yet. Events will appear here as your service runs.",
}: {
  items: ActivityItem[];
  title?: string;
  emptyMessage?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      item.iconBg || "bg-muted"
                    )}
                  >
                    <ItemIcon className={cn("h-3.5 w-3.5", item.iconColor || "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── How It Works ────────────────────────────────────────────

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export function HowItWorks({ steps }: { steps: HowItWorksStep[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" />
          How It Works
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {s.step}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Performance Chart Placeholder ───────────────────────────

export function PerformanceChart({
  title = "Performance Trend",
  description = "Detailed charts coming soon. Your AI service is collecting data to generate meaningful trend reports.",
  dataPoints,
  color = "bg-primary/60",
}: {
  title?: string;
  description?: string;
  dataPoints?: number[];
  color?: string;
}) {
  const points = dataPoints || [30, 45, 35, 50, 48, 62, 55, 70, 65, 78, 72, 85];
  const max = Math.max(...points);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-end gap-1.5">
          {points.map((point, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className={cn("w-full rounded-t", color)}
                style={{ height: `${(point / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// ── Hero Header ─────────────────────────────────────────────

interface ServiceHeroProps {
  serviceName: string;
  tagline: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor?: string;
  isActive: boolean;
  sinceDate?: string | null;
  backHref?: string;
}

export function ServiceHero({
  serviceName,
  tagline,
  icon: Icon,
  iconBg,
  iconColor,
  isActive,
  sinceDate,
  backHref = "/dashboard/services",
}: ServiceHeroProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link href={backHref} aria-label="Back to services">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div
          className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconBg)}
          aria-hidden="true"
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{serviceName}</h1>
          <p className="text-sm text-muted-foreground">{tagline}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-12 sm:pl-0">
        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
          {isActive ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </span>
          ) : (
            "Inactive"
          )}
        </Badge>
        {sinceDate && (
          <span className="text-xs text-muted-foreground">
            Since {new Date(sinceDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
