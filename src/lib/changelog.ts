export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  category: "feature" | "improvement" | "fix" | "launch";
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-03-15",
    title: "NPS Surveys & Weekly Reports",
    description:
      "Automated NPS surveys at 30 and 90 days. Weekly performance report emails with ROI tracking sent every Monday.",
    category: "feature",
  },
  {
    date: "2026-03-12",
    title: "Referral Program Launch",
    description:
      "Earn $500 credit for every client you refer. Unique referral links, real-time tracking, and automatic credit application.",
    category: "feature",
  },
  {
    date: "2026-03-10",
    title: "In-App Support Tickets",
    description:
      "Submit and track support tickets directly from your dashboard. Message threads, priority levels, and admin response tracking.",
    category: "feature",
  },
  {
    date: "2026-03-07",
    title: "Exit-Intent Lead Capture",
    description:
      "Smart popup detects when visitors are leaving and offers a free AI marketing audit. Cookie-based frequency capping.",
    category: "feature",
  },
  {
    date: "2026-03-05",
    title: "ROI Calculator",
    description:
      "Interactive calculator on the homepage lets prospects see projected leads, revenue, and ROI based on their industry and current performance.",
    category: "feature",
  },
  {
    date: "2026-03-01",
    title: "Onboarding Checklist",
    description:
      "New clients see a step-by-step checklist to get the most from their AI services. Track progress and mark steps complete.",
    category: "improvement",
  },
  {
    date: "2026-02-25",
    title: "Real-Time Notifications",
    description:
      "Bell icon in dashboard shows live notifications for new leads, reviews, content published, and bookings.",
    category: "feature",
  },
  {
    date: "2026-02-20",
    title: "Annual Pricing (Save 2 Months)",
    description:
      "Pay annually and save the equivalent of 2 months. Available on all bundles and individual services.",
    category: "feature",
  },
  {
    date: "2026-02-15",
    title: "Email Campaign Automation",
    description:
      "Full email marketing system with drip campaigns, broadcast sends, and re-engagement sequences. AI-written content.",
    category: "feature",
  },
  {
    date: "2026-02-10",
    title: "AI Booking System",
    description:
      "Online scheduling widget, automated reminders, no-show reduction. Integrated with dashboard and calendar sync.",
    category: "feature",
  },
  {
    date: "2026-02-05",
    title: "Chatbot Embed Widget",
    description:
      "One-line embed code to add your AI chatbot to any website. Custom colors, greeting, and behavior configuration.",
    category: "feature",
  },
  {
    date: "2026-01-28",
    title: "16 Service Dashboards",
    description:
      "Every AI service now has a dedicated management dashboard with real-time stats, configuration, and activity feeds.",
    category: "feature",
  },
  {
    date: "2026-01-20",
    title: "Admin Panel",
    description:
      "Full admin panel for managing clients, subscriptions, services, and system health. Role-based access control.",
    category: "feature",
  },
  {
    date: "2026-01-15",
    title: "Stripe Billing Integration",
    description:
      "Seamless checkout, subscription management, and customer portal. Automatic provisioning on payment.",
    category: "feature",
  },
  {
    date: "2026-01-10",
    title: "Security Hardening",
    description:
      "Rate limiting on all public endpoints, CRON secret validation, input validation with Zod, CSP headers.",
    category: "improvement",
  },
  {
    date: "2026-01-05",
    title: "AI Marketing Audit Engine",
    description:
      "Free instant website audit powered by Claude AI. Analyzes SEO, reviews, social presence, and provides actionable recommendations.",
    category: "feature",
  },
  {
    date: "2026-01-01",
    title: "Sovereign AI Platform Launch",
    description:
      "Initial launch with 16 AI-powered marketing services, 3 bundles, magic link auth, and client dashboard.",
    category: "launch",
  },
];
