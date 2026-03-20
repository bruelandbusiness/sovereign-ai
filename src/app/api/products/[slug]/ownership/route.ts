import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ purchased: false });
    }

    const { slug } = await params;

    const product = await prisma.digitalProduct.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ purchased: false });
    }

    const purchase = await prisma.productPurchase.findUnique({
      where: {
        productId_accountId: {
          productId: product.id,
          accountId: session.account.id,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ purchased: !!purchase });
  } catch (error) {
    console.error("Product ownership check error:", error);
    return NextResponse.json({ purchased: false });
  }
}
