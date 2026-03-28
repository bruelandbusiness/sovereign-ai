import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { extractJSONContent, sanitizeForPrompt } from "@/lib/ai-utils";
import { logger } from "@/lib/logger";

const TAG = "[outreach-personalization]";

const AI_MODEL =
  process.env.CLAUDE_OUTREACH_MODEL || "claude-haiku-4-5-20251001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PersonalizationParams {
  contractorName?: string;
  contactName?: string;
  businessDetails?: string;
  propertyDetails?: string;
  reviewSnippet?: string;
  neighborhood?: string;
  serviceArea?: string;
  vertical: string;
  channel: "email" | "sms";
  contractorPhone?: string;
  contractorAddress?: string;
  brandVoice?: string;
}

export interface PersonalizedContent {
  subject?: string;
  body: string;
  personalization_used: string[];
  tone: "friendly" | "professional" | "urgent";
  // Legacy compat
  subjectLine?: string;
  openingLine: string;
  valueProposition: string;
  callToAction: string;
  fullMessage: string;
}

// ---------------------------------------------------------------------------
// Personalization generator
// ---------------------------------------------------------------------------

function buildSystemPrompt(params: PersonalizationParams): string {
  const contractorName = params.contractorName || "our company";
  const serviceArea = params.serviceArea || "your area";

  return `You are writing a personalized outreach message from ${contractorName}, a ${params.vertical} company in ${serviceArea}.

The message is going to a homeowner who may need ${params.vertical} work. Here's what we know about them:
{lead_data}

Rules:
- Maximum 3 sentences for SMS, 5 sentences for email
- Open with something specific to THEM (their neighborhood, their home's age, the season)
- Mention one specific benefit relevant to their situation
- End with a clear, simple CTA (call this number, reply to schedule)
- Sound like a friendly local business, not a corporation
- Never be pushy, aggressive, or use false urgency
- Never claim to know they have a problem — use soft language ("homes in [neighborhood] built in the [decade] often benefit from...")
- Always include the contractor's real phone number and business name
${params.brandVoice ? `- Match the contractor's brand voice: ${params.brandVoice}` : ""}
- Never use the words: revolutionary, game-changing, cutting-edge, leverage, synergy, unlock, empower
- Write at an 8th grade reading level
- Maximum 150 words. Shorter is better.

For email, also include:
- A clear subject line (under 50 characters, no ALL CAPS, no spam triggers)
${params.contractorAddress ? `- The contractor's physical address in footer: ${params.contractorAddress}` : "- The contractor's physical address in footer"}
- Unsubscribe link

Output as JSON (no markdown fences):
{
  "subject": "email subject (email only, omit for SMS)",
  "body": "the message",
  "personalization_used": ["list of specific data points referenced"],
  "tone": "friendly|professional|urgent"
}`;
}

const DEFAULT_CONTENT: PersonalizedContent = {
  body: "Hi there, I noticed your business and wanted to reach out. We help home services businesses grow with proven marketing strategies. Would you be open to a quick chat this week?",
  personalization_used: [],
  tone: "friendly",
  openingLine: "Hi there, I noticed your business and wanted to reach out.",
  valueProposition: "We help home services businesses grow with proven marketing strategies.",
  callToAction: "Would you be open to a quick chat this week?",
  fullMessage:
    "Hi there, I noticed your business and wanted to reach out. We help home services businesses grow with proven marketing strategies. Would you be open to a quick chat this week?",
};

/**
 * Generate personalized outreach content using Claude.
 * Falls back to generic content on error to avoid blocking the pipeline.
 */
export async function generatePersonalization(
  clientId: string,
  params: PersonalizationParams
): Promise<PersonalizedContent> {
  const {
    contactName,
    businessDetails,
    propertyDetails,
    reviewSnippet,
    vertical,
    channel,
  } = params;

  const userPrompt = buildUserPrompt({
    contactName: contactName ? sanitizeForPrompt(contactName, 200) : undefined,
    businessDetails: businessDetails
      ? sanitizeForPrompt(businessDetails, 500)
      : undefined,
    propertyDetails: propertyDetails
      ? sanitizeForPrompt(propertyDetails, 500)
      : undefined,
    reviewSnippet: reviewSnippet
      ? sanitizeForPrompt(reviewSnippet, 300)
      : undefined,
    vertical: sanitizeForPrompt(vertical, 100),
    channel,
  });

  try {
    const systemPrompt = buildSystemPrompt(params);

    const response = await guardedAnthropicCall({
      clientId,
      action: "outreach.personalization",
      description: `Generate personalized ${channel} outreach for ${vertical}`,
      params: {
        model: AI_MODEL,
        max_tokens: 768,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.7,
      },
    });

    const parsed = extractJSONContent<PersonalizedContent>(
      response,
      DEFAULT_CONTENT
    );

    // Validate required fields — new format uses body, legacy uses fullMessage
    if (!parsed.body && !parsed.fullMessage) {
      logger.warn(`${TAG} Incomplete personalization response, using defaults`, {
        clientId,
        vertical,
      });
      return DEFAULT_CONTENT;
    }

    // Normalize: ensure both new and legacy fields are populated
    if (parsed.body && !parsed.fullMessage) {
      parsed.fullMessage = parsed.body;
      parsed.openingLine = parsed.body.split(".")[0] + ".";
      parsed.valueProposition = "";
      parsed.callToAction = "";
    }
    if (parsed.fullMessage && !parsed.body) {
      parsed.body = parsed.fullMessage;
    }
    if (parsed.subject && !parsed.subjectLine) {
      parsed.subjectLine = parsed.subject;
    }
    parsed.personalization_used = parsed.personalization_used || [];
    parsed.tone = parsed.tone || "friendly";

    return parsed;
  } catch (error) {
    logger.errorWithCause(`${TAG} Personalization failed, using defaults`, error, {
      clientId,
      vertical,
      channel,
    });
    return DEFAULT_CONTENT;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildUserPrompt(params: PersonalizationParams): string {
  const parts: string[] = [
    `Channel: ${params.channel}`,
    `Vertical: ${params.vertical}`,
  ];

  if (params.contactName) {
    parts.push(`Homeowner name: ${params.contactName}`);
  }
  if (params.neighborhood) {
    parts.push(`Neighborhood: ${params.neighborhood}`);
  }
  if (params.businessDetails) {
    parts.push(`Business details: ${params.businessDetails}`);
  }
  if (params.propertyDetails) {
    parts.push(`Property details: ${params.propertyDetails}`);
  }
  if (params.reviewSnippet) {
    parts.push(`Review context: ${params.reviewSnippet}`);
  }
  if (params.contractorPhone) {
    parts.push(`Contractor phone: ${params.contractorPhone}`);
  }

  parts.push("");
  parts.push(
    params.channel === "sms"
      ? "Generate a personalized SMS (3 sentences max, under 160 chars if possible)."
      : "Generate a personalized email with subject line (under 50 chars, no ALL CAPS)."
  );

  return parts.join("\n");
}
