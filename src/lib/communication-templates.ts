/* ------------------------------------------------------------------ */
/*  Client Communication Template System                               */
/*  Pure template engine — no database calls, no side effects          */
/* ------------------------------------------------------------------ */

export type CommCategory =
  | "welcome"
  | "milestone"
  | "alert"
  | "report"
  | "support"
  | "upsell";

export type CommChannel = "email" | "sms" | "push" | "in-app";

export interface TemplateVariable {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly sampleValue: string;
}

export interface CommTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: CommCategory;
  readonly channels: readonly CommChannel[];
  readonly subject: string;
  readonly body: string;
  readonly variables: readonly TemplateVariable[];
}

export interface TemplateValidationResult {
  readonly valid: boolean;
  readonly missingVariables: readonly string[];
  readonly extraVariables: readonly string[];
}

export interface RenderedTemplate {
  readonly templateId: string;
  readonly subject: string;
  readonly body: string;
}

/* ------------------------------------------------------------------ */
/*  Template Definitions                                               */
/* ------------------------------------------------------------------ */

export const TEMPLATES: readonly CommTemplate[] = [
  /* ---------- Welcome ---------- */
  {
    id: "welcome-email",
    name: "Welcome Email",
    category: "welcome",
    channels: ["email"],
    subject: "Welcome to {{platformName}}, {{firstName}}!",
    body: "Hi {{firstName}},\n\nWelcome to {{platformName}}! We're thrilled to have you on board. Your account has been set up and is ready to go.\n\nTo get started, visit your dashboard at {{dashboardUrl}}.\n\nIf you have any questions, reach out to us at {{supportEmail}}.\n\nBest regards,\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
      { name: "dashboardUrl", description: "Dashboard URL", required: true, sampleValue: "https://app.example.com/dashboard" },
      { name: "supportEmail", description: "Support email address", required: true, sampleValue: "support@example.com" },
    ],
  },
  {
    id: "first-login-guide",
    name: "First Login Guide",
    category: "welcome",
    channels: ["email", "in-app"],
    subject: "Your Quick-Start Guide, {{firstName}}",
    body: "Hi {{firstName}},\n\nHere are three steps to hit the ground running:\n\n1. Complete your profile at {{profileUrl}}\n2. Connect your first integration\n3. Invite your team members\n\nNeed help? Check our guide at {{guideUrl}} or reply to this message.\n\nCheers,\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "profileUrl", description: "Profile settings URL", required: true, sampleValue: "https://app.example.com/profile" },
      { name: "guideUrl", description: "Quick-start guide URL", required: true, sampleValue: "https://docs.example.com/quickstart" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "team-introduction",
    name: "Team Introduction",
    category: "welcome",
    channels: ["email"],
    subject: "Meet Your {{platformName}} Team",
    body: "Hi {{firstName}},\n\nWe wanted to introduce the people who will be supporting you:\n\n- Account Manager: {{accountManager}}\n- Technical Contact: {{techContact}}\n\nFeel free to reach out to any of us directly. We're here to make sure you succeed.\n\nWarm regards,\n{{accountManager}}",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
      { name: "accountManager", description: "Account manager name", required: true, sampleValue: "Jordan Lee" },
      { name: "techContact", description: "Technical contact name", required: true, sampleValue: "Sam Rivera" },
    ],
  },

  /* ---------- Milestone ---------- */
  {
    id: "first-lead",
    name: "First Lead Celebration",
    category: "milestone",
    channels: ["email", "in-app", "push"],
    subject: "You just got your first lead!",
    body: "Congratulations, {{firstName}}!\n\nYou've received your first lead through {{platformName}}. The lead details are available in your dashboard.\n\nLead: {{leadName}}\nSource: {{leadSource}}\n\nKeep the momentum going!",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
      { name: "leadName", description: "Name of the lead", required: true, sampleValue: "Acme Corp" },
      { name: "leadSource", description: "Where the lead came from", required: true, sampleValue: "Google Ads" },
    ],
  },
  {
    id: "100th-review",
    name: "100th Review Milestone",
    category: "milestone",
    channels: ["email", "in-app"],
    subject: "You've hit 100 reviews, {{firstName}}!",
    body: "Hi {{firstName}},\n\nYour business just received its 100th review on {{platformName}}. Your average rating is {{averageRating}} stars.\n\nThis is a huge accomplishment. Your online reputation is stronger than ever.\n\nKeep up the great work!\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
      { name: "averageRating", description: "Average star rating", required: true, sampleValue: "4.8" },
    ],
  },
  {
    id: "6-month-anniversary",
    name: "6-Month Anniversary",
    category: "milestone",
    channels: ["email"],
    subject: "Happy 6-Month Anniversary, {{firstName}}!",
    body: "Hi {{firstName}},\n\nCan you believe it's been 6 months since you joined {{platformName}}? Here's a quick look at your progress:\n\n- Total Leads: {{totalLeads}}\n- Total Reviews: {{totalReviews}}\n- Revenue Generated: {{revenueGenerated}}\n\nHere's to the next 6 months!\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
      { name: "totalLeads", description: "Total leads received", required: true, sampleValue: "247" },
      { name: "totalReviews", description: "Total reviews received", required: true, sampleValue: "89" },
      { name: "revenueGenerated", description: "Revenue generated", required: true, sampleValue: "$12,450" },
    ],
  },
  {
    id: "roi-milestone",
    name: "ROI Milestone",
    category: "milestone",
    channels: ["email", "in-app"],
    subject: "Your ROI just hit {{roiPercentage}}!",
    body: "Hi {{firstName}},\n\nGreat news — your return on investment with {{platformName}} has reached {{roiPercentage}}.\n\nInvestment: {{investmentAmount}}\nReturns: {{returnAmount}}\n\nYour strategy is clearly paying off. Let us know if you'd like to explore ways to scale even further.\n\nCheers,\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
      { name: "roiPercentage", description: "ROI percentage", required: true, sampleValue: "340%" },
      { name: "investmentAmount", description: "Total investment", required: true, sampleValue: "$2,000" },
      { name: "returnAmount", description: "Total returns", required: true, sampleValue: "$6,800" },
    ],
  },

  /* ---------- Alert ---------- */
  {
    id: "service-down",
    name: "Service Disruption Alert",
    category: "alert",
    channels: ["email", "sms", "push", "in-app"],
    subject: "Service Disruption: {{serviceName}}",
    body: "Hi {{firstName}},\n\nWe're experiencing an issue with {{serviceName}}. Our team is actively working on a resolution.\n\nImpact: {{impactDescription}}\nEstimated Resolution: {{estimatedResolution}}\n\nWe'll send an update as soon as the issue is resolved. We apologize for the inconvenience.\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "serviceName", description: "Affected service name", required: true, sampleValue: "Review Monitoring" },
      { name: "impactDescription", description: "Description of impact", required: true, sampleValue: "New reviews may be delayed up to 30 minutes" },
      { name: "estimatedResolution", description: "Expected fix time", required: true, sampleValue: "2 hours" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "payment-failed",
    name: "Payment Failed",
    category: "alert",
    channels: ["email", "in-app"],
    subject: "Action Required: Payment Failed",
    body: "Hi {{firstName}},\n\nWe were unable to process your payment of {{paymentAmount}} on {{paymentDate}}.\n\nReason: {{failureReason}}\n\nPlease update your payment method at {{billingUrl}} to avoid any interruption to your service.\n\nIf you believe this is an error, contact us at {{supportEmail}}.\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "paymentAmount", description: "Failed payment amount", required: true, sampleValue: "$99.00" },
      { name: "paymentDate", description: "Date of failed payment", required: true, sampleValue: "March 15, 2026" },
      { name: "failureReason", description: "Reason for failure", required: true, sampleValue: "Card declined" },
      { name: "billingUrl", description: "Billing settings URL", required: true, sampleValue: "https://app.example.com/billing" },
      { name: "supportEmail", description: "Support email address", required: true, sampleValue: "support@example.com" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "usage-limit-approaching",
    name: "Usage Limit Warning",
    category: "alert",
    channels: ["email", "in-app", "push"],
    subject: "Heads up: You've used {{usagePercent}} of your {{resourceName}}",
    body: "Hi {{firstName}},\n\nYou've used {{currentUsage}} of your {{usageLimit}} {{resourceName}} allowance ({{usagePercent}}).\n\nAt your current rate, you'll reach the limit by {{projectedDate}}.\n\nTo avoid interruptions, consider upgrading your plan at {{upgradeUrl}}.\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "usagePercent", description: "Usage percentage", required: true, sampleValue: "85%" },
      { name: "currentUsage", description: "Current usage amount", required: true, sampleValue: "8,500" },
      { name: "usageLimit", description: "Plan usage limit", required: true, sampleValue: "10,000" },
      { name: "resourceName", description: "Resource being tracked", required: true, sampleValue: "API calls" },
      { name: "projectedDate", description: "Projected limit date", required: true, sampleValue: "March 28, 2026" },
      { name: "upgradeUrl", description: "Plan upgrade URL", required: true, sampleValue: "https://app.example.com/upgrade" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },

  /* ---------- Report ---------- */
  {
    id: "weekly-summary",
    name: "Weekly Performance Summary",
    category: "report",
    channels: ["email"],
    subject: "Your Weekly Summary — {{weekRange}}",
    body: "Hi {{firstName}},\n\nHere's your performance summary for {{weekRange}}:\n\n- New Leads: {{newLeads}}\n- New Reviews: {{newReviews}}\n- Conversations: {{conversations}}\n- Revenue: {{weeklyRevenue}}\n\nView the full report at {{reportUrl}}.\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "weekRange", description: "Week date range", required: true, sampleValue: "Mar 17–23, 2026" },
      { name: "newLeads", description: "Leads received this week", required: true, sampleValue: "14" },
      { name: "newReviews", description: "Reviews received this week", required: true, sampleValue: "7" },
      { name: "conversations", description: "Total conversations", required: true, sampleValue: "32" },
      { name: "weeklyRevenue", description: "Revenue this week", required: true, sampleValue: "$3,200" },
      { name: "reportUrl", description: "Full report URL", required: true, sampleValue: "https://app.example.com/reports/weekly" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "monthly-report",
    name: "Monthly Performance Report",
    category: "report",
    channels: ["email"],
    subject: "Your {{monthName}} Performance Report",
    body: "Hi {{firstName}},\n\nYour {{monthName}} report is ready. Here are the highlights:\n\n- Total Leads: {{monthlyLeads}} ({{leadsChange}} vs. last month)\n- Total Reviews: {{monthlyReviews}} ({{reviewsChange}} vs. last month)\n- Total Revenue: {{monthlyRevenue}} ({{revenueChange}} vs. last month)\n- Customer Satisfaction: {{satisfactionScore}}\n\nDownload the full report: {{reportUrl}}\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "monthName", description: "Report month name", required: true, sampleValue: "February 2026" },
      { name: "monthlyLeads", description: "Total leads this month", required: true, sampleValue: "62" },
      { name: "leadsChange", description: "Leads change vs last month", required: true, sampleValue: "+15%" },
      { name: "monthlyReviews", description: "Total reviews this month", required: true, sampleValue: "28" },
      { name: "reviewsChange", description: "Reviews change vs last month", required: true, sampleValue: "+8%" },
      { name: "monthlyRevenue", description: "Total revenue this month", required: true, sampleValue: "$14,200" },
      { name: "revenueChange", description: "Revenue change vs last month", required: true, sampleValue: "+22%" },
      { name: "satisfactionScore", description: "Customer satisfaction score", required: true, sampleValue: "4.7/5" },
      { name: "reportUrl", description: "Full report download URL", required: true, sampleValue: "https://app.example.com/reports/monthly" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "quarterly-review-invite",
    name: "Quarterly Review Invitation",
    category: "report",
    channels: ["email"],
    subject: "Let's Review Your Q{{quarter}} Results",
    body: "Hi {{firstName}},\n\nIt's time for your quarterly business review. We'd love to walk you through your Q{{quarter}} results and discuss strategy for the quarter ahead.\n\nKey metrics to discuss:\n- Leads: {{quarterlyLeads}}\n- Revenue: {{quarterlyRevenue}}\n- ROI: {{quarterlyRoi}}\n\nPlease book a time that works for you: {{bookingUrl}}\n\nLooking forward to it!\n{{accountManager}}",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "quarter", description: "Quarter number", required: true, sampleValue: "1" },
      { name: "quarterlyLeads", description: "Leads this quarter", required: true, sampleValue: "187" },
      { name: "quarterlyRevenue", description: "Revenue this quarter", required: true, sampleValue: "$42,600" },
      { name: "quarterlyRoi", description: "ROI this quarter", required: true, sampleValue: "285%" },
      { name: "bookingUrl", description: "Calendar booking URL", required: true, sampleValue: "https://cal.example.com/review" },
      { name: "accountManager", description: "Account manager name", required: true, sampleValue: "Jordan Lee" },
    ],
  },

  /* ---------- Support ---------- */
  {
    id: "ticket-received",
    name: "Support Ticket Received",
    category: "support",
    channels: ["email", "in-app"],
    subject: "We received your request — Ticket #{{ticketId}}",
    body: "Hi {{firstName}},\n\nWe've received your support request and assigned it ticket #{{ticketId}}.\n\nSubject: {{ticketSubject}}\nPriority: {{ticketPriority}}\nEstimated Response: {{responseTime}}\n\nYou can track the status at {{ticketUrl}}.\n\nThe {{platformName}} Support Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "ticketId", description: "Support ticket ID", required: true, sampleValue: "SUP-4829" },
      { name: "ticketSubject", description: "Ticket subject line", required: true, sampleValue: "Unable to export monthly report" },
      { name: "ticketPriority", description: "Ticket priority level", required: true, sampleValue: "High" },
      { name: "responseTime", description: "Expected response time", required: true, sampleValue: "Within 4 hours" },
      { name: "ticketUrl", description: "Ticket tracking URL", required: true, sampleValue: "https://app.example.com/support/SUP-4829" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "ticket-resolved",
    name: "Support Ticket Resolved",
    category: "support",
    channels: ["email", "in-app"],
    subject: "Ticket #{{ticketId}} has been resolved",
    body: "Hi {{firstName}},\n\nYour support ticket #{{ticketId}} has been resolved.\n\nSubject: {{ticketSubject}}\nResolution: {{resolution}}\n\nIf the issue persists, reply to this message or reopen the ticket at {{ticketUrl}}.\n\nWe appreciate your patience.\nThe {{platformName}} Support Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "ticketId", description: "Support ticket ID", required: true, sampleValue: "SUP-4829" },
      { name: "ticketSubject", description: "Ticket subject line", required: true, sampleValue: "Unable to export monthly report" },
      { name: "resolution", description: "How the ticket was resolved", required: true, sampleValue: "Export functionality restored after server patch" },
      { name: "ticketUrl", description: "Ticket tracking URL", required: true, sampleValue: "https://app.example.com/support/SUP-4829" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "feedback-request",
    name: "Feedback Request",
    category: "support",
    channels: ["email", "in-app"],
    subject: "How did we do? Ticket #{{ticketId}}",
    body: "Hi {{firstName}},\n\nYour recent support ticket #{{ticketId}} was resolved. We'd love to hear how we did.\n\nPlease take a moment to rate your experience: {{feedbackUrl}}\n\nYour feedback helps us improve our support for everyone.\n\nThank you,\nThe {{platformName}} Support Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "ticketId", description: "Support ticket ID", required: true, sampleValue: "SUP-4829" },
      { name: "feedbackUrl", description: "Feedback form URL", required: true, sampleValue: "https://app.example.com/feedback/SUP-4829" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },

  /* ---------- Upsell ---------- */
  {
    id: "new-feature-announcement",
    name: "New Feature Announcement",
    category: "upsell",
    channels: ["email", "in-app", "push"],
    subject: "New Feature: {{featureName}}",
    body: "Hi {{firstName}},\n\nWe're excited to announce a new feature: {{featureName}}.\n\n{{featureDescription}}\n\nThis is available on the {{requiredPlan}} plan and above. Learn more at {{featureUrl}}.\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "featureName", description: "Name of the new feature", required: true, sampleValue: "AI Review Responses" },
      { name: "featureDescription", description: "Feature description", required: true, sampleValue: "Automatically generate personalized responses to customer reviews using AI." },
      { name: "requiredPlan", description: "Minimum plan required", required: true, sampleValue: "Professional" },
      { name: "featureUrl", description: "Feature details URL", required: true, sampleValue: "https://app.example.com/features/ai-responses" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "upgrade-suggestion",
    name: "Upgrade Suggestion",
    category: "upsell",
    channels: ["email", "in-app"],
    subject: "Unlock more with {{suggestedPlan}}",
    body: "Hi {{firstName}},\n\nYou've been getting great results on your {{currentPlan}} plan. Based on your usage, upgrading to {{suggestedPlan}} could help you:\n\n{{upgradeBenefits}}\n\nThe upgrade is {{priceDifference}}/month. See full details at {{upgradeUrl}}.\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "currentPlan", description: "Current plan name", required: true, sampleValue: "Starter" },
      { name: "suggestedPlan", description: "Suggested plan name", required: true, sampleValue: "Professional" },
      { name: "upgradeBenefits", description: "Benefits of upgrading", required: true, sampleValue: "- Unlimited leads\n- AI-powered review responses\n- Priority support" },
      { name: "priceDifference", description: "Additional monthly cost", required: true, sampleValue: "$50" },
      { name: "upgradeUrl", description: "Upgrade page URL", required: true, sampleValue: "https://app.example.com/upgrade" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "addon-recommendation",
    name: "Add-On Recommendation",
    category: "upsell",
    channels: ["email", "in-app"],
    subject: "Recommended for you: {{addonName}}",
    body: "Hi {{firstName}},\n\nBased on your activity, we think you'd benefit from the {{addonName}} add-on.\n\n{{addonDescription}}\n\nPrice: {{addonPrice}}/month\n\nClients who added this saw an average {{addonImpact}}.\n\nLearn more: {{addonUrl}}\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "addonName", description: "Add-on name", required: true, sampleValue: "SMS Campaigns" },
      { name: "addonDescription", description: "Add-on description", required: true, sampleValue: "Send targeted SMS campaigns to your customer list with automated follow-ups." },
      { name: "addonPrice", description: "Add-on monthly price", required: true, sampleValue: "$29" },
      { name: "addonImpact", description: "Average impact statistic", required: true, sampleValue: "23% increase in repeat bookings" },
      { name: "addonUrl", description: "Add-on details URL", required: true, sampleValue: "https://app.example.com/addons/sms-campaigns" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
    ],
  },
  {
    id: "referral-program",
    name: "Referral Program Invitation",
    category: "upsell",
    channels: ["email"],
    subject: "Earn {{referralReward}} for every referral",
    body: "Hi {{firstName}},\n\nLove {{platformName}}? Share it with your network and earn {{referralReward}} for every business that signs up using your link.\n\nYour referral link: {{referralUrl}}\n\nThere's no limit to how many referrals you can make. Start sharing today!\n\nThe {{platformName}} Team",
    variables: [
      { name: "firstName", description: "Client first name", required: true, sampleValue: "Alex" },
      { name: "platformName", description: "Platform name", required: true, sampleValue: "Sovereign AI" },
      { name: "referralReward", description: "Reward per referral", required: true, sampleValue: "$50 credit" },
      { name: "referralUrl", description: "Unique referral link", required: true, sampleValue: "https://app.example.com/refer/abc123" },
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Helper: extract variable names from template text                  */
/* ------------------------------------------------------------------ */

function extractVariableNames(text: string): readonly string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) {
    return [];
  }
  const names = new Set(
    matches.map((m) => m.replace(/\{\{|\}\}/g, ""))
  );
  return Array.from(names);
}

/* ------------------------------------------------------------------ */
/*  renderTemplate                                                     */
/* ------------------------------------------------------------------ */

/**
 * Replace all `{{variable}}` placeholders in a template's subject and
 * body with the corresponding values from `data`.
 *
 * Throws if a required variable is missing from `data`.
 */
export function renderTemplate(
  template: CommTemplate,
  data: Record<string, string>
): RenderedTemplate {
  const validation = validateTemplateData(template, data);
  if (!validation.valid) {
    throw new Error(
      `Missing required variables: ${validation.missingVariables.join(", ")}`
    );
  }

  const replacer = (_match: string, varName: string): string =>
    data[varName] ?? "";

  return {
    templateId: template.id,
    subject: template.subject.replace(/\{\{(\w+)\}\}/g, replacer),
    body: template.body.replace(/\{\{(\w+)\}\}/g, replacer),
  };
}

/* ------------------------------------------------------------------ */
/*  getTemplatesForCategory                                            */
/* ------------------------------------------------------------------ */

/** Return all templates belonging to the given category. */
export function getTemplatesForCategory(
  category: CommCategory
): readonly CommTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

/* ------------------------------------------------------------------ */
/*  getTemplatesForChannel                                             */
/* ------------------------------------------------------------------ */

/** Return all templates that support the given channel. */
export function getTemplatesForChannel(
  channel: CommChannel
): readonly CommTemplate[] {
  return TEMPLATES.filter((t) =>
    (t.channels as readonly string[]).includes(channel)
  );
}

/* ------------------------------------------------------------------ */
/*  validateTemplateData                                               */
/* ------------------------------------------------------------------ */

/**
 * Check whether `data` contains every required variable defined in the
 * template and report any extra keys that are not declared.
 */
export function validateTemplateData(
  template: CommTemplate,
  data: Record<string, string>
): TemplateValidationResult {
  const requiredNames = template.variables
    .filter((v) => v.required)
    .map((v) => v.name);

  const allDeclaredNames = new Set(template.variables.map((v) => v.name));

  /* Also gather variable names that appear in the text but may not be
     declared in the variables array (defensive). */
  const textVarNames = extractVariableNames(
    `${template.subject} ${template.body}`
  );
  textVarNames.forEach((n) => {
    allDeclaredNames.add(n);
  });

  const providedNames = new Set(Object.keys(data));

  const missingVariables = requiredNames.filter(
    (name) => !providedNames.has(name)
  );

  const extraVariables = Array.from(providedNames).filter(
    (name) => !allDeclaredNames.has(name)
  );

  return {
    valid: missingVariables.length === 0,
    missingVariables,
    extraVariables,
  };
}

/* ------------------------------------------------------------------ */
/*  previewTemplate                                                    */
/* ------------------------------------------------------------------ */

/**
 * Render a template using the sample values defined in its variable
 * definitions, producing a realistic preview without requiring real data.
 */
export function previewTemplate(template: CommTemplate): RenderedTemplate {
  const sampleData: Record<string, string> = {};
  for (const v of template.variables) {
    sampleData[v.name] = v.sampleValue;
  }
  return renderTemplate(template, sampleData);
}
