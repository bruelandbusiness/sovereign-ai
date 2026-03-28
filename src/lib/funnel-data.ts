// Trade-specific funnel data for perspective funnel pages.

export interface TradeData {
  slug: string;
  label: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  stats: { value: string; label: string }[];
  testimonial: {
    quote: string;
    name: string;
    business: string;
    result: string;
  };
  auditChecks: string[];
}

export const TRADES: Record<string, TradeData> = {
  plumber: {
    slug: "plumber",
    label: "Plumbing",
    headline: "Your Competitor Has 200 Google Reviews. You Have 12.",
    subheadline:
      "Get the AI marketing system that's helping plumbing companies generate 30-80+ new leads per month — without lifting a finger.",
    painPoints: [
      "Leads calling while you're under a sink — and nobody picks up",
      "Paying an agency $2K/month with zero proof it's working",
      "Your competitor ranks #1 on Google and you're on page 3",
      "Relying on word-of-mouth while new homeowners pick someone else",
    ],
    stats: [
      { value: "73%", label: "of homeowners search online before calling a plumber" },
      { value: "47%", label: "of calls to plumbers go unanswered" },
      { value: "$312", label: "average value of a missed plumbing lead" },
      { value: "8.7x", label: "average ROI our plumbing clients see" },
    ],
    testimonial: {
      quote:
        "We went from 15 leads a month to 67 in 60 days. The AI voice agent alone books 23 appointments per week. I wish I'd found this two years ago.",
      name: "Mike Rodriguez",
      business: "Rodriguez Plumbing, Phoenix AZ",
      result: "347% more leads in 60 days",
    },
    auditChecks: [
      "Google Business Profile optimization score",
      "Review volume vs. top 3 local competitors",
      "Website conversion rate analysis",
      "Local search ranking for 'plumber near me'",
      "Missed call & response time audit",
      "Ad spend efficiency (if running ads)",
    ],
  },
  hvac: {
    slug: "hvac",
    label: "HVAC",
    headline: "Summer's Coming. Is Your Phone Ready to Ring?",
    subheadline:
      "The AI marketing system that fills your HVAC schedule year-round — even in the slow months.",
    painPoints: [
      "Feast-or-famine cycles — slammed in summer, dead in spring",
      "Spending thousands on ads with no idea what's actually converting",
      "New homeowners in your area don't know you exist",
      "Losing maintenance contract renewals to competitors with better follow-up",
    ],
    stats: [
      { value: "68%", label: "of HVAC searches happen on mobile devices" },
      { value: "$4,200", label: "average lifetime value of an HVAC customer" },
      { value: "40%", label: "of HVAC calls go to voicemail after hours" },
      { value: "8.7x", label: "average ROI our HVAC clients see" },
    ],
    testimonial: {
      quote:
        "We used to shut down marketing in the off-season. Now our AI runs year-round and we've eliminated the slow months entirely. Best investment we've made.",
      name: "Sarah Chen",
      business: "Summit HVAC, Denver CO",
      result: "Eliminated seasonal revenue dips",
    },
    auditChecks: [
      "Google Business Profile optimization score",
      "Seasonal keyword ranking analysis",
      "Review volume vs. top 3 local competitors",
      "Website mobile experience score",
      "After-hours call capture rate",
      "Maintenance contract renewal rate",
    ],
  },
  roofing: {
    slug: "roofing",
    label: "Roofing",
    headline: "Every Storm Sends 10,000 Searches to Google. Are They Finding You?",
    subheadline:
      "The AI marketing system built for roofing companies that want to dominate their local market — storm season and beyond.",
    painPoints: [
      "Storm chasers flooding your market with cheap prices",
      "Spending $5K+ on lead services that send the same lead to 5 roofers",
      "Insurance jobs going to the company that shows up first on Google",
      "No follow-up system for estimates that didn't close",
    ],
    stats: [
      { value: "$8,500", label: "average residential roofing job value" },
      { value: "82%", label: "of homeowners get 2-3 quotes before deciding" },
      { value: "35%", label: "of roofing estimates close — AI follow-up pushes it to 55%" },
      { value: "8.7x", label: "average ROI our roofing clients see" },
    ],
    testimonial: {
      quote:
        "We stopped buying shared leads and let Sovereign AI generate exclusive ones. Our cost per lead dropped by 60% and our close rate went through the roof — pun intended.",
      name: "James Carter",
      business: "Carter Roofing, Atlanta GA",
      result: "60% lower cost per lead",
    },
    auditChecks: [
      "Google Business Profile optimization score",
      "Review volume vs. top 3 local competitors",
      "Storm-related keyword rankings",
      "Lead response time (speed-to-lead audit)",
      "Estimate follow-up sequence analysis",
      "Local Service Ads eligibility check",
    ],
  },
  electrician: {
    slug: "electrician",
    label: "Electrical",
    headline: "Homeowners Are Searching 'Electrician Near Me' Right Now. They're Finding Your Competitor.",
    subheadline:
      "The AI marketing system that puts your electrical business in front of every homeowner who needs you — 24/7.",
    painPoints: [
      "Emergency calls going to whoever shows up first on Google — and it's not you",
      "Low review count making customers choose the other guy",
      "Paying for leads that want a $50 outlet install, not a $5,000 panel upgrade",
      "No system to turn one-time customers into repeat service contracts",
    ],
    stats: [
      { value: "91%", label: "of homeowners read reviews before hiring an electrician" },
      { value: "$1,800", label: "average value of an electrical service call" },
      { value: "52%", label: "of electrical searches have local intent" },
      { value: "8.7x", label: "average ROI our electrical clients see" },
    ],
    testimonial: {
      quote:
        "The AI review system got us from 34 to 187 Google reviews in 4 months. We're now the highest-rated electrician in our city and leads come to us.",
      name: "David Park",
      business: "Park Electric, Austin TX",
      result: "450% more Google reviews",
    },
    auditChecks: [
      "Google Business Profile optimization score",
      "Review volume & average rating analysis",
      "Emergency keyword ranking positions",
      "Website conversion rate for service pages",
      "Call tracking & response time audit",
      "Service area coverage vs. competitors",
    ],
  },
  landscaping: {
    slug: "landscaping",
    label: "Landscaping",
    headline: "Spring Is Your Super Bowl. Are You Ready?",
    subheadline:
      "The AI marketing system that keeps your landscaping crews booked solid — from first thaw to first frost and everything in between.",
    painPoints: [
      "Scrambling for customers every spring while competitors are already booked",
      "Seasonal cash flow swings that make planning impossible",
      "Beautiful work but no system to showcase it and attract referrals",
      "Competing on price because nobody knows what makes you different",
    ],
    stats: [
      { value: "76%", label: "of landscaping customers start their search online" },
      { value: "$3,500", label: "average annual value of a landscaping customer" },
      { value: "3x", label: "more likely to book with companies that have 50+ reviews" },
      { value: "8.7x", label: "average ROI our landscaping clients see" },
    ],
    testimonial: {
      quote:
        "We went from chasing customers to turning them away. The AI filled our spring schedule by mid-February. That's never happened in 12 years of business.",
      name: "Tom Greenwald",
      business: "Greenwald Landscaping, Charlotte NC",
      result: "Spring schedule filled 6 weeks early",
    },
    auditChecks: [
      "Google Business Profile optimization score",
      "Photo & portfolio visibility analysis",
      "Review volume vs. top 3 local competitors",
      "Seasonal keyword ranking positions",
      "Social media presence & engagement audit",
      "Referral capture system analysis",
    ],
  },
};

export const TRADE_SLUGS = Object.keys(TRADES);

export function getTradeData(slug: string): TradeData | undefined {
  return TRADES[slug];
}
