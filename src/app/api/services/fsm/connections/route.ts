import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import type { FSMPlatform } from "@/lib/integrations/fsm";

const VALID_PLATFORMS: FSMPlatform[] = ["servicetitan", "jobber", "housecallpro"];

const connectionSchema = z.object({
  platform: z.string().min(1).max(50),
  accessToken: z.string().min(1).max(2000),
  refreshToken: z.string().max(2000).optional(),
  externalAccountId: z.string().max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// GET — list FSM connections for the current client
// ---------------------------------------------------------------------------

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const connections = await prisma.fSMConnection.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      connections: connections.map((c) => ({
        id: c.id,
        platform: c.platform,
        isActive: c.isActive,
        externalAccountId: c.externalAccountId,
        lastSyncAt: c.lastSyncAt?.toISOString() || null,
        syncStatus: c.syncStatus,
        syncError: c.syncError,
        config: c.config ? JSON.parse(c.config) : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load FSM connections" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — create or update an FSM connection
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

    const parsed = connectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { platform, accessToken, refreshToken, externalAccountId, config } = parsed.data;

    if (!VALID_PLATFORMS.includes(platform as FSMPlatform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(", ")}` },
        { status: 400 }
      );
    }

    // Upsert: create or update the connection for this client+platform
    const connection = await prisma.fSMConnection.upsert({
      where: {
        clientId_platform: { clientId, platform },
      },
      create: {
        clientId,
        platform,
        accessToken,
        refreshToken: refreshToken || null,
        externalAccountId: externalAccountId || null,
        config: config ? JSON.stringify(config) : null,
        isActive: true,
        syncStatus: "pending",
      },
      update: {
        accessToken,
        refreshToken: refreshToken || null,
        externalAccountId: externalAccountId || null,
        config: config ? JSON.stringify(config) : null,
        isActive: true,
        syncStatus: "pending",
        syncError: null,
      },
    });

    return NextResponse.json({
      id: connection.id,
      platform: connection.platform,
      isActive: connection.isActive,
      externalAccountId: connection.externalAccountId,
      syncStatus: connection.syncStatus,
      createdAt: connection.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save FSM connection" },
      { status: 500 }
    );
  }
}
