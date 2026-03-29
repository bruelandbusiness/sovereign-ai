import { escapeHtml, emailLayout, emailButton } from "@/lib/email";
import { getServiceById } from "@/lib/constants";

export function buildAbandonedCartEmail(
  ownerName: string,
  businessName: string,
  selectedServices: string[],
  unsubscribeUrl?: string
) {
  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
  const completeSetupUrl = `${appUrl}/onboarding?offer=abandoned10`;

  // Build a readable list of the services they selected
  const serviceNames = selectedServices
    .map((id) => {
      const service = getServiceById(id);
      return service ? escapeHtml(service.name) : null;
    })
    .filter(Boolean);

  const serviceListHtml =
    serviceNames.length > 0
      ? `<ul style="color:#333;font-size:16px;line-height:1.8;">
          ${serviceNames.map((name) => `<li>${name}</li>`).join("\n          ")}
        </ul>`
      : "";

  const subject = `You were so close, ${safeName} — complete your setup & save 10%`;
  const preheader =
    "Your AI marketing setup is almost done. Come back and save 10% today.";

  const body = `
    <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${safeName},</p>
    <p style="color:#333;font-size:16px;line-height:1.5;">You were so close to launching AI-powered marketing for <strong>${safeBusiness}</strong>! We noticed you started the setup process but didn&rsquo;t finish checkout.</p>
    ${serviceListHtml ? `<p style="color:#333;font-size:16px;line-height:1.5;">Here are the services you selected:</p>${serviceListHtml}` : ""}
    <div style="background:linear-gradient(135deg,#4c85ff11,#22d3a111);border:2px solid #4c85ff33;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="color:#4c85ff;font-size:24px;font-weight:700;margin:0;">10% OFF</p>
      <p style="color:#333;font-size:16px;margin:8px 0 0;">When you complete your setup today</p>
    </div>
    <p style="color:#333;font-size:16px;line-height:1.5;">Pick up right where you left off &mdash; your selections are saved and ready to go. Use the link below to finish your setup and claim your 10% discount.</p>
    ${emailButton("Complete Your Setup", completeSetupUrl)}
    <p style="color:#999;font-size:13px;text-align:center;">This offer is available for a limited time.</p>
  `;

  const html = emailLayout({
    preheader,
    body,
    unsubscribeUrl: unsubscribeUrl || `${appUrl}/unsubscribe`,
  });

  return { subject, html };
}
