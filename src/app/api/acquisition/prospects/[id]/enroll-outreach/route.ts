import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { z } from "zod";

export const dynamic = "force-dynamic";
const enrollSchema = z.object({
  sequenceId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        ownerName: true,
        businessName: true,
      },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    // Verify the sequence exists
    const sequence = await prisma.outreachSequence.findUnique({
      where: { id: parsed.data.sequenceId },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: "Outreach sequence not found" },
        { status: 404 }
      );
    }

    // Create outreach entry linked to the prospect
    const entry = await prisma.outreachEntry.create({
      data: {
        clientId: sequence.clientId,
        sequenceId: parsed.data.sequenceId,
        contactEmail: prospect.email,
        contactPhone: prospect.phone,
        contactName: prospect.ownerName ?? prospect.businessName,
        status: "active",
        currentStep: 0,
        nextStepAt: new Date(),
      },
    });

    // Update prospect status and link the outreach entry
    await prisma.prospect.update({
      where: { id },
      data: {
        status: "outreach",
        outreachEntryId: entry.id,
      },
    });

    // Log activity
    await prisma.prospectActivity.create({
      data: {
        prospectId: id,
        type: "email_sent",
        description: `Enrolled in outreach sequence: ${sequence.name}`,
        metadata: JSON.stringify({
          sequenceId: sequence.id,
          entryId: entry.id,
        }),
      },
    });

    logger.info("[api/acquisition/enroll-outreach] Prospect enrolled", {
      prospectId: id,
      sequenceId: parsed.data.sequenceId,
      entryId: entry.id,
    });

    return NextResponse.json({ entryId: entry.id }, { status: 201 });
  } catch (err) {
    logger.errorWithCause(
      "[api/acquisition/enroll-outreach] Failed to enroll prospect",
      err
    );
    return NextResponse.json(
      { error: "Failed to enroll prospect in outreach" },
      { status: 500 }
    );
  }
}
