import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "newsletter-subscribe", 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Store as a marketing lead with newsletter source
    const clientId =
      (await prisma.client.findFirst({ select: { id: true } }))?.id ?? "";

    // Check if this email is already captured for this client
    const existing = await prisma.lead.findFirst({
      where: { email, clientId },
    });

    if (existing) {
      // Already subscribed — return success silently
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await prisma.lead.create({
      data: {
        clientId,
        name: email.split("@")[0],
        email,
        source: "newsletter",
        status: "new",
        score: 20,
        notes: "Newsletter subscriber",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.errorWithCause("[api/newsletter/subscribe] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
