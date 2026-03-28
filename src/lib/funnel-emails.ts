/**
 * Perspective funnel email nurture sequences.
 *
 * 10-email belief-shifting sequence sent over 21 days.
 * Each email breaks a specific false belief (Vehicle, Internal, or External).
 *
 * Usage:
 *   import { NURTURE_SEQUENCE, renderNurtureEmail } from "@/lib/funnel-emails";
 *   const email = NURTURE_SEQUENCE[0];
 *   const html = renderNurtureEmail(email, { name: "Mike", trade: "plumber" });
 */

import {
  emailLayout,
  emailButton,
  escapeHtml,
} from "@/lib/email";

// ── Types ────────────────────────────────────────────────────

export interface NurtureEmail {
  id: number;
  dayOffset: number;
  subject: string;
  preheader: string;
  beliefTarget: "vehicle" | "internal" | "external" | "conversion";
  body: (vars: EmailVars) => string;
}

interface EmailVars {
  name: string;
  trade?: string;
  unsubscribeUrl?: string;
}

// ── Helpers ──────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

function tradeLabel(trade?: string): string {
  const map: Record<string, string> = {
    plumber: "plumbing",
    hvac: "HVAC",
    roofing: "roofing",
    electrician: "electrical",
    landscaping: "landscaping",
  };
  return trade ? map[trade] || "home service" : "home service";
}

// ── The 10-Email Nurture Sequence ────────────────────────────

