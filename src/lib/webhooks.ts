import crypto from "crypto";
import { prisma } from "@/lib/db";

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
  } catch {
    return false;
  }
}

/**
 * Dispatch a webhook event to all active endpoints for a given client
 * that are subscribed to the specified event type.
 */
export async function dispatchWebhook(
  clientId: string,
  event: string,
  payload: Record<string, unknown>
) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        clientId,
        isActive: true,
        events: { contains: event },
      },
    });

    if (endpoints.length === 0) return;

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    for (const endpoint of endpoints) {
      // SSRF protection: validate webhook URL before fetching
      if (!isValidWebhookUrl(endpoint.url)) {
        console.warn(`[webhooks] Blocked fetch to disallowed URL: ${endpoint.url} (endpoint ${endpoint.id})`);
        continue;
      }

      // Sign the payload with HMAC-SHA256
      const signature = crypto
        .createHmac("sha256", endpoint.secret)
        .update(body)
        .digest("hex");

      await sendWebhookWithRetry(endpoint.id, endpoint.url, body, signature, event);
    }
  } catch (error) {
    console.error(`[webhooks] Failed to dispatch ${event} for client ${clientId}:`, error);
  }
}

async function sendWebhookWithRetry(
  endpointId: string,
  url: string,
  body: string,
  signature: string,
  event: string
) {
  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  // First attempt
  try {
    const result = await sendWebhookRequest(url, body, signature);
    statusCode = result.statusCode;
    responseBody = result.responseBody;
    success = result.success;
  } catch (err) {
    responseBody = err instanceof Error ? err.message : "Unknown error";
    success = false;
  }

  // Retry once on failure after 5 seconds
  if (!success) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      const result = await sendWebhookRequest(url, body, signature);
      statusCode = result.statusCode;
      responseBody = result.responseBody;
      success = result.success;
    } catch (err) {
      responseBody = err instanceof Error ? err.message : "Unknown error (retry)";
      success = false;
    }
  }

  // Log the result
  try {
    await prisma.webhookLog.create({
      data: {
        endpointId,
        event,
        payload: body,
        statusCode,
        response: responseBody ? responseBody.substring(0, 2000) : null,
        success,
      },
    });
  } catch (logErr) {
    console.error("[webhooks] Failed to create log:", logErr);
  }
}

async function sendWebhookRequest(
  url: string,
  body: string,
  signature: string
): Promise<{ statusCode: number; responseBody: string; success: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "User-Agent": "SovereignAI-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    });

    const responseBody = await response.text().catch(() => "");

    return {
      statusCode: response.status,
      responseBody,
      success: response.status >= 200 && response.status < 300,
    };
  } finally {
    clearTimeout(timeout);
  }
}
