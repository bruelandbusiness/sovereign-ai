import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { isValidWebhookUrl } from "@/lib/webhooks";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 10 webhook tests per hour per IP (triggers outbound requests)
  const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "webhook-test", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  const endpoint = await prisma.webhookEndpoint.findFirst({ where: { id, clientId } });
  if (!endpoint) {
    return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
  }

  // SSRF protection: validate webhook URL before fetching
  if (!isValidWebhookUrl(endpoint.url)) {
    return NextResponse.json(
      { error: "Webhook URL is not allowed (internal/private addresses are blocked)" },
      { status: 400 }
    );
  }

  // Build test payload
  const testPayload = JSON.stringify({
    event: "test",
    timestamp: new Date().toISOString(),
    data: {
      message: "This is a test webhook from Sovereign AI",
      endpointId: endpoint.id,
    },
  });

  const signature = crypto
    .createHmac("sha256", endpoint.secret)
    .update(testPayload)
    .digest("hex");

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "User-Agent": "SovereignAI-Webhooks/1.0",
      },
      body: testPayload,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;
    responseBody = await response.text().catch(() => "");
    success = response.status >= 200 && response.status < 300;
  } catch (err) {
    responseBody = err instanceof Error ? err.message : "Request failed";
    success = false;
  }

  // Log the test
  await prisma.webhookLog.create({
    data: {
      endpointId: endpoint.id,
      event: "test",
      payload: testPayload,
      statusCode,
      response: responseBody ? responseBody.substring(0, 2000) : null,
      success,
    },
  });

  return NextResponse.json({
    success,
    statusCode,
    response: responseBody ? responseBody.substring(0, 500) : null,
  });
}
