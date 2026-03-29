import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// POST — Public: customer accepts/declines a quote (no auth required)
// Requires a valid shareToken query parameter for access.
// ---------------------------------------------------------------------------

const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "quotes-respond", 20);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const validation = await validateBody(request, respondSchema);
  if (!validation.success) {
    return validation.response;
  }
  const { action } = validation.data;

  // Find the quote
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, accountId: true, businessName: true },
      },
    },
  });

  if (!quote || quote.shareToken !== token) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status !== "sent") {
    return NextResponse.json(
      { error: `Quote has already been ${quote.status}` },
      { status: 400 }
    );
  }

  // Check expiration
  if (quote.expiresAt && new Date() > quote.expiresAt) {
    await prisma.quote.update({
      where: { id },
      data: { status: "expired" },
    });
    return NextResponse.json(
      { error: "This quote has expired" },
      { status: 400 }
    );
  }

  if (action === "accept") {
    await prisma.quote.update({
      where: { id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    });

    // Create notification for the client
    await prisma.notification.create({
      data: {
        accountId: quote.client.accountId,
        type: "lead",
        title: "Quote accepted!",
        message: `${quote.customerName} accepted your quote "${quote.title}" for $${(quote.total / 100).toFixed(2)}.`,
        actionUrl: "/dashboard/quotes",
      },
    });

    // Create activity event
    await prisma.activityEvent.create({
      data: {
        clientId: quote.client.id,
        type: "lead_captured",
        title: "Quote accepted",
        description: `${quote.customerName} accepted the quote "${quote.title}" for $${(quote.total / 100).toFixed(2)}.`,
      },
    });

    return NextResponse.json({
      success: true,
      status: "accepted",
      message: "Quote accepted! The business will be in touch to schedule the work.",
    });
  } else {
    await prisma.quote.update({
      where: { id },
      data: { status: "declined" },
    });

    // Create notification for the client
    await prisma.notification.create({
      data: {
        accountId: quote.client.accountId,
        type: "system",
        title: "Quote declined",
        message: `${quote.customerName} declined your quote "${quote.title}".`,
        actionUrl: "/dashboard/quotes",
      },
    });

    return NextResponse.json({
      success: true,
      status: "declined",
      message: "Quote declined. Thank you for considering our services.",
    });
  }
  } catch (error) {
    logger.error("POST /api/quotes/[id]/respond failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
