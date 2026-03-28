import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const kpis = await cache.wrap(`kpis:${clientId}`, 30, async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Run all independent queries in parallel instead of sequentially
      // Compute start/end of today for the bookings count
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);

      const [
        leadsThisMonth,
        leadsLastMonth,
        reviewAgg,
        activeServices,
        chatbotConfig,
        bookingsToday,
      ] = await Promise.all([
        prisma.lead.count({
          where: { clientId, createdAt: { gte: startOfMonth } },
        }),
        prisma.lead.count({
          where: {
            clientId,
            createdAt: { gte: startOfLastMonth, lt: startOfMonth },
          },
        }),
        // Use aggregate instead of loading all review records into memory
        prisma.reviewCampaign.aggregate({
          where: { clientId, rating: { not: null } },
          _avg: { rating: true },
          _count: true,
        }),
        prisma.clientService.count({
          where: { clientId, status: "active" },
        }),
        prisma.chatbotConfig.findUnique({
          where: { clientId },
          select: { id: true },
        }),
        prisma.booking.count({
          where: {
            clientId,
            startsAt: { gte: startOfToday, lt: endOfToday },
          },
        }),
      ]);

      const leadChange =
        leadsLastMonth > 0
          ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
          : leadsThisMonth > 0
            ? 100
            : 0;

      const avgRating = reviewAgg._avg.rating || 0;
      const reviewCount = reviewAgg._count;

      // Only query chatbot conversations if the client has a chatbot configured
      let conversationsThisMonth = 0;
      if (chatbotConfig) {
        conversationsThisMonth = await prisma.chatbotConversation.count({
          where: { chatbotId: chatbotConfig.id, createdAt: { gte: startOfMonth } },
        });
      }

      return [
        {
          label: "Leads This Month",
          value: leadsThisMonth,
          change: leadChange !== 0 ? `${leadChange > 0 ? "+" : ""}${leadChange}%` : undefined,
          changeType: leadChange > 0 ? "positive" : leadChange < 0 ? "negative" : "neutral",
        },
        {
          label: "Active Services",
          value: activeServices,
          subtext: `of 16 available`,
        },
        {
          label: "Avg Review Rating",
          value: avgRating > 0 ? avgRating.toFixed(1) : "\u2014",
          subtext: `${reviewCount} total reviews`,
        },
        {
          label: "Chatbot Conversations",
          value: conversationsThisMonth,
          subtext: "this month",
        },
        {
          label: "Today's Bookings",
          value: bookingsToday,
          subtext: "appointments scheduled",
        },
      ];
    });

    const response = NextResponse.json(kpis);
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=15");

    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[kpis] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 }
    );
  }
}
