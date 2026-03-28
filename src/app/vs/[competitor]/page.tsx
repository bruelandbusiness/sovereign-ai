import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle, Star, Quote, DollarSign } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { JsonLd } from "@/components/shared/JsonLd";
import { ComparisonTable } from "@/components/vs/ComparisonTable";
import { COMPETITORS, getCompetitorBySlug } from "@/lib/comparisons";

/* Revalidate every hour — comparison content is mostly static */
export const revalidate = 3600;

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

  const seoTitle = `${data.name} vs Sovereign AI — Best ${data.name} Alternative for Home Services (2026)`;
  const seoDescription = `Compare ${data.name} vs Sovereign AI side-by-side: pricing, features, and real reviews from contractors who switched. See why home service businesses choose Sovereign AI over ${data.name}.`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: `/vs/${competitor}` },
    keywords: [
      `${data.name} alternative`,
      `${data.name} vs Sovereign AI`,
      `Sovereign AI vs ${data.name}`,
      `${data.name} pricing`,
      `${data.name} reviews`,
      `switch from ${data.name}`,
      `${data.name} for contractors`,
      `${data.name} home service marketing`,
      `best ${data.name} alternative`,
      `${data.name} competitor`,
    ],
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `/vs/${competitor}`,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
    },
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

  const baseUrl = "https://www.trysovereignai.com";

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Comparisons", url: "/vs" },
          { name: `vs ${data.name}`, url: `/vs/${competitor}` },
        ]}
      />
      {/* FAQPage structured data */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }}
      />
      {/* Product structured data for rich results */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Sovereign AI",
          description: `AI-powered marketing platform for home service businesses. Compare vs ${data.name}.`,
          brand: {
            "@type": "Brand",
            name: "Sovereign AI",
          },
          url: `${baseUrl}/vs/${competitor}`,
          offers: {
            "@type": "Offer",
            price: "3497",
            priceCurrency: "USD",
            priceValidUntil: "2026-12-31",
            availability: "https://schema.org/InStock",
            url: `${baseUrl}/pricing`,
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "127",
            bestRating: "5",
          },
        }}
      />
      <Header />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  Rated #1 {data.name} Alternative by Home Service Pros
                </p>
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  <GradientText>{data.name}</GradientText> vs Sovereign AI
                </h1>
                <p className="mt-2 text-base font-medium text-muted-foreground/80">
                  The #1 {data.name} Alternative for Home Service Businesses
                </p>
                <p className="mt-4 text-lg text-muted-foreground">
                  {data.tagline}
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link href="/free-audit">
                    <GradientButton size="lg" className="btn-shine">
                      Get Your Free AI Audit
                      <ArrowRight className="h-4 w-4" />
                    </GradientButton>
                  </Link>
                  <Link
                    href="#comparison"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    See full comparison below
                  </Link>
                </div>
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

        {/* Price Comparison Highlight */}
        <Section>
          <Container size="md">
            <FadeInView>
              <h2 className="mb-8 text-center font-display text-3xl font-bold">
                <GradientText>Price Comparison:</GradientText>{" "}
                True Cost of Ownership
              </h2>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div className="mx-auto max-w-2xl grid gap-4 sm:grid-cols-2">
                {/* Competitor price card */}
                <div className="relative rounded-xl border border-border/50 bg-card p-6 text-center">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-400/10">
                    <DollarSign className="h-5 w-5 text-red-400/70" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    {data.name}
                  </h3>
                  <p className="mt-2 text-2xl font-bold">{data.priceRange}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    + hidden costs, add-ons, contracts
                  </p>
                </div>
                {/* Sovereign price card */}
                <div className="relative rounded-xl border-2 border-[#4c85ff]/30 bg-[#4c85ff]/5 p-6 text-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4c85ff] px-3 py-0.5 text-xs font-semibold text-white">
                    Best Value
                  </div>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#22d3a1]/10">
                    <DollarSign className="h-5 w-5 text-[#22d3a1]" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold">Sovereign AI</h3>
                  <p className="mt-2 text-2xl font-bold gradient-text">
                    {data.sovereignPrice}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    All 16 AI services included. No contracts.
                  </p>
                </div>
              </div>
            </FadeInView>
            <FadeInView delay={0.2}>
              <p className="mx-auto mt-6 max-w-xl text-center text-sm text-muted-foreground/80 italic">
                {data.priceSavingNote}
              </p>
            </FadeInView>
          </Container>
        </Section>

        {/* Comparison Table */}
        <Section className="bg-muted/30" id="comparison">
          <Container>
            <FadeInView>
              <h2 className="mb-8 text-center font-display text-3xl font-bold">
                {data.name} vs Sovereign AI:{" "}
                <GradientText>Feature-by-Feature Comparison</GradientText>
              </h2>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div className="mx-auto max-w-3xl rounded-xl border border-border/50 bg-card p-4 sm:p-6">
                <ComparisonTable competitor={data} />
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Mid-page CTA */}
        <Section>
          <Container size="sm">
            <FadeInView>
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#4c85ff]/10 via-background to-[#22d3a1]/10 p-8 text-center sm:p-10">
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  See How You Compare in{" "}
                  <GradientText>60 Seconds</GradientText>
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Get a personalized audit showing exactly how many leads
                  you&apos;re leaving on the table with {data.name} and what
                  Sovereign AI would deliver for your market.
                </p>
                <Link href="/free-audit" className="mt-6 inline-block">
                  <GradientButton size="lg" className="btn-shine">
                    Get Your Free AI Audit
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  No credit card. No commitment. 60-second audit.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Key Advantages */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="mb-8 text-center font-display text-3xl font-bold">
                Why Businesses Switch from {data.name} to{" "}
                <GradientText>Sovereign AI</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto max-w-2xl space-y-4">
              {data.advantages.map((advantage, i) => (
                <FadeInView key={advantage} delay={i * 0.05}>
                  <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                    <p className="text-sm">{advantage}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Social Proof — Switching Testimonials */}
        {data.switchingTestimonials.length > 0 && (
          <Section>
            <Container size="md">
              <FadeInView>
                <h2 className="mb-8 text-center font-display text-3xl font-bold">
                  Real Contractors Who Switched from{" "}
                  <GradientText>{data.name}</GradientText>
                </h2>
              </FadeInView>
              <div className="mx-auto max-w-2xl space-y-6">
                {data.switchingTestimonials.map((testimonial, i) => (
                  <FadeInView key={testimonial.name} delay={i * 0.1}>
                    <div className="relative rounded-xl border border-border/50 bg-card p-6">
                      <Quote className="absolute right-4 top-4 h-8 w-8 text-muted-foreground/10" aria-hidden="true" />
                      <div className="mb-3 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <blockquote className="text-sm leading-relaxed">
                        &ldquo;{testimonial.quote}&rdquo;
                      </blockquote>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {testimonial.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {testimonial.role}, {testimonial.company} &middot;{" "}
                            {testimonial.tradeType}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#22d3a1]/20 bg-[#22d3a1]/10 px-3 py-1 text-xs font-medium text-[#22d3a1]">
                          {testimonial.metric}
                        </span>
                      </div>
                    </div>
                  </FadeInView>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* FAQ */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="mb-8 text-center font-display text-3xl font-bold">
                {data.name} vs Sovereign AI:{" "}
                <GradientText>Frequently Asked Questions</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto max-w-2xl space-y-4">
              {data.faqs.map((faq, i) => (
                <FadeInView key={faq.question} delay={i * 0.05}>
                  <details className="group rounded-lg border border-border/50 bg-card">
                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold list-none flex items-center justify-between">
                      {faq.question}
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
                    </summary>
                    <p className="px-5 pb-4 text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </details>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Bottom CTA */}
        <Section>
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Ready to Switch from{" "}
                  <GradientText>{data.name}?</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Get a free side-by-side audit showing exactly how Sovereign AI
                  outperforms {data.name} for your business. 60 seconds, zero
                  obligation.
                </p>
                <Link href="/free-audit" className="mt-8 inline-block">
                  <GradientButton size="lg" className="btn-shine">
                    Get Your Free AI Audit
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </Link>
                <div className="mt-4 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <p>No credit card required. 60-day money-back guarantee on all plans.</p>
                  <p className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-[#f59e0b] text-[#f59e0b]" aria-hidden="true" />
                    Rated 4.9/5 by 127+ home service businesses
                  </p>
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
