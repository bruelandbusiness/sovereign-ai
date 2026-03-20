function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReactivationEmail(
  step: 1 | 2 | 3,
  ownerName: string,
  businessName: string
) {
  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);

  const templates = {
    1: {
      subject: `We miss you, ${safeName} — here's what your competitors are doing`,
      body: `
        <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${safeName},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">We noticed you recently canceled your Sovereign AI subscription for <strong>${safeBusiness}</strong>.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">While your AI systems have been paused, your competitors' haven't. In the last 7 days, businesses in your area using AI marketing have generated an average of <strong>23 new leads</strong>.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">If there was something we could have done better, we'd love to hear about it. Reply to this email or book a quick call:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://sovereignai.com/onboarding" style="background: linear-gradient(135deg, #4c85ff, #22d3a1); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Reactivate Your Account
          </a>
        </div>
      `,
    },
    2: {
      subject: `${safeBusiness} — your leads pipeline is drying up`,
      body: `
        <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${safeName},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">It's been 2 weeks since your AI marketing systems went offline. Here's what that typically means for businesses like ${safeBusiness}:</p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Lead volume drops 40-60% within 30 days</li>
          <li>Google rankings start declining after 2 weeks of no content</li>
          <li>Review velocity drops, hurting your local ranking</li>
          <li>Competitors fill the gap in search results</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">The good news? Reactivating now means your AI systems can pick up right where they left off — no lost data, no re-setup.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://sovereignai.com/onboarding" style="background: linear-gradient(135deg, #4c85ff, #22d3a1); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Reactivate Now
          </a>
        </div>
      `,
    },
    3: {
      subject: `Last chance: 20% off to reactivate ${safeBusiness}`,
      body: `
        <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${safeName},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">It's been 30 days, and we want to make it easy to come back.</p>
        <div style="background: linear-gradient(135deg, #4c85ff11, #22d3a111); border: 2px solid #4c85ff33; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="color: #4c85ff; font-size: 24px; font-weight: 700; margin: 0;">20% OFF</p>
          <p style="color: #333; font-size: 16px; margin: 8px 0 0;">Your first 3 months when you reactivate today</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">This is a one-time offer. Your account data, configurations, and AI training are still intact — everything will be back online within 24 hours of reactivation.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://sovereignai.com/onboarding?offer=reactivation20" style="background: linear-gradient(135deg, #4c85ff, #22d3a1); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Claim 20% Off & Reactivate
          </a>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">Offer expires in 7 days.</p>
      `,
    },
  };

  const template = templates[step];

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0a0a0f; font-size: 24px; margin: 0;">Sovereign AI</h1>
      </div>
      ${template.body}
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Sovereign AI — AI-Powered Marketing for Local Businesses</p>
    </div>
  `;

  return { subject: template.subject, html };
}
