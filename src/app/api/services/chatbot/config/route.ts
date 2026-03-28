import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const updateConfigSchema = z.object({
  greeting: z.string().max(2000).optional(),
  systemPrompt: z.string().max(10000).optional(),
  primaryColor: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

// CORS headers for the public widget config endpoint
const widgetCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: widgetCorsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("id");

    // ── Public widget path: GET /api/services/chatbot/config?id=<chatbotId> ──
    // Returns only public-safe fields (greeting, primaryColor) with CORS headers.
    // Does NOT expose systemPrompt or other sensitive config.
    if (publicId) {
      if (!/^[a-zA-Z0-9_-]+$/.test(publicId)) {
        return NextResponse.json(
          { error: "Invalid id format" },
          { status: 400, headers: widgetCorsHeaders },
        );
      }

      const config = await prisma.chatbotConfig.findUnique({
        where: { id: publicId },
      });

      if (!config || !config.isActive) {
        return NextResponse.json(
          { error: "Chatbot not found" },
          { status: 404, headers: widgetCorsHeaders },
        );
      }

      return NextResponse.json(
        {
          greeting: config.greeting,
          primaryColor: config.primaryColor,
        },
        { headers: widgetCorsHeaders },
      );
    }

    // ── Authenticated dashboard path: GET /api/services/chatbot/config ──
    const session = await getSession();
    if (!session?.account.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = session.account.client.id;

    const config = await prisma.chatbotConfig.findUnique({
      where: { clientId },
    });

    if (!config) {
      return NextResponse.json({ error: "Chatbot not provisioned" }, { status: 404 });
    }

    return NextResponse.json({
      id: config.id,
      greeting: config.greeting,
      systemPrompt: config.systemPrompt,
      primaryColor: config.primaryColor,
      isActive: config.isActive,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("GET /api/services/chatbot/config failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const existing = await prisma.chatbotConfig.findUnique({
    where: { clientId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Chatbot not provisioned" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.greeting !== undefined) {
    data.greeting = parsed.data.greeting;
  }
  if (parsed.data.systemPrompt !== undefined) {
    data.systemPrompt = parsed.data.systemPrompt;
  }
  if (parsed.data.primaryColor !== undefined) {
    data.primaryColor = parsed.data.primaryColor;
  }
  if (parsed.data.isActive !== undefined) {
    data.isActive = parsed.data.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const updated = await prisma.chatbotConfig.update({
    where: { clientId },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    greeting: updated.greeting,
    systemPrompt: updated.systemPrompt,
    primaryColor: updated.primaryColor,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
  } catch (error) {
    logger.error("PUT /api/services/chatbot/config failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
