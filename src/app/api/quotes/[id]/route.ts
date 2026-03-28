import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — public: fetch a quote by ID (no auth required)
// Used by the public quote view page for customers.
// Requires a valid shareToken query parameter for access.
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "quotes-get", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: {
          select: { businessName: true },
        },
      },
    });

    if (!quote || quote.shareToken !== token) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      id: quote.id,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone || "",
      customerEmail: quote.customerEmail || "",
      title: quote.title,
      description: quote.description,
      lineItems: (() => { try { return JSON.parse(quote.lineItems || "[]"); } catch { return []; } })(),
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      status: quote.status,
      sentAt: quote.sentAt?.toISOString() || null,
      expiresAt: quote.expiresAt?.toISOString() || null,
      acceptedAt: quote.acceptedAt?.toISOString() || null,
      createdAt: quote.createdAt.toISOString(),
      businessName: quote.client.businessName,
    });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    logger.errorWithCause("[quotes] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
