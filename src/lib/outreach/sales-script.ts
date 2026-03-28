/**
 * AI Sales Script Engine
 *
 * Generates personalized sales conversation scripts for outbound calls.
 * Uses Claude for dynamic objection handling and conversation steering.
 * Goal: book a 15-minute strategy call via Calendly.
 */

import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";
import { logger } from "@/lib/logger";

const TAG = "[sales-script]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProspectContext {
  businessName: string;
  ownerName?: string | null;
  vertical?: string | null;
  city?: string | null;
  state?: string | null;
  painSignals?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  website?: string | null;
}

export type ConversationPhase =
  | "intro"
  | "discovery"
  | "pain_point"
  | "offer"
  | "objection"
  | "close"
  | "goodbye";

export interface ConversationState {
  phase: ConversationPhase;
  turns: { role: "assistant" | "user"; content: string }[];
  meetingBooked: boolean;
  objectionCount: number;
}

// ---------------------------------------------------------------------------
// Opening script
// ---------------------------------------------------------------------------

/**
 * Generate the personalized opening line for an outbound sales call.
 */
export function generateOpening(prospect: ProspectContext): string {
  const name = prospect.ownerName
    ? `, ${sanitizeForPrompt(prospect.ownerName, 50)}`
    : "";
  const company = sanitizeForPrompt(prospect.businessName, 100);
  const city = prospect.city
    ? sanitizeForPrompt(prospect.city, 50)
    : "your area";
  const vertical = prospect.vertical
    ? sanitizeForPrompt(prospect.vertical, 50)
    : "home service";

  // Tailor opening based on available pain signals
  let hook =
    `I was looking at ${company}'s online presence and noticed a few things that could help you get more leads in ${city}.`;

  if (prospect.rating && prospect.rating < 4.0) {
    hook = `I was researching ${vertical} companies in ${city} and noticed ${company} has some room to grow its online reputation. We've helped similar businesses boost their ratings and get a lot more calls.`;
  } else if (prospect.reviewCount !== null && prospect.reviewCount !== undefined && prospect.reviewCount < 20) {
    hook = `I was looking at ${company} online and noticed you have some great reviews, but not as many as some of your competitors in ${city}. We've helped ${vertical} businesses like yours double their review count and leads.`;
  } else if (prospect.website === null || prospect.website === undefined) {
    hook = `I was researching ${vertical} companies in ${city} and noticed ${company} doesn't seem to have a website yet. We've helped businesses like yours get set up online and start pulling in leads within weeks.`;
  }

  return `Hi${name}, this is Sarah from Sovereign AI. ${hook}`;
}

// ---------------------------------------------------------------------------
// Phase-specific prompts
// ---------------------------------------------------------------------------

const PHASE_INSTRUCTIONS: Record<ConversationPhase, string> = {
  intro: `You just introduced yourself. The prospect responded. If they seem open, transition to discovery by asking about their current lead generation. If they seem busy or resistant, acknowledge it briefly and try to give them a quick value hook. Keep it to 1-2 sentences.`,

  discovery: `You're in the discovery phase. Ask about their biggest challenge — getting new customers, managing reviews, or keeping up with marketing. Listen for pain points you can address. Keep responses to 1-2 sentences.`,

  pain_point: `You've identified a pain point. Validate it empathetically, then briefly share a relevant result: "We helped a [similar vertical] in [similar city] increase their leads by 40% in 3 months." Transition toward the offer. Keep it to 2-3 sentences max.`,

  offer: `Present the offer naturally: "I'd love to show you exactly what we'd do for [company] — it's a free 15-minute strategy session where we'll audit your online presence and show you where the quick wins are. No pressure, no obligation." Try to get them to agree to a time.`,

  objection: `The prospect raised an objection. Handle it smoothly:
- "I'm too busy" → "Totally understand. That's exactly why we handle everything. The call is just 15 minutes — would [tomorrow/next week] work better?"
- "Not interested" → "I get it. Just curious — are you happy with the number of leads you're getting right now?" (re-engage on pain)
- "Already have someone" → "That's great! How's it working out? A lot of our clients came to us after being underwhelmed by their previous provider."
- "How much does it cost?" → "It depends on what you need, but our clients typically see 3-5x ROI. The strategy call is free — we'll lay out exactly what we'd do and the investment."
- "Send me an email" → "Absolutely, I'll send that over. But just so I can tailor it — what's your biggest challenge right now with getting new customers?"
Keep it natural and conversational. 1-2 sentences.`,

  close: `You're closing. Confirm the meeting: "Perfect! I'll send you a quick text with a link to pick a time that works best. It's a 15-minute call where we'll go over your custom strategy. Looking forward to it!" If they haven't committed, make one more gentle push.`,

  goodbye: `Wrap up the call warmly. If they booked: "Awesome, you'll get a text from this number with the booking link. Thanks for your time, [name]! Talk soon." If they didn't book: "No worries at all. I'll send over some info via text. If you ever want to chat about growing your business, you've got my number. Have a great day!"`,
};

