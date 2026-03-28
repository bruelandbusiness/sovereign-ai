"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  HelpCircle,
  Monitor,
  Phone,
  Play,
  Shield,
  Star,
  Users,
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
import { trackWebinarRegister, getUtmParams } from "@/lib/tracking";

const WEBINAR_DATES = [
  { label: "Wednesday, April 23, 2026 at 1:00 PM CT", value: "2026-04-23" },
  { label: "Wednesday, May 21, 2026 at 1:00 PM CT", value: "2026-05-21" },
  { label: "Wednesday, June 18, 2026 at 1:00 PM CT", value: "2026-06-18" },
];

const INTEREST_OPTIONS = [
  { label: "AI Call Answering", value: "ai-call-answering" },
  { label: "Lead Generation", value: "lead-generation" },
  { label: "Review Management", value: "review-management" },
  { label: "Full Platform", value: "full-platform" },
  { label: "Not sure yet", value: "not-sure" },
];

const LEARNING_POINTS = [
  {
    icon: Phone,
    title: "How AI answers 100% of your calls",
    description:
      "Never miss a lead again. See how our AI receptionist handles calls, books appointments, and qualifies prospects 24/7.",
  },
  {
    icon: Users,
    title: "How to get 50+ qualified leads per month",
    description:
      "The exact system generating a consistent pipeline of qualified, local leads for contractors across the country.",
  },
  {
    icon: Star,
    title: "How automated review management works",
    description:
      "Watch your online reputation grow on autopilot with AI-powered review requests and response management.",
  },
  {
    icon: Monitor,
    title: "Live dashboard demo",
    description:
      "See the real-time dashboard where you track every call, lead, review, and campaign in one place.",
  },
  {
    icon: HelpCircle,
    title: "Q&A with our team",
    description:
      "Get your specific questions answered live by our marketing and AI specialists.",
  },
];

const testimonials = [
  {
    quote:
      "I was skeptical. Two months later I had more leads than I could handle.",
    name: "Mike R.",
    trade: "Plumbing",
  },
  {
    quote:
      "The webinar opened my eyes. I signed up that week and haven't looked back.",
    name: "Sarah C.",
    trade: "HVAC",
  },
  {
    quote: "Best 45 minutes I've spent on my business all year.",
    name: "James C.",
    trade: "Roofing",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is the webinar really free?",
    a: "Yes, 100% free with no strings attached. We believe that once you see the platform in action, the results will speak for themselves.",
  },
  {
    q: "Do I need to install anything or have technical experience?",
    a: "Not at all. The webinar runs in your browser and requires zero technical knowledge. If you can answer a phone, you can use Sovereign AI.",
  },
  {
    q: "Will there be a recording if I can't attend live?",
    a: "Yes. Everyone who registers will receive a link to the full recording within 24 hours of the live session, so you can watch at your convenience.",
  },
  {
    q: "What kind of businesses is this for?",
    a: "Sovereign AI is designed for home service businesses: plumbing, HVAC, roofing, electrical, landscaping, and similar trades. If you serve local customers, this is for you.",
  },
];

const inputClasses =
  "mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2";

