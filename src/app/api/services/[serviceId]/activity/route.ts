import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServiceById } from "@/lib/constants";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
/**
 * Map service IDs to the ActivityEvent types they are associated with.
 */
const SERVICE_ACTIVITY_TYPES: Record<string, string[]> = {
  "lead-gen": ["lead_captured"],
  "voice-agent": ["lead_captured", "call_booked"],
  chatbot: ["lead_captured"],
  seo: ["seo_update"],
  ads: ["ad_optimized"],
  email: ["email_sent"],
  social: ["content_published"],
  reviews: ["review_received", "review_response"],
  booking: ["call_booked"],
  crm: ["lead_captured"],
  website: ["seo_update"],
  analytics: ["ad_optimized", "seo_update"],
  content: ["content_published"],
  reputation: ["review_received", "review_response"],
  retargeting: ["ad_optimized"],
  custom: ["seo_update"],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serviceId } = await params;
  const service = getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  const clientId = session.account.client.id;
  const activityTypes = SERVICE_ACTIVITY_TYPES[serviceId] || [];

  const events = await prisma.activityEvent.findMany({
    where: {
      clientId,
      type: { in: activityTypes.length > 0 ? activityTypes : ["seo_update"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    }))
  );
  } catch (error) {
    logger.error("GET /api/services/[serviceId]/activity failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
