import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateTwilioSignature } from "@/lib/twilio";
import { sendSms } from "@/lib/twilio";
import { generateTwimlWithVoice, VoiceConfig } from "@/lib/voice-tts";
import {
  generateSalesResponse,
  generateFollowUpSms,
  createInitialState,
  type ConversationState,
  type ProspectContext,
} from "@/lib/outreach/sales-script";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TAG = "[voice/outbound-sales]";

/** Maximum conversation round-trips before we wrap up. */
const MAX_SALES_TURNS = 15;

/** ElevenLabs voice config for Sarah (warm female voice). */
const SARAH_VOICE_CONFIG: VoiceConfig = {
  useElevenLabs: true,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
  pollyVoice: "Polly.Joanna",
};

// ---------------------------------------------------------------------------
// POST — TwiML webhook for outbound AI sales calls
//
// Twilio calls this URL when the outbound call connects and after each
// speech gather. We drive the conversation through the sales script phases
// using ElevenLabs TTS for human-quality voice.
//
// Query params:
//   - prospectId: The prospect we're calling
//   - turn: (optional) conversation turn counter, defaults to "0"
//
// On initial connect (turn=0): deliver the opening pitch.
// On subsequent turns: process prospect's speech, generate AI response.
// On completion: update prospect status, send follow-up SMS.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate Twilio webhook signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const pathAndQuery =
      request.nextUrl.pathname + (request.nextUrl.search || "");
    const webhookUrl = `${baseUrl}${pathAndQuery}`;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    if (!validateTwilioSignature(webhookUrl, params, signature)) {
      return new Response("Forbidden", { status: 403 });
    }

    const prospectId = request.nextUrl.searchParams.get("prospectId");
    const turnStr = request.nextUrl.searchParams.get("turn") || "0";
    const turn = parseInt(turnStr, 10) || 0;
    const callSid =
      formData.get("CallSid") as string | null;
    const speechResult = formData.get("SpeechResult") as string | null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const callStatus = formData.get("CallStatus") as string | null;

    if (!prospectId || !callSid) {
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, we could not process this call.</Say>
  <Hangup/>
</Response>`;
      return new Response(errorTwiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Load the prospect
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect) {
      logger.warn(`${TAG} Prospect not found: ${prospectId}`);
      const notFoundTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, an error occurred.</Say>
  <Hangup/>
</Response>`;
      return new Response(notFoundTwiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const prospectContext: ProspectContext = {
      businessName: prospect.businessName,
      ownerName: prospect.ownerName,
      vertical: prospect.vertical,
      city: prospect.city,
      state: prospect.state,
      painSignals: prospect.painSignals,
      rating: prospect.rating,
      reviewCount: prospect.reviewCount,
      website: prospect.website,
    };

    // Load or initialize conversation state from the PhoneCall record
    const phoneCall = await prisma.phoneCall.findUnique({
      where: { callSid },
    });

    let state: ConversationState;
    if (phoneCall?.transcription) {
      try {
        state = JSON.parse(phoneCall.transcription) as ConversationState;
      } catch {
        state = createInitialState(prospectContext);
      }
    } else {
      state = createInitialState(prospectContext);
    }

    // Build the conversation action URL for the next turn
    const nextTurn = turn + 1;
    const conversationUrl = `${baseUrl}/api/services/voice/outbound-sales?prospectId=${encodeURIComponent(prospectId)}&turn=${nextTurn}`;

    // -----------------------------------------------------------------------
    // Turn 0: Initial connect — deliver the opening pitch
    // -----------------------------------------------------------------------
    if (turn === 0) {
      const opening = state.turns[0]?.content || "Hi, this is Sarah from Sovereign AI.";

      // Update call status
      await prisma.phoneCall.update({
        where: { callSid },
        data: { status: "in-progress" },
      });

      const openingTwiml = await generateTwimlWithVoice(opening, SARAH_VOICE_CONFIG);
      const pauseTwiml = await generateTwimlWithVoice(
        "Are you there?",
        SARAH_VOICE_CONFIG,
      );
      const goodbyeTwiml = await generateTwimlWithVoice(
        "Looks like this isn't a great time. I'll follow up by text. Have a great day!",
        SARAH_VOICE_CONFIG,
      );

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  ${openingTwiml}
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Pause length="1"/>
  </Gather>
  ${pauseTwiml}
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Pause length="2"/>
  </Gather>
  ${goodbyeTwiml}
  <Hangup/>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // -----------------------------------------------------------------------
    // No speech detected — prompt or hang up
    // -----------------------------------------------------------------------
    if (!speechResult) {
      const repeatTwiml = await generateTwimlWithVoice(
        "Sorry, I didn't catch that. Could you repeat what you said?",
        SARAH_VOICE_CONFIG,
      );
      const goodbyeTwiml = await generateTwimlWithVoice(
        "Looks like we're having trouble hearing each other. I'll follow up by text. Have a great day!",
        SARAH_VOICE_CONFIG,
      );

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${repeatTwiml}
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Pause length="1"/>
  </Gather>
  ${goodbyeTwiml}
  <Hangup/>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // -----------------------------------------------------------------------
    // Enforce max turns
    // -----------------------------------------------------------------------
    if (turn > MAX_SALES_TURNS) {
      const wrapUp =
        "I really appreciate your time today! I'll send you a text with a link to book a strategy call whenever you're ready. Have a wonderful day!";

      state.turns.push({ role: "user", content: speechResult });
      state.turns.push({ role: "assistant", content: wrapUp });
      state.phase = "goodbye";

      await persistStateAndComplete(callSid, state, prospectId, prospectContext);

      const wrapUpTwiml = await generateTwimlWithVoice(wrapUp, SARAH_VOICE_CONFIG);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${wrapUpTwiml}
  <Hangup/>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // -----------------------------------------------------------------------
    // Normal conversation turn: feed to AI sales script engine
    // -----------------------------------------------------------------------
    const { response, newState } = await generateSalesResponse(
      prospectContext,
      state,
      speechResult,
    );

    // Persist the updated state
    await prisma.phoneCall.update({
      where: { callSid },
      data: {
        transcription: JSON.stringify(newState),
        status: "in-progress",
      },
    });

    // -----------------------------------------------------------------------
    // If we're in the goodbye phase, end the call
    // -----------------------------------------------------------------------
    if (newState.phase === "goodbye") {
      await persistStateAndComplete(callSid, newState, prospectId, prospectContext);

      const goodbyeTwiml = await generateTwimlWithVoice(response, SARAH_VOICE_CONFIG);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${goodbyeTwiml}
  <Hangup/>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // -----------------------------------------------------------------------
    // If meeting was just booked, deliver confirmation and end
    // -----------------------------------------------------------------------
    if (newState.meetingBooked && !state.meetingBooked) {
      // Meeting just got booked in this turn
      newState.phase = "goodbye";
      await persistStateAndComplete(callSid, newState, prospectId, prospectContext);

      const confirmTwiml = await generateTwimlWithVoice(response, SARAH_VOICE_CONFIG);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${confirmTwiml}
  <Hangup/>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // -----------------------------------------------------------------------
    // Continue the conversation: respond and gather next input
    // -----------------------------------------------------------------------
    const responseTwiml = await generateTwimlWithVoice(response, SARAH_VOICE_CONFIG);
    const stillThereTwiml = await generateTwimlWithVoice(
      "Are you still there?",
      SARAH_VOICE_CONFIG,
    );
    const timeoutGoodbye = await generateTwimlWithVoice(
      "Looks like you had to go. I'll send you a text with more info. Have a great day!",
      SARAH_VOICE_CONFIG,
    );

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${responseTwiml}
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Pause length="1"/>
  </Gather>
  ${stillThereTwiml}
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Pause length="2"/>
  </Gather>
  ${timeoutGoodbye}
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Error in outbound sales call handler`, error);

    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I'm sorry, I'm having some technical difficulties. I'll follow up with you by text. Have a great day!</Say>
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

/**
 * Persist final conversation state, mark call completed, update prospect
 * status, and send follow-up SMS with Calendly link.
 */
async function persistStateAndComplete(
  callSid: string,
  state: ConversationState,
  prospectId: string,
  prospectContext: ProspectContext,
): Promise<void> {
  try {
    // Update PhoneCall record
    await prisma.phoneCall.update({
      where: { callSid },
      data: {
        transcription: JSON.stringify(state),
        status: "completed",
        summary: JSON.stringify({
          type: "outreach_sales_call",
          prospectId,
          prospectName: prospectContext.businessName,
          phase: state.phase,
          meetingBooked: state.meetingBooked,
          totalTurns: state.turns.length,
          objectionCount: state.objectionCount,
        }),
      },
    });

    // Update prospect status based on outcome
    const newStatus = state.meetingBooked ? "demo" : "nurturing";
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        status: newStatus,
        lastContactedAt: new Date(),
      },
    });

    // Record the activity
    await prisma.prospectActivity.create({
      data: {
        prospectId,
        type: state.meetingBooked ? "demo" : "call",
        description: state.meetingBooked
          ? `AI sales call completed — meeting booked! (${state.turns.length} turns)`
          : `AI sales call completed — ${state.phase} phase (${state.turns.length} turns, ${state.objectionCount} objections)`,
        metadata: JSON.stringify({
          callSid,
          phase: state.phase,
          meetingBooked: state.meetingBooked,
          totalTurns: state.turns.length,
          objectionCount: state.objectionCount,
        }),
      },
    });

    // Send follow-up SMS with Calendly link
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      select: { phone: true },
    });

    if (prospect?.phone) {
      const smsBody = generateFollowUpSms(prospectContext, state.meetingBooked);
      const smsResult = await sendSms(prospect.phone, smsBody);
      if (smsResult.success) {
        logger.info(`${TAG} Follow-up SMS sent`, { prospectId });
        await prisma.prospectActivity.create({
          data: {
            prospectId,
            type: "email_sent", // Using closest available type for SMS
            description: `Follow-up SMS sent after sales call${state.meetingBooked ? " (Calendly link included)" : ""}`,
            metadata: JSON.stringify({
              channel: "sms",
              messageSid: smsResult.messageSid,
              meetingBooked: state.meetingBooked,
            }),
          },
        });
      } else {
        logger.warn(`${TAG} Failed to send follow-up SMS: ${smsResult.error}`);
      }
    }
  } catch (error) {
    logger.errorWithCause(`${TAG} Error completing sales call`, error);
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
