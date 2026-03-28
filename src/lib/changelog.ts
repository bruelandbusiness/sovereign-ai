export interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  description: string;
  category: "feature" | "improvement" | "fix" | "launch";
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-03-25",
    version: "2.8.0",
    category: "feature",
    title: "AI Voice Agent for Inbound Calls",
    description:
      "New AI-powered voice agent answers inbound calls 24/7, qualifies leads, and books appointments directly on your calendar. Supports natural conversation in English and Spanish.",
  },
  {
    date: "2026-03-18",
    version: "2.7.0",
    category: "improvement",
    title: "Redesigned Performance Dashboard",
    description:
      "The analytics dashboard now loads 3x faster with real-time data streaming. New ROI breakdown chart shows exactly which channels drive your highest-value leads.",
  },
  {
    date: "2026-03-12",
    version: "2.6.1",
    category: "fix",
    title: "Google Business Profile Sync Reliability",
    description:
      "Resolved an issue where GBP post scheduling could miss the target window during API rate limits. Posts now retry automatically with exponential backoff.",
  },
  {
    date: "2026-03-05",
    version: "2.6.0",
    category: "feature",
    title: "Automated Review Response Engine",
    description:
      "AI-generated review responses are now fully customizable with your brand voice. Responses are drafted within minutes of a new Google or Yelp review and queued for your approval.",
  },
  {
    date: "2026-02-25",
    version: "2.5.0",
    category: "feature",
    title: "Referral Program with Real-Time Tracking",
    description:
      "Earn $500 credit for every client you refer. Unique referral links, real-time conversion tracking, and automatic credit applied to your next invoice.",
  },
  {
    date: "2026-02-15",
    version: "2.4.0",
    category: "improvement",
    title: "Smarter Lead Scoring Model",
    description:
      "Retrained the lead scoring model on 150K+ home service interactions. High-intent leads are now identified with 40% greater accuracy so your team calls the right prospects first.",
  },
  {
    date: "2026-02-05",
    version: "2.3.1",
    category: "fix",
    title: "Email Deliverability Improvements",
    description:
      "Implemented DKIM and DMARC alignment checks before sending. Bounce rates dropped by 60% and inbox placement improved across Gmail and Outlook recipients.",
  },
  {
    date: "2026-01-28",
    version: "2.3.0",
    category: "feature",
    title: "Multi-Location Management",
    description:
      "Franchise and multi-location operators can now manage all locations from a single dashboard. Roll out campaigns, compare performance, and set location-specific budgets.",
  },
  {
    date: "2026-01-20",
    version: "2.2.0",
    category: "feature",
    title: "Sovereign AI Marketplace",
    description:
      "Browse and activate pre-built marketing automations from our new Marketplace. Launch a seasonal HVAC campaign or a roofing storm-response workflow in under five minutes.",
  },
  {
    date: "2026-01-10",
    version: "2.1.0",
    category: "improvement",
    title: "Security Hardening & Rate Limiting",
    description:
      "Rate limiting on all public endpoints, CRON secret validation, input validation with Zod schemas, and Content Security Policy headers across the platform.",
  },
  {
    date: "2026-01-01",
    version: "2.0.0",
    category: "launch",
    title: "Sovereign AI Platform Launch",
    description:
      "Initial launch with 16 AI-powered marketing services, three service bundles, magic link authentication, and a full client dashboard with real-time analytics.",
  },
];