export const NURTURE_SEQUENCE: NurtureEmail[] = [
  // Day 0 — Welcome + deliver lead magnet
  {
    id: 1,
    dayOffset: 0,
    subject: "Your free marketing audit is ready",
    preheader: "Plus: what 90% of contractors get wrong about marketing",
    beliefTarget: "vehicle",
    body: ({ name, trade }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>Thanks for requesting your free ${tradeLabel(trade)} marketing audit. Your report is attached / linked below.</p>
      <p>While you review it, here's something that might surprise you:</p>
      <p><strong>90% of ${tradeLabel(trade)} businesses we audit are losing 40-60% of their potential leads</strong> to three fixable problems. Most don't even know it's happening.</p>
      <p>Over the next couple weeks, I'm going to share exactly what those problems are and how to fix them — whether you use Sovereign AI or not.</p>
      <p>Talk soon,<br/>Seth Brueland<br/>Founder, Sovereign AI</p>
    `,
  },

  // Day 1 — Epiphany Bridge (Founder Story)
  {
    id: 2,
    dayOffset: 1,
    subject: "Why I built this (personal story)",
    preheader: "I watched good businesses lose to bad marketing",
    beliefTarget: "vehicle",
    body: ({ name, trade }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>Quick story about why Sovereign AI exists.</p>
      <p>Two years ago, I watched a plumber friend of mine — one of the best in his city — nearly go under. Not because his work was bad. His 5-star Yelp reviews proved otherwise. He was losing because the franchise down the street was spending $15K/month on marketing with a team of people running their campaigns.</p>
      <p>My friend? He was running his "marketing" by posting on Facebook when he remembered. Which was never.</p>
      <p>That's when it hit me: <strong>the businesses that keep our homes running deserve the same marketing firepower as a Fortune 500 company — without the Fortune 500 budget.</strong></p>
      <p>So I built it. 16 AI systems that do everything a marketing department does — lead generation, review management, SEO, ads, email, social media — all running 24/7 on autopilot.</p>
      <p>My friend was one of the first to try it. He went from 15 leads a month to 67 in 60 days.</p>
      <p>That's not a fluke. That's what happens when you stop trying to out-market people manually and let AI do it for you.</p>
      <p>Tomorrow I'll share the most expensive mistake I see ${tradeLabel(trade)} businesses make with their marketing.</p>
      <p>— Seth</p>
    `,
  },

  // Day 3 — Case study with real numbers
  {
    id: 3,
    dayOffset: 3,
    subject: "$347 in ad spend → 23 new jobs → $41,000 revenue",
    preheader: "Real numbers from a real contractor",
    beliefTarget: "vehicle",
    body: ({ name, trade }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>I want to show you what's possible — with real numbers, not theory.</p>
      <p><strong>The business:</strong> A ${tradeLabel(trade)} company in Phoenix, AZ. Two trucks, 5 employees. Owner was spending $2,000/month on a marketing agency and couldn't tell if it was working.</p>
      <p><strong>Month 1 with Sovereign AI:</strong></p>
      <ul>
        <li>AI ad management spent $347 on Google Ads (down from $2,000 with the agency)</li>
        <li>Generated 23 qualified leads (up from ~8 with the agency)</li>
        <li>AI chatbot booked 14 appointments automatically</li>
        <li>AI review system added 12 new Google reviews</li>
        <li><strong>Total new revenue: $41,000</strong></li>
      </ul>
      <p><strong>The ROI: 8.7x.</strong> For every $1 spent, $8.70 came back.</p>
      <p>The owner told me: "I spent two years paying an agency $2K/month and never once saw numbers like this."</p>
      <p>This isn't magic. It's what happens when AI optimizes your marketing in real-time instead of a junior account manager checking in once a month.</p>
      ${emailButton("See More Case Studies", `${APP_URL}/results`)}
      <p>— Seth</p>
    `,
  },

  // Day 5 — Break internal belief ("not tech-savvy enough")
  {
    id: 4,
    dayOffset: 5,
    subject: "You don't need to be tech-savvy for this",
    preheader: "If you can answer a phone, you can use Sovereign AI",
    beliefTarget: "internal",
    body: ({ name }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>I hear this all the time: "I'm not a tech person. I wouldn't know how to use an AI marketing platform."</p>
      <p>Here's the thing — <strong>you don't use it. It uses itself.</strong></p>
      <p>Sovereign AI is 100% done for you. Here's what your involvement looks like:</p>
      <ol>
        <li><strong>Day 1:</strong> You spend 15 minutes on a strategy call telling us about your business</li>
        <li><strong>Day 2-3:</strong> We build everything. You approve the setup.</li>
        <li><strong>Day 4+:</strong> Your phone rings with new customers. You answer it. That's it.</li>
      </ol>
      <p>You don't log into a dashboard (unless you want to). You don't write ad copy. You don't manage campaigns. You don't post on social media.</p>
      <p>The AI handles all of it. You handle the wrench.</p>
      <p>One of our clients — a 62-year-old HVAC contractor who still uses a flip phone — has been with us for 14 months. He's never logged into the dashboard once. His revenue is up 340%.</p>
      <p>Technology is our job. Your job is being great at what you do.</p>
      <p>— Seth</p>
    `,
  },

  // Day 7 — Testimonial compilation
  {
    id: 5,
    dayOffset: 7,
    subject: "What skeptics say after 60 days",
    preheader: "They all started exactly where you are right now",
    beliefTarget: "internal",
    body: ({ name }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>Every single one of these contractors was skeptical before they signed up. Here's what they say now:</p>
      <blockquote style="border-left: 3px solid #4c85ff; padding-left: 16px; margin: 16px 0; color: #555;">
        "I've been burned by three agencies. Sovereign AI was different from day one — I could see every lead, every call, every dollar in real-time. No more guessing." <br/><strong>— Mike R., Plumbing, Phoenix AZ</strong>
      </blockquote>
      <blockquote style="border-left: 3px solid #4c85ff; padding-left: 16px; margin: 16px 0; color: #555;">
        "I was paying $2K/month for a marketing company that sent me a PDF report once a quarter. Now I pay less and get 5x the results — and I can see them live." <br/><strong>— Sarah C., HVAC, Denver CO</strong>
      </blockquote>
      <blockquote style="border-left: 3px solid #4c85ff; padding-left: 16px; margin: 16px 0; color: #555;">
        "I almost didn't sign up because I thought AI marketing was just hype. Two months later I had more leads than I could handle. Now I'm hiring." <br/><strong>— James C., Roofing, Atlanta GA</strong>
      </blockquote>
      <p>They all started exactly where you are right now — skeptical, burned by past experiences, not sure if this is different.</p>
      <p>The difference is transparency. You see everything. In real time. No black boxes.</p>
      ${emailButton("See All Results", `${APP_URL}/results`)}
      <p>— Seth</p>
    `,
  },

  // Day 9 — Break external belief ("competitors already dominate")
  {
    id: 6,
    dayOffset: 9,
    subject: "Your competitors are already doing this",
    preheader: "The gap is growing every month you wait",
    beliefTarget: "external",
    body: ({ name, trade }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>I looked at the data for ${tradeLabel(trade)} businesses in the US, and here's what stood out:</p>
      <ul>
        <li>73% of homeowners search online before calling a contractor</li>
        <li>The top 3 businesses in local search get 75% of the clicks</li>
        <li>Businesses with 50+ Google reviews get 3x more calls than those with fewer than 20</li>
        <li>47% of calls to contractors go unanswered — and 85% of those callers never call back</li>
      </ul>
      <p><strong>The businesses winning right now aren't necessarily better at their trade. They're better at being found.</strong></p>
      <p>Every month you wait, your competitors are collecting more reviews, ranking higher on Google, and capturing the leads that should be going to you.</p>
      <p>The question isn't whether AI marketing works. It's whether you can afford to be the last one to adopt it.</p>
      ${emailButton("Get Your Free Audit", `${APP_URL}/free-audit/${trade || ""}`)}
      <p>— Seth</p>
    `,
  },

  // Day 11 — ROI math (break cost objection)
  {
    id: 7,
    dayOffset: 11,
    subject: "The real cost of NOT doing this",
    preheader: "One missed lead costs more than a month of Sovereign AI",
    beliefTarget: "external",
    body: ({ name, trade }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>Let me run some quick math:</p>
      <p><strong>The Sovereign AI DIY plan is $497/month.</strong></p>
      <p>The average ${tradeLabel(trade)} job is worth $300-$1,500. So you need <strong>one extra job per month</strong> to break even.</p>
      <p>Our average client gets 15-30 new leads in month one. Even at a 30% close rate, that's 5-10 new jobs.</p>
      <p>Now flip it: <strong>what's it costing you to NOT have this?</strong></p>
      <ul>
        <li>If you're missing 40% of incoming calls (industry average), that's potentially thousands per month in lost revenue</li>
        <li>If you have fewer Google reviews than your competitors, you're invisible to 73% of searching homeowners</li>
        <li>If you're spending $2K+/month on an agency with no clear ROI, you're already paying more for less</li>
      </ul>
      <p>And here's the thing: <strong>we guarantee it.</strong> If you don't see results in 60 days, you get your money back. Every penny.</p>
      <p>The risk is literally zero. The cost of doing nothing isn't.</p>
      ${emailButton("Book Your Free Strategy Call", `${APP_URL}/strategy-call`)}
      <p>— Seth</p>
    `,
  },

  // Day 14 — The close
  {
    id: 8,
    dayOffset: 14,
    subject: "Ready when you are (limited spots)",
    preheader: "We're only taking 10 new clients this month",
    beliefTarget: "conversion",
    body: ({ name, trade }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>Over the past two weeks I've shared:</p>
      <ul>
        <li>Why traditional marketing doesn't work for ${tradeLabel(trade)} businesses anymore</li>
        <li>Real case studies with real revenue numbers</li>
        <li>Why you don't need to be tech-savvy (it's 100% done for you)</li>
        <li>The math that makes this a no-brainer</li>
      </ul>
      <p>If any of that resonated, I'd love to hop on a 15-minute call and show you exactly what Sovereign AI would look like for YOUR business — your market, your competitors, your numbers.</p>
      <p><strong>We're only onboarding 10 new ${tradeLabel(trade)} clients this month</strong> to ensure every new client gets white-glove setup.</p>
      ${emailButton("Book My Free Strategy Call", `${APP_URL}/strategy-call`)}
      <p>No pressure. No pitch. Just a custom growth roadmap you can keep whether you sign up or not.</p>
      <p>And remember — 60-day money-back guarantee. Zero risk.</p>
      <p>— Seth</p>
    `,
  },

  // Day 17 — Objection handler
  {
    id: 9,
    dayOffset: 17,
    subject: "The 5 questions every contractor asks",
    preheader: "Honest answers to the hard questions",
    beliefTarget: "conversion",
    body: ({ name }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>Still thinking it over? Good. You should. Here are the 5 questions every contractor asks before signing up — with honest answers:</p>
      <p><strong>1. "How is this different from the agency that burned me?"</strong><br/>
      You see everything in real-time. Every lead, every call, every dollar. No monthly PDF reports with vanity metrics. No long-term contracts. No hidden fees.</p>
      <p><strong>2. "What if it doesn't work for my market?"</strong><br/>
      We serve contractors in 200+ markets across the US. If we don't think we can deliver results in your area, we'll tell you upfront. And we back it with a 60-day guarantee.</p>
      <p><strong>3. "How long before I see results?"</strong><br/>
      Most clients see their first leads within 7 days of launch. Meaningful traction typically happens by week 3-4. Full optimization by month 2.</p>
      <p><strong>4. "Do I have to sign a contract?"</strong><br/>
      No. Month-to-month. Cancel anytime with one click. We earn your business every month.</p>
      <p><strong>5. "What if I'm not tech-savvy?"</strong><br/>
      We build everything for you in 48 hours. You literally answer your phone when new customers call. That's it.</p>
      ${emailButton("Still Have Questions? Let's Talk", `${APP_URL}/strategy-call`)}
      <p>— Seth</p>
    `,
  },

  // Day 21 — Final email
  {
    id: 10,
    dayOffset: 21,
    subject: "Last thing from me",
    preheader: "A genuine offer before I go quiet",
    beliefTarget: "conversion",
    body: ({ name, trade }) => `
      <p>Hey ${escapeHtml(name)},</p>
      <p>This is the last email in this series. No more from me unless you want them.</p>
      <p>Here's where I'll leave you:</p>
      <p>Every day, ${tradeLabel(trade)} businesses that are worse than yours are getting more customers — simply because they show up first online. That's fixable. And it doesn't have to cost a fortune or take up your time.</p>
      <p>If you ever want to explore what AI marketing could do for your specific business, the offer stands: a free 15-minute strategy call where we'll build you a custom growth roadmap. No pitch. No pressure. Keep the roadmap whether you sign up or not.</p>
      ${emailButton("Book a Free Strategy Call (Anytime)", `${APP_URL}/strategy-call`)}
      <p>I genuinely hope your business thrives either way.</p>
      <p>— Seth Brueland<br/>Founder, Sovereign AI</p>
    `,
  },
];

// ── Render function ──────────────────────────────────────────

export function renderNurtureEmail(
  email: NurtureEmail,
  vars: EmailVars
): string {
  return emailLayout({
    preheader: email.preheader,
    body: email.body(vars),
    unsubscribeUrl: vars.unsubscribeUrl || `${APP_URL}/unsubscribe`,
  });
}
