// ---------------------------------------------------------------------------
// Sales Scripts — Discovery Call & Loom Video scripts with dynamic interpolation
// ---------------------------------------------------------------------------

export interface DiscoveryCallContext {
  firstName: string;
  companyName: string;
  vertical: string;
  city: string;
  serviceType: string;
  avgJobValue: number;
  projectedLeads: number;
  costPerLead: number;
  serviceArea: string;
  season: string;
  calendlyLink?: string;
}

export interface CallScriptSection {
  name: string;
  duration: string;
  content: string;
  questions?: string[];
}

export interface CallScript {
  sections: CallScriptSection[];
}

export interface LoomContext {
  firstName: string;
  companyName: string;
  reviewCount: number;
  rating: number;
  serviceType: string;
  serviceArea: string;
  gap1: string;
  gap2: string;
  competitorName: string;
  calendlyLink: string;
}

// ---------------------------------------------------------------------------
// Discovery Call Script
// ---------------------------------------------------------------------------

export function generateDiscoveryCallScript(ctx: DiscoveryCallContext): CallScript {
  const monthlyRevenue = ctx.projectedLeads * ctx.avgJobValue * 0.35; // 35% close rate assumption
  const roiMultiple = (monthlyRevenue / (ctx.projectedLeads * ctx.costPerLead)).toFixed(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calendly = ctx.calendlyLink || "https://www.trysovereignai.com/strategy-call";

  return {
    sections: [
      {
        name: "Opening & Rapport",
        duration: "2 minutes",
        content: `Hey ${ctx.firstName}, thanks for jumping on — I appreciate you taking the time. I know you're busy running ${ctx.companyName}, so I want to make sure this is valuable for you.

Before we dive in, I want to set expectations: this isn't a sales pitch. My goal is to understand where ${ctx.companyName} is right now, show you some data I pulled on your market, and if it makes sense, talk about what a growth plan could look like. Sound good?

Quick background on me — I'm Seth, founder of Sovereign AI. We build AI-powered marketing systems specifically for ${ctx.vertical} companies. Our platform runs 16 AI systems around the clock to generate leads, book appointments, and grow revenue. But enough about us — I want to hear about you.`,
        questions: [
          `How long have you been running ${ctx.companyName}?`,
          "How's business been this year compared to last year?",
          `What's your biggest challenge right now when it comes to getting new ${ctx.serviceType} jobs?`,
        ],
      },
      {
        name: "Discovery & Pain Points",
        duration: "5 minutes",
        content: `Got it — that's really helpful context. Let me ask a few more questions so I can give you the best recommendations:`,
        questions: [
          "Where are most of your leads coming from right now? Referrals, Google, Angi, other?",
          "How many new leads or calls would you say you're getting per month?",
          `What's the average job value for a typical ${ctx.serviceType} job? (I estimated around $${ctx.avgJobValue} — is that close?)`,
          "Are you running any ads right now — Google, Facebook, anything?",
          "Have you worked with a marketing agency or lead gen company before? How did that go?",
          "If you could wave a magic wand and fix one thing about your marketing, what would it be?",
        ],
      },
      {
        name: "Market Analysis & Audit Findings",
        duration: "5 minutes",
        content: `OK, so I actually ran an analysis of the ${ctx.vertical} market in ${ctx.serviceArea} before this call. Let me share what I found — I think you'll find this interesting.

First, the good news: ${ctx.companyName} has a solid reputation and there's strong demand for ${ctx.serviceType} in ${ctx.city}. The market is there.

Now, here's where the opportunity is:

1. Your top competitors in ${ctx.serviceArea} are running AI-optimized ad campaigns and automated follow-up systems. They're capturing leads that are searching online — and those leads never even see ${ctx.companyName}.

2. 73% of homeowners now Google before they hire, even for referrals. If ${ctx.companyName} isn't showing up at the top of those searches, you're invisible to nearly three-quarters of potential customers.

3. The ${ctx.vertical} companies in ${ctx.city} that are growing fastest all have three things in common: aggressive review generation, 24/7 lead capture (AI chatbot + voice agent), and automated follow-up sequences. These aren't "nice to haves" anymore — they're table stakes.

The bottom line: there are homeowners in ${ctx.serviceArea} searching for ${ctx.serviceType} right now who would hire ${ctx.companyName} if they could find you. We just need to make sure they can.`,
      },
      {
        name: "Solution Presentation & ROI Math",
        duration: "5 minutes",
        content: `So here's what a system would look like for ${ctx.companyName}. Let me walk through the numbers:

Based on the data I pulled, we'd be targeting homeowners in ${ctx.serviceArea} who need ${ctx.serviceType} services. Using our AI lead generation system, here's what the math looks like:

- Projected leads per month: ${ctx.projectedLeads}
- Estimated cost per lead: $${ctx.costPerLead}
- Your average job value: $${ctx.avgJobValue}
- At a conservative 35% close rate, that's ${Math.round(ctx.projectedLeads * 0.35)} new jobs per month
- Projected monthly revenue from these leads: $${monthlyRevenue.toLocaleString()}
- That's roughly a ${roiMultiple}x return on your marketing investment

And this isn't theoretical — the platform is specifically engineered for ${ctx.vertical} businesses. 16 AI systems working around the clock on lead generation, reputation, content, and follow-up.

Everything is done for you — we deploy the entire system in 48 hours. You don't need to learn any software, hire anyone, or change how you run your business. You just keep doing great ${ctx.serviceType} work and answer the phone when it rings.`,
        questions: [
          "Does that ROI math make sense for your business?",
          "What would an extra " +
            Math.round(ctx.projectedLeads * 0.35) +
            " jobs per month mean for " +
            ctx.companyName +
            "?",
        ],
      },
      {
        name: "Close & Next Steps",
        duration: "3 minutes",
        content: `So ${ctx.firstName}, based on everything we've talked about — here's what I'd recommend:

Given where ${ctx.companyName} is right now and the opportunity in ${ctx.serviceArea}, I think the Growth Bundle is the right fit. It includes lead generation, AI voice agent, SEO, email marketing, review management, and CRM — basically the full engine.

Here's the deal:
- Month-to-month, no long-term contract
- 60-day money-back guarantee — if you don't see results, you get every penny back
- We deploy in 48 hours so you start seeing leads within the first week
- 14-day free trial so you can test it risk-free

We're only onboarding 10 new ${ctx.vertical} clients this ${ctx.season} in ${ctx.serviceArea} to make sure everyone gets white-glove setup. I have a couple spots left.

Want to lock in your spot and get started this week?`,
        questions: [
          "What questions do you have?",
          "Is there anyone else who needs to be involved in this decision?",
          "What would need to be true for you to move forward today?",
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Loom Video Script
// ---------------------------------------------------------------------------

/**
 * Generate a personalized Loom video script for prospect outreach.
 * Designed for 3-5 minute videos that show the prospect's online presence
 * and pitch the service.
 */
export function generateLoomScript(ctx: LoomContext): string {
  return `[SCREEN: Their Google Business Profile or website pulled up]

Hey ${ctx.firstName}, this is Seth from Sovereign AI. I recorded this quick video specifically for ${ctx.companyName} — this isn't a template, I actually pulled up your business and did some research.

[SCREEN: Show their GBP listing]

So first off — ${ctx.companyName} has ${ctx.reviewCount} reviews averaging ${ctx.rating} stars. That's solid. You clearly do great ${ctx.serviceType} work and your customers appreciate it.

But here's where I think you're leaving money on the table:

[SCREEN: Show gap #1 — e.g., their search ranking, missing keywords, weak GBP]

${ctx.gap1}

[SCREEN: Show gap #2 — e.g., competitor comparison, no ads running, slow response time]

${ctx.gap2}

[SCREEN: Show competitor — pull up their GBP or ads]

I also looked at ${ctx.competitorName} — one of your top competitors in ${ctx.serviceArea}. They're showing up above you for several key search terms, and they're running some aggressive marketing. Not because they do better work — they just have better systems.

[SCREEN: Show our dashboard / case study results]

Here's the thing: we solve exactly this. Sovereign AI builds AI-powered marketing systems for ${ctx.serviceType} companies. We handle lead generation, review management, SEO, ad management — the whole thing.

Here's what we did for a similar company: took them from around 15 leads a month to over 80 in 60 days. Their cost per lead dropped by 70%. And the whole thing runs on autopilot — the owner didn't have to learn any new software.

[SCREEN: Show the ROI calculator or pricing page briefly]

I'm not going to pitch you on pricing in a video. What I'd love to do is jump on a quick 15-minute call, walk you through the numbers specific to ${ctx.companyName}, and show you exactly what a growth plan would look like for ${ctx.serviceArea}.

No pressure, no long pitch — just data. If it makes sense, great. If not, no hard feelings.

[SCREEN: Show Calendly link]

I dropped a link below this video to book a time: ${ctx.calendlyLink}

Either way, ${ctx.firstName} — keep doing great work out there. Hope to chat soon.

[END]`;
}
