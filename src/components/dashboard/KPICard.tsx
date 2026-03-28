"use client";

import { memo } from "react";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { FadeInView } from "@/components/shared/FadeInView";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  /** When set, displays this string instead of the animated counter (e.g. "\u2014" for no data). */
  displayOverride?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
  /** Last 7 data points for the sparkline mini-chart */
  sparklineData?: number[];
  /** Tooltip text explaining what this metric means */
  tooltipText?: string;
}

function Sparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  if (data.length < 2) return null;

  const width = 72;
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const innerH = height - padding * 2;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Build a closed polygon for the gradient fill area
  const areaPath = [
    `M ${points[0].x},${points[0].y}`,
    ...points.slice(1).map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${height}`,
    `L ${points[0].x},${height}`,
    "Z",
  ].join(" ");

  const gradientId = positive ? "sparkGradientUp" : "sparkGradientDown";
  const strokeColor = positive ? "#22c55e" : "#ef4444";
  const fillStart = positive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
  const fillEnd = positive ? "rgba(34,197,94,0)" : "rgba(239,68,68,0)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="shrink-0"
      role="img"
      aria-label="Metric trend sparkline"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillStart} />
          <stop offset="100%" stopColor={fillEnd} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={linePoints}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Endpoint dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={strokeColor}
      />
    </svg>
  );
}

export const KPICard = memo(function KPICard({
  label,
  value,
  displayOverride,
  prefix = "",
  suffix = "",
  decimals = 0,
  change,
  changeType = "neutral",
  subtext,
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  delay = 0,
  sparklineData,
  tooltipText,
}: KPICardProps) {
  const isPositive = changeType === "positive";
  const isNegative = changeType === "negative";

  return (
    <FadeInView delay={delay}>
      <Card className="group relative overflow-hidden card-interactive transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
        {/* Subtle gradient accent at top */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200 opacity-0 group-hover:opacity-100",
            isPositive && "bg-gradient-to-r from-emerald-500/80 to-emerald-400/40",
            isNegative && "bg-gradient-to-r from-red-500/80 to-red-400/40",
            !isPositive && !isNegative && "bg-gradient-to-r from-primary/80 to-primary/40"
          )}
        />

        <CardContent className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              {tooltipText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          aria-label={`Info about ${label}`}
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      }
                    />
                    <TooltipContent side="top" className="max-w-[220px] text-center">
                      {tooltipText}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-bold tracking-tight">
                {displayOverride != null ? (
                  displayOverride
                ) : (
                  <AnimatedCounter
                    target={value}
                    prefix={prefix}
                    suffix={suffix}
                    decimals={decimals}
                  />
                )}
              </p>

              {sparklineData && sparklineData.length >= 2 && (
                <Sparkline
                  data={sparklineData}
                  positive={changeType !== "negative"}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              {change && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                    isPositive && "bg-emerald-500/10 text-emerald-400",
                    isNegative && "bg-red-500/10 text-red-400",
                    !isPositive && !isNegative && "text-muted-foreground"
                  )}
                >
                  {isPositive && <ArrowUp className="h-3 w-3" />}
                  {isNegative && <ArrowDown className="h-3 w-3" />}
                  {change}
                </span>
              )}

              {subtext && (
                <span className="text-xs text-muted-foreground">{subtext}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeInView>
  );
});
