import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// POST — receive webhooks from FSM platforms
// Supports: ServiceTitan, Jobber, Housecall Pro
//
// Each platform sends different payloads. We normalize them and log the event.
// ---------------------------------------------------------------------------
//
// IMPORTANT — Webhook Signature Verification Limitation
// =====================================================
// The signature verification below uses a generic HMAC-SHA256 scheme with a
// single shared secret (FSM_WEBHOOK_SECRET). This does NOT match the actual
// signing mechanisms used by the supported FSM platforms:
//
//   - ServiceTitan: Uses its own signature scheme with per-app credentials.
//   - Jobber:       Uses a per-subscription signing secret with a different
//                   header and payload format.
//   - Housecall Pro: Uses its own signing approach tied to its OAuth app.
//
// Because each platform uses a different signing mechanism, the current
// generic HMAC check will not validate real webhook deliveries from any of
// these platforms. In production, you need one of the following:
//
//   1. A webhook proxy/adapter (e.g., an API gateway or middleware) that
//      verifies each platform's native signature and then forwards the
//      payload to this endpoint with a unified HMAC signature computed
//      using FSM_WEBHOOK_SECRET.
//
//   2. Per-platform verification logic in this handler that detects the
//      source platform (via headers or payload shape) and applies the
//      correct verification algorithm and credentials for that platform.
//
// Until one of these approaches is implemented, the current HMAC check
// serves only as a placeholder that prevents unsigned / random requests
// and works correctly if a webhook proxy is placed in front of this endpoint.
// ---------------------------------------------------------------------------

interface WebhookPayload {
  platform?: string;
  event?: string;
  // ServiceTitan webhook fields
  eventType?: string;
  tenantId?: string;
  data?: Record<string, unknown>;
  // Jobber webhook fields
  topic?: string;
  account_id?: string;
  // Housecall Pro webhook fields
  type?: string;
  object?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// HMAC signature verification
// ---------------------------------------------------------------------------

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    // ── Verify webhook secret is present ──────────────────────
    const secret = process.env.FSM_WEBHOOK_SECRET;
    if (!secret) {
      logger.error("[fsm-webhook] FSM_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 401 }
      );
    }

    const signature = request.headers.get("x-webhook-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody) as WebhookPayload;

    // Determine which platform sent the webhook
    const platform = detectPlatform(request, body);
    if (!platform) {
      return NextResponse.json(
        { error: "Unable to determine FSM platform" },
        { status: 400 }
      );
    }

    // Normalize the webhook event
    const normalized = normalizeEvent(platform, body);

    // Find the connection for this platform
    // Use externalAccountId or find by platform across all connections
    const connection = await prisma.fSMConnection.findFirst({
      where: {
        platform,
        isActive: true,
        ...(normalized.accountId
          ? { externalAccountId: normalized.accountId }
          : {}),
      },
    });

    if (!connection) {
      // Log but don't error — the webhook may be for a disconnected client
      logger.warn(
        `[fsm-webhook] No active connection found for platform=${platform} accountId=${normalized.accountId}`
      );
      return NextResponse.json({ received: true, matched: false });
    }

    // Create sync log entry
    await prisma.fSMSyncLog.create({
      data: {
        connectionId: connection.id,
        direction: "inbound",
        entityType: normalized.entityType,
        entityId: null,
        externalId: normalized.externalId || null,
        action: normalized.action,
        status: "success",
        details: normalized.details,
      },
    });

    // Update last sync time
    await prisma.fSMConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      received: true,
      matched: true,
      connectionId: connection.id,
    });
  } catch (error) {
    logger.errorWithCause("[fsm-webhook] Error processing webhook:", error);
    return NextResponse.json({ received: true, error: "Failed to process webhook" });
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function detectPlatform(
  request: NextRequest,
  body: WebhookPayload
): string | null {
  // Check explicit platform field
  if (body.platform) return body.platform;

  // ServiceTitan uses eventType and tenantId
  if (body.eventType && body.tenantId) return "servicetitan";

  // Jobber uses topic and account_id
  if (body.topic && body.account_id) return "jobber";

  // Housecall Pro uses type and object
  if (body.type && body.object) return "housecallpro";

  // Check request headers for platform hints
  const userAgent = request.headers.get("user-agent") || "";
  if (userAgent.includes("ServiceTitan")) return "servicetitan";
  if (userAgent.includes("Jobber")) return "jobber";
  if (userAgent.includes("HousecallPro")) return "housecallpro";

  return null;
}

interface NormalizedEvent {
  entityType: string;
  action: string;
  externalId?: string;
  accountId?: string;
  details: string;
}

function normalizeEvent(
  platform: string,
  body: WebhookPayload
): NormalizedEvent {
  switch (platform) {
    case "servicetitan": {
      const eventType = body.eventType || "unknown";
      const entityType = eventType.includes("Job")
        ? "job"
        : eventType.includes("Customer")
          ? "customer"
          : eventType.includes("Invoice")
            ? "invoice"
            : "job";
      const action = eventType.includes("Created")
        ? "created"
        : eventType.includes("Updated")
          ? "updated"
          : eventType.includes("Completed")
            ? "synced"
            : "synced";

      return {
        entityType,
        action,
        externalId: body.data?.id ? String(body.data.id) : undefined,
        accountId: body.tenantId,
        details: `ServiceTitan webhook: ${eventType}`,
      };
    }

    case "jobber": {
      const topic = body.topic || "unknown";
      const parts = topic.split(".");
      const entityType = parts[0] === "client"
        ? "customer"
        : parts[0] || "job";
      const action = parts[1] === "create"
        ? "created"
        : parts[1] === "update"
          ? "updated"
          : parts[1] === "destroy"
            ? "deleted"
            : "synced";

      return {
        entityType,
        action,
        accountId: body.account_id,
        details: `Jobber webhook: ${topic}`,
      };
    }

    case "housecallpro": {
      const type = body.type || "unknown";
      const entityType = type.includes("customer")
        ? "customer"
        : type.includes("job")
          ? "job"
          : type.includes("invoice")
            ? "invoice"
            : "job";
      const action = type.includes("created")
        ? "created"
        : type.includes("updated")
          ? "updated"
          : type.includes("completed")
            ? "synced"
            : "synced";

      return {
        entityType,
        action,
        externalId: body.object?.id ? String(body.object.id) : undefined,
        details: `Housecall Pro webhook: ${type}`,
      };
    }

    default:
      return {
        entityType: "job",
        action: "synced",
        details: `Unknown platform webhook: ${JSON.stringify(body).slice(0, 200)}`,
      };
  }
}
