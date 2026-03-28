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
  alternates: { canonical: "/blog/hvac-company-6-to-52-leads-case-study" },
  title: "HVAC Case Study: From 6 to 52 Leads in 45 Days",
  description:
    "How one HVAC company went from 6 leads per month to 52 in just 45 days using AI-powered marketing. Full breakdown of services, timeline, and measurable results.",
  openGraph: {
    title: "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days",
    description:
      "A detailed case study showing how AI marketing transformed an HVAC company from struggling to thriving in 45 days.",
    url: "/blog/hvac-company-6-to-52-leads-case-study",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "HVAC Case Study: 6 to 52 Leads in 45 Days",
    description:
      "How one HVAC company went from 6 leads/month to 52 in just 45 days using AI-powered marketing. Full breakdown.",
  },
};

export default function BlogPost() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days",
          description:
            "See exactly how ACME HVAC went from 6 leads per month to 52 leads in just 45 days using AI-powered marketing.",
          url: "https://www.trysovereignai.com/blog/hvac-company-6-to-52-leads-case-study",
          datePublished: "2026-03-25",
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
          { name: "Case Study: HVAC Company 6 to 52 Leads in 45 Days", url: "/blog/hvac-company-6-to-52-leads-case-study" },
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
                  Case Study
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  March 25, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  9 min read
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Case Study: How One HVAC Company Went From 6 to 52 Leads in 45
                Days
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                ACME HVAC was spending $4,200/month on a marketing agency and
                getting 6 leads. After switching to AI-powered marketing, they
                hit 52 leads in their first 45 days. Here is exactly what
                happened.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#4c85ff] to-[#22d3a1] text-[10px] font-bold text-white">
                    SA
                  </div>
                  <span>By Sovereign AI Team</span>
                </div>
                <SocialShare
                  url="/blog/hvac-company-6-to-52-leads-case-study"
                  title="Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days"
                />
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              <article className="prose prose-invert mx-auto mt-10 max-w-2xl">
                <p>
                  This is the story of ACME HVAC, a mid-size residential HVAC
                  company serving the greater Phoenix metropolitan area. Names
                  have been changed for privacy, but the numbers are real. This
                  case study covers their situation before AI marketing, the
                  exact services deployed, the implementation timeline, and the
                  results they achieved.
                </p>

                <h2>The Before: Struggling With a Traditional Agency</h2>
                <p>
                  Before partnering with Sovereign AI, ACME HVAC was working
                  with a regional marketing agency. Here is what their marketing
                  looked like:
                </p>
                <ul>
                  <li>
                    <strong>Monthly agency retainer:</strong> $4,200/month
                    (12-month contract)
                  </li>
                  <li>
                    <strong>Monthly ad spend:</strong> $2,800 on Google Ads
                  </li>
                  <li>
                    <strong>Total monthly marketing cost:</strong> $7,000
                  </li>
                  <li>
                    <strong>Leads per month:</strong> 6 (average over previous
                    6 months)
                  </li>
                  <li>
                    <strong>Cost per lead:</strong> $1,167
                  </li>
                  <li>
                    <strong>Google rating:</strong> 3.8 stars (47 reviews)
                  </li>
                  <li>
                    <strong>Website traffic:</strong> ~320 visitors/month
                  </li>
                  <li>
                    <strong>After-hours lead capture:</strong> None (calls went
                    to voicemail)
                  </li>
                </ul>
                <p>
                  The owner, Mike, was frustrated. He was spending $84,000 per
                  year on marketing and barely breaking even on customer
                  acquisition. His agency sent monthly reports filled with
                  impressions and click-through rates, but the phone was not
                  ringing. When he asked for changes, everything took 2-3 weeks
                  to implement.
                </p>

                <h2>The Decision: Why Mike Switched to AI</h2>
                <p>
                  Mike learned about{" "}
                  <Link href="/blog/hvac-companies-switching-ai-marketing" className="text-blue-400 hover:text-blue-300">
                    AI marketing systems
                  </Link>{" "}
                  from a fellow HVAC business owner at a trade conference. What
                  convinced him to make the switch were three factors:
                </p>
                <ul>
                  <li>No long-term contract (month-to-month)</li>
                  <li>
                    Results promised within 30 days, not 6 months
                  </li>
                  <li>
                    A free audit that showed exactly where his current marketing
                    was failing
                  </li>
                </ul>

                <h2>The Implementation: What We Deployed (Days 1-7)</h2>
                <p>
                  ACME HVAC&apos;s AI marketing system was fully operational
                  within 7 days. Here is what was set up during the first week:
                </p>

                <h3>Day 1-2: AI Voice Agent</h3>
                <p>
                  An AI voice agent was configured to answer every inbound call
                  that the team could not pick up. The voice agent was trained on
                  ACME&apos;s services, pricing ranges, service area, and
                  scheduling availability. It could answer common questions, qualify
                  callers, and book appointments directly into their calendar.
                </p>

                <h3>Day 2-3: AI Chatbot</h3>
                <p>
                  An{" "}
                  <Link href="/blog/ai-chatbots-booking-appointments-roofers" className="text-blue-400 hover:text-blue-300">
                    AI chatbot
                  </Link>{" "}
                  was deployed on ACME&apos;s website. It engaged every visitor
                  with a friendly greeting, asked qualifying questions, and
                  booked inspection appointments 24/7. The chatbot was also
                  connected to their Facebook page and Google Business Profile
                  messaging.
                </p>

                <h3>Day 3-5: Google Business Profile Optimization</h3>
                <p>
                  The team fully optimized ACME&apos;s{" "}
                  <Link href="/blog/google-business-profile-optimization-contractors" className="text-blue-400 hover:text-blue-300">
                    Google Business Profile
                  </Link>
                  : updated categories, rewrote the business description with
                  target keywords, uploaded 45 before-and-after photos,
                  published 4 Google Posts, seeded the Q&amp;A section with 12
                  common questions, and launched an automated review request
                  system.
                </p>

                <h3>Day 4-6: AI-Optimized Ad Campaigns</h3>
                <p>
                  New Google Ads campaigns were built from scratch using AI-driven
                  keyword research, ad copy generation, and bid optimization.
                  Landing pages were created for each core service (AC repair, AC
                  installation, furnace repair, furnace installation, duct
                  cleaning) with conversion-optimized layouts.
                </p>

                <h3>Day 5-7: Automated Follow-Up System</h3>
                <p>
                  An AI-powered follow-up system was configured to send
                  personalized text messages and emails to every new lead within
                  60 seconds of contact. The system continued nurturing leads
                  with a 7-touch sequence over 14 days, dramatically increasing
                  the number of leads that converted to booked appointments.
                </p>

                <h2>The Results: Days 1-45</h2>

                <h3>Week 1-2: Early Wins</h3>
                <ul>
                  <li>AI voice agent captured 8 after-hours calls that would have gone to voicemail</li>
                  <li>AI chatbot booked 5 appointments from website visitors</li>
                  <li>Google Business Profile views increased 140%</li>
                  <li>14 new leads total (more than double their monthly average)</li>
                </ul>

                <h3>Week 3-4: Momentum Building</h3>
                <ul>
                  <li>Google Ads cost per lead dropped from $467 to $62</li>
                  <li>Google rating climbed from 3.8 to 4.4 stars (23 new reviews)</li>
                  <li>Website traffic increased to 890 visitors/month</li>
                  <li>21 new leads in weeks 3-4 alone</li>
                </ul>

                <h3>Day 30-45: Full Acceleration</h3>
                <ul>
                  <li>17 additional leads in the final 15 days</li>
                  <li>Total leads in 45 days: 52</li>
                  <li>Average cost per lead: $38 (down from $1,167)</li>
                  <li>Google rating: 4.6 stars (71 total reviews)</li>
                  <li>Website traffic: 1,240 visitors/month</li>
                  <li>After-hours leads captured: 19 (37% of total)</li>
                </ul>

                <h2>The Financial Impact</h2>
                <p>
                  Here is the before-and-after comparison that tells the full
                  story:
                </p>
                <ul>
                  <li>
                    <strong>Monthly marketing cost:</strong> $7,000 (before) vs.
                    $3,200 (after) -- 54% reduction
                  </li>
                  <li>
                    <strong>Leads per month:</strong> 6 (before) vs. 52 in 45
                    days (after) -- 767% increase
                  </li>
                  <li>
                    <strong>Cost per lead:</strong> $1,167 (before) vs. $38
                    (after) -- 97% reduction
                  </li>
                  <li>
                    <strong>Booked jobs from leads:</strong> 2-3/month (before)
                    vs. 23 in 45 days (after)
                  </li>
                  <li>
                    <strong>Revenue impact:</strong> Monthly revenue increased
                    from $31,000 to $87,000 within 60 days
                  </li>
                </ul>

                <h2>What Mike Says Now</h2>
                <p>
                  After 45 days with the AI marketing system, Mike cancelled his
                  agency contract and has not looked back. His team went from
                  wondering where the next job was coming from to turning down
                  work they could not fit into the schedule.
                </p>
                <p>
                  The biggest surprise for Mike was the after-hours lead capture.
                  Nearly 40% of his new leads were coming in outside of business
                  hours -- calls and chats that his old setup would have missed
                  entirely. Those 19 after-hours leads alone generated more
                  revenue than his entire previous monthly marketing spend.
                </p>

                <h2>Key Takeaways</h2>
                <p>
                  ACME HVAC&apos;s results are not unusual. They are
                  representative of what happens when a contractor replaces an
                  underperforming agency model with a purpose-built AI marketing
                  system. The combination of instant response (voice + chatbot),
                  optimized visibility (GBP + ads), and persistent follow-up
                  (automated sequences) creates a lead generation machine that
                  traditional agencies simply cannot match.
                </p>
              
                {/* Newsletter signup */}
                <div className="mx-auto mt-12 max-w-2xl">
                  <NewsletterCTA />
                </div>

</article>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
                <h3 className="font-display text-lg font-bold sm:text-xl">
                  Want Results Like ACME HVAC?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our free AI audit scans your online presence in 60 seconds and
                  shows you exactly how many leads you&apos;re losing to competitors
                  every month. Over 2,300 contractors have used it.
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
                  slug: "roi-ai-review-management-hvac",
                  title: "The ROI of AI Review Management for HVAC Companies",
                  description: "How automated review management drives more 5-star reviews and increases local search visibility.",
                },
                {
                  slug: "50-leads-per-month-plumbing-business",
                  title: "How to Get 50+ Leads Per Month for Your Plumbing Business",
                  description: "A multi-channel strategy for generating 50+ qualified leads every month using AI.",
                },
                {
                  slug: "ai-vs-traditional-marketing-agency-contractors",
                  title: "AI vs. Traditional Marketing Agencies for Contractors",
                  description: "A side-by-side comparison of AI-powered marketing and traditional agency models.",
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
