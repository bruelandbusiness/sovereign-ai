import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchases = await prisma.productPurchase.findMany({
      where: { accountId: session.account.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            tier: true,
            category: true,
            price: true,
            imageUrl: true,
            deliveryType: true,
            deliveryNotes: true,
            features: true,
            techStack: true,
            includes: true,
          },
        },
      },
    });

    const response = NextResponse.json({ purchases });
    response.headers.set("Cache-Control", "private, no-cache");
    return response;
  } catch (error) {
    console.error("Product library error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    );
  }
}
