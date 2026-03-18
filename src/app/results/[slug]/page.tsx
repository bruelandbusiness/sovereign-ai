import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, Quote } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { CASE_STUDIES, getCaseStudyBySlug } from "@/lib/case-studies";

export async function generateStaticParams() {
  return CASE_STUDIES.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return { title: "Case Study Not Found" };
  return {
    title: `${study.headline} — ${study.business} | Sovereign AI`,
    description: study.excerpt,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <Section>
          <Container size="md">
            <FadeInView>
              <Link
                href="/results"
                className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Case Studies
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                  {study.vertical}
                </span>
                <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
                  {study.bundle} Bundle
                </span>
                <span className="text-xs text-muted-foreground">{study.location}</span>
              </div>

              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                <GradientText>{study.headline}</GradientText>
              </h1>
              <p className="mt-2 text-xl text-muted-foreground">
                {study.business} — {study.location}
              </p>
            </FadeInView>
          </Container>
        </Section>

        {/* Hero Stat */}
        <Section className="bg-muted/30 py-12">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <p className="font-display text-6xl font-bold text-primary">
                  {study.heroStat}
                </p>
                <p className="mt-2 text-lg text-muted-foreground">{study.heroLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Achieved in {study.timeline}
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Before / After */}
        <Section>
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Before & <GradientText>After</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-10 grid max-w-3xl gap-8 md:grid-cols-2">
              <FadeInView delay={0.1}>
                <div className="rounded-xl border border-border/50 bg-card p-6">
                  <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Before Sovereign AI
                  </h3>
                  <div className="space-y-4">
                    {study.before.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeInView>
              <FadeInView delay={0.2}>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
                  <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-primary">
                    After Sovereign AI
                  </h3>
                  <div className="space-y-4">
                    {study.after.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="font-bold text-primary">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeInView>
            </div>
          </Container>
        </Section>

        {/* Services Used */}
        <Section className="bg-muted/30 py-12">
          <Container size="md">
            <FadeInView>
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Services Used
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {study.servicesUsed.map((service) => (
                  <span
                    key={service}
                    className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1.5 text-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-accent" />
                    {service}
                  </span>
                ))}
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Quote */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <Quote className="mx-auto mb-4 h-8 w-8 text-primary/40" />
                <blockquote className="text-xl font-medium italic leading-relaxed">
                  &ldquo;{study.quote}&rdquo;
                </blockquote>
                <p className="mt-4 font-semibold">{study.quoteName}</p>
                <p className="text-sm text-muted-foreground">{study.quoteRole}</p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Story */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                The Full <GradientText>Story</GradientText>
              </h2>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div className="mx-auto mt-8 max-w-2xl space-y-4 text-muted-foreground">
                {study.story.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* CTA */}
        <Section>
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Get Results Like <GradientText>{study.business}</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Start with a free AI audit to see your growth potential.
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
