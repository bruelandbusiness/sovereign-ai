import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

export interface MonthlyReportVars {
  businessName: string;
  reportMonth: string;
  kpis: {
    leads: { current: number; previous: number };
    bookings: { current: number; previous: number };
    reviews: { current: number; previous: number };
    revenue: { current: number; previous: number };
  };
  topServices: { name: string; metric: string }[];
  highlights: string[];
  recommendations: string[];
  dashboardUrl: string;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

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

function metricCard(
  label: string,
  currentDisplay: string,
  previousDisplay: string,
  currentNum: number,
  previousNum: number,
  accentColor: string,
): string {
  return `
    <td style="padding:8px;width:50%;">
      <div style="background:#fff;border:1px solid #e9ecef;border-radius:10px;padding:16px;text-align:center;">
        <div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${label}</div>
        <div style="color:${accentColor};font-size:26px;font-weight:700;line-height:1.2;">${currentDisplay}</div>
        <div style="color:#999;font-size:11px;margin-top:4px;">Last month: ${previousDisplay}</div>
        <div style="margin-top:6px;">${trendBadge(currentNum, previousNum)}</div>
      </div>
    </td>`;
}

function fmtCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

export function buildMonthlyReportEmail(vars: MonthlyReportVars): {
  subject: string;
  html: string;
} {
  const safeBusiness = escapeHtml(vars.businessName);
  const safeMonth = escapeHtml(vars.reportMonth);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

  const subject = `Your Monthly Performance Report — ${vars.businessName} — ${vars.reportMonth}`;
  const preheader =
    `${vars.kpis.leads.current} leads, ` +
    `${vars.kpis.bookings.current} bookings, ` +
    `${fmtCurrency(vars.kpis.revenue.current)} revenue ` +
    `for ${vars.businessName} in ${vars.reportMonth}.`;

  const topServicesRows = vars.topServices
    .map(
      (s) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#333;font-size:14px;">${escapeHtml(s.name)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#666;font-size:14px;text-align:right;">${escapeHtml(s.metric)}</td>
      </tr>`,
    )
    .join("");

  const highlightItems = vars.highlights
    .map(
      (h) =>
        `<li style="color:#333;font-size:14px;line-height:1.6;margin-bottom:4px;">${escapeHtml(h)}</li>`,
    )
    .join("");

  const recommendationItems = vars.recommendations
    .map(
      (r) =>
        `<li style="color:#333;font-size:14px;line-height:1.6;margin-bottom:4px;">${escapeHtml(r)}</li>`,
    )
    .join("");

  const body = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#4c85ff 0%,#22d3a1 100%);color:#fff;font-weight:700;font-size:13px;letter-spacing:1px;padding:6px 16px;border-radius:20px;margin-bottom:12px;">SOVEREIGN AI</div>
      <h2 style="color:#0a0a0f;font-size:22px;margin:8px 0 0;">Monthly Performance Report</h2>
      <p style="color:#666;font-size:14px;margin-top:6px;">${safeBusiness} &mdash; ${safeMonth}</p>
    </div>

    <!-- KPI Summary -->
    <div style="margin:24px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          ${metricCard("Leads", String(vars.kpis.leads.current), String(vars.kpis.leads.previous), vars.kpis.leads.current, vars.kpis.leads.previous, "#4c85ff")}
          ${metricCard("Bookings", String(vars.kpis.bookings.current), String(vars.kpis.bookings.previous), vars.kpis.bookings.current, vars.kpis.bookings.previous, "#8b5cf6")}
        </tr>
        <tr>
          ${metricCard("Reviews", String(vars.kpis.reviews.current), String(vars.kpis.reviews.previous), vars.kpis.reviews.current, vars.kpis.reviews.previous, "#f59e0b")}
          ${metricCard("Revenue", fmtCurrency(vars.kpis.revenue.current), fmtCurrency(vars.kpis.revenue.previous), vars.kpis.revenue.current, vars.kpis.revenue.previous, "#22d3a1")}
        </tr>
      </table>
    </div>

    <!-- Top Performing Services -->
    ${vars.topServices.length > 0 ? `
    <div style="margin:28px 0;">
      <h3 style="color:#0a0a0f;font-size:16px;font-weight:700;margin-bottom:12px;">Top Performing Services</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fff;border:1px solid #e9ecef;border-radius:10px;overflow:hidden;">
        <tr style="background:#f8f9fa;">
          <td style="padding:10px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Service</td>
          <td style="padding:10px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;text-align:right;">Performance</td>
        </tr>
        ${topServicesRows}
      </table>
    </div>
    ` : ""}

    <!-- Highlights / Wins -->
    ${vars.highlights.length > 0 ? `
    <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;padding:16px 20px;margin:20px 0;">
      <h3 style="color:#1d4ed8;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">Highlights &amp; Wins</h3>
      <ul style="margin:0;padding-left:20px;">${highlightItems}</ul>
    </div>
    ` : ""}

    <!-- Recommendations -->
    ${vars.recommendations.length > 0 ? `
    <div style="background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:12px;padding:16px 20px;margin:20px 0;">
      <h3 style="color:#15803d;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">AI Recommendations</h3>
      <ul style="margin:0;padding-left:20px;">${recommendationItems}</ul>
    </div>
    ` : ""}

    <!-- CTA -->
    ${emailButton("View Full Dashboard", vars.dashboardUrl)}

    <p style="color:#666;font-size:13px;text-align:center;margin-top:20px;">This report is generated automatically at the end of each month by your Sovereign AI systems.</p>
  `;

  const html = emailLayout({
    preheader,
    body,
    unsubscribeUrl: `${appUrl}/unsubscribe`,
  });

  return { subject, html };
}
