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

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Sovereign AI",
  description:
    "Get answers to common questions about Sovereign AI's marketing services, pricing, results, and more.",
};

const categories = [
  {
    name: "Getting Started",
    faqs: [
      {
        q: "How does Sovereign AI work?",
        a: "You choose a bundle or individual services, complete a 20-minute onboarding, and we deploy your AI marketing systems within 48 hours. From there, our AI works 24/7 generating leads, managing reviews, creating content, and more — all visible in your real-time dashboard.",
      },
      {
        q: "How long does setup take?",
        a: "All services are live within 48 hours of completing onboarding. Most clients see their first AI-generated lead within the first week.",
      },
      {
        q: "Do I need any technical skills?",
        a: "Absolutely not. Sovereign AI is a done-for-you service. We handle everything — setup, configuration, optimization, and management. You just monitor results in your dashboard.",
      },
      {
        q: "What industries do you serve?",
        a: "We specialize in home service businesses: HVAC, plumbing, roofing, electrical, landscaping, and general contracting. Our AI models are specifically trained on these verticals for maximum effectiveness.",
      },
    ],
  },
  {
    name: "Pricing & Billing",
    faqs: [
      {
        q: "How much does Sovereign AI cost?",
        a: "Our Starter bundle starts at $3,497/month. Growth (most popular) is $6,997/month. Empire (all 16 services) is $12,997/month. Individual services range from $497-$5,000/month. Annual plans save you 2 months.",
      },
      {
        q: "Are there long-term contracts?",
        a: "No. All plans are month-to-month. You can cancel anytime with no penalties or hidden fees.",
      },
      {
        q: "Is there a setup fee?",
        a: "No setup fees for any bundle. Individual website builds have a one-time $3,500 setup fee, but it's waived when included in a bundle.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards through Stripe. ACH and wire transfers are available for annual plans.",
      },
    ],
  },
  {
    name: "AI Services",
    faqs: [
      {
        q: "What does the AI Chatbot do?",
        a: "Our AI chatbot is custom-trained on your specific business. It answers customer questions, captures lead information, and books appointments — 24/7. It's embedded on your website with a single line of code.",
      },
      {
        q: "How does AI Lead Generation work?",
        a: "Our AI identifies high-intent prospects in your service area using multiple data sources. It then sends personalized outreach sequences via email and SMS, nurturing leads until they're ready to book.",
      },
      {
        q: "What kind of content does the AI create?",
        a: "The AI Content Engine produces 8 SEO-optimized blog posts per month, plus service pages, social media posts, and email campaigns — all tailored to your business and local market.",
      },
      {
        q: "How does review management work?",
        a: "After each completed job, our system automatically sends review request sequences to your customers. It also monitors and responds to all reviews (positive and negative) with AI-generated, human-like responses.",
      },
    ],
  },
  {
    name: "Results & ROI",
    faqs: [
      {
        q: "What results can I expect?",
        a: "Most clients see a 3-5x increase in leads within the first 60 days. Our average client ROI is 8.7x their monthly investment. Results vary by market and services selected.",
      },
      {
        q: "How quickly will I see results?",
        a: "Most clients see their first AI-generated lead within the first week. Significant lead volume increases typically happen by day 30. Full optimization (SEO rankings, review velocity) takes 60-90 days.",
      },
      {
        q: "What's the money-back guarantee?",
        a: "If you don't see measurable improvement in leads, reviews, or ROI within 60 days, we'll refund your full investment. No questions asked.",
      },
      {
        q: "How do you track ROI?",
        a: "Your dashboard shows real-time metrics: leads captured, appointments booked, reviews received, content published, email engagement, and estimated revenue impact. We calculate ROI based on your average job value.",
      },
    ],
  },
  {
    name: "Technical",
    faqs: [
      {
        q: "Do I need a website?",
        a: "No. Our AI Website Builder can create a high-converting site for you. If you already have a website, our chatbot and tracking can be added with a simple embed code.",
      },
      {
        q: "Will this work with my existing CRM?",
        a: "Our AI CRM works as a standalone system. We also offer integrations with popular CRMs like HubSpot, ServiceTitan, and Housecall Pro via API.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. We use 256-bit encryption, SOC2-compliant infrastructure, and never share your data with third parties. All data is stored in US-based data centers.",
      },
      {
        q: "Can I use this with my Google Business Profile?",
        a: "Absolutely. Our AI SEO and Review Management systems integrate directly with your Google Business Profile to optimize your listing and manage reviews.",
      },
    ],
  },
  {
    name: "Support",
    faqs: [
      {
        q: "What kind of support do you offer?",
        a: "All plans include in-app support tickets, email support, and access to our knowledge base. Growth and Empire plans include priority support with 4-hour response times.",
      },
      {
        q: "Can I talk to a human?",
        a: "Yes! While our AI handles most tasks, you always have access to our human support team. Empire plan clients get a dedicated account manager.",
      },
      {
        q: "What if I want to add or remove services?",
        a: "You can upgrade, downgrade, or modify your services anytime from your dashboard. Changes take effect immediately with prorated billing.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Frequently Asked <GradientText>Questions</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Everything you need to know about Sovereign AI. Can&apos;t find your
                  answer? Contact us anytime.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {categories.map((category, ci) => (
          <Section
            key={category.name}
            className={ci % 2 === 0 ? "" : "bg-muted/30"}
          >
            <Container size="md">
              <FadeInView>
                <h2 className="mb-8 text-center font-display text-2xl font-bold">
                  {category.name}
                </h2>
              </FadeInView>
              <div className="mx-auto max-w-2xl space-y-4">
                {category.faqs.map((faq, i) => (
                  <FadeInView key={faq.q} delay={i * 0.05}>
                    <div className="rounded-lg border border-border/50 bg-card p-5">
                      <h3 className="font-semibold">{faq.q}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  </FadeInView>
                ))}
              </div>
            </Container>
          </Section>
        ))}

        {/* CTA */}
        <Section className="bg-muted/30">
          <Container size="sm">
            <FadeInView>
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold">
                  Still Have <GradientText>Questions?</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Book a free strategy call and we&apos;ll answer everything personally.
                </p>
                <Link href="/audit" className="mt-8 inline-block">
                  <GradientButton size="lg" className="btn-shine">
                    Get Your Free AI Audit
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
