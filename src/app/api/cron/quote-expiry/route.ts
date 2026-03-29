import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { createNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withCronErrorHandler(
  "cron/quote-expiry",
  async (request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    const now = new Date();
    let expired = 0;
    const errors: string[] = [];

    const expiredQuotes = await prisma.quote.findMany({
      where: {
        status: "sent",
        expiresAt: { lt: now },
      },
      include: {
        client: {
          select: { accountId: true },
        },
      },
      take: 100,
    });

    for (const quote of expiredQuotes) {
      try {
        await prisma.quote.update({
          where: { id: quote.id },
          data: { status: "expired" },
        });

        await createNotification({
          accountId: quote.client.accountId,
          type: "billing",
          title: "Quote Expired",
          message: `Quote for ${quote.customerName} has expired`,
          actionUrl: "/dashboard/quotes",
        });

        expired++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown";
        errors.push(`Failed to expire quote ${quote.id}: ${message}`);
      }
    }

    logger.info(
      `[cron/quote-expiry] Completed: ${expired} quotes expired out of ${expiredQuotes.length} candidates`,
      { expired, total: expiredQuotes.length, errors: errors.length },
    );

    return NextResponse.json({
      success: true,
      expired,
      total: expiredQuotes.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  },
);
