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
import { CASE_STUDIES } from "@/lib/case-studies";

export const metadata: Metadata = {
  title: "Case Studies & Results | Sovereign AI",
  description:
    "See how home service businesses are generating 3-10x more leads with Sovereign AI. Real results, real businesses.",
};

export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
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

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
              {CASE_STUDIES.map((study, i) => (
                <FadeInView key={study.slug} delay={i * 0.1}>
                  <CaseStudyCard study={study} />
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Ready for Results Like <GradientText>These?</GradientText>
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
