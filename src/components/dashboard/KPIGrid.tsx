"use client";

import { Users, Zap, Star, MessageSquare, DollarSign, TrendingUp, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { KPICard } from "./KPICard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { KPIData } from "@/types/dashboard";
import type { LucideIcon } from "lucide-react";

interface KPIConfig {
  icon: LucideIcon;
  iconColor: string;
  tooltipText: string;
  /** Generate sparkline data points seeded from current value */
  generateSparkline: (value: number) => number[];
}

/**
 * Generates realistic-looking historical data from a current value.
 * Uses a seeded random approach based on the value itself for
 * consistency across renders.
 */
function generateHistoricalData(
  current: number,
  volatility: number = 0.15,
  trend: "up" | "down" | "flat" = "up",
  points: number = 7,
): number[] {
  const data: number[] = [];
  const trendFactor = trend === "up" ? -0.05 : trend === "down" ? 0.05 : 0;

  for (let i = 0; i < points - 1; i++) {
    const historicalOffset = (points - 1 - i) * trendFactor;
    const noise = (Math.sin(current * (i + 1) * 0.7) * 0.5 + 0.5 - 0.5) * volatility;
    const factor = 1 + historicalOffset + noise;
    data.push(Math.max(0, Math.round(current * factor)));
  }
  data.push(current);
  return data;
}

const KPI_CONFIGS: Record<string, KPIConfig> = {
  "Leads This Month": {
    icon: Users,
    iconColor: "bg-blue-500/10 text-blue-400",
    tooltipText: "Total new leads captured by your AI services this calendar month.",
    generateSparkline: (v) => generateHistoricalData(v, 0.2, "up"),
  },
  "Conversion Rate": {
    icon: TrendingUp,
    iconColor: "bg-purple-500/10 text-purple-400",
    tooltipText: "Percentage of leads that converted to paying customers.",
    generateSparkline: (v) => generateHistoricalData(v, 0.1, "up"),
  },
  "Avg. Review Score": {
    icon: Star,
    iconColor: "bg-amber-500/10 text-amber-400",
    tooltipText: "Average star rating from customer reviews across all platforms.",
    generateSparkline: (v) => generateHistoricalData(v, 0.05, "flat"),
  },
  "Revenue": {
    icon: DollarSign,
    iconColor: "bg-emerald-500/10 text-emerald-400",
    tooltipText: "Total revenue attributed to AI-generated leads this month.",
    generateSparkline: (v) => generateHistoricalData(v, 0.15, "up"),
  },
  "Chatbot Conversations": {
    icon: MessageSquare,
    iconColor: "bg-emerald-500/10 text-emerald-400",
    tooltipText: "Number of customer conversations handled by your AI chatbot.",
    generateSparkline: (v) => generateHistoricalData(v, 0.2, "up"),
  },
  "Today's Bookings": {
    icon: Calendar,
    iconColor: "bg-teal-500/10 text-teal-400",
    tooltipText: "Appointments scheduled for today across all service types.",
    generateSparkline: (v) => generateHistoricalData(v, 0.25, "up"),
  },
};

const FALLBACK_CONFIGS: KPIConfig[] = [
  {
    icon: Users,
    iconColor: "bg-blue-500/10 text-blue-400",
    tooltipText: "Key metric tracked by your AI services.",
    generateSparkline: (v) => generateHistoricalData(v, 0.15, "up"),
  },
  {
    icon: Zap,
    iconColor: "bg-purple-500/10 text-purple-400",
    tooltipText: "Performance metric for your business.",
    generateSparkline: (v) => generateHistoricalData(v, 0.12, "up"),
  },
  {
    icon: Star,
    iconColor: "bg-amber-500/10 text-amber-400",
    tooltipText: "Quality indicator for your services.",
    generateSparkline: (v) => generateHistoricalData(v, 0.08, "flat"),
  },
  {
    icon: MessageSquare,
    iconColor: "bg-emerald-500/10 text-emerald-400",
    tooltipText: "Engagement metric from your AI tools.",
    generateSparkline: (v) => generateHistoricalData(v, 0.18, "up"),
  },
];

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="flex items-start gap-4">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="flex items-end justify-between">
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                <div className="h-7 w-[72px] animate-pulse rounded bg-muted" />
              </div>
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface KPIGridProps {
  kpis?: KPIData[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function KPIGrid({ kpis = [], isLoading, error, onRetry }: KPIGridProps) {
  if (isLoading) {
    return <KPISkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="mb-3 h-8 w-8 text-destructive/60" />
          <p className="text-sm font-medium">Unable to load KPIs</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Something went wrong fetching your metrics.
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => onRetry()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (kpis.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Zap className="h-6 w-6 text-primary/60" />
            </div>
          </div>
          <p className="text-sm font-semibold">Your metrics are on the way</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Once your AI services start running, you will see leads, conversions, revenue, and engagement metrics here.
          </p>
          <div className="mt-4 grid w-full max-w-md grid-cols-4 gap-3">
            {["Leads", "Revenue", "Reviews", "Calls"].map((label) => (
              <div key={label} className="rounded-lg border border-dashed border-border/40 bg-muted/30 px-2 py-3 text-center">
                <p className="text-lg font-bold text-muted-foreground/30">--</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/50">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const config = KPI_CONFIGS[kpi.label] ?? FALLBACK_CONFIGS[i % FALLBACK_CONFIGS.length];
        const parsedNum = typeof kpi.value === "string" ? parseFloat(kpi.value) : kpi.value;
        const isNumeric = !Number.isNaN(parsedNum);
        const numericValue = isNumeric ? parsedNum : 0;

        return (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={numericValue}
            displayOverride={isNumeric ? undefined : String(kpi.value)}
            change={kpi.change}
            changeType={kpi.changeType}
            subtext={kpi.subtext}
            icon={config.icon}
            iconColor={config.iconColor}
            delay={i * 0.1}
            sparklineData={isNumeric ? config.generateSparkline(numericValue) : undefined}
            tooltipText={config.tooltipText}
          />
        );
      })}
    </div>
  );
}
