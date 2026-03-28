import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, X, Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { JsonLd } from "@/components/shared/JsonLd";
import { COMPETITORS } from "@/lib/comparisons";

export const metadata: Metadata = {
  alternates: { canonical: "/vs" },
  title: "Home Service Marketing Platform Comparisons — Sovereign AI Alternatives (2026)",
  description:
    "Compare Sovereign AI vs Scorpion, Thryv, Vendasta, GoHighLevel, Podium, Birdeye, ServiceTitan, Jobber, and Housecall Pro. Side-by-side pricing, features, and real contractor reviews.",
  keywords: [
    "home service marketing comparison",
    "contractor marketing platform comparison",
    "Scorpion alternative",
    "Thryv alternative",
    "Vendasta alternative",
    "GoHighLevel alternative",
    "Podium alternative",
    "Birdeye alternative",
    "ServiceTitan alternative",
    "Jobber alternative",
    "Housecall Pro alternative",
    "best marketing platform for contractors",
    "home service marketing software",
    "contractor lead generation comparison",
  ],
  openGraph: {
    title: "Home Service Marketing Comparisons | Sovereign AI",
    description:
      "Compare Sovereign AI vs Scorpion, Thryv, Vendasta, GoHighLevel, Podium, Birdeye, ServiceTitan, Jobber, and Housecall Pro. Side-by-side pricing, features, and real reviews from home service pros.",
    url: "/vs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Home Service Marketing Comparisons | Sovereign AI",
    description:
      "Compare Sovereign AI vs Scorpion, Thryv, Vendasta, GoHighLevel, Podium, Birdeye, ServiceTitan, Jobber, and Housecall Pro for home service marketing.",
  },
};

/** Key differentiator features shown in the summary table */
const SUMMARY_FEATURES = [
  "AI Lead Generation",
  "AI Voice Agents",
  "Done-For-You Service",
  "No Long-Term Contract",
  "48-Hour Setup",
  "Money-Back Guarantee",
] as const;

export default function ComparisonIndexPage() {
  const baseUrl = "https://www.trysovereignai.com";

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Comparisons", url: "/vs" },
        ]}
      />
      {/* ItemList structured data for search results */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Home Service Marketing Platform Comparisons",
          description:
            "Compare Sovereign AI against leading home service marketing platforms.",
          numberOfItems: COMPETITORS.length,
          itemListElement: COMPETITORS.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `Sovereign AI vs ${c.name}`,
            url: `${baseUrl}/vs/${c.slug}`,
          })),
        }}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  Trusted by 127+ Home Service Businesses
                </p>
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Home Service Marketing{" "}
                  <GradientText>Platform Comparisons</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Compare Sovereign AI against Scorpion, Thryv, Vendasta,
                  GoHighLevel, Podium, Birdeye, ServiceTitan, Jobber, and
                  Housecall Pro. See why contractors are switching to AI-powered
                  marketing that delivers 3-5x more leads, deploys in 48 hours,
                  and costs less than a single marketing hire.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Competitor cards */}
        <Section className="bg-muted/30">
          <Container size="md">
            <FadeInView>
              <h2 className="mb-6 text-center font-display text-2xl font-bold">
                Choose a Competitor to Compare
              </h2>
            </FadeInView>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {COMPETITORS.map((competitor, i) => (
                <FadeInView key={competitor.slug} delay={i * 0.05}>
                  <Link href={`/vs/${competitor.slug}`}>
                    <div className="flex h-full flex-col rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                      <h3 className="text-lg font-semibold">
                        Sovereign AI vs {competitor.name}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">
                        {competitor.tagline}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {competitor.priceRange}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-medium text-primary">
                          Compare
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Summary comparison table */}
        <Section>
          <Container>
            <FadeInView>
              <h2 className="mb-2 text-center font-display text-3xl font-bold">
                At-a-Glance:{" "}
                <GradientText>Sovereign AI vs Everyone</GradientText>
              </h2>
              <p className="mb-8 text-center text-sm text-muted-foreground">
                Key differentiators across all platforms
              </p>
            </FadeInView>
            <FadeInView delay={0.1}>
              <div
                className="mx-auto max-w-5xl overflow-x-auto rounded-xl border border-border/50 bg-card [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
                role="region"
                aria-label="Summary comparison table"
                tabIndex={0}
              >
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th
                        scope="col"
                        className="sticky left-0 z-10 bg-card px-4 py-4 text-left font-medium text-muted-foreground"
                      >
                        Feature
                      </th>
                      <th scope="col" className="px-3 py-4 text-center font-semibold">
                        <span className="gradient-text">Sovereign AI</span>
                      </th>
                      {COMPETITORS.map((c) => (
                        <th
                          key={c.slug}
                          scope="col"
                          className="px-3 py-4 text-center font-medium text-muted-foreground"
                        >
                          <Link
                            href={`/vs/${c.slug}`}
                            className="hover:text-foreground transition-colors"
                          >
                            {c.name}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SUMMARY_FEATURES.map((featureName) => (
                      <tr
                        key={featureName}
                        className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium">
                          {featureName}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-[#22d3a1]/10 p-1">
                            <Check className="h-4 w-4 text-[#22d3a1]" aria-label="Yes" />
                          </span>
                        </td>
                        {COMPETITORS.map((c) => {
                          const feature = c.features.find(
                            (f) => f.name === featureName,
                          );
                          const val = feature?.competitor;
                          if (val === true) {
                            return (
                              <td key={c.slug} className="px-3 py-3 text-center">
                                <span className="inline-flex items-center justify-center rounded-full p-1">
                                  <Check className="h-4 w-4 text-[#22d3a1]" aria-label="Yes" />
                                </span>
                              </td>
                            );
                          }
                          if (val === false || val === undefined) {
                            return (
                              <td key={c.slug} className="px-3 py-3 text-center">
                                <span className="inline-flex items-center justify-center rounded-full bg-red-400/5 p-1">
                                  <X className="h-4 w-4 text-red-400/50" aria-label="No" />
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td
                              key={c.slug}
                              className="px-3 py-3 text-center text-xs text-muted-foreground"
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Pricing row */}
                    <tr className="bg-white/[0.02]">
                      <td className="sticky left-0 z-10 bg-card px-4 py-3 font-semibold">
                        Pricing
                      </td>
                      <td className="px-3 py-3 text-center font-semibold gradient-text text-xs">
                        From $3,497/mo
                      </td>
                      {COMPETITORS.map((c) => (
                        <td
                          key={c.slug}
                          className="px-3 py-3 text-center text-xs text-muted-foreground"
                        >
                          {c.priceRange}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* CTA */}
        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  Ready to Stop Overpaying for Underperforming Marketing?
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Get a free AI audit that shows exactly how many leads you&apos;re missing
                  and what Sovereign AI would deliver for your specific market.
                </p>
                <div className="mt-6">
                  <Link
                    href="/free-audit"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Get Your Free AI Audit
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-3 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <p>60-second audit. No credit card. No commitment.</p>
                  <p className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-[#f59e0b] text-[#f59e0b]" aria-hidden="true" />
                    4.9/5 from 127+ home service businesses
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
