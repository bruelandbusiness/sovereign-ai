"use client";

import { TrendingUp, DollarSign, BarChart3, ArrowUpRight, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GradientText } from "@/components/shared/GradientText";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { FadeInView } from "@/components/shared/FadeInView";
import { formatPrice } from "@/lib/constants";

const INVESTMENT = 6997;
const REVENUE = 73500;
const ROI = 10.5;

export function ROISection() {
  return (
    <FadeInView>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Your AI Investment This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Investment */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Growth Bundle Cost
              </div>
              <p className="text-2xl font-bold">
                <AnimatedCounter target={INVESTMENT} prefix="$" />
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${(INVESTMENT / REVENUE) * 100}%` }}
                />
              </div>
            </div>

            {/* Revenue */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Revenue from AI Leads
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                <AnimatedCounter target={REVENUE} prefix="$" />
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* ROI — huge and animated */}
            <div className="flex flex-col items-center justify-center rounded-xl gradient-bg-subtle p-6">
              <p className="text-sm font-medium text-muted-foreground">
                Return on Investment
              </p>
              <GradientText as="p" className="text-6xl font-bold tracking-tight sm:text-7xl">
                <AnimatedCounter target={ROI} suffix="x" decimals={1} />
              </GradientText>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPrice(REVENUE)} earned on {formatPrice(INVESTMENT)} invested
              </p>
            </div>
          </div>

          {/* Comparison, trend, and benchmark */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
              <Users className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                That&apos;s like hiring{" "}
                <span className="font-semibold text-foreground">3 full-time marketers</span>{" "}
                for the price of one
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <ArrowUpRight className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-emerald-400">&#8593; 2.3x improvement</span>{" "}
                from last month
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
              <BarChart3 className="h-5 w-5 shrink-0 text-amber-400" />
              <p className="text-sm text-muted-foreground">
                Average ROI for HVAC businesses:{" "}
                <span className="font-semibold text-foreground">8.7x</span>
              </p>
            </div>
          </div>

          {/* Visual comparison bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Investment vs. Return</span>
              <span>{ROI}x return</span>
            </div>
            <div className="flex h-6 overflow-hidden rounded-lg bg-muted">
              <div
                className="flex items-center justify-center rounded-l-lg bg-primary/40 text-[10px] font-medium"
                style={{ width: `${(INVESTMENT / REVENUE) * 100}%`, minWidth: "60px" }}
              >
                {formatPrice(INVESTMENT)}
              </div>
              <div
                className="flex flex-1 items-center justify-center rounded-r-lg bg-emerald-500/40 text-[10px] font-medium text-emerald-300"
              >
                {formatPrice(REVENUE)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
