import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
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

  // Verify the endpoint belongs to this client
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { id, clientId },
    select: { id: true },
  });

  if (!endpoint) {
    return NextResponse.json(
      { error: "Webhook endpoint not found" },
      { status: 404 },
    );
  }

  const logs = await prisma.webhookLog.findMany({
    where: { endpointId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      event: true,
      success: true,
      statusCode: true,
      payload: true,
      response: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    logs.map((log) => ({
      id: log.id,
      event: log.event,
      success: log.success,
      statusCode: log.statusCode,
      payload: log.payload,
      response: log.response,
      createdAt: log.createdAt.toISOString(),
    })),
  );
}
