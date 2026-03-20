import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateTwilioSignature } from "@/lib/twilio";
import { emitEvent } from "@/lib/orchestration/events";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST — AI Conversation Handler for the AI Receptionist
//
// Twilio sends speech-to-text results here after <Gather> completes.
// We feed the transcript to Claude, which acts as the receptionist:
// - Collects caller info (name, phone, address, issue description)
// - Checks for emergency keywords
// - Offers to book an appointment when all info is collected
// - Creates Lead and Booking records when confirmed
// - Creates a CallLog summary when the call ends
//
// Safety:
// - Enforces maxCallMinutes from ReceptionistConfig (default 15 min).
// - Falls back to voicemail if AI fails mid-conversation.
// ---------------------------------------------------------------------------

/** Fallback max turns if config.maxCallMinutes is not set (assumes ~8s/turn). */
const DEFAULT_MAX_TURNS = 50;

// --- Contact info extraction helpers ---

const NAME_PREFIXES = [
  /(?:my name is|i'm|i am|this is|call me|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /(?:^|\.\s)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+here|\s+speaking)?/,
];

const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;

function extractName(text: string): string | null {
  for (const pattern of NAME_PREFIXES) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
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
    // parameters (?callLogId=...&clientId=...), so we must include them.
    const signature = request.headers.get("x-twilio-signature") || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const pathAndQuery = request.nextUrl.pathname + (request.nextUrl.search || "");
    const webhookUrl = `${appUrl}${pathAndQuery}`;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    if (!validateTwilioSignature(webhookUrl, params, signature)) {
      return new Response("Forbidden", { status: 403 });
    }

    const speechResult = formData.get("SpeechResult") as string | null;
    const callLogId =
      request.nextUrl.searchParams.get("callLogId") as string | null;
    const clientId =
      request.nextUrl.searchParams.get("clientId") as string | null;

    if (!speechResult || !callLogId || !clientId) {
      const conversationUrl = `${appUrl}/api/services/receptionist/conversation?callLogId=${encodeURIComponent(callLogId || "")}&clientId=${encodeURIComponent(clientId || "")}`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I didn't catch that. Could you please repeat?</Say>
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US"/>
  <Say voice="Polly.Joanna">I still didn't hear anything. Goodbye!</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Load the CallLog and ReceptionistConfig
    const [callLog, config, client] = await Promise.all([
      prisma.callLog.findUnique({ where: { id: callLogId } }),
      prisma.receptionistConfig.findUnique({ where: { clientId } }),
      prisma.client.findUnique({ where: { id: clientId } }),
    ]);

    if (!callLog || !config || !client) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Sorry, we could not process your call. Goodbye.</Say><Hangup/></Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Parse existing transcript
    interface Turn {
      role: "user" | "assistant";
      content: string;
    }

    let history: Turn[] = [];
    if (callLog.transcript) {
      try {
        history = JSON.parse(callLog.transcript) as Turn[];
      } catch {
        history = [];
      }
    }

    // Append the new user turn
    history.push({ role: "user", content: speechResult });

    // -----------------------------------------------------------------------
    // Cost control: enforce maxCallMinutes via conversation turn limits.
    // Each turn is roughly 8 seconds, so maxCallMinutes * 60 / 8 = max turns.
    // -----------------------------------------------------------------------
    const maxMinutes = config.maxCallMinutes ?? 15;
    const maxTurns = Math.max(5, Math.floor((maxMinutes * 60) / 8));
    const userTurnCount = history.filter((t) => t.role === "user").length;

    if (userTurnCount > maxTurns) {
      const voiceName = mapVoiceId(config.voiceId || "alloy");
      const wrapUp = `Thank you so much for calling ${escapeXml(config.businessName || client.businessName)}. We have all the information we need and someone from our team will follow up with you shortly. Have a great day!`;

      history.push({ role: "assistant", content: wrapUp });

      await prisma.callLog.update({
        where: { id: callLogId },
        data: {
          transcript: JSON.stringify(history),
          status: "completed",
          callerName: callLog.callerName,
          duration: Math.round(history.length * 8),
        },
      });

      generateCallSummary(callLogId, history).catch(console.error);

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${escapeXml(voiceName)}">${wrapUp}</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Check for emergency keywords
    const lowerSpeech = speechResult.toLowerCase();
    const emergencyKeywords: string[] = (() => { try { return JSON.parse(config.emergencyKeywords); } catch { return []; } })();
    const isEmergency = emergencyKeywords.some((kw: string) =>
      lowerSpeech.includes(kw.toLowerCase())
    );

    if (isEmergency) {
      // Update the call log as emergency
      await prisma.callLog.update({
        where: { id: callLogId },
        data: {
          isEmergency: true,
          transcript: JSON.stringify(history),
          summary: "Emergency call detected.",
          status: "transferred",
        },
      });

      const voiceName = mapVoiceId(config.voiceId || "alloy");

      if (config.emergencyAction === "transfer" && config.emergencyPhone) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${escapeXml(voiceName)}">This sounds like an emergency. Let me transfer you to our team right away. Please hold.</Say>
  <Dial>${escapeXml(config.emergencyPhone)}</Dial>
  <Say voice="${escapeXml(voiceName)}">I was unable to connect you. Please call back or dial 911 if this is a life-threatening emergency.</Say>
  <Hangup/>
</Response>`;
        return new Response(twiml, {
          headers: { "Content-Type": "text/xml" },
        });
      } else {
        // Voicemail / text fallback
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${escapeXml(voiceName)}">This sounds like an emergency. I'm flagging this as urgent and our team will contact you as soon as possible. Please leave a brief message after the beep if you'd like.</Say>
  <Record maxLength="120" transcribe="true" />
  <Say voice="${escapeXml(voiceName)}">Thank you. We'll get back to you immediately. Goodbye.</Say>
  <Hangup/>
</Response>`;
        return new Response(twiml, {
          headers: { "Content-Type": "text/xml" },
        });
      }
    }

    // Build system prompt for the AI receptionist
    const collectedInfo = extractCollectedInfo(history);
    const collectInfoArr: string[] = (() => { try { return JSON.parse(config.collectInfo); } catch { return []; } })();
    const neededInfo = collectInfoArr.filter(
      (field: string) => !collectedInfo[field]
    );

    const parsedConfig: ReceptionistConfig = {
      businessName: config.businessName || client.businessName,
      collectInfo: collectInfoArr,
      canBookJobs: config.canBookJobs ?? false,
      voiceId: config.voiceId || "alloy",
    };
    const systemPrompt = buildSystemPrompt(parsedConfig, client, neededInfo, collectedInfo);

    // Call Claude with governance budget/approval check
    let reply: string;
    try {
      const response = await guardedAnthropicCall({
        clientId,
        action: "receptionist.conversation",
        description: "AI receptionist conversation turn",
        params: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 250,
          system: systemPrompt,
          messages: history.map((t) => ({
            role: t.role,
            content: t.content,
          })),
        },
      });
      reply = extractTextContent(response, "I'm sorry, could you say that again?");
    } catch (err) {
      if (err instanceof GovernanceBlockedError) {
        const budgetMsg = "I apologize, but our system is currently unavailable. A team member will return your call shortly. Thank you!";
        history.push({ role: "assistant", content: budgetMsg });
        await prisma.callLog.update({
          where: { id: callLogId },
          data: { transcript: JSON.stringify(history) },
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

    // Re-extract info after this exchange
    const updatedInfo = extractCollectedInfo(history);
    const callerName =
      updatedInfo.name || extractName(speechResult) || callLog.callerName;
    const callerPhone =
      updatedInfo.phone || extractPhone(speechResult) || callLog.callerPhone;

    // Check if we should create a lead and/or booking
    const allInfoCollected = collectInfoArr.every(
      (field: string) => !!updatedInfo[field]
    );

    let bookingCreated = callLog.bookingCreated;
    let leadCreated = callLog.leadCreated;
    let bookingId = callLog.bookingId;
    let leadId = callLog.leadId;

    // If all info is collected and the AI confirmed booking, create records
    if (allInfoCollected && !leadCreated) {
      // Create a lead
      const lead = await prisma.lead.create({
        data: {
          clientId,
          name: updatedInfo.name || "Unknown Caller",
          phone: updatedInfo.phone || callerPhone,
          source: "phone",
          status: "qualified",
          score: 70,
          stage: "hot",
          notes: updatedInfo.issue_description
            ? `Issue: ${updatedInfo.issue_description}. Address: ${updatedInfo.address || "Not provided"}`
            : undefined,
        },
      });
      leadId = lead.id;
      leadCreated = true;

      await emitEvent("lead.created", { leadId: lead.id, leadName: lead.name || "Phone caller", source: "receptionist" }, { clientId, source: "receptionist" });

      // Create a booking if configured
      if (config.canBookJobs) {
        const startsAt = getNextAvailableSlot();
        const booking = await prisma.booking.create({
          data: {
            clientId,
            customerName: updatedInfo.name || "Unknown Caller",
            customerPhone: updatedInfo.phone || callerPhone,
            serviceType: updatedInfo.issue_description || "General Service",
            startsAt,
            endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000), // 1 hour slot
            status: "confirmed",
            notes: `Booked via AI Receptionist. ${updatedInfo.address ? `Address: ${updatedInfo.address}` : ""}`,
          },
        });
        bookingId = booking.id;
        bookingCreated = true;
      }

      // Create an activity event
      await prisma.activityEvent.create({
        data: {
          clientId,
          type: "lead_captured",
          title: "AI Receptionist captured a lead",
          description: `New lead from ${updatedInfo.name || "caller"}: ${updatedInfo.issue_description || "General inquiry"}`,
        },
      });
    }

    // Update the call log
    await prisma.callLog.update({
      where: { id: callLogId },
      data: {
        transcript: JSON.stringify(history),
        callerName: callerName || callLog.callerName,
        duration: Math.round(history.length * 8), // Rough estimate: ~8s per turn
        bookingCreated,
        bookingId,
        leadCreated,
        leadId,
        status: "completed",
      },
    });

    // Build TwiML response with AI reply + next gather
    const voiceName = mapVoiceId(config.voiceId || "alloy");
    const conversationUrl = `${appUrl}/api/services/receptionist/conversation?callLogId=${encodeURIComponent(callLogId)}&clientId=${encodeURIComponent(clientId)}`;

    // If booking was just created, confirm and hang up
    if (bookingCreated && !callLog.bookingCreated) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${escapeXml(voiceName)}">${escapeXml(reply)}</Say>
  <Pause length="1"/>
  <Say voice="${escapeXml(voiceName)}">Thank you for calling ${escapeXml(config.businessName || client.businessName)}. We've got you scheduled and will see you soon. Have a great day!</Say>
  <Hangup/>
</Response>`;

      // Generate a call summary
      generateCallSummary(callLogId, history).catch(console.error);

      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Continue the conversation
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${escapeXml(voiceName)}">${escapeXml(reply)}</Say>
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US"/>
  <Say voice="${escapeXml(voiceName)}">Are you still there? If you need anything else, just let me know.</Say>
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US"/>
  <Say voice="${escapeXml(voiceName)}">Thank you for calling ${escapeXml(config.businessName || client.businessName)}. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[receptionist/conversation] Error:", error);
    // Error recovery: offer voicemail so the caller's message is not lost.
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I'm sorry, I'm experiencing technical difficulties right now. Please leave a message after the beep and someone from our team will get back to you as soon as possible.</Say>
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function mapVoiceId(voiceId: string): string {
  const voiceMap: Record<string, string> = {
    alloy: "Polly.Joanna",
    echo: "Polly.Matthew",
    fable: "Polly.Salli",
    onyx: "Polly.Joey",
    nova: "Polly.Kendra",
    shimmer: "Polly.Kimberly",
  };
  return voiceMap[voiceId] ?? "Polly.Joanna";
}

/**
 * Extract collected info from the conversation history by looking at
 * user messages for name, phone, address, and issue description.
 */
function extractCollectedInfo(
  history: { role: string; content: string }[]
): Record<string, string | null> {
  const userText = history
    .filter((t) => t.role === "user")
    .map((t) => t.content)
    .join(" ");

  const info: Record<string, string | null> = {
    name: extractName(userText),
    phone: extractPhone(userText),
    address: null,
    issue_description: null,
  };

  // Look for address patterns
  const addressMatch = userText.match(
    /(?:address is|i'm at|located at|live at|we're at)\s+(.+?)(?:\.|$)/i
  );
  if (addressMatch?.[1]) {
    info.address = addressMatch[1].trim();
  }

  // Issue description: if there are more than 2 turns, the first substantive
  // user message is likely the issue description
  const userMessages = history
    .filter((t) => t.role === "user")
    .map((t) => t.content);
  if (userMessages.length > 0) {
    // The first message is usually the caller's reason for calling
    const firstMsg = userMessages[0];
    if (firstMsg.length > 10) {
      info.issue_description = firstMsg;
    }
  }

  return info;
}

interface ReceptionistConfig {
  businessName: string;
  collectInfo: string[];
  canBookJobs: boolean;
  voiceId: string;
}

interface Client {
  businessName: string;
  vertical: string | null;
}

function buildSystemPrompt(
  config: ReceptionistConfig,
  client: Client,
  neededInfo: string[],
  collectedInfo: Record<string, string | null>
): string {
  const businessDesc = `${sanitizeForPrompt(client.businessName, 200)}, a ${sanitizeForPrompt(client.vertical || "home service", 100)} company`;

  const collectedSummary = Object.entries(collectedInfo)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${sanitizeForPrompt(v || "", 300)}`)
    .join("\n");

  const neededList = neededInfo
    .map((f) => f.replace(/_/g, " "))
    .join(", ");

  let bookingInstruction = "";
  if (config.canBookJobs && neededInfo.length === 0) {
    bookingInstruction =
      "All required information has been collected. Confirm the details with the caller and let them know you're scheduling their appointment. Be enthusiastic and reassuring.";
  } else if (config.canBookJobs) {
    bookingInstruction = `You still need to collect: ${neededList}. Ask for the next piece of information naturally in conversation. Don't ask for multiple things at once.`;
  }

  return `You are a friendly, professional AI receptionist for ${businessDesc}. You are answering a phone call.

IMPORTANT RULES:
- Keep responses very short (1-3 sentences max) since this is a phone call.
- Be warm, empathetic, and professional.
- Do NOT use markdown, links, emojis, or formatting — only plain spoken words.
- Never mention you are an AI unless directly asked.
- Collect information naturally through conversation, don't interrogate.

${collectedSummary ? `INFORMATION COLLECTED SO FAR:\n${collectedSummary}\n` : ""}
${bookingInstruction}

Your goal is to help the caller, collect their information (${config.collectInfo.map((f) => f.replace(/_/g, " ")).join(", ")}), and ${config.canBookJobs ? "book them an appointment" : "take their message for the team"}.`;
}

/**
 * Returns the next available 9 AM slot (tomorrow or the next business day).
 */
function getNextAvailableSlot(): Date {
  const now = new Date();
  const slot = new Date(now);
  slot.setDate(slot.getDate() + 1); // Start from tomorrow
  slot.setHours(9, 0, 0, 0);

  // Skip weekends
  while (slot.getDay() === 0 || slot.getDay() === 6) {
    slot.setDate(slot.getDate() + 1);
  }

  return slot;
}

/**
 * Generate a call summary using Claude and update the CallLog.
 * Runs asynchronously after the call completes.
 */
async function generateCallSummary(
  callLogId: string,
  history: { role: string; content: string }[]
) {
  try {
    // Look up the call log to get the clientId for governance
    const callLog = await prisma.callLog.findUnique({
      where: { id: callLogId },
      select: { clientId: true },
    });

    if (!callLog) return;

    const transcript = history
      .map(
        (t) => `${t.role === "user" ? "Caller" : "Receptionist"}: ${t.content}`
      )
      .join("\n");

    let response;
    try {
      response = await guardedAnthropicCall({
        clientId: callLog.clientId,
        action: "receptionist.summarize",
        description: "Summarize receptionist phone call",
        params: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system:
            "Summarize this phone call transcript in 1-2 sentences. Include what the caller needed and the outcome. Also determine the caller's sentiment (positive, neutral, or negative). Return JSON: { summary: string, sentiment: string }",
          messages: [{ role: "user", content: transcript }],
        },
      });
    } catch (err) {
      if (err instanceof GovernanceBlockedError) {
        console.warn(`[receptionist/conversation] Summary blocked by governance: ${err.reason}`);
        return;
      }
      throw err;
    }

    const summaryText = extractTextContent(response, "");
    if (summaryText) {
      try {
        const parsed = JSON.parse(summaryText) as {
          summary: string;
          sentiment: string;
        };
        await prisma.callLog.update({
          where: { id: callLogId },
          data: {
            summary: parsed.summary,
            sentiment: parsed.sentiment,
          },
        });
      } catch {
        // If JSON parsing fails, store the raw text as summary
        await prisma.callLog.update({
          where: { id: callLogId },
          data: { summary: summaryText },
        });
      }
    }
  } catch (error) {
    console.error("[receptionist/conversation] Summary generation error:", error);
  }
}
