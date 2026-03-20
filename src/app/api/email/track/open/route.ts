import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

// 1x1 transparent PNG
const TRANSPARENT_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(request: NextRequest) {
  // Rate limit: 300 per hour per IP (email tracking pixels are hit frequently)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "email-track-open", 300);
  if (!allowed) {
    // Still return the pixel to avoid breaking the email, just skip recording
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(TRANSPARENT_PIXEL.length),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  const messageId = request.nextUrl.searchParams.get("mid");

  if (messageId) {
    // Record open event — fire and forget, don't block the response
    try {
      await prisma.emailEvent.create({
        data: {
          messageId,
          type: "open",
          metadata: JSON.stringify({
            ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
            userAgent: request.headers.get("user-agent"),
          }),
        },
      });
    } catch {
      // Silently fail — tracking should never break the user experience
      console.error(`[EMAIL TRACKING] Failed to record open for message: ${messageId}`);
    }
  }

  return new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(TRANSPARENT_PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
