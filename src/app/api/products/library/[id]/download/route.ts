import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRODUCT_DELIVERABLES } from "@/lib/product-deliverables";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the purchase and verify ownership
    const purchase = await prisma.productPurchase.findFirst({
      where: {
        id,
        accountId: session.account.id,
      },
      include: {
        product: {
          select: {
            slug: true,
            name: true,
            deliveryUrl: true,
            deliveryType: true,
            deliveryNotes: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found or not authorized" },
        { status: 404 }
      );
    }

    // Look up the deliverable content for this product
    const deliverable = PRODUCT_DELIVERABLES[purchase.product.slug];

    if (deliverable) {
      // Increment download count
      await prisma.productPurchase.update({
        where: { id: purchase.id },
        data: { downloadCount: { increment: 1 } },
      });

      // Generate the deliverable content and return as a downloadable file
      const content = deliverable.generateContent();
      const encoder = new TextEncoder();
      const body = encoder.encode(content);

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": deliverable.contentType,
          "Content-Disposition": `attachment; filename="${deliverable.filename}"`,
          "Content-Length": body.byteLength.toString(),
          "Cache-Control": "private, no-cache",
        },
      });
    }

    // Fallback for products without deliverable content (legacy behavior)
    // Increment download count
    await prisma.productPurchase.update({
      where: { id: purchase.id },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({
      deliveryUrl: purchase.product.deliveryUrl || purchase.accessUrl,
      deliveryType: purchase.product.deliveryType,
      deliveryNotes: purchase.product.deliveryNotes,
      downloadCount: purchase.downloadCount + 1,
    });
  } catch (error) {
    console.error("Download tracking error:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}
