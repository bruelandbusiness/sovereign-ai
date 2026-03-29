import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const createSourceSchema = z.object({
  type: z.enum([
    "permit",
    "real_estate",
    "competitor_review",
    "seasonal",
    "aging_home",
  ]),
  name: z.string().min(1, "Name is required").max(200),
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const sources = await prisma.discoverySource.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      sources.map((s) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        config: s.config ? JSON.parse(s.config) : null,
        isActive: s.isActive,
        lastRunAt: s.lastRunAt?.toISOString() ?? null,
        lastRunStatus: s.lastRunStatus,
        lastRunError: s.lastRunError,
        lastRunCount: s.lastRunCount,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    logger.errorWithCause("[api/discovery/sources] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch discovery sources" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    // Pre-validation: check required fields with descriptive errors
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }
    const raw = body as Record<string, unknown>;
    if (!raw.type || typeof raw.type !== "string") {
      return NextResponse.json(
        { error: "Type is required and must be a string" },
        { status: 400 },
      );
    }
    if (!raw.name || typeof raw.name !== "string" || raw.name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }
    if (typeof raw.name === "string" && raw.name.length > 200) {
      return NextResponse.json(
        { error: "Name must not exceed 200 characters" },
        { status: 400 },
      );
    }

    const parsed = createSourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { type, name, config, isActive } = parsed.data;

    const source = await prisma.discoverySource.create({
      data: {
        clientId,
        type,
        name,
        config: config ? JSON.stringify(config) : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        id: source.id,
        type: source.type,
        name: source.name,
        config: source.config ? JSON.parse(source.config) : null,
        isActive: source.isActive,
        createdAt: source.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.errorWithCause("[api/discovery/sources] POST failed", error);
    return NextResponse.json(
      { error: "Failed to create discovery source" },
      { status: 500 },
    );
  }
}
