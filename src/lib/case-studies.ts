export interface CaseStudy {
  slug: string;
  business: string;
  vertical: string;
  location: string;
  bundle: string;
  headline: string;
  excerpt: string;
  heroStat: string;
  heroLabel: string;
  before: { label: string; value: string }[];
  after: { label: string; value: string }[];
  timeline: string;
  servicesUsed: string[];
  quote: string;
  quoteName: string;
  quoteRole: string;
  story: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "hvac-47-leads-30-days",
    business: "Rodriguez HVAC",
    vertical: "HVAC",
    location: "Phoenix, AZ",
    bundle: "Starter",
    headline: "47 Leads in 30 Days",
    excerpt:
      "How an HVAC company in Phoenix went from 8 leads/month to 47 using our Starter bundle.",
    heroStat: "487%",
    heroLabel: "Increase in Leads",
    before: [
      { label: "Monthly Leads", value: "8" },
      { label: "Google Reviews", value: "12" },
      { label: "Cost per Lead", value: "$187" },
      { label: "Monthly Revenue", value: "$24K" },
    ],
    after: [
      { label: "Monthly Leads", value: "47" },
      { label: "Google Reviews", value: "67" },
      { label: "Cost per Lead", value: "$31" },
      { label: "Monthly Revenue", value: "$89K" },
    ],
    timeline: "30 days",
    servicesUsed: ["AI Lead Generation", "AI Review Management", "AI Scheduling System"],
    quote:
      "We went from struggling to fill our schedule to being booked 3 weeks out. The AI lead gen system alone pays for itself 10x over.",
    quoteName: "Mike Rodriguez",
    quoteRole: "Owner, Rodriguez HVAC",
    story: `Rodriguez HVAC had been relying on word-of-mouth and a basic Google listing for years. With just 8 leads per month and a $187 cost per lead from sporadic Facebook ads, growth had stalled.

Within the first week of activating the Starter bundle, the AI Lead Generation system identified 340 high-intent prospects in the Phoenix metro area. Automated outreach sequences began nurturing these leads with personalized messages.

The AI Review Management system sent review requests to every completed job. Within 30 days, their Google rating went from 3.8 to 4.7 stars with 55 new reviews. This alone increased organic call volume by 200%.

The AI Scheduling System eliminated phone tag entirely. Leads could book directly from search results, the website, and even text messages. No-show rates dropped from 15% to 3%.

By day 30, Rodriguez HVAC had generated 47 qualified leads at a cost of just $31 each — an 83% reduction in cost per lead. Monthly revenue jumped from $24K to $89K.`,
  },
  {
    slug: "plumber-5-star-rating-60-days",
    business: "Thompson Plumbing",
    vertical: "Plumbing",
    location: "Atlanta, GA",
    bundle: "Growth",
    headline: "4.8 Star Rating in 60 Days",
    excerpt:
      "A plumbing company transformed their online reputation and 11x'd their ROI with Growth bundle.",
    heroStat: "11.2x",
    heroLabel: "Monthly ROI",
    before: [
      { label: "Google Rating", value: "3.2 stars" },
      { label: "Monthly Leads", value: "15" },
      { label: "Cost per Lead", value: "$147" },
      { label: "Close Rate", value: "12%" },
    ],
    after: [
      { label: "Google Rating", value: "4.8 stars" },
      { label: "Monthly Leads", value: "83" },
      { label: "Cost per Lead", value: "$22" },
      { label: "Close Rate", value: "38%" },
    ],
    timeline: "60 days",
    servicesUsed: [
      "AI Lead Generation",
      "AI Voice Agents",
      "AI SEO Domination",
      "AI Email Marketing",
      "AI Review Management",
      "AI CRM Automation",
    ],
    quote:
      "Cut cost per lead from $147 to $22. ROI on our Growth Bundle is 11.2x every single month. Should have done this two years ago.",
    quoteName: "James Thompson",
    quoteRole: "Owner, Thompson Plumbing",
    story: `Thompson Plumbing had a reputation problem. A 3.2-star Google rating was costing them thousands in lost business. Combined with expensive, poorly targeted Facebook ads, their cost per lead was $147.

The Growth bundle attacked this from every angle. AI Review Management immediately began requesting reviews from their satisfied customers (who were the silent majority). AI Voice Agents ensured no call went unanswered — even at 2 AM during emergencies.

AI SEO Domination targeted 47 high-intent local keywords. Within 45 days, Thompson ranked #1 for "emergency plumber Atlanta" and 12 other money keywords. AI Email Marketing re-engaged 1,200 past customers with personalized follow-up sequences.

The AI CRM tracked every touchpoint, automatically scoring leads and routing hot prospects for immediate follow-up. Close rate jumped from 12% to 38%.

By day 60, Thompson Plumbing had 189 Google reviews (up from 23), an 83-lead pipeline, and 11.2x monthly ROI on their Growth investment.`,
  },
  {
    slug: "roofer-312-percent-roi",
    business: "Apex Roofing Solutions",
    vertical: "Roofing",
    location: "Dallas, TX",
    bundle: "Empire",
    headline: "312% ROI in 90 Days",
    excerpt:
      "Full-stack AI marketing delivered $340K in new revenue for a Dallas roofing company.",
    heroStat: "312%",
    heroLabel: "Return on Investment",
    before: [
      { label: "Monthly Revenue", value: "$82K" },
      { label: "Online Leads", value: "11" },
      { label: "Google Position", value: "Page 3" },
      { label: "Ad Spend Efficiency", value: "1.8x" },
    ],
    after: [
      { label: "Monthly Revenue", value: "$340K" },
      { label: "Online Leads", value: "127" },
      { label: "Google Position", value: "#1" },
      { label: "Ad Spend Efficiency", value: "8.7x" },
    ],
    timeline: "90 days",
    servicesUsed: [
      "All 16 AI Services",
    ],
    quote:
      "From $82K to $340K monthly revenue in 90 days. We had to hire 4 new crews to keep up with demand. Sovereign AI is our unfair advantage.",
    quoteName: "Sarah Chen",
    quoteRole: "CEO, Apex Roofing Solutions",
    story: `Apex Roofing had ambition but was stuck at $82K/month. They'd tried three different marketing agencies with mediocre results. Their website was on page 3 of Google, and they were burning money on poorly optimized ads.

The Empire bundle deployed all 16 AI systems simultaneously. AI SEO Domination rebuilt their entire web presence with optimized service pages for every neighborhood in DFW. AI Content Engine published 8 blog posts per month targeting storm damage, roof replacement, and insurance claim keywords.

AI Ad Management rebuilt their Google and Facebook campaigns from scratch, reducing cost per lead by 79% in the first 30 days. AI Voice Agents captured every inbound call and qualified leads before routing to sales.

AI Retargeting brought back 34% of website visitors who didn't convert on first visit. AI Social Media built their brand with before/after project showcases that generated 450+ engagement per post.

By day 90, Apex was generating 127 leads per month (up from 11), ranking #1 for 23 target keywords, and their monthly revenue hit $340K. They had to hire 4 new crews to handle the demand.`,
  },
  {
    slug: "electrician-73k-revenue",
    business: "Park Electric",
    vertical: "Electrical",
    location: "Denver, CO",
    bundle: "Growth",
    headline: "$73K Revenue from AI Marketing",
    excerpt:
      "An electrician with zero online presence built a $73K/month pipeline in 60 days.",
    heroStat: "$73K",
    heroLabel: "Monthly Revenue",
    before: [
      { label: "Online Presence", value: "None" },
      { label: "Monthly Leads", value: "3" },
      { label: "Google Reviews", value: "0" },
      { label: "Monthly Revenue", value: "$18K" },
    ],
    after: [
      { label: "Google Position", value: "#1" },
      { label: "Monthly Leads", value: "64" },
      { label: "Google Reviews", value: "94" },
      { label: "Monthly Revenue", value: "$73K" },
    ],
    timeline: "60 days",
    servicesUsed: [
      "AI Lead Generation",
      "AI Voice Agents",
      "AI SEO Domination",
      "AI Email Marketing",
      "AI Review Management",
      "AI CRM Automation",
    ],
    quote:
      "Went from zero online presence to #1 on Google in 60 days. Getting 12+ calls a day now. This is the best investment I've ever made in my business.",
    quoteName: "David Park",
    quoteRole: "Owner, Park Electric",
    story: `David Park ran his electrical business almost entirely on referrals. No website, no Google listing, no online reviews. When referrals slowed down, revenue dropped to $18K/month.

Starting from scratch made the Growth bundle even more impactful. AI Website Builder created a conversion-optimized site in 48 hours. AI SEO Domination set up and optimized a Google Business Profile, then targeted 35 local keywords.

AI Lead Generation launched multi-channel outreach to property managers, real estate agents, and general contractors in the Denver area. Within 2 weeks, Park Electric had 23 qualified leads in the pipeline.

AI Review Management systematically requested reviews from every past customer David could remember. Within 60 days, Park Electric had 94 five-star reviews — making them the highest-rated electrician in Denver.

AI Voice Agents handled the flood of inbound calls (12+ per day), qualifying each lead and booking estimates automatically. Revenue climbed from $18K to $73K/month, and David hired his first two employees.`,
  },
];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug);
}
