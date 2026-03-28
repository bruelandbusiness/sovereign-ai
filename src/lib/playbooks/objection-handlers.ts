// ---------------------------------------------------------------------------
// Objection Handlers — Sales objection responses with dynamic interpolation
// All 8 objection handlers for contractor prospect conversations.
// ---------------------------------------------------------------------------

export interface ObjectionContext {
  vertical: string;
  avgJobValue: number; // in dollars
  monthlyPrice: number; // in dollars
  conversionRate: number; // percentage (e.g., 35)
  companyName: string;
  serviceArea: string;
  season: string;
}

export interface ObjectionResponse {
  objection: string;
  triggerPhrases: string[]; // phrases that indicate this objection
  response: string; // the response with variables filled in
  followUpAction?: string; // what to do after
}

// ---------------------------------------------------------------------------
// Objection definitions (raw templates with {placeholder} tokens)
// ---------------------------------------------------------------------------

interface ObjectionDefinition {
  key: string;
  objection: string;
  triggerPhrases: string[];
  template: string;
  followUpAction?: string;
}

const OBJECTION_DEFINITIONS: ObjectionDefinition[] = [
  {
    key: "cost",
    objection: "How much does it cost?",
    triggerPhrases: [
      "how much",
      "what's the price",
      "what does it cost",
      "pricing",
      "what's it cost",
      "what do you charge",
      "how much do you charge",
      "what are your rates",
      "price",
      "cost",
      "fee",
      "investment",
    ],
    template: `Great question. Our plans start at $\${monthlyPrice}/month. To put that in perspective — the average \${vertical} job in \${serviceArea} is worth $\${avgJobValue}. So you need ONE extra job per month to more than cover the cost. Most of our clients are getting 15-30 new leads in their first month alone.

But I don't want to talk pricing until I can show you what the ROI looks like for \${companyName} specifically. Can I run a free audit and show you the numbers?`,
    followUpAction: "Offer the free audit or strategy call",
  },
  {
    key: "already_using_competitor",
    objection: "I already use HomeAdvisor/Angi/Thumbtack",
    triggerPhrases: [
      "homeadvisor",
      "angi",
      "angie's list",
      "thumbtack",
      "already use",
      "already have a service",
      "already paying for leads",
      "already get leads from",
      "i use",
      "we use",
      "signed up with",
      "working with another",
    ],
    template: `I hear that a lot — and here's the difference. With HomeAdvisor, Angi, or Thumbtack, you're buying shared leads. The same lead goes to 3-5 other \${vertical} companies, and it becomes a race to the bottom on price.

With us, every lead is exclusive to \${companyName}. They're generated specifically for your business in \${serviceArea} — no one else gets them. Our clients typically see a cost-per-lead that's 40-60% lower than those platforms, with a \${conversionRate}% higher close rate because the leads aren't being shopped around.

Want me to run a side-by-side comparison for \${companyName}?`,
    followUpAction: "Run a cost-per-lead comparison audit",
  },
  {
    key: "tried_before",
    objection: "I tried lead gen before and it didn't work",
    triggerPhrases: [
      "tried before",
      "didn't work",
      "doesn't work",
      "burned before",
      "got burned",
      "waste of money",
      "been burned",
      "tried that",
      "tried lead gen",
      "tried digital marketing",
      "tried online marketing",
      "never worked",
      "bad experience",
    ],
    template: `I totally get that — and honestly, most lead gen companies do a terrible job for \${vertical} businesses. Here's why we're different:

1. You see everything in real-time. Every lead, every call, every dollar. No monthly PDF reports with vanity metrics.
2. No long-term contracts. Month-to-month, cancel anytime.
3. We guarantee results. If you don't see ROI in 60 days, you get every penny back.

The businesses that come to us after a bad experience with another agency are usually our best clients — because they can see the difference immediately. Can I show you what we're doing for other \${vertical} companies in \${serviceArea}?`,
    followUpAction: "Share relevant case study for their vertical",
  },
  {
    key: "enough_referrals",
    objection: "I get enough work from referrals",
    triggerPhrases: [
      "enough work",
      "plenty of work",
      "word of mouth",
      "referrals",
      "don't need marketing",
      "don't need more leads",
      "busy enough",
      "booked out",
      "fully booked",
      "all the work i need",
      "we stay busy",
    ],
    template: `That's great — referrals are the best kind of lead. But let me ask you this: what happens when \${season} slows down? Or when a big referral source moves or retires?

73% of homeowners now search online before hiring a \${vertical} company — even when they get a referral, they're Googling you first. If your online presence doesn't match the quality of your work, you're losing jobs you don't even know about.

We're not replacing your referrals — we're adding a second engine so \${companyName} isn't dependent on any single source. What if you had 20-30 extra leads per month on top of your referrals?`,
    followUpAction:
      "Offer a free audit showing their online visibility vs. competitors",
  },
  {
    key: "think_about_it",
    objection: "I need to think about it",
    triggerPhrases: [
      "think about it",
      "need to think",
      "let me think",
      "sleep on it",
      "talk to my wife",
      "talk to my partner",
      "talk to my business partner",
      "not ready",
      "not sure yet",
      "need some time",
      "give me some time",
      "get back to you",
      "let me get back",
    ],
    template: `Totally understand — this is a business decision and you should take your time. Here's what I'd suggest: let me send you our free playbook. It's a 32-page guide with real case studies and ROI math for \${vertical} businesses. No commitment, no follow-up calls.

That way you can review the numbers on your own time, show it to anyone else involved in the decision, and reach out when you're ready.

And just so you know — we're only onboarding 10 new \${vertical} clients this month in \${serviceArea} to make sure everyone gets white-glove setup. So if timing matters, sooner is better.`,
    followUpAction: "Send the free playbook PDF and set a 5-day follow-up",
  },
  {
    key: "guarantee",
    objection: "Can you guarantee results?",
    triggerPhrases: [
      "guarantee",
      "guaranteed",
      "promise",
      "what if it doesn't work",
      "what if i don't get results",
      "can you promise",
      "risk",
      "money back",
      "refund",
      "what's the catch",
    ],
    template: `Yes — and I'll put it in writing. If you don't see measurable results within 60 days, you get a full refund. Every penny. No questions asked, no hoops to jump through.

Here's why we can do that: the platform runs 16 AI systems purpose-built for \${vertical} and other home service businesses. We've engineered the playbook from the ground up to drive measurable results — and if for some reason it doesn't perform in \${serviceArea} for \${companyName}, you don't pay.

The risk is literally zero. The cost of doing nothing isn't — every month without a system like this, you're leaving leads on the table for your competitors.`,
    followUpAction: "Send the guarantee page link and book a strategy call",
  },
  {
    key: "too_expensive",
    objection: "That's too expensive",
    triggerPhrases: [
      "too expensive",
      "too much",
      "can't afford",
      "out of my budget",
      "don't have the budget",
      "too pricey",
      "that's a lot",
      "cheaper option",
      "more affordable",
      "less expensive",
    ],
    template: `I hear you — $\${monthlyPrice}/month is real money. So let's do the math together:

Your average \${vertical} job in \${serviceArea} is worth about $\${avgJobValue}. At a \${conversionRate}% close rate, you need roughly \${Math.ceil(monthlyPrice / (avgJobValue * (conversionRate / 100)))} new leads per month to break even. Our average client gets 15-30 leads in month one.

So the question isn't really "can I afford this?" — it's "can I afford NOT to have this?" Every month without a lead system, you're leaving money on the table.

Plus, there's zero risk: 60-day money-back guarantee, no long-term contract, cancel anytime. Want me to run the ROI numbers specific to \${companyName}?`,
    followUpAction: "Run a custom ROI calculator for their business",
  },
  {
    key: "send_info",
    objection: "Send me some information",
    triggerPhrases: [
      "send me info",
      "send me some information",
      "send me details",
      "email me",
      "send me an email",
      "send me something",
      "mail me",
      "send a brochure",
      "send me a proposal",
      "more information",
      "send over some info",
      "can you send",
    ],
    template: `Absolutely — I'll send over a few things:

1. A free AI marketing audit for \${companyName} showing exactly where you stand vs. competitors in \${serviceArea}
2. A case study from a \${vertical} company similar to yours that went from struggling online to 80+ leads per month
3. Our 32-page AI marketing playbook with the full ROI breakdown

You'll have everything in your inbox within the hour. I'll follow up in a couple days to see if you have any questions — sound good?`,
    followUpAction:
      "Send the audit, case study, and playbook immediately. Set a 2-day follow-up reminder. NOTE: 'Send me info' is often a brush-off. The 2-day follow-up is critical — call, don't email.",
  },
];

