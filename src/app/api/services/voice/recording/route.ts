import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { twilioClient } from "@/lib/twilio";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — Authenticated proxy for call recordings
//
// Twilio recording URLs are unauthenticated by default. This endpoint gates
// access behind session auth so that only logged-in dashboard users can play
// back recordings. The frontend's <audio> element should point here instead
// of directly at the Twilio URL.
//
// Query params:
//   sid — the Twilio Recording SID (e.g. RE...)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Require authenticated session
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sid = request.nextUrl.searchParams.get("sid");
  if (!sid || !/^RE[a-f0-9]+$/i.test(sid)) {
    return NextResponse.json({ error: "Invalid recording SID" }, { status: 400 });
  }

  if (!twilioClient) {
    return NextResponse.json(
      { error: "Twilio is not configured" },
      { status: 503 }
    );
  }

  try {
    // Fetch the recording metadata from Twilio to get the media URL
    const recording = await twilioClient.recordings(sid).fetch();

    // Build the authenticated media URL (Twilio serves recordings at this path)
    // The .mp3 suffix tells Twilio to return audio/mpeg format.
    const mediaUrl = `https://api.twilio.com${recording.uri.replace(".json", ".mp3")}`;

    // Fetch the actual audio through the Twilio client (authenticated with our creds)
    const audioResponse = await fetch(mediaUrl, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString("base64"),
      },
    });

    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        // Prevent caching of authenticated content
        "Cache-Control": "private, no-store, max-age=0",
        // Prevent the browser from sniffing the content type
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.errorWithCause("[voice/recording] Error fetching recording:", error);
    return NextResponse.json(
      { error: "Failed to fetch recording" },
      { status: 500 }
    );
  }
}
