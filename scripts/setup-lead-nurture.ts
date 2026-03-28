/**
 * Sovereign AI — Lead Nurture Drip Campaign Setup Script
 *
 * Creates a 7-email inbound lead nurture sequence for prospects who sign up
 * via the Sovereign AI website (chatbot, free audit, strategy call form, etc.).
 *
 * Sequence overview:
 *   Day  0 — Welcome + what Sovereign AI can do for your business (immediate)
 *   Day  1 — Social proof: contractor case study (3x more leads)
 *   Day  3 — Pain point: missed calls this week?
 *   Day  5 — Feature deep dive: AI voice agent demo video CTA
 *   Day  7 — ROI calculator: see your potential revenue increase
 *   Day 10 — Objection handling: why contractors hesitate
 *   Day 14 — Urgency: your competitors are already using AI
 *
 * Usage: npx tsx scripts/setup-lead-nurture.ts
 */

import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const CALENDLY_LINK = "https://calendly.com/bruelandbusiness/30min";
const FROM_NAME = "Seth Brueland";
const SOVEREIGN_AI_SITE = "https://www.trysovereignai.com";
const ADMIN_EMAIL = "seth@trysovereignai.com";

// CAN-SPAM unsubscribe footer — injected into every email
const CAN_SPAM_FOOTER = `
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;line-height:1.6;">
  <p>
    You're receiving this email because you signed up via <a href="${SOVEREIGN_AI_SITE}" style="color:#9ca3af;">trysovereignai.com</a>.
    Sovereign AI · Minneapolis, MN<br>
    <a href="${SOVEREIGN_AI_SITE}/unsubscribe?email={{email}}&token={{unsubscribeToken}}" style="color:#9ca3af;">Unsubscribe</a>
    &nbsp;·&nbsp;
    <a href="${SOVEREIGN_AI_SITE}/privacy" style="color:#9ca3af;">Privacy Policy</a>
  </p>
</div>`;

