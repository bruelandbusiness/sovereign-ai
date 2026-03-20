import { injectTracking } from "@/lib/email-tracking";
import { escapeHtml, emailLayout, safeHttpUrl } from "@/lib/email";

export function buildNPSEmail(
  ownerName: string,
  businessName: string,
  surveyType: "30day" | "90day",
  responseUrl: string,
  messageId?: string,
  unsubscribeUrl?: string
) {
  const isDay30 = surveyType === "30day";

  const subject = isDay30
    ? `Quick question about your experience, ${ownerName}`
    : `How are things going with Sovereign AI, ${ownerName}?`;

  const intro = isDay30
    ? `You&rsquo;ve been using Sovereign AI for <strong>${escapeHtml(businessName)}</strong> for 30 days now. We&rsquo;d love to know how it&rsquo;s going!`
    : `You&rsquo;ve been part of the Sovereign AI family for 90 days. Your feedback helps us improve for businesses like ${escapeHtml(businessName)}.`;

  // Defense-in-depth: prevent javascript: or other dangerous protocols in href
  const safeResponseUrl = safeHttpUrl(responseUrl);

  // Build NPS score buttons using a table layout (Outlook-safe, no flexbox)
  const scoreButtons = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    const bg = score <= 6 ? "#ef4444" : score <= 8 ? "#f59e0b" : "#22c55e";
    return `<td style="padding:4px;" align="center">
      <a href="${safeResponseUrl}&score=${score}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:${bg}22;color:${bg};border:2px solid ${bg}44;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">${score}</a>
    </td>`;
  }).join("");

  const html = emailLayout({
    preheader: isDay30
      ? "Quick 2-second survey: How likely are you to recommend Sovereign AI?"
      : "We'd love your feedback — how are things going with Sovereign AI?",
    unsubscribeUrl,
    body: `
      <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(ownerName)},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">${intro}</p>
      <p style="color:#333;font-size:16px;line-height:1.5;font-weight:600;">How likely are you to recommend Sovereign AI to a fellow business owner?</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
        <tr>${scoreButtons}</tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:400px;margin:8px auto 0;">
        <tr>
          <td align="left" style="color:#999;font-size:11px;">Not likely</td>
          <td align="right" style="color:#999;font-size:11px;">Very likely</td>
        </tr>
      </table>
      <p style="color:#666;font-size:14px;text-align:center;margin-top:16px;">Click a number above &mdash; it takes 2 seconds.</p>
    `,
  });

  const trackedHtml = messageId ? injectTracking(html, messageId) : html;

  return { subject, html: trackedHtml };
}
