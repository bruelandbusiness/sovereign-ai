import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET — List PhotoEstimates for the authenticated client
//
// Query params:
//   - page (default 1)
//   - limit (default 20)
//   - status (optional filter)
//   - search (optional — searches customerName, customerEmail)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { clientId };
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { issueCategory: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [estimates, total] = await Promise.all([
      prisma.photoEstimate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          imageUrl: true,
          vertical: true,
          issueCategory: true,
          issueDescription: true,
          estimateLow: true,
          estimateHigh: true,
          confidence: true,
          status: true,
          leadId: true,
          bookingId: true,
          createdAt: true,
        },
      }),
      prisma.photoEstimate.count({ where }),
    ]);

    return NextResponse.json({
      estimates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[services/estimate] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch estimates" },
      { status: 500 }
    );
  }
}
