import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmailQueued, escapeHtml, emailLayout, emailButton } from "@/lib/email";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/churn-check", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/churn-check] Starting churn risk check");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const calendlyUrl =
      process.env.NEXT_PUBLIC_CALENDLY_URL ||
      "https://calendly.com/bruelandbusiness/30min";

    // Get all active clients with their recent leads, subscription info, and account email
    const activeClients = await prisma.client.findMany({
      where: {
        subscription: { status: "active" },
      },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        account: { select: { email: true } },
        subscription: {
          select: { status: true, monthlyAmount: true },
        },
        leads: {
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { id: true },
        },
      },
    });

    let atRiskClients = 0;
    let autoEmails = 0;
    let alerts = 0;
    let criticalAlerts = 0;
    let recoveryEmailsSent = 0;

    for (const client of activeClients) {
      const recentLeadCount = client.leads.length;

      // Clients with 0 leads in 30 days are at risk
      if (recentLeadCount === 0) {
        atRiskClients++;

        // Estimate a health score based on activity
        // 0 leads = critical risk
        const healthScore = 0;

        if (healthScore < 40) {
          criticalAlerts++;
          logger.warn(
            `[cron/churn-check] CRITICAL: ${client.businessName} (${client.id}) - 0 leads in 30 days`,
          );
        } else if (healthScore < 50) {
          alerts++;
          logger.warn(
            `[cron/churn-check] ALERT: ${client.businessName} (${client.id}) - low activity`,
          );
        } else {
          autoEmails++;
          logger.info(
            `[cron/churn-check] RE-ENGAGE: ${client.businessName} (${client.id}) - declining activity`,
          );
        }

        // Send churn recovery email (deduplicate: once per 30 days per client)
        const alreadySent = await prisma.activityEvent.findFirst({
          where: {
            clientId: client.id,
            type: "churn_recovery_email_sent",
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { id: true },
        });

        if (alreadySent) {
          logger.info(
            `[cron/churn-check] Skipping recovery email for ${client.businessName} — already sent in last 30 days`,
          );
          continue;
        }

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
        const unsubscribeUrl = `${appUrl}/api/email/unsubscribe?clientId=${client.id}`;

        const html = emailLayout({
          preheader: `We noticed slower lead flow for ${client.businessName} — here's our action plan.`,
          unsubscribeUrl,
          body: `
            <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(client.ownerName)},</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">We noticed your lead volume has dropped this month. We take that seriously &mdash; here&rsquo;s what we&rsquo;re already doing about it:</p>
            <ol style="color:#333;font-size:16px;line-height:1.8;">
              <li><strong>Auditing your AI campaigns</strong> &mdash; We&rsquo;re reviewing targeting, keywords, and ad performance to find quick wins.</li>
              <li><strong>Refreshing your content strategy</strong> &mdash; Updating SEO content and email sequences to re-engage your audience.</li>
              <li><strong>Optimizing your lead capture</strong> &mdash; Testing new chatbot flows and form placements to increase conversions.</li>
            </ol>
            <p style="color:#333;font-size:16px;line-height:1.5;">Want to discuss your account in detail? Book a quick call and we&rsquo;ll walk through the plan together:</p>
            ${emailButton("Book a Call", calendlyUrl)}
            <p style="color:#666;font-size:14px;">We&rsquo;re on it &mdash; your success is our priority.</p>
            <p style="color:#999;font-size:12px;text-align:center;">&mdash; The Sovereign AI Team</p>
          `,
        });

        try {
          await sendEmailQueued(
            client.account.email,
            "We noticed slower lead flow — here's our action plan",
            html,
          );

          // Record the send so we don't duplicate within 30 days
          await prisma.activityEvent.create({
            data: {
              clientId: client.id,
              type: "churn_recovery_email_sent",
              title: "Churn recovery email sent",
              description: `Sent churn recovery email — 0 leads in 30 days`,
            },
          });

          recoveryEmailsSent++;
          logger.info(
            `[cron/churn-check] Sent recovery email to ${client.businessName} (${client.account.email})`,
          );
        } catch (emailErr) {
          logger.errorWithCause(
            `[cron/churn-check] Failed to send recovery email to ${client.businessName}`,
            emailErr,
          );
        }
      } else if (recentLeadCount < 5) {
        // Low activity but not zero - moderate risk
        atRiskClients++;
        alerts++;
        logger.warn(
          `[cron/churn-check] AT-RISK: ${client.businessName} (${client.id}) - only ${recentLeadCount} leads in 30 days`,
        );
      }
    }

    logger.info("[cron/churn-check] Completed", {
      atRiskClients,
      autoEmails,
      alerts,
      criticalAlerts,
      recoveryEmailsSent,
    });

    return NextResponse.json({
      ok: true,
      atRiskClients,
      autoEmails,
      alerts,
      criticalAlerts,
      recoveryEmailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.errorWithCause("[cron/churn-check] Fatal error", err);
    return NextResponse.json(
      { error: "Churn check cron job failed" },
      { status: 500 },
    );
  }
});
