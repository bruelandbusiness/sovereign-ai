import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { scrapeProspects } from "@/lib/outreach/prospect-scraper";
import { scoreProspectAsync } from "@/lib/outreach/prospect-scorer";
import type { ProspectData } from "@/lib/outreach/types";

const scrapeSchema = z.object({
  vertical: z.string().min(1, "vertical is required"),
  city: z.string().min(1, "city is required"),
  state: z.string().min(1, "state is required"),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const dynamic = "force-dynamic";
const TAG = "[api/outreach/prospects/scrape]";

// ---------------------------------------------------------------------------
// POST — start a prospect scrape job
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
    if (!raw.vertical || typeof raw.vertical !== "string" || raw.vertical.trim() === "") {
      return NextResponse.json(
        { error: "Vertical is required" },
        { status: 400 },
      );
    }
    if (!raw.city || typeof raw.city !== "string" || raw.city.trim() === "") {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 },
      );
    }
    if (!raw.state || typeof raw.state !== "string" || raw.state.trim() === "") {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 },
      );
    }

    const parsed = scrapeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { vertical, city, state, limit: maxLimit } = parsed.data;

    // Run the scrape
    const result = await scrapeProspects({
      vertical,
      city,
      state,
      limit: maxLimit,
    });

    // Store results in database, deduplicating by placeId
    let storedCount = 0;
    let duplicateCount = 0;

    for (const prospect of result.prospects) {
      try {
        // Score the prospect
        const scoreResult = await scoreProspectAsync({
          reviewCount: prospect.reviewCount,
          rating: prospect.rating,
          website: prospect.website,
          email: prospect.email,
          employeeCount: null,
        });

        // Check for duplicate by placeId
        if (prospect.placeId) {
          const existing = await prisma.prospect.findUnique({
            where: { placeId: prospect.placeId },
          });

          if (existing) {
            duplicateCount++;
            continue;
          }
        }

        await prisma.prospect.create({
          data: prospectToDbRecord(prospect, vertical, city, state, scoreResult.total),
        });
        storedCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("Unique constraint")) {
          duplicateCount++;
          continue;
        }
        logger.errorWithCause(`${TAG} Failed to store prospect`, err, {
          businessName: prospect.businessName,
        });
      }
    }

    logger.info(`${TAG} Scrape job complete`, {
      query: result.query,
      found: result.totalFound,
      stored: storedCount,
      duplicates: duplicateCount,
    });

    return NextResponse.json({
      query: result.query,
      totalFound: result.totalFound,
      totalStored: storedCount,
      totalDuplicates: duplicateCount,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} POST failed`, error);
    return NextResponse.json(
      { error: "Scrape job failed" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prospectToDbRecord(
  p: ProspectData,
  vertical: string,
  city: string,
  state: string,
  score: number,
) {
  return {
    businessName: p.businessName,
    ownerName: p.ownerName,
    email: p.email,
    phone: p.phone,
    website: p.website,
    vertical,
    city,
    state,
    address: p.address,
    rating: p.rating,
    reviewCount: p.reviewCount,
    googleMapsUrl: p.googleMapsUrl,
    placeId: p.placeId,
    emailVerified: p.emailVerified,
    emailSource: p.emailSource,
    score,
    status: "new",
    source: "scrape",
  };
}
