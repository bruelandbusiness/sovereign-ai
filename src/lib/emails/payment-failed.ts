import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

export function buildPaymentFailedEmail(
  ownerName: string,
  businessName: string,
  amount: string,
  updatePaymentUrl: string
): { subject: string; html: string } {
  const subject = `Action needed: Payment failed for ${businessName}`;

  // Defense-in-depth: prevent javascript: or other dangerous protocols in href
  const safePaymentUrl = /^https?:\/\//i.test(updatePaymentUrl) ? updatePaymentUrl : "#";

  const html = emailLayout({
    preheader: `We were unable to process your payment of ${amount}. Please update your payment method.`,
    isTransactional: true,
    body: `
      <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(ownerName)},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">We were unable to process your payment of <strong>${escapeHtml(amount)}</strong> for <strong>${escapeHtml(businessName)}</strong>.</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Please update your payment method to avoid any interruption to your AI services.</p>
      ${emailButton("Update Payment Method", safePaymentUrl, "danger")}
      <p style="color:#666;font-size:14px;line-height:1.5;">If your payment method is up to date, we&rsquo;ll automatically retry in 24 hours.</p>
    `,
  });

  return { subject, html };
}
