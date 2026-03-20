import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

export function buildServiceActivatedEmail(
  ownerName: string,
  businessName: string,
  serviceName: string,
  dashboardUrl: string,
  unsubscribeUrl?: string
): { subject: string; html: string } {
  const subject = `${serviceName} is now live for ${businessName}`;

  // Defense-in-depth: prevent javascript: or other dangerous protocols in href
  const safeDashboardUrl = /^https?:\/\//i.test(dashboardUrl) ? dashboardUrl : "#";

  const html = emailLayout({
    preheader: `Great news! ${serviceName} is live and working for ${businessName}.`,
    unsubscribeUrl,
    body: `
      <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(ownerName)},</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Great news! <strong>${escapeHtml(serviceName)}</strong> is now live and working for <strong>${escapeHtml(businessName)}</strong>.</p>
      <p style="color:#333;font-size:16px;line-height:1.5;">Your AI-powered service is already analyzing data, optimizing performance, and working to grow your business 24/7.</p>
      ${emailButton("View Dashboard", safeDashboardUrl)}
    `,
  });

  return { subject, html };
}
