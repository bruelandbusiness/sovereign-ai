import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMagicLink } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 magic links per IP per hour
    // SECURITY: Auth endpoints must fail closed — if the rate limiter errors,
    // block the request rather than allowing unlimited magic link sends.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimitByIP(ip, "magic-link", 5, {
      degradeGracefully: false,
    });
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        ),
        rl
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const parsed = magicLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    const result = await generateMagicLink(email.toLowerCase().trim());

    if (!result) {
      // Don't reveal whether account exists — always return success
      return setRateLimitHeaders(NextResponse.json({ success: true }), rl);
    }

    await sendMagicLinkEmail(email, result.url);

    return setRateLimitHeaders(NextResponse.json({ success: true }), rl);
  } catch {
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
