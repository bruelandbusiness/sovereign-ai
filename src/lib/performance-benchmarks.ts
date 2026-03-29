/**
 * Industry performance benchmarks for home service businesses.
 *
 * Provides typed benchmark data, evaluation functions, and reporting
 * utilities. Pure computation — no database calls or side effects.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type PerformanceRating =
  | "poor"
  | "below_average"
  | "average"
  | "above_average"
  | "excellent";

export type BenchmarkCategory =
  | "lead_generation"
  | "reviews"
  | "seo"
  | "ads"
  | "email"
  | "social"
  | "booking"
  | "revenue";

export interface Benchmark {
  readonly name: string;
  readonly category: BenchmarkCategory;
  readonly unit: string;
  readonly description: string;
  /** Value at which performance is considered "poor". */
  readonly poor: number;
  /** Value at which performance is considered "below average". */
  readonly belowAverage: number;
  /** Value at which performance is considered "average" (industry median). */
  readonly average: number;
  /** Value at which performance is considered "above average". */
  readonly aboveAverage: number;
  /** Value at which performance is considered "excellent". */
  readonly excellent: number;
  /** True when a higher value is better (e.g. conversion rate). */
  readonly higherIsBetter: boolean;
}

export interface PerformanceResult {
  readonly benchmark: Benchmark;
  readonly actualValue: number;
  readonly rating: PerformanceRating;
  readonly percentile: number;
  readonly gap: number;
}

export interface ImprovementSuggestion {
  readonly benchmarkName: string;
  readonly category: BenchmarkCategory;
  readonly currentRating: PerformanceRating;
  readonly targetRating: PerformanceRating;
  readonly suggestion: string;
  readonly expectedImpact: "low" | "medium" | "high";
  readonly priority: number;
}

export interface PerformanceReport {
  readonly generatedAt: string;
  readonly overallRating: PerformanceRating;
  readonly overallPercentile: number;
  readonly categoryScores: ReadonlyArray<{
    readonly category: BenchmarkCategory;
    readonly averagePercentile: number;
    readonly rating: PerformanceRating;
  }>;
  readonly results: readonly PerformanceResult[];
  readonly topStrengths: readonly PerformanceResult[];
  readonly topWeaknesses: readonly PerformanceResult[];
  readonly suggestions: readonly ImprovementSuggestion[];
}

/* ------------------------------------------------------------------ */
/*  Industry Benchmarks                                                */
/* ------------------------------------------------------------------ */

