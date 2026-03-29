import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { buildAbandonedCartEmail } from "@/lib/emails/abandoned-cart";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/abandoned-cart", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Find checkout audit logs created 2-24 hours ago
    const checkoutLogs = await prisma.auditLog.findMany({
      where: {
        action: "onboarding_checkout_created",
        resource: "email",
        createdAt: {
          gte: twentyFourHoursAgo,
          lte: twoHoursAgo,
        },
      },
      take: 500,
    });

    let sent = 0;
    const errors: string[] = [];

    for (const log of checkoutLogs) {
      try {
        const email = log.resourceId;
        if (!email) continue;

        // Check if we already sent an abandoned cart email for this email
        const alreadySent = await prisma.auditLog.findFirst({
          where: {
            action: "abandoned_cart_email_sent",
            resource: "email",
            resourceId: email,
          },
        });

        if (alreadySent) continue;

        // Check if a subscription or client record exists for this email
        // (meaning they completed checkout successfully)
        const account = await prisma.account.findUnique({
          where: { email },
          select: { id: true },
        });

        if (account) {
          const activeSubscription = await prisma.subscription.findFirst({
            where: {
              client: { accountId: account.id },
              status: { in: ["active", "trialing", "past_due"] },
            },
          });

          if (activeSubscription) continue;
        }

        // Parse metadata from the checkout log to get services and names
        let ownerName = "there";
        let businessName = "your business";
        let selectedServices: string[] = [];

        if (log.metadata) {
          try {
            const checkoutMeta = JSON.parse(log.metadata);
            // The checkout audit log stores session_id and checkout_url.
            // The original onboarding data is in the Stripe session metadata,
            // but we can look up the client record if one was created.
          } catch {
            // Metadata parsing failed — continue with defaults
          }
        }

        // Try to get details from the client record if it exists
        if (account) {
          const client = await prisma.client.findFirst({
            where: { accountId: account.id },
            select: {
              ownerName: true,
              businessName: true,
              onboardingData: true,
            },
          });

          if (client) {
            ownerName = client.ownerName || ownerName;
            businessName = client.businessName || businessName;

            if (client.onboardingData) {
              try {
                const onboarding = JSON.parse(client.onboardingData);
                if (onboarding.step3?.selectedServices) {
                  selectedServices = onboarding.step3.selectedServices;
                }
              } catch {
                // Onboarding data parsing failed — continue with empty services
              }
            }
          }
        }

        const { subject, html } = buildAbandonedCartEmail(
          ownerName,
          businessName,
          selectedServices,
        );

        await sendEmail(email, subject, html);

        // Record that we sent the abandoned cart email to prevent duplicates.
        // Use a unique resourceId to avoid the @@unique([resource, resourceId])
        // constraint on the auditLog table (the original checkout log already
        // occupies resource="email" + resourceId=<email>).
        await prisma.auditLog.create({
          data: {
            action: "abandoned_cart_email_sent",
            resource: "abandoned_cart",
            resourceId: email,
            metadata: JSON.stringify({
              checkout_log_id: log.id,
              sent_at: new Date().toISOString(),
            }),
          },
        });

        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown";
        errors.push(`Failed for ${log.resourceId}: ${message}`);
      }
    }

    logger.info(`[cron/abandoned-cart] Completed: ${sent} emails sent out of ${checkoutLogs.length} candidates`, {
      sent,
      total: checkoutLogs.length,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      sent,
      total: checkoutLogs.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/abandoned-cart] Cron failed", error);
    return NextResponse.json(
      { error: "Abandoned cart cron failed" },
      { status: 500 }
    );
  }
});
