/**
 * Weekly report email template — sent every Monday with performance metrics.
 */

import { escapeHtml } from "@/lib/email";
import {
  APP_URL,
  baseLayout,
  heading,
  paragraph,
  statCard,
  accentCard,
  ctaButton,
  formatCurrency,
  BRAND,
} from "./shared";

export interface WeeklyReportVars {
  name: string;
  businessName: string;
  weekOf: string;
  leads: number;
  callsAnswered: number;
  reviewsGenerated: number;
  bookings: number;
  estimatedRevenue: number;
  weekOverWeekChange?: number;
  topActions: string[];
  dashboardUrl: string;
  narrative?: string;
}

export function buildWeeklyReport(vars: WeeklyReportVars): { subject: string; html: string } {
  const safeName = escapeHtml(vars.name);
  const safeBusiness = escapeHtml(vars.businessName);

  const subject = `Weekly Report: ${vars.leads} leads, ${vars.callsAnswered} calls — ${escapeHtml(vars.businessName)}`;

  const changeIndicator = vars.weekOverWeekChange != null
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
        <tr>
          <td style="text-align:center;">
            <span style="display:inline-block;background:${vars.weekOverWeekChange >= 0 ? BRAND.secondary : BRAND.danger}15;color:${vars.weekOverWeekChange >= 0 ? BRAND.secondary : BRAND.danger};padding:6px 16px;border-radius:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;">
              ${vars.weekOverWeekChange >= 0 ? "&#x25B2;" : "&#x25BC;"} ${vars.weekOverWeekChange >= 0 ? "+" : ""}${vars.weekOverWeekChange}% vs last week
            </span>
          </td>
        </tr>
      </table>`
    : "";

  const actionItems = vars.topActions.length > 0
    ? `${heading("Recommended Actions", 3)}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${vars.topActions.map((action, i) => `
          <tr>
            <td style="padding:8px 0;vertical-align:top;width:24px;">
              <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${BRAND.primary};color:${BRAND.white};text-align:center;line-height:20px;font-size:11px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${i + 1}</span>
            </td>
            <td style="padding:8px 0 8px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};line-height:1.5;">
              ${escapeHtml(action)}
            </td>
          </tr>`).join("")}
      </table>`
    : "";

  const narrativeSection = vars.narrative
    ? accentCard(
        `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};line-height:1.6;margin:0;">${escapeHtml(vars.narrative)}</p>`
      )
    : "";

  const body = `
    ${heading(`Weekly Report for ${safeBusiness}`)}
    ${paragraph(`Hi ${safeName}, here&rsquo;s your AI marketing performance for the week of <strong>${escapeHtml(vars.weekOf)}</strong>.`)}

    ${changeIndicator}

    ${statCard([
      { label: "New Leads", value: String(vars.leads), color: BRAND.primary },
      { label: "Calls Answered", value: String(vars.callsAnswered), color: BRAND.secondary },
      { label: "Reviews", value: String(vars.reviewsGenerated), color: BRAND.warning },
    ])}

    <!-- Detailed metrics table -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
      <tr>
        <td style="background:${BRAND.cardBg};border-radius:12px;padding:20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};">Bookings</td>
              <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:${BRAND.text};text-align:right;">${vars.bookings}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};">Est. Revenue Impact</td>
              <td style="padding:10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:${BRAND.secondary};text-align:right;">${formatCurrency(vars.estimatedRevenue)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${narrativeSection}

    ${actionItems}

    ${ctaButton("View Full Dashboard", vars.dashboardUrl)}

    ${paragraph("Your AI systems are working 24/7. This report is generated every Monday morning.", { muted: true, small: true, center: true })}
  `;

  return {
    subject,
    html: baseLayout({
      preheader: `${vars.leads} leads, ${vars.callsAnswered} calls answered, ${vars.reviewsGenerated} reviews this week for ${escapeHtml(vars.businessName)}.`,
      body,
      unsubscribeUrl: `${APP_URL}/dashboard/settings/account`,
    }),
  };
}
