"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Clock,
  Star,
  Layers,
  DollarSign,
  Activity,
  Lightbulb,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FactorScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  tip: string;
}

interface HealthScoreData {
  overall: number;
  label: string;
  factors: FactorScore[];
  suggestions: string[];
}

const DEMO_DATA: HealthScoreData = {
  overall: 72,
  label: "Good",
  factors: [
    {
      key: "leadTrend",
      label: "Lead Volume Trend",
      score: 80,
      weight: 0.2,
      tip: "Your lead volume is growing nicely.",
    },
    {
      key: "responseTime",
      label: "Response Time",
      score: 70,
      weight: 0.2,
      tip: "Great response times keep leads engaged.",
    },
    {
      key: "reviewScore",
      label: "Review Score",
      score: 65,
      weight: 0.15,
      tip: "Ask happy customers to leave a Google review.",
    },
    {
      key: "serviceUtilization",
      label: "Service Utilization",
      score: 44,
      weight: 0.15,
      tip: "Activate more services to maximize your ROI.",
    },
    {
      key: "revenueTrend",
      label: "Revenue Trend",
      score: 80,
      weight: 0.15,
      tip: "Revenue is trending in the right direction.",
    },
    {
      key: "engagement",
      label: "Engagement",
      score: 65,
      weight: 0.15,
      tip: "Consistent dashboard usage drives better results.",
    },
  ],
  suggestions: [
    "Explore the Marketplace to activate additional AI services and grow faster.",
    "Set up an automated Review Campaign to collect more 5-star Google reviews.",
    "Check your dashboard at least once a week to stay on top of new leads and performance.",
  ],
};

const FACTOR_ICONS: Record<string, LucideIcon> = {
  leadTrend: TrendingUp,
  responseTime: Clock,
  reviewScore: Star,
  serviceUtilization: Layers,
  revenueTrend: DollarSign,
  engagement: Activity,
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function getStrokeColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

function getTrailColor(score: number): string {
  if (score >= 80) return "rgba(52, 211, 153, 0.15)";
  if (score >= 60) return "rgba(251, 191, 36, 0.15)";
  return "rgba(248, 113, 113, 0.15)";
}

function getBarBg(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-red-400";
}

function getBarTrail(score: number): string {
  if (score >= 80) return "bg-emerald-400/15";
  if (score >= 60) return "bg-amber-400/15";
  return "bg-red-400/15";
}

/**
 * Circular SVG gauge for the overall health score.
 */
function CircularGauge({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getTrailColor(score)}
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-4xl font-bold tabular-nums",
            getScoreColor(score),
          )}
        >
          {score}
        </span>
        <span className="mt-0.5 text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Individual factor breakdown card.
 */
function FactorCard({ factor }: { factor: FactorScore }) {
  const Icon = FACTOR_ICONS[factor.key] ?? Activity;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          factor.score >= 80
            ? "bg-emerald-400/10"
            : factor.score >= 60
              ? "bg-amber-400/10"
              : "bg-red-400/10",
        )}
      >
        <Icon
          className={cn("h-4 w-4", getScoreColor(factor.score))}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">
            {factor.label}
          </span>
          <span
            className={cn(
              "shrink-0 text-sm font-bold tabular-nums",
              getScoreColor(factor.score),
            )}
          >
            {factor.score}
          </span>
        </div>
        {/* Score bar */}
        <div
          className={cn(
            "mt-1.5 h-1.5 w-full overflow-hidden rounded-full",
            getBarTrail(factor.score),
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              getBarBg(factor.score),
            )}
            style={{ width: `${factor.score}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {factor.tip}
        </p>
      </div>
    </div>
  );
}

/**
 * Client Health Score dashboard widget.
 *
 * Fetches from /api/dashboard/health-score and falls back to
 * demo data when the API returns no data or errors.
 */
export function HealthScore() {
  const [data, setData] = useState<HealthScoreData>(DEMO_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthScore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/health-score");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json() as HealthScoreData;
      if (json.overall !== undefined && json.factors?.length > 0) {
        setData(json);
      }
      // If API returns empty/invalid shape, keep demo data
    } catch {
      setError("Unable to load health score");
      // Keep existing data (demo fallback) on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthScore();
  }, [fetchHealthScore]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Business Health Score</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How well your business is performing across key areas
            </p>
          </div>
          {error && (
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchHealthScore}
              aria-label="Retry loading health score"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-6">
            <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Error banner */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error} — showing sample data</span>
              </div>
            )}

            {/* Gauge + factors layout */}
            <div className="flex flex-col items-center gap-6">
              {/* Circular gauge */}
              <CircularGauge
                score={data.overall}
                label={data.label}
              />

              {/* Factor breakdown grid */}
              <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.factors.map((factor) => (
                  <FactorCard key={factor.key} factor={factor} />
                ))}
              </div>

              {/* Improvement suggestions */}
              {data.suggestions.length > 0 && (
                <div className="w-full rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      Improve Your Score
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {data.suggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
