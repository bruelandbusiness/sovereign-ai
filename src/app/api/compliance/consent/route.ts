import { NextResponse } from "next/server";
import { z } from "zod";
import { recordConsent } from "@/lib/compliance/consent";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const consentSchema = z.object({
  clientId: z.string().min(1),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  channel: z.enum(["sms", "email", "voice"]),
  consentType: z.enum(["express_written", "opt_in", "implied"]),
  consentSource: z.enum(["form", "chatbot", "api", "manual"]),
  consentText: z.string().optional(),
});

/**
 * POST /api/compliance/consent
 * Record consent for a contact to be contacted on a specific channel.
 */
export async function POST(request: Request) {
  try {
    // Rate limit: 30 consent records per hour per IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rl = await rateLimitByIP(ip, "compliance-consent", 30);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = consentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { contactPhone, contactEmail, ...rest } = parsed.data;

    if (!contactPhone && !contactEmail) {
      return NextResponse.json(
        { error: "At least one of contactPhone or contactEmail is required" },
        { status: 400 }
      );
    }

    const consentId = await recordConsent({
      ...rest,
      contactPhone: contactPhone ?? null,
      contactEmail: contactEmail ?? null,
      ipAddress: ip,
    });

    return NextResponse.json({ consentId });
  } catch (error) {
    logger.errorWithCause("[compliance/consent] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 }
    );
  }
}
