"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Star,
  AlertTriangle,
  Phone,
  BarChart3,
  Search,
  Shield,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { getTradeData, TRADE_SLUGS } from "@/lib/funnel-data";
import { trackAuditRequest, getUtmParams } from "@/lib/tracking";

export default function FreeAuditPage() {
  const params = useParams();
  const trade = getTradeData(params.trade as string);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!trade) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main id="main-content" className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold">Trade not found</h1>
            <p className="mt-2 text-muted-foreground">
              Choose your trade to get started:
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {TRADE_SLUGS.map((slug) => (
                <Link
                  key={slug}
                  href={`/free-audit/${slug}`}
                  className="rounded-lg border border-border/50 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  {slug.charAt(0).toUpperCase() + slug.slice(1)}
                </Link>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const emailValue = (form.get("email") as string)?.trim() || "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setFormError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const utm = getUtmParams();
      const res = await fetch("/api/funnel-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: emailValue,
          phone: form.get("phone"),
          business: form.get("business"),
          trade: trade!.slug,
          source: "free-audit",
          ...utm,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit your audit request.");
      }

      trackAuditRequest(trade!.slug);
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main id="main-content" className="flex-1">
        {/* Hero */}
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
                    Free {trade.label} Marketing Audit
                  </span>
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    {trade.headline}
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground">
                    {trade.subheadline}
                  </p>

                  {/* Pain points */}
                  <ul className="mt-8 space-y-3">
                    {trade.painPoints.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <span className="text-sm text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeInView>

              {/* Right — Form */}
              <FadeInView delay={0.15}>
                {submitted ? (
                  <div className="rounded-2xl border border-accent/30 bg-card p-8 text-center shadow-lg">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                      <Check className="h-7 w-7 text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold">
                      Your Audit Is On the Way!
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Check your email in the next 15 minutes. While you wait:
                    </p>
                    <Link href="/strategy-call" className="mt-6 inline-block">
                      <GradientButton size="lg" className="btn-shine">
                        Book Your Free Strategy Call
                        <ArrowRight className="h-4 w-4" />
                      </GradientButton>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg sm:p-8">
                    <h2 className="font-display text-xl font-bold">
                      Get Your Free {trade.label} Marketing Audit
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Our AI scans your online presence in 60 seconds and shows
                      you exactly where you&apos;re losing leads.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                      <div>
                        <label htmlFor="fa-name" className="text-sm font-medium">
                          Your Name *
                        </label>
                        <input
                          id="fa-name"
                          name="name"
                          required
                          placeholder="John Smith"
                          autoComplete="name"
                          className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="fa-business" className="text-sm font-medium">
                          Business Name *
                        </label>
                        <input
                          id="fa-business"
                          name="business"
                          required
                          placeholder="Smith Plumbing"
                          autoComplete="organization"
                          className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="fa-email" className="text-sm font-medium">
                          Email *
                        </label>
                        <input
                          id="fa-email"
                          name="email"
                          type="email"
                          required
                          placeholder="john@smithplumbing.com"
                          autoComplete="email"
                          aria-describedby={formError ? "fa-form-error" : undefined}
                          className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="fa-phone" className="text-sm font-medium">
                          Phone{" "}
                          <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                          id="fa-phone"
                          name="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          autoComplete="tel"
                          className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                        />
                      </div>

                      {formError && (
                        <p id="fa-form-error" role="alert" className="text-center text-sm text-red-400">
                          {formError}
                        </p>
                      )}

                      <GradientButton
                        type="submit"
                        size="lg"
                        className="btn-shine mt-2 w-full"
                        disabled={loading}
                        aria-busy={loading}
                      >
                        {loading ? (
                          "Running Your Audit..."
                        ) : (
                          <>
                            Get My Free Audit
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </GradientButton>

                      <p className="text-center text-xs text-muted-foreground">
                        <Shield className="mb-0.5 mr-1 inline h-3 w-3" />
                        100% free. No credit card. No obligation.
                      </p>
                    </form>
                  </div>
                )}
              </FadeInView>
            </div>
          </Container>
        </section>

        {/* Stats bar */}
        <Section className="bg-muted/30 py-12">
          <Container>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {trade.stats.map((stat, i) => (
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

        {/* What your audit covers */}
        <Section>
          <Container size="lg">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                What Your <GradientText>Free Audit</GradientText> Covers
              </h2>
              <p className="mt-3 text-center text-muted-foreground">
                Our AI scans 6 critical areas of your online presence and
                compares you against your top local competitors.
              </p>
            </FadeInView>

            <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trade.auditChecks.map((check, i) => {
                const icons = [Search, Star, BarChart3, Phone, Shield, BarChart3];
                const Icon = icons[i % icons.length];
                return (
                  <FadeInView key={check} delay={i * 0.05}>
                    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{check}</span>
                    </div>
                  </FadeInView>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* Testimonial */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl rounded-2xl border border-border/50 bg-card p-8">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <blockquote className="text-lg italic leading-relaxed">
                  &ldquo;{trade.testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {trade.testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{trade.testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {trade.testimonial.business}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    {trade.testimonial.result}
                  </span>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Belief-shifting section */}
        <Section>
          <Container size="md">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                This Isn&apos;t Another <GradientText>Marketing Agency</GradientText>
              </h2>
            </FadeInView>

            <div className="mx-auto mt-12 grid max-w-3xl gap-8">
              {[
                {
                  old: "Traditional agencies charge $2-5K/month and you never know what they're actually doing.",
                  shift:
                    "Sovereign AI gives you a real-time dashboard showing every lead, every call, every dollar. Full transparency, 24/7.",
                },
                {
                  old: "You need to be tech-savvy to use AI marketing tools.",
                  shift:
                    "This is 100% done for you. We build everything in 48 hours. You answer your phone when it rings with new customers. That's it.",
                },
                {
                  old: "Marketing is too expensive for a small operation like mine.",
                  shift:
                    "At $497/month, you need one extra job to break even. Most clients get 15-30 new leads in month one. And we guarantee results — or your money back.",
                },
              ].map((item, i) => (
                <FadeInView key={i} delay={i * 0.1}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">
                        What you believe
                      </p>
                      <p className="text-sm text-muted-foreground">{item.old}</p>
                    </div>
                    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                        The reality
                      </p>
                      <p className="text-sm text-muted-foreground">{item.shift}</p>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Final CTA */}
        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Ready to See What You&apos;re <GradientText>Missing?</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Get your free AI marketing audit in 60 seconds. No credit card.
                  No sales pitch. Just data.
                </p>
                <div className="mt-8 inline-block">
                  <GradientButton
                    size="lg"
                    className="btn-shine"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  >
                    Get My Free Audit Now
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
