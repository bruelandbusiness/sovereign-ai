import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateTwilioSignature } from "@/lib/twilio";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST — AI conversation handler for voice calls
//
// Twilio sends speech-to-text results here after <Gather> completes.
// We feed the transcript to Claude, return the AI response as TwiML <Say>,
// and loop back with another <Gather> for the next turn.
//
// After each exchange we attempt to extract lead info (name, email, phone).
//
// Safety:
// - Enforces a maximum of MAX_CONVERSATION_TURNS to cap call duration/cost.
// - Falls back to a human-friendly message if the AI fails mid-call.
// ---------------------------------------------------------------------------

/** Maximum conversation round-trips before the AI wraps up the call. */
const MAX_CONVERSATION_TURNS = 25;

// --- Contact info extraction helpers ---

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
const NAME_PREFIXES = [
  /(?:my name is|i'm|i am|this is|call me|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /(?:^|\.\s)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+here|\s+speaking)?/,
];

function extractName(text: string): string | null {
  for (const pattern of NAME_PREFIXES) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractEmail(text: string): string | null {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0].toLowerCase() : null;
}

function extractPhone(text: string): string | null {
  const match = text.match(PHONE_REGEX);
  return match ? match[0] : null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate Twilio webhook signature
    // NOTE: Twilio computes the signature over the *full* URL including query
    // string, so we must reconstruct the complete URL that Twilio actually
    // called (including ?callSid=...).
    const signature = request.headers.get("x-twilio-signature") || "";
    const baseUrl = appUrl();
    // Reconstruct webhook URL using our canonical base (not the host header)
    const pathAndQuery = request.nextUrl.pathname + (request.nextUrl.search || "");
    const webhookUrl = `${baseUrl}${pathAndQuery}`;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => { params[key] = value.toString(); });
    if (!validateTwilioSignature(webhookUrl, params, signature)) {
      return new Response("Forbidden", { status: 403 });
    }

    const speechResult = formData.get("SpeechResult") as string | null;
    const callSid =
      (request.nextUrl.searchParams.get("callSid") as string | null) ??
      (formData.get("CallSid") as string | null);

    if (!speechResult || !callSid) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I didn't catch that. Could you please repeat?</Say>
  <Gather input="speech" action="${escapeXml(`${appUrl()}/api/services/voice/conversation?callSid=${encodeURIComponent(callSid || "")}`)}" method="POST" speechTimeout="auto" language="en-US"/>
  <Say voice="Polly.Joanna">I still didn't hear anything. Goodbye!</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Load existing PhoneCall and its conversation history
    const phoneCall = await prisma.phoneCall.findUnique({
      where: { callSid },
      include: { client: true },
    });

    if (!phoneCall) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Sorry, we could not find your call. Goodbye.</Say><Hangup/></Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Parse existing transcription to build conversation history
    interface Turn {
      role: "user" | "assistant";
      content: string;
    }

    let history: Turn[] = [];
    if (phoneCall.transcription) {
      try {
        history = JSON.parse(phoneCall.transcription) as Turn[];
      } catch {
        history = [];
      }
    }

    // Append the new user turn
    history.push({ role: "user", content: speechResult });

    // -----------------------------------------------------------------------
    // Cost control: enforce max conversation turns
    // -----------------------------------------------------------------------
    const userTurns = history.filter((t) => t.role === "user").length;
    if (userTurns > MAX_CONVERSATION_TURNS) {
      const wrapUp = "I appreciate you calling. We've covered a lot today! Someone from our team will follow up with you shortly. Thank you and goodbye!";
      history.push({ role: "assistant", content: wrapUp });

      await prisma.phoneCall.update({
        where: { callSid },
        data: {
          transcription: JSON.stringify(history),
          status: "completed",
        },
      });

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(wrapUp)}</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Get the chatbot system prompt for this client
    const chatbotConfig = await prisma.chatbotConfig.findUnique({
      where: { clientId: phoneCall.clientId },
    });

    const safeBusinessName = sanitizeForPrompt(phoneCall.client.businessName, 200);
    const systemPrompt =
      chatbotConfig?.systemPrompt ??
      `You are a helpful AI phone assistant for ${safeBusinessName}. Keep responses brief and conversational — 1-2 sentences at most since this is a phone call. Help callers with questions, scheduling, and collect their contact information.`;

    // Call Claude with governance budget/approval check
    let reply: string;
    try {
      const response = await guardedAnthropicCall({
        clientId: phoneCall.clientId,
        action: "voice.conversation",
        description: "AI voice conversation turn",
        params: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: `${systemPrompt}\n\nIMPORTANT: You are speaking on a PHONE CALL. Keep answers very short (1-2 sentences). Be warm and conversational. Do not use markdown, links, or formatting — only plain spoken words.`,
          messages: history.map((t) => ({
            role: t.role,
            content: t.content,
          })),
        },
      });
      reply = extractTextContent(response, "I'm sorry, could you say that again?");
    } catch (err) {
      if (err instanceof GovernanceBlockedError) {
        const budgetMsg = "I apologize, but our system is currently unavailable. A team member will follow up with you shortly. Thank you for calling!";
        history.push({ role: "assistant", content: budgetMsg });
        await prisma.phoneCall.update({
          where: { callSid },
          data: { transcription: JSON.stringify(history) },
        });
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(budgetMsg)}</Say>
  <Hangup/>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
      }
      throw err;
    }

    // Append assistant turn
    history.push({ role: "assistant", content: reply });

    // Extract lead info from the full conversation
    const fullText = history
      .filter((t) => t.role === "user")
      .map((t) => t.content)
      .join(" ");
    const extractedName = extractName(fullText);
    const extractedEmail = extractEmail(fullText);
    const extractedPhone = extractPhone(fullText);

    // Persist updated transcription and any lead info as metadata
    const metadata: Record<string, string | null> = {};
    if (extractedName) metadata.leadName = extractedName;
    if (extractedEmail) metadata.leadEmail = extractedEmail;
    if (extractedPhone) metadata.leadPhone = extractedPhone;

    await prisma.phoneCall.update({
      where: { callSid },
      data: {
        transcription: JSON.stringify(history),
        status: "in-progress",
        // Store extracted lead info in the summary field temporarily as JSON
        summary: Object.keys(metadata).length > 0
          ? JSON.stringify(metadata)
          : phoneCall.summary,
      },
    });

    // Build TwiML response with AI reply + next gather
    const conversationUrl = `${appUrl()}/api/services/voice/conversation?callSid=${encodeURIComponent(callSid)}`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(reply)}</Say>
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US"/>
  <Say voice="Polly.Joanna">Are you still there? If you need anything else, just let me know.</Say>
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US"/>
  <Say voice="Polly.Joanna">Thank you for calling. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[voice/conversation] Error:", error);
    // Error recovery: give the caller a clear, helpful fallback instead of
    // promising a transfer that never happens.
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I'm sorry, I'm having technical difficulties right now. Please try calling back in a few minutes, or leave a message after the beep and we will return your call.</Say>
  <Record maxLength="120" transcribe="true" />
  <Say voice="Polly.Joanna">Thank you for your message. Goodbye.</Say>
  <Hangup/>
</Response>`;
    return new Response(fallback, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
