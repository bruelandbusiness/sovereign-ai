export interface Competitor {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceRange: string;
  sovereignPrice: string;
  features: {
    name: string;
    sovereign: boolean | string;
    competitor: boolean | string;
  }[];
  advantages: string[];
}

export const COMPETITORS: Competitor[] = [
  {
    slug: "scorpion",
    name: "Scorpion",
    tagline: "Why service businesses are switching from Scorpion to Sovereign AI",
    description:
      "Scorpion offers digital marketing for home services but relies on traditional methods with long contracts and limited AI capabilities.",
    priceRange: "$2,000 – $10,000/mo",
    sovereignPrice: "From $3,497/mo",
    features: [
      { name: "AI-Powered Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents (24/7)", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: true, competitor: "Basic" },
      { name: "SEO Management", sovereign: "AI-Optimized", competitor: "Manual" },
      { name: "Google Ads Management", sovereign: "AI-Optimized", competitor: true },
      { name: "Review Management", sovereign: "Automated", competitor: "Manual" },
      { name: "Email Marketing", sovereign: "AI-Written", competitor: true },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Extra Cost" },
      { name: "Content Creation", sovereign: "8 Posts/Mo AI", competitor: "2-4 Manual" },
      { name: "CRM Included", sovereign: true, competitor: "Extra Cost" },
      { name: "Booking System", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: false },
      { name: "48-Hour Setup", sovereign: true, competitor: false },
      { name: "Real-Time Dashboard", sovereign: true, competitor: "Monthly Reports" },
      { name: "Money-Back Guarantee", sovereign: "30 Days", competitor: false },
    ],
    advantages: [
      "16 AI systems vs. traditional manual marketing",
      "No long-term contracts — cancel anytime",
      "48-hour deployment vs. 2-4 week onboarding",
      "AI generates 3-5x more content at higher quality",
      "Real-time dashboard vs. monthly PDF reports",
      "30-day money-back guarantee included",
    ],
  },
  {
    slug: "thryv",
    name: "Thryv",
    tagline: "Why Sovereign AI delivers more than Thryv for local businesses",
    description:
      "Thryv is a business management platform with basic marketing. Sovereign AI is a full AI marketing agency with 16 dedicated systems.",
    priceRange: "$199 – $499/mo + add-ons",
    sovereignPrice: "From $3,497/mo (all-inclusive)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Template" },
      { name: "SEO", sovereign: "Full AI Service", competitor: "Basic Listings" },
      { name: "Google/Facebook Ads", sovereign: "AI-Managed", competitor: "Self-Serve" },
      { name: "Review Management", sovereign: "AI Automated", competitor: "Basic" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Templates" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Scheduling Only" },
      { name: "Content Creation", sovereign: "8 AI Posts/Month", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: "Basic CRM" },
      { name: "Retargeting", sovereign: true, competitor: false },
      { name: "Reputation Shield", sovereign: "24/7 AI", competitor: false },
      { name: "Analytics", sovereign: "AI Insights", competitor: "Basic" },
      { name: "Dedicated Support", sovereign: true, competitor: "Email Only" },
    ],
    advantages: [
      "Full-service AI marketing agency vs. DIY software",
      "We do everything for you — Thryv requires you to do it yourself",
      "16 AI systems working 24/7 vs. basic templates",
      "Custom AI chatbot trained on your business",
      "AI generates all content, ads, and emails automatically",
      "Proven 5-11x ROI for home service businesses",
    ],
  },
  {
    slug: "vendasta",
    name: "Vendasta",
    tagline: "Sovereign AI vs. Vendasta: purpose-built AI for home services",
    description:
      "Vendasta is a white-label platform for agencies. Sovereign AI is a direct, purpose-built AI marketing system for home service businesses.",
    priceRange: "$500 – $5,000/mo (via resellers)",
    sovereignPrice: "From $3,497/mo (direct)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "White-Label" },
      { name: "SEO", sovereign: "AI-Powered", competitor: "Resold Tools" },
      { name: "Ad Management", sovereign: "AI-Optimized", competitor: "Varies by Reseller" },
      { name: "Review Management", sovereign: "AI Automated", competitor: true },
      { name: "Email Marketing", sovereign: "AI-Written", competitor: "White-Label" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Scheduling" },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: "Via Add-On" },
      { name: "Direct Relationship", sovereign: true, competitor: "Through Reseller" },
      { name: "Home Service Specialized", sovereign: true, competitor: "Generic" },
      { name: "Transparent Pricing", sovereign: true, competitor: "Reseller Markup" },
      { name: "48-Hour Setup", sovereign: true, competitor: "Weeks" },
      { name: "Money-Back Guarantee", sovereign: "30 Days", competitor: false },
    ],
    advantages: [
      "Direct relationship — no middleman reseller markups",
      "Purpose-built for home services, not a generic platform",
      "16 AI systems included vs. à la carte add-ons",
      "Transparent pricing — no hidden fees or markup",
      "48-hour setup vs. weeks of onboarding",
      "30-day money-back guarantee included",
    ],
  },
];

export function getCompetitorBySlug(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
