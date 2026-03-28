/**
 * Cold email sequence templates for home service contractor outreach.
 *
 * 5-email sequence with subject line variants for A/B testing.
 * Template variables: {{name}}, {{company}}, {{vertical}}, {{city}}, {{unsubscribeUrl}}
 *
 * CAN-SPAM compliance: all templates include a physical address and
 * unsubscribe link placeholder ({{unsubscribeUrl}}). Callers MUST
 * replace {{unsubscribeUrl}} with a valid URL before sending.
 */

const COMPANY_ADDRESS =
  process.env.COMPANY_ADDRESS ||
  "123 Main Street, Suite 100, Austin, TX 78701";

const CAN_SPAM_FOOTER = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#888;text-align:center;">
  <p>Sovereign AI | ${COMPANY_ADDRESS}</p>
  <p><a href="{{unsubscribeUrl}}" style="color:#888;text-decoration:underline;">Unsubscribe</a></p>
</div>`;

export interface ColdEmailTemplate {
  /** Sequence step number (1-5) */
  step: number;
  /** Day offset from enrollment */
  dayOffset: number;
  /** Subject line variants for A/B testing */
  subjectVariants: string[];
  /** HTML body template with personalization placeholders */
  body: string;
}

// ---------------------------------------------------------------------------
// 5-email cold sequence for home service contractors
// ---------------------------------------------------------------------------

export const COLD_SEQUENCE: ColdEmailTemplate[] = [
  // ── Email 1 (Day 0): Problem-focused ──────────────────────────
  {
    step: 1,
    dayOffset: 0,
    subjectVariants: [
      "I analyzed {{company}}'s online presence",
      "{{company}}: 3 things I noticed about your marketing",
      "Quick question about {{company}}'s lead flow",
    ],
    body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{name}},</p>

  <p>I spent a few minutes looking at {{company}}'s online presence and noticed a couple of things that might be costing you leads in {{city}}:</p>

  <ul>
    <li>Your Google Business Profile could be optimized to show up in more local searches</li>
    <li>Most {{vertical}} companies in {{city}} are getting 40-60% of their leads from sources you might be missing</li>
    <li>Your review response rate could be improved to boost rankings</li>
  </ul>

  <p>We help {{vertical}} companies automate their entire marketing stack — from review generation to lead follow-up — so owners can focus on running their business instead of chasing leads.</p>

  <p>Would it be worth a 15-minute call to show you what we found?</p>

  <p>Best,<br/>Seth<br/>Sovereign AI</p>
  ${CAN_SPAM_FOOTER}
</div>`,
  },

  // ── Email 2 (Day 3): Social proof ─────────────────────────────
  {
    step: 2,
    dayOffset: 3,
    subjectVariants: [
      "How a {{vertical}} company in {{city}} booked 2x more jobs",
      "{{city}} {{vertical}} company doubled their bookings",
      "Case study: {{vertical}} company went from 15 to 40 leads/month",
    ],
    body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{name}},</p>

  <p>I reached out a few days ago about {{company}}'s marketing.</p>

  <p>Wanted to share a quick result: a {{vertical}} company similar to yours was spending $3K/month on marketing and getting about 15 leads. After switching to our AI-powered system, they hit 40+ leads/month within 60 days — without increasing their budget.</p>

  <p>Here's what changed:</p>

  <ul>
    <li><strong>Automated review requests</strong> — went from 2 to 15+ new reviews per month</li>
    <li><strong>AI-powered lead follow-up</strong> — responded to every inquiry in under 2 minutes</li>
    <li><strong>Local SEO optimization</strong> — started ranking for 30+ keywords in {{city}}</li>
  </ul>

  <p>Happy to walk you through exactly how this would work for {{company}}. Free 15-minute strategy call — no pitch, just data.</p>

  <p>Best,<br/>Seth<br/>Sovereign AI</p>
  ${CAN_SPAM_FOOTER}
