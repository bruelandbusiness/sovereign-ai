import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  CreditCard,
  Wrench,
  Code2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { PageTransition } from "@/components/shared/PageTransition";
import { CategoryFAQ } from "./CategoryFAQ";

export const revalidate = 3600;

interface Article {
  title: string;
  summary: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface CategoryData {
  title: string;
  description: string;
  icon: React.ElementType;
  articles: Article[];
  faqs: FAQItem[];
}

const CATEGORIES: Record<string, CategoryData> = {
  "getting-started": {
    title: "Getting Started",
    description:
      "Everything you need to set up your account and launch your first AI marketing campaign.",
    icon: Rocket,
    articles: [
      {
        title: "How to complete onboarding",
        summary:
          "Walk through the 20-minute onboarding process step by step, from business details to service area configuration.",
      },
      {
        title: "Connecting your Google Business Profile",
        summary:
          "Link your GBP to Sovereign AI so our systems can manage reviews, optimize your listing, and track local rankings.",
      },
      {
        title: "Understanding your dashboard",
        summary:
          "A tour of the main dashboard sections including KPIs, lead pipeline, service status, and performance charts.",
      },
      {
        title: "Setting up your first campaign",
        summary:
          "Choose your target services, set your budget, and let the AI build and launch your first marketing campaign.",
      },
      {
        title: "Adding your service areas",
        summary:
          "Define the zip codes, cities, and radius where you want to generate leads for maximum local coverage.",
      },
      {
        title: "Inviting team members to your account",
        summary:
          "Add technicians, office staff, or partners to your dashboard with role-based permissions.",
      },
      {
        title: "Setting up notifications",
        summary:
          "Configure email, SMS, and push notifications so you never miss a new lead or important alert.",
      },
      {
        title: "Mobile app quick-start guide",
        summary:
          "Install the Sovereign AI progressive web app on your phone for on-the-go lead management.",
      },
    ],
    faqs: [
      {
        question: "How long does onboarding take?",
        answer:
          "The onboarding questionnaire takes about 20 minutes. After you submit it, our AI systems deploy within 48 hours. You will receive an email when everything is live and ready to go.",
      },
      {
        question: "Do I need to connect my Google account?",
        answer:
          "Connecting your Google Business Profile is highly recommended but not required. It allows us to manage your reviews, optimize your listing for local search, and track your rankings automatically. Without it, those specific services will be limited.",
      },
      {
        question: "Can I change my service areas later?",
        answer:
          "Yes. You can update your service areas at any time from Dashboard > Settings > Service Areas. Changes take effect within 24 hours as our AI adjusts your targeting.",
      },
      {
        question: "What information do I need for onboarding?",
        answer:
          "You will need your business name, address, phone number, service list, service area, and access to your Google Business Profile. Having your logo and some job photos ready helps us create better content faster.",
      },
      {
        question: "How do I know when my services are active?",
        answer:
          "Each service shows a status indicator on your dashboard — green for active, yellow for deploying, and gray for inactive. You will also receive an email notification when each service goes live.",
      },
    ],
  },
  billing: {
    title: "Billing & Payments",
    description:
      "Manage your subscription, payment methods, invoices, and understand how pricing works.",
    icon: CreditCard,
    articles: [
      {
        title: "How billing works",
        summary:
          "Understand the billing cycle, when charges occur, and how prorated charges work when changing plans.",
      },
      {
        title: "Updating your payment method",
        summary:
          "Add or change your credit card, debit card, or ACH payment method from your account settings.",
      },
      {
        title: "Downloading invoices",
        summary:
          "Access and download PDF invoices for any billing period from your billing dashboard.",
      },
      {
        title: "Changing your plan",
        summary:
          "Upgrade, downgrade, or switch between bundles. Learn how prorated credits and charges work.",
      },
      {
        title: "Cancellation and refund policy",
        summary:
          "How to cancel your subscription and details about our 60-day money-back guarantee.",
      },
      {
        title: "Understanding your invoice line items",
        summary:
          "A breakdown of what each charge on your invoice represents, from base services to add-ons.",
      },
    ],
    faqs: [
      {
        question: "When am I charged?",
        answer:
          "You are billed on the same date each month based on when you first subscribed. For example, if you signed up on March 15th, you will be charged on the 15th of each following month. Annual plans are billed once per year.",
      },
      {
        question: "Can I switch plans mid-cycle?",
        answer:
          "Yes. If you upgrade, you will be charged a prorated amount for the remainder of your current cycle. If you downgrade, the credit is applied to your next invoice. Changes take effect immediately.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "We offer a 60-day money-back guarantee for new customers. If you are not satisfied within your first 60 days, contact support for a full refund. After 60 days, we do not offer refunds for partial months, but you can cancel anytime.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) as well as ACH bank transfers. All payments are processed securely through Stripe.",
      },
      {
        question: "Is there a setup fee?",
        answer:
          "No. There are no setup fees, onboarding fees, or hidden charges. The price you see on our pricing page is the total monthly cost. We believe in transparent, straightforward pricing.",
      },
    ],
  },
  services: {
    title: "Services & Features",
    description:
      "Learn how to configure and get the most out of each AI marketing service.",
    icon: Wrench,
    articles: [
      {
        title: "How AI Review Management works",
        summary:
          "Automated review solicitation, response generation, and sentiment analysis for your Google and Yelp profiles.",
      },
      {
        title: "Setting up AI Voice Agent",
        summary:
          "Configure your AI receptionist to answer calls, qualify leads, and book appointments 24/7.",
      },
      {
        title: "Configuring email campaigns",
        summary:
          "Set up automated drip campaigns, seasonal promotions, and re-engagement sequences for past customers.",
      },
      {
        title: "Using the CRM and lead tracking",
        summary:
          "Manage your leads pipeline, track conversions, and see which marketing channels drive the most revenue.",
      },
      {
        title: "Social media automation setup",
        summary:
          "Connect your Facebook, Instagram, and other social profiles for AI-generated posts and engagement.",
      },
      {
        title: "SEO and local search optimization",
        summary:
          "How our AI optimizes your website content, meta tags, and local citations to rank higher in search.",
      },
      {
        title: "AI content generation",
        summary:
          "Blog posts, service pages, and landing pages created automatically by AI trained on your industry.",
      },
      {
        title: "Reputation monitoring",
        summary:
          "Track your online reputation across 50+ review sites with real-time alerts and trend analysis.",
      },
      {
        title: "Ad campaign management",
        summary:
          "AI-managed Google Ads and Facebook Ads with automated bidding, creative testing, and budget optimization.",
      },
      {
        title: "Referral program setup",
        summary:
          "Launch a customer referral program with automated tracking, rewards, and follow-up emails.",
      },
      {
        title: "Chat widget and lead capture",
        summary:
          "Install our AI chat widget on your website to capture leads and answer customer questions 24/7.",
      },
      {
        title: "Autopilot mode explained",
        summary:
          "Let the AI run your entire marketing operation with minimal input. Understand what autopilot does and does not do.",
      },
    ],
    faqs: [
      {
        question: "Can I turn individual services on and off?",
        answer:
          "Yes. From your dashboard, go to Services and toggle any service on or off. Disabled services stop immediately but your data is preserved. Some bundle pricing requires a minimum number of active services.",
      },
      {
        question: "How does the AI Voice Agent handle calls?",
        answer:
          "The AI Voice Agent answers calls using a natural-sounding voice trained on thousands of home service conversations. It can answer common questions, qualify leads by asking about project details and budget, and book appointments directly into your calendar. Calls that need a human are transferred to your team.",
      },
      {
        question: "Will AI-generated content sound generic?",
        answer:
          "No. During onboarding, we learn your brand voice, service specialties, and local market. The AI generates content tailored to your business including local references, seasonal relevance, and industry-specific terminology. You can enable content approval mode to review everything before it publishes.",
      },
      {
        question: "How accurate is the lead attribution?",
        answer:
          "Our attribution system tracks leads across all channels — Google search, social media, email, reviews, direct calls, and website forms. We use UTM parameters, call tracking numbers, and cookie-based attribution to give you an accurate picture of which services are driving leads and revenue.",
      },
      {
        question: "What happens to my reviews if I cancel?",
        answer:
          "All reviews that were collected and responded to during your subscription remain on Google, Yelp, and other platforms. They are your reviews and stay on your profiles permanently. You will lose the automated review solicitation and AI response features.",
      },
    ],
  },
  api: {
    title: "API & Integrations",
    description:
      "Connect Sovereign AI with your existing tools using our REST API, webhooks, and native integrations.",
    icon: Code2,
    articles: [
      {
        title: "API authentication and keys",
        summary:
          "Generate API keys, understand authentication methods, and set proper scopes for your integration.",
      },
      {
        title: "Webhook setup guide",
        summary:
          "Configure webhooks to receive real-time notifications when leads arrive, reviews post, or campaigns update.",
      },
      {
        title: "Connecting to Zapier",
        summary:
          "Use our Zapier integration to connect Sovereign AI with 5,000+ apps without writing code.",
      },
      {
        title: "CRM integration guide",
        summary:
          "Sync leads bidirectionally with ServiceTitan, Housecall Pro, Jobber, or other field service management tools.",
      },
      {
        title: "Custom reporting via API",
        summary:
          "Pull performance data, lead details, and campaign metrics into your own reporting tools.",
      },
    ],
    faqs: [
      {
        question: "Is there a rate limit on the API?",
        answer:
          "Yes. The default rate limit is 100 requests per minute per API key. If you need higher throughput for bulk operations, contact support and we can increase your limit. Rate limit headers are included in every API response.",
      },
      {
        question: "Which CRMs do you integrate with natively?",
        answer:
          "We have native integrations with ServiceTitan, Housecall Pro, Jobber, FieldEdge, and Service Fusion. For other CRMs, you can use our REST API, Zapier integration, or webhook-based sync to connect any platform.",
      },
      {
        question: "Can I send leads to multiple systems?",
        answer:
          "Yes. You can configure multiple webhook endpoints and CRM integrations simultaneously. Each new lead can be sent to your CRM, your email, a Slack channel, and any other system you configure — all in real time.",
      },
      {
        question: "Is the API available on all plans?",
        answer:
          "API access is included on Growth and Enterprise plans. Starter plan customers can access basic webhook functionality. Contact sales if you need full API access on a Starter plan.",
      },
      {
        question: "Where can I find the API documentation?",
        answer:
          "Full API documentation including endpoint references, code examples, and SDKs is available at trysovereignai.com/api. You can also access interactive API docs from Dashboard > Settings > Integrations.",
      },
    ],
  },
  troubleshooting: {
    title: "Troubleshooting",
    description:
      "Fix common issues with your dashboard, lead tracking, integrations, and service delivery.",
    icon: AlertTriangle,
    articles: [
      {
        title: "Leads not showing in dashboard",
        summary:
          "Diagnose why new leads may not be appearing, from tracking code issues to filter settings.",
      },
      {
        title: "Google Business Profile sync issues",
        summary:
          "Fix connection problems between your GBP and Sovereign AI, including re-authentication steps.",
      },
      {
        title: "Email deliverability problems",
        summary:
          "Troubleshoot emails landing in spam, low open rates, and domain authentication issues.",
      },
      {
        title: "Dashboard loading slowly",
        summary:
          "Steps to improve dashboard performance including clearing cache, checking browser compatibility, and more.",
      },
      {
        title: "Resetting your password",
        summary:
          "How to reset your password if you have forgotten it, or change it from your account settings.",
      },
      {
        title: "Webhook delivery failures",
        summary:
          "Debug failed webhook deliveries including checking endpoints, reviewing error logs, and retry settings.",
      },
      {
        title: "Phone number not connecting to AI Voice",
        summary:
          "Verify your phone forwarding setup and troubleshoot common call routing issues with the AI Voice Agent.",
      },
    ],
    faqs: [
      {
        question: "My leads are not showing up. What should I check?",
        answer:
          "First, verify your tracking code is installed correctly on your website (Dashboard > Settings > Tracking). Next, check your lead filters in the CRM view — you may have date or status filters hiding new leads. If using an integration, confirm the connection is active under Settings > Integrations. If none of these resolve it, contact support with your account ID.",
      },
      {
        question: "Why are my emails going to spam?",
        answer:
          "This is usually a domain authentication issue. Go to Dashboard > Settings > Email and verify that your SPF, DKIM, and DMARC records are properly configured. Our setup wizard will guide you through adding the correct DNS records. If you completed setup recently, allow 24 to 48 hours for DNS propagation.",
      },
      {
        question: "The dashboard is very slow. How do I fix it?",
        answer:
          "Try clearing your browser cache and cookies first. Sovereign AI works best on Chrome, Firefox, or Edge. If you have a large amount of data, try adjusting the date range filter to show a shorter period. If the problem persists, check our status page at status.trysovereignai.com for any ongoing issues.",
      },
      {
        question: "My Google Business Profile disconnected. How do I reconnect?",
        answer:
          "Go to Dashboard > Settings > Integrations > Google Business Profile and click Reconnect. You will be prompted to sign into your Google account and re-authorize access. This can happen when Google requires periodic re-authentication or if you changed your Google password.",
      },
      {
        question: "I am not receiving webhook notifications. What is wrong?",
        answer:
          "Check Dashboard > Webhooks for delivery logs. Common issues include incorrect endpoint URLs, SSL certificate problems, or your server returning error status codes. Ensure your endpoint responds with a 200 status code within 10 seconds. We retry failed deliveries 3 times with exponential backoff.",
      },
    ],
  },
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const data = CATEGORIES[category];

