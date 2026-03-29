import { Metadata } from "next";
import Link from "next/link";
import { Mail, BookOpen, HelpCircle, MessageSquare } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { PageTransition } from "@/components/shared/PageTransition";

export const metadata: Metadata = {
  alternates: { canonical: "/support" },
  title: "Support",
  description:
    "Get help with Sovereign AI. Browse our knowledge base, read FAQs, or contact our support team directly.",
  openGraph: {
    title: "Support — Sovereign AI Help Center",
    description:
      "Browse guides, FAQs, and contact our support team. We're here to help you get the most out of Sovereign AI.",
    url: "/support",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support — Sovereign AI Help Center",
    description:
      "Browse guides, FAQs, and contact our support team. We're here to help you get the most out of Sovereign AI.",
  },
};

const supportChannels = [
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description:
      "Browse guides, tutorials, and documentation to get the most out of Sovereign AI.",
    href: "/knowledge",
    label: "Browse Articles",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description:
      "Find quick answers to the most commonly asked questions about our platform.",
    href: "/faq",
    label: "View FAQ",
  },
  {
    icon: MessageSquare,
    title: "Contact Us",
    description:
      "Reach out to our team for personalized help with your account or services.",
    href: "/contact",
    label: "Get in Touch",
  },
  {
    icon: Mail,
    title: "Email Support",
    description:
      "Send us an email directly and we'll get back to you within one business day.",
    href: "mailto:support@trysovereignai.com",
    label: "support@trysovereignai.com",
  },
];

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Support - Sovereign AI",
          description:
            "Get help with Sovereign AI. Browse our knowledge base, read FAQs, or contact our support team directly.",
          url: "https://www.trysovereignai.com/support",
          mainEntity: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "support@trysovereignai.com",
            },
          },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Support", url: "/support" },
        ]}
      />
      <Header />
      <PageTransition>
      <main id="main-content" className="flex-1">
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Need Help?
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  We&apos;re here to help you succeed. Choose the support
                  channel that works best for you.
                </p>
              </div>
            </FadeInView>

            <div className="mx-auto max-w-3xl grid gap-6 sm:grid-cols-2">
              {supportChannels.map((channel) => (
                <FadeInView key={channel.title}>
                  <Link
                    href={channel.href}
                    className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
                  >
                    <channel.icon className="h-8 w-8 text-primary" />
                    <h2 className="text-lg font-semibold">{channel.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {channel.description}
                    </p>
                    <span className="mt-auto text-sm font-medium text-primary group-hover:underline">
                      {channel.label}
                    </span>
                  </Link>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
