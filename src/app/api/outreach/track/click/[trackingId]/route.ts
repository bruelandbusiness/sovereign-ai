import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/outreach/track/click/[trackingId]?url=... — Record click & redirect
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "outreach-track-click", 300);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { trackingId } = await params;
  const { searchParams } = new URL(request.url);
  const destinationUrl = searchParams.get("url");

  // Validate the redirect URL — must be http(s)
  const safeUrl =
    destinationUrl && /^https?:\/\//i.test(destinationUrl)
      ? destinationUrl
      : "https://trysovereignai.com";

  // Fire-and-forget: update the recipient record
  void (async () => {
    try {
      const recipient = await prisma.coldEmailRecipient.findUnique({
        where: { trackingId },
        select: { id: true, status: true, clickedAt: true, openedAt: true },
      });

      if (!recipient) return;

      // Only upgrade status; don't downgrade from replied
      if (recipient.status !== "replied") {
        await prisma.coldEmailRecipient.update({
          where: { trackingId },
          data: {
            status: "clicked",
            clickedAt: recipient.clickedAt ?? new Date(),
            openedAt: recipient.openedAt ?? new Date(), // clicking implies opening
            clickUrl: destinationUrl,
          },
        });
      }
    } catch {
      // Silently ignore tracking errors — never break the redirect
    }
  })();

  return NextResponse.redirect(safeUrl, 302);
}
