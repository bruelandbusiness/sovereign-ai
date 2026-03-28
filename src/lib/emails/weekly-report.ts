import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

interface WeeklyReportEmailData {
  businessName: string;
  ownerName: string;
  leads: number;
  previousLeads: number;
  reviews: number;
  previousReviews: number;
  contentPublished: number;
  chatbotConversations: number;
  bookings: number;
  callsAnswered: number;
  previousCallsAnswered: number;
  revenue: number;
  previousRevenue: number;
  conversionRate: number;
  previousConversionRate: number;
  topAchievement: string;
  tips: string[];
  dashboardUrl?: string;
  narrative?: string;
  weekOverWeekChange?: number;
  unsubscribeUrl?: string;
}

/**
 * Render a trend arrow with color based on direction.
 * Up = green, down = red, flat = gray.
 */
function trendIndicator(current: number, previous: number): string {
  if (previous === 0 && current === 0) {
    return `<span style="color:#999;font-size:12px;">&#8212;</span>`;
  }
  const pct =
    previous === 0
      ? 100
      : Math.round(((current - previous) / previous) * 100);

  if (pct > 0) {
    return `<span style="color:#22d3a1;font-size:12px;font-weight:600;">&#9650; +${pct}%</span>`;
  }
  if (pct < 0) {
    return `<span style="color:#ef4444;font-size:12px;font-weight:600;">&#9660; ${pct}%</span>`;
  }
  return `<span style="color:#999;font-size:12px;font-weight:600;">&#9644; 0%</span>`;
}

/**
 * Render a single KPI comparison card (this week vs last week).
 */
function kpiCard(
  label: string,
  current: string,
  previous: string,
  currentNum: number,
  previousNum: number,
  color: string,
): string {
  return `
    <td style="padding:8px;width:50%;">
      <div style="background:#fff;border:1px solid #e9ecef;border-radius:10px;padding:16px;text-align:center;">
        <div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${label}</div>
        <div style="color:${color};font-size:26px;font-weight:700;line-height:1.2;">${current}</div>
        <div style="color:#999;font-size:11px;margin-top:4px;">Last week: ${previous}</div>
        <div style="margin-top:6px;">${trendIndicator(currentNum, previousNum)}</div>
      </div>
    </td>`;
}

export function buildWeeklyReportEmail(data: WeeklyReportEmailData) {
  const {
    businessName,
    ownerName,
    leads,
    previousLeads,
    reviews,
    previousReviews,
    contentPublished,
    chatbotConversations,
    bookings,
    callsAnswered,
    previousCallsAnswered,
    revenue,
    previousRevenue,
    conversionRate,
    previousConversionRate,
    topAchievement,
    tips,
    dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com"}/dashboard`,
    narrative,
    unsubscribeUrl,
  } = data;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);
  const safeAchievement = escapeHtml(topAchievement);

  const subject = `Weekly Report: ${leads} Leads, $${revenue.toLocaleString()} Revenue — ${businessName}`;

  const tipListItems = tips
    .map(
      (tip) =>
        `<li style="color:#333;font-size:14px;line-height:1.6;margin-bottom:8px;">${escapeHtml(tip)}</li>`,
    )
    .join("\n");

  const html = emailLayout({
    preheader: `${leads} leads, $${revenue.toLocaleString()} revenue this week for ${safeBusiness}. View your full AI performance report.`,
    unsubscribeUrl:
      unsubscribeUrl || `${appUrl}/dashboard/settings/account`,
    body: `
      <!-- Header -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#4c85ff 0%,#22d3a1 100%);color:#fff;font-weight:700;font-size:13px;letter-spacing:1px;padding:6px 16px;border-radius:20px;margin-bottom:12px;">SOVEREIGN AI</div>
        <h2 style="color:#0a0a0f;font-size:24px;margin:8px 0 0;">Your Weekly Performance Report</h2>
        <p style="color:#666;font-size:14px;margin-top:6px;">Week ending ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${safeName},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Here&rsquo;s how <strong>${safeBusiness}</strong> performed this week compared to last week:</p>

      <!-- Top Achievement Callout -->
      <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center;">
        <div style="font-size:20px;margin-bottom:4px;">&#127942;</div>
        <div style="color:#92400e;font-size:15px;font-weight:700;">Top Achievement</div>
        <div style="color:#78350f;font-size:14px;margin-top:4px;">${safeAchievement}</div>
      </div>

      <!-- KPI Comparison Cards -->
      <div style="margin:24px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${kpiCard("New Leads", String(leads), String(previousLeads), leads, previousLeads, "#4c85ff")}
            ${kpiCard("Revenue", "$" + revenue.toLocaleString(), "$" + previousRevenue.toLocaleString(), revenue, previousRevenue, "#22d3a1")}
          </tr>
          <tr>
            ${kpiCard("New Reviews", String(reviews), String(previousReviews), reviews, previousReviews, "#f59e0b")}
            ${kpiCard("Calls Answered", String(callsAnswered), String(previousCallsAnswered), callsAnswered, previousCallsAnswered, "#8b5cf6")}
          </tr>
          <tr>
            ${kpiCard("Conversion Rate", conversionRate + "%", previousConversionRate + "%", conversionRate, previousConversionRate, "#ec4899")}
            ${kpiCard("Bookings", String(bookings), "—", bookings, 0, "#06b6d4")}
          </tr>
        </table>
      </div>

      <!-- Additional Stats Row -->
      <div style="background:#f8f9fa;border-radius:12px;padding:16px 20px;margin:16px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="color:#666;font-size:13px;padding:6px 0;">Content Published</td>
            <td style="color:#333;font-size:13px;font-weight:600;text-align:right;padding:6px 0;">${contentPublished}</td>
          </tr>
          <tr>
            <td style="color:#666;font-size:13px;padding:6px 0;">Chatbot Conversations</td>
            <td style="color:#333;font-size:13px;font-weight:600;text-align:right;padding:6px 0;">${chatbotConversations}</td>
          </tr>
        </table>
      </div>

      <!-- AI Narrative -->
      ${narrative ? `<div style="background:#f0f4ff;border-left:4px solid #4c85ff;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <div style="color:#4c85ff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">AI Analysis</div>
        <p style="color:#333;font-size:14px;line-height:1.6;margin:0;">${escapeHtml(narrative)}</p>
      </div>` : ""}

      <!-- Actionable Tips -->
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:24px 0;">
        <div style="color:#166534;font-size:15px;font-weight:700;margin-bottom:12px;">&#128161; 3 Tips to Improve This Week</div>
        <ol style="margin:0;padding-left:20px;">
          ${tipListItems}
        </ol>
      </div>

      <!-- CTA -->
      ${emailButton("View Full Dashboard", dashboardUrl)}

      <p style="color:#666;font-size:13px;text-align:center;margin-top:20px;">Your AI systems are working 24/7. This report is generated every Monday morning.</p>

      <!-- Unsubscribe note -->
      <p style="color:#999;font-size:12px;text-align:center;margin-top:8px;">
        You can manage your report preferences in your <a href="${escapeHtml(appUrl)}/dashboard/settings/account" style="color:#4c85ff;text-decoration:underline;">account settings</a>.
      </p>
    `,
  });

  return { subject, html };
}
