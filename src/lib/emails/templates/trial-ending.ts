/**
 * Trial-ending email template — sent as the free trial nears expiry.
 */

import { escapeHtml } from "@/lib/email";
import {
  baseLayout,
  heading,
  paragraph,
  statCard,
  ctaButton,
  BRAND,
} from "./shared";

export interface TrialEndingVars {
  name: string;
  businessName: string;
  daysRemaining: number;
  upgradeUrl: string;
  stats: {
    leads: number;
    calls: number;
    reviews: number;
  };
}

export function buildTrialEnding(vars: TrialEndingVars): { subject: string; html: string } {
  const safeName = escapeHtml(vars.name);
  const safeBusiness = escapeHtml(vars.businessName);
  const isLastDay = vars.daysRemaining <= 1;

  const subject = isLastDay
    ? `Your trial ends tomorrow, ${escapeHtml(vars.name)} — don't lose your progress`
    : `${vars.daysRemaining} days left on your ${escapeHtml(vars.businessName)} trial`;

  const urgencyBanner = isLastDay
    ? `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
  <tr>
    <td style="background:${BRAND.danger}11;border:1px solid ${BRAND.danger}33;border-radius:8px;padding:14px 20px;text-align:center;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${BRAND.danger};margin:0;">Your trial expires tomorrow. Upgrade now to keep your AI services running.</p>
    </td>
  </tr>
</table>`
    : "";

  const body = `
    ${urgencyBanner}
    ${paragraph(`Hi ${safeName},`)}
    ${paragraph(`Your free trial for <strong>${safeBusiness}</strong> ends in <strong>${vars.daysRemaining} day${vars.daysRemaining === 1 ? "" : "s"}</strong>. Here&rsquo;s what your AI services have accomplished so far:`)}

    ${statCard([
      { label: "Leads", value: String(vars.stats.leads), color: BRAND.primary },
      { label: "Reviews", value: String(vars.stats.reviews), color: BRAND.secondary },
      { label: "Calls", value: String(vars.stats.calls), color: BRAND.warning },
    ])}

    ${paragraph("When your trial ends, these services will be paused and you'll stop receiving new leads, reviews, and call handling.", { muted: true })}

    ${heading("Keep the momentum going", 2)}
    ${paragraph("Upgrade to any plan to keep your AI marketing engine running 24/7. No setup required — everything picks up right where it left off.")}

    ${ctaButton("Upgrade Now", vars.upgradeUrl)}

    ${paragraph("Questions? Reply to this email and we'll help you choose the right plan.", { muted: true, small: true, center: true })}
  `;

  return {
    subject,
    html: baseLayout({
      preheader: `Your free trial ends in ${vars.daysRemaining} day${vars.daysRemaining === 1 ? "" : "s"}. See what your AI services have accomplished.`,
      body,
      isTransactional: true,
    }),
  };
}