</div>`,
  },

  // ── Email 3 (Day 7): Value-add ────────────────────────────────
  {
    step: 3,
    dayOffset: 7,
    subjectVariants: [
      "3 quick wins for {{company}}",
      "Free tips: boost {{company}}'s leads this week",
      "{{name}}, here are 3 things you can do today",
    ],
    body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{name}},</p>

  <p>I know you're busy running {{company}}, so here are 3 things you can do this week to get more leads — no cost, no strings attached:</p>

  <ol>
    <li><strong>Update your Google Business Profile hours and photos.</strong> Businesses with 10+ photos get 42% more direction requests. Add recent job photos with descriptions.</li>
    <li><strong>Respond to every Google review — especially the bad ones.</strong> A professional response to a negative review actually increases trust with new customers.</li>
    <li><strong>Set up a missed-call text-back.</strong> 62% of calls to {{vertical}} companies go unanswered. An automatic text response ("Sorry I missed your call! How can I help?") captures leads you're currently losing.</li>
  </ol>

  <p>These are the same fundamentals we automate for our clients. If you'd rather have AI handle all of this 24/7, I'd love to show you how.</p>

  <p>Best,<br/>Seth<br/>Sovereign AI</p>
  ${CAN_SPAM_FOOTER}
</div>`,
  },

  // ── Email 4 (Day 14): Case study ──────────────────────────────
  {
    step: 4,
    dayOffset: 14,
    subjectVariants: [
      "From 15 to 67 leads in 30 days",
      "How we helped a {{vertical}} owner 4x their pipeline",
      "Real numbers from a {{vertical}} company like {{company}}",
    ],
    body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{name}},</p>

  <p>Quick story I thought you'd find interesting.</p>

  <p>A {{vertical}} owner in a market similar to {{city}} came to us frustrated. He was spending $4K/month across three different marketing tools, manually following up with leads, and still only closing about 15 jobs a month.</p>

  <p><strong>30 days later:</strong></p>

  <ul>
    <li>67 inbound leads (up from 15)</li>
    <li>Average response time dropped from 4 hours to 90 seconds</li>
    <li>22 new 5-star reviews</li>
    <li>Booked out 3 weeks in advance</li>
  </ul>

  <p>The difference? Everything was automated. AI handles the follow-ups, review requests, SEO, and lead routing — the owner just shows up and does the work.</p>

  <p>I'd love to map out what this could look like for {{company}}. Just reply "interested" and I'll send over some times.</p>

  <p>Best,<br/>Seth<br/>Sovereign AI</p>
  ${CAN_SPAM_FOOTER}
</div>`,
  },

  // ── Email 5 (Day 21): Breakup ─────────────────────────────────
  {
    step: 5,
    dayOffset: 21,
    subjectVariants: [
      "Last message from me",
      "Closing the loop on {{company}}",
      "Should I stop reaching out?",
    ],
    body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{name}},</p>

  <p>I've sent a few messages about helping {{company}} grow with AI-powered marketing, and I haven't heard back — which is totally fine.</p>

  <p>I don't want to be that person who keeps emailing, so this will be my last one.</p>

  <p>If the timing isn't right, no worries at all. But if you ever want to explore how {{vertical}} companies in {{city}} are using AI to automate their entire lead generation — just reply to this email. The offer stands.</p>

  <p>Wishing {{company}} continued success.</p>

  <p>Best,<br/>Seth<br/>Sovereign AI</p>
  ${CAN_SPAM_FOOTER}
</div>`,
  },
];

/**
 * Get a cold email template by sequence step number.
 */
export function getColdTemplate(step: number): ColdEmailTemplate | undefined {
  return COLD_SEQUENCE.find((t) => t.step === step);
}

/**
 * Get all cold email templates.
 */
export function getAllColdTemplates(): ColdEmailTemplate[] {
  return COLD_SEQUENCE;
}
