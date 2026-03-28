import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { JsonLd } from "@/components/shared/JsonLd";
import { ContactForm } from "@/components/contact/ContactForm";
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact Us | Sovereign AI",
  description:
    "Get in touch with the Sovereign AI team. Submit a contact form, email us, or call. Support for existing clients and questions for prospective customers.",
  openGraph: {
    title: "Contact Us | Sovereign AI",
    description:
      "Get in touch with the Sovereign AI team. Submit a contact form, email us, or call. Support for existing clients and questions for prospective customers.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Sovereign AI",
    description:
      "Reach the Sovereign AI team. Contact form, email, phone. Under 4-hour response time.",
  },
};

const SIDE_INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "support@trysovereignai.com",
    href: "mailto:support@trysovereignai.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "(480) 555-0199",
    href: "tel:+14805550199",
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Mon\u2013Fri, 8 AM \u2013 6 PM AZ (MST)",
    href: null,
  },
  {
    icon: MapPin,
    label: "Office",
    value: "Phoenix, AZ",
    href: null,
  },
] as const;

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/sovereign-ai",
    svg: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    label: "X (Twitter)",
    href: "https://twitter.com/sovereignai",
    svg: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/trysovereignai",
    svg: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Sovereign AI",
          description:
            "Get in touch with the Sovereign AI team for support, sales, partnerships, or general inquiries.",
          url: "https://www.trysovereignai.com/contact",
          mainEntity: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
            email: "support@trysovereignai.com",
            telephone: "+14805550199",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Phoenix",
              addressRegion: "AZ",
              addressCountry: "US",
            },
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "support@trysovereignai.com",
                telephone: "+14805550199",
                availableLanguage: "English",
                areaServed: "US",
              },
              {
                "@type": "ContactPoint",
                contactType: "sales",
                url: "https://www.trysovereignai.com/strategy-call",
                availableLanguage: "English",
                areaServed: "US",
              },
            ],
          },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" },
        ]}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Get in <GradientText>Touch</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Whether you&apos;re a current client or exploring what AI
                  marketing can do for your business, we&apos;re here to help.
                </p>
              </div>
            </FadeInView>

            {/* Two-column: Form + Side Panel */}
            <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-5">
              {/* Contact Form */}
              <div className="lg:col-span-3">
                <FadeInView delay={0.1}>
                  <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold">
                      Send Us a Message
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fill out the form below and we&apos;ll get back to you
                      within 4 hours during business hours.
                    </p>
                    <ContactForm />
                  </div>
                </FadeInView>
              </div>

              {/* Side Panel */}
              <div className="lg:col-span-2">
                <FadeInView delay={0.2}>
                  <div className="space-y-6">
                    {/* Contact details */}
                    <div className="rounded-xl border border-border/50 bg-card p-6">
                      <h2 className="font-display text-lg font-bold">
                        Contact Information
                      </h2>
                      <ul className="mt-4 space-y-4">
                        {SIDE_INFO.map((item) => (
                          <li key={item.label} className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                {item.label}
                              </p>
                              {item.href ? (
                                <a
                                  href={item.href}
                                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                >
                                  {item.value}
                                </a>
                              ) : (
                                <p className="text-sm font-medium text-foreground">
                                  {item.value}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Social Links */}
                    <div className="rounded-xl border border-border/50 bg-card p-6">
                      <h2 className="font-display text-lg font-bold">
                        Follow Us
                      </h2>
                      <div className="mt-3 flex gap-3">
                        {SOCIAL_LINKS.map((social) => (
                          <a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={social.label}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path d={social.svg} />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* FAQ Link */}
                    <Link
                      href="/faq"
                      className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          Check our FAQ for quick answers
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Find answers to common questions about pricing,
                          onboarding, and our AI services.
                        </p>
                      </div>
                    </Link>
                  </div>
                </FadeInView>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
