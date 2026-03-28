import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

export function buildReactivationEmail(
  step: 1 | 2 | 3,
  ownerName: string,
  businessName: string,
  unsubscribeUrl?: string
) {
  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
  const reactivateUrl = `${appUrl}/onboarding`;
  const reactivateOfferUrl = `${appUrl}/onboarding?offer=reactivation20`;

  const templates = {
    1: {
      subject: `We miss you, ${safeName} — here's what your competitors are doing`,
      preheader:
        "Your AI systems are paused while your competitors keep generating leads. Come back and pick up where you left off.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${safeName},</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">We noticed you recently canceled your Sovereign AI subscription for <strong>${safeBusiness}</strong>.</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">While your AI systems have been paused, your competitors&rsquo; haven&rsquo;t. In the last 7 days, businesses in your area using AI marketing have generated an average of <strong>23 new leads</strong>.</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">If there was something we could have done better, we&rsquo;d love to hear about it. Reply to this email or book a quick call:</p>
        ${emailButton("Reactivate Your Account", reactivateUrl)}
      `,
    },
    2: {
      subject: `${safeBusiness} — your leads pipeline is drying up`,
      preheader:
        "It's been 2 weeks since your AI marketing went offline. Here's what that means for your business.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${safeName},</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">It&rsquo;s been 2 weeks since your AI marketing systems went offline. Here&rsquo;s what that typically means for businesses like ${safeBusiness}:</p>
        <ul style="color:#333;font-size:16px;line-height:1.8;">
          <li>Lead volume drops 40&ndash;60% within 30 days</li>
          <li>Google rankings start declining after 2 weeks of no content</li>
          <li>Review velocity drops, hurting your local ranking</li>
          <li>Competitors fill the gap in search results</li>
        </ul>
        <p style="color:#333;font-size:16px;line-height:1.5;">The good news? Reactivating now means your AI systems can pick up right where they left off &mdash; no lost data, no re-setup.</p>
        ${emailButton("Reactivate Now", reactivateUrl)}
      `,
    },
    3: {
      subject: `Last chance: 20% off to reactivate ${safeBusiness}`,
      preheader:
        "Your account data is still intact. Get 20% off your first 3 months if you reactivate today.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${safeName},</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">It&rsquo;s been 30 days, and we want to make it easy to come back.</p>
        <div style="background:linear-gradient(135deg,#4c85ff11,#22d3a111);border:2px solid #4c85ff33;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
          <p style="color:#4c85ff;font-size:24px;font-weight:700;margin:0;">20% OFF</p>
          <p style="color:#333;font-size:16px;margin:8px 0 0;">Your first 3 months when you reactivate today</p>
        </div>
        <p style="color:#333;font-size:16px;line-height:1.5;">This is a one-time offer. Your account data, configurations, and AI training are still intact &mdash; everything will be back online within 24 hours of reactivation.</p>
        ${emailButton("Claim 20% Off & Reactivate", reactivateOfferUrl)}
        <p style="color:#999;font-size:13px;text-align:center;">Offer expires in 7 days.</p>
      `,
    },
  };

  const template = templates[step];

  const html = emailLayout({
    preheader: template.preheader,
    body: template.body,
    unsubscribeUrl: unsubscribeUrl || `${appUrl}/unsubscribe`,
  });

  return { subject: template.subject, html };
}