// Shared HTML wrapper — keeps branding consistent across all emails
function wrapEmail(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sovereign AI</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px 48px;max-width:600px;">
          <tr>
            <td>
              <!-- Header -->
              <div style="margin-bottom:32px;">
                <a href="${SOVEREIGN_AI_SITE}" style="text-decoration:none;">
                  <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
                    Sovereign<span style="color:#2563eb;">AI</span>
                  </span>
                </a>
              </div>
              <!-- Body -->
              <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#374151;">
                ${innerHtml}
              </div>
              ${CAN_SPAM_FOOTER}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── EMAIL TEMPLATES ────────────────────────────────────────────────────────────

// ── Email 1 — Day 0: Welcome ──────────────────────────────────────────────────

const EMAIL_1_SUBJECT = "Welcome to Sovereign AI, {{name}} — here's what happens next";

const EMAIL_1_BODY = wrapEmail(`
<p>Hey {{name}},</p>

<p>Welcome — and thanks for reaching out. You just took the first step toward
turning your {{vertical}} business into a 24/7 lead-capturing machine.</p>

<p>Here's a quick overview of what Sovereign AI does for contractors like you:</p>

<ul style="padding-left:20px;">
  <li style="margin-bottom:8px;"><strong>AI Voice Agent</strong> — answers every call instantly, 24/7, books appointments on the spot, and sounds completely human.</li>
  <li style="margin-bottom:8px;"><strong>Automated Follow-Up</strong> — every new lead gets an immediate text and email. No more leads going cold because nobody followed up in time.</li>
  <li style="margin-bottom:8px;"><strong>Review Management</strong> — automatically requests 5-star reviews after every job so you dominate local search results.</li>
  <li style="margin-bottom:8px;"><strong>Email &amp; SMS Campaigns</strong> — stay top-of-mind with past customers so they call you first when they need work done again.</li>
  <li style="margin-bottom:8px;"><strong>SEO &amp; Content</strong> — monthly blog posts and keyword tracking that move you up on Google — hands-free.</li>
</ul>

<p>Most {{vertical}} companies that come to us are already spending money on ads and
getting calls. The problem is they're missing 30–40% of them. We fix that —
and everything else that should be happening automatically but isn't.</p>

<p>I'd love to walk you through exactly how this looks for <strong>{{company}}</strong>
specifically. It takes about 15 minutes.</p>

<p style="margin-top:28px;">
  <a href="${CALENDLY_LINK}"
     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    Book Your Free Strategy Call
  </a>
</p>

<p style="margin-top:28px;">Talk soon,<br>
<strong>${FROM_NAME}</strong><br>
Founder, <a href="${SOVEREIGN_AI_SITE}" style="color:#2563eb;">Sovereign AI</a><br>
Built for Contractors. Built to Win.</p>
`);

// ── Email 2 — Day 1: Social Proof ────────────────────────────────────────────

const EMAIL_2_SUBJECT = "How one {{vertical}} contractor went from 20 leads/month to 60+";

const EMAIL_2_BODY = wrapEmail(`
<p>Hey {{name}},</p>

<p>I wanted to share a quick story — because it's probably pretty close to
where <strong>{{company}}</strong> is right now.</p>

<p>A {{vertical}} contractor came to us last year. Solid crew, great reputation,
spending about $2,500/month on Google Ads. The numbers looked fine on the
surface — until we audited the backend.</p>

<p><strong>Here's what we found:</strong></p>

<ul style="padding-left:20px;">
  <li style="margin-bottom:8px;">38% of inbound calls went unanswered (mostly after 5 PM and on weekends)</li>
  <li style="margin-bottom:8px;">Zero automated follow-up on web form leads</li>
  <li style="margin-bottom:8px;">Average response time to new leads: 6+ hours</li>
  <li style="margin-bottom:8px;">2–3 new Google reviews per month (competitor had 300+)</li>
</ul>

<p>We plugged in Sovereign AI. Here's what happened in the first 60 days:</p>

<table style="width:100%;border-collapse:collapse;margin:24px 0;">
  <tr style="background:#eff6ff;">
    <td style="padding:10px 14px;font-weight:bold;color:#1e40af;border:1px solid #bfdbfe;">Metric</td>
    <td style="padding:10px 14px;font-weight:bold;color:#1e40af;border:1px solid #bfdbfe;">Before</td>
    <td style="padding:10px 14px;font-weight:bold;color:#1e40af;border:1px solid #bfdbfe;">After 60 Days</td>
  </tr>
  <tr>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">Calls answered</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">62%</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#16a34a;font-weight:bold;">100%</td>
  </tr>
  <tr style="background:#f9fafb;">
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">Booked jobs / month</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">21</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#16a34a;font-weight:bold;">64</td>
  </tr>
  <tr>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">New Google reviews / month</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">2–3</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#16a34a;font-weight:bold;">22</td>
  </tr>
  <tr style="background:#f9fafb;">
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">Added revenue / month</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;">—</td>
    <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#16a34a;font-weight:bold;">+$17,400</td>
  </tr>
</table>

<p><em>Same ad spend. Same crew. Just stopped letting leads slip through the cracks.</em></p>

<p>{{name}}, I'd love to do a quick audit on <strong>{{company}}</strong> and show you
exactly where your own leaks are. No commitment, just data.</p>

<p style="margin-top:28px;">
  <a href="${CALENDLY_LINK}"
     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    See the Numbers for {{company}}
  </a>
</p>

<p style="margin-top:28px;">— ${FROM_NAME}</p>

<p style="font-size:13px;color:#6b7280;font-style:italic;">
  P.S. This contractor is now our biggest referral source — they've sent us
  four other {{vertical}} owners in their area. Results like this tend to travel fast.
</p>
`);

// ── Email 3 — Day 3: Pain Point ───────────────────────────────────────────────

const EMAIL_3_SUBJECT = "{{name}}, how many calls did {{company}} miss this week?";

const EMAIL_3_BODY = wrapEmail(`
<p>Hey {{name}},</p>

<p>Honest question: do you actually know how many calls {{company}} missed
this week?</p>

<p>Most {{vertical}} owners don't. And that's not a knock — you're busy running
jobs, managing the crew, quoting work. Tracking every missed call isn't
realistic when you're in the field.</p>

<p>But here's the math that keeps contractors up at night:</p>

<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;margin:24px 0;border-radius:0 6px 6px 0;">
  <p style="margin:0;font-size:16px;font-weight:bold;color:#dc2626;">
    If {{company}} misses just 5 calls per week, and your average job is worth $850…
  </p>
  <p style="margin:8px 0 0;font-size:22px;font-weight:bold;color:#111827;">
    That's $17,000–$22,000 in lost revenue every single month.
  </p>
  <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">
    (Based on 50% close rate on answered calls — industry average for {{vertical}})
  </p>
</div>

<p>The worst part? You're already paying for those leads. Every missed call is
money you spent on ads or SEO that went straight into a competitor's pocket.</p>

<p><strong>Here's what Sovereign AI does about it:</strong></p>

<p>Our AI voice agent picks up every single call — whether it's 2 PM on a Tuesday
or 9 PM on a Saturday. It introduces itself as part of the {{company}} team,
asks the right qualifying questions, checks your schedule, and books the
appointment right there on the call.</p>

<p>When a homeowner calls and hears a professional, responsive voice instead of
voicemail, they <em>stay</em>. And that call turns into a job instead of a Google
search for your competitor.</p>

<p style="margin-top:28px;">
  <a href="${CALENDLY_LINK}"
     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    Stop the Leak — Book a Demo
  </a>
</p>

<p style="margin-top:28px;">— ${FROM_NAME}<br>
<a href="${SOVEREIGN_AI_SITE}" style="color:#2563eb;">Sovereign AI</a></p>
`);

// ── Email 4 — Day 5: Feature Deep Dive (AI Voice Agent) ──────────────────────

const EMAIL_4_SUBJECT = "Hear the AI answer a call as {{company}} (30-second demo)";

const EMAIL_4_BODY = wrapEmail(`
<p>Hey {{name}},</p>

<p>Words only go so far. I want you to actually <em>hear</em> what this sounds like.</p>

<p>Below is a 30-second clip of our AI voice agent handling an inbound call for
a {{vertical}} company — same setup you'd get:</p>

<!-- Video CTA block -->
<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
  <p style="margin:0 0 4px;font-size:13px;color:#0369a1;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">
    Live Demo
  </p>
  <p style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#0c4a6e;">
    AI Voice Agent — Real Inbound Call
  </p>
  <p style="margin:0 0 20px;font-size:14px;color:#374151;">
    Watch the AI handle scheduling, answer service questions,<br>and book an appointment — without a human on the line.
  </p>
  <a href="${SOVEREIGN_AI_SITE}/demo/voice-agent"
     style="display:inline-block;background:#0ea5e9;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    ▶ Watch the Demo (2 min)
  </a>
</div>

<p>A few things worth noting about what you'll see:</p>

<ul style="padding-left:20px;">
  <li style="margin-bottom:8px;">The AI knows the company's services, pricing range, and service area</li>
  <li style="margin-bottom:8px;">It handles objections and questions naturally — no awkward pauses</li>
  <li style="margin-bottom:8px;">It checks availability in real-time and books the appointment</li>
  <li style="margin-bottom:8px;">It sends the customer a confirmation text automatically</li>
  <li style="margin-bottom:8px;">The whole call is logged and transcribed in the dashboard</li>
</ul>

<p>We'd set this up with <strong>{{company}}'s</strong> name, services, and
availability — so when a homeowner calls after hours, it's completely seamless
for them. They don't know (or care) whether a person or AI answered. They just
got their appointment booked.</p>

<p>Want to hear it answer using <em>your</em> company name and services? I can set up
a live demo call in under 10 minutes during our strategy call.</p>

<p style="margin-top:28px;">
  <a href="${CALENDLY_LINK}"
     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    Schedule a Live Voice Demo
  </a>
</p>

<p style="margin-top:28px;">— ${FROM_NAME}</p>

<p style="font-size:13px;color:#6b7280;font-style:italic;">
  P.S. We can also show you the full dashboard — every call logged, transcribed,
  and linked to a booked appointment. Most owners find this part almost
  embarrassing to look at (in a good way).
</p>
`);

// ── Email 5 — Day 7: ROI Calculator ──────────────────────────────────────────

const EMAIL_5_SUBJECT = "{{name}}, what's a missed call actually costing {{company}}?";

const EMAIL_5_BODY = wrapEmail(`
<p>Hey {{name}},</p>

<p>I built a quick ROI calculator specifically for {{vertical}} businesses.
Plug in your numbers and see what your revenue could look like with
zero missed calls and fully automated follow-up.</p>

<!-- ROI Calculator CTA -->
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
  <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">
    Free Tool
  </p>
  <p style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#14532d;">
    {{vertical}} Revenue Leak Calculator
  </p>
  <p style="margin:0 0 20px;font-size:14px;color:#374151;">
    Enter your weekly calls, average job value, and current close rate.<br>
    See exactly how much revenue you're leaving on the table — and what's recoverable.
  </p>
  <a href="${SOVEREIGN_AI_SITE}/roi-calculator?vertical={{vertical}}&company={{company}}"
     style="display:inline-block;background:#16a34a;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    Calculate My Revenue Opportunity →
  </a>
</div>

<p>Here's the baseline most {{vertical}} companies land on when they run it:</p>

<ul style="padding-left:20px;">
  <li style="margin-bottom:8px;"><strong>Missed call rate:</strong> 32% (industry average)</li>
  <li style="margin-bottom:8px;"><strong>Recoverable jobs per month:</strong> 12–20 (for a typical owner-operator)</li>
  <li style="margin-bottom:8px;"><strong>Monthly revenue recovered:</strong> $9,600–$18,000</li>
  <li style="margin-bottom:8px;"><strong>Annual impact:</strong> $115,000–$216,000</li>
</ul>

<p>Those aren't projections or hypotheticals. They're what we see from clients
in the first 90 days, consistently.</p>

<p>After you run the calculator, if the numbers make sense for {{company}}, let's
talk about how to capture that revenue — starting this month.</p>

<p style="margin-top:28px;">
  <a href="${CALENDLY_LINK}"
     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    Book a Call — Bring Your Numbers
  </a>
</p>

<p style="margin-top:28px;">— ${FROM_NAME}<br>
<a href="${SOVEREIGN_AI_SITE}" style="color:#2563eb;">Sovereign AI</a></p>
`);

// ── Email 6 — Day 10: Objection Handling ─────────────────────────────────────

const EMAIL_6_SUBJECT = "Why {{vertical}} contractors hesitate on AI (and why they shouldn't)";

const EMAIL_6_BODY = wrapEmail(`
<p>Hey {{name}},</p>

<p>I talk to {{vertical}} owners every day. When someone doesn't pull the trigger
on Sovereign AI, it's almost always one of the same four reasons. I want to
address them directly — because most of them aren't what they seem.</p>

<h3 style="color:#111827;font-size:17px;margin-top:28px;">"My customers want to talk to a real person."</h3>
<p>Fair — and that's exactly what they get. Our AI sounds indistinguishable from
a human receptionist. We've had clients tell us a customer called back to
compliment their "new hire." Customers don't want to wait on hold or leave
voicemail. They want someone (or something) that picks up and books them.</p>

<h3 style="color:#111827;font-size:17px;margin-top:28px;">"I already have someone who handles our calls."</h3>
<p>Great — that person now has a 24/7 backup that handles overflow, evenings,
and weekends. No more missed calls when they're busy on another line. And
Sovereign AI doesn't take sick days, require benefits, or need training.</p>

<h3 style="color:#111827;font-size:17px;margin-top:28px;">"It's probably too expensive for where we are right now."</h3>
<p>The math almost always flips this. Most of our clients recover the cost of
Sovereign AI within the first 7–10 days — from leads they were already
paying for. After that, it's net-new revenue every month. If the ROI
calculator didn't convince you, let me walk you through {{company}}'s
specific numbers on a call.</p>

<h3 style="color:#111827;font-size:17px;margin-top:28px;">"I don't have time to learn a new system."</h3>
<p>We handle the entire setup. White-glove onboarding, we configure everything
to match your services and schedule, test it, and hand you a dashboard.
Most clients are live in under a week. After that, you log in when you want
to check in — the system runs itself.</p>

<p style="margin-top:28px;">{{name}}, what's holding <strong>{{company}}</strong> back?
I'd love to answer whatever question is sitting in the back of your mind.
No pitch — just a straight conversation.</p>

<p style="margin-top:28px;">
  <a href="${CALENDLY_LINK}"
     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    Let's Talk — 15 Minutes, No Pressure
  </a>
</p>

<p style="margin-top:28px;">— ${FROM_NAME}</p>

<p style="font-size:13px;color:#6b7280;font-style:italic;">
  P.S. If there's a specific concern I haven't addressed, just reply to this
  email. I read every response personally.
</p>
`);

// ── Email 7 — Day 14: Urgency ─────────────────────────────────────────────────

const EMAIL_7_SUBJECT = "{{name}}, your competitors are already using AI — here's what that means for {{company}}";

const EMAIL_7_BODY = wrapEmail(`
<p>Hey {{name}},</p>

<p>Last email from me — I promise.</p>

<p>But before I close out your file, I want to share something I'm seeing
on the ground in the {{vertical}} market that I think matters for {{company}}.</p>

<p>We're now working with {{vertical}} companies in markets across the Midwest.
In several of those markets, one or two contractors who adopted AI-powered
lead capture early have started to pull significantly ahead of the pack.</p>

<p>Not because they're better at the work. Not because they're spending more
on ads. Because they answer every call. Follow up with every lead within
minutes. And show up at the top of Google with 200+ reviews while
competitors sit at 30.</p>

<div style="background:#fefce8;border-left:4px solid #eab308;padding:16px 20px;margin:24px 0;border-radius:0 6px 6px 0;">
  <p style="margin:0;font-weight:bold;color:#713f12;font-size:16px;">
    The window to be the first mover in your market is closing.
  </p>
  <p style="margin:8px 0 0;color:#374151;">
    We limit the number of {{vertical}} companies we work with per city to
    protect exclusivity. Once we have a client in your zip code, we
    can't take on a direct competitor.
  </p>
</div>

<p>{{name}}, I've genuinely enjoyed the back-and-forth over the past couple of
weeks. If the timing isn't right, no hard feelings — you can always come back
to this email when it is.</p>

<p>But if you've been on the fence, now's the time. One phone call is all it
takes to find out whether <strong>{{company}}</strong> qualifies for our current
availability in your market.</p>

<p style="margin-top:28px;">
  <a href="${CALENDLY_LINK}"
     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
            border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
    Claim Your Spot — Book a Call Today
  </a>
</p>

<p style="margin-top:28px;">Wishing you and {{company}} nothing but growth,</p>

<p><strong>${FROM_NAME}</strong><br>
Founder, <a href="${SOVEREIGN_AI_SITE}" style="color:#2563eb;">Sovereign AI</a></p>

<p style="font-size:13px;color:#6b7280;font-style:italic;">
  P.S. Even if now isn't the right time, bookmark
  <a href="${SOVEREIGN_AI_SITE}/roi-calculator" style="color:#6b7280;">our ROI calculator</a>
  — it's free and takes 60 seconds. At a minimum, you'll know exactly
  what the numbers look like for {{company}}.
</p>
`);

// ── SEQUENCE DEFINITION ────────────────────────────────────────────────────────

interface NurtureEmail {
  name: string;
  subject: string;
  body: string;
  type: "drip";
  dayOffset: number;
  sequenceStep: number;
  templateKey: string;
}

const NURTURE_EMAILS: NurtureEmail[] = [
  {
    name: "Lead Nurture — Email 1 (Welcome)",
    subject: EMAIL_1_SUBJECT,
    body: EMAIL_1_BODY,
    type: "drip",
    dayOffset: 0,
    sequenceStep: 1,
    templateKey: "nurture-welcome",
  },
  {
    name: "Lead Nurture — Email 2 (Social Proof)",
    subject: EMAIL_2_SUBJECT,
    body: EMAIL_2_BODY,
    type: "drip",
    dayOffset: 1,
    sequenceStep: 2,
    templateKey: "nurture-social-proof",
  },
  {
    name: "Lead Nurture — Email 3 (Pain Point: Missed Calls)",
    subject: EMAIL_3_SUBJECT,
    body: EMAIL_3_BODY,
    type: "drip",
    dayOffset: 3,
    sequenceStep: 3,
    templateKey: "nurture-pain-point",
  },
  {
    name: "Lead Nurture — Email 4 (Feature: AI Voice Agent)",
    subject: EMAIL_4_SUBJECT,
    body: EMAIL_4_BODY,
    type: "drip",
    dayOffset: 5,
    sequenceStep: 4,
    templateKey: "nurture-voice-agent-demo",
  },
  {
    name: "Lead Nurture — Email 5 (ROI Calculator)",
    subject: EMAIL_5_SUBJECT,
    body: EMAIL_5_BODY,
    type: "drip",
    dayOffset: 7,
    sequenceStep: 5,
    templateKey: "nurture-roi-calculator",
  },
  {
    name: "Lead Nurture — Email 6 (Objection Handling)",
    subject: EMAIL_6_SUBJECT,
    body: EMAIL_6_BODY,
    type: "drip",
    dayOffset: 10,
    sequenceStep: 6,
    templateKey: "nurture-objections",
  },
  {
    name: "Lead Nurture — Email 7 (Urgency / Competitors)",
    subject: EMAIL_7_SUBJECT,
    body: EMAIL_7_BODY,
    type: "drip",
    dayOffset: 14,
    sequenceStep: 7,
    templateKey: "nurture-urgency",
  },
];

// ── MAIN SETUP ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 SOVEREIGN AI — LEAD NURTURE DRIP CAMPAIGN SETUP\n");
  console.log("=".repeat(60));
  console.log("Sequence: 7 emails over 14 days for inbound website leads");
  console.log("Sources:  chatbot · free audit · strategy call form · signup");
  console.log("=".repeat(60));

  // ── STEP 1: Resolve admin account ────────────────────────────────────────
  console.log("\n📋 Step 1: Resolving admin account...");

  const adminAccount = await prisma.account.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!adminAccount) {
    throw new Error(
      `Admin account not found for ${ADMIN_EMAIL}. ` +
        "Run scripts/setup-autonomous.ts first to create the account.",
    );
  }

  console.log(`   ✅ Admin account found: ${adminAccount.id}`);

  // ── STEP 2: Resolve client record ────────────────────────────────────────
  console.log("\n📋 Step 2: Resolving Sovereign AI client record...");

  const client = await prisma.client.findUnique({
    where: { accountId: adminAccount.id },
  });

  if (!client) {
    throw new Error(
      "Client record not found. " +
        "Run scripts/setup-autonomous.ts first to create the client.",
    );
  }

  console.log(`   ✅ Client record found: ${client.id} (${client.businessName})`);

  // ── STEP 3: Create EmailCampaign records ─────────────────────────────────
  console.log("\n📋 Step 3: Creating EmailCampaign records...");

  const createdCampaigns: Array<{ id: string; name: string; templateKey: string }> = [];

  for (const email of NURTURE_EMAILS) {
    const existing = await prisma.emailCampaign.findFirst({
      where: { clientId: client.id, name: email.name },
    });

    if (existing) {
      createdCampaigns.push({
        id: existing.id,
        name: existing.name,
        templateKey: email.templateKey,
      });
      console.log(`   ⏭️  Already exists: ${email.name}`);
      continue;
    }

    const created = await prisma.emailCampaign.create({
      data: {
        clientId: client.id,
        name: email.name,
        subject: email.subject,
        body: email.body,
        type: email.type,
        status: "active",
      },
    });

    createdCampaigns.push({
      id: created.id,
      name: created.name,
      templateKey: email.templateKey,
    });
    console.log(`   ✅ Created: ${email.name} (${created.id})`);
  }

  console.log(
    `\n   📊 ${createdCampaigns.length} EmailCampaign records ready`,
  );

  // ── STEP 4: Create FollowUpSequence ──────────────────────────────────────
  console.log("\n📋 Step 4: Creating FollowUpSequence (inbound lead nurture)...");

  const SEQUENCE_NAME = "Inbound Lead Nurture — Website Signups";

  const existingSequence = await prisma.followUpSequence.findFirst({
    where: { clientId: client.id, name: SEQUENCE_NAME },
  });

  // Build steps JSON for the FollowUpSequence — one step per nurture email.
  // dayOffset values are relative to the PREVIOUS step (delta), not from
  // enrollment day, because advanceEntry in lib/followup/index.ts schedules
  // nextStepAt = now + nextStepConfig.dayOffset days.
  //
  // Absolute schedule:
  //   Email 1: Day  0  (immediate)
  //   Email 2: Day  1  (delta: +1)
  //   Email 3: Day  3  (delta: +2)
  //   Email 4: Day  5  (delta: +2)
  //   Email 5: Day  7  (delta: +2)
  //   Email 6: Day 10  (delta: +3)
  //   Email 7: Day 14  (delta: +4)
  const sequenceSteps = NURTURE_EMAILS.map((email, index) => {
    const prevOffset = index === 0 ? 0 : NURTURE_EMAILS[index - 1].dayOffset;
    const delta = email.dayOffset - prevOffset;
    return {
      dayOffset: delta,
      channel: "email",
      escalation: false, // pure nurture — no escalation to SMS/voice
      templateKey: email.templateKey,
    };
  });

  let sequence;
  if (existingSequence) {
    sequence = existingSequence;
    console.log(`   ⏭️  Sequence already exists: ${sequence.id}`);
  } else {
    sequence = await prisma.followUpSequence.create({
      data: {
        clientId: client.id,
        name: SEQUENCE_NAME,
        triggerType: "lead_captured",
        isActive: true,
        steps: JSON.stringify(sequenceSteps),
      },
    });
    console.log(`   ✅ Created FollowUpSequence: ${sequence.id}`);
  }

  // ── STEP 5: Print summary ─────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("✅ LEAD NURTURE DRIP CAMPAIGN READY\n");

  console.log("Sequence ID (use this to enroll new leads):");
  console.log(`   ${sequence.id}\n`);

  console.log("7-Email Schedule:");
  NURTURE_EMAILS.forEach((email) => {
    const dayLabel = email.dayOffset === 0 ? "Day  0 (immediate)" : `Day ${String(email.dayOffset).padStart(2, " ")}`;
    console.log(`   ${dayLabel} — ${email.name}`);
  });

  console.log("\nHow new leads get enrolled:");
  console.log("   1. Lead submits chatbot / free audit / strategy call form");
  console.log("   2. API route calls enrollInFollowUp({ clientId, sequenceId, ... })");
  console.log(`   3. sequenceId = "${sequence.id}"`);
  console.log("   4. cron/followup-process runs every 15 min and sends due emails");

  console.log("\nEmailCampaign IDs created:");
  createdCampaigns.forEach((c) => {
    console.log(`   ${c.templateKey}: ${c.id}`);
  });

  console.log("\nPersonalization tokens supported in every email:");
  console.log("   {{name}}    — lead's first name");
  console.log("   {{company}} — lead's business name");
  console.log("   {{vertical}} — lead's trade (HVAC, Plumbing, Roofing, etc.)");
  console.log("   {{email}}   — lead's email address (used in unsubscribe link)");
  console.log("   {{unsubscribeToken}} — CAN-SPAM unsubscribe token");

  console.log("\nCAN-SPAM compliance:");
  console.log("   ✅ Physical address in footer (Minneapolis, MN)");
  console.log("   ✅ Unsubscribe link in every email");
  console.log("   ✅ Clear sender identification (Seth Brueland / Sovereign AI)");
  console.log("   ✅ Non-deceptive subject lines");

  console.log("\n" + "=".repeat(60));
}

main()
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
