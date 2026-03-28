import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const updateAccountSchema = z.object({
  ownerName: z.string().min(1).max(200).optional(),
  businessName: z.string().min(1).max(200).optional(),
  notifications: z.object({
    newLeads: z.boolean().optional(),
    reportsReady: z.boolean().optional(),
    billingAlerts: z.boolean().optional(),
    reviewAlerts: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    frequency: z.enum(["realtime", "daily_digest", "weekly_digest"]).optional(),
  }).optional(),
});

interface NotificationPreferences {
  newLeads: boolean;
  reportsReady: boolean;
  billingAlerts: boolean;
  reviewAlerts: boolean;
  marketingEmails: boolean;
  pushEnabled: boolean;
  frequency: "realtime" | "daily_digest" | "weekly_digest";
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  newLeads: true,
  reportsReady: true,
  billingAlerts: true,
  reviewAlerts: true,
  marketingEmails: true,
  pushEnabled: false,
  frequency: "realtime",
};

/**
 * Parse notification preferences stored in the onboardingData JSON blob.
 * Falls back to defaults if the key is missing or malformed.
 */
function parseNotificationPrefs(
  onboardingData: string | null
): NotificationPreferences {
  if (!onboardingData) return DEFAULT_NOTIFICATIONS;
  try {
    const parsed = JSON.parse(onboardingData);
    const prefs = parsed?.notificationPreferences;
    if (!prefs || typeof prefs !== "object") return DEFAULT_NOTIFICATIONS;

    const validFrequencies = ["realtime", "daily_digest", "weekly_digest"] as const;
    const freq = validFrequencies.includes(prefs.frequency)
      ? prefs.frequency
      : "realtime";

    return {
      newLeads: typeof prefs.newLeads === "boolean" ? prefs.newLeads : true,
      reportsReady:
        typeof prefs.reportsReady === "boolean" ? prefs.reportsReady : true,
      billingAlerts:
        typeof prefs.billingAlerts === "boolean" ? prefs.billingAlerts : true,
      reviewAlerts:
        typeof prefs.reviewAlerts === "boolean" ? prefs.reviewAlerts : true,
      marketingEmails:
        typeof prefs.marketingEmails === "boolean" ? prefs.marketingEmails : true,
      pushEnabled:
        typeof prefs.pushEnabled === "boolean" ? prefs.pushEnabled : false,
      frequency: freq,
    };
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export async function GET() {
  try {
    const { clientId, session } = await requireClient();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        ownerName: true,
        businessName: true,
        onboardingData: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const notifications = parseNotificationPrefs(client.onboardingData);

    return NextResponse.json({
      profile: {
        ownerName: client.ownerName,
        email: session.account.email,
        businessName: client.businessName,
        notifications,
      },
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    logger.errorWithCause("[settings/account] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch account settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Rate limit: 20 account updates per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "settings-account-update", 20);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
      rl
    );
  }

  try {
    const { clientId } = await requireClient();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateAccountSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, onboardingData: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Build update payload for scalar Client fields
    const updateData: Record<string, unknown> = {};
    if (body.ownerName && body.ownerName.trim()) {
      updateData.ownerName = body.ownerName.trim();
    }
    if (body.businessName && body.businessName.trim()) {
      updateData.businessName = body.businessName.trim();
    }

    // Merge notification preferences into the onboardingData JSON blob
    if (body.notifications) {
      let existing: Record<string, unknown> = {};
      if (client.onboardingData) {
        try {
          existing = JSON.parse(client.onboardingData);
        } catch {
          existing = {};
        }
      }

      const prev = (existing.notificationPreferences ?? {}) as Record<string, unknown>;
      existing.notificationPreferences = {
        newLeads: body.notifications.newLeads ?? prev.newLeads ?? true,
        reportsReady: body.notifications.reportsReady ?? prev.reportsReady ?? true,
        billingAlerts: body.notifications.billingAlerts ?? prev.billingAlerts ?? true,
        reviewAlerts: body.notifications.reviewAlerts ?? prev.reviewAlerts ?? true,
        marketingEmails: body.notifications.marketingEmails ?? prev.marketingEmails ?? true,
        pushEnabled: body.notifications.pushEnabled ?? prev.pushEnabled ?? false,
        frequency: body.notifications.frequency ?? prev.frequency ?? "realtime",
      };

      updateData.onboardingData = JSON.stringify(existing);
    }

    await prisma.client.update({
      where: { id: clientId },
      data: updateData,
    });

    return setRateLimitHeaders(NextResponse.json({ ok: true }), rl);
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    logger.errorWithCause("[settings/account] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update account settings" },
      { status: 500 }
    );
  }
}
