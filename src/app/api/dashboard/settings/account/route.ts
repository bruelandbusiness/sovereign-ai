import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { rateLimitByIP } from "@/lib/rate-limit";

const updateAccountSchema = z.object({
  ownerName: z.string().min(1).max(200).optional(),
  businessName: z.string().min(1).max(200).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
});

interface NotificationPreferences {
  newLeads: boolean;
  reportsReady: boolean;
  billingAlerts: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  newLeads: true,
  reportsReady: true,
  billingAlerts: true,
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
    return {
      newLeads: typeof prefs.newLeads === "boolean" ? prefs.newLeads : true,
      reportsReady:
        typeof prefs.reportsReady === "boolean" ? prefs.reportsReady : true,
      billingAlerts:
        typeof prefs.billingAlerts === "boolean" ? prefs.billingAlerts : true,
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
    console.error("[settings/account] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch account settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Rate limit: 20 account updates per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "settings-account-update", 20);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
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
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
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

      const prev = (existing.notificationPreferences ?? {}) as Record<string, boolean>;
      existing.notificationPreferences = {
        newLeads: prev.newLeads ?? true,
        reportsReady: prev.reportsReady ?? true,
        billingAlerts: prev.billingAlerts ?? true,
        email: body.notifications.email ?? prev.email ?? true,
        push: body.notifications.push ?? prev.push ?? true,
        sms: body.notifications.sms ?? prev.sms ?? true,
      };

      updateData.onboardingData = JSON.stringify(existing);
    }

    await prisma.client.update({
      where: { id: clientId },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    console.error("[settings/account] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update account settings" },
      { status: 500 }
    );
  }
}
