"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { FadeInView } from "@/components/shared/FadeInView";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
}

export function KPICard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  change,
  changeType = "neutral",
  subtext,
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  delay = 0,
}: KPICardProps) {
  return (
    <FadeInView delay={delay}>
      <Card className="relative overflow-hidden">
        <CardContent className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>

            <p className="text-2xl font-bold tracking-tight">
              <AnimatedCounter
                target={value}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
              />
            </p>

            <div className="flex items-center gap-2">
              {change && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium",
                    changeType === "positive" && "text-emerald-400",
                    changeType === "negative" && "text-red-400",
                    changeType === "neutral" && "text-muted-foreground"
                  )}
                >
                  {changeType === "positive" && (
                    <ArrowUp className="h-3 w-3" />
                  )}
                  {changeType === "negative" && (
                    <ArrowDown className="h-3 w-3" />
                  )}
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
}
