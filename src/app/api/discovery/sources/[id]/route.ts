import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const updateSourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    // Verify the source belongs to this client
    const existing = await prisma.discoverySource.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Discovery source not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateSourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, config, isActive } = parsed.data;

    const updated = await prisma.discoverySource.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      type: updated.type,
      name: updated.name,
      config: updated.config ? JSON.parse(updated.config) : null,
      isActive: updated.isActive,
      lastRunAt: updated.lastRunAt?.toISOString() ?? null,
      lastRunStatus: updated.lastRunStatus,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.errorWithCause("[api/discovery/sources/[id]] PUT failed", error);
    return NextResponse.json(
      { error: "Failed to update discovery source" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    // Verify the source belongs to this client
    const existing = await prisma.discoverySource.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Discovery source not found" },
        { status: 404 },
      );
    }

    // Soft delete: set isActive to false
    await prisma.discoverySource.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause("[api/discovery/sources/[id]] DELETE failed", error);
    return NextResponse.json(
      { error: "Failed to deactivate discovery source" },
      { status: 500 },
    );
  }
}
