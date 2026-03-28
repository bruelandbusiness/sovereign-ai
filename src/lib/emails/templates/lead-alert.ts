/**
 * Lead alert email template — sent immediately when a new lead arrives.
 */

import { escapeHtml } from "@/lib/email";
import {
  baseLayout,
  heading,
  paragraph,
  divider,
  ctaButton,
  BRAND,
} from "./shared";

export interface LeadAlertVars {
  name: string;
  businessName: string;
  leadName: string;
  leadPhone?: string;
  leadEmail?: string;
  leadSource: string;
  leadService?: string;
  leadMessage?: string;
  dashboardUrl: string;
  timestamp: string;
}

export function buildLeadAlert(vars: LeadAlertVars): { subject: string; html: string } {
  const safeName = escapeHtml(vars.name);
  const safeLeadName = escapeHtml(vars.leadName);

  const subject = `New lead: ${escapeHtml(vars.leadName)} — ${escapeHtml(vars.businessName)}`;

  const detailRows: string[] = [];
  if (vars.leadPhone) {
    detailRows.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted};width:100px;">Phone</td>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};font-weight:600;">
          <a href="tel:${escapeHtml(vars.leadPhone)}" style="color:${BRAND.primary};text-decoration:none;">${escapeHtml(vars.leadPhone)}</a>
        </td>
      </tr>`);
  }
  if (vars.leadEmail) {
    detailRows.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted};width:100px;">Email</td>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};">
          <a href="mailto:${escapeHtml(vars.leadEmail)}" style="color:${BRAND.primary};text-decoration:none;">${escapeHtml(vars.leadEmail)}</a>
        </td>
      </tr>`);
  }
  detailRows.push(`
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted};width:100px;">Source</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};">${escapeHtml(vars.leadSource)}</td>
    </tr>`);
  if (vars.leadService) {
    detailRows.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted};width:100px;">Service</td>
        <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};">${escapeHtml(vars.leadService)}</td>
      </tr>`);
  }
  detailRows.push(`
    <tr>
      <td style="padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted};width:100px;">Time</td>
      <td style="padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};">${escapeHtml(vars.timestamp)}</td>
    </tr>`);

  const messageSection = vars.leadMessage
    ? `${divider()}
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted};margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};line-height:1.6;margin:0;background:${BRAND.white};padding:12px 16px;border-radius:8px;border:1px solid ${BRAND.border};">${escapeHtml(vars.leadMessage)}</p>`
    : "";

  const body = `
    <!-- Alert banner -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="background:${BRAND.primary}10;border:1px solid ${BRAND.primary}33;border-radius:8px;padding:14px 20px;text-align:center;">
          <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:${BRAND.primary};margin:0;">&#x1F514; New Lead Just Came In!</p>
        </td>
      </tr>
    </table>

    ${paragraph(`Hi ${safeName}, a new lead just submitted their information for <strong>${escapeHtml(vars.businessName)}</strong>.`)}

    <!-- Lead details card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0;">
      <tr>
        <td style="background:${BRAND.cardBg};border-radius:12px;padding:24px;">
          ${heading(safeLeadName, 2)}
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${detailRows.join("")}
          </table>
          ${messageSection}
        </td>
      </tr>
    </table>

    ${ctaButton("View in Dashboard", vars.dashboardUrl)}

    ${paragraph("Responding within 5 minutes increases conversion by 400%. The faster you reach out, the better your chances.", { muted: true, small: true, center: true })}
  `;

  return {
    subject,
    html: baseLayout({
      preheader: `New lead from ${escapeHtml(vars.leadSource)}: ${escapeHtml(vars.leadName)}. Respond quickly!`,
      body,
      isTransactional: true,
    }),
  };
}
