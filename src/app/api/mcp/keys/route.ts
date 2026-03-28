import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateApiKey, VALID_SCOPES } from "@/lib/mcp/auth";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  accountId: z.string().min(1, "Account ID is required"),
  scopes: z
    .array(z.enum(VALID_SCOPES as unknown as [string, ...string[]]))
    .min(1, "At least one scope is required"),
  expiresInDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.account.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = await prisma.mCPApiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      accountId: true,
      scopes: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
      _count: { select: { usageLogs: true } },
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.account.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createKeySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, accountId, scopes, expiresInDays } = parsed.data;

    // Verify the target account exists before creating the key
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });
    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 400 },
      );
    }

    const { rawKey, keyHash } = generateApiKey();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.mCPApiKey.create({
      data: {
        name,
        keyHash,
        accountId,
        scopes: JSON.stringify(scopes),
        ...(expiresAt ? { expiresAt } : {}),
      },
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // Only returned on creation
      scopes: apiKey.scopes,
      expiresAt: expiresAt?.toISOString() || null,
      message: "Save this key -- it will not be shown again.",
    });
  } catch (error) {
    logger.errorWithCause("MCP key creation error:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
