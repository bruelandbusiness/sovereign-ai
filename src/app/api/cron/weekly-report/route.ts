import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { buildWeeklyReportEmail } from "@/lib/emails/weekly-report";
import { generateReportNarrative } from "@/lib/emails/report-narrative";
import { sendCampaignEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Default close rate assumption for revenue estimation. */
const DEFAULT_CLOSE_RATE = 0.3;

/** Default average job value when client data is unavailable. */
const DEFAULT_AVG_JOB_VALUE = 500;

interface NotificationPrefs {
  weeklyReportEmails?: boolean;
}

/**
 * Parse notification preferences from client onboarding JSON.
 * Returns true (opted-in) when the field is absent or explicitly true.
 */
function isWeeklyReportEnabled(onboardingData: string | null): boolean {
  if (!onboardingData) return true;
  try {
    const data = JSON.parse(onboardingData);
    const prefs: NotificationPrefs | undefined =
      data?.notificationPreferences;
    if (!prefs || typeof prefs !== "object") return true;
    return prefs.weeklyReportEmails !== false;
  } catch {
    return true;
  }
}

/**
 * Safely parse average job value from onboarding JSON.
 */
function parseAvgJobValue(onboardingData: string | null): number {
  if (!onboardingData) return DEFAULT_AVG_JOB_VALUE;
  try {
    const data = JSON.parse(onboardingData);
    if (data.avgJobValue) return parseInt(data.avgJobValue, 10) || DEFAULT_AVG_JOB_VALUE;
  } catch {
    // Invalid JSON — use default
  }
  return DEFAULT_AVG_JOB_VALUE;
}

/**
 * Compute a percentage change between two numbers.
 * Returns undefined when previous is zero (no baseline).
 */
function percentChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Determine the top achievement string for the week.
 */
function computeTopAchievement(kpis: {
  leads: number;
  leadsChange: number | undefined;
  revenue: number;
  revenueChange: number | undefined;
  reviews: number;
  reviewsChange: number | undefined;
  callsAnswered: number;
  conversionRate: number;
}): string {
  const achievements: { label: string; score: number }[] = [];

  if (kpis.leadsChange != null && kpis.leadsChange > 0) {
    achievements.push({
      label: `Leads up ${kpis.leadsChange}% vs last week!`,
      score: kpis.leadsChange,
    });
  }
  if (kpis.revenueChange != null && kpis.revenueChange > 0) {
    achievements.push({
      label: `Revenue up ${kpis.revenueChange}%!`,
      score: kpis.revenueChange + 10,
    });
  }
  if (kpis.reviewsChange != null && kpis.reviewsChange > 0) {
    achievements.push({
      label: `Reviews up ${kpis.reviewsChange}% — great reputation growth!`,
      score: kpis.reviewsChange,
    });
  }
  if (kpis.leads >= 10) {
    achievements.push({
      label: `${kpis.leads} leads this week — strong pipeline!`,
      score: kpis.leads,
    });
  }
  if (kpis.conversionRate >= 40) {
    achievements.push({
      label: `${kpis.conversionRate}% conversion rate — above industry avg!`,
      score: kpis.conversionRate,
    });
  }
  if (kpis.callsAnswered > 0) {
    achievements.push({
      label: `${kpis.callsAnswered} calls answered by AI this week`,
      score: kpis.callsAnswered * 2,
    });
  }

  if (achievements.length === 0) {
    return "Your AI systems are working around the clock for you.";
  }

  achievements.sort((a, b) => b.score - a.score);
  return achievements[0].label;
}

/**
 * Generate 3 actionable tips based on weekly KPI data.
 */
function generateTips(kpis: {
  leads: number;
  leadsChange: number | undefined;
  reviews: number;
  callsAnswered: number;
  conversionRate: number;
  bookings: number;
}): string[] {
  const tips: string[] = [];

  if (kpis.leads === 0) {
    tips.push(
      "Consider running a limited-time promotion to jump-start your lead pipeline this week.",
    );
  } else if (kpis.leadsChange != null && kpis.leadsChange < 0) {
    tips.push(
      "Lead volume dipped — try refreshing your Google Business Profile and adding new photos.",
    );
  } else {
    tips.push(
      "Follow up with new leads within 5 minutes to 10x your contact rate.",
    );
  }

  if (kpis.reviews < 2) {
    tips.push(
      "Ask every completed job for a review — even 1 extra per week adds up to 50+ a year.",
    );
  } else {
    tips.push(
      "Reply to each new review personally to boost engagement and show future customers you care.",
    );
  }

  if (kpis.conversionRate < 20) {
    tips.push(
      "Your conversion rate is below 20% — consider adding before/after photos and testimonials to your follow-up messages.",
    );
  } else if (kpis.bookings < 3) {
    tips.push(
      "Increase bookings by enabling instant scheduling on your chatbot and website forms.",
    );
  } else {
    tips.push(
      "Keep your calendar slots up to date so AI can book leads instantly without delays.",
    );
  }

  return tips.slice(0, 3);
}

export const GET = withCronErrorHandler("cron/weekly-report", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Get all active clients with their accounts
    const clients = await prisma.client.findMany({
      where: {
        subscription: { status: "active" },
      },
      include: {
        account: { select: { id: true, email: true } },
      },
      take: 500,
    });

    // Filter to clients who have weekly reports enabled
    const eligibleClients = clients.filter((c) =>
      isWeeklyReportEnabled(c.onboardingData),
    );

    const clientIds = eligibleClients.map((c) => c.id);

    // Batch-fetch all stats upfront to avoid N+1 queries
    const [
      leadsByClient,
      previousLeadsByClient,
      reviewsByClient,
      previousReviewsByClient,
      contentByClient,
      conversationsByClient,
      bookingsByClient,
      callsByClient,
      previousCallsByClient,
      revenueByClient,
      previousRevenueByClient,
      wonLeadsByClient,
      previousWonLeadsByClient,
    ] = await Promise.all([
      // This-week leads
      prisma.lead
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: { clientId: { in: clientIds }, createdAt: { gte: oneWeekAgo } },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Previous-week leads
      prisma.lead
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // This-week reviews
      prisma.reviewCampaign
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            completedAt: { gte: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Previous-week reviews
      prisma.reviewCampaign
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            completedAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Content published
      prisma.contentJob
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            status: "published",
            createdAt: { gte: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Chatbot conversations
      prisma.chatbotConversation
        .findMany({
          where: {
            chatbot: { clientId: { in: clientIds } },
            createdAt: { gte: oneWeekAgo },
          },
          select: { chatbot: { select: { clientId: true } } },
        })
        .then((rows) => {
          const map = new Map<string, number>();
          for (const r of rows) {
            map.set(r.chatbot.clientId, (map.get(r.chatbot.clientId) || 0) + 1);
          }
          return map;
        }),
      // Bookings this week
      prisma.booking
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: { clientId: { in: clientIds }, createdAt: { gte: oneWeekAgo } },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Calls answered this week
      prisma.callLog
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            status: { in: ["answered", "completed", "transferred"] },
            createdAt: { gte: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Calls answered previous week
      prisma.callLog
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            status: { in: ["answered", "completed", "transferred"] },
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Revenue this week (cents)
      prisma.revenueEvent
        .groupBy({
          by: ["clientId"],
          _sum: { amount: true },
          where: { clientId: { in: clientIds }, createdAt: { gte: oneWeekAgo } },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._sum.amount || 0]))),
      // Revenue previous week (cents)
      prisma.revenueEvent
        .groupBy({
          by: ["clientId"],
          _sum: { amount: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._sum.amount || 0]))),
      // Won leads this week (conversions)
      prisma.lead
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            status: "won",
            updatedAt: { gte: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
      // Won leads previous week
      prisma.lead
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            status: "won",
            updatedAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then((rows) => new Map(rows.map((r) => [r.clientId, r._count.id]))),
    ]);

    let sent = 0;
    const errors: string[] = [];

    for (const client of eligibleClients) {
      try {
        const leads = leadsByClient.get(client.id) || 0;
        const previousLeads = previousLeadsByClient.get(client.id) || 0;
        const reviews = reviewsByClient.get(client.id) || 0;
        const previousReviews = previousReviewsByClient.get(client.id) || 0;
        const content = contentByClient.get(client.id) || 0;
        const conversations = conversationsByClient.get(client.id) || 0;
        const bookings = bookingsByClient.get(client.id) || 0;
        const callsAnswered = callsByClient.get(client.id) || 0;
        const previousCalls = previousCallsByClient.get(client.id) || 0;
        const revenueCents = revenueByClient.get(client.id) || 0;
        const previousRevenueCents = previousRevenueByClient.get(client.id) || 0;
        const wonLeads = wonLeadsByClient.get(client.id) || 0;
        const previousWonLeads = previousWonLeadsByClient.get(client.id) || 0;

        const avgJobValue = parseAvgJobValue(client.onboardingData);

        // Use actual revenue if available, otherwise estimate
        const revenue =
          revenueCents > 0
            ? Math.round(revenueCents / 100)
            : Math.round(leads * avgJobValue * DEFAULT_CLOSE_RATE);
        const previousRevenue =
          previousRevenueCents > 0
            ? Math.round(previousRevenueCents / 100)
            : Math.round(previousLeads * avgJobValue * DEFAULT_CLOSE_RATE);

        const conversionRate =
          leads > 0 ? Math.round((wonLeads / leads) * 100) : 0;

        // Compute week-over-week changes
        const leadsChange = percentChange(leads, previousLeads);
        const revenueChange = percentChange(revenue, previousRevenue);
        const reviewsChange = percentChange(reviews, previousReviews);
        const _callsChange = percentChange(callsAnswered, previousCalls);
        const _conversionChange = percentChange(
          conversionRate,
          previousWonLeads > 0 && previousLeads > 0
            ? Math.round((previousWonLeads / previousLeads) * 100)
            : 0,
        );

        const topAchievement = computeTopAchievement({
          leads,
          leadsChange,
          revenue,
          revenueChange,
          reviews,
          reviewsChange,
          callsAnswered,
          conversionRate,
        });

        const tips = generateTips({
          leads,
          leadsChange,
          reviews,
          callsAnswered,
          conversionRate,
          bookings,
        });

        // Generate Claude-powered narrative
        const narrative = await generateReportNarrative(client.id, {
          contractorName: client.businessName,
          leads,
          reviews,
          bookings,
          estimatedRevenue: revenue,
          chatbotConversations: conversations,
          contentPublished: content,
          previousWeekLeads: previousLeads,
        });

        const { subject, html } = buildWeeklyReportEmail({
          businessName: client.businessName,
          ownerName: client.ownerName,
          leads,
          previousLeads,
          reviews,
          previousReviews,
          contentPublished: content,
          chatbotConversations: conversations,
          bookings,
          callsAnswered,
          previousCallsAnswered: previousCalls,
          revenue,
          previousRevenue,
          conversionRate,
          previousConversionRate:
            previousLeads > 0
              ? Math.round((previousWonLeads / previousLeads) * 100)
              : 0,
          topAchievement,
          tips,
          narrative: narrative ?? undefined,
          weekOverWeekChange: leadsChange,
        });

        await sendCampaignEmail(client.account.email, subject, html);

        // Log the send in the audit log
        await logAudit({
          accountId: client.account.id,
          action: "weekly_report_sent",
          resource: "client",
          resourceId: client.id,
          metadata: {
            leads,
            reviews,
            revenue,
            callsAnswered,
            conversionRate,
            recipientEmail: client.account.email,
          },
        });

        sent++;
      } catch (err) {
        errors.push(
          `Failed for ${client.id}: ${err instanceof Error ? err.message : "Unknown"}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: clients.length,
      eligible: eligibleClients.length,
      skippedOptOut: clients.length - eligibleClients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/weekly-report] Cron failed", error);
    return NextResponse.json(
      { error: "Weekly report cron failed" },
      { status: 500 },
    );
  }
});
