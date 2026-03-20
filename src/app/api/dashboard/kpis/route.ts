import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Run all independent queries in parallel instead of sequentially
    const [
      leadsThisMonth,
      leadsLastMonth,
      reviewAgg,
      activeServices,
      chatbotConfig,
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
    ]);

    const leadChange =
      leadsLastMonth > 0
        ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
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

    const response = NextResponse.json([
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
    ]);

    response.headers.set("Cache-Control", "private, no-cache");

    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[kpis] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 }
    );
  }
}
