import { Metadata } from "next";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { SocialShare } from "@/components/blog/SocialShare";
import { NewsletterCTA } from "@/components/blog/NewsletterCTA";

export const metadata: Metadata = {
  alternates: { canonical: "/blog/google-business-profile-optimization-contractors" },
  title: "Google Business Profile Optimization for Contractors",
  description:
    "Optimize your Google Business Profile to rank higher in local search, attract more calls, and dominate your service area. Step-by-step guide for contractors.",
  openGraph: {
    title: "Google Business Profile Optimization Guide for Contractors",
    description:
      "The complete GBP optimization guide for contractors who want to dominate local search and generate more leads.",
    url: "/blog/google-business-profile-optimization-contractors",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Business Profile Optimization for Contractors",
    description:
      "The complete GBP optimization guide for contractors who want to dominate local search and generate more leads.",
  },
};

export default function BlogPost() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: "Google Business Profile Optimization Guide for Contractors",
          description:
            "Learn how to fully optimize your Google Business Profile to rank higher in local search, attract more calls, and dominate your service area as a contractor.",
          url: "https://www.trysovereignai.com/blog/google-business-profile-optimization-contractors",
          datePublished: "2026-03-15",
          author: {
            "@type": "Organization",
            name: "Sovereign AI",
          },
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
          { name: "Google Business Profile Optimization Guide for Contractors", url: "/blog/google-business-profile-optimization-contractors" },
        ]}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container size="md">
            <FadeInView>
              <Link
                href="/blog"
                className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Posts
              </Link>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-blue-500/10 px-3 py-0.5 font-medium text-blue-400">
                  Local SEO
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  March 15, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  9 min read
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Google Business Profile Optimization Guide for Contractors
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Your Google Business Profile is the single most important asset
                for local lead generation. Here is how to set it up for maximum
                visibility and conversions.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#4c85ff] to-[#22d3a1] text-[10px] font-bold text-white">
                    SA
                  </div>
                  <span>By Sovereign AI Team</span>
                </div>
                <SocialShare
                  url="/blog/google-business-profile-optimization-contractors"
                  title="Google Business Profile Optimization Guide for Contractors"
                />
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              <article className="prose prose-invert mx-auto mt-10 max-w-2xl">
                <p>
                  If you are a contractor and you are not showing up in
                  Google&apos;s Local Pack -- the map results that appear at the
                  top of search results -- you are invisible to the majority of
                  your potential customers. Over 46% of all Google searches have
                  local intent, and for home service contractors, that number is
                  even higher.
                </p>
                <p>
                  Your Google Business Profile (GBP) is the foundation of local
                  search visibility. Yet most contractors either leave it
                  incomplete or set it up once and never touch it again. This
                  guide walks you through every optimization that matters.
                </p>

                <h2>Why Your Google Business Profile Matters More Than Your Website</h2>
                <p>
                  When someone searches &quot;HVAC repair near me&quot; or
                  &quot;best roofer in [city],&quot; Google shows the Local Pack
                  before any organic results. Your GBP listing is what appears
                  there -- not your website. For many contractors, their GBP
                  generates more calls and leads than their website ever will.
                </p>
                <p>Key statistics that make the case:</p>
                <ul>
                  <li>
                    84% of GBP views come from discovery searches (people
                    searching for a service, not your company name)
                  </li>
                  <li>
                    Businesses with complete GBP listings are 70% more likely to
                    attract location visits
                  </li>
                  <li>
                    56% of local businesses have not even claimed their GBP
                    listing
                  </li>
                  <li>
                    The average contractor GBP listing has fewer than 15 photos
                    -- top performers have 100+
                  </li>
                </ul>

                <h2>Step 1: Nail Your Business Categories</h2>
                <p>
                  Your primary category is the single biggest ranking factor you
                  can control. Choose the category that most precisely describes
                  your core service. If you are a general contractor who
                  primarily does kitchen remodels, your primary category should
                  be &quot;Kitchen Remodeler,&quot; not &quot;General
                  Contractor.&quot;
                </p>
                <p>
                  Add every relevant secondary category available. Google allows
                  up to 10. A plumbing company might use: Plumber (primary),
                  Water Heater Installation Service, Drain Cleaning Service, Gas
                  Installation Service, Emergency Plumber, and Bathroom
                  Remodeler. Each secondary category gives you additional
                  keyword visibility.
                </p>

                <h2>Step 2: Write a Keyword-Rich Business Description</h2>
                <p>
                  You have 750 characters for your business description. Use
                  every one of them. Include your primary services, service
                  areas, and differentiators. Write it for humans first, but
                  naturally incorporate the search terms your customers use.
                </p>
                <p>
                  Avoid generic descriptions like &quot;We are a family-owned
                  company with 20 years of experience.&quot; Instead, lead with
                  what you do and where you do it: &quot;Full-service HVAC
                  installation, repair, and maintenance for residential and
                  commercial properties across [City] and surrounding
                  communities including [Town 1], [Town 2], and [Town 3].&quot;
                </p>

                <h2>Step 3: Upload Photos Every Week</h2>
                <p>
                  Google has confirmed that businesses with more photos receive
                  more clicks, calls, and direction requests. But it is not just
                  about quantity -- it is about consistency and variety.
                </p>
                <p>Upload photos in these categories:</p>
                <ul>
                  <li>
                    <strong>Before and after shots</strong> of completed
                    projects (your most powerful content)
                  </li>
                  <li>
                    <strong>Team photos</strong> showing your crew at work
                    (builds trust)
                  </li>
                  <li>
                    <strong>Equipment and vehicles</strong> (signals
                    professionalism)
                  </li>
                  <li>
                    <strong>Your office or shop</strong> (proves you are a real
                    business)
                  </li>
                </ul>
                <p>
                  Aim for 5-10 new photos per week. AI tools can help you
                  geo-tag, caption, and schedule photo uploads automatically.
                </p>

                <h2>Step 4: Use Google Posts Weekly</h2>
                <p>
                  Google Posts are free mini-ads that appear directly on your GBP
                  listing. Most contractors ignore them entirely, which means
                  using them gives you an immediate edge.
                </p>
                <p>
                  Post about seasonal promotions, completed projects, new
                  services, community involvement, and industry tips. Each post
                  should include a call-to-action button (Call Now, Learn More,
                  Book Online) and a relevant image.
                </p>
                <p>
                  AI-powered{" "}
                  <Link href="/services" className="text-blue-400 hover:text-blue-300">
                    marketing systems
                  </Link>{" "}
                  can generate and schedule Google Posts automatically, ensuring
                  you never miss a week.
                </p>

                <h2>Step 5: Build a Review Generation Machine</h2>
                <p>
                  Reviews are the second most important ranking factor for local
                  search, and the single biggest trust signal for potential
                  customers. You need a system that generates reviews
                  consistently -- not just when you remember to ask.
                </p>
                <p>The formula is simple:</p>
                <ul>
                  <li>
                    Ask every satisfied customer for a review within 24 hours of
                    job completion
                  </li>
                  <li>
                    Send a direct link to your Google review page via text
                    message (not email -- text gets 5x higher response rates)
                  </li>
                  <li>
                    Respond to every single review, positive or negative, within
                    48 hours
                  </li>
                  <li>
                    Use AI-powered review response tools to craft professional,
                    keyword-rich responses at scale
                  </li>
                </ul>
                <p>
                  Contractors using automated review request systems typically
                  see their monthly review volume increase by 300-500%.
                </p>

                <h2>Step 6: Answer Every Question in the Q&amp;A Section</h2>
                <p>
                  The Q&amp;A section on your GBP is an overlooked ranking
                  opportunity. Seed it with the questions your customers ask most
                  frequently: Do you offer free estimates? What areas do you
                  serve? Are you licensed and insured? Do you offer financing?
                </p>
                <p>
                  Answer each one thoroughly with relevant keywords. These
                  Q&amp;A entries are indexed by Google and can help you rank for
                  long-tail search queries.
                </p>

                <h2>Step 7: Keep Your Information Consistent</h2>
                <p>
                  NAP consistency (Name, Address, Phone) across every online
                  listing is a critical ranking signal. Your business name,
                  address, and phone number must be identical on your GBP, your
                  website, Yelp, the BBB, Angi, HomeAdvisor, and every other
                  directory.
                </p>
                <p>
                  Even small inconsistencies -- like &quot;Street&quot; vs
                  &quot;St.&quot; or different phone numbers -- can hurt your
                  rankings. Audit your citations quarterly and fix any
                  discrepancies immediately.
                </p>

                <h2>The Bottom Line</h2>
                <p>
                  A fully optimized Google Business Profile is not optional for
                  contractors who want to grow. It is the single highest-ROI
                  marketing activity available to local service businesses --
                  and it is free.
                </p>
                <p>
                  The contractors who treat their GBP as a living, breathing
                  marketing asset -- updating it weekly with photos, posts,
                  and fresh reviews -- are the ones dominating the Local Pack
                  and getting the calls that their competitors are missing.
                </p>
              
                {/* Newsletter signup */}
                <div className="mx-auto mt-12 max-w-2xl">
                  <NewsletterCTA />
                </div>

</article>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                <h3 className="font-display text-lg font-bold">
                  Want help optimizing your Google Business Profile?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get a free audit that shows exactly where your GBP is
                  underperforming and what to fix first.
                </p>
                <Link
                  href="/free-audit"
                  className="mt-4 inline-block rounded-lg gradient-bg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Get My Free AI Marketing Audit &rarr;
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  Free forever &middot; No credit card &middot; Results in 60 seconds
                </p>
              </div>
            </FadeInView>

            <RelatedPosts
              posts={[
                {
                  slug: "google-reviews-guide-home-service-business",
                  title: "The Complete Guide to Getting More Google Reviews",
                  description: "Proven strategies to generate 5-star reviews consistently and on autopilot.",
                },
                {
                  slug: "hvac-company-6-to-52-leads-case-study",
                  title: "Case Study: HVAC Company Goes from 6 to 52 Leads per Month",
                  description: "How one HVAC company increased leads by 767% using AI-powered marketing.",
                },
                {
                  slug: "ai-transforming-home-service-marketing-2026",
                  title: "5 Ways AI is Transforming Home Service Marketing in 2026",
                  description: "How AI marketing tools are helping home service companies generate more leads.",
                },
              ]}
            />
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