export const INDUSTRY_BENCHMARKS: readonly Benchmark[] = [
  // --- Lead Generation ---
  {
    name: "Cost Per Lead",
    category: "lead_generation",
    unit: "USD",
    description: "Average cost to acquire a single lead",
    poor: 150,
    belowAverage: 100,
    average: 75,
    aboveAverage: 50,
    excellent: 30,
    higherIsBetter: false,
  },
  {
    name: "Lead Conversion Rate",
    category: "lead_generation",
    unit: "%",
    description: "Percentage of leads that become paying customers",
    poor: 5,
    belowAverage: 10,
    average: 15,
    aboveAverage: 25,
    excellent: 35,
    higherIsBetter: true,
  },
  {
    name: "Lead Response Time",
    category: "lead_generation",
    unit: "minutes",
    description: "Average time to first response to a new lead",
    poor: 1440,
    belowAverage: 360,
    average: 60,
    aboveAverage: 15,
    excellent: 5,
    higherIsBetter: false,
  },

  // --- Reviews ---
  {
    name: "Average Review Rating",
    category: "reviews",
    unit: "stars",
    description: "Average star rating across all review platforms",
    poor: 3.0,
    belowAverage: 3.5,
    average: 4.0,
    aboveAverage: 4.5,
    excellent: 4.8,
    higherIsBetter: true,
  },
  {
    name: "Monthly Review Volume",
    category: "reviews",
    unit: "reviews/month",
    description: "Number of new reviews received per month",
    poor: 1,
    belowAverage: 3,
    average: 8,
    aboveAverage: 15,
    excellent: 30,
    higherIsBetter: true,
  },
  {
    name: "Review Response Rate",
    category: "reviews",
    unit: "%",
    description: "Percentage of reviews that receive a business response",
    poor: 10,
    belowAverage: 30,
    average: 50,
    aboveAverage: 75,
    excellent: 95,
    higherIsBetter: true,
  },

  // --- SEO ---
  {
    name: "Organic Traffic Growth",
    category: "seo",
    unit: "%/month",
    description: "Month-over-month organic traffic growth rate",
    poor: -5,
    belowAverage: 0,
    average: 5,
    aboveAverage: 10,
    excellent: 20,
    higherIsBetter: true,
  },
  {
    name: "Keyword Rankings (Top 10)",
    category: "seo",
    unit: "keywords",
    description: "Number of target keywords ranking in the top 10",
    poor: 2,
    belowAverage: 5,
    average: 15,
    aboveAverage: 30,
    excellent: 50,
    higherIsBetter: true,
  },
  {
    name: "Local Pack Presence",
    category: "seo",
    unit: "%",
    description: "Percentage of local searches where business appears in map pack",
    poor: 10,
    belowAverage: 25,
    average: 40,
    aboveAverage: 60,
    excellent: 80,
    higherIsBetter: true,
  },

  // --- Ads ---
  {
    name: "Google Ads ROAS",
    category: "ads",
    unit: "x",
    description: "Return on ad spend for Google Ads campaigns",
    poor: 1.0,
    belowAverage: 2.0,
    average: 3.5,
    aboveAverage: 5.0,
    excellent: 8.0,
    higherIsBetter: true,
  },
  {
    name: "Google Ads CTR",
    category: "ads",
    unit: "%",
    description: "Click-through rate for Google Ads campaigns",
    poor: 1.5,
    belowAverage: 3.0,
    average: 5.0,
    aboveAverage: 7.0,
    excellent: 10.0,
    higherIsBetter: true,
  },
  {
    name: "Google Ads CPC",
    category: "ads",
    unit: "USD",
    description: "Average cost per click for Google Ads",
    poor: 15,
    belowAverage: 10,
    average: 6,
    aboveAverage: 4,
    excellent: 2,
    higherIsBetter: false,
  },
  {
    name: "Meta Ads ROAS",
    category: "ads",
    unit: "x",
    description: "Return on ad spend for Meta (Facebook/Instagram) campaigns",
    poor: 0.8,
    belowAverage: 1.5,
    average: 3.0,
    aboveAverage: 5.0,
    excellent: 7.0,
    higherIsBetter: true,
  },
  {
    name: "Meta Ads CTR",
    category: "ads",
    unit: "%",
    description: "Click-through rate for Meta ad campaigns",
    poor: 0.5,
    belowAverage: 0.8,
    average: 1.2,
    aboveAverage: 2.0,
    excellent: 3.5,
    higherIsBetter: true,
  },
  {
    name: "Meta Ads CPC",
    category: "ads",
    unit: "USD",
    description: "Average cost per click for Meta ads",
    poor: 5.0,
    belowAverage: 3.5,
    average: 2.0,
    aboveAverage: 1.2,
    excellent: 0.7,
    higherIsBetter: false,
  },

  // --- Email ---
  {
    name: "Email Open Rate",
    category: "email",
    unit: "%",
    description: "Percentage of emails opened by recipients",
    poor: 10,
    belowAverage: 15,
    average: 22,
    aboveAverage: 30,
    excellent: 40,
    higherIsBetter: true,
  },
  {
    name: "Email Click Rate",
    category: "email",
    unit: "%",
    description: "Percentage of email recipients who click a link",
    poor: 0.5,
    belowAverage: 1.0,
    average: 2.5,
    aboveAverage: 4.0,
    excellent: 6.0,
    higherIsBetter: true,
  },
  {
    name: "Email Unsubscribe Rate",
    category: "email",
    unit: "%",
    description: "Percentage of recipients who unsubscribe per campaign",
    poor: 2.0,
    belowAverage: 1.0,
    average: 0.5,
    aboveAverage: 0.2,
    excellent: 0.1,
    higherIsBetter: false,
  },

  // --- Social ---
  {
    name: "Social Engagement Rate",
    category: "social",
    unit: "%",
    description: "Average engagement rate across social platforms",
    poor: 0.5,
    belowAverage: 1.0,
    average: 2.0,
    aboveAverage: 4.0,
    excellent: 6.0,
    higherIsBetter: true,
  },
  {
    name: "Follower Growth Rate",
    category: "social",
    unit: "%/month",
    description: "Monthly growth rate of social media followers",
    poor: 0,
    belowAverage: 1,
    average: 3,
    aboveAverage: 5,
    excellent: 10,
    higherIsBetter: true,
  },
  {
    name: "Post Frequency",
    category: "social",
    unit: "posts/week",
    description: "Number of social media posts published per week",
    poor: 1,
    belowAverage: 2,
    average: 4,
    aboveAverage: 6,
    excellent: 10,
    higherIsBetter: true,
  },

  // --- Booking ---
  {
    name: "Online Booking Rate",
    category: "booking",
    unit: "%",
    description: "Percentage of bookings made through online channels",
    poor: 5,
    belowAverage: 15,
    average: 30,
    aboveAverage: 50,
    excellent: 70,
    higherIsBetter: true,
  },
  {
    name: "No-Show Rate",
    category: "booking",
    unit: "%",
    description: "Percentage of booked appointments where customer does not show",
    poor: 25,
    belowAverage: 15,
    average: 10,
    aboveAverage: 5,
    excellent: 2,
    higherIsBetter: false,
  },
  {
    name: "Average Booking Value",
    category: "booking",
    unit: "USD",
    description: "Average revenue per booking",
    poor: 75,
    belowAverage: 125,
    average: 200,
    aboveAverage: 350,
    excellent: 500,
    higherIsBetter: true,
  },

  // --- Revenue ---
  {
    name: "MRR Growth Rate",
    category: "revenue",
    unit: "%/month",
    description: "Monthly recurring revenue growth rate",
    poor: -2,
    belowAverage: 0,
    average: 5,
    aboveAverage: 10,
    excellent: 20,
    higherIsBetter: true,
  },
  {
    name: "Churn Rate",
    category: "revenue",
    unit: "%/month",
    description: "Monthly customer churn rate",
    poor: 10,
    belowAverage: 7,
    average: 5,
    aboveAverage: 3,
    excellent: 1,
    higherIsBetter: false,
  },
  {
    name: "LTV/CAC Ratio",
    category: "revenue",
    unit: "x",
    description: "Customer lifetime value divided by customer acquisition cost",
    poor: 1.0,
    belowAverage: 2.0,
    average: 3.0,
    aboveAverage: 5.0,
    excellent: 8.0,
    higherIsBetter: true,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                    */
/* ------------------------------------------------------------------ */

const RATING_ORDER: readonly PerformanceRating[] = [
  "poor",
  "below_average",
  "average",
  "above_average",
  "excellent",
] as const;

/**
 * Map a numeric rating index (0-4) to a PerformanceRating.
 */
function indexToRating(index: number): PerformanceRating {
  const clamped = Math.max(0, Math.min(4, Math.round(index)));
  return RATING_ORDER[clamped];
}

/**
 * Map a PerformanceRating to a numeric index (0-4).
 */
function ratingToIndex(rating: PerformanceRating): number {
  return RATING_ORDER.indexOf(rating);
}

/**
 * Linear interpolation: where does `value` fall between `a` and `b`?
 * Returns 0 when value === a, 1 when value === b.
 */
function lerp(value: number, a: number, b: number): number {
  if (a === b) return value >= a ? 1 : 0;
  return (value - a) / (b - a);
}

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Evaluate a single actual metric against its benchmark.
 *
 * Returns a PerformanceRating based on where the value falls
 * relative to the benchmark thresholds.
 */
export function evaluatePerformance(
  benchmark: Benchmark,
  actualValue: number,
): PerformanceResult {
  let rating: PerformanceRating;
  const percentile = calculatePercentile(benchmark, actualValue);

  if (benchmark.higherIsBetter) {
    if (actualValue >= benchmark.excellent) {
      rating = "excellent";
    } else if (actualValue >= benchmark.aboveAverage) {
      rating = "above_average";
    } else if (actualValue >= benchmark.average) {
      rating = "average";
    } else if (actualValue >= benchmark.belowAverage) {
      rating = "below_average";
    } else {
      rating = "poor";
    }
  } else {
    // Lower is better: thresholds are in descending order
    if (actualValue <= benchmark.excellent) {
      rating = "excellent";
    } else if (actualValue <= benchmark.aboveAverage) {
      rating = "above_average";
    } else if (actualValue <= benchmark.average) {
      rating = "average";
    } else if (actualValue <= benchmark.belowAverage) {
      rating = "below_average";
    } else {
      rating = "poor";
    }
  }

  const targetValue = benchmark.higherIsBetter
    ? benchmark.aboveAverage
    : benchmark.aboveAverage;
  const gap = benchmark.higherIsBetter
    ? targetValue - actualValue
    : actualValue - targetValue;

  return {
    benchmark,
    actualValue,
    rating,
    percentile,
    gap: Math.max(0, gap),
  };
}

/**
 * Calculate the percentile (0–100) for a given value within a benchmark
 * distribution. Uses linear interpolation between threshold tiers.
 *
 * Tier mapping:
 *   poor = 10th, belowAverage = 30th, average = 50th,
 *   aboveAverage = 70th, excellent = 90th
 */
export function calculatePercentile(
  benchmark: Benchmark,
  value: number,
): number {
  const tierPercentiles = [10, 30, 50, 70, 90];
  const tiers = benchmark.higherIsBetter
    ? [benchmark.poor, benchmark.belowAverage, benchmark.average, benchmark.aboveAverage, benchmark.excellent]
    : [benchmark.poor, benchmark.belowAverage, benchmark.average, benchmark.aboveAverage, benchmark.excellent].reverse();

  // For "lower is better" benchmarks, invert the value scale so the
  // interpolation logic always treats higher = better.
  const normalizedTiers = benchmark.higherIsBetter ? tiers : tiers;
  const normalizedValue = benchmark.higherIsBetter ? value : -value;
  const normalizedTierValues = benchmark.higherIsBetter
    ? normalizedTiers
    : normalizedTiers.map((t) => -t);

  // Below the lowest tier
  if (normalizedValue <= normalizedTierValues[0]) {
    const ratio = lerp(normalizedValue, normalizedTierValues[0] - (normalizedTierValues[1] - normalizedTierValues[0]), normalizedTierValues[0]);
    return Math.max(0, Math.round(tierPercentiles[0] * Math.max(0, ratio)));
  }

  // Above the highest tier
  if (normalizedValue >= normalizedTierValues[4]) {
    const spread = normalizedTierValues[4] - normalizedTierValues[3];
    const overshoot = spread > 0 ? (normalizedValue - normalizedTierValues[4]) / spread : 0;
    return Math.min(100, Math.round(tierPercentiles[4] + 10 * Math.min(1, overshoot)));
  }

  // Interpolate between tiers
  for (let i = 0; i < 4; i++) {
    if (normalizedValue >= normalizedTierValues[i] && normalizedValue <= normalizedTierValues[i + 1]) {
      const t = lerp(normalizedValue, normalizedTierValues[i], normalizedTierValues[i + 1]);
      return Math.round(tierPercentiles[i] + t * (tierPercentiles[i + 1] - tierPercentiles[i]));
    }
  }

  return 50; // Fallback to median
}

/* ------------------------------------------------------------------ */
/*  Improvement Suggestions                                            */
/* ------------------------------------------------------------------ */

const SUGGESTION_MAP: Record<string, Record<PerformanceRating, string>> = {
  "Cost Per Lead": {
    poor: "Audit your lead sources and eliminate channels with CPL above $120. Focus spend on Google Local Services Ads and referral programs.",
    below_average: "Implement lead scoring to prioritize high-intent prospects. Test landing page variations to improve conversion and reduce waste.",
    average: "Optimize ad targeting with negative keywords and lookalike audiences. Introduce retargeting campaigns for website visitors.",
    above_average: "Fine-tune bidding strategies with automated rules. Expand successful referral programs and strategic partnerships.",
    excellent: "Maintain current performance. Consider scaling budget on top-performing channels while monitoring CPL closely.",
  },
  "Lead Conversion Rate": {
    poor: "Implement a CRM and structured follow-up process. Respond to every lead within 15 minutes. Train staff on consultative selling.",
    below_average: "Add automated drip sequences for unresponsive leads. Use call tracking to identify conversion bottlenecks in your sales process.",
    average: "Introduce appointment-setting workflows and automated reminders. A/B test your proposal templates and follow-up cadence.",
    above_average: "Segment leads by service type and customize your approach. Implement customer testimonials and case studies in your sales process.",
    excellent: "Document and systematize your sales process. Consider expanding service areas or offerings to leverage your high conversion rate.",
  },
  "Lead Response Time": {
    poor: "Set up instant auto-responders and lead notifications. Consider an answering service for after-hours leads.",
    below_average: "Implement a lead routing system with mobile alerts. Assign dedicated staff for lead response during business hours.",
    average: "Add chatbot or live chat to your website for instant engagement. Use SMS auto-replies for form submissions.",
    above_average: "Optimize your chatbot responses with qualifying questions. Implement callback scheduling for after-hours inquiries.",
    excellent: "Maintain your rapid response system. Focus on response quality and personalization rather than further speed improvements.",
  },
  "Average Review Rating": {
    poor: "Address negative reviews promptly and professionally. Identify and fix recurring service complaints. Train staff on customer experience.",
    below_average: "Implement a post-service follow-up process. Proactively ask satisfied customers for reviews before they leave.",
    average: "Create a systematic review request process at key touchpoints. Address negative feedback within 24 hours with resolution offers.",
    above_average: "Showcase reviews prominently on your website and marketing. Respond to all reviews — positive and negative — to show engagement.",
    excellent: "Leverage your strong reputation in marketing. Create case studies from your best customer experiences.",
  },
  "Monthly Review Volume": {
    poor: "Implement automated review request emails/SMS after every completed job. Make it easy with direct links to review platforms.",
    below_average: "Train technicians to ask for reviews at job completion. Offer review links on invoices and receipts.",
    average: "Diversify review platforms (Google, Yelp, BBB). Create incentive programs for staff who generate the most reviews.",
    above_average: "Expand review collection to niche platforms (Angi, HomeAdvisor). Create video testimonial opportunities.",
    excellent: "Use your review volume as a competitive advantage. Feature recent reviews in ads and social media content.",
  },
  "Review Response Rate": {
    poor: "Assign a team member to monitor and respond to all reviews weekly. Use templates to speed up responses while keeping them personal.",
    below_average: "Set up review monitoring alerts. Create response templates for common positive and negative scenarios.",
    average: "Respond to negative reviews within 24 hours. Personalize positive review responses with specific job details.",
    above_average: "Use AI-assisted review responses for speed while maintaining a personal touch. Track sentiment trends monthly.",
    excellent: "Analyze review themes to identify improvement areas. Use positive review language in your marketing copy.",
  },
  "Organic Traffic Growth": {
    poor: "Audit your website for technical SEO issues (speed, mobile-friendliness, crawl errors). Create location-specific service pages.",
    below_average: "Publish weekly blog content targeting long-tail service keywords. Build citations on local business directories.",
    average: "Create content clusters around core services. Earn backlinks through community involvement and local partnerships.",
    above_average: "Implement schema markup for services and reviews. Target featured snippets with FAQ content on service pages.",
    excellent: "Expand content to adjacent topics and markets. Build topical authority through comprehensive guides and resources.",
  },
  "Keyword Rankings (Top 10)": {
    poor: "Focus on long-tail, low-competition keywords first. Ensure each service has a dedicated, optimized landing page.",
    below_average: "Improve on-page SEO: title tags, meta descriptions, header tags, and internal linking between service pages.",
    average: "Build quality backlinks through guest posts, local news, and community sponsorships. Optimize for 'near me' searches.",
    above_average: "Target more competitive head terms. Create pillar content that comprehensively covers each service category.",
    excellent: "Defend rankings with regular content updates. Expand keyword targeting to adjacent service areas and locations.",
  },
  "Local Pack Presence": {
    poor: "Claim and fully optimize your Google Business Profile. Ensure NAP consistency across all directories.",
    below_average: "Add photos, posts, and Q&A to your Google Business Profile weekly. Build citations on top 50 local directories.",
    average: "Encourage Google reviews specifically (they weight heavily in local pack). Add service area pages with embedded maps.",
    above_average: "Create location-specific landing pages for each service area. Use local link building to strengthen geographic relevance.",
    excellent: "Monitor competitors in local pack closely. Maintain posting frequency and review velocity to hold your position.",
  },
  "Google Ads ROAS": {
    poor: "Restructure campaigns by service type. Add negative keywords aggressively. Ensure landing pages match ad intent.",
    below_average: "Implement conversion tracking for calls and form fills. Test responsive search ads with multiple headline variations.",
    average: "Use target ROAS bidding strategy. Create separate campaigns for branded vs. non-branded terms.",
    above_average: "Implement audience layering and remarketing lists for search ads. Test Performance Max campaigns for lead generation.",
    excellent: "Scale budget gradually on top campaigns. Test new service verticals with proven campaign structures.",
  },
  "Google Ads CTR": {
    poor: "Rewrite ad copy with strong calls to action and unique selling propositions. Add all relevant ad extensions.",
    below_average: "Test emotional triggers and urgency in headlines. Add sitelink, callout, and structured snippet extensions.",
    average: "A/B test ad variations weekly. Use dynamic keyword insertion for highly relevant headlines.",
    above_average: "Implement ad customizers for time-sensitive offers. Test responsive search ads with 15 headlines and 4 descriptions.",
    excellent: "Analyze top-performing ad copy themes and replicate across campaigns. Focus on Quality Score improvements.",
  },
  "Google Ads CPC": {
    poor: "Improve Quality Scores by aligning keywords, ads, and landing pages. Remove broad match keywords with low relevance.",
    below_average: "Use phrase match and exact match for better control. Optimize landing page experience for higher Quality Scores.",
    average: "Implement dayparting to bid more during high-conversion hours. Use bid adjustments for device and location.",
    above_average: "Test automated bidding strategies. Focus on long-tail keywords with lower competition and higher intent.",
    excellent: "Maintain current efficiency. Look for opportunities to scale volume without significantly increasing CPC.",
  },
  "Meta Ads ROAS": {
    poor: "Narrow your audience targeting. Use customer lists for lookalike audiences. Ensure your creative is thumb-stopping.",
    below_average: "Test video ads — they typically outperform static images. Implement the Meta pixel correctly for conversion optimization.",
    average: "Use campaign budget optimization across ad sets. Test different placements (Stories, Reels, Feed) separately.",
    above_average: "Create a full-funnel strategy: awareness, consideration, conversion. Use dynamic creative optimization.",
    excellent: "Scale with lookalike audiences at varying percentages. Test new creative formats and messaging angles.",
  },
  "Meta Ads CTR": {
    poor: "Use before/after images and video testimonials. Write copy that addresses specific pain points of homeowners.",
    below_average: "Test carousel ads showcasing multiple projects. Use urgency and seasonal messaging in copy.",
    average: "A/B test creative weekly. Use customer review quotes as social proof in ad copy.",
    above_average: "Implement dynamic creative testing. Use UGC-style content that feels native to the platform.",
    excellent: "Analyze top creative themes and scale similar content. Test emerging formats like Reels and AR experiences.",
  },
  "Meta Ads CPC": {
    poor: "Broaden your audience slightly to reduce auction competition. Improve relevance score with better ad-to-audience alignment.",
    below_average: "Test automatic placements to find lower-cost inventory. Refresh creative frequently to avoid ad fatigue.",
    average: "Use cost cap bidding to control spend. Schedule ads during lower-competition time periods.",
    above_average: "Leverage engaged audience retargeting for lower CPCs. Test different campaign objectives for cost efficiency.",
    excellent: "Maintain creative refresh cadence. Monitor frequency to prevent audience saturation and rising costs.",
  },
  "Email Open Rate": {
    poor: "Clean your email list (remove inactive subscribers). Write compelling subject lines under 50 characters. Send from a person's name.",
    below_average: "Segment your list by service interest and engagement level. A/B test subject lines on every send.",
    average: "Implement send-time optimization. Use preview text strategically to complement your subject line.",
    above_average: "Personalize subject lines with subscriber data. Test emoji usage and curiosity-driven hooks.",
    excellent: "Maintain list hygiene rigorously. Focus on increasing click rates and conversions from your high open rates.",
  },
  "Email Click Rate": {
    poor: "Use a single, clear call-to-action per email. Make buttons large and mobile-friendly. Shorten email length.",
    below_average: "Add compelling visuals (before/after photos, infographics). Place CTAs above the fold and repeat at the bottom.",
    average: "Segment content by subscriber interests. Create urgency with limited-time offers or seasonal promotions.",
    above_average: "Implement behavioral triggers (abandoned booking, service reminders). Personalize content based on past services.",
    excellent: "Build automated nurture sequences for different customer segments. Test interactive email elements.",
  },
  "Email Unsubscribe Rate": {
    poor: "Reduce email frequency immediately. Let subscribers choose their preferences (frequency, topics). Improve content relevance.",
    below_average: "Implement a preference center. Segment sends so subscribers only get relevant content.",
    average: "Monitor unsubscribe reasons for patterns. Ensure every email provides clear value (tips, offers, updates).",
    above_average: "Use sunset policies for disengaged subscribers. Test different content formats to keep engagement high.",
    excellent: "Maintain your strong engagement. Focus on growing your list with high-quality opt-ins.",
  },
  "Social Engagement Rate": {
    poor: "Post behind-the-scenes content and team stories. Ask questions and respond to every comment. Use relevant hashtags.",
    below_average: "Share customer transformations (before/after). Create polls and interactive content. Post at peak engagement times.",
    average: "Develop a content mix: 40% educational, 30% entertaining, 20% promotional, 10% community. Use video content more.",
    above_average: "Collaborate with local influencers and complementary businesses. Run contests and giveaways to boost interaction.",
    excellent: "Build a community around your brand. Feature user-generated content and customer spotlights regularly.",
  },
  "Follower Growth Rate": {
    poor: "Optimize your profiles with complete information and branding. Cross-promote social accounts on your website, emails, and invoices.",
    below_average: "Run targeted follower campaigns. Partner with complementary local businesses for cross-promotion.",
    average: "Create shareable content (tips, checklists, how-tos). Engage with local community pages and groups.",
    above_average: "Launch referral incentives for social follows. Create viral-worthy content series (time-lapses, transformations).",
    excellent: "Focus on engagement quality over follower quantity. Develop ambassador programs with loyal followers.",
  },
  "Post Frequency": {
    poor: "Create a content calendar and batch-produce content weekly. Use scheduling tools to automate posting.",
    below_average: "Repurpose job site photos into multiple content pieces. Use templates to speed up content creation.",
    average: "Add platform-specific content (Reels, Stories, Shorts). Encourage team members to contribute content ideas.",
    above_average: "Diversify content types: tutorials, testimonials, tips, team highlights. Use AI tools to assist with copywriting.",
    excellent: "Focus on content quality and engagement metrics rather than increasing frequency further.",
  },
  "Online Booking Rate": {
    poor: "Add prominent online booking buttons to your website and Google Business Profile. Ensure the booking flow is mobile-friendly.",
    below_average: "Simplify your booking form (fewer fields). Add booking links to email signatures, social bios, and invoices.",
    average: "Implement real-time availability display. Add online booking CTAs to all marketing channels.",
    above_average: "Enable instant booking confirmation via SMS and email. Add booking widgets to your social media profiles.",
    excellent: "Optimize the booking experience with service recommendations. Implement recurring booking options for maintenance services.",
  },
  "No-Show Rate": {
    poor: "Implement automated appointment reminders (24h and 2h before). Require a deposit or credit card on file for bookings.",
    below_average: "Send SMS reminders with easy rescheduling links. Implement a cancellation policy with clear communication.",
    average: "Add calendar integration (Google, Apple) to booking confirmations. Call to confirm appointments the day before.",
    above_average: "Use predictive analytics to identify high-risk no-shows and send extra reminders. Offer same-day booking incentives.",
    excellent: "Maintain your reminder systems. Consider implementing a waitlist to fill cancellations quickly.",
  },
  "Average Booking Value": {
    poor: "Review your pricing strategy — you may be undercharging. Bundle services to increase per-job revenue.",
    below_average: "Train staff to upsell complementary services at the time of booking. Create tiered service packages.",
    average: "Implement service add-ons during the booking process. Offer maintenance plans that increase recurring revenue.",
    above_average: "Create premium service tiers with warranties and guarantees. Target higher-value projects through marketing.",
    excellent: "Expand into premium service categories. Develop signature packages that command price premiums.",
  },
  "MRR Growth Rate": {
    poor: "Launch a maintenance plan or membership program. Focus on retaining existing customers with loyalty incentives.",
    below_average: "Upsell maintenance agreements after every service call. Implement seasonal promotions to drive repeat business.",
    average: "Expand service offerings to capture more wallet share. Introduce referral bonuses for existing members.",
    above_average: "Open new service areas or territories. Develop strategic partnerships for cross-selling opportunities.",
    excellent: "Invest in scalable systems (hiring, training, technology) to sustain growth. Consider acquisitions of smaller competitors.",
  },
  "Churn Rate": {
    poor: "Survey churned customers to identify root causes. Implement a customer success check-in process after every service.",
    below_average: "Create a loyalty program with increasing benefits over time. Proactively reach out before renewal dates.",
    average: "Implement NPS surveys and act on detractor feedback immediately. Offer annual prepaid discounts.",
    above_average: "Build switching costs through accumulated service history and exclusive member benefits. Personalize communication.",
    excellent: "Maintain strong relationships. Focus on customer advocacy and referral programs to compound your retention advantage.",
  },
  "LTV/CAC Ratio": {
    poor: "Reduce acquisition costs by focusing on referrals and organic channels. Increase LTV through upselling and retention programs.",
    below_average: "Optimize ad spend toward higher-converting channels. Implement post-service follow-up sequences to drive repeat business.",
    average: "Develop a customer journey that maximizes lifetime value: onboarding, regular touchpoints, and loyalty rewards.",
    above_average: "Reinvest in acquisition channels with proven ROI. Test new channels while maintaining efficient unit economics.",
    excellent: "Scale aggressively — your unit economics support it. Invest in brand building and market expansion.",
  },
};

/**
 * Generate actionable improvement suggestions based on performance gaps.
 *
 * Suggestions are sorted by priority (worst-performing metrics first)
 * and only include metrics rated below "excellent".
 */
export function getImprovementSuggestions(
  results: readonly PerformanceResult[],
): readonly ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];

  for (const result of results) {
    const ratingIdx = ratingToIndex(result.rating);
    if (ratingIdx >= 4) continue; // Already excellent

    const targetRating = indexToRating(Math.min(4, ratingIdx + 2));
    const suggestionText =
      SUGGESTION_MAP[result.benchmark.name]?.[result.rating] ??
      `Improve your ${result.benchmark.name} from ${result.rating} toward ${targetRating} performance levels.`;

    const expectedImpact: ImprovementSuggestion["expectedImpact"] =
      ratingIdx <= 1 ? "high" : ratingIdx === 2 ? "medium" : "low";

    suggestions.push({
      benchmarkName: result.benchmark.name,
      category: result.benchmark.category,
      currentRating: result.rating,
      targetRating,
      suggestion: suggestionText,
      expectedImpact,
      priority: 4 - ratingIdx, // 4 = poor (highest priority), 0 = above_average
    });
  }

  return [...suggestions].sort((a, b) => b.priority - a.priority);
}

