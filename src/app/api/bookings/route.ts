import { NextRequest, NextResponse } from "next/server";
import { bookingFormSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { autoPushBookingToFSM } from "@/lib/integrations/fsm-autopush";

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
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = bookingFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, businessName, phone, interestedIn, notes } =
      parsed.data;

    // Find the first client to associate the lead with (admin/system client).
    // In a real multi-tenant setup this would be a dedicated system client.
    let client = await prisma.client.findFirst({
      orderBy: { createdAt: "asc" },
    });

    // If no client exists yet, we still want to persist — create a minimal one
    if (!client) {
      const systemAccount = await prisma.account.create({
        data: {
          email: "system@sovereignai.com",
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
    });

    if (existingLead) {
      return NextResponse.json(
        { success: true, leadId: existingLead.id },
        { status: 200 }
      );
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
          actionUrl: "/dashboard/bookings",
        },
      });
    }

    // Auto-push booking to connected FSM platforms (non-blocking)
    autoPushBookingToFSM(client.id, {
      id: lead.id,
      customerName: name,
      customerEmail: email,
      customerPhone: phone || null,
      scheduledAt: new Date().toISOString(),
      description: `Booking request: ${interestedIn}${notes ? ` — ${notes}` : ""}`,
    }).catch((err) => console.error("[bookings] FSM autopush failed:", err instanceof Error ? err.message : err));

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error("[api/bookings] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
