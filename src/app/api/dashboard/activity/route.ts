import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const activities = await prisma.activityEvent.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json(
      activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        timestamp: a.createdAt.toISOString(),
      }))
    );
    response.headers.set("Cache-Control", "private, max-age=15, stale-while-revalidate=10");
    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[activity] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
