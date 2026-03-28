import { Metadata } from "next";
import Link from "next/link";
import {
  Flame,
  Droplets,
  Home,
  Zap,
  Trees,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

export const metadata: Metadata = {
  alternates: { canonical: "/free-audit" },
  title: "Free AI Marketing Audit",
  description:
    "Get a free AI-powered marketing audit for your home service business. See exactly where you're losing leads — in 60 seconds.",
  openGraph: {
    title: "Free AI Marketing Audit for Home Service Businesses",
    description:
      "Our AI scans your online presence in 60 seconds and shows you exactly where you're losing leads to competitors.",
    url: "/free-audit",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Marketing Audit | Sovereign AI",
    description:
      "See exactly where you're losing leads — in 60 seconds. Free, no obligation.",
  },
};

const trades = [
  { slug: "plumber", label: "Plumbing", icon: Droplets, color: "bg-blue-500/10 text-blue-500" },
  { slug: "hvac", label: "HVAC", icon: Flame, color: "bg-orange-500/10 text-orange-500" },
  { slug: "roofing", label: "Roofing", icon: Home, color: "bg-emerald-500/10 text-emerald-500" },
  { slug: "electrician", label: "Electrical", icon: Zap, color: "bg-amber-500/10 text-amber-500" },
  { slug: "landscaping", label: "Landscaping", icon: Trees, color: "bg-green-500/10 text-green-500" },
];

export default function FreeAuditIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Free AI Audit", url: "/free-audit" },
        ]}
      />
      <Header variant="minimal" />

      <main id="main-content" className="flex-1">
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  100% Free — No Obligation
                </span>
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Get Your Free <GradientText>AI Marketing Audit</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Our AI scans your online presence in 60 seconds and shows you
                  exactly where you&apos;re losing leads to competitors. Over 2,300
                  contractors have used this audit to find $5,000-$50,000 in missed
                  monthly revenue. Select your trade to get started.
                </p>
              </div>
            </FadeInView>

            <div className="mx-auto mt-6 max-w-xl">
              <CountdownTimer
                label="Free audit offer expires in:"
                hoursFromVisit={48}
                variant="banner"
              />
            </div>

            <div className="mx-auto mt-6 grid max-w-xl gap-3">
              {trades.map((trade, i) => (
                <FadeInView key={trade.slug} delay={i * 0.08}>
                  <Link
                    href={`/free-audit/${trade.slug}`}
                    className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${trade.color}`}
                    >
                      <trade.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-semibold">{trade.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Get your free {trade.label.toLowerCase()} marketing audit
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </FadeInView>
              ))}

              <FadeInView delay={0.5}>
                <Link
                  href="/audit"
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-semibold">Other Home Service</p>
                    <p className="text-xs text-muted-foreground">
                      General marketing audit for any home service business
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </FadeInView>
            </div>

            {/* Objection handling */}
            <FadeInView delay={0.6}>
              <div className="mx-auto mt-8 max-w-xl text-center">
                <p className="text-xs text-muted-foreground">
                  No credit card required. No sales call needed. You&apos;ll get
                  your personalized audit report instantly &mdash; showing your Google
                  ranking gaps, review score vs. competitors, website conversion issues,
                  and exactly how many leads you&apos;re leaving on the table each month.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <Link href="/services" className="hover:text-foreground transition-colors">
                    View All Services
                  </Link>
                  <span className="text-border">|</span>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    See Pricing
                  </Link>
                  <span className="text-border">|</span>
                  <Link href="/strategy-call" className="hover:text-foreground transition-colors">
                    Book a Strategy Call
                  </Link>
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
