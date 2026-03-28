"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  Shield,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { trackPlaybookDownload, getUtmParams } from "@/lib/tracking";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

const chapters = [
  {
    icon: Target,
    number: "01",
    title: "Why Word-of-Mouth Is No Longer Enough",
    description:
      "The data behind the shift: 73% of homeowners search online before hiring. If you're not showing up, you're invisible.",
  },
  {
    icon: Zap,
    number: "02",
    title: "The 16 AI Systems That Replace a Marketing Department",
    description:
      "A breakdown of every AI service — from lead generation to review management — and how they work together as a single growth engine.",
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "The ROI Playbook: From $497/Month to 8.7x Return",
    description:
      "Real math from real businesses. How one plumber turned $347 in ad spend into $41,000 in revenue — and how to replicate it.",
  },
  {
    icon: BookOpen,
    number: "04",
    title: "The 90-Day Launch Plan",
    description:
      "Step-by-step implementation guide: what happens in week 1, month 1, and month 3. Including the KPIs you should track.",
  },
  {
    icon: Shield,
    number: "05",
    title: "How to Evaluate Any Marketing Investment",
    description:
      "The 5-question framework that protects you from agencies that overpromise. Use this whether you choose Sovereign AI or not.",
  },
];

export default function PlaybookPage() {
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const utm = getUtmParams();
      const res = await fetch("/api/funnel-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          trade: form.get("trade"),
          source: "playbook",
          ...utm,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      trackPlaybookDownload(form.get("trade") as string);
      setDownloaded(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: "The AI Marketing Playbook for Home Service Businesses",
          description:
            "Free 32-page guide: how to use AI to generate leads, dominate local search, and grow revenue for home service businesses.",
          author: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
          },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          numberOfPages: 32,
          bookFormat: "https://schema.org/EBook",
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "AI Marketing Playbook", url: "/playbook" },
        ]}
      />
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
              {/* Left */}
              <FadeInView>
                <div>
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Free Download
                  </span>
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    The AI Marketing Playbook for{" "}
                    <GradientText>Home Service Businesses</GradientText>
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground">
                    The complete guide to using AI to generate leads, dominate
                    local search, and grow your revenue — even if you&apos;ve never
                    done digital marketing before.
                  </p>

                  <div className="mt-6">
                    <CountdownTimer
                      label="Free download expires in:"
                      hoursFromVisit={48}
                      variant="banner"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {["32 pages", "Real case studies", "Action steps included"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Downloaded by <strong className="text-foreground">3,400+</strong>{" "}
                      contractors
                    </span>
                  </div>
                </div>
              </FadeInView>

              {/* Right — Form */}
              <FadeInView delay={0.15}>
                {downloaded ? (
                  <div className="rounded-2xl border border-accent/30 bg-card p-8 text-center shadow-lg">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                      <Download className="h-7 w-7 text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold">
                      Your Playbook Is On the Way!
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Check your email. While you wait, take the next step:
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                      <Link href="/strategy-call">
                        <GradientButton size="lg" className="btn-shine w-full">
                          Book Your Free Strategy Call
                          <ArrowRight className="h-4 w-4" />
                        </GradientButton>
                      </Link>
                      <Link href="/webinar">
                        <GradientButton
                          variant="outline"
                          size="lg"
                          className="w-full"
                        >
                          Watch the Free Masterclass
                        </GradientButton>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg sm:p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="font-display text-lg font-bold">
                        Get Your Free Playbook
                      </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium">
                          Your Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          required
                          placeholder="John Smith"
                          className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="john@smithplumbing.com"
                          className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="trade" className="text-sm font-medium">
                          Your Trade
                        </label>
                        <select
                          id="trade"
                          name="trade"
                          className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
                        >
                          <option value="">Select your trade</option>
                          <option value="plumbing">Plumbing</option>
                          <option value="hvac">HVAC</option>
                          <option value="roofing">Roofing</option>
                          <option value="electrical">Electrical</option>
                          <option value="landscaping">Landscaping</option>
                          <option value="general-contractor">General Contractor</option>
                          <option value="other">Other Home Service</option>
                        </select>
                      </div>

                      {error && (
                        <p className="text-sm text-red-400">{error}</p>
                      )}

                      <GradientButton
                        type="submit"
                        size="lg"
                        className="btn-shine mt-2 w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          "Sending..."
                        ) : (
                          <>
                            Download the Free Playbook
                            <Download className="h-4 w-4" />
                          </>
                        )}
                      </GradientButton>

                      <p className="text-center text-xs text-muted-foreground">
                        <Shield className="mb-0.5 mr-1 inline h-3 w-3" />
                        Free. No credit card. No spam.
                      </p>
                    </form>
                  </div>
                )}
              </FadeInView>
            </div>
          </Container>
        </section>

        {/* What's inside */}
        <Section className="bg-muted/30">
          <Container size="lg">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                What&apos;s <GradientText>Inside</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-3xl gap-4">
              {chapters.map((chapter, i) => (
                <FadeInView key={chapter.number} delay={i * 0.08}>
                  <div className="flex gap-4 rounded-xl border border-border/50 bg-card p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <chapter.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          Chapter {chapter.number}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-semibold">
                        {chapter.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {chapter.description}
                      </p>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Who it's for */}
        <Section>
          <Container size="md">
            <div className="grid gap-8 md:grid-cols-2">
              <FadeInView>
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-accent">
                    This playbook IS for you if...
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      "You run a home service business",
                      "You want more leads but hate figuring out marketing",
                      "You've been burned by agencies before",
                      "You want to understand AI marketing without the hype",
                      "You're ready to invest in growth (but want proof first)",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeInView>
              <FadeInView delay={0.1}>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-red-400">
                    This playbook is NOT for you if...
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      "You're not in the home services industry",
                      "You're looking for a get-rich-quick scheme",
                      "You don't have a real business with real customers",
                      "You're not willing to invest anything in growth",
                      "You think marketing is a waste of money",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 text-red-400">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeInView>
            </div>
          </Container>
        </Section>

        {/* Final CTA */}
        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Get the Playbook.{" "}
                  <GradientText>Get Ahead.</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  32 pages of actionable AI marketing strategies — free.
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="mt-8 inline-block"
                >
                  <GradientButton size="lg" className="btn-shine">
                    Download Free Playbook
                    <Download className="h-4 w-4" />
                  </GradientButton>
                </button>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
