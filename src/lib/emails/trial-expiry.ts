import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

export function buildTrialExpiryEmail(
  ownerName: string,
  businessName: string,
  daysRemaining: number,
  upgradeUrl: string,
  stats: { leads: number; reviews: number; calls: number },
  unsubscribeUrl?: string
): { subject: string; html: string } {
  const subject = daysRemaining <= 1
    ? `Your trial ends tomorrow, ${ownerName}`
    : `${daysRemaining} days left on your ${businessName} trial`;

  // Defense-in-depth: prevent javascript: or other dangerous protocols in href
  const safeUpgradeUrl = /^https?:\/\//i.test(upgradeUrl) ? upgradeUrl : "#";

  const html = emailLayout({
    preheader: `Your free trial ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. See what your AI services have accomplished.`,
    unsubscribeUrl,
    body: `
      <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(ownerName)},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Your free trial for <strong>${escapeHtml(businessName)}</strong> ends in <strong>${daysRemaining} day${daysRemaining === 1 ? "" : "s"}</strong>.</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Here&rsquo;s what your AI services have achieved so far:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
        <tr>
          <td style="background:#f8f9fa;border-radius:12px;padding:20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td align="center" width="33%" style="padding:8px;">
                  <p style="font-size:24px;font-weight:bold;color:#4c85ff;margin:0;">${stats.leads}</p>
                  <p style="font-size:12px;color:#666;margin:4px 0 0;">Leads</p>
                </td>
                <td align="center" width="34%" style="padding:8px;">
                  <p style="font-size:24px;font-weight:bold;color:#22d3a1;margin:0;">${stats.reviews}</p>
                  <p style="font-size:12px;color:#666;margin:4px 0 0;">Reviews</p>
                </td>
                <td align="center" width="33%" style="padding:8px;">
                  <p style="font-size:24px;font-weight:bold;color:#fbbf24;margin:0;">${stats.calls}</p>
                  <p style="font-size:12px;color:#666;margin:4px 0 0;">Calls</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="color:#333;font-size:16px;line-height:1.5;">Don&rsquo;t lose this momentum. Upgrade now to keep your AI services running.</p>
      ${emailButton("Upgrade Now", safeUpgradeUrl)}
    `,
  });

  return { subject, html };
}
