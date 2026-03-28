import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/account/delete
 *
 * GDPR-compliant account deletion endpoint.
 * Deletes the authenticated user's account and all associated data.
 * Prisma cascading deletes handle child records (client, leads, services, etc.).
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limit: 3 deletion attempts per IP per hour (destructive operation)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "account-delete", 3);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const accountId = session.accountId;

    // Delete the account — cascading deletes in Prisma schema handle:
    // MagicLink, Session, Client (and all Client children:
    //   Subscription, ClientService, Lead, ActivityEvent, etc.)
    // Notification, MCPApiKey, PushSubscription, CommunityPost,
    // CommunityComment, ProductPurchase, ProductReview, AffiliatePartner
    await prisma.account.delete({
      where: { id: accountId },
    });

    // Clear the session cookie so the user is logged out
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      data: {
        message:
          "Your account and all associated data have been permanently deleted.",
      },
    });
  } catch (error) {
    logger.errorWithCause("[api/account/delete] Error deleting account:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account. Please try again or contact support." },
      { status: 500 },
    );
  }
}
