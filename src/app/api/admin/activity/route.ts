import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.account.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
}
