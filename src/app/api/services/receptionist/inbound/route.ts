import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateTwilioSignature } from "@/lib/twilio";

// ---------------------------------------------------------------------------
// POST — Twilio webhook for incoming calls (AI Receptionist)
//
// This handles the first moment of an inbound call:
// 1. Look up the client by the Twilio phone number (from `To` field)
// 2. Load their ReceptionistConfig
// 3. Check if within business hours
// 4. For after-hours, play after-hours message and offer to schedule
// 5. For emergency keywords in initial speech, route to emergency handling
// 6. Otherwise, greet the caller and start the conversation loop
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate Twilio webhook signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/services/receptionist/inbound`;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    if (!validateTwilioSignature(webhookUrl, params, signature)) {
      return new Response("Forbidden", { status: 403 });
    }

    const callSid = formData.get("CallSid") as string | null;
    const from = formData.get("From") as string | null;
    const to = formData.get("To") as string | null;

    if (!callSid || !from || !to) {
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, we could not process your call.</Say><Hangup/></Response>`;
      return new Response(errorTwiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Look up which client owns this phone number via their ai-receptionist
    // ClientService config (which stores the Twilio phone number).
    let clientService = await prisma.clientService.findFirst({
      where: {
        serviceId: "ai-receptionist",
        status: "active",
        config: { contains: to },
      },
      include: { client: true },
    });

    // Fallback: try first active ai-receptionist service
    if (!clientService) {
      clientService = await prisma.clientService.findFirst({
        where: {
          serviceId: "ai-receptionist",
          status: "active",
        },
        include: { client: true },
      });
    }

    if (!clientService) {
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Sorry, this number is not currently configured. Please try again later.</Say><Hangup/></Response>`;
      return new Response(errorTwiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const clientId = clientService.clientId;

    // Load the receptionist config
    const config = await prisma.receptionistConfig.findUnique({
      where: { clientId },
    });

    if (!config || !config.isActive) {
      const msg =
        config?.afterHoursMsg ||
        "We are currently unavailable. Please leave a message after the beep.";
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(msg)}</Say>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Check business hours
    const isOpen = checkBusinessHours(config.businessHours);

    // Create a CallLog record for this inbound call
    const callLog = await prisma.callLog.create({
      data: {
        clientId,
        callerPhone: from,
        status: "completed", // Will be updated as call progresses
        duration: 0,
        isEmergency: false,
        transcript: JSON.stringify([]),
      },
    });

    // Build greeting based on business hours
    let greeting = config.greeting || "Hello, thank you for calling. How can I help you today?";
    if (!isOpen) {
      greeting = config.afterHoursMsg || "We are currently closed. Please leave a message and we'll get back to you.";
    }

    // Build the conversation handler URL with the callLog ID
    const conversationUrl = `${appUrl}/api/services/receptionist/conversation?callLogId=${encodeURIComponent(callLog.id)}&clientId=${encodeURIComponent(clientId)}`;

    // TwiML: greet the caller, then gather speech input for the AI conversation
    const voiceName = mapVoiceId(config.voiceId || "alloy");
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${escapeXml(voiceName)}">${escapeXml(greeting)}</Say>
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="${escapeXml(voiceName)}">I'm listening.</Say>
  </Gather>
  <Say voice="${escapeXml(voiceName)}">I didn't catch that. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[receptionist/inbound] Error:", error);
    // Error recovery: offer voicemail instead of just hanging up
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We're experiencing technical difficulties. Please leave a message after the beep and we will return your call.</Say>
  <Record maxLength="120" transcribe="true" />
  <Say>Thank you. Goodbye.</Say>
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

/**
 * Maps a voice ID from the config to a Twilio-supported voice name.
 */
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
 * Checks if the current time falls within the business hours defined in the
 * config. The businessHours field is a JSON string like:
 *   { "mon": { "open": "8:00", "close": "17:00" }, ... }
 *
 * Returns true if no hours are configured (always open).
 */
function checkBusinessHours(businessHoursJson: string | null): boolean {
  if (!businessHoursJson) return true; // No hours configured = always open

  try {
    const hours = JSON.parse(businessHoursJson) as Record<
      string,
      { open: string; close: string } | null
    >;

    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayNames[now.getDay()];
    const todayHours = hours[today];

    if (!todayHours) return false; // Closed today

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = todayHours.open.split(":").map(Number);
    const [closeH, closeM] = todayHours.close.split(":").map(Number);

    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch {
    return true; // If parsing fails, assume always open
  }
}
