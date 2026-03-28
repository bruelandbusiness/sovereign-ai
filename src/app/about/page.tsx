import { Metadata } from "next";
import Balancer from "react-wrap-balancer";
import { Brain, Zap, Shield, Heart, Target, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { GradientButton } from "@/components/shared/GradientButton";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { PageTransition } from "@/components/shared/PageTransition";

/* Revalidate every hour — content rarely changes */
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About Us",
  description:
    "We give every local service business access to enterprise-grade AI marketing. Meet the founder, our AI stack, and why 500+ contractors trust us.",
  openGraph: {
    title: "About Sovereign AI — Our Mission & Team",
    description:
      "Meet the founder and learn how Sovereign AI is giving every local service business access to enterprise-grade AI marketing.",
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Sovereign AI — Our Mission & Team",
    description:
      "Meet the founder behind the AI marketing platform helping 500+ home service businesses grow revenue.",
  },
};

const values = [
  {
    icon: Target,
    title: "Results First",
    description:
      "Every decision we make is guided by one question: does this get our clients more leads, more revenue, and better ROI?",
  },
  {
    icon: Shield,
    title: "Radical Transparency",
    description:
      "No long-term contracts, no hidden fees, no vanity metrics. You see everything in your real-time dashboard.",
  },
  {
    icon: Zap,
    title: "Speed Matters",
    description:
      "48-hour deployment. Real-time results. We move fast because your business can't wait for a committee to approve a campaign.",
  },
  {
    icon: Heart,
    title: "Client Obsession",
    description:
      "We succeed when you succeed. That's why we offer a 60-day money-back guarantee on every plan.",
  },
];

const aiStack = [
  {
    name: "Natural Language Processing",
    description: "Powers chatbots, review responses, and AI-written content",
  },
  {
    name: "Predictive Analytics",
    description: "Forecasts lead quality, optimal send times, and campaign performance",
  },
  {
    name: "Computer Vision",
    description: "Analyzes competitor websites and generates visual content",
  },
  {
    name: "Reinforcement Learning",
    description: "Continuously optimizes ad spend, bidding, and targeting",
  },
  {
    name: "Voice AI",
    description: "Human-like phone agents that qualify leads and book appointments",
  },
  {
    name: "Recommendation Engine",
    description: "Suggests optimal services and strategies based on your vertical",
  },
];

const founder = {
  name: "Seth Brueland",
  role: "Founder & CEO",
  bio: "Seth built Sovereign AI after watching his father's contracting business lose jobs to competitors with bigger marketing budgets — not better service. That frustration drove him to build 16 AI-powered marketing systems specifically for home service businesses. Today, Sovereign AI has helped 500+ HVAC, plumbing, and roofing companies generate over $12M in new revenue. Seth handles everything from product architecture to client strategy, driven by a belief backed by results: the businesses that keep our homes running deserve technology that actually works for them.",
};