// ---------------------------------------------------------------------------
// System prompt for Claude
// ---------------------------------------------------------------------------

function buildSystemPrompt(prospect: ProspectContext, phase: ConversationPhase): string {
  const company = sanitizeForPrompt(prospect.businessName, 100);
  const vertical = prospect.vertical ? sanitizeForPrompt(prospect.vertical, 50) : "home service";
  const city = prospect.city ? sanitizeForPrompt(prospect.city, 50) : "their area";

  let painContext = "";
  if (prospect.painSignals) {
    try {
      const signals = JSON.parse(prospect.painSignals) as { type: string; evidence: string }[];
      painContext = `\nKnown pain signals for this prospect:\n${signals.map((s) => `- ${s.type}: ${s.evidence}`).join("\n")}`;
    } catch {
      // Ignore malformed pain signals
    }
  }

  return `You are Sarah, a friendly and professional AI sales representative for Sovereign AI, a company that provides AI-powered marketing and lead generation for local service businesses.

You are on a PHONE CALL with the owner/decision-maker of ${company}, a ${vertical} company in ${city}.
${painContext}

YOUR GOAL: Book a free 15-minute strategy call via Calendly.

CURRENT CONVERSATION PHASE: ${phase}
${PHASE_INSTRUCTIONS[phase]}

RULES:
- You are speaking on a PHONE CALL. Keep every response to 1-3 sentences MAX.
- Sound natural and human — use contractions, casual language, and warmth.
- Never use markdown, links, bullet points, or any formatting. Only plain spoken words.
- Never say "AI" when referring to yourself. You're "Sarah from Sovereign AI" (the company name).
- If the prospect says they need to go or are clearly not interested after 2+ objections, gracefully wrap up.
- Never be pushy or aggressive. Be helpful, consultative, and genuine.
- Reference specific details about their business when possible.
- If they agree to book, confirm and let them know you'll text a Calendly link.`;
}

// ---------------------------------------------------------------------------
// Determine the next phase based on conversation
// ---------------------------------------------------------------------------

export function determineNextPhase(
  currentPhase: ConversationPhase,
  userResponse: string,
  state: ConversationState
): ConversationPhase {
  const lower = userResponse.toLowerCase();

  // Check for clear intent to end the call
  const endSignals = ["goodbye", "bye", "gotta go", "have to go", "not interested", "no thanks", "no thank you", "stop calling", "don't call"];
  if (endSignals.some((s) => lower.includes(s)) && state.objectionCount >= 2) {
    return "goodbye";
  }

  // Check for booking confirmation
  const bookSignals = ["sure", "okay", "sounds good", "let's do it", "yeah", "yes", "book it", "schedule", "set it up", "i'm in", "that works"];
  if (
    (currentPhase === "offer" || currentPhase === "close") &&
    bookSignals.some((s) => lower.includes(s))
  ) {
    return "close";
  }

  // Check for objections
  const objectionSignals = [
    "too busy",
    "not interested",
    "no time",
    "already have",
    "how much",
    "what does it cost",
    "send me",
    "email me",
    "can't afford",
    "not right now",
    "think about it",
    "don't need",
  ];
  if (objectionSignals.some((s) => lower.includes(s))) {
    if (state.objectionCount >= 3) {
      return "goodbye";
    }
    return "objection";
  }

  // Natural phase progression
  switch (currentPhase) {
    case "intro":
      return "discovery";
    case "discovery":
      return "pain_point";
    case "pain_point":
      return "offer";
    case "offer":
      return "close";
    case "objection":
      // After handling objection, try to move toward the offer/close
      if (state.turns.length > 6) return "offer";
      return "discovery";
    case "close":
      return "goodbye";
    default:
      return "goodbye";
  }
}

// ---------------------------------------------------------------------------
// Generate AI response for a conversation turn
// ---------------------------------------------------------------------------

/**
 * Generate the next AI response in the sales conversation.
 *
 * Uses Claude to produce a natural, contextual reply based on the prospect
 * info, conversation history, and current phase.
 *
 * @param prospect   Prospect context (business name, vertical, city, etc.)
 * @param state      Current conversation state (phase, turns, etc.)
 * @param userInput  The latest thing the prospect said
 * @returns          The AI response text and updated conversation state
 */
