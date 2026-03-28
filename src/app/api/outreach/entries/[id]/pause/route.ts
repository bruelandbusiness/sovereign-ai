import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api-outreach-entries-pause]";

// ---------------------------------------------------------------------------
// POST — Pause an outreach entry
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  try {
    // Verify ownership and current status
    const entry = await prisma.outreachEntry.findUnique({
      where: { id },
      select: { clientId: true, status: true },
    });

    if (!entry || entry.clientId !== clientId) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.status !== "active") {
      return NextResponse.json(
        { error: `Cannot pause entry with status "${entry.status}"` },
        { status: 400 }
      );
    }

    await prisma.outreachEntry.update({
      where: { id },
      data: {
        status: "paused",
        nextStepAt: null,
      },
    });

    logger.info(`${TAG} Paused entry ${id}`, { clientId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to pause entry ${id}`, error);
    return NextResponse.json(
      { error: "Failed to pause entry" },
      { status: 500 }
    );
  }
}
