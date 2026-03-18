import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServiceById } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serviceId } = await params;
  const service = getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  const clientId = session.account.client.id;

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId } },
  });

  if (!clientService) {
    return NextResponse.json(
      { error: "Service not provisioned" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: clientService.id,
    serviceId: clientService.serviceId,
    status: clientService.status,
    activatedAt: clientService.activatedAt?.toISOString() ?? null,
    config: clientService.config ? JSON.parse(clientService.config) : {},
    createdAt: clientService.createdAt.toISOString(),
    updatedAt: clientService.updatedAt.toISOString(),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serviceId } = await params;
  const service = getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  const clientId = session.account.client.id;

  const existing = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Service not provisioned" },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Merge new config with existing config
  const existingConfig = existing.config
    ? JSON.parse(existing.config)
    : {};
  const mergedConfig = { ...existingConfig, ...body };

  const updated = await prisma.clientService.update({
    where: { id: existing.id },
    data: { config: JSON.stringify(mergedConfig) },
  });

  return NextResponse.json({
    id: updated.id,
    serviceId: updated.serviceId,
    status: updated.status,
    activatedAt: updated.activatedAt?.toISOString() ?? null,
    config: JSON.parse(updated.config!),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}
