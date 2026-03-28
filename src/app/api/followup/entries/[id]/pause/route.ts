import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api/followup/entries/[id]/pause]";

// ---------------------------------------------------------------------------
// POST — pause a follow-up entry
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.followUpEntry.findFirst({
      where: { id, clientId },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 },
      );
    }

    if (existing.status !== "active") {
      return NextResponse.json(
        { error: `Cannot pause entry with status "${existing.status}"` },
        { status: 400 },
      );
    }

    await prisma.followUpEntry.update({
      where: { id },
      data: {
        status: "paused",
        nextStepAt: null,
      },
    });

    logger.info(`${TAG} Paused entry ${id}`, { clientId });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause(`${TAG} POST failed`, error);
    return NextResponse.json(
      { error: "Failed to pause entry" },
      { status: 500 },
    );
  }
}
