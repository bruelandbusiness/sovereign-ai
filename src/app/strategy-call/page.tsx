import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Shield,
  Calendar,
  Star,
  Users,
  TrendingUp,
  Target,
  Zap,
  Award,
  Phone,
  MessageSquare,
  BarChart3,
  CheckCircle2,
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
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { StrategyCallForm } from "@/components/strategy-call/StrategyCallForm";

export const metadata: Metadata = {
  alternates: { canonical: "/strategy-call" },
  title: "Free AI Marketing Strategy Call | Sovereign AI",
  description:
    "Book a free 15-minute strategy call. Get a custom AI marketing roadmap showing exactly how to generate more leads and book more jobs for your home service business.",
  openGraph: {
    title: "Get Your Custom AI Marketing Roadmap — Free Strategy Call",
    description:
      "In 15 minutes, we'll show you exactly how AI can generate more leads, book more jobs, and grow your revenue. No obligation. Valued at $2,500.",
    url: "/strategy-call",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Marketing Strategy Call | Sovereign AI",
    description:
      "Book a free 15-minute strategy call. Custom AI marketing roadmap for your home service business. No obligation.",
  },
};

const callIncludes = [
  "Custom AI marketing roadmap tailored to your trade and market",
  "Competitor analysis showing where you stand locally",
  "ROI projection based on your average job value",
  "Live walkthrough of the Sovereign AI dashboard",
  "Honest assessment — if we can't help, we'll tell you",
];

const callSteps = [
  {
    step: 1,
    title: "Quick Discovery",
    description:
      "We ask about your business, service area, and goals so we can tailor everything to your situation.",
    icon: MessageSquare,
    duration: "3 min",
  },
  {
    step: 2,
    title: "Competitive Audit Review",
    description:
      "We show you exactly where competitors are outranking you and stealing leads you should be getting.",
    icon: BarChart3,
    duration: "4 min",
  },
  {
    step: 3,
    title: "Custom AI Roadmap",
    description:
      "We build your personalized AI marketing plan with projected ROI based on your average job value.",
    icon: Target,
    duration: "5 min",
  },
  {
    step: 4,
    title: "Honest Next Steps",
    description:
      "You get an honest assessment. If we can help, we'll explain how. If not, you keep the roadmap — no strings.",
    icon: CheckCircle2,
    duration: "3 min",
  },
];

const testimonials = [
  {
    quote:
      "The strategy call alone was worth $5K. They showed me exactly where I was bleeding leads and my phone started ringing within two weeks.",
    name: "Mike R.",
    role: "HVAC Contractor",
    location: "Dallas, TX",
    result: "+47 leads in first month",
  },
  {
    quote:
      "I was skeptical, but they pulled up my competitors' data right on the call. Seeing where I was losing jobs made everything click.",
    name: "Sarah C.",
    role: "Plumbing Company Owner",
    location: "Phoenix, AZ",
    result: "2x revenue in 90 days",
  },
  {
    quote:
      "No pressure, no BS. They showed me the numbers and let me decide. Best marketing decision I've made in 15 years of business.",
    name: "James T.",
    role: "Electrical Contractor",
    location: "Denver, CO",
    result: "$18K additional monthly revenue",
  },
];

const idealFor = [
  "Home service contractors doing $300K+ annually",
  "Business owners tired of agencies that overpromise and underdeliver",
  "Contractors who want to stop depending on word-of-mouth alone",
  "Owners ready to scale but unsure where to invest in marketing",
];

const objections = [
  {
    question: "Is this a sales pitch?",
    answer:
      "It's a strategy session. We'll show you exactly what AI marketing can do for your specific business. If we're a good fit, we'll discuss options. If not, you'll walk away with actionable insights either way.",
  },
  {
    question: "How long is the call?",
    answer:
      "15-30 minutes depending on the complexity of your business. We respect your time — you'll never be on the phone longer than you want.",
  },
  {
    question: "Do I need to prepare anything?",
    answer:
      "Nope. Just know your business name and approximate monthly revenue. We'll handle the research before the call.",
  },
  {
    question: "What if I'm not ready to buy?",
    answer:
      "No pressure. Many of our best clients took weeks or months after their strategy call to sign up. The insights are yours to keep regardless.",
  },
  {
    question: "How is this different from other marketing consultations?",
    answer:
      "We don't do generic advice. Before your call, we run a real competitive analysis on your market. You'll see actual data — your rankings, your competitors' spend, and the gaps you can exploit. Most agencies skip this entirely.",
  },
  {
    question: "What if AI marketing doesn't work for my trade?",
    answer:
      "We specialize in home services — HVAC, plumbing, electrical, roofing, and more. We've helped contractors in every major trade. If your market is too small or saturated, we'll tell you honestly.",
  },
];

