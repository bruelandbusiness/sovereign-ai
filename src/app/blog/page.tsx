import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Star, Shield } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { GradientButton } from "@/components/shared/GradientButton";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogListingClient } from "@/components/blog/BlogListingClient";
import { prisma } from "@/lib/db";

/* Revalidate every hour -- blog listing doesn't need real-time data */
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Blog",
  description:
    "AI marketing tips, case studies, and strategies for home service businesses. Learn how to grow your business with AI.",
  openGraph: {
    title: "AI Marketing Blog for Home Service Businesses",
    description:
      "Tips, case studies, and strategies to grow your HVAC, plumbing, or roofing business with AI.",
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Marketing Blog | Sovereign AI",
    description:
      "AI marketing tips, case studies, and strategies for HVAC, plumbing, roofing, and home service businesses.",
  },
};

const SEED_POSTS = [
  {
    slug: "hvac-company-6-to-52-leads-case-study",
    title: "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days",
    excerpt:
      "See exactly how one HVAC company went from 6 leads per month to 52 in just 45 days using AI-powered marketing. Full breakdown of services, timeline, and results.",
    category: "case-study",
    categoryLabel: "Case Study",
    categoryColor: "bg-blue-500/10 text-blue-400",
    date: "Mar 25, 2026",
    readTime: "9 min read",
  },
  {
    slug: "signs-home-service-business-needs-marketing-automation",
    title: "7 Signs Your Home Service Business Needs Marketing Automation",
    excerpt:
      "Missed calls, inconsistent follow-up, and stale reviews are costing you jobs. Here are 7 warning signs your business needs AI marketing automation.",
    category: "marketing-automation",
    categoryLabel: "Marketing Automation",
    categoryColor: "bg-primary/10 text-primary",
    date: "Mar 24, 2026",
    readTime: "10 min read",
  },
  {
    slug: "why-contractor-marketing-agencies-fail",
    title: "Why Most Contractor Marketing Agencies Fail (And What to Do Instead)",
    excerpt:
      "Most marketing agencies serving contractors deliver poor results. Learn the 5 reasons why and discover the AI-powered alternative replacing the traditional model.",
    category: "industry-insights",
    categoryLabel: "Industry Insights",
    categoryColor: "bg-blue-500/10 text-blue-400",
    date: "Mar 22, 2026",
    readTime: "8 min read",
  },
  {
    slug: "roi-ai-review-management-hvac",
    title: "The ROI of AI-Powered Review Management for HVAC Companies",
    excerpt:
      "Online reviews are not just social proof. For HVAC companies, they are a direct revenue driver with measurable ROI that most business owners underestimate.",
    category: "review-management",
    categoryLabel: "Review Management",
    categoryColor: "bg-primary/10 text-primary",
    date: "Mar 21, 2026",
    readTime: "9 min read",
  },
  {
    slug: "50-leads-per-month-plumbing-business",
    title: "How to Get 50+ Leads Per Month for Your Plumbing Business",
    excerpt:
      "Step-by-step guide to generating 50+ qualified plumbing leads every month using AI lead generation, review management, local SEO, and multi-channel marketing.",
    category: "lead-generation",
    categoryLabel: "Lead Generation",
    categoryColor: "bg-primary/10 text-primary",
    date: "Mar 19, 2026",
    readTime: "11 min read",
  },
  {
    slug: "email-marketing-home-service-businesses-guide",
    title: "Email Marketing for Home Service Businesses: The Complete Guide",
    excerpt:
      "Most home service businesses ignore email marketing. The ones that do it right generate 30-40% of their revenue from repeat and referral customers at nearly zero cost.",
    category: "email-marketing",
    categoryLabel: "Email Marketing",
    categoryColor: "bg-blue-500/10 text-blue-400",
    date: "Mar 18, 2026",
    readTime: "10 min read",
  },
  {
    slug: "ai-vs-traditional-marketing-agency-contractors",
    title: "AI vs Traditional Marketing Agency: Which Is Better for Contractors",
    excerpt:
      "The marketing landscape for contractors has changed. An honest comparison across speed, cost, consistency, scalability, and transparency.",
    category: "industry-insights",
    categoryLabel: "Industry Insights",
    categoryColor: "bg-primary/10 text-primary",
    date: "Mar 17, 2026",
    readTime: "10 min read",
  },
  {
    slug: "ai-marketing-cost-home-service-businesses",
    title: "How Much Does AI Marketing Cost for Home Service Businesses in 2026",
    excerpt:
      "Complete breakdown of AI marketing costs for HVAC, plumbing, and roofing companies in 2026. Compare pricing vs traditional agencies and understand the real ROI.",
    category: "ai-marketing",
    categoryLabel: "AI Marketing",
    categoryColor: "bg-primary/10 text-primary",
    date: "Mar 15, 2026",
    readTime: "9 min read",
  },
  {
    slug: "google-business-profile-optimization-contractors",
    title: "Google Business Profile Optimization Guide for Contractors",
    excerpt:
      "Your Google Business Profile is the single most important asset for local lead generation. Step-by-step guide to setting it up for maximum visibility.",
    category: "local-seo",
    categoryLabel: "Local SEO",
    categoryColor: "bg-blue-500/10 text-blue-400",
    date: "Mar 15, 2026",
    readTime: "9 min read",
  },
  {
    slug: "ai-chatbots-booking-appointments-roofers",
    title: "How AI Chatbots Are Booking 3x More Appointments for Roofers",
    excerpt:
      "The average roofing company misses 40% of inbound leads. AI chatbots are closing that gap and tripling appointment bookings in the process.",
    category: "ai-technology",
    categoryLabel: "AI Technology",
    categoryColor: "bg-blue-500/10 text-blue-400",
    date: "Mar 10, 2026",
    readTime: "8 min read",
  },
  {
    slug: "ai-transforming-home-service-marketing-2026",
    title: "5 Ways AI is Transforming Home Service Marketing in 2026",
    excerpt:
      "Discover how AI marketing tools are helping HVAC, plumbing, and roofing companies generate more leads, automate follow-ups, and dominate local search.",
    category: "ai-marketing",
    categoryLabel: "AI Marketing",
    categoryColor: "bg-primary/10 text-primary",
    date: "Mar 10, 2026",
    readTime: "8 min read",
  },
  {
    slug: "hvac-companies-switching-ai-marketing",
    title: "Why HVAC Companies Are Switching to AI Marketing Systems",
    excerpt:
      "Traditional marketing agencies charge $3,000-$8,000/month and deliver inconsistent results. AI marketing systems are changing the math entirely.",
    category: "lead-generation",
    categoryLabel: "Lead Generation",
    categoryColor: "bg-blue-500/10 text-blue-400",
    date: "Feb 24, 2026",
    readTime: "7 min read",
  },
  {
    slug: "google-reviews-guide-home-service-business",
    title:
      "The Complete Guide to Getting More Google Reviews for Your Home Service Business",
    excerpt:
      "Google reviews are the #1 factor in local search rankings. Learn proven strategies to generate 5-star reviews consistently and on autopilot.",
    category: "reviews",
    categoryLabel: "Reviews",
    categoryColor: "bg-amber-500/10 text-amber-400",
    date: "Feb 5, 2026",
    readTime: "10 min read",
  },
  {
    slug: "ai-marketing-cost-home-service-businesses-2026",
    title: "How Much Does AI Marketing Cost for Home Service Businesses in 2026",
    excerpt:
      "Breaking down the real costs of AI marketing for contractors — from starter plans to full-stack solutions — and how to calculate your ROI.",
    category: "pricing",
    categoryLabel: "Pricing",
    categoryColor: "bg-emerald-500/10 text-emerald-400",
    date: "Mar 25, 2026",
    readTime: "9 min read",
  },
  {
    slug: "ai-vs-traditional-marketing-agency-contractors",
    title: "AI vs Traditional Marketing Agency: Which Is Better for Contractors",
    excerpt:
      "A head-to-head comparison of AI marketing systems and traditional agencies across cost, speed, personalization, reporting, and scalability.",
    category: "comparison",
    categoryLabel: "Comparison",
    categoryColor: "bg-violet-500/10 text-violet-400",
    date: "Mar 20, 2026",
    readTime: "10 min read",
  },
  {
    slug: "50-leads-per-month-plumbing-business",
    title: "How to Get 50+ Leads Per Month for Your Plumbing Business",
    excerpt:
      "A six-step playbook for plumbers to generate 50+ qualified leads per month using AI-powered marketing automation.",
    category: "lead-generation",
    categoryLabel: "Lead Generation",
    categoryColor: "bg-blue-500/10 text-blue-400",
    date: "Mar 15, 2026",
    readTime: "8 min read",
  },
  {
    slug: "roi-ai-review-management-hvac",
    title: "The ROI of AI-Powered Review Management for HVAC Companies",
    excerpt:
      "How AI review management drives revenue through more 5-star reviews, better local SEO rankings, and higher conversion rates.",
    category: "reviews",
    categoryLabel: "Reviews",
    categoryColor: "bg-amber-500/10 text-amber-400",
    date: "Mar 12, 2026",
    readTime: "7 min read",
  },
  {
    slug: "signs-home-service-business-needs-marketing-automation",
    title: "7 Signs Your Home Service Business Needs Marketing Automation",
    excerpt:
      "Missed calls, stalled reviews, and unpredictable slow seasons — seven warning signs it's time to automate your marketing.",
    category: "marketing-automation",
    categoryLabel: "Marketing Automation",
    categoryColor: "bg-rose-500/10 text-rose-400",
    date: "Mar 8, 2026",
    readTime: "6 min read",
  },
  {
    slug: "google-business-profile-optimization-contractors",
    title: "Google Business Profile Optimization Guide for Contractors",
    excerpt:
      "An 8-step guide to optimizing your Google Business Profile for maximum visibility, more calls, and higher local search rankings.",
    category: "seo",
    categoryLabel: "SEO",
    categoryColor: "bg-green-500/10 text-green-400",
    date: "Mar 5, 2026",
    readTime: "9 min read",
  },
  {
    slug: "ai-chatbots-booking-appointments-roofers",
    title: "How AI Chatbots Are Booking 3x More Appointments for Roofers",
    excerpt:
      "AI chatbots capture leads 24/7, qualify prospects instantly, and book appointments automatically — here's how roofers are seeing 3x more bookings.",
    category: "ai-chatbots",
    categoryLabel: "AI Chatbots",
    categoryColor: "bg-cyan-500/10 text-cyan-400",
    date: "Mar 1, 2026",
    readTime: "7 min read",
  },
  {
    slug: "email-marketing-home-service-businesses-guide",
    title: "Email Marketing for Home Service Businesses: The Complete Guide",
    excerpt:
      "From list building to automation — everything contractors need to know about email marketing that drives repeat business and referrals.",
    category: "email-marketing",
    categoryLabel: "Email Marketing",
    categoryColor: "bg-orange-500/10 text-orange-400",
    date: "Feb 25, 2026",
    readTime: "11 min read",
  },
  {
    slug: "why-contractor-marketing-agencies-fail",
    title: "Why Most Contractor Marketing Agencies Fail (And What to Do Instead)",
    excerpt:
      "Five common agency failure patterns — cookie-cutter strategies, vanity metrics, and long contracts — and the smarter alternative.",
    category: "industry-insights",
    categoryLabel: "Industry Insights",
    categoryColor: "bg-red-500/10 text-red-400",
    date: "Feb 20, 2026",
    readTime: "8 min read",
  },
  {
    slug: "hvac-case-study-6-to-52-leads",
    title: "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days",
    excerpt:
      "A real case study following an HVAC company from 6 leads/month to 52 in just 45 days using AI marketing — with a 30x ROI.",
    category: "case-study",
    categoryLabel: "Case Study",
    categoryColor: "bg-teal-500/10 text-teal-400",
    date: "Feb 15, 2026",
    readTime: "6 min read",
  },
];

