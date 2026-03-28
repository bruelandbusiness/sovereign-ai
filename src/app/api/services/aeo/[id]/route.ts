import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: Fetch a single AEO content item
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    const content = await prisma.aEOContent.findFirst({
      where: { id, clientId },
    });

    if (!content) {
      return NextResponse.json(
        { error: "AEO content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[aeo/[id]] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch AEO content" },
      { status: 500 }
    );
  }
}

// PATCH: Update AEO content
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(["draft", "published", "needs_update"]).optional(),
  targetQuery: z.string().min(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    const validation = await validateBody(request, updateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const existing = await prisma.aEOContent.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AEO content not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.aEOContent.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ content: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[aeo/[id]] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update AEO content" },
      { status: 500 }
    );
  }
}

// DELETE: Remove AEO content
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    const existing = await prisma.aEOContent.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AEO content not found" },
        { status: 404 }
      );
    }

    await prisma.aEOContent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[aeo/[id]] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete AEO content" },
      { status: 500 }
    );
  }
}
