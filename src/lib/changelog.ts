export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  category: "feature" | "improvement" | "fix" | "security";
  highlights: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.8.0",
    date: "2026-03-29",
    title: "AI Lead Scoring & Smart Notifications",
    category: "feature",
    description:
      "Automatically score and prioritize leads using five qualification factors. Multi-channel notifications ensure your team never misses a high-intent prospect.",
    highlights: [
      "AI-powered lead scoring with 5 qualification factors",
      "Multi-channel notifications (in-app, email, SMS, push)",
      "Smart notification routing based on priority",
      "Negative review alerts escalated to urgent priority",
    ],
  },
  {
    version: "2.7.1",
    date: "2026-03-22",
    title: "Content Safety & AI Governance Layer",
    category: "security",
    description:
      "All AI-generated content now passes through a governance guard that enforces brand safety, prevents prompt injection, and blocks harmful outputs before they reach customers.",
    highlights: [
      "AI governance guard on all generative endpoints",
      "Prompt injection detection and blocking",
      "Brand-safe content filtering for review responses",
      "Audit logging for every AI-generated output",
    ],
  },
  {
    version: "2.7.0",
    date: "2026-03-15",
    title: "AI Voice Agent for Inbound Calls",
    category: "feature",
    description:
      "New AI-powered voice agent answers inbound calls 24/7, qualifies leads, and books appointments directly on your calendar. Supports natural conversation in English and Spanish.",
    highlights: [
      "24/7 inbound call handling with natural language",
      "Automatic lead qualification during calls",
      "Direct calendar booking from voice conversations",
      "English and Spanish language support",
    ],
  },
  {
    version: "2.6.1",
    date: "2026-03-08",
    title: "Redesigned Performance Dashboard",
    category: "improvement",
    description:
      "The analytics dashboard now loads 3x faster with real-time data streaming. New ROI breakdown chart shows exactly which channels drive your highest-value leads.",
    highlights: [
      "3x faster dashboard load times",
      "Real-time data streaming for live metrics",
      "ROI breakdown chart by marketing channel",
      "Revenue attribution across the full funnel",
    ],
  },
  {
    version: "2.6.0",
    date: "2026-03-01",
    title: "Unified Inbox for All Channels",
    category: "feature",
    description:
      "Every customer conversation across SMS, email, chatbot, voice, and social is now grouped into a single inbox view so you can respond from one place.",
    highlights: [
      "Single inbox for SMS, email, chatbot, voice, and social",
      "Conversation threading by contact",
      "Inbound and outbound message history",
      "Quick-reply templates for common responses",
    ],
  },
  {
    version: "2.5.1",
    date: "2026-02-22",
    title: "Google Business Profile Sync Reliability",
    category: "fix",
    description:
      "Resolved an issue where GBP post scheduling could miss the target window during API rate limits. Posts now retry automatically with exponential backoff.",
    highlights: [
      "Automatic retry with exponential backoff",
      "Rate limit detection and queuing",
      "Scheduled post delivery guarantees",
      "Sync status visible in the dashboard",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-02-15",
    title: "Automated Review Response Engine",
    category: "feature",
    description:
      "AI-generated review responses are fully customizable with your brand voice. Responses are drafted within minutes of a new Google or Yelp review and queued for your approval.",
    highlights: [
      "Brand-voice-aware AI response generation",
      "Google and Yelp review monitoring",
      "Approval queue before responses go live",
      "Customizable response tone and templates",
    ],
  },
  {
    version: "2.4.0",
    date: "2026-02-05",
    title: "Referral Program with Real-Time Tracking",
    category: "feature",
    description:
      "Earn $500 credit for every client you refer. Unique referral links, real-time conversion tracking, and automatic credit applied to your next invoice.",
    highlights: [
      "Unique referral links per client",
      "Real-time conversion tracking dashboard",
      "$500 credit per successful referral",
      "Automatic invoice credit application",
    ],
  },
  {
    version: "2.3.1",
    date: "2026-01-28",
    title: "Email Deliverability Improvements",
    category: "fix",
    description:
      "Implemented DKIM and DMARC alignment checks before sending. Bounce rates dropped by 60% and inbox placement improved across Gmail and Outlook recipients.",
    highlights: [
      "DKIM and DMARC alignment validation",
      "60% reduction in bounce rates",
      "Improved Gmail and Outlook inbox placement",
      "Email health monitoring in dashboard",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-01-20",
    title: "Security Hardening & Rate Limiting",
    category: "security",
    description:
      "Rate limiting on all public endpoints, CRON secret validation, input validation with Zod schemas, and Content Security Policy headers across the platform.",
    highlights: [
      "Rate limiting on all public API endpoints",
      "CRON job secret validation",
      "Zod schema validation on all inputs",
      "Content Security Policy headers platform-wide",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-01-12",
    title: "Sovereign AI Marketplace",
    category: "feature",
    description:
      "Browse and activate pre-built marketing automations from our new Marketplace. Launch a seasonal HVAC campaign or a roofing storm-response workflow in under five minutes.",
    highlights: [
      "Pre-built automation templates by industry",
      "One-click campaign activation",
      "Seasonal and event-driven workflow templates",
      "Campaign performance benchmarks included",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-01-05",
    title: "Multi-Location Management",
    category: "improvement",
    description:
      "Franchise and multi-location operators can now manage all locations from a single dashboard. Roll out campaigns, compare performance, and set location-specific budgets.",
    highlights: [
      "Single dashboard for all locations",
      "Cross-location campaign rollout",
      "Per-location performance comparison",
      "Location-specific budget controls",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-01-01",
    title: "Sovereign AI Platform Launch",
    category: "feature",
    description:
      "Initial launch with 16 AI-powered marketing services, three service bundles, magic link authentication, and a full client dashboard with real-time analytics.",
    highlights: [
      "16 AI-powered marketing services",
      "Three service tier bundles (Starter, Growth, Enterprise)",
      "Magic link passwordless authentication",
      "Real-time analytics dashboard",
    ],
  },
];
