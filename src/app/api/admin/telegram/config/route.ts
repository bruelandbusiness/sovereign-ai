import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const createSchema = z.object({
  chatId: z.string().min(1).max(100),
  alertLevels: z
    .array(z.string())
    .optional()
    .default(["critical", "revenue"]),
  dailyDigest: z.boolean().optional().default(true),
});

// ---------------------------------------------------------------------------
// GET — List all Telegram configs
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const configs = await prisma.telegramConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ configs });
  } catch (err) {
    logger.errorWithCause("[admin/telegram/config] GET error", err);
    return NextResponse.json(
      { error: "Failed to fetch configs" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Create or update a Telegram config
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { chatId, alertLevels, dailyDigest } = parsed.data;
    const alertLevelsJson = JSON.stringify(alertLevels);

    const config = await prisma.telegramConfig.upsert({
      where: { chatId },
      create: {
        chatId,
        alertLevels: alertLevelsJson,
        dailyDigest,
      },
      update: {
        alertLevels: alertLevelsJson,
        dailyDigest,
        isActive: true,
      },
    });

    logger.info("[admin/telegram/config] Config upserted", {
      chatId,
      configId: config.id,
    });

    return NextResponse.json({ config }, { status: 200 });
  } catch (err) {
    logger.errorWithCause("[admin/telegram/config] POST error", err);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 },
    );
  }
}
