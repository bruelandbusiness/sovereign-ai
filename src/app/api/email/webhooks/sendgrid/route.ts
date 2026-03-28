import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addToSuppressionList } from "@/lib/compliance/suppression";
import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
interface SendGridEvent {
  event: string;
  sg_message_id?: string;
  url?: string;
  ip?: string;
  useragent?: string;
  email?: string;
  reason?: string;
  status?: string;
  type?: string;
  timestamp?: number;
}

// Map SendGrid event names to our internal event types
const EVENT_TYPE_MAP: Record<string, string> = {
  delivered: "delivered",
  open: "open",
  click: "click",
  bounce: "bounce",
  dropped: "bounce",
  spamreport: "complaint",
  group_unsubscribe: "unsubscribe",
  unsubscribe: "unsubscribe",
};

/**
 * Verify the SendGrid Event Webhook signature using ECDSA P-256 / SHA-256.
 *
 * SendGrid signs webhooks with an ECDSA private key and provides the
 * corresponding public key (base64-encoded DER / SPKI format) in the
 * Event Webhook settings UI. The signature and timestamp are sent in
 * the `x-twilio-email-event-webhook-signature` and
 * `x-twilio-email-event-webhook-timestamp` headers respectively.
 *
 * The signed payload is: timestamp + raw request body (concatenated).
 */
async function verifySendGridSignature(
  publicKeyBase64: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    // SendGrid provides the verification key as a base64-encoded DER (SPKI) blob
    const keyBuffer = Buffer.from(publicKeyBase64, "base64");
    const key = await crypto.subtle.importKey(
      "spki",
      keyBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const payload = timestamp + body;
    const payloadBuffer = new TextEncoder().encode(payload);
    const signatureBuffer = Buffer.from(signature, "base64");

    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signatureBuffer,
      payloadBuffer
    );
  } catch (err) {
    logger.errorWithCause("[sendgrid-webhook] Signature verification error:", err);
    return false;
  }
}

/**
 * Validate SendGrid webhook signature if SENDGRID_WEBHOOK_KEY is configured.
 */
async function validateWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const webhookKey = process.env.SENDGRID_WEBHOOK_KEY;

  // If no webhook key is configured, only allow in development
  if (!webhookKey) {
    if (process.env.NODE_ENV === "production") {
      logger.error("[SENDGRID WEBHOOK] SENDGRID_WEBHOOK_KEY not configured in production");
      return false;
    }
    return true;
  }

  const signature = request.headers.get("x-twilio-email-event-webhook-signature");
  const timestamp = request.headers.get("x-twilio-email-event-webhook-timestamp");

  if (!signature || !timestamp) {
    return false;
  }

  return verifySendGridSignature(webhookKey, signature, timestamp, body);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Validate webhook signature
    const isValid = await validateWebhookSignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let events: SendGridEvent[];
    try {
      events = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "Expected array of events" },
        { status: 400 }
      );
    }

    let processed = 0;

    for (const event of events) {
      const eventType = EVENT_TYPE_MAP[event.event];
      if (!eventType) {
        // Skip unknown event types
        continue;
      }

      // SendGrid message IDs often have a filter suffix like ".filter0001..."
      // Strip everything after the first dot for consistency
      const rawMessageId = event.sg_message_id || "";
      const messageId = rawMessageId.split(".")[0];

      if (!messageId) {
        continue;
      }

      try {
        // Record the email event — use try/catch for P2002 (unique constraint)
        // instead of find-then-create to eliminate the race window.
        try {
          await prisma.emailEvent.create({
            data: {
              messageId,
              type: eventType,
              metadata: JSON.stringify({
                url: event.url,
                ip: event.ip,
                userAgent: event.useragent,
                email: event.email,
                reason: event.reason,
                status: event.status,
                sgEvent: event.event,
              }),
            },
          });
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
            continue; // Already exists, skip
          }
          throw err;
        }

        // On bounce or dropped: update EmailQueue status and suppress
        if (eventType === "bounce") {
          await prisma.emailQueue.updateMany({
            where: { messageId },
            data: { status: "bounced" },
          });

          // Add to suppression list to prevent future sends
          if (event.email) {
            await addToSuppressionList({
              contactEmail: event.email,
              channel: "email",
              reason: "bounce",
              source: `sendgrid-webhook:${event.event}`,
            });
          }
        }

        // On spam complaint: suppress the recipient immediately.
        // High complaint rates destroy sender reputation.
        if (eventType === "complaint") {
          if (event.email) {
            await addToSuppressionList({
              contactEmail: event.email,
              channel: "email",
              reason: "complaint",
              source: "sendgrid-webhook:spamreport",
            });
          }
        }

        // On unsubscribe: suppress for marketing emails
        if (eventType === "unsubscribe") {
          if (event.email) {
            await addToSuppressionList({
              contactEmail: event.email,
              channel: "email",
              reason: "unsubscribe",
              source: `sendgrid-webhook:${event.event}`,
            });
          }
        }

        processed++;
      } catch (error) {
        logger.errorWithCause(
          `[SENDGRID WEBHOOK] Failed to process event: ${event.event} for ${messageId}`,
          error
        );
      }
    }

    return NextResponse.json({ processed });
  } catch (error) {
    // Catch-all: log but return 200 to prevent SendGrid from retrying.
    // SendGrid retries on non-2xx responses which would cause duplicate
    // event processing attempts.
    logger.errorWithCause("[SENDGRID WEBHOOK] Unhandled error in webhook handler", error);
    return NextResponse.json({ processed: 0, error: "processing_failed" });
  }
}
