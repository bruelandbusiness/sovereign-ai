import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { ComparisonTable } from "@/components/vs/ComparisonTable";
import { COMPETITORS, getCompetitorBySlug } from "@/lib/comparisons";

export async function generateStaticParams() {
  return COMPETITORS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await params;
  const data = getCompetitorBySlug(competitor);
  if (!data) return { title: "Comparison Not Found" };
  return {
    title: `Sovereign AI vs ${data.name} | Sovereign AI`,
    description: data.tagline,
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const data = getCompetitorBySlug(competitor);
  if (!data) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Sovereign AI vs <GradientText>{data.name}</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  {data.tagline}
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Description */}
        <Section className="bg-muted/30 py-12">
          <Container size="md">
            <FadeInView>
              <p className="mx-auto max-w-2xl text-center text-muted-foreground">
                {data.description}
              </p>
            </FadeInView>
          </Container>
        </Section>

        {/* Comparison Table */}
        <Section>
          <Container>
            <FadeInView>
              <h2 className="mb-8 text-center font-display text-3xl font-bold">
                Feature <GradientText>Comparison</GradientText>
              </h2>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div className="mx-auto max-w-3xl rounded-xl border border-border/50 bg-card p-6">
                <ComparisonTable competitor={data} />
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Key Advantages */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="mb-8 text-center font-display text-3xl font-bold">
                Why Businesses Choose{" "}
                <GradientText>Sovereign AI</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto max-w-2xl space-y-4">
              {data.advantages.map((advantage, i) => (
                <FadeInView key={advantage} delay={i * 0.05}>
                  <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm">{advantage}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <Section>
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Ready to <GradientText>Switch?</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  See the difference AI-first marketing makes with a free audit.
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
