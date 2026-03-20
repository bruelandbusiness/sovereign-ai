/**
 * PDF Report Generator
 *
 * Generates a complete HTML report with print-optimized CSS
 * that can be opened in a browser and saved as PDF via Ctrl+P.
 */

import { prisma } from "@/lib/db";
import { escapeHtml } from "@/lib/email";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportMetrics {
  totalLeads: number;
  leadsBySource: Record<string, number>;
  conversionRate: number;
  adSpend: number;
  impressions: number;
  clicks: number;
  costPerLead: number;
  chatbotConversations: number;
  reviewsCollected: number;
  contentPublished: number;
  revenueByChannel: Record<string, number>;
  totalRevenue: number;
  roi: number;
}

interface ReportData {
  businessName: string;
  ownerName: string;
  city: string;
  state: string;
  dateRange: { start: Date; end: Date };
  periodLabel: string;
  metrics: ReportMetrics;
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Data Collection
// ---------------------------------------------------------------------------

export async function collectReportMetrics(
  clientId: string,
  start: Date,
  end: Date
): Promise<ReportMetrics> {
  // Leads
  const leads = await prisma.lead.findMany({
    where: { clientId, createdAt: { gte: start, lte: end } },
    select: { source: true, status: true },
  });

  const totalLeads = leads.length;
  const leadsBySource: Record<string, number> = {};
  let convertedLeads = 0;
  for (const lead of leads) {
    leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
    if (lead.status === "won") convertedLeads++;
  }
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Ad campaigns
  const adCampaigns = await prisma.adCampaign.findMany({
    where: { clientId, createdAt: { gte: start, lte: end } },
    select: { spent: true, impressions: true, clicks: true, costPerLead: true },
  });

  const adSpend = adCampaigns.reduce((s, c) => s + c.spent, 0);
  const impressions = adCampaigns.reduce((s, c) => s + c.impressions, 0);
  const clicks = adCampaigns.reduce((s, c) => s + c.clicks, 0);
  const costPerLead =
    adCampaigns.length > 0
      ? Math.round(adCampaigns.reduce((s, c) => s + (c.costPerLead || 0), 0) / adCampaigns.length)
      : 0;

  // Chatbot
  const chatbot = await prisma.chatbotConfig.findUnique({ where: { clientId } });
  let chatbotConversations = 0;
  if (chatbot) {
    chatbotConversations = await prisma.chatbotConversation.count({
      where: { chatbotId: chatbot.id, createdAt: { gte: start, lte: end } },
    });
  }

  // Reviews
  const reviewsCollected = await prisma.reviewCampaign.count({
    where: { clientId, completedAt: { gte: start, lte: end } },
  });

  // Content
  const contentPublished = await prisma.contentJob.count({
    where: { clientId, status: "published", createdAt: { gte: start, lte: end } },
  });

  // Revenue
  const revenueEvents = await prisma.revenueEvent.findMany({
    where: {
      clientId,
      eventType: "payment_received",
      createdAt: { gte: start, lte: end },
    },
    select: { channel: true, amount: true },
  });

  const revenueByChannel: Record<string, number> = {};
  let totalRevenue = 0;
  for (const event of revenueEvents) {
    const amt = event.amount || 0;
    const ch = event.channel || "unknown";
    revenueByChannel[ch] = (revenueByChannel[ch] || 0) + amt;
    totalRevenue += amt;
  }

  const roi = adSpend > 0 ? Math.round(((totalRevenue - adSpend) / adSpend) * 100) : 0;

  return {
    totalLeads,
    leadsBySource,
    conversionRate,
    adSpend,
    impressions,
    clicks,
    costPerLead,
    chatbotConversations,
    reviewsCollected,
    contentPublished,
    revenueByChannel,
    totalRevenue,
    roi,
  };
}

// ---------------------------------------------------------------------------
// Recommendation Engine
// ---------------------------------------------------------------------------

function generateRecommendations(m: ReportMetrics): string[] {
  const recs: string[] = [];

  if (m.totalLeads < 20) {
    recs.push("Increase lead volume by expanding your ad campaigns or adding a second channel (social, email).");
  }
  if (m.conversionRate < 20) {
    recs.push("Your conversion rate is below 20%. Consider adding automated follow-ups and faster response times.");
  }
  if (m.costPerLead > 10000) {
    recs.push("Cost per lead is high. Optimize ad targeting by narrowing geo-radius and refining keywords.");
  }
  if (m.chatbotConversations < 10) {
    recs.push("Chatbot engagement is low. Promote your chatbot on your website hero section and social media.");
  }
  if (m.reviewsCollected < 5) {
    recs.push("Boost review volume by sending automated review requests after every completed job.");
  }
  if (m.contentPublished < 4) {
    recs.push("Publish more content (blogs, social posts) to improve SEO rankings and brand authority.");
  }
  if (m.roi < 100 && m.adSpend > 0) {
    recs.push("ROI is below 100%. Focus ad budget on top-performing channels and pause underperformers.");
  }

  if (recs.length === 0) {
    recs.push("Performance is strong across all channels. Consider scaling your best-performing services.");
  }

  return recs;
}

// ---------------------------------------------------------------------------
// HTML Generator
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function generateReportHTML(
  clientId: string,
  period: "weekly" | "monthly" | "quarterly"
): Promise<string> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { account: { select: { email: true } } },
  });

  if (!client) throw new Error("Client not found");

  const now = new Date();
  let start: Date;
  let periodLabel: string;

  switch (period) {
    case "weekly":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodLabel = "Weekly Report";
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      periodLabel = "Monthly Report";
      break;
    case "quarterly": {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterMonth, 1);
      periodLabel = "Quarterly Report";
      break;
    }
    default: {
      const _exhaustive: never = period;
      throw new Error(`Unsupported report period: ${_exhaustive}`);
    }
  }

  const metrics = await collectReportMetrics(clientId, start, now);
  const recommendations = generateRecommendations(metrics);

  const data: ReportData = {
    businessName: client.businessName,
    ownerName: client.ownerName,
    city: client.city || "",
    state: client.state || "",
    dateRange: { start, end: now },
    periodLabel,
    metrics,
    recommendations,
  };

  return buildHTML(data);
}

