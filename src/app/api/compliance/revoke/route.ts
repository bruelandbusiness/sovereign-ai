import { NextResponse } from "next/server";
import { z } from "zod";
import { revokeConsent } from "@/lib/compliance/consent";
import { addToSuppressionList } from "@/lib/compliance/suppression";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const revokeSchema = z.object({
  clientId: z.string().min(1),
  channel: z.enum(["sms", "email", "voice"]),
  contactIdentifier: z.string().min(1), // phone or email
});

/**
 * POST /api/compliance/revoke
 * Revoke consent and add to suppression list.
 */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rl = await rateLimitByIP(ip, "compliance-revoke", 30);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = revokeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId, channel, contactIdentifier } = parsed.data;
    const isEmail = contactIdentifier.includes("@");

    // Revoke consent
    const revokedCount = await revokeConsent(
      clientId,
      channel,
      contactIdentifier
    );

    // Add to suppression list
    await addToSuppressionList({
      clientId,
      contactEmail: isEmail ? contactIdentifier : null,
      contactPhone: isEmail ? null : contactIdentifier,
      channel,
      reason: "unsubscribe",
      source: "api",
    });

    return NextResponse.json({ revokedCount, suppressed: true });
  } catch (error) {
    logger.errorWithCause("[compliance/revoke] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to revoke consent" },
      { status: 500 }
    );
  }
}
