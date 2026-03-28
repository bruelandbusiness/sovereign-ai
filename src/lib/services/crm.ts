import { prisma } from "@/lib/db";
import { createNotificationForClient } from "@/lib/notifications";
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

export interface LeadScoreResult {
  score: number; // 0-100
  stage: "hot" | "warm" | "cold";
  reasoning: string;
  nextBestAction: string;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    detail: string;
  }>;
}

export interface FollowUpMessageResult {
  message: string;
  subject?: string; // for email channel
  channel: string;
  tone: string;
  leadName: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the CRM service for a client.
 * Sets up pipeline stages, configures automated follow-ups, and creates
 * a sample lead so the CRM dashboard isn't empty on first login.
 */
export async function provisionCRM(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const crmConfig = {
    pipelineStages: ["new", "qualified", "appointment", "proposal", "won", "lost"],
    autoFollowUp: true,
    followUpDelayHours: 24,
    autoTagEnabled: true,
    deduplicationEnabled: true,
    leadRotation: false,
    notifyOnStageChange: true,
  };

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "crm" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(crmConfig) },
    });
  }

  const existingLead = await prisma.lead.findFirst({
    where: { clientId },
  });

  if (!existingLead) {
    await prisma.lead.create({
      data: {
        clientId,
        name: "Sample Customer (Demo)",
        email: "demo-customer@example.com",
        phone: "(555) 000-0001",
        source: "website",
        status: "qualified",
        stage: "warm",
        score: 85,
        value: 500000,
        notes: "This is a sample CRM entry. Your real customer data will appear here as leads convert.",
      },
    });
  }

  const existingSequence = await prisma.followUpSequence.findFirst({
    where: { clientId },
  });

  if (!existingSequence) {
    await prisma.followUpSequence.create({
      data: {
        clientId,
        name: "New Lead Welcome Sequence",
        triggerType: "lead_captured",
        isActive: true,
        steps: JSON.stringify([
          { delayHours: 0, channel: "email", template: "welcome" },
          { delayHours: 24, channel: "sms", template: "follow_up_1" },
          { delayHours: 72, channel: "email", template: "follow_up_2" },
          { delayHours: 168, channel: "email", template: "check_in" },
        ]),
      },
    });
  }

  await createNotificationForClient(clientId, {
    type: "service",
    title: "CRM Ready",
    message:
      "Your CRM is now active. All leads will be tracked, scored, and automatically nurtured through your pipeline.",
    actionUrl: "/dashboard/leads",
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "CRM activated",
      description: `Customer relationship management is now live for ${client.businessName}. Leads will be automatically tracked, followed up, and moved through your pipeline.`,
    },
  });
}

// ---------------------------------------------------------------------------
// scoreAndPrioritizeLead — AI-powered lead scoring
// ---------------------------------------------------------------------------

/**
 * Score and prioritize a lead using AI analysis of all available data.
 *
 * Analyzes the lead's source, engagement history, contact info completeness,
 * response time, and notes to assign a score and stage.
 *
 * Updates the Lead record with the new score and stage.
 *
 * @param clientId - The client who owns the lead
 * @param leadId   - The lead to score
 */