function buildHTML(data: ReportData): string {
  const { businessName, periodLabel, dateRange, metrics: m, recommendations } = data;

  const leadSourceRows = Object.entries(m.leadsBySource)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([source, count]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:capitalize">${escapeHtml(source)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${count}</td></tr>`
    )
    .join("");

  const revenueRows = Object.entries(m.revenueByChannel)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([channel, amount]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:capitalize">${escapeHtml(channel.replace(/_/g, " "))}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${formatCurrency(amount)}</td></tr>`
    )
    .join("");

  const recommendationItems = recommendations
    .map((r) => `<li style="margin-bottom:8px;color:#333;font-size:14px">${escapeHtml(r)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${periodLabel} — ${escapeHtml(businessName)}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 0.5in; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1a1a1a; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; border-bottom: 2px solid #4c85ff; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; color: #0a0a0f; }
    .header p { color: #666; font-size: 14px; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; color: #0a0a0f; margin-bottom: 16px; border-left: 4px solid #4c85ff; padding-left: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .kpi-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .kpi-card .value { font-size: 28px; font-weight: 700; color: #4c85ff; }
    .kpi-card .label { font-size: 12px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 12px; text-align: left; background: #f8f9fa; font-size: 12px; text-transform: uppercase; color: #666; }
    .roi-box { background: linear-gradient(135deg, #4c85ff, #22d3a1); color: white; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .roi-box .big { font-size: 48px; font-weight: 700; }
    .roi-box .label { font-size: 14px; opacity: 0.9; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid #eee; margin-top: 40px; }
    .footer p { font-size: 12px; color: #999; }
    .print-btn { display: inline-block; margin: 0 auto 32px; padding: 12px 32px; background: #4c85ff; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .print-btn:hover { background: #3a6fdc; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Print button -->
    <div style="text-align:center" class="no-print">
      <button class="print-btn" onclick="window.print()">Save as PDF (Ctrl+P)</button>
    </div>

    <!-- Header -->
    <div class="header">
      <h1>${escapeHtml(businessName)}</h1>
      <p>${periodLabel} &mdash; ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}</p>
      <p style="color:#4c85ff;font-weight:600;margin-top:8px">Powered by Sovereign AI</p>
    </div>

    <!-- Executive Summary KPIs -->
    <div class="section">
      <h2>Executive Summary</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="value">${m.totalLeads}</div>
          <div class="label">Total Leads</div>
        </div>
        <div class="kpi-card">
          <div class="value">${m.conversionRate}%</div>
          <div class="label">Conversion Rate</div>
        </div>
        <div class="kpi-card">
          <div class="value">${formatCurrency(m.totalRevenue)}</div>
          <div class="label">Revenue</div>
        </div>
        <div class="kpi-card">
          <div class="value">${formatCurrency(m.adSpend)}</div>
          <div class="label">Ad Spend</div>
        </div>
      </div>
    </div>

    <!-- Leads by Source -->
    <div class="section">
      <h2>Leads by Source</h2>
      ${
        leadSourceRows
          ? `<table><thead><tr><th>Source</th><th style="text-align:right">Count</th></tr></thead><tbody>${leadSourceRows}</tbody></table>`
          : `<p style="color:#999;font-size:14px">No leads captured during this period.</p>`
      }
    </div>

    <!-- Marketing Performance -->
    <div class="section">
      <h2>Marketing Performance</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="value">${m.impressions.toLocaleString()}</div>
          <div class="label">Impressions</div>
        </div>
        <div class="kpi-card">
          <div class="value">${m.clicks.toLocaleString()}</div>
          <div class="label">Clicks</div>
        </div>
        <div class="kpi-card">
          <div class="value">${formatCurrency(m.costPerLead)}</div>
          <div class="label">Cost Per Lead</div>
        </div>
      </div>
    </div>

    <!-- AI Services Performance -->
    <div class="section">
      <h2>AI Services Performance</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="value">${m.chatbotConversations}</div>
          <div class="label">Chatbot Conversations</div>
        </div>
        <div class="kpi-card">
          <div class="value">${m.reviewsCollected}</div>
          <div class="label">Reviews Collected</div>
        </div>
        <div class="kpi-card">
          <div class="value">${m.contentPublished}</div>
          <div class="label">Content Published</div>
        </div>
      </div>
    </div>

    <!-- Revenue Attribution -->
    <div class="section">
      <h2>Revenue Attribution</h2>
      ${
        revenueRows
          ? `<table><thead><tr><th>Channel</th><th style="text-align:right">Revenue</th></tr></thead><tbody>${revenueRows}</tbody></table>`
          : `<p style="color:#999;font-size:14px">No revenue events recorded during this period.</p>`
      }
    </div>

    <!-- ROI -->
    <div class="roi-box">
      <div class="label">Return on Investment</div>
      <div class="big">${m.roi}%</div>
      <div class="label">Revenue: ${formatCurrency(m.totalRevenue)} &mdash; Ad Spend: ${formatCurrency(m.adSpend)}</div>
    </div>

    <!-- Recommendations -->
    <div class="section">
      <h2>Recommendations</h2>
      <ol style="padding-left:20px">${recommendationItems}</ol>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Generated by Sovereign AI &mdash; AI-Powered Marketing for Local Businesses</p>
      <p>Report generated on ${formatDate(new Date())}</p>
    </div>
  </div>
</body>
</html>`;
}
