import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VERTICALS, SERVICES } from "@/lib/constants";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
/**
 * GET /api/find-a-pro
 *
 * Public endpoint — searches for service businesses by ZIP code and optional vertical.
 * No authentication required (consumer-facing).
 *
 * Query params:
 *   zip       — 5-digit US ZIP code (required)
 *   vertical  — vertical id filter (optional)
 *   page      — page number (default 1)
 *   limit     — results per page (default 12, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 60 requests per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "find-a-pro", 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { searchParams } = request.nextUrl;
    const zip = searchParams.get("zip")?.trim();
    const vertical = searchParams.get("vertical")?.trim() || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    // Validate ZIP
    if (!zip || !/^\d{5}$/.test(zip)) {
      return NextResponse.json(
        { error: "A valid 5-digit ZIP code is required" },
        { status: 400 }
      );
    }

    // Validate vertical if provided
    const validVerticalIds = VERTICALS.map((v) => v.id);
    if (vertical && !validVerticalIds.includes(vertical as never)) {
      return NextResponse.json(
        { error: `Invalid vertical. Must be one of: ${validVerticalIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Build where clause for ServiceArea
    const serviceAreaWhere: Record<string, unknown> = {
      zip,
      isActive: true,
      client: {
        // Only return clients who have at least one active service
        services: {
          some: {
            status: "active",
          },
        },
      },
    };

    // If vertical filter, also filter by client vertical
    if (vertical) {
      (serviceAreaWhere.client as Record<string, unknown>).vertical = vertical;
    }

    // Count total matching
    const total = await prisma.serviceArea.count({
      where: serviceAreaWhere,
    });

    // Fetch matching service areas with client data
    const serviceAreas = await prisma.serviceArea.findMany({
      where: serviceAreaWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            businessName: true,
            vertical: true,
            city: true,
            state: true,
            services: {
              where: { status: "active" },
              select: { serviceId: true },
            },
          },
        },
      },
    });

    // Map service IDs to human-readable names
    const serviceNameMap = new Map<string, string>(SERVICES.map((s) => [s.id, s.name]));

    // Map vertical IDs to labels
    const verticalLabelMap = new Map<string, string>(VERTICALS.map((v) => [v.id, v.label]));

    // Transform results
    const data = serviceAreas.map((sa) => {
      const client = sa.client;

      // Map service IDs to names
      const services = client.services
        .map((cs) => serviceNameMap.get(cs.serviceId))
        .filter(Boolean) as string[];

      return {
        clientId: client.id,
        businessName: client.businessName,
        vertical: client.vertical || "other",
        verticalLabel:
          verticalLabelMap.get(client.vertical || "other") || "Other Home Service",
        city: sa.city || client.city,
        state: sa.state || client.state,
        services,
        rating: null,
        reviewCount: null,
      };
    });

    const response = NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    logger.errorWithCause("[find-a-pro] Search error:", error);
    return NextResponse.json(
      { error: "Failed to search for pros" },
      { status: 500 }
    );
  }
}
