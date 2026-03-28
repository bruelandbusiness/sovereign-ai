import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AtRiskCustomer {
  customerEmail: string;
  customerName: string;
  lastJobDate: string | null;
  totalRevenue: number; // cents
  totalJobs: number;
  churnRisk: "high" | "medium" | "low";
  reason: string;
  recommendedAction: string;
}

export interface AtRiskCustomersResult {
  atRiskCustomers: AtRiskCustomer[];
  summary: string;
  totalAtRisk: number;
  totalRevenueAtRisk: number; // cents
}

export interface ReactivationCampaignResult {
  subject: string;
  emailBody: string;
  smsMessage: string;
  offer: string;
  segment: string;
  campaignId: string;
}

// ---------------------------------------------------------------------------
// identifyAtRiskCustomers — find churn risks
// ---------------------------------------------------------------------------

/**
 * Analyze customer data to identify customers at risk of churning.
 *
 * Queries CustomerLifetimeValue records and analyzes recency, frequency,
 * and monetary (RFM) signals to flag at-risk customers. Uses Claude
 * to generate recommendations for each at-risk customer.
 *
 * @param clientId - The client to analyze
 */
export async function identifyAtRiskCustomers(
  clientId: string
): Promise<AtRiskCustomersResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Get all customer LTV records
  const customers = await prisma.customerLifetimeValue.findMany({
    where: { clientId },
    orderBy: { lastJobDate: "asc" },
  });

  // Also get leads with "won" status that have been quiet
  const wonLeads = await prisma.lead.findMany({
    where: { clientId, status: "won" },
    select: { name: true, email: true, phone: true, value: true, updatedAt: true },
  });

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Classify customers by churn risk based on recency
  const atRiskRaw: AtRiskCustomer[] = [];

  for (const customer of customers) {
    const lastJob = customer.lastJobDate;
    let churnRisk: "high" | "medium" | "low" = "low";
    let reason = "";

    if (!lastJob || lastJob < oneEightyDaysAgo) {
      churnRisk = "high";
      reason = lastJob
        ? `No activity in ${Math.round((now.getTime() - lastJob.getTime()) / (1000 * 60 * 60 * 24))} days.`
        : "No recorded job history.";
    } else if (lastJob < ninetyDaysAgo) {
      churnRisk = "medium";
      reason = `Last service was ${Math.round((now.getTime() - lastJob.getTime()) / (1000 * 60 * 60 * 24))} days ago.`;
    }

    if (churnRisk !== "low") {
      atRiskRaw.push({
        customerEmail: customer.customerEmail,
        customerName: customer.customerName || customer.customerEmail,
        lastJobDate: lastJob ? lastJob.toISOString().split("T")[0] : null,
        totalRevenue: customer.totalRevenue,
        totalJobs: customer.totalJobs,
        churnRisk,
        reason,
        recommendedAction: "", // Will be filled by AI
      });
    }
  }

  // Add won leads not in CustomerLifetimeValue that have gone quiet
  for (const lead of wonLeads) {
    if (lead.email && !atRiskRaw.some((c) => c.customerEmail === lead.email)) {
      if (lead.updatedAt < ninetyDaysAgo) {
        atRiskRaw.push({
          customerEmail: lead.email,
          customerName: lead.name,
          lastJobDate: lead.updatedAt.toISOString().split("T")[0],
          totalRevenue: lead.value || 0,
          totalJobs: 1,
          churnRisk: lead.updatedAt < oneEightyDaysAgo ? "high" : "medium",
          reason: `Won lead with no recent activity (${Math.round((now.getTime() - lead.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} days).`,
          recommendedAction: "",
        });
      }
    }
  }

  const totalAtRisk = atRiskRaw.length;
  const totalRevenueAtRisk = atRiskRaw.reduce((sum, c) => sum + c.totalRevenue, 0);

  if (totalAtRisk === 0) {
    return {
      atRiskCustomers: [],
      summary: `No at-risk customers identified for ${client.businessName}. All customers have been active within the last 90 days.`,
      totalAtRisk: 0,
      totalRevenueAtRisk: 0,
    };
  }

  // Use Claude to generate recommendations for the top at-risk customers
  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);

  const topAtRisk = atRiskRaw.slice(0, 15); // Limit to top 15 for the prompt

  const customerList = topAtRisk
    .map(
      (c, i) =>
        `${i + 1}. ${c.customerName} | Last service: ${c.lastJobDate || "unknown"} | Revenue: $${(c.totalRevenue / 100).toFixed(2)} | Jobs: ${c.totalJobs} | Risk: ${c.churnRisk} | ${c.reason}`
    )
    .join("\n");

  const systemPrompt = `You are a customer retention specialist for local ${safeVertical} businesses. You identify why customers go dormant and create specific, actionable strategies to win them back.`;

  const userPrompt = `Here are at-risk customers for ${safeBusinessName}:

${customerList}

For each customer, suggest a specific reactivation action.

Return a JSON object with:
- "summary": 2-3 sentence summary of the churn risk situation
- "recommendations": Array of objects (one per customer) with:
  - "customerEmail": the customer's email
  - "recommendedAction": specific action to take (e.g., "Send seasonal AC tune-up reminder with 15% discount", "Personal call from owner to check in")`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "ltv.atRisk",
      description: `Identify at-risk customers for ${safeBusinessName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      summary?: string;
      recommendations?: Array<{ customerEmail: string; recommendedAction: string }>;
    }>(response, {});

    // Merge AI recommendations into at-risk data
    if (Array.isArray(parsed.recommendations)) {
      for (const rec of parsed.recommendations) {
        const customer = atRiskRaw.find((c) => c.customerEmail === rec.customerEmail);
        if (customer) {
          customer.recommendedAction = rec.recommendedAction;
        }
      }
    }

    // Fill in any missing recommendations with defaults
    for (const customer of atRiskRaw) {
      if (!customer.recommendedAction) {
        customer.recommendedAction =
          customer.churnRisk === "high"
            ? "Send a personal re-engagement email with a special returning customer offer."
            : "Send a maintenance reminder or seasonal check-up offer.";
      }
    }

    const summary =
      parsed.summary ||
      `${totalAtRisk} customers identified as at-risk for ${client.businessName}, representing $${(totalRevenueAtRisk / 100).toFixed(0)} in lifetime revenue. ${atRiskRaw.filter((c) => c.churnRisk === "high").length} are high-risk and need immediate outreach.`;

    // Update CustomerLifetimeValue records with churn risk
    for (const customer of atRiskRaw) {
      try {
        await prisma.customerLifetimeValue.updateMany({
          where: { clientId, customerEmail: customer.customerEmail },
          data: { churnRisk: customer.churnRisk, segment: "at-risk" },
        });
      } catch {
        // Non-critical
      }
    }

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "email_sent",
        title: `${totalAtRisk} at-risk customers identified`,
        description: summary,
      },
    });

    return {
      atRiskCustomers: atRiskRaw,
      summary,
      totalAtRisk,
      totalRevenueAtRisk,
    };
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[ltv-activator] At-risk identification failed:", error);

    // Fill fallback recommendations
    for (const customer of atRiskRaw) {
      customer.recommendedAction =
        customer.churnRisk === "high"
          ? "Send a personal re-engagement email with a special returning customer offer."
          : "Send a maintenance reminder or seasonal check-up offer.";
    }

    return {
      atRiskCustomers: atRiskRaw,
      summary: `${totalAtRisk} at-risk customers identified, representing $${(totalRevenueAtRisk / 100).toFixed(0)} in lifetime revenue.`,
      totalAtRisk,
      totalRevenueAtRisk,
    };
  }
}

// ---------------------------------------------------------------------------
// generateReactivationCampaign — win-back campaign for dormant customers
// ---------------------------------------------------------------------------

/**
 * Generate a win-back campaign for a specific segment of dormant customers.
 *
 * Creates both email and SMS messaging, along with a compelling offer
 * to bring customers back.
 *
 * Creates an EmailCampaign record in "draft" status.
 *
 * @param clientId - The client to generate for
 * @param segment  - Description of the customer segment (e.g., "customers inactive 6+ months", "past AC repair customers")
 */
export async function generateReactivationCampaign(
  clientId: string,
  segment: string
): Promise<ReactivationCampaignResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeSegment = sanitizeForPrompt(segment, 300);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are a customer reactivation specialist for local ${safeVertical} businesses. You write win-back campaigns that feel personal and genuine — not desperate or spammy. Focus on providing value and making it easy for customers to come back.`;

  const userPrompt = `Create a reactivation/win-back campaign for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Target segment: ${safeSegment}
Owner: ${safeOwnerName}
Industry: ${safeVertical}

Create a multi-channel win-back campaign with:

1. EMAIL: Subject + HTML body (simple tags only)
   - Personal tone from ${safeOwnerName}
   - Acknowledge it's been a while (without guilt-tripping)
   - Share what's new or improved
   - Include a compelling offer/incentive
   - Clear CTA to book/call
   - Under 200 words

2. SMS: Short text message (under 160 chars)
   - Quick, personal, with an offer
   - Include business name and CTA

3. OFFER: A specific, compelling offer to drive action

Return a JSON object with:
- "subject": email subject line
- "emailBody": HTML email body (simple tags: h2, p, strong, a, br)
- "smsMessage": SMS text (under 160 chars)
- "offer": description of the offer/incentive`;

  let subject: string;
  let emailBody: string;
  let smsMessage: string;
  let offer: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "ltv.reactivation",
      description: `Generate reactivation campaign for: ${safeSegment}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      subject?: string;
      emailBody?: string;
      smsMessage?: string;
      offer?: string;
    }>(response, {});

    subject = parsed.subject || `We miss you at ${client.businessName}!`;
    emailBody =
      parsed.emailBody ||
      generateFallbackReactivationEmail(client.businessName, client.ownerName, client.vertical || "home service");
    smsMessage =
      parsed.smsMessage ||
      `Hi! It's ${client.ownerName} from ${client.businessName}. We'd love to have you back — book this week and get 15% off! Reply YES to schedule.`;
    offer = parsed.offer || "15% off your next service as a valued returning customer.";
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[ltv-activator] Reactivation campaign generation failed:", error);
    subject = `We miss you at ${client.businessName}!`;
    emailBody = generateFallbackReactivationEmail(
      client.businessName,
      client.ownerName,
      client.vertical || "home service"
    );
    smsMessage = `Hi! It's ${client.ownerName} from ${client.businessName}. We'd love to have you back — book this week and get 15% off! Reply YES to schedule.`;
    offer = "15% off your next service as a valued returning customer.";
  }

  // Create an EmailCampaign record
  const campaign = await prisma.emailCampaign.create({
    data: {
      clientId,
      name: `Win-Back: ${segment.slice(0, 60)}`,
      subject,
      body: emailBody,
      type: "reengagement",
      status: "draft",
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "email_sent",
      title: `Reactivation campaign created`,
      description: `Win-back campaign generated for "${segment}" with email, SMS, and offer: ${offer}`,
    },
  });

  return {
    subject,
    emailBody,
    smsMessage,
    offer,
    segment,
    campaignId: campaign.id,
  };
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackReactivationEmail(
  businessName: string,
  ownerName: string,
  vertical: string
): string {
  const cta = `<p style="text-align:center;margin:24px 0"><a href="#" style="background:#4c85ff;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Book Your Service</a></p>`;

  return `<h2>It's Been a While!</h2>
<p>Hi there,</p>
<p>This is ${ownerName} from ${businessName}. I noticed it's been a while since we last helped you with your ${vertical} needs, and I wanted to personally check in.</p>
<p>A lot has happened since your last visit — we've expanded our services, added new team members, and improved our processes to serve you even better.</p>
<p><strong>As a valued returning customer, we'd like to offer you 15% off your next service.</strong> Whether you need routine maintenance, a repair, or a new project, we're ready to help.</p>
${cta}
<p>We hope to see you again soon!</p>
<p>Best regards,<br/>${ownerName}<br/>${businessName}</p>`;
}
