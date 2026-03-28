import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * 1x1 transparent GIF pixel for open tracking.
 * Served as binary so email clients trigger a "load" when the email is opened.
 */
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// ---------------------------------------------------------------------------
// GET /api/outreach/track/open/[trackingId] — Record email open
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "outreach-track-open", 300);
  if (!allowed) {
    // Still return the pixel to avoid breaking email rendering
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": String(TRANSPARENT_GIF.length),
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }

  const { trackingId } = await params;

  // Fire-and-forget: update the recipient record in the background.
  // We always return the pixel immediately so the email client renders fast.
  void (async () => {
    try {
      const recipient = await prisma.coldEmailRecipient.findUnique({
        where: { trackingId },
        select: { id: true, status: true, openedAt: true },
      });

      if (!recipient) return;

      // Only record the first open; don't downgrade from clicked/replied
      if (
        recipient.status === "sent" ||
        (!recipient.openedAt && recipient.status !== "clicked" && recipient.status !== "replied")
      ) {
        await prisma.coldEmailRecipient.update({
          where: { trackingId },
          data: {
            status: recipient.status === "sent" ? "opened" : recipient.status,
            openedAt: recipient.openedAt ?? new Date(),
          },
        });
      }
    } catch {
      // Silently ignore tracking errors — never break the pixel response
    }
  })();

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
