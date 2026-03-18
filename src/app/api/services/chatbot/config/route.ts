import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
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
}

export async function PUT(request: Request) {
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

  const data: Record<string, unknown> = {};

  if (typeof body.greeting === "string") {
    data.greeting = body.greeting;
  }
  if (typeof body.systemPrompt === "string") {
    data.systemPrompt = body.systemPrompt;
  }
  if (typeof body.primaryColor === "string") {
    data.primaryColor = body.primaryColor;
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
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
}
