import { NextRequest, NextResponse } from "next/server";
import { generateMagicLink } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
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
