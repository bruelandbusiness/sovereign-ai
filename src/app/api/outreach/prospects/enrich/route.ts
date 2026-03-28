import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export const dynamic = "force-dynamic";
const TAG = "[api/outreach/prospects/enrich]";

const RATE_LIMIT_MS = 1_000;

const enrichSchema = z.object({
  prospectIds: z.array(z.string().min(1).max(200)).max(200).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

// ---------------------------------------------------------------------------
// POST — enrich prospects that don't have an email yet (uses Hunter.io)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = enrichSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { prospectIds, limit } = parsed.data;
    const maxLimit = Math.min(limit ?? 50, 200);

    const apiKey = process.env.ENRICHMENT_EMAIL_FINDER_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ENRICHMENT_EMAIL_FINDER_KEY is not configured" },
        { status: 503 },
      );
    }

    // Find prospects needing enrichment
    const where: Record<string, unknown> = {
      email: null,
      website: { not: null },
    };

    if (prospectIds && prospectIds.length > 0) {
      where.id = { in: prospectIds };
    }

    const prospects = await prisma.prospect.findMany({
      where,
      take: maxLimit,
      orderBy: { score: "desc" },
      select: {
        id: true,
        website: true,
      },
    });

    let enrichedCount = 0;
    let emailsFound = 0;
    const errors: string[] = [];

    for (const prospect of prospects) {
      try {
        if (!prospect.website) continue;

        // Extract domain from website
        let domain: string;
        try {
          const url = new URL(
            prospect.website.startsWith("http")
              ? prospect.website
              : `https://${prospect.website}`,
          );
          domain = url.hostname.replace(/^www\./, "");
        } catch {
          continue;
        }

        const baseUrl =
          process.env.ENRICHMENT_EMAIL_FINDER_URL ??
          "https://api.hunter.io/v2/domain-search";

        const url = new URL(baseUrl);
        url.searchParams.set("api_key", apiKey);
        url.searchParams.set("domain", domain);
        url.searchParams.set("limit", "1");

        const response = await fetchWithTimeout(
          url.toString(),
          { method: "GET", headers: { Accept: "application/json" } },
          10_000,
        );

        if (!response.ok) {
          logger.warn(`${TAG} Hunter.io returned ${response.status}`, {
            prospectId: prospect.id,
            domain,
          });
          continue;
        }

        const data = await response.json();
        const emails = data?.data?.emails;

        if (Array.isArray(emails) && emails.length > 0) {
          const best = emails[0];
          const email: string | undefined = best.value;
          const verified = (best.confidence ?? 0) >= 80;

          if (email) {
            await prisma.prospect.update({
              where: { id: prospect.id },
              data: {
                email,
                emailVerified: verified,
                emailSource: "hunter",
              },
            });
            emailsFound++;
          }
        }

        enrichedCount++;

        // Rate limit
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
      } catch (err) {
        const msg = `Failed to enrich prospect ${prospect.id}: ${
          err instanceof Error ? err.message : String(err)
        }`;
        logger.warn(`${TAG} ${msg}`);
        errors.push(msg);
      }
    }

    logger.info(`${TAG} Enrichment run complete`, {
      processed: enrichedCount,
      emailsFound,
      errors: errors.length,
    });

    return NextResponse.json({
      enriched: enrichedCount,
      emailsFound,
      errors,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} POST failed`, error);
    return NextResponse.json(
      { error: "Enrichment failed" },
      { status: 500 },
    );
  }
}