const stats = [
  { value: "500+", label: "Active Clients" },
  { value: "47K+", label: "Leads Generated" },
  { value: "8.7x", label: "Average Client ROI" },
  { value: "$12M+", label: "Client Revenue Generated" },
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sovereign AI",
  url: "https://www.trysovereignai.com",
  logo: {
    "@type": "ImageObject",
    url: "https://www.trysovereignai.com/icon-512.png",
  },
  description:
    "AI-powered marketing automation for HVAC, plumbing, roofing, and home service businesses. 16 AI services that generate leads, book appointments, and grow revenue 24/7.",
  founder: {
    "@type": "Person",
    name: "Seth Brueland",
    jobTitle: "Founder & CEO",
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    value: "10-50",
  },
  sameAs: [
    "https://twitter.com/sovereignai",
    "https://linkedin.com/company/sovereignai",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@trysovereignai.com",
    availableLanguage: "English",
  },
  knowsAbout: [
    "AI Marketing",
    "Home Service Business Marketing",
    "Lead Generation",
    "HVAC Marketing",
    "Plumbing Marketing",
    "Roofing Marketing",
  ],
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd data={organizationJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
        ]}
      />
      <Header />

      <PageTransition>
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <Balancer>
                    We Give Local Businesses{" "}
                    <GradientText>Unfair Advantages</GradientText>
                  </Balancer>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Sovereign AI was built on a simple belief: every local service business
                  deserves access to the same AI-powered marketing that Fortune 500
                  companies use — without the Fortune 500 budget.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Stats */}
        <Section className="bg-muted/30 py-12">
          <Container>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <FadeInView key={stat.label} delay={i * 0.1}>
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Mission */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-3xl font-bold">
                  Our <GradientText>Mission</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Local service businesses are the backbone of every community. Plumbers,
                  HVAC technicians, roofers, electricians — they keep our homes running.
                  But most can&apos;t afford a marketing department, let alone an AI one.
                </p>
                <p className="mt-4 text-muted-foreground">
                  We built Sovereign AI so that a one-person plumbing shop in Atlanta can
                  compete with a 50-person franchise — and win. Our 16 AI systems work
                  24/7, generating leads, managing reviews, creating content, and optimizing
                  campaigns while you focus on what you do best: serving your customers.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* How We're Different */}
        <Section className="bg-muted/30">
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                How We&apos;re <GradientText>Different</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
              {[
                {
                  title: "AI-First, Not AI-Bolted",
                  description:
                    "Every system was built from scratch with AI at the core — not a traditional tool with AI slapped on as a feature.",
                },
                {
                  title: "Home Services Specialized",
                  description:
                    "We only serve home service businesses. Every AI model, template, and strategy is optimized for your industry.",
                },
                {
                  title: "Done For You",
                  description:
                    "We're not a DIY platform. Our AI systems run autonomously. You don't need to learn new software or hire a marketing person.",
                },
                {
                  title: "Results Guaranteed",
                  description:
                    "60-day money-back guarantee. No long-term contracts. We earn your business every month.",
                },
              ].map((item, i) => (
                <FadeInView key={item.title} delay={i * 0.1}>
                  <div className="rounded-xl border border-border/50 bg-card p-6">
                    <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* AI Stack */}
        <Section>
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Our <GradientText>AI Stack</GradientText>
              </h2>
              <p className="mt-4 text-center text-muted-foreground">
                Six core AI technologies power our 16 marketing services.
              </p>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2 lg:grid-cols-3">
              {aiStack.map((tech, i) => (
                <FadeInView key={tech.name} delay={i * 0.05}>
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <h3 className="text-sm font-semibold">{tech.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{tech.description}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Founder */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-3xl font-bold">
                  Meet the <GradientText>Founder</GradientText>
                </h2>
              </div>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border/50 bg-card p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  SB
                </div>
                <h3 className="font-display text-2xl font-semibold">{founder.name}</h3>
                <p className="text-sm font-medium text-primary">{founder.role}</p>
                <p className="mt-4 leading-relaxed text-muted-foreground">{founder.bio}</p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Values */}
        <Section>
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Our <GradientText>Values</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
              {values.map((value, i) => (
                <FadeInView key={value.title} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <value.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{value.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{value.description}</p>
                    </div>
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
                  See What <GradientText>AI Marketing</GradientText> Can Do for Your Business
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Join 500+ contractors who traded agency frustration for AI-powered
                  growth. Get a free audit that shows exactly where you&apos;re losing leads.
                </p>
                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href="/free-audit">
                    <GradientButton size="lg" className="btn-shine">
                      Get Your Free AI Audit
                      <ArrowRight className="h-4 w-4" />
                    </GradientButton>
                  </Link>
                  <Link href="/pricing">
                    <GradientButton variant="outline" size="lg">
                      View Pricing
                      <ArrowRight className="h-4 w-4" />
                    </GradientButton>
                  </Link>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  60-second audit. No credit card. 60-day money-back guarantee on all plans.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <Link href="/services" className="hover:text-foreground transition-colors">
                    Our Services
                  </Link>
                  <span className="text-border">|</span>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                  <span className="text-border">|</span>
                  <Link href="/strategy-call" className="hover:text-foreground transition-colors">
                    Free Strategy Call
                  </Link>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>
      </PageTransition>

      <Footer />
    </div>
  );
}
