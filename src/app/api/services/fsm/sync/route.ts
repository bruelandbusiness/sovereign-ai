import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { runFSMSync } from "@/lib/integrations/fsm";
import type { FSMPlatform } from "@/lib/integrations/fsm";
import { z } from "zod";

const syncSchema = z.object({
  connectionId: z.string().min(1).max(100),
});

// ---------------------------------------------------------------------------
// POST — trigger a manual sync for a specific FSM connection
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { connectionId } = parsed.data;

    // Verify connection belongs to the client
    const connection = await prisma.fSMConnection.findFirst({
      where: { id: connectionId, clientId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    if (!connection.isActive) {
      return NextResponse.json(
        { error: "Connection is not active" },
        { status: 400 }
      );
    }

    // Mark as syncing
    await prisma.fSMConnection.update({
      where: { id: connectionId },
      data: { syncStatus: "syncing", syncError: null },
    });

    try {
      // Run the actual sync
      const result = await runFSMSync(
        connection.platform as FSMPlatform,
        connection.accessToken || undefined
      );

      // Log sync events
      const logEntries = [
        ...result.jobs.map((job) => ({
          connectionId,
          direction: "inbound" as const,
          entityType: "job" as const,
          entityId: job.id,
          externalId: job.externalId,
          action: "synced" as const,
          status: "success" as const,
          details: `Synced job: ${job.customerName} — ${job.status}`,
        })),
        ...result.customers.map((cust) => ({
          connectionId,
          direction: "inbound" as const,
          entityType: "customer" as const,
          entityId: cust.id,
          externalId: cust.externalId,
          action: "synced" as const,
          status: "success" as const,
          details: `Synced customer: ${cust.name}`,
        })),
      ];

      if (logEntries.length > 0) {
        await prisma.fSMSyncLog.createMany({ data: logEntries });
      }

      // Update connection status
      await prisma.fSMConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: "synced",
          lastSyncAt: new Date(),
          syncError: null,
        },
      });

      return NextResponse.json({
        success: true,
        jobsSynced: result.jobs.length,
        customersSynced: result.customers.length,
        isMock: result.isMock,
        syncedAt: result.syncedAt,
      });
    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : "Unknown sync error";

      // Log the error
      await prisma.fSMSyncLog.create({
        data: {
          connectionId,
          direction: "inbound",
          entityType: "job",
          action: "synced",
          status: "error",
          details: errorMessage,
        },
      });

      // Update connection with error
      await prisma.fSMConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: "error",
          syncError: errorMessage,
        },
      });

      return NextResponse.json(
        { error: "Sync failed", details: errorMessage },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to trigger sync" },
      { status: 500 }
    );
  }
}
