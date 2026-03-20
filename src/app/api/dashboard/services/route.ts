import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const services = await prisma.clientService.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json(
      services.map((s) => ({
        serviceId: s.serviceId,
        status: s.status,
        activatedAt: s.activatedAt?.toISOString() || null,
      }))
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[services] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
