import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron";
import { collectReportMetrics } from "@/lib/pdf-report";
import { sendEmailQueued, escapeHtml, emailLayout, emailButton } from "@/lib/email";
import { logger } from "@/lib/logger";

export const maxDuration = 300;

const BATCH_SIZE = 5;

/**
 * GET /api/cron/qbr — Quarterly Business Review cron
 *
 * Runs on the 1st of January, April, July, and October.
 * Generates a QBR report for each active client covering the
 * previous quarter.
 */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();

  try {
    const now = new Date();
    // Determine the *previous* quarter
    const currentQuarterIndex = Math.floor(now.getMonth() / 3); // 0-3
    const prevQuarterIndex = currentQuarterIndex === 0 ? 3 : currentQuarterIndex - 1;
    const prevQuarterYear = currentQuarterIndex === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const quarter = `${prevQuarterYear}-Q${prevQuarterIndex + 1}`;

    // Date range for previous quarter
    const quarterStartMonth = prevQuarterIndex * 3;
    const start = new Date(prevQuarterYear, quarterStartMonth, 1);
    const end = new Date(prevQuarterYear, quarterStartMonth + 3, 0, 23, 59, 59);

    // Get all active clients
    const clients = await prisma.client.findMany({
      where: { subscription: { status: "active" } },
      include: { account: { select: { email: true } } },
      take: 50,
    });

    if (clients.length === 0) {
      return NextResponse.json({ success: true, generated: 0, total: 0 });
    }

    let generated = 0;
    const errors: string[] = [];

    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (client) => {
          try {
            // Skip if already generated for this quarter
            const existing = await prisma.qBRReport.findUnique({
              where: { clientId_quarter: { clientId: client.id, quarter } },
            });
            if (existing) return;

            // Collect metrics
            const metrics = await collectReportMetrics(client.id, start, end);

            // Generate AI-style summary (deterministic, no external API needed)
            const summary = buildExecutiveSummary(client.businessName, quarter, metrics);
            const highlights = buildHighlights(metrics);
            const recommendations = buildRecommendations(metrics);

            // Save QBR report
            const qbr = await prisma.qBRReport.create({
              data: {
                clientId: client.id,
                quarter,
                summary,
                metrics: JSON.stringify(metrics),
                highlights: JSON.stringify(highlights),
                recommendations: JSON.stringify(recommendations),
              },
            });

            // Send email notification
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sovereignai.com";
            const html = buildQBREmailHTML(client.businessName, client.ownerName, quarter, summary, `${appUrl}/dashboard/qbr`);

            await sendEmailQueued(
              client.account.email,
              `Your ${quarter} Quarterly Business Review is Ready — ${client.businessName}`,
              html
            );

            await prisma.qBRReport.update({
              where: { id: qbr.id },
              data: { sentAt: new Date() },
            });

            generated++;
          } catch (err) {
            errors.push(
              `Failed for ${client.id}: ${err instanceof Error ? err.message : "Unknown"}`
            );
          }
        })
      );
    }

    logger.info(`[cron/qbr] Completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      quarter,
      generated,
      total: clients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.errorWithCause("[cron/qbr] Fatal error", err);
    return NextResponse.json(
      { error: "QBR cron failed" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Summary Generators
// ---------------------------------------------------------------------------

interface Metrics {
  totalLeads: number;
  conversionRate: number;
  totalRevenue: number;
  adSpend: number;
  roi: number;
  chatbotConversations: number;
  reviewsCollected: number;
  contentPublished: number;
  impressions: number;
  clicks: number;
  costPerLead: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function buildExecutiveSummary(businessName: string, quarter: string, m: Metrics): string {
  const revenue = formatCurrency(m.totalRevenue);
  const spend = formatCurrency(m.adSpend);

  let summary = `${quarter} Quarterly Business Review for ${businessName}.\n\n`;

  summary += `This quarter, your AI marketing systems generated ${m.totalLeads} leads with a ${m.conversionRate}% conversion rate. `;
  summary += `Total attributed revenue was ${revenue} against ${spend} in ad spend, yielding a ${m.roi}% ROI.\n\n`;

  if (m.chatbotConversations > 0) {
    summary += `Your AI chatbot handled ${m.chatbotConversations} conversations, providing 24/7 lead capture. `;
  }
  if (m.reviewsCollected > 0) {
    summary += `${m.reviewsCollected} new customer reviews were collected via automated campaigns. `;
  }
  if (m.contentPublished > 0) {
    summary += `${m.contentPublished} pieces of content were published to boost SEO visibility. `;
  }

  summary += `\n\nOverall, your AI marketing stack ${m.roi > 100 ? "delivered strong returns" : "continues to build momentum"} this quarter.`;

  return summary;
}

function buildHighlights(m: Metrics): string[] {
  const highlights: string[] = [];

  if (m.totalLeads > 0) highlights.push(`Generated ${m.totalLeads} new leads`);
  if (m.totalRevenue > 0) highlights.push(`${formatCurrency(m.totalRevenue)} in attributed revenue`);
  if (m.roi > 100) highlights.push(`${m.roi}% ROI on marketing spend`);
  if (m.chatbotConversations > 50) highlights.push(`Chatbot handled ${m.chatbotConversations}+ conversations`);
  if (m.reviewsCollected > 10) highlights.push(`Collected ${m.reviewsCollected} new reviews`);
  if (m.conversionRate > 20) highlights.push(`${m.conversionRate}% lead conversion rate`);

  if (highlights.length === 0) {
    highlights.push("Foundation building quarter — systems activated and data collecting");
  }

  return highlights;
}

function buildRecommendations(m: Metrics): string[] {
  const recs: string[] = [];

  if (m.totalLeads < 30) {
    recs.push("Scale lead volume by increasing ad budget or activating additional channels.");
  }
  if (m.conversionRate < 20) {
    recs.push("Improve conversion rate with faster lead response times and automated follow-up sequences.");
  }
  if (m.costPerLead > 15000) {
    recs.push("Reduce cost per lead by optimizing ad targeting and testing new creative assets.");
  }
  if (m.chatbotConversations < 20) {
    recs.push("Increase chatbot engagement by adding it to all landing pages and running a chatbot-first campaign.");
  }
  if (m.reviewsCollected < 10) {
    recs.push("Boost review volume by triggering automated review requests after every completed job.");
  }
  if (m.contentPublished < 8) {
    recs.push("Publish more blog content and service pages to improve organic search rankings.");
  }
  if (m.roi > 200) {
    recs.push("Strong ROI — consider scaling top-performing channels by 25-50% next quarter.");
  }

  if (recs.length === 0) {
    recs.push("Maintain current strategy and look for opportunities to scale top-performing channels.");
  }

  return recs;
}

function buildQBREmailHTML(
  businessName: string,
  ownerName: string,
  quarter: string,
  summary: string,
  qbrUrl: string
): string {
  return emailLayout({
    preheader: `Your ${quarter} Quarterly Business Review for ${businessName} is ready.`,
    isTransactional: true,
    body: `
      <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(ownerName)},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Your ${escapeHtml(quarter)} Quarterly Business Review for <strong>${escapeHtml(businessName)}</strong> is ready!</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
        <tr>
          <td style="background:#f8f9fa;border-radius:12px;padding:20px;">
            <p style="color:#333;font-size:14px;line-height:1.6;white-space:pre-line;margin:0;">${escapeHtml(summary.slice(0, 500))}${summary.length > 500 ? "..." : ""}</p>
          </td>
        </tr>
      </table>

      ${emailButton("View Full Report", qbrUrl)}
    `,
  });
}
