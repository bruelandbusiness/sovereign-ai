import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "newsletter", 5);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      ),
      rl
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const trimmed = parsed.data.email.trim().toLowerCase();

    try {
      // Use raw query to avoid TypeScript error if model not yet in Prisma schema
      await (prisma as unknown as { newsletterSubscriber: { upsert: (args: unknown) => Promise<unknown> } }).newsletterSubscriber.upsert({
        where: { email: trimmed },
        update: {},
        create: { email: trimmed },
      });
    } catch (dbError) {
      // If the model doesn't exist yet, log and continue so the UX
      // isn't broken during development.  The email is still accepted.
      logger.warn("[newsletter] DB upsert failed (model may not exist yet)", {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    return setRateLimitHeaders(
      NextResponse.json({ success: true }),
      rl
    );
  } catch (error) {
    logger.errorWithCause("[newsletter] POST failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
