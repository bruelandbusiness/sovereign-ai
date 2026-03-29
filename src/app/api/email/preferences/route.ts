import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Valid preference categories that users can toggle.
 * `transactional` is always true and cannot be disabled.
 */
const MUTABLE_CATEGORIES = [
  "marketing",
  "weeklyReports",
  "productUpdates",
] as const;

type MutableCategory = (typeof MUTABLE_CATEGORIES)[number];

function isMutableCategory(key: string): key is MutableCategory {
  return (MUTABLE_CATEGORIES as readonly string[]).includes(key);
}

/**
 * GET /api/email/preferences?clientId=xxx
 *
 * Returns current email preferences for the given client.
 * Creates default preferences (all opted-in) if none exist yet.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "email-preferences", 30);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json(
      { error: "Missing clientId parameter" },
      { status: 400 },
    );
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 },
      );
    }

    // Upsert: return existing preferences or create defaults
    const prefs = await prisma.emailPreference.upsert({
      where: { clientId: client.id },
      update: {},
      create: {
        clientId: client.id,
        marketing: true,
        weeklyReports: true,
        productUpdates: true,
        transactional: true,
      },
    });

    return NextResponse.json({
      clientId: prefs.clientId,
      preferences: {
        marketing: prefs.marketing,
        weekly_reports: prefs.weeklyReports,
        product_updates: prefs.productUpdates,
        transactional: prefs.transactional, // always true
      },
    });
  } catch (error) {
    logger.errorWithCause("[api/email/preferences] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/email/preferences
 *
 * Body: { clientId: string, preferences: { marketing?: boolean, weekly_reports?: boolean, product_updates?: boolean } }
 *
 * Updates category-specific email preferences for the client.
 * `transactional` cannot be set to false.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "email-preferences", 30);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { clientId, preferences } = body as {
    clientId?: string;
    preferences?: Record<string, unknown>;
  };

  if (!clientId || typeof clientId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid clientId" },
      { status: 400 },
    );
  }

  if (!preferences || typeof preferences !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid preferences object" },
      { status: 400 },
    );
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 },
      );
    }

    // Map snake_case API keys to camelCase Prisma fields
    const keyMap: Record<string, MutableCategory> = {
      marketing: "marketing",
      weekly_reports: "weeklyReports",
      product_updates: "productUpdates",
    };

    const updateData: Partial<Record<MutableCategory, boolean>> = {};

    for (const [apiKey, value] of Object.entries(preferences)) {
      // Skip transactional -- it cannot be disabled
      if (apiKey === "transactional") continue;

      const prismaKey = keyMap[apiKey];
      if (!prismaKey || !isMutableCategory(prismaKey)) {
        return NextResponse.json(
          { error: `Unknown preference category: ${apiKey}` },
          { status: 400 },
        );
      }

      if (typeof value !== "boolean") {
        return NextResponse.json(
          { error: `Preference value for '${apiKey}' must be a boolean` },
          { status: 400 },
        );
      }

      updateData[prismaKey] = value;
    }

    const updated = await prisma.emailPreference.upsert({
      where: { clientId: client.id },
      update: updateData,
      create: {
        clientId: client.id,
        marketing: updateData.marketing ?? true,
        weeklyReports: updateData.weeklyReports ?? true,
        productUpdates: updateData.productUpdates ?? true,
        transactional: true,
      },
    });

    // If all mutable categories are disabled, also record an unsubscribe
    // activity event for backward compatibility with existing logic.
    const allDisabled =
      !updated.marketing && !updated.weeklyReports && !updated.productUpdates;

    if (allDisabled) {
      const existing = await prisma.activityEvent.findFirst({
        where: { clientId: client.id, type: "email_unsubscribe" },
      });
      if (!existing) {
        await prisma.activityEvent.create({
          data: {
            clientId: client.id,
            type: "email_unsubscribe",
            title: "Marketing email unsubscribe",
            description:
              "Client opted out of all non-transactional email categories.",
          },
        });
      }
    } else {
      // If they re-enabled any category, remove the blanket unsubscribe event
      await prisma.activityEvent.deleteMany({
        where: { clientId: client.id, type: "email_unsubscribe" },
      });
    }

    return NextResponse.json({
      clientId: updated.clientId,
      preferences: {
        marketing: updated.marketing,
        weekly_reports: updated.weeklyReports,
        product_updates: updated.productUpdates,
        transactional: updated.transactional,
      },
    });
  } catch (error) {
    logger.errorWithCause("[api/email/preferences] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
