import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
/**
 * GET /api/admin/snapshots/[id] — Get snapshot detail.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const { id } = await params;

    const snapshot = await prisma.snapshotReport.findFirst({
      where: { id, createdBy: accountId },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...snapshot,
      findings: (() => { try { return JSON.parse(snapshot.findings); } catch { return []; } })(),
      recommendations: (() => { try { return JSON.parse(snapshot.recommendations); } catch { return []; } })(),
    });
  } catch (error) {
    logger.errorWithCause("[admin/snapshots] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshot" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/snapshots/[id] — Delete a snapshot report.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const { id } = await params;

    const snapshot = await prisma.snapshotReport.findFirst({
      where: { id, createdBy: accountId },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    await prisma.snapshotReport.delete({ where: { id } });

    await logAudit({
      accountId,
      action: "delete",
      resource: "snapshot",
      resourceId: id,
      metadata: { businessName: snapshot.businessName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause("[admin/snapshots] DELETE failed", error);
    return NextResponse.json(
      { error: "Failed to delete snapshot" },
      { status: 500 }
    );
  }
}
