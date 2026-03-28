import { Metadata } from "next";
import { Shield, CheckCircle, ArrowRight, Clock, Award, Zap } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/guarantee" },
  title: "60-Day Results Guarantee",
  description:
    "We guarantee measurable results within 60 days or your money back. Zero risk, maximum upside for your business.",
  openGraph: {
    title: "60-Day Money-Back Guarantee | Sovereign AI",
    description:
      "Measurable results within 60 days or your money back. Zero risk, maximum upside.",
    url: "/guarantee",
  },
  twitter: {
    card: "summary_large_image",
    title: "60-Day Money-Back Guarantee | Sovereign AI",
    description:
      "We guarantee measurable results within 60 days or your money back. Zero risk, maximum upside.",
  },
};

const guarantees = [
  {
    icon: Zap,
    title: "Measurable Lead Increase",
    description:
      "We guarantee a minimum 3x increase in qualified leads within 60 days of activation, or we refund your investment.",
  },
  {
    icon: Award,
    title: "Review Growth",
    description:
      "Your Google review count will grow by at least 30 new reviews in 60 days with our review management system.",
  },
  {
    icon: Clock,
    title: "48-Hour Deployment",
    description:
      "All your AI systems will be configured, tested, and live within 48 hours of onboarding — guaranteed.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Sign Up & Onboard",
    description: "Complete our 20-minute onboarding. Your AI systems go live within 48 hours.",
  },
  {
    step: "2",
    title: "Track Your Results",
    description: "Monitor leads, reviews, and ROI in your real-time dashboard every day.",
  },
  {
    step: "3",
    title: "See Results or Get Refunded",
    description:
      "If you don't see measurable improvement by day 60, contact us for a full refund. No questions asked.",
  },
];

const qualifications = [
  "Active subscription for at least 60 consecutive days",
  "Completed onboarding and provided required business information",
  "AI systems running without manual pauses during the guarantee period",
  "Business operates in a supported vertical (home services)",
];

const faqs = [
  {
    q: "What counts as 'measurable results'?",
    a: "We track leads captured, appointments booked, reviews received, and overall pipeline value. A 3x improvement in any of these metrics qualifies.",
  },
  {
    q: "How do I request a refund?",
    a: "Email support@trysovereignai.com or submit a ticket in your dashboard. We process refunds within 5 business days.",
  },
  {
    q: "Is there a limit on the refund?",
    a: "We refund your full subscription amount for the guarantee period (up to 60 days of payments).",
  },
  {
    q: "Do I need to cancel to get the refund?",
    a: "No — you can request a refund and continue using the service if you'd like. We believe in earning your business.",
  },
];

export default function GuaranteePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Guarantee", url: "/guarantee" },
        ]}
      />
      <Header />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-accent">
                  <Shield className="h-4 w-4" />
                  Zero Risk Guarantee
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <GradientText>60-Day Results</GradientText> Guarantee
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  We&apos;re so confident in our AI marketing systems that we guarantee
                  measurable results within 60 days — or you get a full refund. No
                  questions asked, no fine print.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* What We Guarantee */}
        <Section className="bg-muted/30">
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                What We <GradientText>Guarantee</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
              {guarantees.map((g, i) => (
                <FadeInView key={g.title} delay={i * 0.1}>
                  <div className="rounded-xl border border-border/50 bg-card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <g.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">{g.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* How It Works */}
        <Section>
          <Container size="md">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                How It <GradientText>Works</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 max-w-2xl space-y-8">
              {howItWorks.map((step, i) => (
                <FadeInView key={step.step} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-bg text-sm font-bold text-white">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Qualifications */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                What <GradientText>Qualifies</GradientText>
              </h2>
              <div className="mx-auto mt-8 max-w-xl space-y-3">
                {qualifications.map((q) => (
                  <div key={q} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-muted-foreground">{q}</p>
                  </div>
                ))}
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* FAQ */}
        <Section>
          <Container size="md">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Guarantee <GradientText>FAQ</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-10 max-w-2xl space-y-6">
              {faqs.map((faq, i) => (
                <FadeInView key={faq.q} delay={i * 0.05}>
                  <div className="rounded-lg border border-border/50 bg-card p-5">
                    <h3 className="font-semibold">{faq.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Ready to Start <GradientText>Risk-Free?</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  500+ service businesses are growing with guaranteed AI marketing.
                  Your 48-hour setup starts with a free audit &mdash; see exactly how
                  many leads you&apos;re missing before you spend a dollar.
                </p>
                <Link href="/free-audit" className="mt-8 inline-block">
                  <GradientButton size="lg" className="btn-shine">
                    Get Your Free AI Audit
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  60 seconds. No credit card. No obligation.
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
