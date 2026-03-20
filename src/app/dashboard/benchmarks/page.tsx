"use client";

import { BarChart3, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/shared/FadeInView";
import { useBenchmarks } from "@/hooks/useBenchmarks";

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

const IMPACT_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function BenchmarksPage() {
  const { benchmarks, insights, isLoading } = useBenchmarks();

  const avgPercentile =
    benchmarks.length > 0
      ? Math.round(
          benchmarks.reduce((sum, b) => sum + b.percentile, 0) /
            benchmarks.length,
        )
      : 50;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div role="status" aria-label="Loading benchmarks" className="text-muted-foreground">Loading benchmarks...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <FadeInView>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Industry Benchmarks
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                See how you compare to other businesses in your vertical
              </p>
            </div>
          </FadeInView>

          {/* Overall Percentile Hero */}
          <FadeInView>
            <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Your Overall Ranking
                </p>
                <p className="text-6xl font-bold text-primary">
                  {avgPercentile}
                  <span className="text-2xl">{ordinalSuffix(avgPercentile)}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  percentile in your vertical
                </p>
              </CardContent>
            </Card>
          </FadeInView>

          {/* Metric Cards */}
          {benchmarks.length === 0 && (
            <FadeInView>
              <Card className="mb-8">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No benchmark data available yet. Check back once enough data has been collected.
                </CardContent>
              </Card>
            </FadeInView>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {benchmarks.map((b) => (
              <FadeInView key={b.metric}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">{b.label}</p>
                      <Badge
                        variant="outline"
                        className={
                          b.percentile >= 75
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : b.percentile >= 50
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }
                      >
                        {b.percentile}{ordinalSuffix(b.percentile)} pctl
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      {b.yourValue.toLocaleString()}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Median: {b.p50.toLocaleString()}</span>
                        <span>Top 10%: {b.p90.toLocaleString()}</span>
                      </div>
                      {/* Percentile bar */}
                      <div
                        className="relative h-2 w-full rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={b.percentile}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${b.label}: ${b.percentile}${ordinalSuffix(b.percentile)} percentile`}
                      >
                        <div
                          className="absolute h-full rounded-full bg-primary/30"
                          style={{ width: "100%" }}
                        />
                        <div
                          className="absolute h-full rounded-full gradient-bg"
                          style={{ width: `${b.percentile}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {b.sampleSize} businesses sampled
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>

          {/* Insights Section */}
          {insights.length > 0 && (
            <FadeInView>
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold">AI Insights</h2>
              </div>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <Card key={insight.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {insight.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                IMPACT_COLORS[insight.impact] ||
                                IMPACT_COLORS.medium
                              }
                            >
                              {insight.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {insight.description}
                          </p>
                          <p className="text-sm text-primary mt-2">
                            {insight.recommendation}
                          </p>
                        </div>
                        {insight.actionUrl && (
                          <Link href={insight.actionUrl}>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInView>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