export default function StrategyCallPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Free AI Marketing Strategy Call",
          description:
            "Book a free 15-minute growth strategy call and get a custom AI marketing roadmap for your home service business.",
          provider: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
          },
          areaServed: "US",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: objections.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Strategy Call", url: "/strategy-call" },
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
            <div className="grid items-start gap-12 lg:grid-cols-2">
              {/* Left */}
              <FadeInView>
                <div>
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Free Strategy Session — No Obligation
                  </span>
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    Stop Losing Jobs to Competitors.{" "}
                    <GradientText>
                      Get Your Custom AI Marketing Roadmap.
                    </GradientText>
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground">
                    In just 15 minutes, we&apos;ll pull back the curtain on your
                    local market — show you exactly where you&apos;re losing
                    leads, what your competitors are doing, and how AI can put
                    you ahead. You&apos;ll leave with a concrete plan, whether
                    you work with us or not.
                  </p>

                  {/* What's included */}
                  <ul className="mt-8 space-y-3">
                    {callIncludes.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <CountdownTimer
                      label="Free spots remaining for:"
                      hoursFromVisit={24}
                      variant="banner"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> 15 min
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-4 w-4" /> No obligation
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Phone or Zoom
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400" /> 4.9/5 rating
                    </span>
                  </div>

                  {/* Mobile-only CTA to jump to form */}
                  <div className="mt-6 lg:hidden">
                    <Link href="#booking-form">
                      <GradientButton size="lg" className="btn-shine w-full">
                        Book My Free Strategy Call
                        <ArrowRight className="h-4 w-4" />
                      </GradientButton>
                    </Link>
                  </div>
                </div>
              </FadeInView>

              {/* Right — Booking CTA */}
              <FadeInView delay={0.15}>
                <div
                  id="booking-form"
                  className="scroll-mt-24 rounded-2xl border border-border/50 bg-card p-6 shadow-lg sm:p-8 lg:sticky lg:top-24"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold">
                        Book Your Strategy Call
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Valued at $2,500 — Yours free
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    {process.env.NEXT_PUBLIC_CALENDLY_URL ? (
                      <iframe
                        src={`${process.env.NEXT_PUBLIC_CALENDLY_URL}?hide_gdpr_banner=1&background_color=101018&text_color=ececef&primary_color=4c85ff`}
                        className="h-[520px] w-full rounded-lg border-0"
                        title="Schedule a strategy call"
                        loading="lazy"
                      />
                    ) : (
                      <StrategyCallForm />
                    )}
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-accent/5 p-3">
                    <div className="flex -space-x-2">
                      {["JR", "SC", "MR"].map((initials) => (
                        <div
                          key={initials}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[10px] font-bold text-primary"
                        >
                          {initials}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">
                        127 contractors
                      </strong>{" "}
                      booked a call this month
                    </p>
                  </div>

                  {/* Testimonial near conversion point */}
                  <div className="mt-4 rounded-lg border border-border/30 bg-muted/30 p-3">
                    <div className="mb-1 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      &ldquo;{testimonials[0].quote}&rdquo;
                      <span className="mt-1 block text-xs text-muted-foreground/70">
                        &mdash; {testimonials[0].name},{" "}
                        {testimonials[0].role}, {testimonials[0].location}
                      </span>
                    </p>
                  </div>
                </div>
              </FadeInView>
            </div>
          </Container>
        </section>

        {/* Results-focused social proof strip */}
        <Section className="bg-muted/30 py-12">
          <Container>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                {
                  icon: TrendingUp,
                  value: "312%",
                  label: "Avg. Lead Increase",
                },
                { icon: Users, value: "500+", label: "Contractors Served" },
                { icon: Zap, value: "48hr", label: "Setup to Results" },
                {
                  icon: Shield,
                  value: "60-Day",
                  label: "Money-Back Guarantee",
                },
              ].map((stat, i) => (
                <FadeInView key={stat.label} delay={i * 0.1}>
                  <div className="flex flex-col items-center text-center">
                    <stat.icon className="mb-2 h-5 w-5 text-primary" />
                    <p className="font-display text-2xl font-bold">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* What happens on the call — detailed */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Here&apos;s Exactly What Happens on the{" "}
                  <GradientText>Call</GradientText>
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                  No guesswork, no fluff. In 15 focused minutes, you&apos;ll
                  walk away with a clear picture of your market and a plan to
                  dominate it.
                </p>
              </div>
            </FadeInView>
            <div className="mx-auto mt-12 max-w-xl space-y-8">
              {callSteps.map((item, i) => (
                <FadeInView key={item.step} delay={i * 0.1}>
                  <div className="flex items-start gap-5">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-bg text-sm font-bold text-white">
                        {item.step}
                      </div>
                      {i < callSteps.length - 1 && (
                        <div className="mt-2 h-8 w-px bg-border/50" />
                      )}
                    </div>
                    <div className="pb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold">
                          {item.title}
                        </h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          ~{item.duration}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Who this is for */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  This Call Is <GradientText>Perfect For You</GradientText> If...
                </h2>
              </div>
            </FadeInView>
            <div className="mx-auto mt-10 max-w-lg">
              <FadeInView delay={0.1}>
                <div className="rounded-2xl border border-border/50 bg-card p-6">
                  <ul className="space-y-4">
                    {idealFor.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeInView>
            </div>
          </Container>
        </Section>

        {/* Testimonials */}
        <Section>
          <Container size="lg">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Contractors Who Took the{" "}
                  <GradientText>Call</GradientText>
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                  Don&apos;t take our word for it. Here&apos;s what happened
                  after their strategy session.
                </p>
              </div>
            </FadeInView>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <FadeInView key={t.name} delay={i * 0.1}>
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-border/50 bg-card p-6">
                    <div>
                      <div className="mb-3 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-4">
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.role}, {t.location}
                        </p>
                      </div>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {t.result}
                      </span>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Meet your strategist */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Meet Your <GradientText>Strategist</GradientText>
                </h2>
              </div>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  {/* Professional headshot placeholder */}
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-bold text-primary">
                    SA
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">
                      Sovereign AI Growth Team
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your call is led by a senior growth strategist who
                      specializes in home service businesses. Every member of
                      our team has worked in or with the trades — we speak your
                      language and understand your market.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {[
                        { icon: Award, text: "500+ contractors helped" },
                        { icon: TrendingUp, text: "$12M+ revenue generated" },
                        { icon: Target, text: "Home services specialists" },
                      ].map((credential) => (
                        <span
                          key={credential.text}
                          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          <credential.icon className="h-3 w-3 text-primary" />
                          {credential.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* FAQ / Objection handling */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Common <GradientText>Questions</GradientText>
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                  Everything you need to know before booking your free strategy
                  call.
                </p>
              </div>
            </FadeInView>
            <div className="mx-auto mt-12 max-w-2xl space-y-4">
              {objections.map((item, i) => (
                <FadeInView key={item.question} delay={i * 0.1}>
                  <div className="rounded-xl border border-border/50 bg-card p-5">
                    <h3 className="font-semibold">{item.question}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.answer}
                    </p>
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
                  Right Now, a Competitor Is Getting{" "}
                  <GradientText>
                    the Call You Should Have Answered
                  </GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Every day without AI marketing costs you $1,200+ in missed
                  jobs. 15 minutes on this call could change the next 12 months
                  of your business.
                </p>

                {/* Guarantee badge */}
                <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm">
                  <Shield className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      Zero-risk guarantee:
                    </strong>{" "}
                    No obligation. No credit card. No pressure. Ever.
                  </span>
                </div>

                <div className="mt-8">
                  <Link href="#booking-form">
                    <GradientButton size="lg" className="btn-shine">
                      Claim My Free Strategy Call Now
                      <ArrowRight className="h-4 w-4" />
                    </GradientButton>
                  </Link>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Only 3 spots remaining this week &mdash; first come, first
                  served
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
