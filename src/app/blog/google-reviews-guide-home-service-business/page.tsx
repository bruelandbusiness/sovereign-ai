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
  alternates: {
    canonical: "/blog/google-reviews-guide-home-service-business",
  },
  title: "Get More Google Reviews for Home Service Businesses",
  description:
    "Proven strategies to get more 5-star Google reviews for HVAC, plumbing, roofing, and electrical businesses. Includes templates, scripts, and automation tips.",
  openGraph: {
    title:
      "The Complete Guide to Getting More Google Reviews for Your Home Service Business",
    description:
      "Google reviews are the #1 factor in local search rankings. Here is how to get more of them consistently.",
    url: "/blog/google-reviews-guide-home-service-business",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get More Google Reviews for Your Home Service Business",
    description:
      "Proven strategies to get more 5-star Google reviews for HVAC, plumbing, roofing, and electrical businesses.",
  },
};

export default function BlogPost() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline:
            "The Complete Guide to Getting More Google Reviews for Your Home Service Business",
          description:
            "Learn proven strategies to get more 5-star Google reviews for your HVAC, plumbing, roofing, or electrical business.",
          url: "https://www.trysovereignai.com/blog/google-reviews-guide-home-service-business",
          datePublished: "2026-02-05",
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
          { name: "Getting More Google Reviews for Your Home Service Business", url: "/blog/google-reviews-guide-home-service-business" },
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
                <span className="rounded-full bg-amber-500/10 px-3 py-0.5 font-medium text-amber-400">
                  Reviews
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  February 5, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  10 min read
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                The Complete Guide to Getting More Google Reviews for Your Home
                Service Business
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Google reviews directly impact your local search rankings, your
                click-through rate, and whether homeowners choose you over your
                competitor. Here is how to build a review engine that runs on
                autopilot.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#4c85ff] to-[#22d3a1] text-[10px] font-bold text-white">
                    SA
                  </div>
                  <span>By Sovereign AI Team</span>
                </div>
                <SocialShare
                  url="/blog/google-reviews-guide-home-service-business"
                  title="The Complete Guide to Getting More Google Reviews for Your Home Service Business"
                />
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              <article className="prose prose-invert mx-auto mt-10 max-w-2xl">
                <p>
                  For home service businesses, Google reviews are not just
                  nice-to-have social proof -- they are the single most powerful
                  tool for winning new customers. A BrightLocal study found that
                  87% of consumers read online reviews for local businesses, and
                  73% only pay attention to reviews written in the last month.
                </p>
                <p>
                  If you are an HVAC, plumbing, roofing, or electrical company
                  without a systematic review strategy, you are leaving money on
                  the table every single day. This guide covers everything you need
                  to build a review engine that consistently generates 5-star
                  reviews.
                </p>

                <h2>Why Google Reviews Matter More Than Ever</h2>

                <h3>Local Search Rankings</h3>
                <p>
                  Google&apos;s local pack algorithm weighs three main factors:
                  relevance, distance, and prominence. Reviews are the biggest
                  component of prominence. Businesses with more reviews (and higher
                  ratings) consistently rank higher in the local 3-pack -- the map
                  results that appear at the top of local search results.
                </p>

                <h3>Click-Through Rates</h3>
                <p>
                  A business with 150 reviews and a 4.8-star rating will get 3-5x
                  more clicks than a competitor with 12 reviews and a 4.0-star
                  rating -- even if the lower-rated business appears higher in
                  organic results. Reviews create instant credibility.
                </p>

                <h3>Conversion Rates</h3>
                <p>
                  Every star increase in your Google rating results in a 5-9%
                  increase in revenue, according to Harvard Business School
                  research. For a home service company doing $500K annually, going
                  from 3.5 to 4.5 stars could mean $50,000-$90,000 in additional
                  revenue.
                </p>

                <h2>The 5-Step Review Generation System</h2>

                <h3>Step 1: Claim and Optimize Your Google Business Profile</h3>
                <p>
                  Before asking for reviews, make sure your Google Business
                  Profile is fully optimized:
                </p>
                <ul>
                  <li>Complete every section (services, hours, description, photos)</li>
                  <li>Add 20+ high-quality photos of your team, trucks, and completed work</li>
                  <li>Write a keyword-rich business description</li>
                  <li>Add all your services with descriptions</li>
                  <li>Post weekly updates (Google Business posts)</li>
                </ul>

                <h3>Step 2: Ask at the Right Time</h3>
                <p>
                  Timing is everything. The best time to ask for a review is
                  within 1-2 hours of completing a job, when the customer&apos;s
                  satisfaction is highest. Here is the hierarchy of effectiveness:
                </p>
                <ol>
                  <li>
                    <strong>In-person ask by the technician</strong> (highest
                    conversion rate at 60-70%)
                  </li>
                  <li>
                    <strong>Text message within 1 hour</strong> (40-50% conversion
                    rate)
                  </li>
                  <li>
                    <strong>Email within 2 hours</strong> (15-25% conversion rate)
                  </li>
                  <li>
                    <strong>Follow-up text at 24 hours</strong> (10-15% conversion
                    rate for those who did not respond)
                  </li>
                </ol>

                <h3>Step 3: Make It Effortless</h3>
                <p>
                  Every extra step between your request and the review being
                  posted costs you 50% of potential reviewers. Use a direct review
                  link that opens Google Reviews with one tap:
                </p>
                <ul>
                  <li>
                    Go to your Google Business Profile and find your &quot;Ask for
                    reviews&quot; short link
                  </li>
                  <li>Use this link in all review requests -- it opens directly to the review form</li>
                  <li>
                    Never ask customers to &quot;search for your business on
                    Google&quot; -- that adds 3-4 extra steps and you will lose
                    80% of them
                  </li>
                </ul>

                <h3>Step 4: Use Templates That Convert</h3>
                <p>
                  Here is a text message template that consistently gets 40%+
                  response rates:
                </p>
                <blockquote>
                  <p>
                    Hi [First Name], thanks for choosing [Business Name] today!
                    If you were happy with the service, would you mind leaving us
                    a quick Google review? It really helps other homeowners find
                    us. Here is the link: [Review Link]. Thanks! - [Tech Name]
                  </p>
                </blockquote>
                <p>Key elements that make this work:</p>
                <ul>
                  <li>Personalized with the customer and technician name</li>
                  <li>Sent shortly after the job is complete</li>
                  <li>Gives a reason (&quot;helps other homeowners&quot;)</li>
                  <li>Includes a direct link -- one tap to review</li>
                  <li>Keeps it short and casual</li>
                </ul>

                <h3>Step 5: Respond to Every Review</h3>
                <p>
                  Responding to reviews signals to Google that your business is
                  active and engaged. It also shows potential customers that you
                  care about feedback. Guidelines:
                </p>
                <ul>
                  <li>
                    <strong>Positive reviews:</strong> Thank them by name,
                    reference the specific service, and invite them back
                  </li>
                  <li>
                    <strong>Negative reviews:</strong> Apologize, take
                    responsibility, offer to make it right offline (provide a
                    phone number), and never argue publicly
                  </li>
                  <li>
                    <strong>Response time:</strong> Within 24 hours for all
                    reviews, within 1 hour for negative reviews
                  </li>
                </ul>

                <h2>Automating Your Review Engine</h2>
                <p>
                  The system above works, but doing it manually is
                  time-consuming and inconsistent. This is where AI review
                  management changes everything:
                </p>
                <ul>
                  <li>
                    <strong>Automatic triggers:</strong> Review requests are sent
                    automatically when a job is marked complete in your CRM
                  </li>
                  <li>
                    <strong>Smart timing:</strong> AI determines the optimal send
                    time based on the customer&apos;s past behavior and the type
                    of service performed
                  </li>
                  <li>
                    <strong>Follow-up sequences:</strong> Non-responders get a
                    friendly reminder at 24 and 72 hours
                  </li>
                  <li>
                    <strong>Sentiment detection:</strong> AI identifies
                    potentially unhappy customers before the review request goes
                    out, routing them to a private feedback form instead
                  </li>
                  <li>
                    <strong>Auto-responses:</strong> AI drafts personalized
                    responses to every review for your approval
                  </li>
                </ul>
                <p>
                  Companies using AI-powered review management average 15-25 new
                  reviews per month compared to 2-4 with manual processes.
                </p>

                <h2>Common Mistakes to Avoid</h2>
                <ul>
                  <li>
                    <strong>Buying fake reviews:</strong> Google&apos;s detection
                    is sophisticated. Fake reviews get removed and can result in
                    your profile being suspended.
                  </li>
                  <li>
                    <strong>Review gating:</strong> Asking customers to rate you
                    privately first, then only directing happy customers to Google
                    violates Google&apos;s terms of service.
                  </li>
                  <li>
                    <strong>Offering incentives:</strong> Discounts or gifts in
                    exchange for reviews violates both Google and FTC guidelines.
                  </li>
                  <li>
                    <strong>Ignoring negative reviews:</strong> An unanswered
                    negative review is worse than the review itself. It signals
                    you do not care.
                  </li>
                  <li>
                    <strong>Batch requesting:</strong> Sending review requests to
                    100 past customers at once looks suspicious to Google and can
                    trigger review filtering.
                  </li>
                </ul>

                <h2>The Numbers You Should Target</h2>
                <p>
                  Based on analysis of top-performing home service companies in
                  competitive markets:
                </p>
                <ul>
                  <li>
                    <strong>Minimum viable reviews:</strong> 50 reviews to
                    consistently appear in the local 3-pack
                  </li>
                  <li>
                    <strong>Competitive threshold:</strong> 100+ reviews to
                    dominate most local markets
                  </li>
                  <li>
                    <strong>Target rating:</strong> 4.7+ stars (the sweet spot for
                    trust -- perfect 5.0 actually looks suspicious)
                  </li>
                  <li>
                    <strong>Monthly velocity:</strong> 10-20 new reviews per month
                    to maintain recency signals
                  </li>
                </ul>

                <h2>Start Today</h2>
                <p>
                  You do not need to wait for a perfect system to start getting
                  more reviews. Begin with these three actions today:
                </p>
                <ol>
                  <li>
                    Get your Google Business Profile review link and save it to
                    your phone
                  </li>
                  <li>
                    Ask your next three customers for a review in person, then
                    follow up with a text
                  </li>
                  <li>
                    Respond to every existing review on your profile that you have
                    not yet responded to
                  </li>
                </ol>
                <p>
                  Then, when you are ready to scale, automate the entire process
                  with an AI review management system that handles it all for you.
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
                  Want to automate your review generation?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our AI Review Management system generates 15-25 new 5-star
                  reviews per month on autopilot. See how it works with a free
                  audit.
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
                  slug: "google-business-profile-optimization-contractors",
                  title: "Google Business Profile Optimization for Contractors",
                  description: "Step-by-step guide to optimizing your Google Business Profile for maximum local visibility.",
                },
                {
                  slug: "50-leads-per-month-plumbing-business",
                  title: "How to Get 50+ Leads Per Month for Your Plumbing Business",
                  description: "A multi-channel strategy for generating 50+ qualified plumbing leads every month.",
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
