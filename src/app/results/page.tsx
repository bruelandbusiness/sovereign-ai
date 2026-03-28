import { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { CaseStudyCard } from "@/components/results/CaseStudyCard";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { CASE_STUDIES } from "@/lib/case-studies";

export const metadata: Metadata = {
  alternates: { canonical: "/results" },
  title: "Case Studies & Results",
  description:
    "Real results from real home service businesses: 3-10x more leads, higher revenue, and better ROI with AI marketing.",
  openGraph: {
    title: "Real Results from Real Businesses | Sovereign AI",
    description:
      "Case studies: how contractors generated 3-10x more leads with AI-powered marketing.",
    url: "/results",
  },
  twitter: {
    card: "summary_large_image",
    title: "Client Results | Sovereign AI",
    description:
      "See how home service businesses generated 3-10x more leads with AI-powered marketing.",
  },
};

export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Case Studies & Results — Sovereign AI",
          description:
            "Real results from real home service businesses: 3-10x more leads, higher revenue, and better ROI with AI marketing.",
          url: "https://www.trysovereignai.com/results",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: CASE_STUDIES.length,
            itemListElement: CASE_STUDIES.map((cs, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${cs.headline} — ${cs.business}`,
              url: `https://www.trysovereignai.com/results/${cs.slug}`,
            })),
          },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Results", url: "/results" },
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
                  with AI-powered marketing.
                </p>
              </div>
            </FadeInView>

            {CASE_STUDIES.length > 0 ? (
              <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
                {CASE_STUDIES.map((study, i) => (
                  <FadeInView key={study.slug} delay={i * 0.1}>
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
                  Ready to See Your <GradientText>Growth Potential?</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Start with a free AI marketing audit to see your growth potential.
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
