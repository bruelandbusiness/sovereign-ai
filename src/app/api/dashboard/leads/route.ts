import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { clientId: session.account.client.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    leads.map((lead) => ({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source,
      date: lead.createdAt.toISOString(),
      status: lead.status,
    }))
  );
}
