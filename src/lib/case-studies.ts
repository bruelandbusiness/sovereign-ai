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
    slug: "smith-plumbing-300-percent-revenue-growth",
    business: "Smith Plumbing & Heating",
    vertical: "Plumbing",
    location: "Austin, TX",
    bundle: "Growth",
    headline: "300% Revenue Growth in 90 Days",
    excerpt:
      "How Smith Plumbing went from a referral-only business to Austin's most-reviewed plumber — and tripled revenue doing it.",
    heroStat: "3x",
    heroLabel: "Revenue in 90 Days",
    before: [
      { label: "Monthly Revenue", value: "$31K" },
      { label: "Google Reviews", value: "14" },
      { label: "Monthly Leads", value: "9" },
      { label: "No-show Rate", value: "22%" },
    ],
    after: [
      { label: "Monthly Revenue", value: "$94K" },
      { label: "Google Reviews", value: "127" },
      { label: "Monthly Leads", value: "71" },
      { label: "No-show Rate", value: "4%" },
    ],
    timeline: "90 days",
    servicesUsed: [
      "AI Lead Generation",
      "AI Voice Agents",
      "AI Review Management",
      "AI Email Marketing",
      "AI CRM Automation",
      "AI Scheduling System",
    ],
    quote:
      "I was skeptical — I'd tried two other 'marketing companies' that burned me. Sovereign AI was different from week one. We're now fully booked three weeks out and I hired two new techs. Best business decision I've ever made.",
    quoteName: "Brian Smith",
    quoteRole: "Owner, Smith Plumbing & Heating",
    story: `Brian Smith had been running his plumbing and heating business in Austin for 11 years on pure referrals. It worked — until it didn't. When Austin's new construction boom started slowing, referrals dried up and revenue fell to $31K/month. Brian knew he needed to figure out digital marketing, but every agency he tried delivered expensive jargon and zero results.

The Growth bundle changed everything in the first two weeks. The AI Lead Generation system immediately identified 520+ high-intent prospects in the Austin metro — property managers, real estate agents, and homeowners who had recently searched for plumbing services. Automated, personalized outreach sequences began converting them into booked estimates within days.

AI Review Management tackled Smith Plumbing's biggest liability: their thin online presence. With just 14 Google reviews, they were invisible next to competitors with hundreds. The system sent smart review requests after every completed job, and within 45 days they had 89 new 5-star reviews. Their Google Business Profile went from page 3 to the Local Pack.

The AI Voice Agent ensured zero leads fell through the cracks. Every inbound call — including after-hours emergencies — was answered, qualified, and booked into the calendar automatically. The no-show rate dropped from 22% to 4% as automated reminder sequences kept appointments on track.

By day 90, Smith Plumbing had 127 Google reviews, 71 qualified leads per month, and revenue of $94K — a 3x increase. Brian hired two new technicians and put a third van on the road.`,
  },
  {
    slug: "acme-hvac-starter-bundle-results",
    business: "ACME HVAC Solutions",
    vertical: "HVAC",
    location: "Denver, CO",
    bundle: "Starter",
    headline: "From 6 Leads to 52 — on the Starter Plan",
    excerpt:
      "ACME HVAC proved you don't need the biggest package to see transformational results. The Starter bundle delivered 8x lead growth in 45 days.",
    heroStat: "8x",
    heroLabel: "Lead Growth in 45 Days",
    before: [
      { label: "Monthly Leads", value: "6" },
      { label: "Cost per Lead", value: "$203" },
      { label: "Google Rating", value: "3.9 stars" },
      { label: "Booking Rate", value: "18%" },
    ],
    after: [
      { label: "Monthly Leads", value: "52" },
      { label: "Cost per Lead", value: "$28" },
      { label: "Google Rating", value: "4.8 stars" },
      { label: "Booking Rate", value: "61%" },
    ],
    timeline: "45 days",
    servicesUsed: [
      "AI Lead Generation",
      "AI Review Management",
      "AI Scheduling System",
    ],
    quote:
      "We were paying $203 per lead through Google Ads and barely breaking even on new customers. Now we're getting leads for $28 and our close rate is through the roof. I wish we'd started with Sovereign AI two years ago.",
    quoteName: "Carlos Mendez",
    quoteRole: "Owner, ACME HVAC Solutions",
    story: `ACME HVAC Solutions had tried Google Ads, Home Advisor, and Angi. The result was always the same: expensive, low-quality leads and a grueling sales process. At $203 per lead with an 18% booking rate, Carlos Mendez was spending over $1,100 to acquire each new customer — and that barely covered the acquisition cost before labor and materials.

Carlos chose the Starter bundle to test Sovereign AI with a conservative investment. The results exceeded every expectation.

The AI Lead Generation system deployed multi-channel outreach to homeowners in the Denver metro area whose HVAC systems were likely overdue for service or replacement — identified through property age data, permit records, and seasonal signals. These were warm, pre-qualified prospects, not random clicks from paid ads.

AI Review Management transformed ACME's online reputation. A 3.9-star rating was driving searchers to competitors. The system sent personalized review requests to ACME's existing customer base, focusing on their most satisfied clients. Within 30 days, they accumulated 61 new reviews and their rating climbed to 4.8 stars — making them the highest-rated HVAC company in their service area.

The AI Scheduling System integrated directly with ACME's calendar. Leads booked estimates without calling, and the automated reminder sequence cut no-shows to near zero. Booking rate jumped from 18% to 61%.

By day 45, ACME was generating 52 qualified leads per month at $28 each. Carlos upgraded to the Growth bundle in month two.`,
  },
  {
    slug: "summit-roofing-empire-bundle-340k",
    business: "Summit Roofing Co.",
    vertical: "Roofing",
    location: "Colorado Springs, CO",
    bundle: "Empire",
    headline: "$0 to $340K: Built a Roofing Empire in One Season",
    excerpt:
      "Summit Roofing launched as a new company and hit $340K/month within one roofing season using the full Empire bundle.",
    heroStat: "$340K",
    heroLabel: "Monthly Revenue — Month 4",
    before: [
      { label: "Monthly Revenue", value: "$0 (new company)" },
      { label: "Online Reviews", value: "0" },
      { label: "Monthly Leads", value: "0" },
      { label: "Google Presence", value: "None" },
    ],
    after: [
      { label: "Monthly Revenue", value: "$340K" },
      { label: "Google Reviews", value: "183" },
      { label: "Monthly Leads", value: "134" },
      { label: "Google Ranking", value: "#1 in Colorado Springs" },
    ],
    timeline: "4 months",
    servicesUsed: ["All 16 AI Services"],
    quote:
      "I launched Summit Roofing with a truck, tools, and the Empire bundle. Four months later I have 11 employees and we're the highest-rated roofer in Colorado Springs. Sovereign AI didn't just help my marketing — it IS my business infrastructure.",
    quoteName: "Jake Sullivan",
    quoteRole: "Founder & CEO, Summit Roofing Co.",
    story: `Jake Sullivan had 12 years of roofing experience and a simple vision: build the best roofing company in Colorado Springs. What he didn't have was an established brand, online reviews, or a customer base. He launched Summit Roofing with three employees and a full Empire bundle deployment on day one.

The AI systems went to work immediately. AI SEO Domination built Summit's entire web presence from scratch — an optimized website, complete Google Business Profile, and service pages targeting every neighborhood in El Paso County. Within 60 days, Summit ranked on page one for 31 target keywords including "roof replacement Colorado Springs" and "hail damage roofing."

AI Lead Generation identified storm-damaged properties across the region using permit data, satellite imagery signals, and insurance claim patterns. Automated outreach sequences converted homeowners and insurance adjusters into booked estimates with a 43% response rate.

AI Voice Agents ensured every inbound call was captured and qualified — critical in roofing, where a 20-minute delay can mean losing a job to a competitor. The system handled overflow during peak post-storm periods when call volume spiked by 400%.

AI Review Management built Summit's reputation at an extraordinary pace. After every completed job, the system deployed a personalized review sequence. Summit accumulated 183 reviews in four months — more than most established competitors had earned in years.

AI Content Engine published weekly educational content about hail damage assessment, insurance claims, and roof longevity that drove consistent organic traffic. AI Social Media showcased completed projects with before/after photos that generated significant local shares.

By month four, Summit Roofing had 11 employees, $340K in monthly revenue, and a reputation as the premier roofing company in Colorado Springs. Jake has since opened a second location.`,
  },
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
