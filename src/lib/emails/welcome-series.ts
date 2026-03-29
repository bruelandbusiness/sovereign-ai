import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

/**
 * Build a welcome drip series email for a given step.
 *
 * Step 1 (Day 0): Welcome + dashboard overview
 * Step 2 (Day 3): Key features + knowledge base link
 * Step 3 (Day 7): First week results + KPI dashboard + support
 */
export function buildWelcomeSeriesEmail(
  step: 1 | 2 | 3,
  ownerName: string,
  businessName: string,
  unsubscribeUrl?: string,
): { subject: string; html: string } {
  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
  const dashboardUrl = `${appUrl}/dashboard`;
  const knowledgeBaseUrl = `${appUrl}/knowledge-base`;
  const kpiUrl = `${appUrl}/dashboard/kpi`;
  const supportUrl = `${appUrl}/support`;

  const templates: Record<
    1 | 2 | 3,
    { subject: string; preheader: string; body: string }
  > = {
    1: {
      subject: `Welcome to Sovereign AI, ${safeName}!`,
      preheader:
        "Your AI-powered marketing platform is ready. Here's how to get started.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Hi ${safeName},
        </p>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Welcome to Sovereign AI! We&rsquo;re excited to have
          <strong>${safeBusiness}</strong> on board. Your AI marketing
          platform is live and ready to start generating results.
        </p>
        <p style="color:#333;font-size:16px;line-height:1.5;font-weight:600;">
          Here&rsquo;s a quick look at your dashboard:
        </p>
        <ul style="color:#333;font-size:16px;line-height:1.8;">
          <li><strong>Leads</strong> &mdash; see new leads as they come in</li>
          <li><strong>Reviews</strong> &mdash; monitor and respond to customer reviews</li>
          <li><strong>Content</strong> &mdash; AI-generated blog posts and social content</li>
          <li><strong>Analytics</strong> &mdash; track ROI and KPIs at a glance</li>
        </ul>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          <strong>Quick start tips:</strong>
        </p>
        <ol style="color:#333;font-size:16px;line-height:1.8;">
          <li>Complete your business profile so AI content matches your brand voice</li>
          <li>Connect your Google Business Profile for review management</li>
          <li>Invite team members who should have dashboard access</li>
        </ol>
        ${emailButton("Go to Your Dashboard", dashboardUrl)}
        <p style="color:#999;font-size:13px;text-align:center;">
          Questions? Reply to this email &mdash; a real human will get back to you.
        </p>
      `,
    },
    2: {
      subject: `Getting the most from your AI services, ${safeName}`,
      preheader:
        "3 features that will help you generate more leads and reviews for your business.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Hi ${safeName},
        </p>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          You&rsquo;ve had a few days to explore Sovereign AI. Here are three
          features our most successful clients use from day one:
        </p>
        <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 16px;">
            <strong>1. Automated Review Requests</strong><br />
            Send review requests to customers automatically after each
            appointment. Businesses using this feature see 3x more reviews
            in the first month.
          </p>
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 16px;">
            <strong>2. AI Content Generation</strong><br />
            Your AI writes SEO-optimized blog posts and social media content
            tailored to ${safeBusiness}. Publish with one click or set it
            to auto-publish.
          </p>
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0;">
            <strong>3. Lead Tracking &amp; Nurturing</strong><br />
            Every lead is captured, scored, and followed up with
            automatically. Never miss a potential customer again.
          </p>
        </div>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Want to dive deeper? Our knowledge base has step-by-step guides
          for every feature.
        </p>
        ${emailButton("Explore the Knowledge Base", knowledgeBaseUrl)}
      `,
    },
    3: {
      subject: `Your first week with Sovereign AI &mdash; how did it go?`,
      preheader:
        "Check your KPI dashboard to see what your AI services achieved in week one.",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Hi ${safeName},
        </p>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          It&rsquo;s been one week since ${safeBusiness} joined
          Sovereign AI. Your AI systems have been working around the clock
          &mdash; let&rsquo;s see what they accomplished.
        </p>
        <p style="color:#333;font-size:16px;line-height:1.5;">
          Head over to your KPI dashboard to review your first-week results:
        </p>
        <ul style="color:#333;font-size:16px;line-height:1.8;">
          <li>New leads generated</li>
          <li>Review requests sent and received</li>
          <li>Content pieces published</li>
          <li>Website traffic changes</li>
        </ul>
        ${emailButton("Check Your KPI Dashboard", kpiUrl)}
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0;">
            <strong>Need help?</strong> Our support team is here for you.
            Whether you have questions about your results, want to optimize
            your setup, or need a walkthrough of any feature &mdash;
            we&rsquo;re just a click away.
          </p>
        </div>
        ${emailButton("Contact Support", supportUrl)}
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
