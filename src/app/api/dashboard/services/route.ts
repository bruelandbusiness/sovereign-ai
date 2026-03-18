import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await prisma.clientService.findMany({
    where: { clientId: session.account.client.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    services.map((s) => ({
      serviceId: s.serviceId,
      status: s.status,
      activatedAt: s.activatedAt?.toISOString() || null,
    }))
  );
}
