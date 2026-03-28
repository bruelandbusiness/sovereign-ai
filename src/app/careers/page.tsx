import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";

export const metadata: Metadata = {
  alternates: { canonical: "/careers" },
  title: "Careers | Sovereign AI",
  description:
    "Join the Sovereign AI team. We're building the future of AI marketing for home services.",
  openGraph: {
    title: "Careers | Sovereign AI",
    description:
      "Join the Sovereign AI team. We're building the future of AI marketing for home services.",
    url: "https://www.trysovereignai.com/careers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers | Sovereign AI",
    description:
      "Join the Sovereign AI team. We're building the future of AI marketing for home services.",
  },
};

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Join the <GradientText>Team</GradientText>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  We&apos;re building the future of AI marketing for home
                  services. Check back soon for open positions.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* CTA */}
        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold">
                  Interested in working with us?
                </h2>
                <p className="mt-3 text-muted-foreground">
                  We&apos;re always looking for talented people who are
                  passionate about AI and helping local businesses grow. Reach
                  out and tell us about yourself.
                </p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Contact Us
                  <ArrowRight className="h-4 w-4" />
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
