import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const activities = await prisma.activityEvent.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        timestamp: a.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[activity] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
