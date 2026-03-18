import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { accountId: session.account.id },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }))
  );
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ids } = body as { ids?: string[] };

  if (ids && Array.isArray(ids)) {
    await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        accountId: session.account.id,
      },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { accountId: session.account.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
