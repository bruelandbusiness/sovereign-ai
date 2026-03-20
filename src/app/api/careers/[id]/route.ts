import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// GET — Public: fetch active job posting details (no auth required)
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 60 requests per hour per IP (public job detail)
  const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "careers-detail", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { id } = await params;

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      client: {
        select: { businessName: true, city: true, state: true },
      },
    },
  });

  if (!job || job.status !== "active") {
    return NextResponse.json(
      { error: "Job posting not found" },
      { status: 404 }
    );
  }

  const response = NextResponse.json({
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    compensation: job.compensation,
    location: job.location,
    type: job.type,
    businessName: job.client.businessName,
    businessCity: job.client.city,
    businessState: job.client.state,
    createdAt: job.createdAt.toISOString(),
  });

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );

  return response;
}
