/**
 * Review request email template — sent to customers after service completion.
 */

import { escapeHtml } from "@/lib/email";
import {
  APP_URL,
  baseLayout,
  paragraph,
  divider,
  ctaButton,
} from "./shared";

export interface ReviewRequestVars {
  customerName: string;
  businessName: string;
  reviewUrl: string;
  serviceName?: string;
}

export function buildReviewRequest(vars: ReviewRequestVars): { subject: string; html: string } {
  const safeCustomer = escapeHtml(vars.customerName);
  const safeBusiness = escapeHtml(vars.businessName);

  const subject = `How was your experience with ${escapeHtml(vars.businessName)}?`;

  const serviceContext = vars.serviceName
    ? ` for your recent <strong>${escapeHtml(vars.serviceName)}</strong> service`
    : "";

  const body = `
    ${paragraph(`Hi ${safeCustomer},`)}
    ${paragraph(`Thank you for choosing <strong>${safeBusiness}</strong>${serviceContext}. We hope everything went great!`)}
    ${paragraph("Would you mind taking 30 seconds to share your experience? Your feedback helps other homeowners find quality service and helps us keep improving.")}

    <!-- Star visual -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0;">
      <tr>
        <td style="text-align:center;font-size:32px;padding:8px 0;">
          &#x2B50;&#x2B50;&#x2B50;&#x2B50;&#x2B50;
        </td>
      </tr>
    </table>

    ${ctaButton("Leave a Review", vars.reviewUrl, "gold")}

    ${paragraph("It only takes 30 seconds and means the world to us. Thank you!", { muted: true, center: true })}

    ${divider()}

    ${paragraph(`&mdash; The ${safeBusiness} Team`, { muted: true, center: true })}
  `;

  return {
    subject,
    html: baseLayout({
      preheader: `Thanks for choosing ${escapeHtml(vars.businessName)}! Would you take 30 seconds to leave a review?`,
      body,
      // Review requests are sent on behalf of clients, so include unsubscribe
      unsubscribeUrl: `${APP_URL}/unsubscribe`,
    }),
  };
}
