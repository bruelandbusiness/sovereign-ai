interface AutoResponse {
  triggers: string[];
  response: string;
  category: string;
}

export const SUPPORT_AUTO_RESPONSES: AutoResponse[] = [
  {
    triggers: ["reset password", "forgot password", "change password", "can't log in", "locked out"],
    response:
      "To reset your password, click \"Forgot password\" on the login page and enter your email. You will receive a reset link within a few minutes. If you do not see it, check your spam folder or contact support@trysovereignai.com.",
    category: "account",
  },
  {
    triggers: ["billing", "invoice", "charge", "payment failed", "receipt"],
    response:
      "You can view invoices and update your payment method under Dashboard > Settings > Billing. If a payment failed, please verify your card details and retry. For billing disputes, email billing@trysovereignai.com.",
    category: "billing",
  },
  {
    triggers: ["service status", "outage", "downtime", "is it down", "system status"],
    response:
      "Check real-time service status at status.trysovereignai.com. If you are experiencing issues not reflected there, please contact support with your account email and a description of the problem.",
    category: "status",
  },
  {
    triggers: ["connect integration", "how to connect", "set up integration", "link account", "oauth"],
    response:
      "Go to Dashboard > Settings > Integrations. Click \"Connect\" on the service you want to link, then follow the OAuth prompts to authorize access. Once connected, data syncing begins automatically.",
    category: "integrations",
  },
  {
    triggers: ["dashboard help", "how to use dashboard", "navigate dashboard", "where is", "find feature"],
    response:
      "Your dashboard has tabs for Overview, Leads, Services, ROI, and Referrals. Use the command palette (Cmd+K / Ctrl+K) to quickly jump to any section. Visit Dashboard > Settings for account and integration management.",
    category: "dashboard",
  },
  {
    triggers: ["cancel", "cancellation", "close account", "stop subscription", "end service"],
    response:
      "To cancel your subscription, go to Dashboard > Settings > Billing and click \"Cancel Plan.\" Your access continues until the end of the current billing period. To delete your account entirely, contact support@trysovereignai.com.",
    category: "cancellation",
  },
  {
    triggers: ["upgrade", "change plan", "higher plan", "more features", "premium"],
    response:
      "You can upgrade your plan under Dashboard > Settings > Billing. Select your new plan and confirm. The prorated difference is charged immediately, and new features activate instantly.",
    category: "upgrade",
  },
  {
    triggers: ["contact", "email support", "phone number", "reach support", "talk to someone"],
    response:
      "You can reach us at support@trysovereignai.com during business hours. For urgent issues, use the live chat widget in the bottom-right corner of your dashboard.",
    category: "contact",
  },
  {
    triggers: ["office hours", "business hours", "when are you open", "support hours", "availability"],
    response:
      "Our support team is available Monday through Friday, 8 AM to 6 PM Central Time. Live chat and email support are monitored during these hours. Emergency support is available 24/7 for critical outages.",
    category: "hours",
  },
  {
    triggers: ["sla", "service level", "uptime guarantee", "response time", "guaranteed uptime"],
    response:
      "We guarantee 99.9% uptime for all paid plans. Critical issues receive a response within 1 hour, high-priority within 4 hours, and standard requests within 1 business day. Full SLA details are in your service agreement.",
    category: "sla",
  },
  {
    triggers: ["export data", "download data", "data export", "get my data", "backup"],
    response:
      "Go to Dashboard > Settings > Account and click \"Export Data.\" You can download leads, analytics, and account data in CSV or JSON format. Exports are typically ready within a few minutes.",
    category: "data",
  },
  {
    triggers: ["review management", "manage reviews", "respond to reviews", "review help", "google reviews"],
    response:
      "Connect your Google Business Profile under Integrations to enable AI-powered review responses. Once connected, new reviews appear in your dashboard and you can approve or customize AI-drafted replies before they are posted.",
    category: "reviews",
  },
  {
    triggers: ["lead tracking", "track leads", "where are my leads", "lead status", "lead pipeline"],
    response:
      "All leads are visible in the Leads tab of your dashboard. You can filter by source, status, and date. Click any lead to see full details, conversation history, and next steps. Enable notifications to get alerted on new leads.",
    category: "leads",
  },
  {
    triggers: ["voice agent", "ai phone", "phone bot", "call automation", "voice setup"],
    response:
      "To set up your AI voice agent, go to Dashboard > Services and activate \"Voice Agent.\" Configure your greeting, business hours, and call routing rules. Test it by calling your assigned number before going live.",
    category: "voice",
  },
  {
    triggers: ["booking widget", "scheduling widget", "embed booking", "appointment widget", "book online"],
    response:
      "Set up your booking widget under Dashboard > Services > Booking Widget. Customize colors, available time slots, and service types. Copy the embed code to add it to your website, or share the direct booking link with clients.",
    category: "booking",
  },
];

export function findAutoResponse(query: string): string | null {
  const normalized = query.toLowerCase().trim();
  if (normalized.length === 0) {
    return null;
  }

  for (const entry of SUPPORT_AUTO_RESPONSES) {
    const matched = entry.triggers.some((trigger) =>
      normalized.includes(trigger.toLowerCase())
    );
    if (matched) {
      return entry.response;
    }
  }

  return null;
}