export async function generateSalesResponse(
  prospect: ProspectContext,
  state: ConversationState,
  userInput: string,
): Promise<{ response: string; newState: ConversationState }> {
  // Determine the next phase
  const nextPhase = determineNextPhase(state.phase, userInput, state);

  // Track objections
  let objectionCount = state.objectionCount;
  if (nextPhase === "objection") {
    objectionCount++;
  }

  // Check if meeting was booked
  const lower = userInput.toLowerCase();
  const bookSignals = ["sure", "okay", "sounds good", "let's do it", "yeah", "yes", "book it", "schedule", "set it up"];
  const meetingBooked =
    state.meetingBooked ||
    ((state.phase === "offer" || state.phase === "close") &&
      bookSignals.some((s) => lower.includes(s)));

  // Build conversation history for Claude
  const history = [
    ...state.turns.map((t) => ({
      role: t.role as "user" | "assistant",
      content: t.content,
    })),
    { role: "user" as const, content: userInput },
  ];

  const systemPrompt = buildSystemPrompt(prospect, nextPhase);

  let response: string;
  try {
    // Use a lightweight, non-client-specific governance context for platform-level outreach.
    // The clientId "platform" is used because outbound sales calls are initiated by the
    // Sovereign AI platform itself, not on behalf of a specific client.
    const aiResponse = await guardedAnthropicCall({
      clientId: "platform",
      action: "outreach.sales_call",
      description: `Sales call turn for prospect: ${prospect.businessName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        system: systemPrompt,
        messages: history,
      },
    });
    response = extractTextContent(aiResponse, getFallbackResponse(nextPhase, prospect));
  } catch (err) {
    if (err instanceof GovernanceBlockedError) {
      logger.warn(`${TAG} Governance blocked sales call AI: ${err.reason}`);
    } else {
      logger.errorWithCause(`${TAG} AI call failed`, err);
    }
    response = getFallbackResponse(nextPhase, prospect);
  }

  const newState: ConversationState = {
    phase: nextPhase,
    turns: [
      ...state.turns,
      { role: "user", content: userInput },
      { role: "assistant", content: response },
    ],
    meetingBooked,
    objectionCount,
  };

  return { response, newState };
}

// ---------------------------------------------------------------------------
// Fallback responses (used when AI is unavailable)
// ---------------------------------------------------------------------------

function getFallbackResponse(phase: ConversationPhase, prospect: ProspectContext): string {
  const company = prospect.businessName;

  switch (phase) {
    case "intro":
    case "discovery":
      return `That's great to hear. I'm curious — how are things going with getting new customers for ${company}? Are you mostly relying on word of mouth right now?`;
    case "pain_point":
      return `Yeah, I hear that a lot. We actually helped a similar business increase their leads by over 40 percent in just a few months. Would you be open to a quick 15-minute call where I can show you what we'd do specifically for ${company}?`;
    case "offer":
      return `It's a free 15-minute strategy session — we'll audit your online presence and show you exactly where the quick wins are. No pressure, no obligation. Would sometime this week work?`;
    case "objection":
      return `I totally get that. The strategy call is just 15 minutes and we'll make it worth your time. We can find a time that works around your schedule.`;
    case "close":
      return `Perfect! I'll send you a text right now with a link to pick a time. Looking forward to chatting more about growing ${company}.`;
    case "goodbye":
      return `Thanks for your time! Have a great rest of your day.`;
    default:
      return `Thanks for chatting with me. Have a great day!`;
  }
}

// ---------------------------------------------------------------------------
// Follow-up SMS text
// ---------------------------------------------------------------------------

/**
 * Generate the follow-up SMS to send after the call.
 */
export function generateFollowUpSms(
  prospect: ProspectContext,
  meetingBooked: boolean,
): string {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/sovereign-ai/strategy";
  const company = prospect.businessName;

  if (meetingBooked) {
    return `Hi${prospect.ownerName ? ` ${prospect.ownerName}` : ""}! This is Sarah from Sovereign AI. Thanks for chatting — here's the link to book your free strategy session for ${company}: ${calendlyUrl}\n\nLooking forward to it!`;
  }

  return `Hi${prospect.ownerName ? ` ${prospect.ownerName}` : ""}! This is Sarah from Sovereign AI. Great chatting with you about ${company}. If you'd like to explore how we can help you get more leads, here's a link to book a free 15-min strategy call: ${calendlyUrl}\n\nNo pressure — just here if you need us!`;
}

// ---------------------------------------------------------------------------
// Initial conversation state factory
// ---------------------------------------------------------------------------

/**
 * Create the initial conversation state with the opening message.
 */
export function createInitialState(prospect: ProspectContext): ConversationState {
  const opening = generateOpening(prospect);
  return {
    phase: "intro",
    turns: [{ role: "assistant", content: opening }],
    meetingBooked: false,
    objectionCount: 0,
  };
}
