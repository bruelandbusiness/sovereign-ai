import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
/**
 * Public proposal view — no auth required.
 * Finds proposal by shareToken and marks as viewed if first access.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  // Rate limit: 30 requests per hour per IP (public endpoint)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "proposal-view", 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { shareToken } = await params;

  try {
    const proposal = await prisma.proposal.findUnique({
      where: { shareToken },
      include: {
        prospect: {
          select: {
            businessName: true,
            ownerName: true,
            vertical: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Update viewedAt if this is the first view
    if (!proposal.viewedAt) {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          viewedAt: new Date(),
          status: proposal.status === "sent" ? "viewed" : proposal.status,
        },
      });
    }

    // Parse pricing JSON for the response
    let pricing: unknown = null;
    try {
      pricing = JSON.parse(proposal.pricing);
    } catch {
      // Keep as raw string
      pricing = proposal.pricing;
    }

    const response = NextResponse.json({
      proposal: {
        title: proposal.title,
        content: proposal.content,
        pricing,
        status: proposal.status,
        createdAt: proposal.createdAt,
        prospect: proposal.prospect,
      },
    });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (err) {
    logger.errorWithCause(
      "[api/acquisition/proposals/view] Failed to load proposal",
      err
    );
    return NextResponse.json(
      { error: "Failed to load proposal" },
      { status: 500 }
    );
  }
}
