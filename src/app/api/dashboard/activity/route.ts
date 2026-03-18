import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activities = await prisma.activityEvent.findMany({
    where: { clientId: session.account.client.id },
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
}
