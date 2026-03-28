import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — list FSM sync logs with pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const url = request.nextUrl;
  const connectionId = url.searchParams.get("connectionId");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const offset = (page - 1) * limit;

  try {
    // Get all connection IDs for this client
    const connections = await prisma.fSMConnection.findMany({
      where: { clientId },
      select: { id: true },
    });

    const connectionIds = connections.map((c) => c.id);

    if (connectionIds.length === 0) {
      return NextResponse.json({ total: 0, logs: [], page, limit });
    }

    interface LogWhere {
      connectionId: { in: string[] } | string;
    }

    const where: LogWhere = connectionId
      ? { connectionId }
      : { connectionId: { in: connectionIds } };

    // Verify the requested connectionId belongs to this client
    if (connectionId && !connectionIds.includes(connectionId)) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    const [logs, total] = await Promise.all([
      prisma.fSMSyncLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          connectionId: true,
          direction: true,
          entityType: true,
          entityId: true,
          externalId: true,
          action: true,
          status: true,
          details: true,
          createdAt: true,
          connection: {
            select: { platform: true },
          },
        },
      }),
      prisma.fSMSyncLog.count({ where }),
    ]);

    return NextResponse.json({
      total,
      page,
      limit,
      logs: logs.map((log) => ({
        id: log.id,
        connectionId: log.connectionId,
        platform: log.connection.platform,
        direction: log.direction,
        entityType: log.entityType,
        entityId: log.entityId,
        externalId: log.externalId,
        action: log.action,
        status: log.status,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load sync logs" },
      { status: 500 }
    );
  }
}
