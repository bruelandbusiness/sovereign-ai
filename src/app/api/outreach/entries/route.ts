import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api-outreach-entries]";

// ---------------------------------------------------------------------------
// GET — List outreach entries for the authenticated client
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active | paused | completed | replied | etc.
    const cursor = searchParams.get("cursor"); // cursor-based pagination

    const where: Record<string, unknown> = { clientId };
    if (status) {
      where.status = status;
    }

    const entries = await prisma.outreachEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
      include: {
        sequence: {
          select: { id: true, name: true, channel: true },
        },
      },
    });

    const nextCursor =
      entries.length === 50 ? entries[entries.length - 1].id : null;

    return NextResponse.json({ entries, nextCursor });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to list entries`, error);
    return NextResponse.json(
      { error: "Failed to list entries" },
      { status: 500 }
    );
  }
}
