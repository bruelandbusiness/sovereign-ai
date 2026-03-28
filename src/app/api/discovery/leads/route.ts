import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sourceType = searchParams.get("sourceType");
    const cursor = searchParams.get("cursor");

    const where: Record<string, unknown> = { clientId };
    if (status) where.status = status;
    if (sourceType) where.sourceType = sourceType;

    const leads = await prisma.discoveredLead.findMany({
      where,
      orderBy: [{ discoveryScore: "desc" }, { createdAt: "desc" }],
      take: 50,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      select: {
        id: true,
        sourceType: true,
        externalId: true,
        propertyAddress: true,
        ownerName: true,
        ownerEmail: true,
        ownerPhone: true,
        propertyAge: true,
        propertyType: true,
        saleDate: true,
        salePrice: true,
        permitType: true,
        permitDate: true,
        reviewPlatform: true,
        reviewRating: true,
        reviewSnippet: true,
        competitorName: true,
        seasonalTrigger: true,
        discoveryScore: true,
        status: true,
        convertedLeadId: true,
        createdAt: true,
        source: {
          select: { name: true, type: true },
        },
      },
    });

    const nextCursor = leads.length === 50 ? leads[leads.length - 1].id : null;

    const jsonResponse = NextResponse.json({
      leads: leads.map((l) => ({
        id: l.id,
        sourceType: l.sourceType,
        sourceName: l.source.name,
        externalId: l.externalId,
        propertyAddress: l.propertyAddress,
        ownerName: l.ownerName,
        ownerEmail: l.ownerEmail,
        ownerPhone: l.ownerPhone,
        propertyAge: l.propertyAge,
        propertyType: l.propertyType,
        saleDate: l.saleDate?.toISOString() ?? null,
        salePrice: l.salePrice,
        permitType: l.permitType,
        permitDate: l.permitDate?.toISOString() ?? null,
        reviewPlatform: l.reviewPlatform,
        reviewRating: l.reviewRating,
        reviewSnippet: l.reviewSnippet,
        competitorName: l.competitorName,
        seasonalTrigger: l.seasonalTrigger,
        discoveryScore: l.discoveryScore,
        status: l.status,
        convertedLeadId: l.convertedLeadId,
        createdAt: l.createdAt.toISOString(),
      })),
      nextCursor,
    });
    jsonResponse.headers.set("Cache-Control", "private, max-age=60");
    return jsonResponse;
  } catch (error) {
    logger.errorWithCause("[api/discovery/leads] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch discovered leads" },
      { status: 500 },
    );
  }
}
