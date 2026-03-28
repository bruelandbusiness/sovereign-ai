import { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  CreditCard,
  Wrench,
  Code2,
  AlertTriangle,
  Mail,
  Phone,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { PageTransition } from "@/components/shared/PageTransition";
import { HelpSearch } from "./HelpSearch";
import { HelpFAQ } from "./HelpFAQ";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/help" },
  title: "Help Center",
  description:
    "Find answers, guides, and support for Sovereign AI. Browse by category or search our knowledge base to get the help you need.",
  openGraph: {
    title: "Help Center — Sovereign AI",
    description:
      "Browse guides, FAQs, and tutorials. Get help with onboarding, billing, services, API integrations, and troubleshooting.",
    url: "/help",
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Center — Sovereign AI",
    description:
      "Find answers to your questions about Sovereign AI's marketing platform for home service businesses.",
  },
};

const categories = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description:
      "Set up your account, complete onboarding, and launch your first AI marketing campaign.",
    icon: Rocket,
    articleCount: 8,
  },
  {
    slug: "billing",
    title: "Billing & Payments",
    description:
      "Manage your subscription, update payment methods, view invoices, and understand your plan.",
    icon: CreditCard,
    articleCount: 6,
  },
  {
    slug: "services",
    title: "Services & Features",
    description:
      "Learn how to use each of the 16 AI marketing services included in your plan.",
    icon: Wrench,
    articleCount: 12,
  },
  {
    slug: "api",
    title: "API & Integrations",
    description:
      "Connect Sovereign AI to your CRM, website, or other tools with our API and webhooks.",
    icon: Code2,
    articleCount: 5,
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description:
      "Fix common issues with your dashboard, lead tracking, service delivery, and more.",
    icon: AlertTriangle,
    articleCount: 7,
  },
];

export default function HelpCenterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Help Center - Sovereign AI",
          description:
            "Find answers, guides, and support for Sovereign AI's AI-powered marketing platform.",
          url: "https://www.trysovereignai.com/help",
          mainEntity: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
          },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Help Center", url: "/help" },
        ]}
      />
      <Header />
      <PageTransition>
        <main id="main-content" className="flex-1">
          {/* Hero + Search */}
          <Section className="pb-8 sm:pb-10 lg:pb-12">
            <Container>
              <FadeInView>
                <div className="mx-auto max-w-2xl text-center">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    How can we help?
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Search our knowledge base or browse by category to find
                    answers to your questions.
                  </p>
                </div>
              </FadeInView>
              <FadeInView>
                <div className="mx-auto mt-8 max-w-xl">
                  <HelpSearch />
                </div>
              </FadeInView>
            </Container>
          </Section>

          {/* Category Cards */}
          <Section className="pt-0 sm:pt-0 lg:pt-0">
            <Container>
              <div className="mx-auto max-w-4xl grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <FadeInView key={cat.slug}>
                      <Link
                        href={`/help/${cat.slug}`}
                        className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-primary/40 hover:bg-white/[0.04]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">{cat.title}</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {cat.description}
                        </p>
                        <span className="mt-auto text-xs font-medium text-muted-foreground/70">
                          {cat.articleCount} articles
                        </span>
                      </Link>
                    </FadeInView>
                  );
                })}
              </div>
            </Container>
          </Section>

          {/* Popular FAQs */}
          <Section>
            <Container>
              <FadeInView>
                <div className="mx-auto max-w-2xl text-center mb-10">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Quick answers to the most common questions from home service
                    business owners.
                  </p>
                </div>
              </FadeInView>
              <FadeInView>
                <div className="mx-auto max-w-2xl">
                  <HelpFAQ />
                </div>
              </FadeInView>
            </Container>
          </Section>

          {/* Contact Support CTA */}
          <Section>
            <Container>
              <FadeInView>
                <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 text-center sm:p-12">
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    Still need help?
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Our support team is available Monday through Friday, 8 AM to
                    6 PM CT. We typically respond within 4 hours.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <Mail className="h-4 w-4" />
                      Contact Support
                    </Link>
                    <Link
                      href="/strategy-call"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08]"
                    >
                      <Phone className="h-4 w-4" />
                      Schedule a Call
                    </Link>
                  </div>
                </div>
              </FadeInView>
            </Container>
          </Section>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
