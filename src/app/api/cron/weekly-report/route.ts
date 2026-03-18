import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron";
import { buildWeeklyReportEmail } from "@/lib/emails/weekly-report";
import { sendCampaignEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all active clients with their accounts
    const clients = await prisma.client.findMany({
      where: {
        subscription: { status: "active" },
      },
      include: {
        account: { select: { email: true } },
      },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const client of clients) {
      try {
        // Gather weekly stats
        const [leads, reviews, content, conversations, bookings] =
          await Promise.all([
            prisma.lead.count({
              where: { clientId: client.id, createdAt: { gte: oneWeekAgo } },
            }),
            prisma.reviewCampaign.count({
              where: {
                clientId: client.id,
                completedAt: { gte: oneWeekAgo },
              },
            }),
            prisma.contentJob.count({
              where: {
                clientId: client.id,
                status: "published",
                createdAt: { gte: oneWeekAgo },
              },
            }),
            prisma.chatbotConversation.count({
              where: {
                chatbot: { clientId: client.id },
                createdAt: { gte: oneWeekAgo },
              },
            }),
            prisma.booking.count({
              where: { clientId: client.id, createdAt: { gte: oneWeekAgo } },
            }),
          ]);

        // Parse avg job value from onboarding data
        let avgJobValue = 500;
        if (client.onboardingData) {
          try {
            const data = JSON.parse(client.onboardingData);
            if (data.avgJobValue) avgJobValue = parseInt(data.avgJobValue, 10);
          } catch {}
        }

        const estimatedRevenue = leads * avgJobValue * 0.3; // 30% close rate assumption

        const { subject, html } = buildWeeklyReportEmail({
          businessName: client.businessName,
          ownerName: client.ownerName,
          leads,
          reviews,
          contentPublished: content,
          chatbotConversations: conversations,
          bookings,
          estimatedRevenue: Math.round(estimatedRevenue),
        });

        await sendCampaignEmail(client.account.email, subject, html);
        sent++;
      } catch (err) {
        errors.push(
          `Failed for ${client.id}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: clients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Weekly report cron failed" },
      { status: 500 }
    );
  }
}
