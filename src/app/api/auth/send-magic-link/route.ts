import { NextRequest, NextResponse } from "next/server";
import { generateMagicLink } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { rateLimitByIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 magic links per IP per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const { allowed } = rateLimitByIP(ip, "magic-link", 5);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await generateMagicLink(email.toLowerCase().trim());

    if (!result) {
      // Don't reveal whether account exists — always return success
      return NextResponse.json({ success: true });
    }

    await sendMagicLinkEmail(email, result.url);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