export async function scoreAndPrioritizeLead(
  clientId: string,
  leadId: string
): Promise<LeadScoreResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const lead = await prisma.lead.findFirstOrThrow({
    where: { id: leadId, clientId },
  });

  // Gather context about the lead
  const bookings = await prisma.booking.findMany({
    where: { clientId, customerEmail: lead.email || undefined },
    select: { status: true, serviceType: true, startsAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const conversationThreads = await prisma.conversationThread.findMany({
    where: {
      clientId,
      OR: [
        { contactEmail: lead.email || undefined },
        { contactPhone: lead.phone || undefined },
      ].filter((c) => Object.values(c)[0] !== undefined),
    },
    select: { channel: true, lastMessageAt: true, status: true },
    take: 5,
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);

  // Calculate time-based factors
  const hoursSinceCreation =
    (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60);
  const daysSinceLastContact = lead.lastContactedAt
    ? (Date.now() - lead.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
    : null;

  const leadData = `
Lead: ${lead.name}
Email: ${lead.email || "Not provided"}
Phone: ${lead.phone || "Not provided"}
Source: ${lead.source}
Current Status: ${lead.status}
Current Stage: ${lead.stage || "unset"}
Estimated Value: $${lead.value ? (lead.value / 100).toFixed(2) : "unknown"}
Notes: ${lead.notes || "None"}
Created: ${hoursSinceCreation.toFixed(0)} hours ago
Last Contacted: ${daysSinceLastContact !== null ? `${daysSinceLastContact.toFixed(0)} days ago` : "Never"}
Next Follow-Up: ${lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString() : "Not set"}
Bookings: ${bookings.length > 0 ? bookings.map((b) => `${b.serviceType} (${b.status})`).join(", ") : "None"}
Conversations: ${conversationThreads.length > 0 ? conversationThreads.map((c) => `${c.channel} (${c.status})`).join(", ") : "None"}
`.trim();

  const systemPrompt = `You are a CRM and sales expert for local ${safeVertical} businesses. You score leads based on their likelihood to convert, considering data quality, engagement signals, source quality, and timing. Be specific and actionable in your assessments.`;

  const userPrompt = `Score and prioritize this lead for ${safeBusinessName}:

${leadData}

Evaluate the lead on these factors:
1. Contact info completeness (email + phone = higher quality)
2. Source quality (referral > phone > website > chatbot)
3. Engagement level (bookings, conversations, response time)
4. Recency (newer leads are more engaged)
5. Estimated deal value
6. Follow-up status

Return a JSON object with:
- "score": 0-100 lead score
- "stage": "hot" (score 70+, ready to close), "warm" (score 40-69, needs nurturing), or "cold" (score 0-39, low priority)
- "reasoning": 2-3 sentence explanation of the score
- "nextBestAction": Specific next step to take with this lead
- "factors": Array of scoring factors, each with "factor" (name), "impact" ("positive"/"negative"/"neutral"), "detail" (brief explanation)`;

  let result: LeadScoreResult;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "crm.scoring",
      description: `Score lead: ${lead.name}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<LeadScoreResult>>(response, {});

    const score = typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : calculateFallbackScore(lead, bookings.length);
    const stage = parsed.stage || (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold");

    result = {
      score,
      stage: stage as "hot" | "warm" | "cold",
      reasoning: parsed.reasoning || `Lead scored ${score}/100 based on available data.`,
      nextBestAction: parsed.nextBestAction || "Follow up within 24 hours with a personalized message.",
      factors: Array.isArray(parsed.factors) ? parsed.factors : [],
    };
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[crm] Lead scoring failed:", error);

    const score = calculateFallbackScore(lead, bookings.length);
    result = {
      score,
      stage: score >= 70 ? "hot" : score >= 40 ? "warm" : "cold",
      reasoning: `Lead scored ${score}/100 based on contact completeness, source quality, and engagement level.`,
      nextBestAction: score >= 70 ? "Call immediately to close." : score >= 40 ? "Send a follow-up email with a personalized offer." : "Add to nurture sequence.",
      factors: [],
    };
  }

  // Update the lead record with the new score and stage
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score: result.score,
      stage: result.stage,
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "lead_captured",
      title: `Lead scored: ${lead.name} (${result.score}/100)`,
      description: `${lead.name} scored ${result.score}/100 — stage: ${result.stage}. ${result.nextBestAction}`,
    },
  });

  return result;
}

// ---------------------------------------------------------------------------
// generateFollowUpMessage — context-aware follow-up
// ---------------------------------------------------------------------------

/**
 * Generate a context-aware follow-up message for a lead, optimized
 * for the specified communication channel.
 *
 * @param clientId - The client who owns the lead
 * @param leadId   - The lead to follow up with
 * @param channel  - "email" | "sms" | "call" (for call scripts)
 */
export async function generateFollowUpMessage(
  clientId: string,
  leadId: string,
  channel: string
): Promise<FollowUpMessageResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const lead = await prisma.lead.findFirstOrThrow({
    where: { id: leadId, clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeLeadName = sanitizeForPrompt(lead.name, 100);
  const safeChannel = sanitizeForPrompt(channel.toLowerCase(), 20);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const daysSinceCreation = Math.round(
    (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysSinceLastContact = lead.lastContactedAt
    ? Math.round((Date.now() - lead.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const channelGuide: Record<string, string> = {
    email: `Write a professional email follow-up:
- Subject line under 50 characters (personal, not salesy)
- Body: 3-5 sentences max
- Reference their specific interest/need if known
- Include a clear CTA (schedule a call, get a quote, etc.)
- Sign off as ${safeOwnerName}, ${safeBusinessName}`,

    sms: `Write an SMS follow-up:
- Under 160 characters
- Casual, conversational tone
- Include the business name
- One clear CTA
- No formal salutations`,

    call: `Write a phone call script:
- Opening: introduce yourself and reference why you're calling
- Bridge: acknowledge their inquiry and offer to help
- Value: mention one key benefit of working with ${safeBusinessName}
- Close: suggest scheduling an estimate or appointment
- Objection handlers for common pushbacks (price, timing, "just looking")`,
  };

  const guide = channelGuide[safeChannel] || channelGuide["email"];

  const systemPrompt = `You are a sales communication expert for local ${safeVertical} businesses. You write follow-up messages that feel personal and helpful, not pushy or automated. Your goal is to advance the lead toward booking a service.`;

  const userPrompt = `Write a ${safeChannel} follow-up message for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Lead info:
- Name: ${safeLeadName}
- Source: ${lead.source}
- Status: ${lead.status}
- Stage: ${lead.stage || "unknown"}
- Score: ${lead.score || "unscored"}
- Notes: ${lead.notes || "None"}
- Days since inquiry: ${daysSinceCreation}
- Last contacted: ${daysSinceLastContact !== null ? `${daysSinceLastContact} days ago` : "Never"}

${guide}

Return a JSON object with:
- "message": the complete follow-up message
${safeChannel === "email" ? '- "subject": the email subject line' : ""}
- "tone": the tone used (e.g., "friendly", "professional", "urgent")`;

  let message: string;
  let subject: string | undefined;
  let tone: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "crm.followup",
      description: `Generate ${safeChannel} follow-up for ${safeLeadName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      message?: string;
      subject?: string;
      tone?: string;
    }>(response, {});

    message = parsed.message || "";
    subject = parsed.subject;
    tone = parsed.tone || "professional";
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[crm] Follow-up generation failed:", error);
    message = "";
    tone = "professional";
  }

  if (!message) {
    if (channel === "sms") {
      message = `Hi ${lead.name}, this is ${client.ownerName} from ${client.businessName}. Following up on your inquiry — do you have a few minutes to chat about your ${client.vertical || "project"}? Happy to help!`;
    } else if (channel === "call") {
      message = `Hi ${lead.name}, this is ${client.ownerName} from ${client.businessName}. I'm calling about your recent inquiry. I wanted to see if you had any questions and if we can schedule a time to come out and give you a free estimate.`;
    } else {
      subject = `Following up on your ${client.vertical || "service"} inquiry — ${client.businessName}`;
      message = `Hi ${lead.name},\n\nThank you for your interest in ${client.businessName}. I wanted to follow up personally and see if you have any questions about our ${client.vertical || "services"}.\n\nWe'd love to schedule a free estimate at your convenience. Just reply to this email or call us at ${client.phone || "our office"}.\n\nBest regards,\n${client.ownerName}\n${client.businessName}`;
    }
  }

  // Update lead's last contacted timestamp
  await prisma.lead.update({
    where: { id: leadId },
    data: { lastContactedAt: new Date() },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "lead_captured",
      title: `Follow-up sent: ${lead.name} (${channel})`,
      description: `AI-generated ${channel} follow-up message created for ${lead.name} (${lead.stage || lead.status} lead).`,
    },
  });

  return {
    message,
    subject,
    channel,
    tone,
    leadName: lead.name,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateFallbackScore(
  lead: { email: string | null; phone: string | null; source: string; status: string; value: number | null },
  bookingCount: number
): number {
  let score = 30; // base score

  // Contact completeness
  if (lead.email) score += 10;
  if (lead.phone) score += 15;

  // Source quality
  const sourceScores: Record<string, number> = {
    referral: 20,
    phone: 15,
    voice: 15,
    website: 10,
    chatbot: 10,
    form: 8,
  };
  score += sourceScores[lead.source] || 5;

  // Status progression
  if (lead.status === "qualified") score += 10;
  if (lead.status === "appointment") score += 20;

  // Has bookings
  if (bookingCount > 0) score += 15;

  // Has value estimate
  if (lead.value && lead.value > 0) score += 5;

  return Math.min(100, score);
}
