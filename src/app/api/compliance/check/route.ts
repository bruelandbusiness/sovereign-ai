import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError } from "@/lib/require-client";
import { canSendEmail, canSendSms, canMakeCall } from "@/lib/compliance";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const checkSchema = z.object({
  channel: z.enum(["email", "sms", "voice"]),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).optional(),
  html: z.string().optional(), // For CAN-SPAM content validation
});

/**
 * POST /api/compliance/check
 * Dry-run compliance check without sending anything.
 * Useful for UI preview to show whether a send would be allowed.
 */
export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();
    const body = await request.json();
    const parsed = checkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { channel, contactEmail, contactPhone, html } = parsed.data;

    let result;
    switch (channel) {
      case "email":
        if (!contactEmail) {
          return NextResponse.json(
            { error: "contactEmail required for email channel" },
            { status: 400 }
          );
        }
        result = await canSendEmail(clientId, contactEmail, html);
        break;
      case "sms":
        if (!contactPhone) {
          return NextResponse.json(
            { error: "contactPhone required for sms channel" },
            { status: 400 }
          );
        }
        result = await canSendSms(clientId, contactPhone);
        break;
      case "voice":
        if (!contactPhone) {
          return NextResponse.json(
            { error: "contactPhone required for voice channel" },
            { status: 400 }
          );
        }
        result = await canMakeCall(clientId, contactPhone);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.errorWithCause("[compliance/check] POST failed:", error);
    return NextResponse.json(
      { error: "Compliance check failed" },
      { status: 500 }
    );
  }
}
