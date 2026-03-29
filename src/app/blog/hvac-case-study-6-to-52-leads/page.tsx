import { Metadata } from "next";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/blog/hvac-case-study-6-to-52-leads" },
  title:
    "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days | Sovereign AI Blog",
  description:
    "See how a struggling HVAC company in Texas used AI-powered marketing to go from 6 leads per month to 52 leads in just 45 days, transforming their business overnight.",
  openGraph: {
    title: "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days",
    description:
      "A detailed breakdown of how one HVAC company 8x'd their lead volume in 45 days using AI marketing.",
    url: "/blog/hvac-case-study-6-to-52-leads",
    type: "article",
    images: [{ url: "/og-blog.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Study: HVAC Company Goes From 6 to 52 Leads in 45 Days",
    description:
      "A detailed breakdown of how one HVAC company 8x'd their lead volume in 45 days using AI marketing.",
    images: ["/og-blog.png"],
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
            "See how a struggling HVAC company in Texas used AI-powered marketing to go from 6 leads per month to 52 leads in just 45 days, transforming their business overnight.",
          url: "https://www.trysovereignai.com/blog/hvac-case-study-6-to-52-leads",
          datePublished: "2026-02-15",
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
          { name: "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days", url: "/blog/hvac-case-study-6-to-52-leads" },
        ]}
      />
      <Header />

      <main className="flex-1">
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
                <span className="rounded-full bg-teal-500/10 px-3 py-0.5 font-medium text-teal-400">
                  Case Study
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  February 15, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  6 min read
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                A real breakdown of how a small HVAC company in Texas transformed
                their lead generation with AI-powered marketing -- and what you
                can learn from their results.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                By Sovereign AI Team
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              <article className="prose prose-invert prose-lg max-w-none mt-10">
                <p>
                  When Marcus, the owner of a three-truck HVAC company in the
                  Dallas-Fort Worth area, reached out to us in late 2025, his
                  business was in trouble. Despite 12 years of experience and a
                  solid reputation among past customers, his lead pipeline had
                  dried up. He was averaging just 6 inbound leads per month --
                  barely enough to keep his three technicians busy.
                </p>
                <p>
                  Forty-five days later, Marcus had received 52 qualified leads,
                  booked 38 appointments, and closed over $127,000 in new revenue.
                  Here is exactly how it happened.
                </p>

                <h2>The Starting Point: What Was Not Working</h2>
                <p>
                  Before working with us, Marcus had tried the typical contractor
                  marketing playbook. He had spent $1,800 per month with a local
                  marketing agency for nine months. He was running Google Ads with
                  a $1,500 monthly budget. He had a basic website that had not been
                  updated in two years. His Google Business Profile had 23 reviews
                  and incomplete business information.
                </p>
                <p>
                  The results were dismal. His Google Ads were generating clicks at
                  $45 each, but fewer than 10% of those clicks turned into actual
                  phone calls. His website had no chat functionality, no online
                  booking, and no way to capture leads outside of business hours.
                  His marketing agency was sending him monthly reports full of
                  impressions and click-through rates, but his phone was not ringing.
                </p>

                <h2>Week 1: The Audit and Strategy</h2>
                <p>
                  We started with a comprehensive audit of Marcus&apos;s entire
                  marketing presence. The findings were eye-opening but not unusual
                  -- we see the same issues with most contractors we work with.
                </p>
                <p>
                  His Google Business Profile was only 40% optimized. He was missing
                  service listings, had no posts in over a year, and his business
                  description was a single generic sentence. His Google Ads campaigns
                  were targeting broad keywords like &quot;HVAC service&quot; instead
                  of high-intent terms like &quot;AC repair near me&quot; and
                  &quot;emergency furnace repair Dallas.&quot; His website had a
                  bounce rate of 78% -- meaning nearly 8 out of 10 visitors left
                  without taking any action.
                </p>
                <p>
                  The biggest issue: Marcus was losing leads he had already paid to
                  attract. His website had no way to engage visitors outside of a
                  basic contact form, and his average response time to form
                  submissions was over 6 hours. By that point, most homeowners had
                  already called a competitor.
                </p>

                <h2>Week 2: Implementation</h2>
                <p>
                  We deployed three core systems simultaneously. First, we fully
                  optimized Marcus&apos;s Google Business Profile -- adding all
                  service categories, writing a keyword-rich description, uploading
                  30 project photos, and setting up a weekly posting schedule. We
                  also activated an automated review request system that would text
                  every customer after a completed job.
                </p>
                <p>
                  Second, we rebuilt his Google Ads campaigns from scratch. We
                  targeted 47 high-intent keywords specific to his services and
                  service area, created dedicated landing pages for each service
                  category, and set up conversion tracking that measured actual
                  phone calls and booked appointments -- not just clicks.
                </p>
                <p>
                  Third, we deployed an AI chatbot on his website and connected it
                  to his scheduling system. The chatbot could answer questions about
                  Marcus&apos;s services, provide ballpark pricing for common jobs,
                  and book inspection appointments directly on his calendar -- 24
                  hours a day.
                </p>

                <h2>Days 15-30: The Results Start Flowing</h2>
                <p>
                  Within two weeks of going live, the changes were already
                  measurable. Marcus&apos;s Google Business Profile views increased
                  by 340%. His Google Ads cost per lead dropped from $45 to $18 --
                  a 60% reduction. The AI chatbot was engaging an average of 12
                  website visitors per day, and booking 2 to 3 appointments per day
                  that would have previously been lost.
                </p>
                <p>
                  The review automation was working as well. In the first 30 days,
                  Marcus went from 23 Google reviews to 41, with an average rating
                  of 4.9 stars. This improvement in review count and rating
                  directly correlated with higher map pack rankings -- he went from
                  position 7 to position 3 for his top keywords.
                </p>

                <h2>Day 45: The Final Numbers</h2>
                <p>
                  At the 45-day mark, here is where Marcus stood compared to his
                  pre-engagement baseline:
                </p>
                <p>
                  Total qualified leads: 52 (up from 6 per month). Booked
                  appointments: 38 (up from 4 per month). Revenue closed: $127,400
                  (up from approximately $18,000 per month). Google Ads cost per
                  lead: $18 (down from $45). Google reviews: 41 (up from 23).
                  Average response time to new leads: under 30 seconds (down from
                  6 hours).
                </p>
                <p>
                  The total marketing investment for those 45 days was $4,200,
                  including our{" "}
                  <Link href="/pricing" className="text-primary hover:underline">
                    platform fee
                  </Link>{" "}
                  and ad spend. On $127,400 in closed revenue, that represents a
                  return of over 30x.
                </p>

                <h2>What Made the Difference</h2>
                <p>
                  When we asked Marcus what changed, his answer was simple:
                  &quot;I stopped losing the leads I was already getting.&quot;
                  And that is the key insight from this case study. Marcus did not
                  need to spend dramatically more on advertising. He needed to
                  capture and convert the leads he was already attracting.
                </p>
                <p>
                  The AI chatbot alone accounted for 31 of the 52 leads --
                  homeowners who visited his website and would have left without
                  making contact. The Google Business Profile optimization moved
                  him into the map pack, generating organic leads he was not paying
                  for. And the improved ad targeting meant every dollar of ad spend
                  was working harder.
                </p>
                <p>
                  This is the pattern we see with every contractor we work with.
                  The opportunity is not in spending more money. It is in using
                  smarter systems to make your existing marketing work. Our{" "}
                  <Link href="/services" className="text-primary hover:underline">
                    AI marketing platform
                  </Link>{" "}
                  is built specifically to help home service contractors capture
                  every lead and convert more of them into booked jobs.
                </p>

                <h2>Where Marcus Is Now</h2>
                <p>
                  Three months after starting with Sovereign AI, Marcus has added a
                  fourth truck, hired two additional technicians, and is consistently
                  generating over 60 qualified leads per month. His business has
                  grown by over 400% in revenue, and he spends less on marketing
                  than he did with his previous agency.
                </p>
                <p>
                  Marcus&apos;s story is not unique. It is what happens when a good
                  contractor gets paired with the right marketing system. The leads
                  are out there. The homeowners need your services. The only question
                  is whether your marketing is set up to capture them.
                </p>
              </article>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                <h3 className="font-display text-lg font-bold">
                  Want results like Marcus? Let us show you what is possible.
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get a free AI marketing audit and see exactly how many leads
                  your business is leaving on the table.
                </p>
                <Link
                  href="/free-audit"
                  className="mt-4 inline-block rounded-lg gradient-bg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Get Your Free Audit
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