// ---------------------------------------------------------------------------
// Interpolation helper
// ---------------------------------------------------------------------------

function interpolate(template: string, ctx: ObjectionContext): string {
  // Handle the Math.ceil expression for the "too_expensive" template
  const breakEvenLeads = Math.ceil(
    ctx.monthlyPrice / (ctx.avgJobValue * (ctx.conversionRate / 100))
  );

  return template
    .replace(/\$\{vertical}/g, ctx.vertical)
    .replace(/\$\{avgJobValue}/g, String(ctx.avgJobValue))
    .replace(/\$\{monthlyPrice}/g, String(ctx.monthlyPrice))
    .replace(/\$\{conversionRate}/g, String(ctx.conversionRate))
    .replace(/\$\{companyName}/g, ctx.companyName)
    .replace(/\$\{serviceArea}/g, ctx.serviceArea)
    .replace(/\$\{season}/g, ctx.season)
    .replace(
      /\$\{Math\.ceil\(monthlyPrice \/ \(avgJobValue \* \(conversionRate \/ 100\)\)\)}/g,
      String(breakEvenLeads)
    );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a fully interpolated objection response by key.
 *
 * Valid keys: "cost", "already_using_competitor", "tried_before",
 * "enough_referrals", "think_about_it", "guarantee", "too_expensive",
 * "send_info"
 *
 * @throws {Error} if the objection key is not recognised.
 */
export function getObjectionResponse(
  objectionKey: string,
  ctx: ObjectionContext
): ObjectionResponse {
  const definition = OBJECTION_DEFINITIONS.find((d) => d.key === objectionKey);
  if (!definition) {
    throw new Error(
      `Unknown objection key: "${objectionKey}". Valid keys: ${OBJECTION_DEFINITIONS.map((d) => d.key).join(", ")}`
    );
  }

  return {
    objection: definition.objection,
    triggerPhrases: definition.triggerPhrases,
    response: interpolate(definition.template, ctx),
    followUpAction: definition.followUpAction,
  };
}

/**
 * Detect which objection (if any) a prospect message matches.
 * Returns the objection key or null if no match is found.
 *
 * Matching is case-insensitive and checks all trigger phrases.
 */
export function detectObjection(message: string): string | null {
  const normalised = message.toLowerCase().trim();

  // Score each objection by how many trigger phrases match
  let bestKey: string | null = null;
  let bestScore = 0;

  for (const definition of OBJECTION_DEFINITIONS) {
    let score = 0;
    for (const phrase of definition.triggerPhrases) {
      if (normalised.includes(phrase.toLowerCase())) {
        // Longer phrase matches are weighted higher for accuracy
        score += phrase.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = definition.key;
    }
  }

  return bestKey;
}

/**
 * Get all available objection keys.
 */
export function getObjectionKeys(): string[] {
  return OBJECTION_DEFINITIONS.map((d) => d.key);
}

/**
 * Get all objection responses at once (useful for building a reference sheet).
 */
export function getAllObjectionResponses(
  ctx: ObjectionContext
): ObjectionResponse[] {
  return OBJECTION_DEFINITIONS.map((definition) => ({
    objection: definition.objection,
    triggerPhrases: definition.triggerPhrases,
    response: interpolate(definition.template, ctx),
    followUpAction: definition.followUpAction,
  }));
}
