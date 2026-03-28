import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { logger } from "@/lib/logger";

const TAG = "[followup/reply-classifier]";

const AI_MODEL =
  process.env.CLAUDE_CLASSIFIER_MODEL || "claude-haiku-4-5-20251001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReplyClassification {
  intent:
    | "hot_lead"
    | "interested"
    | "not_interested"
    | "unsubscribe"
    | "question"
    | "complaint"
    | "out_of_office"
    | "angry"
    | "spam"
    | "wrong_person";
  confidence: number;
  summary: string;
  urgency: "high" | "medium" | "low";
  sentiment: "positive" | "neutral" | "negative";
  needs_human: boolean;
  suggested_response: string | null;
}

interface ClassifyContext {
  vertical?: string;
  contactName?: string;
  contractorName?: string;
  originalMessage?: string;
}

interface AutoResponseContext {
  clientBusinessName: string;
  contactName?: string;
  contractorPhone?: string;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

function buildClassifySystemPrompt(context?: ClassifyContext): string {
  const contractorName = context?.contractorName || "the contractor";
  const originalMsg = context?.originalMessage
    ? `\n\nThe original message was:\n${context.originalMessage}`
    : "";

  return `You are analyzing a reply from a homeowner who received an outreach message from ${contractorName}. Classify this reply and suggest a response.${originalMsg}

Classify the reply into exactly one of these categories:
- interested: wants to learn more, open to conversation
- hot_lead: ready to buy, schedule, or commit now
- question: asks about product, service, pricing, or process
- not_interested: declines or says no thanks
- angry: hostile, threatening, or very upset
- spam: irrelevant, automated, or junk
- unsubscribe: explicitly asks to stop receiving messages
- wrong_person: wrong number/email, not the homeowner
- complaint: unhappy, reports an issue, expresses frustration
- out_of_office: automated vacation/OOO responder

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "intent": "<category>",
  "urgency": "high|medium|low",
  "sentiment": "positive|neutral|negative",
  "needs_human": true/false,
  "confidence": 0.0 to 1.0,
  "suggested_response": "your suggested reply (null if needs_human or unsubscribe)",
  "summary": "one-sentence summary of the reply"
}

Rules for suggested responses:
- If interested: confirm their interest, offer to schedule a time, include contractor's phone number
- If question: answer honestly and helpfully, don't be salesy
- If not interested: thank them, offer to reach out next season, respect their decision
- If angry: apologize sincerely, offer to remove them, never argue
- If unsubscribe: acknowledge immediately, confirm removal
- If needs_human is true: don't generate a response, set suggested_response to null

NEVER generate a response for: threats, legal mentions, media mentions, or anything you're unsure about. Set needs_human = true for those.`;
}

function buildAutoResponseSystemPrompt(context: AutoResponseContext): string {
  const phoneNote = context.contractorPhone
    ? ` Include the contractor's phone number (${context.contractorPhone}) when offering to schedule.`
    : "";

  return `You are a helpful assistant for ${context.clientBusinessName} generating a brief, friendly auto-response to a customer reply. Keep the response concise (2-4 sentences max), professional, and warm. Do not make promises you cannot keep.${phoneNote}

Rules for responses by intent:
- If interested: confirm their interest, offer to schedule a time
- If question: answer honestly and helpfully, don't be salesy
- If not_interested: thank them, offer to reach out next season, respect their decision
- If angry: apologize sincerely, offer to remove them, never argue

Respond with ONLY the message text, no JSON or extra formatting.`;
}

// ---------------------------------------------------------------------------
// classify
// ---------------------------------------------------------------------------

/**
 * Classify the intent of a reply to a marketing follow-up message.
 * Uses Claude Haiku for speed and cost efficiency.
 */
export async function classifyReply(
  replyText: string,
  context?: ClassifyContext,
): Promise<ReplyClassification> {
  const userPrompt = buildClassifyPrompt(replyText, context);

  // Use a placeholder clientId for classification calls — governance will
  // check budget against this. In practice, the caller should provide
  // the real clientId via the orchestrator; here we accept a simpler
  // interface since the classifier is a utility.
  // The caller (index.ts) handles clientId at the orchestrator level.
  const response = await guardedAnthropicCall({
    clientId: "__system__",
    action: "followup.classify_reply",
    params: {
      model: AI_MODEL,
      max_tokens: 512,
      system: buildClassifySystemPrompt(context),
      messages: [{ role: "user", content: userPrompt }],
    },
    description: "Classify follow-up reply intent",
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text) as ReplyClassification;

    // Validate the parsed result
    const validIntents = [
      "hot_lead",
      "interested",
      "not_interested",
      "unsubscribe",
      "question",
      "complaint",
      "out_of_office",
      "angry",
      "spam",
      "wrong_person",
    ];
    if (!validIntents.includes(parsed.intent)) {
      logger.warn(`${TAG} Invalid intent from model: ${parsed.intent}`);
      return {
        intent: "question",
        confidence: 0.3,
        summary: "Unable to classify — defaulting to question",
        urgency: "low",
        sentiment: "neutral",
        needs_human: true,
        suggested_response: null,
      };
    }

    return {
      intent: parsed.intent,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      summary: parsed.summary || "No summary provided",
      urgency: parsed.urgency || "medium",
      sentiment: parsed.sentiment || "neutral",
      needs_human: parsed.needs_human ?? false,
      suggested_response: parsed.suggested_response ?? null,
    };
  } catch (err) {
    logger.errorWithCause(`${TAG} Failed to parse classification response`, err, {
      rawResponse: text,
    });
    return {
      intent: "question",
      confidence: 0.2,
      summary: "Classification failed — defaulting to question",
      urgency: "low",
      sentiment: "neutral",
      needs_human: true,
      suggested_response: null,
    };
  }
}

// ---------------------------------------------------------------------------
// auto-response
// ---------------------------------------------------------------------------

/**
 * Generate an auto-response for "interested" and "question" intents.
 * Returns `null` for all other intents (the caller should handle those).
 *
 * For "unsubscribe" intent, the caller should trigger suppression list
 * addition — this function simply returns null.
 */
export async function generateAutoResponse(
  classification: ReplyClassification,
  context: AutoResponseContext,
): Promise<string | null> {
  // Never auto-respond to these intents
  if (classification.needs_human) return null;
  if (["unsubscribe", "spam", "wrong_person", "out_of_office"].includes(classification.intent)) {
    return null;
  }

  // Use the model's suggested response if available and no human needed
  if (classification.suggested_response) {
    return classification.suggested_response;
  }

  // Only generate for actionable intents
  if (!["interested", "question", "not_interested", "angry"].includes(classification.intent)) {
    return null;
  }

  const contactGreeting = context.contactName
    ? `Hi ${context.contactName}`
    : "Hi there";

  const userPrompt = `The customer replied to a marketing message from "${context.clientBusinessName}". Their reply was classified as "${classification.intent}" with this summary: "${classification.summary}".

Generate a brief auto-response that:
1. Starts with "${contactGreeting}"
2. Acknowledges their ${classification.intent === "interested" ? "interest" : "question"}
3. Lets them know a team member will follow up with more details soon
4. Signs off warmly on behalf of "${context.clientBusinessName}"`;

  try {
    const response = await guardedAnthropicCall({
      clientId: "__system__",
      action: "followup.auto_response",
      params: {
        model: AI_MODEL,
        max_tokens: 512,
        system: buildAutoResponseSystemPrompt(context),
        messages: [{ role: "user", content: userPrompt }],
      },
      description: "Generate follow-up auto-response",
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text.trim() || null;
  } catch (err) {
    logger.errorWithCause(`${TAG} Failed to generate auto-response`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildClassifyPrompt(
  replyText: string,
  context?: ClassifyContext,
): string {
  let prompt = `Classify the intent of this reply:\n\n"""${replyText}"""`;

  if (context?.vertical) {
    prompt += `\n\nBusiness vertical: ${context.vertical}`;
  }
  if (context?.contactName) {
    prompt += `\nContact name: ${context.contactName}`;
  }

  return prompt;
}
