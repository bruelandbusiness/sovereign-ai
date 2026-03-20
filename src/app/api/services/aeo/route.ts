import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

// GET: List all AEO content for the client
export async function GET(request: Request) {
  try {
    const { clientId } = await requireClient();

    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = { clientId };
    if (type) {
      where.type = type;
    }

    const content = await prisma.aEOContent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ content });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[aeo] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch AEO content" },
      { status: 500 }
    );
  }
}
