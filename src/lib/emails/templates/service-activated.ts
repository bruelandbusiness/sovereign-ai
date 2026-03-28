/**
 * Service activated email template — sent when a new AI service goes live.
 */

import { escapeHtml } from "@/lib/email";
import {
  baseLayout,
  heading,
  paragraph,
  infoCard,
  ctaButton,
  BRAND,
} from "./shared";

export interface ServiceActivatedVars {
  name: string;
  businessName: string;
  serviceName: string;
  serviceDescription?: string;
  dashboardUrl: string;
  nextSteps?: string[];
}

export function buildServiceActivated(vars: ServiceActivatedVars): { subject: string; html: string } {
  const safeName = escapeHtml(vars.name);
  const safeBusiness = escapeHtml(vars.businessName);
  const safeService = escapeHtml(vars.serviceName);

  const subject = `${escapeHtml(vars.serviceName)} is now live for ${escapeHtml(vars.businessName)}!`;

  const nextStepsSection = vars.nextSteps && vars.nextSteps.length > 0
    ? `${heading("What to expect", 3)}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${vars.nextSteps.map((step) => `
          <tr>
            <td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};line-height:1.5;">
              &#x2713;&ensp;${escapeHtml(step)}
            </td>
          </tr>`).join("")}
      </table>`
    : "";

  const body = `
    <!-- Success banner -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="background:${BRAND.secondary}12;border:1px solid ${BRAND.secondary}33;border-radius:8px;padding:14px 20px;text-align:center;">
          <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:${BRAND.secondary};margin:0;">&#x2705; Service Activated</p>
        </td>
      </tr>
    </table>

    ${paragraph(`Hi ${safeName},`)}
    ${paragraph(`Great news! <strong>${safeService}</strong> is now live and working for <strong>${safeBusiness}</strong>.`)}

    ${vars.serviceDescription
      ? infoCard(`<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};line-height:1.6;margin:0;">${escapeHtml(vars.serviceDescription)}</p>`)
      : ""
    }

    ${paragraph("Your AI-powered service is already analyzing data, optimizing performance, and working to grow your business 24/7.")}

    ${nextStepsSection}

    ${ctaButton("View Your Dashboard", vars.dashboardUrl)}

    ${paragraph("If you have any questions about your new service, reply to this email and we'll be happy to help.", { muted: true, small: true, center: true })}
  `;

  return {
    subject,
    html: baseLayout({
      preheader: `${escapeHtml(vars.serviceName)} is live and working for ${escapeHtml(vars.businessName)}!`,
      body,
      isTransactional: true,
    }),
  };
}
