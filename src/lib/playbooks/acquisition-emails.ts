/**
 * Cold email sequence for contractor prospect acquisition.
 * 4-email cadence: Opener (Day 0), Value Bump (Day 3), Social Proof (Day 7), Breakup (Day 14).
 *
 * CAN-SPAM compliance: each email includes physical address and unsubscribe
 * footer. Callers must supply an unsubscribeUrl in the context.
 */

const COMPANY_ADDRESS =
  process.env.COMPANY_ADDRESS ||
  "123 Main Street, Suite 100, Austin, TX 78701";

export interface AcquisitionEmailContext {
  firstName: string;
  companyName: string;
  reviewCount: number;
  rating: number;
  vertical: string;
  city: string;
  serviceArea: string;
  serviceType: string;
  personalizationHook: string; // Specific observation about their business
  proofMetric: string; // e.g., "15 qualified leads/month"
  phone: string;
  // For Email 3 (social proof)
  similarCompanyName?: string;
  similarCity?: string;
  leadsDelivered?: number;
  costPerLead?: number;
  industryAvgCPL?: number;
  appointmentsBooked?: number;
  // Seasonal
  season?: string;
  // CAN-SPAM
  unsubscribeUrl?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  dayOffset: number;
  stepName: string;
}

export function generateAcquisitionSequence(ctx: AcquisitionEmailContext): GeneratedEmail[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
  const unsubUrl = ctx.unsubscribeUrl || `${appUrl}/unsubscribe`;
  const canSpamFooter = `\n\n---\nSovereign Empire | ${COMPANY_ADDRESS}\nUnsubscribe: ${unsubUrl}`;

  return [
    {
      dayOffset: 0,
      stepName: "opener",
      subject: `${ctx.firstName}, quick question about ${ctx.companyName}`,
      body: `Hey ${ctx.firstName},

I was looking at ${ctx.companyName}'s reviews on Google — you've got ${ctx.reviewCount} reviews averaging ${ctx.rating} stars, which puts you ahead of most ${ctx.vertical} companies in ${ctx.city}. ${ctx.personalizationHook}.

I run an AI system that finds homeowners in ${ctx.serviceArea} who actually need ${ctx.serviceType} work right now — not bought lists, not shared leads. Exclusive leads generated specifically for your business. We're delivering ${ctx.proofMetric} for similar ${ctx.vertical} companies.

Would it be worth a 10-minute call to see if this fits?

— Seth
Sovereign Empire
${ctx.phone}${canSpamFooter}`,
    },
    {
      dayOffset: 3,
      stepName: "value_bump",
      subject: `re: ${ctx.firstName}, quick question about ${ctx.companyName}`,
      body: `${ctx.firstName} —

Quick stat: the average ${ctx.vertical} company loses $15-30K/year from leads that call and don't get an answer within 5 minutes. Our system catches those before your competitors do.

Thought that'd be worth sharing either way.

— Seth${canSpamFooter}`,
    },
    {
      dayOffset: 7,
      stepName: "social_proof",
      subject: ctx.similarCompanyName
        ? `what we did for ${ctx.similarCompanyName}`
        : `results from a ${ctx.vertical} company like yours`,
      body: ctx.similarCompanyName
        ? `${ctx.firstName} —

${ctx.similarCompanyName} in ${ctx.similarCity} signed up 6 weeks ago. Here's their numbers:
- ${ctx.leadsDelivered} qualified leads delivered
- $${ctx.costPerLead} cost per lead (vs. $${ctx.industryAvgCPL} industry average)
- ${ctx.appointmentsBooked} appointments booked

Happy to show you exactly how it works. No pressure, no long pitch — just a screen share of the actual system.

— Seth${canSpamFooter}`
        : `${ctx.firstName} —

A ${ctx.vertical} company similar to yours signed up recently. Within 6 weeks they were getting qualified leads at well below industry average cost, with real appointments booked.

Happy to show you exactly how it works. No pressure, no long pitch — just a screen share of the actual system.

— Seth${canSpamFooter}`,
    },
    {
      dayOffset: 14,
      stepName: "breakup",
      subject: "closing the loop",
      body: `${ctx.firstName} —

I've reached out a few times and I know you're busy running ${ctx.companyName}. I'll assume the timing isn't right.

If things change — or if you just want to see how AI lead gen works for ${ctx.vertical} companies — my number is ${ctx.phone}. I'm always happy to chat.

Good luck this ${ctx.season || "season"}.

— Seth${canSpamFooter}`,
    },
  ];
}
