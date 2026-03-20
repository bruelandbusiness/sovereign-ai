import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateTwilioSignature } from "@/lib/twilio";

// ---------------------------------------------------------------------------
// POST — Twilio webhook for incoming calls
//
// Twilio hits this URL when a call arrives on the provisioned phone number.
// We answer with a greeting and use <Gather> to collect the caller's speech,
// then redirect to the conversation handler for AI processing.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate Twilio webhook signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/services/voice/inbound`;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => { params[key] = value.toString(); });
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

    // Look up which client owns this phone number by matching
    // the `To` number from the Twilio webhook against the client's
    // voice-agent config (stored as JSON with a phoneNumber field).
    // Fall back to the first active voice-agent service if no config match.
    let clientService = await prisma.clientService.findFirst({
      where: {
        serviceId: "voice-agent",
        status: "active",
        config: { contains: to },
      },
      include: { client: true },
    });

    // Fallback: if no config match, try first active voice-agent service
    if (!clientService) {
      clientService = await prisma.clientService.findFirst({
        where: {
          serviceId: "voice-agent",
          status: "active",
        },
        include: { client: true },
      });
    }

    const clientId = clientService?.clientId;

    // Create the PhoneCall record
    if (clientId) {
      await prisma.phoneCall.create({
        data: {
          clientId,
          callSid,
          from,
          to,
          direction: "inbound",
          status: "ringing",
        },
      });
    }

    // Build the greeting from the client's voice config
    let greeting =
      "Thank you for calling. How can we help you today?";

    if (clientService?.config) {
      try {
        const config = JSON.parse(clientService.config) as {
          greeting?: string;
        };
        if (config.greeting) {
          greeting = config.greeting;
        }
      } catch {
        // Use default greeting
      }
    }

    const conversationUrl = `${appUrl}/api/services/voice/conversation?callSid=${encodeURIComponent(callSid)}`;

    // Respond with TwiML: greet the caller, then gather speech input
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
  <Gather input="speech" action="${escapeXml(conversationUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">I'm listening.</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[voice/inbound] Error:", error);
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
