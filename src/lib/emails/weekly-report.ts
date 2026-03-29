import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

export interface WeeklyReportMetrics {
  leadsThisWeek: number;
  leadsLastWeek: number;
  bookingsThisWeek: number;
  bookingsLastWeek: number;
  revenueThisWeek: number;
  revenueLastWeek: number;
  topSource: string;
  reviewsCollected: number;
}

/**
 * Compute percentage change between two numbers.
 * Returns 0 when previous is zero to avoid division errors.
 */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Render an up/down arrow with colour and percentage label.
 */
function trendBadge(current: number, previous: number): string {
  const pct = pctChange(current, previous);
  if (pct > 0) {
    return `<span style="color:#22c55e;font-size:13px;font-weight:600;">&#9650; +${pct}%</span>`;
  }
  if (pct < 0) {
    return `<span style="color:#ef4444;font-size:13px;font-weight:600;">&#9660; ${pct}%</span>`;
  }
  return `<span style="color:#999;font-size:13px;font-weight:600;">&#9644; 0%</span>`;
}

/**
 * Render a single metric comparison card.
 */
function metricCard(
  label: string,
  currentDisplay: string,
  lastWeekDisplay: string,
  currentNum: number,
  lastWeekNum: number,
  accentColor: string,
): string {
  return `
    <td style="padding:8px;width:50%;">
      <div style="background:#fff;border:1px solid #e9ecef;border-radius:10px;padding:16px;text-align:center;">
        <div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${label}</div>
        <div style="color:${accentColor};font-size:26px;font-weight:700;line-height:1.2;">${currentDisplay}</div>
        <div style="color:#999;font-size:11px;margin-top:4px;">Last week: ${lastWeekDisplay}</div>
        <div style="margin-top:6px;">${trendBadge(currentNum, lastWeekNum)}</div>
      </div>
    </td>`;
}

/**
 * Build the weekly KPI report email.
 *
 * @param ownerName    - Client owner's first name / display name
 * @param businessName - The business name shown in the report
 * @param metrics      - This-week vs last-week KPI data
 * @param unsubscribeUrl - Optional unsubscribe link (defaults to account settings)
 */
export function buildWeeklyReportEmail(
  ownerName: string,
  businessName: string,
  metrics: WeeklyReportMetrics,
  unsubscribeUrl?: string,
): { subject: string; html: string } {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);

  const subject = `Your Weekly AI Marketing Report \u2014 ${businessName}`;

  const fmtCurrency = (n: number): string =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });

  const html = emailLayout({
    preheader: `${metrics.leadsThisWeek} leads, ${metrics.bookingsThisWeek} bookings, ${fmtCurrency(metrics.revenueThisWeek)} revenue this week for ${safeBusiness}.`,
    unsubscribeUrl:
      unsubscribeUrl || `${appUrl}/dashboard/settings/account`,
    body: `
      <!-- Header -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#4c85ff 0%,#22d3a1 100%);color:#fff;font-weight:700;font-size:13px;letter-spacing:1px;padding:6px 16px;border-radius:20px;margin-bottom:12px;">SOVEREIGN AI</div>
        <h2 style="color:#0a0a0f;font-size:22px;margin:8px 0 0;">Here&rsquo;s how your AI performed this week</h2>
        <p style="color:#666;font-size:14px;margin-top:6px;">Week ending ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${safeName},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Here is your weekly performance summary for <strong>${safeBusiness}</strong>.</p>

      <!-- KPI Comparison Cards -->
      <div style="margin:24px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${metricCard("Leads", String(metrics.leadsThisWeek), String(metrics.leadsLastWeek), metrics.leadsThisWeek, metrics.leadsLastWeek, "#4c85ff")}
            ${metricCard("Bookings", String(metrics.bookingsThisWeek), String(metrics.bookingsLastWeek), metrics.bookingsThisWeek, metrics.bookingsLastWeek, "#8b5cf6")}
          </tr>
          <tr>
            ${metricCard("Revenue", fmtCurrency(metrics.revenueThisWeek), fmtCurrency(metrics.revenueLastWeek), metrics.revenueThisWeek, metrics.revenueLastWeek, "#22d3a1")}
            ${metricCard("Reviews Collected", String(metrics.reviewsCollected), "\u2014", metrics.reviewsCollected, 0, "#f59e0b")}
          </tr>
        </table>
      </div>

      <!-- Top Lead Source Highlight -->
      <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center;">
        <div style="color:#1d4ed8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Top Lead Source</div>
        <div style="color:#1e3a5f;font-size:18px;font-weight:700;">${escapeHtml(metrics.topSource || "N/A")}</div>
      </div>

      <!-- CTA -->
      ${emailButton("View Full Dashboard", `${appUrl}/dashboard`)}

      <p style="color:#666;font-size:13px;text-align:center;margin-top:20px;">Your AI systems are working 24/7. This report is generated every Monday morning.</p>
    `,
  });

  return { subject, html };
}
