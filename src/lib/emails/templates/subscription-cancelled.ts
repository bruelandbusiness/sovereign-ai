/**
 * Subscription cancelled email template — includes win-back offer.
 */

import { escapeHtml } from "@/lib/email";
import {
  APP_URL,
  baseLayout,
  heading,
  paragraph,
  statCard,
  divider,
  ctaButton,
  formatCurrency,
  BRAND,
} from "./shared";

export interface SubscriptionCancelledVars {
  name: string;
  businessName: string;
  cancelDate: string;
  reactivateUrl: string;
  stats: {
    totalLeads: number;
    totalRevenue: number;
    monthsActive: number;
  };
  offerPercent?: number;
}

export function buildSubscriptionCancelled(vars: SubscriptionCancelledVars): { subject: string; html: string } {
  const safeName = escapeHtml(vars.name);
  const safeBusiness = escapeHtml(vars.businessName);
  const offerPercent = vars.offerPercent ?? 20;

  const subject = `We're sorry to see you go, ${escapeHtml(vars.name)}`;

  const body = `
    ${paragraph(`Hi ${safeName},`)}
    ${paragraph(`Your Sovereign AI subscription for <strong>${safeBusiness}</strong> has been cancelled effective <strong>${escapeHtml(vars.cancelDate)}</strong>.`)}
    ${paragraph("Your AI marketing services will be paused and you'll no longer receive automated leads, reviews, or call handling.")}

    ${heading("Here's what you achieved with Sovereign AI", 2)}

    ${statCard([
      { label: "Total Leads", value: String(vars.stats.totalLeads), color: BRAND.primary },
      { label: "Revenue Generated", value: formatCurrency(vars.stats.totalRevenue), color: BRAND.secondary },
      { label: "Months Active", value: String(vars.stats.monthsActive), color: BRAND.warning },
    ])}

    ${divider()}

    <!-- Win-back offer -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,${BRAND.primary}08,${BRAND.secondary}08);border:2px solid ${BRAND.primary}22;border-radius:12px;padding:28px 24px;text-align:center;">
          <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Special Offer</p>
          <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:36px;font-weight:700;color:${BRAND.primary};margin:0;">${offerPercent}% OFF</p>
          <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:${BRAND.text};margin:12px 0 0;">Your first 3 months if you reactivate within 7 days</p>
        </td>
      </tr>
    </table>

    ${paragraph("Your account data, AI configurations, and training are fully preserved. Everything will be back online within 24 hours of reactivation.")}

    ${ctaButton("Reactivate & Claim " + offerPercent + "% Off", vars.reactivateUrl)}

    ${paragraph("This offer expires 7 days after cancellation. After that, standard pricing applies.", { muted: true, small: true, center: true })}

    ${divider()}

    ${paragraph("If there&rsquo;s anything we could have done better, we&rsquo;d genuinely love to hear about it. Reply to this email anytime.", { muted: true, small: true })}
  `;

  return {
    subject,
    html: baseLayout({
      preheader: `Your ${escapeHtml(vars.businessName)} subscription has been cancelled. Here's a special offer to come back.`,
      body,
      unsubscribeUrl: `${APP_URL}/unsubscribe`,
    }),
  };
}
