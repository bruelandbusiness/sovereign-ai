import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { CaseStudyCard } from "@/components/results/CaseStudyCard";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { CASE_STUDIES } from "@/lib/case-studies";

export const metadata: Metadata = {
  alternates: { canonical: "/case-studies" },
  title: "Case Studies",
  description:
    "See how home service businesses generate 3-10x more leads with Sovereign AI. Real results from plumbers, HVAC companies, roofers, and more.",
  openGraph: {
    title: "Case Studies: Real Results from Real Businesses | Sovereign AI",
    description:
      "From 6 leads to 52 in 45 days. From $0 to $340K/month in one season. See how home service contractors are transforming their businesses with AI.",
    url: "/case-studies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies | Sovereign AI",
    description:
      "From 6 to 52 leads in 45 days. Real results from real home service businesses using AI marketing.",
  },
};

export default function CaseStudiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Case Studies", url: "/case-studies" },
        ]}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Real Results. <GradientText>Real Businesses.</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  See how home service companies are transforming their businesses
                  with AI-powered marketing — and what those results could look
                  like for you.
                </p>
              </div>
            </FadeInView>

            {/* Aggregate proof bar */}
            <FadeInView delay={0.1}>
              <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
                {[
                  { stat: "8x", label: "Average lead growth" },
                  { stat: "83%", label: "Reduction in cost per lead" },
                  { stat: "90 days", label: "Average time to results" },
                ].map(({ stat, label }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border/50 bg-card p-6 text-center"
                  >
                    <p className="font-display text-3xl font-bold text-primary">
                      {stat}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </FadeInView>

            {CASE_STUDIES.length > 0 ? (
              <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
                {CASE_STUDIES.map((study, i) => (
                  <FadeInView key={study.slug} delay={i * 0.08}>
                    <CaseStudyCard study={study} />
                  </FadeInView>
                ))}
              </div>
            ) : (
              <FadeInView delay={0.1}>
                <div className="mx-auto mt-14 max-w-lg rounded-2xl border border-border/50 bg-card p-10 text-center">
                  <p className="font-display text-xl font-bold">
                    Case Studies Coming Soon
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    We&apos;re onboarding our first clients now. Real results from
                    real businesses will appear here as they come in.
                  </p>
                  <Link href="/audit" className="mt-6 inline-block">
                    <GradientButton size="lg" className="btn-shine">
                      Be Our Next Success Story
                      <ArrowRight className="h-4 w-4" />
                    </GradientButton>
                  </Link>
                </div>
              </FadeInView>
            )}
          </Container>
        </Section>

        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Ready to See Your{" "}
                  <GradientText>Growth Potential?</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Start with a free AI marketing audit to see exactly how much
                  growth you&apos;re leaving on the table.
                </p>
                <Link href="/audit" className="mt-8 inline-block">
                  <GradientButton size="lg" className="btn-shine">
                    Get Your Free Audit
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </Link>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
