import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

/**
 * Validate that a redirect URL is safe:
 * - Must be http:// or https://
 * - Must not use javascript:, data:, vbscript:, etc.
 * - Must not redirect to internal/private IP addresses
 */
function isSafeRedirectUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }

  // Only allow http and https protocols
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  // Block internal/private IP addresses
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "127.0.0.2" ||
    hostname.startsWith("127.") ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname === "169.254.169.254" ||
    hostname === "100.100.100.200" ||
    hostname.startsWith("169.254.") ||
    hostname.startsWith("[fd00:") ||
    hostname === "[fd00::]" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.16.") ||
    hostname.startsWith("172.17.") ||
    hostname.startsWith("172.18.") ||
    hostname.startsWith("172.19.") ||
    hostname.startsWith("172.20.") ||
    hostname.startsWith("172.21.") ||
    hostname.startsWith("172.22.") ||
    hostname.startsWith("172.23.") ||
    hostname.startsWith("172.24.") ||
    hostname.startsWith("172.25.") ||
    hostname.startsWith("172.26.") ||
    hostname.startsWith("172.27.") ||
    hostname.startsWith("172.28.") ||
    hostname.startsWith("172.29.") ||
    hostname.startsWith("172.30.") ||
    hostname.startsWith("172.31.") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  // Rate limit: 300 per hour per IP (email click tracking)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "email-track-click", 300);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const messageId = request.nextUrl.searchParams.get("mid");
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const decodedUrl = decodeURIComponent(url);

  if (!isSafeRedirectUrl(decodedUrl)) {
    return NextResponse.json({ error: "Invalid redirect URL" }, { status: 400 });
  }

  if (messageId) {
    // Record click event
    try {
      await prisma.emailEvent.create({
        data: {
          messageId,
          type: "click",
          metadata: JSON.stringify({
            url: decodedUrl,
            ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
            userAgent: request.headers.get("user-agent"),
          }),
        },
      });
    } catch {
      // Silently fail — tracking should never break the user experience
      console.error(`[EMAIL TRACKING] Failed to record click for message: ${messageId}`);
    }
  }

  // 302 redirect to the destination URL
  return NextResponse.redirect(decodedUrl, 302);
}
