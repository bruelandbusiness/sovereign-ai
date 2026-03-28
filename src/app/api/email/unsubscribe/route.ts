import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "unsubscribe", 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const clientId = request.nextUrl.searchParams.get("clientId");

  if (!clientId) {
    return new NextResponse(
      htmlPage("Invalid Request", "Missing client identifier."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    // Verify the client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true },
    });

    if (!client) {
      return new NextResponse(
        htmlPage("Not Found", "We could not find an account matching this link."),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Record the opt-out as an activity event (idempotent — check first)
    const existing = await prisma.activityEvent.findFirst({
      where: {
        clientId: client.id,
        type: "email_unsubscribe",
      },
    });

    if (!existing) {
      await prisma.activityEvent.create({
        data: {
          clientId: client.id,
          type: "email_unsubscribe",
          title: "Marketing email unsubscribe",
          description: `Client opted out of marketing emails.`,
        },
      });
    }

    return new NextResponse(
      htmlPage(
        "You've Been Unsubscribed",
        "You will no longer receive marketing emails from Sovereign AI. If this was a mistake, you can re-subscribe from your dashboard settings."
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    logger.errorWithCause("[api/email/unsubscribe] Error:", error);
    return new NextResponse(
      htmlPage("We Couldn't Process Your Request", "Please try again in a few minutes. If the issue persists, contact our support team for help."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Sovereign AI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f8f9fa;
      color: #333;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 48px 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    h1 { color: #0a0a0f; font-size: 24px; margin: 0 0 16px; }
    p { color: #666; font-size: 16px; line-height: 1.5; margin: 0; }
    .brand { color: #999; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="brand">Sovereign AI</p>
  </div>
</body>
</html>`;
}
