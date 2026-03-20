"use client";

import useSWR from "swr";
import {
  Gauge,
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
  Calendar,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpendRecommendation {
  level: "reduce" | "maintain" | "increase" | "maximize";
  message: string;
  percentChange: number;
}

interface CapacityData {
  score: number;
  openSlots: number;
  totalSlots: number;
  bookedSlots: number;
  recommendation: SpendRecommendation;
  upcomingBookings: {
    id: string;
    customerName: string;
    serviceType: string | null;
    startsAt: string;
    endsAt: string;
    status: string;
  }[];
  dailyUtilization: {
    date: string;
    booked: number;
    available: number;
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_CONFIG: Record<
  string,
  { color: string; bg: string; icon: React.ElementType; label: string }
> = {
  reduce: {
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: TrendingDown,
    label: "Reduce Spend",
  },
  maintain: {
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: Minus,
    label: "Maintain Spend",
  },
  increase: {
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: TrendingUp,
    label: "Increase Spend",
  },
  maximize: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: Zap,
    label: "Maximize Spend",
  },
};

function getScoreColor(score: number): string {
  if (score <= 20) return "#ef4444"; // red
  if (score <= 50) return "#f59e0b"; // amber
  if (score <= 80) return "#3b82f6"; // blue
  return "#22c55e"; // green
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<CapacityData>;
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CapacityWidget() {
  const { data, isLoading, error, mutate } = useSWR<CapacityData>(
    "/api/dashboard/capacity",
    fetcher,
    { refreshInterval: 60000 } // refresh every minute
  );

  if (error) {
    return (
      <Card className="border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-semibold">Capacity</span>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">Failed to load capacity data.</p>
            <button
              onClick={() => mutate()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:underline"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-semibold">Capacity</span>
          </div>
          <div className="animate-pulse space-y-3" aria-hidden="true">
            <div className="h-24 rounded-lg bg-white/[0.04]" />
            <div className="h-16 rounded-lg bg-white/[0.04]" />
          </div>
          <span className="sr-only">Loading capacity data...</span>
        </CardContent>
      </Card>
    );
  }

  const levelConfig = LEVEL_CONFIG[data.recommendation.level] || LEVEL_CONFIG.maintain;
  const LevelIcon = levelConfig.icon;
  const scoreColor = getScoreColor(data.score);

  // SVG circular gauge
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const filled = (data.score / 100) * circumference;
  const dashOffset = circumference - filled;

  return (
    <Card className="border-white/[0.06]">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold">Schedule Capacity</span>
        </div>

        {/* Circular Gauge */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0" role="meter" aria-valuenow={data.score} aria-valuemin={0} aria-valuemax={100} aria-label={`Schedule capacity: ${data.score}%`}>
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/[0.06]"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="text-xl font-bold" style={{ color: scoreColor }}>
                {data.score}%
              </span>
            </div>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="font-semibold">{data.openSlots}</span>{" "}
              <span className="text-muted-foreground">open slots</span>
            </p>
            <p>
              <span className="font-semibold">{data.bookedSlots}</span>{" "}
              <span className="text-muted-foreground">booked</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Next 2 weeks ({data.totalSlots} total)
            </p>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className={`rounded-lg border p-3 ${levelConfig.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold">AI Recommendation</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelIcon className={`h-4 w-4 ${levelConfig.color}`} aria-hidden="true" />
            <span className={`text-sm font-medium ${levelConfig.color}`}>
              {data.recommendation.message}
            </span>
          </div>
        </div>

        {/* Upcoming Availability Summary */}
        {(data.dailyUtilization?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              7-Day Availability
            </p>
            <div className="flex gap-1" role="img" aria-label="7-day availability chart">
              {(data.dailyUtilization || []).map((day) => {
                const total = day.booked + day.available;
                const utilPct = total > 0 ? (day.booked / total) * 100 : 0;
                const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "short" }
                );
                return (
                  <div key={day.date} className="flex-1 text-center">
                    <div
                      className="mx-auto h-8 w-full rounded-md relative overflow-hidden bg-white/[0.04]"
                      title={`${dayLabel}: ${day.booked} booked, ${day.available} open`}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary/50 transition-all"
                        style={{ height: `${utilPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 block">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
