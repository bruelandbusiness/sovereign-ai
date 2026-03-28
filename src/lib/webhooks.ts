import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { deliverWebhook } from "@/lib/webhook-delivery";

/**
 * Validate that a webhook URL is safe to fetch (SSRF protection).
 * Blocks internal/private hostnames and IP ranges.
 */
export function isValidWebhookUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    // Must be HTTPS in production
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    // Block internal/private hostnames
    const hostname = url.hostname.toLowerCase();
    const blocked = [
      "localhost", "127.0.0.1", "0.0.0.0", "::1",
      "169.254.169.254", // AWS metadata
      "metadata.google.internal", // GCP metadata
    ];
    if (blocked.includes(hostname)) return false;

    // Block bracketed IPv6 notation (e.g. [::1], [fd00::1])
    if (hostname.includes("[")) return false;

    // Block IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
    if (hostname.startsWith("::ffff:")) return false;

    // Block IPv6 unique local addresses (fc00::/7 — covers fc and fd prefixes)
    if (hostname.startsWith("fc") || hostname.startsWith("fd")) return false;

    // Block IPv6 link-local addresses (fe80::/10)
    if (hostname.startsWith("fe80")) return false;

    // Block private IPv4 ranges
    const parts = hostname.split(".");
    if (parts[0] === "10") return false;
    if (parts[0] === "172" && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) return false;
    if (parts[0] === "192" && parts[1] === "168") return false;
    return true;
  } catch (err) {
    logger.warn("Invalid webhook URL", { url: urlStr, error: String(err) });
    return false;
  }
}

/**
 * Dispatch a webhook event to all active endpoints for a given client
 * that are subscribed to the specified event type.
 *
 * Uses the enhanced delivery system with exponential backoff retries
 * (3 attempts: immediate, 30s, 5min) and dead letter queue.
 */
export async function dispatchWebhook(
  clientId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        clientId,
        isActive: true,
        events: { contains: event },
      },
    });

    if (endpoints.length === 0) return;

    for (const endpoint of endpoints) {
      // Delivery handles SSRF validation, HMAC signing, retries, and dead letter
      deliverWebhook(
        endpoint.id,
        endpoint.url,
        endpoint.secret,
        event,
        payload,
      ).catch((err) => {
        logger.errorWithCause(
          `[webhooks] Delivery failed for endpoint ${endpoint.id}`,
          err,
        );
      });
    }
  } catch (error) {
    logger.errorWithCause(
      `[webhooks] Failed to dispatch ${event} for client ${clientId}`,
      error,
    );
  }
}
