import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Leads this month
  const leadsThisMonth = await prisma.lead.count({
    where: { clientId, createdAt: { gte: startOfMonth } },
  });

  const leadsLastMonth = await prisma.lead.count({
    where: {
      clientId,
      createdAt: { gte: startOfLastMonth, lt: startOfMonth },
    },
  });

  const leadChange =
    leadsLastMonth > 0
      ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
      : 0;

  // Reviews
  const reviews = await prisma.reviewCampaign.findMany({
    where: { clientId, rating: { not: null } },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  // Active services count
  const activeServices = await prisma.clientService.count({
    where: { clientId, status: "active" },
  });

  // Chatbot conversations this month
  const chatbotConfig = await prisma.chatbotConfig.findUnique({
    where: { clientId },
  });

  let conversationsThisMonth = 0;
  if (chatbotConfig) {
    conversationsThisMonth = await prisma.chatbotConversation.count({
      where: { chatbotId: chatbotConfig.id, createdAt: { gte: startOfMonth } },
    });
  }

  return NextResponse.json([
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
      value: avgRating > 0 ? avgRating.toFixed(1) : "—",
      subtext: `${reviews.length} total reviews`,
    },
    {
      label: "Chatbot Conversations",
      value: conversationsThisMonth,
      subtext: "this month",
    },
  ]);
}
