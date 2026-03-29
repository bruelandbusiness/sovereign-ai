import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { session } = await requireClient();

    const client = session.account.client!;
    const initials = (client.businessName ?? "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";


    const response = NextResponse.json({
      businessName: client.businessName,
      ownerName: client.ownerName,
      initials,
      city: client.city && client.state ? `${client.city}, ${client.state}` : "",
      vertical: client.vertical || "",
      plan: "", // will be filled from subscription
    });
    response.headers.set("Cache-Control", "private, max-age=300");
    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    Sentry.captureException(error);
    logger.errorWithCause("[profile] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