/* ------------------------------------------------------------------ */
/*  Report Generation                                                  */
/* ------------------------------------------------------------------ */

/**
 * Generate a comprehensive performance report across all categories.
 *
 * Accepts a map of benchmark names to actual values. Benchmarks without
 * a corresponding actual value are skipped.
 */
export function generatePerformanceReport(
  actuals: Readonly<Record<string, number>>,
): PerformanceReport {
  const results: PerformanceResult[] = [];

  for (const benchmark of INDUSTRY_BENCHMARKS) {
    const value = actuals[benchmark.name];
    if (value === undefined) continue;
    results.push(evaluatePerformance(benchmark, value));
  }

  // Category-level aggregation
  const categoryGroups = new Map<BenchmarkCategory, PerformanceResult[]>();
  for (const result of results) {
    const existing = categoryGroups.get(result.benchmark.category) ?? [];
    categoryGroups.set(result.benchmark.category, [...existing, result]);
  }

  const categoryScores = Array.from(categoryGroups.entries()).map(
    ([category, categoryResults]) => {
      const avgPercentile =
        categoryResults.reduce((sum, r) => sum + r.percentile, 0) /
        categoryResults.length;
      return {
        category,
        averagePercentile: Math.round(avgPercentile),
        rating: percentileToRating(avgPercentile),
      };
    },
  );

  // Overall metrics
  const overallPercentile =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.percentile, 0) / results.length,
        )
      : 0;

  // Top strengths and weaknesses
  const sorted = [...results].sort((a, b) => b.percentile - a.percentile);
  const topStrengths = sorted.slice(0, 3);
  const topWeaknesses = sorted.slice(-3).reverse();

  const suggestions = getImprovementSuggestions(results);

  return {
    generatedAt: new Date().toISOString(),
    overallRating: percentileToRating(overallPercentile),
    overallPercentile,
    categoryScores,
    results,
    topStrengths,
    topWeaknesses,
    suggestions,
  };
}

/**
 * Convert a percentile (0–100) to a PerformanceRating.
 */
function percentileToRating(percentile: number): PerformanceRating {
  if (percentile >= 80) return "excellent";
  if (percentile >= 60) return "above_average";
  if (percentile >= 40) return "average";
  if (percentile >= 20) return "below_average";
  return "poor";
}
