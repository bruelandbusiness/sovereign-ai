import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { scoreLead, getLeadStage } from "@/lib/lead-scoring";
import { validateTwilioSignature, twilioPhoneNumber, signedRecordingUrl, sendSms } from "@/lib/twilio";
import { addToInbox } from "@/lib/unified-inbox";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST — Twilio status callback
//
// Twilio sends status updates here as a call progresses (ringing, in-progress,
// completed, failed, etc.). On completion we generate an AI summary of the
// transcription, analyse sentiment, and optionally create a Lead record.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate Twilio webhook signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/services/voice/status`;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => { params[key] = value.toString(); });
    if (!validateTwilioSignature(webhookUrl, params, signature)) {
      return new Response("Forbidden", { status: 403 });
    }

    const callSid = formData.get("CallSid") as string | null;
    const callStatus = formData.get("CallStatus") as string | null;
    const callDuration = formData.get("CallDuration") as string | null;
    const recordingUrl = formData.get("RecordingUrl") as string | null;

    if (!callSid) {
      return new Response("Missing CallSid", { status: 400 });
    }

    // Map Twilio status values to our schema values
    const statusMap: Record<string, string> = {
      queued: "ringing",
      ringing: "ringing",
      "in-progress": "in-progress",
      completed: "completed",
      failed: "failed",
      busy: "busy",
      "no-answer": "no-answer",
      canceled: "failed",
    };

    const normalizedStatus = statusMap[callStatus ?? ""] ?? callStatus ?? "ringing";

    const phoneCall = await prisma.phoneCall.findUnique({
      where: { callSid },
      include: { client: true },
    });

    if (!phoneCall) {
      // Could be an outbound call created before the record exists — ignore
      return new Response("OK", { status: 200 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status: normalizedStatus,
    };

    if (callDuration) {
      updateData.duration = parseInt(callDuration, 10);
    }

    if (recordingUrl) {
      // Store a proxied/signed URL instead of the raw Twilio URL to prevent
      // unauthenticated access to call recordings.
      updateData.recordingUrl = signedRecordingUrl(recordingUrl);
    }

    // On call completion, generate AI summary + sentiment analysis
    if (normalizedStatus === "completed" && phoneCall.transcription) {
      try {
        const result = await summarizeAndAnalyze(
          phoneCall.transcription,
          phoneCall.client.businessName,
          phoneCall.clientId
        );

        updateData.summary = result.summary;
        updateData.sentiment = result.sentiment;

        // Check if we should create a Lead record
        await maybeCreateLead(phoneCall, result);

        // Add call summary to unified inbox
        try {
          await addToInbox(phoneCall.clientId, {
            channel: "voice",
            direction: phoneCall.direction === "inbound" ? "inbound" : "outbound",
            senderName: result.leadName || `Caller ${phoneCall.from}`,
            senderContact: phoneCall.from,
            content: result.summary || "Call completed.",
            metadata: JSON.stringify({
              callSid: phoneCall.callSid,
              duration: callDuration ? parseInt(callDuration, 10) : null,
              sentiment: result.sentiment,
            }),
          });
        } catch (inboxErr) {
          logger.errorWithCause("[voice/status] Failed to add to inbox:", inboxErr);
        }
      } catch (err) {
        logger.errorWithCause("[voice/status] AI summary failed:", err);
      }
    }

    // --- Missed Call Text-Back ---
    if (normalizedStatus === "no-answer" || normalizedStatus === "busy") {
      try {
        await handleMissedCallTextback(phoneCall);
      } catch (err) {
        logger.errorWithCause("[voice/status] Missed call textback failed:", err);
      }
    }

    await prisma.phoneCall.update({
      where: { callSid },
      data: updateData,
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    // Log the error but return 200 to prevent Twilio from retrying.
    // Twilio retries on non-2xx responses, which can cause duplicate
    // processing of status updates and duplicate lead creation.
    logger.errorWithCause("[voice/status] Error:", error);
    return new Response("OK", { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// AI Summary & Sentiment
// ---------------------------------------------------------------------------

interface SummaryResult {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
}

async function summarizeAndAnalyze(
  transcriptionJson: string,
  businessName: string,
  clientId: string
): Promise<SummaryResult> {
  interface Turn {
    role: string;
    content: string;
  }

  let turns: Turn[] = [];
  try {
    turns = JSON.parse(transcriptionJson) as Turn[];
  } catch {
    turns = [];
  }

  if (turns.length === 0) {
    return {
      summary: "No conversation recorded.",
      sentiment: "neutral",
      leadName: null,
      leadEmail: null,
      leadPhone: null,
    };
  }

  const transcript = turns
    .map(
      (t) => `${t.role === "user" ? "Caller" : "AI Agent"}: ${t.content}`
    )
    .join("\n");

  let response;
  try {
    response = await guardedAnthropicCall({
      clientId,
      action: "voice.summarize",
      description: "Summarize phone call transcript",
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system:
          "You are an analyst summarizing phone calls for a business. Return JSON only, no markdown.",
        messages: [
          {
            role: "user",
            content: `Analyze this phone call transcript for ${sanitizeForPrompt(businessName, 200)}.

Return a JSON object with exactly these fields:
- "summary": a 2-3 sentence summary of the call
- "sentiment": one of "positive", "neutral", or "negative"
- "leadName": the caller's name if mentioned, or null
- "leadEmail": the caller's email if mentioned, or null
- "leadPhone": the caller's phone number if mentioned, or null

Transcript:
${transcript}`,
          },
        ],
      },
    });
  } catch (err) {
    if (err instanceof GovernanceBlockedError) {
      return {
        summary: "Call summary unavailable (budget limit reached).",
        sentiment: "neutral" as const,
        leadName: null,
        leadEmail: null,
        leadPhone: null,
      };
    }
    throw err;
  }

  const text = extractTextContent(response, "{}");

  try {
    const parsed = JSON.parse(text) as SummaryResult;
    return {
      summary: parsed.summary || "Call completed.",
      sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "neutral",
      leadName: parsed.leadName || null,
      leadEmail: parsed.leadEmail || null,
      leadPhone: parsed.leadPhone || null,
    };
  } catch {
    return {
      summary: text.slice(0, 500),
      sentiment: "neutral",
      leadName: null,
      leadEmail: null,
      leadPhone: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Lead creation
// ---------------------------------------------------------------------------

async function maybeCreateLead(
  phoneCall: {
    id: string;
    clientId: string;
    from: string;
    summary: string | null;
    client: { accountId: string; businessName: string };
  },
  result: SummaryResult
) {
  // Also check if the conversation handler stored lead info in the summary field
  let storedLead: { leadName?: string; leadEmail?: string; leadPhone?: string } =
    {};
  if (phoneCall.summary) {
    try {
      storedLead = JSON.parse(phoneCall.summary) as typeof storedLead;
    } catch {
      // Not JSON — that's fine
    }
  }

  const leadName =
    result.leadName || storedLead.leadName || null;
  const leadEmail =
    result.leadEmail || storedLead.leadEmail || null;
  const leadPhone =
    result.leadPhone || storedLead.leadPhone || phoneCall.from || null;

  // Need at least a name or phone to create a lead
  if (!leadName && !leadPhone) return;

  const name = leadName || `Caller ${leadPhone}`;

  const lead = await prisma.lead.create({
    data: {
      clientId: phoneCall.clientId,
      name,
      email: leadEmail,
      phone: leadPhone,
      source: "voice",
      status: "new",
    },
  });

  // Score the lead
  const score = scoreLead({
    email: leadEmail,
    phone: leadPhone,
    source: "voice",
    status: "new",
    createdAt: lead.createdAt,
  });
  const stage = getLeadStage(score);

  await prisma.lead.update({
    where: { id: lead.id },
    data: { score, stage },
  });

  // Link the lead to the phone call
  await prisma.phoneCall.update({
    where: { id: phoneCall.id },
    data: { leadId: lead.id },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      accountId: phoneCall.client.accountId,
      type: "lead",
      title: "New Lead from Voice Agent",
      message: `${name} (${leadEmail || leadPhone}) was captured via AI voice agent.`,
      actionUrl: "/dashboard/leads",
    },
  });

  // Create activity event
  await prisma.activityEvent.create({
    data: {
      clientId: phoneCall.clientId,
      type: "lead_captured",
      title: "Voice agent lead captured",
      description: `New lead: ${name} (${leadEmail || leadPhone}) from phone call — score: ${score}`,
    },
  });
}

// ---------------------------------------------------------------------------
// Missed Call Text-Back
// ---------------------------------------------------------------------------

async function handleMissedCallTextback(phoneCall: {
  id: string;
  callSid: string;
  clientId: string;
  from: string;
  direction: string;
  client: { id: string; businessName: string; accountId: string };
}) {
  // Only text back inbound calls
  if (phoneCall.direction !== "inbound") return;

  // Check if textback is enabled via client service config
  const service = await prisma.clientService.findUnique({
    where: {
      clientId_serviceId: {
        clientId: phoneCall.clientId,
        serviceId: "voice",
      },
    },
  });

  // Parse the config to check for textback settings
  let textbackEnabled = true; // default: enabled
  let textbackMessage = "Sorry we missed your call! Reply to this text and we'll get back to you ASAP. - {businessName}";

  if (service?.config) {
    try {
      const config = JSON.parse(service.config) as {
        textbackEnabled?: boolean;
        textbackMessage?: string;
      };
      if (config.textbackEnabled === false) textbackEnabled = false;
      if (config.textbackMessage) textbackMessage = config.textbackMessage;
    } catch {
      // Use defaults
    }
  }

  if (!textbackEnabled) return;

  // Replace placeholder in message
  const finalMessage = textbackMessage.replace(
    /\{businessName\}/g,
    phoneCall.client.businessName
  );

  // Send SMS via Twilio (with phone validation and length check)
  const smsResult = await sendSms(phoneCall.from, finalMessage);

  if (smsResult.success) {

    // Record the textback
    await prisma.missedCallTextback.create({
      data: {
        clientId: phoneCall.clientId,
        callerPhone: phoneCall.from,
        textSent: true,
        textMessage: finalMessage,
        callSid: phoneCall.callSid,
      },
    });

    // Create a lead if one doesn't exist for this phone number
    const existingLead = await prisma.lead.findFirst({
      where: {
        clientId: phoneCall.clientId,
        phone: phoneCall.from,
      },
    });

    if (!existingLead) {
      const lead = await prisma.lead.create({
        data: {
          clientId: phoneCall.clientId,
          name: `Missed Call ${phoneCall.from}`,
          phone: phoneCall.from,
          source: "phone",
          status: "new",
        },
      });

      const score = scoreLead({
        phone: phoneCall.from,
        source: "phone",
        status: "new",
        createdAt: lead.createdAt,
      });
      const stage = getLeadStage(score);

      await prisma.lead.update({
        where: { id: lead.id },
        data: { score, stage },
      });
    }

    // Add to unified inbox
    try {
      await addToInbox(phoneCall.clientId, {
        channel: "sms",
        direction: "outbound",
        senderName: phoneCall.client.businessName,
        senderContact: twilioPhoneNumber,
        content: finalMessage,
        metadata: JSON.stringify({
          type: "missed_call_textback",
          callSid: phoneCall.callSid,
          callerPhone: phoneCall.from,
        }),
      });
    } catch (inboxErr) {
      logger.errorWithCause("[voice/status] Failed to add textback to inbox:", inboxErr);
    }

    // Create activity event
    await prisma.activityEvent.create({
      data: {
        clientId: phoneCall.clientId,
        type: "lead_captured",
        title: "Missed call text-back sent",
        description: `Auto-texted ${phoneCall.from} after missed call.`,
      },
    });
  } else {
    logger.errorWithCause("[voice/status] SMS send failed:", smsResult.error);

    // Still record the failed attempt
    await prisma.missedCallTextback.create({
      data: {
        clientId: phoneCall.clientId,
        callerPhone: phoneCall.from,
        textSent: false,
        textMessage: finalMessage,
        callSid: phoneCall.callSid,
      },
    });
  }
}
