import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const leads = await prisma.lead.findMany({
      where: { clientId },
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
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[leads] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
