import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api-outreach-domains]";

// ---------------------------------------------------------------------------
// GET — List domain warmup status for client
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
    const domains = await prisma.outreachDomain.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ domains });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to list domains`, error);
    return NextResponse.json(
      { error: "Failed to list domains" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Add a domain for warmup
// ---------------------------------------------------------------------------

const addDomainSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, {
      message: "Invalid domain format",
    }),
});

export async function POST(request: Request) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const body = await request.json();
    const parsed = addDomainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { domain } = parsed.data;

    // Check for existing domain
    const existing = await prisma.outreachDomain.findUnique({
      where: { clientId_domain: { clientId, domain } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Domain already registered for this client" },
        { status: 409 }
      );
    }

    const record = await prisma.outreachDomain.create({
      data: {
        clientId,
        domain,
        dailyLimit: 20,
        currentDailySent: 0,
        warmupStartDate: new Date(),
        warmupComplete: false,
        rampRate: 10,
        maxDailyLimit: 200,
        reputation: "warming",
      },
    });

    logger.info(`${TAG} Added domain ${domain} for warmup`, { clientId });

    return NextResponse.json({ domain: record }, { status: 201 });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to add domain`, error);
    return NextResponse.json(
      { error: "Failed to add domain" },
      { status: 500 }
    );
  }
}
