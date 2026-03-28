"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  Globe,
  Users,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { ScoreCircle } from "./ScoreCircle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompetitorInfo {
  name: string;
  rating: number;
  reviews: number;
}

interface ScoreBreakdown {
  reviews: number;
  rating: number;
  website: number;
  competitive: number;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

interface AuditResult {
  id: string;
  businessName: string;
  city: string;
  state: string;
  vertical: string;
  score: number;
  breakdown: ScoreBreakdown;
  businessData: {
    rating: number;
    reviewCount: number;
    website: string | null;
    address: string | null;
  };
  websiteChecks: {
    hasSSL: boolean;
    hasMobileViewport: boolean;
    hasChatWidget: boolean;
    hasSchemaMarkup: boolean;
    isFastLoading: boolean;
  };
  competitors: CompetitorInfo[];
  recommendations: Recommendation[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const BREAKDOWN_CONFIG: {
  key: keyof ScoreBreakdown;
  label: string;
  max: number;
  icon: typeof Star;
}[] = [
  { key: "reviews", label: "Reviews", max: 25, icon: Star },
  { key: "rating", label: "Rating", max: 20, icon: TrendingUp },
  { key: "website", label: "Website", max: 25, icon: Globe },
  { key: "competitive", label: "Competitive", max: 30, icon: Users },
];

function BreakdownBar({
  label,
  score,
  max,
  icon: Icon,
}: {
  label: string;
  score: number;
  max: number;
  icon: typeof Star;
}) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 70
      ? "bg-emerald-500"
      : pct >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {score}/{max}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ShareableScorecardView({ id }: { id: string }) {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/audit/instant?id=${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1">
        {/* Loading */}
        {loading && (
          <section className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </section>
        )}

        {/* Error */}
        {error && (
          <section className="flex min-h-[60vh] items-center justify-center py-20">
            <Container size="sm">
              <div className="text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="font-display text-2xl font-bold">
                  Score Not Found
                </h2>
                <p className="mt-2 text-muted-foreground">
                  This scorecard may have expired or the link is invalid.
                </p>
                <Link href="/scorecard" className="mt-8 inline-block">
                  <GradientButton size="lg" className="btn-shine">
                    Get Your Own Free Score
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </Link>
              </div>
            </Container>
          </section>
        )}

        {/* Results */}
        {result && (
          <section className="relative overflow-hidden py-16 sm:py-20">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(76,133,255,0.06) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <Container size="lg" className="relative z-10">
              {/* Score header */}
              <FadeInView>
                <div className="flex flex-col items-center text-center">
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Business Health Score
                  </span>
                  <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                    <GradientText>{result.businessName}</GradientText>
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    {result.city}, {result.state} &middot;{" "}
                    {result.vertical.charAt(0).toUpperCase() +
                      result.vertical.slice(1).replace("-", " ")}
                  </p>

                  <div className="mt-8">
                    <ScoreCircle score={result.score} size="lg" />
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    {result.score < 40
                      ? "This business needs immediate attention to compete online."
                      : result.score < 70
                        ? "Good foundation with clear opportunities for improvement."
                        : "Strong online presence!"}
                  </p>
                </div>
              </FadeInView>

              {/* Breakdown */}
              <FadeInView delay={0.15}>
                <div className="mx-auto mt-12 max-w-xl space-y-4">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Score Breakdown
                  </h3>
                  {BREAKDOWN_CONFIG.map((cfg) => (
                    <BreakdownBar
                      key={cfg.key}
                      label={cfg.label}
                      score={result.breakdown[cfg.key]}
                      max={cfg.max}
                      icon={cfg.icon}
                    />
                  ))}
                </div>
              </FadeInView>

              {/* Business vs competitor */}
              <FadeInView delay={0.2}>
                <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-card p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                      This Business
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold">
                        {result.businessData.rating.toFixed(1)}
                      </span>
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.businessData.reviewCount} reviews
                    </p>
                  </div>

                  {result.competitors.length > 0 && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
                        Top Competitor
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold text-amber-400">
                          {result.competitors[0].rating.toFixed(1)}
                        </span>
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {result.competitors[0].reviews} reviews
                      </p>
                      <p className="mt-2 text-xs font-medium text-amber-400/80">
                        {result.competitors[0].name}
                      </p>
                    </div>
                  )}
                </div>
              </FadeInView>

              {/* Website health checks */}
              <FadeInView delay={0.25}>
                <div className="mx-auto mt-12 max-w-xl">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                    <Globe className="h-5 w-5 text-primary" />
                    Website Health
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: "SSL/HTTPS", pass: result.websiteChecks.hasSSL },
                      { label: "Mobile Friendly", pass: result.websiteChecks.hasMobileViewport },
                      { label: "Chat Widget", pass: result.websiteChecks.hasChatWidget },
                      { label: "Schema Markup", pass: result.websiteChecks.hasSchemaMarkup },
                      { label: "Fast Loading", pass: result.websiteChecks.isFastLoading },
                    ].map((check) => (
                      <div
                        key={check.label}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                          check.pass
                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                            : "border-red-500/20 bg-red-500/5 text-red-400"
                        }`}
                      >
                        {check.pass ? (
                          <Check className="h-4 w-4 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        {check.label}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeInView>

              {/* CTA */}
              <FadeInView delay={0.3}>
                <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-10">
                  <h3 className="mb-3 font-display text-xl font-bold sm:text-2xl">
                    How Does <GradientText>Your</GradientText> Business Score?
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Get your own free business health score in 60 seconds. No
                    email required.
                  </p>
                  <Link href="/scorecard">
                    <GradientButton size="lg" className="btn-shine">
                      Get My Free Score
                      <ArrowRight className="h-4 w-4" />
                    </GradientButton>
                  </Link>
                </div>
              </FadeInView>
            </Container>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
