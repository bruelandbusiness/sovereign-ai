import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, type AdminSession } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { makeCall, twilioPhoneNumber } from "@/lib/twilio";
import { rateLimit } from "@/lib/rate-limit";
import { createInitialState } from "@/lib/outreach/sales-script";

export const dynamic = "force-dynamic";
const TAG = "[api/outreach/call]";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const callSchema = z.object({
  prospectId: z.string().min(1, "prospectId is required"),
});

// ---------------------------------------------------------------------------
// POST — Initiate an outbound AI sales call to a prospect
//
// Admin-only endpoint. Looks up the prospect, initiates a Twilio call that
// points to our outbound conversation webhook, creates a PhoneCall record,
// and stores the call SID on the prospect.
//
// Rate limited: 10 outbound sales calls per hour to control costs.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Auth: admin only
  let _session: AdminSession;
  try {
    _session = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Rate limit: 10 outbound sales calls per hour (platform-wide)
    const { allowed } = await rateLimit("outreach-call:global", 10, 10 / 3600);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before initiating more calls." },
        { status: 429 },
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = callSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { prospectId } = parsed.data;

    // Look up the prospect
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        phone: true,
        website: true,
        vertical: true,
        city: true,
        state: true,
        painSignals: true,
        rating: true,
        reviewCount: true,
      },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 },
      );
    }

    if (!prospect.phone) {
      return NextResponse.json(
        { error: "Prospect has no phone number on file" },
        { status: 400 },
      );
    }

    // Prevent duplicate calls to the same prospect within 24 hours
    const recentCall = await prisma.phoneCall.findFirst({
      where: {
        to: prospect.phone,
        direction: "outbound",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentCall) {
      return NextResponse.json(
        { error: "This prospect was already called within the last 24 hours" },
        { status: 409 },
      );
    }

    // Build the TwiML webhook URL for the outbound sales conversation.
    // We pass the prospectId so the outbound handler can load context.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const twimlUrl = `${appUrl}/api/services/voice/outbound-sales?prospectId=${encodeURIComponent(prospectId)}`;

    // Initiate the call via Twilio
    const result = await makeCall(prospect.phone, twimlUrl, {
      timeLimit: 600, // 10 minute max for sales calls
      record: true,   // Record for quality assurance
    });

    if (!result) {
      return NextResponse.json(
        { error: "Twilio is not configured or the call could not be initiated." },
        { status: 503 },
      );
    }

    // Create PhoneCall record with a "platform" clientId.
    // Outbound sales calls are platform-initiated, not on behalf of a specific client.
    // We use a sentinel clientId and store the prospectId in the summary field.
    const phoneCall = await prisma.phoneCall.create({
      data: {
        clientId: "platform",
        callSid: result.callSid,
        from: twilioPhoneNumber ?? "unknown",
        to: prospect.phone,
        direction: "outbound",
        status: "ringing",
        summary: JSON.stringify({
          type: "outreach_sales_call",
          prospectId,
          prospectName: prospect.businessName,
        }),
      },
    });

    // Store initial conversation state in the transcription field
    const initialState = createInitialState({
      businessName: prospect.businessName,
      ownerName: prospect.ownerName,
      vertical: prospect.vertical,
      city: prospect.city,
      state: prospect.state,
      painSignals: prospect.painSignals,
      rating: prospect.rating,
      reviewCount: prospect.reviewCount,
      website: prospect.website,
    });

    await prisma.phoneCall.update({
      where: { callSid: result.callSid },
      data: {
        transcription: JSON.stringify(initialState),
      },
    });

    // Update prospect status and record the activity
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        status: "outreach",
        lastContactedAt: new Date(),
      },
    });

    await prisma.prospectActivity.create({
      data: {
        prospectId,
        type: "call",
        description: `Outbound AI sales call initiated (Call SID: ${result.callSid})`,
        metadata: JSON.stringify({
          callSid: result.callSid,
          phoneCallId: phoneCall.id,
          initiatedBy: _session.accountId,
        }),
      },
    });

    logger.info(`${TAG} Outbound sales call initiated`, {
      prospectId,
      callSid: result.callSid,
      to: prospect.phone,
    });

    return NextResponse.json({
      callSid: result.callSid,
      phoneCallId: phoneCall.id,
      status: "ringing",
      prospect: {
        id: prospect.id,
        businessName: prospect.businessName,
        phone: prospect.phone,
      },
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to initiate outbound call`, error);
    return NextResponse.json(
      { error: "Failed to initiate outbound call" },
      { status: 500 },
    );
  }
}
