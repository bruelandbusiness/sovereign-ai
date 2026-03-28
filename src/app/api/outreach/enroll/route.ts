import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { enrollInSequence } from "@/lib/outreach";

export const dynamic = "force-dynamic";
const TAG = "[api-outreach-enroll]";

const enrollSchema = z.object({
  sequenceId: z.string().min(1),
  leadId: z.string().optional(),
  discoveredLeadId: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactName: z.string().optional(),
});

export async function POST(request: Request) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const body = await request.json();
    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Validate sequence exists and belongs to client
    const sequence = await prisma.outreachSequence.findUnique({
      where: { id: parsed.data.sequenceId },
      select: { clientId: true, isActive: true },
    });

    if (!sequence || sequence.clientId !== clientId) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    if (!sequence.isActive) {
      return NextResponse.json(
        { error: "Sequence is not active" },
        { status: 400 }
      );
    }

    // Must have at least one contact method
    if (!parsed.data.contactEmail && !parsed.data.contactPhone) {
      return NextResponse.json(
        { error: "At least one of contactEmail or contactPhone is required" },
        { status: 400 }
      );
    }

    const entryId = await enrollInSequence({
      clientId,
      ...parsed.data,
    });

    logger.info(`${TAG} Enrolled entry ${entryId}`, { clientId, sequenceId: parsed.data.sequenceId });

    return NextResponse.json({ entryId }, { status: 201 });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to enroll`, error);
    return NextResponse.json(
      { error: "Failed to enroll contact in sequence" },
      { status: 500 }
    );
  }
}