  if (!data) {
    return { title: "Category Not Found" };
  }

  return {
    alternates: { canonical: `/help/${category}` },
    title: `${data.title} — Help Center`,
    description: data.description,
    openGraph: {
      title: `${data.title} — Sovereign AI Help Center`,
      description: data.description,
      url: `/help/${category}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.title} — Sovereign AI Help Center`,
      description: data.description,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export default async function HelpCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const data = CATEGORIES[category];

  if (!data) {
    notFound();
  }

  const Icon = data.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Help Center", url: "/help" },
          { name: data.title, url: `/help/${category}` },
        ]}
      />
      <Header />
      <PageTransition>
        <main id="main-content" className="flex-1">
          {/* Header */}
          <Section className="pb-8 sm:pb-10 lg:pb-12">
            <Container>
              <FadeInView>
                <Link
                  href="/help"
                  className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Help Center
                </Link>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      {data.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                      {data.description}
                    </p>
                  </div>
                </div>
              </FadeInView>
            </Container>
          </Section>

          {/* Articles */}
          <Section className="pt-0 sm:pt-0 lg:pt-0">
            <Container>
              <div className="mx-auto max-w-3xl">
                <FadeInView>
                  <h2 className="mb-4 text-lg font-semibold">Articles</h2>
                </FadeInView>
                <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06]">
                  {data.articles.map((article) => (
                    <FadeInView key={article.title}>
                      <div className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {article.summary}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                    </FadeInView>
                  ))}
                </div>
              </div>
            </Container>
          </Section>

          {/* Category FAQ */}
          <Section>
            <Container>
              <div className="mx-auto max-w-3xl">
                <FadeInView>
                  <h2 className="mb-4 text-lg font-semibold">
                    Common Questions
                  </h2>
                </FadeInView>
                <FadeInView>
                  <CategoryFAQ items={data.faqs} />
                </FadeInView>
              </div>
            </Container>
          </Section>

          {/* Contact CTA */}
          <Section>
            <Container>
              <FadeInView>
                <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center sm:p-8">
                  <p className="text-sm text-muted-foreground">
                    Did not find what you were looking for?
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <Mail className="h-4 w-4" />
                    Contact Support
                  </Link>
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
