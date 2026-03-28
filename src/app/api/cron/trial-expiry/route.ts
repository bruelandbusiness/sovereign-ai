import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { sendEmail, escapeHtml, emailLayout, emailButton } from "@/lib/email";
import { createNotification } from "@/lib/notifications";


export const dynamic = "force-dynamic";
export const maxDuration = 60;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export const GET = withCronErrorHandler("cron/trial-expiry", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let reminded3Day = 0;
    let reminded1Day = 0;
    let expired = 0;
    const errors: string[] = [];

    // Use currentPeriodEnd as trial end date proxy (isTrial/trialEndsAt don't exist in schema).
    // Treat subscriptions with monthlyAmount = 0 as trials.

    // ── Pre-expiry reminder: 3 days before trial ends ──────────
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const trialsExpiring3Days = await prisma.subscription.findMany({
      where: {
        monthlyAmount: 0,
        status: "active",
        currentPeriodEnd: {
          gte: startOfDay(threeDaysFromNow),
          lte: endOfDay(threeDaysFromNow),
        },
      },
      include: {
        client: {
          include: {
            account: { select: { email: true, name: true } },
          },
        },
      },
      take: 100,
    });

    // ── Pre-expiry reminder: 1 day before trial ends ───────────
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const trialsExpiring1Day = await prisma.subscription.findMany({
      where: {
        monthlyAmount: 0,
        status: "active",
        currentPeriodEnd: {
          gte: startOfDay(oneDayFromNow),
          lte: endOfDay(oneDayFromNow),
        },
      },
      include: {
        client: {
          include: {
            account: { select: { email: true, name: true } },
          },
        },
      },
      take: 100,
    });

    // Batch dedup: fetch existing trial reminder activity events for all relevant clients
    const allTrialClientIds = [
      ...new Set([
        ...trialsExpiring3Days.map((s) => s.clientId),
        ...trialsExpiring1Day.map((s) => s.clientId),
      ]),
    ];
    const existingTrialReminders =
      allTrialClientIds.length > 0
        ? await prisma.activityEvent.findMany({
            where: {
              clientId: { in: allTrialClientIds },
              type: "email_sent",
              title: { startsWith: "Trial reminder sent [" },
            },
            select: { title: true },
          })
        : [];
    const sentTrialReminderKeys = new Set(
      existingTrialReminders.map((e) => e.title)
    );

    for (const sub of trialsExpiring3Days) {
      try {
        const dedupKey = `Trial reminder sent [3day-${sub.id}]`;
        if (sentTrialReminderKeys.has(dedupKey)) {
          continue;
        }

        const name = sub.client.account.name || sub.client.ownerName;
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://trysovereignai.com"}/api/email/unsubscribe?clientId=${sub.clientId}`;
        await sendEmail(
          sub.client.account.email,
          "Your Sovereign AI trial ends in 3 days",
          emailLayout({
            preheader: "Your free trial ends in 3 days. Upgrade now to keep your AI services running.",
            unsubscribeUrl,
            body: `
              <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(name)},</p>
              <p style="color:#333;font-size:16px;line-height:1.5;">Just a heads-up &mdash; your free trial for <strong>${escapeHtml(sub.client.businessName)}</strong> ends in 3 days.</p>
              <p style="color:#333;font-size:16px;line-height:1.5;">Upgrade now to keep your AI services running without interruption. All your data and configurations will be preserved.</p>
              ${emailButton("Upgrade Now", `${appUrl}/dashboard/billing`)}
              <p style="color:#666;font-size:14px;line-height:1.5;">
                Questions? Reply to this email or visit our
                <a href="${appUrl}/dashboard/support" style="color:#4c85ff;">support center</a>.
              </p>
            `,
          })
        );

        await prisma.activityEvent.create({
          data: {
            clientId: sub.clientId,
            type: "email_sent",
            title: dedupKey,
            description: `3-day trial expiry reminder sent to ${sub.client.account.email}`,
          },
        });

        await createNotification({
          accountId: sub.client.accountId,
          type: "billing",
          title: "Trial Ending Soon",
          message:
            "Your free trial ends in 3 days. Upgrade to keep your AI services running.",
          actionUrl: "/dashboard/billing",
        });

        reminded3Day++;
      } catch (err) {
        errors.push(
          `Failed to send 3-day reminder for subscription ${sub.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    for (const sub of trialsExpiring1Day) {
      try {
        const dedupKey = `Trial reminder sent [1day-${sub.id}]`;
        if (sentTrialReminderKeys.has(dedupKey)) {
          continue;
        }

        const name = sub.client.account.name || sub.client.ownerName;
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://trysovereignai.com"}/api/email/unsubscribe?clientId=${sub.clientId}`;
        await sendEmail(
          sub.client.account.email,
          "Last day of your Sovereign AI free trial",
          emailLayout({
            preheader: "This is your last day on the free trial. Upgrade today to avoid interruption.",
            unsubscribeUrl,
            body: `
              <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(name)},</p>
              <p style="color:#333;font-size:16px;line-height:1.5;">This is your last day on the free trial for <strong>${escapeHtml(sub.client.businessName)}</strong>. Your services will be paused tomorrow unless you upgrade.</p>
              <p style="color:#333;font-size:16px;line-height:1.5;">Upgrade today to ensure there is no interruption to your AI marketing services.</p>
              ${emailButton("Upgrade Now", `${appUrl}/dashboard/billing`)}
              <p style="color:#666;font-size:14px;line-height:1.5;">
                Questions? Reply to this email or visit our
                <a href="${appUrl}/dashboard/support" style="color:#4c85ff;">support center</a>.
              </p>
            `,
          })
        );

        await prisma.activityEvent.create({
          data: {
            clientId: sub.clientId,
            type: "email_sent",
            title: dedupKey,
            description: `1-day trial expiry reminder sent to ${sub.client.account.email}`,
          },
        });

        await createNotification({
          accountId: sub.client.accountId,
          type: "billing",
          title: "Trial Ends Tomorrow",
          message:
            "Your free trial ends tomorrow. Upgrade now to avoid service interruption.",
          actionUrl: "/dashboard/billing",
        });

        reminded1Day++;
      } catch (err) {
        errors.push(
          `Failed to send 1-day reminder for subscription ${sub.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // ── Expired trials: past currentPeriodEnd ─────────────────────
    const GRACE_PERIOD_DAYS = 3;
    const gracePeriodCutoff = new Date(now);
    gracePeriodCutoff.setDate(gracePeriodCutoff.getDate() - GRACE_PERIOD_DAYS);

    // Phase 1: Trials that just expired (within grace period) — mark expired
    const justExpiredTrials = await prisma.subscription.findMany({
      where: {
        monthlyAmount: 0,
        status: "active",
        currentPeriodEnd: {
          lt: now,
          gte: gracePeriodCutoff,
        },
      },
      include: {
        client: {
          include: {
            account: { select: { email: true, name: true } },
          },
        },
      },
      take: 100,
    });

    let graceExpired = 0;
    for (const sub of justExpiredTrials) {
      try {
        const dedupKey = `Trial reminder sent [expired-${sub.id}]`;

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: "canceled" },
          });

          if (!sentTrialReminderKeys.has(dedupKey)) {
            await tx.activityEvent.create({
              data: {
                clientId: sub.clientId,
                type: "email_sent",
                title: dedupKey,
                description: `Trial expired email sent to ${sub.client.account.email} (grace period active)`,
              },
            });
          }
        });

        if (sentTrialReminderKeys.has(dedupKey)) {
          graceExpired++;
          continue;
        }

        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://trysovereignai.com"}/api/email/unsubscribe?clientId=${sub.clientId}`;
        await sendEmail(
          sub.client.account.email,
          "Your Sovereign AI Free Trial Has Ended",
          emailLayout({
            preheader: "Your free trial has ended. You have 3 days to upgrade before services are paused.",
            unsubscribeUrl,
            body: `
              <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(sub.client.account.name || sub.client.ownerName)},</p>
              <p style="color:#333;font-size:16px;line-height:1.5;">Your 14-day free trial for <strong>${escapeHtml(sub.client.businessName)}</strong> has ended.</p>
              <p style="color:#333;font-size:16px;line-height:1.5;"><strong>You have 3 days to upgrade</strong> before your services are paused. All your data and configurations are safe.</p>
              ${emailButton("Upgrade Now", `${appUrl}/dashboard/billing`)}
              <p style="color:#666;font-size:14px;line-height:1.5;">
                Questions? Reply to this email or visit our
                <a href="${appUrl}/dashboard/support" style="color:#4c85ff;">support center</a>.
              </p>
            `,
          })
        );

        await createNotification({
          accountId: sub.client.accountId,
          type: "billing",
          title: "Free Trial Ended",
          message: "Your free trial has ended. Upgrade within 3 days to keep your services running.",
          actionUrl: "/dashboard/billing",
        });

        graceExpired++;
      } catch (err) {
        errors.push(
          `Failed to expire trial (grace) for subscription ${sub.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // Phase 2: Trials that expired MORE than 3 days ago — now pause services.
    const fullyExpiredTrials = await prisma.subscription.findMany({
      where: {
        monthlyAmount: 0,
        status: "canceled",
        currentPeriodEnd: { lt: gracePeriodCutoff },
      },
      include: {
        client: {
          include: {
            account: { select: { email: true, name: true } },
          },
        },
      },
      take: 100,
    });

    const fullyExpiredClientIds = fullyExpiredTrials.map((s) => s.clientId);
    const activeServiceCounts = fullyExpiredClientIds.length > 0
      ? await prisma.clientService.groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: fullyExpiredClientIds },
            status: "active",
          },
        })
      : [];
    const activeServiceCountMap = new Map(
      activeServiceCounts.map((r) => [r.clientId, r._count.id])
    );

    for (const sub of fullyExpiredTrials) {
      try {
        const activeServiceCount = activeServiceCountMap.get(sub.clientId) ?? 0;

        if (activeServiceCount === 0) {
          continue;
        }

        const dedupKey = `Trial reminder sent [paused-${sub.id}]`;

        await prisma.$transaction(async (tx) => {
          await tx.clientService.updateMany({
            where: { clientId: sub.clientId, status: { not: "canceled" } },
            data: { status: "paused" },
          });

          if (!sentTrialReminderKeys.has(dedupKey)) {
            await tx.activityEvent.create({
              data: {
                clientId: sub.clientId,
                type: "email_sent",
                title: dedupKey,
                description: `Services paused email sent to ${sub.client.account.email} (grace period ended)`,
              },
            });
          }
        });

        if (sentTrialReminderKeys.has(dedupKey)) {
          expired++;
          continue;
        }

        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://trysovereignai.com"}/api/email/unsubscribe?clientId=${sub.clientId}`;
        await sendEmail(
          sub.client.account.email,
          "Your Sovereign AI Services Have Been Paused",
          emailLayout({
            preheader: "Your grace period has ended and services have been paused. Upgrade to reactivate.",
            unsubscribeUrl,
            body: `
              <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(sub.client.account.name || sub.client.ownerName)},</p>
              <p style="color:#333;font-size:16px;line-height:1.5;">Your grace period for <strong>${escapeHtml(sub.client.businessName)}</strong> has ended and your AI services have been paused.</p>
              <p style="color:#333;font-size:16px;line-height:1.5;">All your data is safe. Upgrade to a paid plan to reactivate everything instantly.</p>
              ${emailButton("Upgrade Now", `${appUrl}/dashboard/billing`)}
              <p style="color:#666;font-size:14px;line-height:1.5;">
                Questions? Reply to this email or visit our
                <a href="${appUrl}/dashboard/support" style="color:#4c85ff;">support center</a>.
              </p>
            `,
          })
        );

        await createNotification({
          accountId: sub.client.accountId,
          type: "billing",
          title: "Services Paused",
          message: "Your services have been paused. Upgrade to reactivate them.",
          actionUrl: "/dashboard/billing",
        });

        expired++;
      } catch (err) {
        errors.push(
          `Failed to pause services for subscription ${sub.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      reminded3Day,
      reminded1Day,
      graceExpired,
      processed: fullyExpiredTrials.length,
      expired,
      errors: errors.length > 0 ? errors : undefined,
    });
});
