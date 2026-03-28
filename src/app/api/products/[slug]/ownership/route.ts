import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
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

    const response = NextResponse.json({ purchased: !!purchase });
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=30");
    return response;
  } catch (error) {
    logger.errorWithCause("Product ownership check error:", error);
    return NextResponse.json({ purchased: false });
  }
}