export default function WebinarPage() {
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const utm = getUtmParams();
      const res = await fetch("/api/webinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          business: form.get("business"),
          phone: form.get("phone") || undefined,
          interest: form.get("interest"),
          webinarDate: form.get("webinarDate"),
          ...utm,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || "Something went wrong. Please try again.",
        );
      }
      trackWebinarRegister();
      setRegistered(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: "See Sovereign AI in Action — Live Demo & Q&A",
          description:
            "Join our live 45-minute demo to see how AI-powered marketing generates 50+ qualified leads per month for home service businesses.",
          url: "https://www.trysovereignai.com/webinar",
          eventAttendanceMode:
            "https://schema.org/OnlineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          startDate: WEBINAR_DATES[0].value,
          location: {
            "@type": "VirtualLocation",
            url: "https://www.trysovereignai.com/webinar",
          },
          organizer: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
          },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: "https://www.trysovereignai.com/webinar",
          },
          image: "https://www.trysovereignai.com/opengraph-image",
          isAccessibleForFree: true,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Live Demo Webinar", url: "/webinar" },
        ]}
      />
      <Header variant="minimal" />

      <main id="main-content" className="flex-1">
        {/* ── Hero ── */}
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
            <div className="grid items-start gap-12 lg:grid-cols-2">
              {/* Left */}
              <FadeInView>
                <div>
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Free Live Demo
                  </span>
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    See Sovereign AI{" "}
                    <GradientText>in Action</GradientText>
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Join our live 45-minute demo and discover how AI-powered
                    marketing generates 50+ qualified leads per month for home
                    service businesses — without hiring a marketing team or
                    learning new software.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> 45 minutes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Play className="h-4 w-4" /> Live + recording
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-4 w-4" /> 100% free
                    </span>
                  </div>

                  {/* Video Embed Placeholder */}
                  <div className="mt-8 overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                    <div className="relative aspect-video w-full">
                      <iframe
                        className="absolute inset-0 h-full w-full"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        title="Sovereign AI Demo Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    <p className="px-4 py-2 text-center text-xs text-muted-foreground">
                      Watch a preview — register below for the full live demo
                    </p>
                  </div>

                  {/* Social proof */}
                  <div className="mt-8 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["MR", "SC", "JC", "DW", "KL"].map((initials) => (
                        <div
                          key={initials}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-bold text-primary"
                        >
                          {initials}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Join{" "}
                      <strong className="text-foreground">
                        500+ businesses
                      </strong>{" "}
                      who&apos;ve already transformed their marketing
                    </p>
                  </div>
                </div>
              </FadeInView>

              {/* Right — Registration Form */}
              <FadeInView delay={0.15}>
                <div className="lg:sticky lg:top-8" id="register">
                  {registered ? (
                    <div className="rounded-2xl border border-accent/30 bg-card p-8 text-center shadow-lg">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                        <Check className="h-7 w-7 text-accent" />
                      </div>
                      <h2 className="font-display text-2xl font-bold">
                        You&apos;re Registered!
                      </h2>
                      <p className="mt-2 text-muted-foreground">
                        Check your email for confirmation and calendar details.
                        We&apos;ll send a reminder before the session.
                      </p>
                      <Link
                        href="/strategy-call"
                        className="mt-6 inline-block"
                      >
                        <GradientButton size="lg" className="btn-shine">
                          Book a Free Strategy Call
                          <ArrowRight className="h-4 w-4" />
                        </GradientButton>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg sm:p-8">
                      <h2 className="font-display text-xl font-bold">
                        Register for the Live Demo
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Pick a date and save your seat — spots are limited.
                      </p>

                      <form
                        onSubmit={handleSubmit}
                        className="mt-6 grid gap-4"
                      >
                        <div>
                          <label
                            htmlFor="name"
                            className="text-sm font-medium"
                          >
                            Your Name
                          </label>
                          <input
                            id="name"
                            name="name"
                            required
                            placeholder="John Smith"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="text-sm font-medium"
                          >
                            Email
                          </label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="john@smithplumbing.com"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="business"
                            className="text-sm font-medium"
                          >
                            Business Name
                          </label>
                          <input
                            id="business"
                            name="business"
                            required
                            placeholder="Smith Plumbing Co."
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="phone"
                            className="text-sm font-medium"
                          >
                            Phone{" "}
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          </label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="interest"
                            className="text-sm font-medium"
                          >
                            Which service interests you most?
                          </label>
                          <select
                            id="interest"
                            name="interest"
                            required
                            defaultValue=""
                            className={inputClasses}
                          >
                            <option value="" disabled>
                              Select a service...
                            </option>
                            {INTEREST_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="webinarDate"
                            className="text-sm font-medium"
                          >
                            Preferred Date
                          </label>
                          <select
                            id="webinarDate"
                            name="webinarDate"
                            required
                            defaultValue=""
                            className={inputClasses}
                          >
                            <option value="" disabled>
                              Choose a date...
                            </option>
                            {WEBINAR_DATES.map((d) => (
                              <option key={d.value} value={d.label}>
                                {d.label}
                              </option>
                            ))}
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
                            "Registering..."
                          ) : (
                            <>
                              Reserve My Spot
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </GradientButton>

                        <p className="text-center text-xs text-muted-foreground">
                          <Shield className="mb-0.5 mr-1 inline h-3 w-3" />
                          Free to attend. No credit card required.
                        </p>
                      </form>
                    </div>
                  )}
                </div>
              </FadeInView>
            </div>
          </Container>
        </section>

        {/* ── What You'll Learn ── */}
        <Section>
          <Container size="lg">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                What You&apos;ll <GradientText>Learn</GradientText>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
                In 45 minutes, we cover the exact system that&apos;s helping
                contractors across the country fill their calendars.
              </p>
            </FadeInView>

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {LEARNING_POINTS.map((point, i) => {
                const Icon = point.icon;
                return (
                  <FadeInView key={point.title} delay={i * 0.08}>
                    <div className="flex flex-col rounded-xl border border-border/50 bg-card p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-display text-base font-semibold">
                        {point.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  </FadeInView>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* ── Upcoming Dates ── */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Upcoming <GradientText>Webinar Dates</GradientText>
              </h2>
              <p className="mt-3 text-center text-muted-foreground">
                Choose the session that works best for your schedule.
              </p>
            </FadeInView>

            <div className="mx-auto mt-10 grid max-w-2xl gap-4">
              {WEBINAR_DATES.map((d, i) => (
                <FadeInView key={d.value} delay={i * 0.08}>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{d.label}</p>
                        <p className="text-xs text-muted-foreground">
                          45 min &middot; Online &middot; Free
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        document
                          .getElementById("register")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="shrink-0"
                    >
                      <GradientButton size="sm" className="btn-shine">
                        Register
                      </GradientButton>
                    </button>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── Social Proof / Testimonials ── */}
        <Section>
          <Container>
            <FadeInView>
              <p className="text-center text-sm font-semibold uppercase tracking-wider text-primary">
                Don&apos;t take our word for it
              </p>
              <h2 className="mt-2 text-center font-display text-3xl font-bold">
                What Contractors Are{" "}
                <GradientText>Saying</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <FadeInView key={t.name} delay={i * 0.1}>
                  <div className="rounded-xl border border-border/50 bg-card p-5">
                    <div className="mb-3 flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.trade}
                      </p>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>

            {/* Social proof banner */}
            <FadeInView delay={0.2}>
              <div className="mx-auto mt-10 flex max-w-lg items-center justify-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-6 py-3">
                <Users className="h-5 w-5 text-accent" />
                <p className="text-sm font-medium">
                  Join{" "}
                  <span className="text-accent">500+ businesses</span>{" "}
                  who&apos;ve already transformed their marketing
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ── FAQ ── */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Frequently Asked{" "}
                <GradientText>Questions</GradientText>
              </h2>
            </FadeInView>

            <div className="mx-auto mt-10 max-w-2xl divide-y divide-border/50">
              {FAQ_ITEMS.map((item, i) => (
                <FadeInView key={item.q} delay={i * 0.05}>
                  <div className="py-4">
                    <button
                      className="flex w-full items-center justify-between gap-4 text-left"
                      onClick={() =>
                        setOpenFaq(openFaq === i ? null : i)
                      }
                      aria-expanded={openFaq === i}
                    >
                      <span className="font-medium">{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.a}
                      </p>
                    )}
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── Final CTA ── */}
        <Section>
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  45 Minutes That Could{" "}
                  <GradientText>Change Your Business</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Register for the free live demo and see what&apos;s possible
                  with AI-powered marketing.
                </p>
                <button
                  onClick={() =>
                    document
                      .getElementById("register")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="mt-8 inline-block"
                >
                  <GradientButton size="lg" className="btn-shine">
                    Reserve My Spot — It&apos;s Free
                    <ArrowRight className="h-4 w-4" />
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
