import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { COMPETITORS } from "@/lib/comparisons";

export const metadata: Metadata = {
  alternates: { canonical: "/vs" },
  title: "Comparisons | Sovereign AI",
  description:
    "See how Sovereign AI compares to Scorpion, Thryv, Vendasta, and other marketing platforms for local service businesses.",
  openGraph: {
    title: "Comparisons | Sovereign AI",
    description:
      "See how Sovereign AI compares to Scorpion, Thryv, Vendasta, and other marketing platforms for local service businesses.",
    url: "/vs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Comparisons | Sovereign AI",
    description:
      "See how Sovereign AI compares to Scorpion, Thryv, Vendasta, and other marketing platforms.",
  },
};

export default function ComparisonIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  How Sovereign AI <GradientText>Compares</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  See why local service businesses are switching to Sovereign AI
                  from legacy marketing platforms.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        <Section className="bg-muted/30">
          <Container size="md">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {COMPETITORS.map((competitor, i) => (
                <FadeInView key={competitor.slug} delay={i * 0.05}>
                  <Link href={`/vs/${competitor.slug}`}>
                    <div className="flex h-full flex-col rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/50">
                      <h2 className="text-lg font-semibold">
                        Sovereign AI vs {competitor.name}
                      </h2>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">
                        {competitor.tagline}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                        View Comparison
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        <Section>
          <Container size="sm">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold">
                Ready to Switch?
              </h2>
              <p className="mt-3 text-muted-foreground">
                See how Sovereign AI compares for your business.
              </p>
              <div className="mt-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Get Your Free Audit
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
