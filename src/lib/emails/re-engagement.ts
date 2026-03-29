import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

/**
 * Build a re-engagement email for inactive clients.
 *
 * Step 1 (14 days inactive): "We miss you" — highlight new features
 * Step 2 (30 days inactive): "Your AI services need attention" — urgency
 */
export function buildReEngagementEmail(
  step: 1 | 2,
  ownerName: string,
  businessName: string,
  unsubscribeUrl?: string,
): { subject: string; html: string } {
  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
  const dashboardUrl = `${appUrl}/dashboard`;
  const supportUrl = `${appUrl}/support`;

  const templates: Record<
    1 | 2,
    { subject: string; preheader: string; body: string }
  > = {
    1: {
      subject: `We miss you, ${safeName} &mdash; see what's new`,
      preheader:
        "It's been a couple of weeks. Here's what you've been missing on Sovereign AI.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Hi ${safeName},
        </p>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          We noticed you haven&rsquo;t logged into your Sovereign AI dashboard
          for ${safeBusiness} recently. We&rsquo;ve been busy shipping
          improvements &mdash; here&rsquo;s what&rsquo;s new:
        </p>
        <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 16px;">
            <strong>Enhanced AI Content Engine</strong><br />
            Smarter content generation with better local SEO targeting and
            brand-voice matching.
          </p>
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 16px;">
            <strong>Improved Lead Scoring</strong><br />
            AI now prioritizes your hottest leads so you can focus on the
            prospects most likely to convert.
          </p>
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0;">
            <strong>New Analytics Dashboard</strong><br />
            See your ROI at a glance with our redesigned KPI views
            and weekly trend reports.
          </p>
        </div>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          While you&rsquo;ve been away, your AI services have continued
          running. Log in to see what they&rsquo;ve accomplished.
        </p>
        ${emailButton("See What You're Missing", dashboardUrl)}
      `,
    },
    2: {
      subject: `${safeBusiness} &mdash; your AI services need attention`,
      preheader:
        "It's been 30 days. Your competitors are pulling ahead while your dashboard goes unchecked.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Hi ${safeName},
        </p>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          It&rsquo;s been 30 days since you last checked in on
          <strong>${safeBusiness}</strong>&rsquo;s AI marketing dashboard.
          Your systems are still running, but without your guidance they
          can&rsquo;t reach their full potential.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:#333;font-size:16px;line-height:1.5;font-weight:600;margin:0 0 12px;">
            Here&rsquo;s what you may be missing:
          </p>
          <ul style="color:#333;font-size:16px;line-height:1.8;margin:0;">
            <li>Leads that haven&rsquo;t been reviewed or followed up</li>
            <li>Customer reviews waiting for your response</li>
            <li>Content drafts awaiting your approval</li>
            <li>Performance insights that could optimize your spend</li>
          </ul>
        </div>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Businesses that actively manage their AI marketing platform see
          <strong>2&ndash;3x better results</strong> than those running on
          autopilot. A quick 5-minute check-in can make a big difference.
        </p>
        ${emailButton("Log In to Your Dashboard", dashboardUrl)}
        <p style="color:#333;font-size:16px;line-height:1.5;text-align:center;">
          Need a hand getting back on track?
        </p>
        ${emailButton("Talk to Our Team", supportUrl)}
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
