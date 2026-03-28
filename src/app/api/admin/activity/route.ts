import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
  const activities = await prisma.activityEvent.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: { id: true, businessName: true },
      },
    },
  });

  return NextResponse.json({
    activities: activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      createdAt: a.createdAt,
      client: {
        id: a.client.id,
        businessName: a.client.businessName,
      },
    })),
  });
  } catch (error) {
    logger.errorWithCause("[admin/activity] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
}