export default async function BlogPage() {
  let posts: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: string;
    publishedAt: Date;
  }[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
  } catch {
    // Database may not be available; fall through to seed posts
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Sovereign AI Blog",
          description:
            "AI marketing tips, case studies, and strategies for home service businesses.",
          url: "https://www.trysovereignai.com/blog",
          publisher: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
            logo: {
              "@type": "ImageObject",
              url: "https://www.trysovereignai.com/icon-512.png",
            },
          },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
        ]}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  The Sovereign AI <GradientText>Blog</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  AI marketing strategies, tips, and insights for local service
                  businesses.
                </p>
              </div>
            </FadeInView>

            {/* DB-sourced posts (when available) */}
            {posts.length > 0 && (
              <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, i) => (
                  <FadeInView key={post.id} delay={i * 0.05}>
                    <BlogCard post={post} />
                  </FadeInView>
                ))}
              </div>
            )}

            {/* Seed posts with category filtering */}
            <BlogListingClient posts={SEED_POSTS} />
          </Container>
        </Section>

        {/* Inline CTA -- Blog to Free Audit */}
        <Section className="bg-muted/30 py-16">
          <Container size="sm">
            <FadeInView>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent">
                  <Shield className="h-3.5 w-3.5" />
                  Free &mdash; No Credit Card Required
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Stop Guessing.{" "}
                  <GradientText>
                    See Exactly Where You&apos;re Losing Leads.
                  </GradientText>
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
                  Over 2,300 contractors have used our free AI audit to uncover
                  $5,000&ndash;$50,000 in missed monthly revenue. Takes 60
                  seconds.
                </p>
                <Link href="/free-audit" className="mt-6 inline-block">
                  <GradientButton size="lg" className="btn-shine text-base">
                    Get My Free AI Marketing Audit
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </Link>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    4.9/5 from 500+ businesses
                  </span>
                  <span className="text-emerald-400">
                    &#10003; 60-second results
                  </span>
                  <span className="text-emerald-400">
                    &#10003; No obligation
                  </span>
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
