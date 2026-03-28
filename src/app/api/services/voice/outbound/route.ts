import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { makeCall, twilioPhoneNumber } from "@/lib/twilio";
import { rateLimit } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const outboundSchema = z.object({
  to: z.string().min(1).max(20),
  leadId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST — Initiate an outbound call (auth required, client only)
//
// Body: { to: string }
// Creates a Twilio call to the specified number, creates a PhoneCall record,
// and returns the call SID.
//
// Rate limited: 20 outbound calls per hour per client to control costs.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.account.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = session.account.client.id;

    // Rate limit: 20 outbound calls per hour per client
    const { allowed } = await rateLimit(
      `voice-outbound:${clientId}`,
      20,
      20 / 3600
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before making more calls." },
        { status: 429 }
      );
    }

    // Verify client has an active voice-agent service
    const clientService = await prisma.clientService.findUnique({
      where: { clientId_serviceId: { clientId, serviceId: "voice-agent" } },
    });

    if (!clientService || clientService.status !== "active") {
      return NextResponse.json(
        { error: "Voice agent service is not active" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = outboundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { to } = parsed.data;

    // Build the TwiML URL for the outbound call
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const twimlUrl = `${appUrl}/api/services/voice/inbound`;

    // Use configurable time limit (default 30 minutes); recording is opt-in
    const result = await makeCall(to, twimlUrl, {
      timeLimit: 1800,
      record: false,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER." },
        { status: 503 }
      );
    }

    // Create PhoneCall record
    await prisma.phoneCall.create({
      data: {
        clientId,
        callSid: result.callSid,
        from: twilioPhoneNumber ?? "unknown",
        to,
        direction: "outbound",
        status: "ringing",
      },
    });

    return NextResponse.json({
      callSid: result.callSid,
      status: "ringing",
    });
  } catch (error) {
    logger.errorWithCause("[voice/outbound] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
