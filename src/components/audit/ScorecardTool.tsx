"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Star,
  Shield,
  TrendingUp,
  Globe,
  Users,
  BarChart3,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { ScoreCircle } from "./ScoreCircle";

// ---------------------------------------------------------------------------
// Types (mirrors API response)
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

type Step = "form" | "loading" | "results" | "thankyou";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const VERTICALS = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "roofing", label: "Roofing" },
  { value: "general-contractor", label: "General Contractor" },
];

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

const LOADING_STEPS = [
  "Searching Google Maps...",
  "Analyzing your website...",
  "Scanning competitors...",
  "Calculating your score...",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const styles = {
    high: "border-red-500/20 bg-red-500/10 text-red-400",
    medium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[priority]}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ScorecardTool() {
  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Form submit handler
  async function handleAuditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStep("loading");
    setLoadingStep(0);

    const form = new FormData(e.currentTarget);
    const payload = {
      businessName: form.get("businessName") as string,
      city: form.get("city") as string,
      state: form.get("state") as string,
      vertical: form.get("vertical") as string,
    };

    // Animate loading steps
    const interval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 1500);

    try {
      const res = await fetch("/api/audit/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setStep("form");
        return;
      }

      const data: AuditResult = await res.json();
      setResult(data);
      setStep("results");
    } catch {
      clearInterval(interval);
      setError("Network error. Please check your connection and try again.");
      setStep("form");
    }
  }

  // Email capture handler
  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!result) return;

    setEmailSubmitting(true);
    const form = new FormData(e.currentTarget);

    try {
      await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("leadName"),
          email: form.get("leadEmail"),
          phone: form.get("leadPhone") || "",
          source: "scorecard",
          trade: result.vertical,
          metadata: {
            scorecardId: result.id,
            score: result.score,
            businessName: result.businessName,
            city: result.city,
            state: result.state,
          },
        }),
      });
      setEmailSubmitted(true);
    } catch {
      // Still show thank you even if capture fails
      setEmailSubmitted(true);
    } finally {
      setEmailSubmitting(false);
    }
  }

  // Share handler
  function handleShare() {
    if (!result) return;
    const url = `${window.location.origin}/scorecard/${result.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1">
        {/* ================================================================ */}
        {/* STEP: FORM                                                       */}
        {/* ================================================================ */}
        {step === "form" && (
          <>
            <section className="relative overflow-hidden py-16 sm:py-24">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(76,133,255,0.08) 0%, transparent 70%)",
                }}
                aria-hidden
              />
              <Container size="lg" className="relative z-10">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                  {/* Left — Copy */}
                  <FadeInView>
                    <div>
                      <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                        Free in 60 Seconds
                      </span>
                      <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                        How Does Your Business{" "}
                        <GradientText>Stack Up?</GradientText>
                      </h1>
                      <p className="mt-4 text-lg text-muted-foreground">
                        Get an instant health score based on your Google presence,
                        website performance, and how you compare to local
                        competitors. No sign-up required.
                      </p>

                      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                          { icon: Star, text: "Google Reviews Analysis" },
                          { icon: Globe, text: "Website Health Check" },
                          { icon: Users, text: "Competitor Comparison" },
                          { icon: Zap, text: "Actionable Recommendations" },
                        ].map(({ icon: Icon, text }) => (
                          <div
                            key={text}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-primary" />
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </FadeInView>

                  {/* Right — Form */}
                  <FadeInView delay={0.15}>
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg sm:p-8">
                      <h2 className="font-display text-xl font-bold">
                        Get Your Free Business Score
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Enter your business details and we&apos;ll scan your
                        online presence instantly.
                      </p>

                      {error && (
                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      <form
                        onSubmit={handleAuditSubmit}
                        className="mt-6 grid gap-4"
                      >
                        <div>
                          <label
                            htmlFor="businessName"
                            className="text-sm font-medium"
                          >
                            Business Name
                          </label>
                          <input
                            id="businessName"
                            name="businessName"
                            required
                            placeholder="Smith Plumbing"
                            className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="city"
                              className="text-sm font-medium"
                            >
                              City
                            </label>
                            <input
                              id="city"
                              name="city"
                              required
                              placeholder="Austin"
                              className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="state"
                              className="text-sm font-medium"
                            >
                              State
                            </label>
                            <select
                              id="state"
                              name="state"
                              required
                              className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select
                              </option>
                              {US_STATES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="vertical"
                            className="text-sm font-medium"
                          >
                            Industry
                          </label>
                          <select
                            id="vertical"
                            name="vertical"
                            required
                            className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Select your industry
                            </option>
                            {VERTICALS.map((v) => (
                              <option key={v.value} value={v.value}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <GradientButton
                          type="submit"
                          size="lg"
                          className="btn-shine mt-2 w-full"
                        >
                          Get My Free Score
                          <ArrowRight className="h-4 w-4" />
                        </GradientButton>

                        <p className="text-center text-xs text-muted-foreground">
                          <Shield className="mb-0.5 mr-1 inline h-3 w-3" />
                          100% free. No email required. Instant results.
                        </p>
                      </form>
                    </div>
                  </FadeInView>
                </div>
              </Container>
            </section>

            {/* Social proof section */}
            <Section className="bg-muted/30 py-12">
              <Container>
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                  {[
                    { value: "2,500+", label: "Businesses Scored" },
                    { value: "47", label: "Average Score" },
                    { value: "3.2x", label: "Avg. Lead Increase" },
                    { value: "60s", label: "Time to Results" },
                  ].map((stat, i) => (
                    <FadeInView key={stat.label} delay={i * 0.1}>
                      <div className="text-center">
                        <p className="font-display text-2xl font-bold text-primary sm:text-3xl">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </FadeInView>
                  ))}
                </div>
              </Container>
            </Section>
          </>
        )}

        {/* ================================================================ */}
        {/* STEP: LOADING                                                    */}
        {/* ================================================================ */}
        {step === "loading" && (
          <section className="flex min-h-[60vh] items-center justify-center py-20">
            <Container size="sm">
              <div className="text-center">
                <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-primary" />
                <h2 className="font-display text-2xl font-bold">
                  Analyzing Your Business...
                </h2>
                <div className="mx-auto mt-8 max-w-xs space-y-3">
                  {LOADING_STEPS.map((label, i) => (
                    <div
                      key={label}
                      className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${
                        i <= loadingStep ? "opacity-100" : "opacity-30"
                      }`}
                    >
                      {i < loadingStep ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : i === loadingStep ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border border-border/50" />
                      )}
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* ================================================================ */}
        {/* STEP: RESULTS                                                    */}
        {/* ================================================================ */}
        {step === "results" && result && (
          <>
            {/* Score hero */}
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
                <FadeInView>
                  <div className="flex flex-col items-center text-center">
                    <h2 className="mb-2 font-display text-2xl font-bold sm:text-3xl">
                      Your Business Health Score
                    </h2>
                    <p className="mb-8 text-lg text-muted-foreground">
                      <GradientText>{result.businessName}</GradientText>
                      <span className="ml-2 text-muted-foreground">
                        &mdash; {result.city}, {result.state}
                      </span>
                    </p>

                    <ScoreCircle score={result.score} size="lg" />

                    <p className="mt-4 text-sm text-muted-foreground">
                      {result.score < 40
                        ? "Your business needs immediate attention to compete online."
                        : result.score < 70
                          ? "Good foundation, but there are clear opportunities to improve."
                          : "Strong online presence! Here's how to stay ahead."}
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

                {/* Business data + competitor comparison */}
                <FadeInView delay={0.2}>
                  <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
                    {/* Your business */}
                    <div className="rounded-xl border border-border/50 bg-card p-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        Your Business
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
                      {result.businessData.address && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {result.businessData.address}
                        </p>
                      )}
                    </div>

                    {/* Top competitor */}
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

                {/* Website checks */}
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

                {/* Recommendations */}
                <FadeInView delay={0.3}>
                  <div className="mx-auto mt-12 max-w-xl">
                    <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                      <Zap className="h-5 w-5 text-primary" />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium">{rec.title}</p>
                              <PriorityBadge priority={rec.priority} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeInView>

                {/* Share button */}
                <FadeInView delay={0.35}>
                  <div className="mx-auto mt-8 flex max-w-xl justify-center">
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Share Your Score
                        </>
                      )}
                    </button>
                  </div>
                </FadeInView>

                {/* Email capture */}
                <FadeInView delay={0.4}>
                  <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
                    {emailSubmitted ? (
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                          <Check className="h-7 w-7 text-emerald-400" />
                        </div>
                        <h3 className="font-display text-xl font-bold">
                          Check Your Inbox!
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your detailed report is on its way. In the meantime:
                        </p>
                        <Link href="/strategy-call" className="mt-6 inline-block">
                          <GradientButton size="lg" className="btn-shine">
                            Book Your Free Strategy Call
                            <ArrowRight className="h-4 w-4" />
                          </GradientButton>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <h3 className="mb-2 text-center font-display text-xl font-bold">
                          Get Your Full Detailed Report
                        </h3>
                        <p className="mb-6 text-center text-sm text-muted-foreground">
                          We&apos;ll email you a comprehensive breakdown with
                          step-by-step fixes for every issue we found.
                        </p>
                        <form
                          onSubmit={handleEmailSubmit}
                          className="grid gap-4 sm:grid-cols-2"
                        >
                          <div>
                            <label
                              htmlFor="leadName"
                              className="text-sm font-medium"
                            >
                              Your Name
                            </label>
                            <input
                              id="leadName"
                              name="leadName"
                              required
                              placeholder="John Smith"
                              className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="leadEmail"
                              className="text-sm font-medium"
                            >
                              Email
                            </label>
                            <input
                              id="leadEmail"
                              name="leadEmail"
                              type="email"
                              required
                              placeholder="john@company.com"
                              className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="leadPhone"
                              className="text-sm font-medium"
                            >
                              Phone{" "}
                              <span className="text-muted-foreground">
                                (optional)
                              </span>
                            </label>
                            <input
                              id="leadPhone"
                              name="leadPhone"
                              type="tel"
                              placeholder="(555) 123-4567"
                              className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <GradientButton
                              type="submit"
                              size="lg"
                              className="btn-shine w-full"
                              disabled={emailSubmitting}
                            >
                              {emailSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4" />
                                  Send My Detailed Report
                                </>
                              )}
                            </GradientButton>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </FadeInView>

                {/* CTA */}
                <FadeInView delay={0.45}>
                  <div className="mx-auto mt-12 max-w-xl text-center">
                    <h3 className="font-display text-xl font-bold sm:text-2xl">
                      Want to Improve Your Score?
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Book a free strategy call and get a custom plan to dominate
                      your local market.
                    </p>
                    <div className="mt-6 inline-flex flex-col items-center gap-3 sm:flex-row">
                      <Link href="/strategy-call">
                        <GradientButton size="lg" className="btn-shine">
                          <Phone className="h-4 w-4" />
                          Book Free Strategy Call
                        </GradientButton>
                      </Link>
                      <button
                        onClick={() => {
                          setResult(null);
                          setStep("form");
                          setError(null);
                          setEmailSubmitted(false);
                        }}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Score Another Business
                      </button>
                    </div>
                  </div>
                </FadeInView>
              </Container>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
