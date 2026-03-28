import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const data = await cache.wrap(`services:${clientId}`, 60, async () => {
      const services = await prisma.clientService.findMany({
        where: { clientId },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          serviceId: true,
          status: true,
          activatedAt: true,
        },
      });

      return services.map((s) => ({
        serviceId: s.serviceId,
        status: s.status,
        activatedAt: s.activatedAt?.toISOString() || null,
      }));
    });

    const response = NextResponse.json(data);

    response.headers.set(
      "Cache-Control",
      "private, max-age=120, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[services] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
