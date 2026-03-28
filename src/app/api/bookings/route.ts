import { NextRequest } from "next/server";
import { bookingFormSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { autoPushBookingToFSM } from "@/lib/integrations/fsm-autopush";
import { trackRevenueEvent } from "@/lib/revenue-attribution";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST — public booking form submission
//
// Validates the input with bookingFormSchema, creates a Lead record, and
// creates a Notification for the admin. No authentication required since
// this is a public-facing form.
//
// NOTE: This is the *public website contact form* route (name, email,
// businessName, interestedIn). For the actual booking-slot creation used by
// authenticated dashboard users, see /api/services/booking/upcoming (POST).
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "booking", 10);
  if (!allowed) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await request.json();
    const parsed = bookingFormSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400);
    }

    const { name, email, businessName, phone, interestedIn, notes } =
      parsed.data;

    // Find the first client to associate the lead with (admin/system client).
    let client = await prisma.client.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    // If no client exists yet, we still want to persist — create a minimal one
    if (!client) {
      const systemAccount = await prisma.account.create({
        data: {
          email: "system@trysovereignai.com",
          name: "System",
          role: "admin",
        },
      });
      client = await prisma.client.create({
        data: {
          accountId: systemAccount.id,
          businessName: "Sovereign AI",
          ownerName: "System",
        },
      });
    }

    // Dedup check: if a lead with the same email + clientId was created in
    // the last 5 minutes, return the existing lead instead of creating a
    // duplicate (prevents double-click submissions).
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingLead = await prisma.lead.findFirst({
      where: {
        email,
        clientId: client.id,
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existingLead) {
      return apiSuccess({ leadId: existingLead.id });
    }

    // Create the Lead
    const lead = await prisma.lead.create({
      data: {
        clientId: client.id,
        name,
        email,
        phone: phone || null,
        source: "website",
        status: "new",
        notes: [
          `Business: ${businessName}`,
          `Interested in: ${interestedIn}`,
          notes ? `Notes: ${notes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });

    // Create a Notification for the admin account
    const adminAccount = await prisma.account.findFirst({
      where: { role: "admin" },
    });

    if (adminAccount) {
      await prisma.notification.create({
        data: {
          accountId: adminAccount.id,
          type: "booking",
          title: "New Booking Request",
          message: `${name} from ${businessName} requested a strategy call (interested in: ${interestedIn}).`,
          actionUrl: "/dashboard/services/booking",
        },
      });
    }

    // Track revenue attribution — lead captured from website booking form
    trackRevenueEvent(client.id, {
      leadId: lead.id,
      channel: "website",
      eventType: "lead_captured",
      metadata: { businessName, interestedIn },
    }).catch((err) =>
      logger.errorWithCause("[bookings] Revenue tracking failed:", err),
    );

    // Auto-push booking to connected FSM platforms (non-blocking)
    autoPushBookingToFSM(client.id, {
      id: lead.id,
      customerName: name,
      customerEmail: email,
      customerPhone: phone || null,
      scheduledAt: new Date().toISOString(),
      description: `Booking request: ${interestedIn}${notes ? ` — ${notes}` : ""}`,
    }).catch((err) =>
      logger.errorWithCause(
        "[bookings] FSM autopush failed:",
        err instanceof Error ? err.message : err,
      ),
    );

    return apiSuccess({ leadId: lead.id }, 201);
  } catch (error) {
    logger.errorWithCause("[api/bookings] Error:", error);
    return apiError("Internal server error", 500);
  }
}
