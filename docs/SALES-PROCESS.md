# Sales Process Standard Operating Procedure

> **Last Updated:** 2026-03-29
> **Owner:** Seth Brueland, Founder
> **Review Cadence:** Quarterly

---

## Table of Contents

1. [Lead Qualification (BANT Framework)](#1-lead-qualification-bant-framework)
2. [Lead Sources & Scoring](#2-lead-sources--scoring)
3. [Discovery Call Script](#3-discovery-call-script)
4. [Proposal Generation](#4-proposal-generation)
5. [Follow-Up Sequence](#5-follow-up-sequence)
6. [Objection Handling](#6-objection-handling)
7. [Closing & Handoff](#7-closing--handoff)

---

## 1. Lead Qualification (BANT Framework)

Every inbound or outbound lead must be scored against all four BANT criteria before advancing to Discovery. Use a 0-3 scale for each criterion (max total: 12).

### Budget: Can they afford $300-2,000/mo?

| Score | Criteria |
|-------|----------|
| **3 -- Strong** | Has allocated marketing budget in the $300-2,000/mo range; understands the investment |
| **2 -- Medium** | Has budget authority; needs to confirm specific amount; currently spending on marketing elsewhere |
| **1 -- Weak** | No current budget; exploring options for next quarter; or budget is significantly below $300/mo |
| **0 -- Disqualified** | Explicitly cannot afford the minimum tier; no realistic path to budget |

**Questions to Ask:**
- "What are you currently spending on marketing each month -- ads, agencies, lead gen services, anything?"
- "If this delivered 15-30 new leads a month, what would that investment be worth to you?"
- "Are you the one who makes the call on where the marketing dollars go?"

**Tip:** Most home service business owners spend $500-3,000/mo on marketing already (Google Ads, HomeAdvisor, Angi, Thumbtack, etc.). Reframe our pricing as a consolidation, not an additional expense.

### Authority: Are they the decision maker?

| Score | Criteria |
|-------|----------|
| **3 -- Strong** | Owner, CEO, or sole proprietor -- makes the call themselves |
| **2 -- Medium** | Business partner who can champion to co-owner; or GM with purchasing authority |
| **1 -- Weak** | Office manager or employee researching on behalf of ownership |
| **0 -- Disqualified** | No connection to the decision maker; no path to get there |

**Questions to Ask:**
- "Are you the one who would make the final call on bringing on a marketing platform like this?"
- "Is there a business partner or spouse who weighs in on decisions like this?"
- "Have you made similar purchasing decisions before -- like hiring an agency or signing up for a lead gen service?"

**Action:** If the prospect is not the decision maker, do NOT pitch. Instead, get the decision maker on the call or send a one-pager (see `docs/sales/ONE-PAGER.md`) for them to review.

### Need: Do they have marketing pain points?

| Score | Criteria |
|-------|----------|
| **3 -- Strong** | Clear, urgent pain: inconsistent leads, wasted ad spend, no online presence, losing to competitors online |
| **2 -- Medium** | Recognized need; currently exploring solutions; pain exists but not urgent |
| **1 -- Weak** | General interest in growth; no specific pain identified; "just looking" |
| **0 -- Disqualified** | No identifiable marketing or lead generation need |

**High-signal pain points (score 3 immediately):**
- "I'm paying for leads but they're garbage" (HomeAdvisor/Angi/Thumbtack frustration)
- "My phone used to ring but it stopped"
- "I don't have time for marketing"
- "I'm losing jobs to competitors who are everywhere online"
- "I have no idea if my marketing is working"
- "My website doesn't generate any calls"

### Timeline: Are they ready to start within 30 days?

| Score | Criteria |
|-------|----------|
| **3 -- Strong** | Wants to start immediately or within 2 weeks; has an event or season driving urgency |
| **2 -- Medium** | Ready within 30-60 days; planning for next quarter |
| **1 -- Weak** | General interest; no defined timeline; "maybe next year" |
| **0 -- Disqualified** | No foreseeable need in the next 6 months |

**Questions to Ask:**
- "When are you looking to have something like this up and running?"
- "Is there a busy season coming up that you want to be ready for?"
- "What happens if you don't fix your lead flow in the next 30 days?"

### Qualification Scoring Summary

| Total Score (out of 12) | Classification | Action |
|-------------------------|---------------|--------|
| **10-12** | Hot lead | Fast-track to Discovery call within 24 hours |
| **7-9** | Warm lead | Schedule Discovery within 3-5 business days |
| **4-6** | Cool lead | Add to nurture sequence; revisit in 30 days |
| **0-3** | Disqualified | Add to marketing newsletter list; do not pursue |

---

## 2. Lead Sources & Scoring

### Inbound Lead Sources

| Source | Description | Typical Quality | Platform Source Code |
|--------|------------|----------------|---------------------|
| **Website Form** | Visitor fills out contact/audit request form on trysovereignai.com | Medium-High | `form` |
| **Chatbot** | AI chatbot conversation on website captures contact info | Medium | `chatbot` |
| **Referral** | Existing client or partner refers a business | Highest | `referral` |
| **Phone** | Inbound call to sales number | High | `phone` |
| **Voice Agent** | AI voice agent captures lead info | High | `voice` |

### Outbound Lead Sources

| Source | Description | Typical Quality | Platform Source Code |
|--------|------------|----------------|---------------------|
| **Clay Enrichment** | Enriched prospect lists from Clay with firmographic data | Medium | `outreach` |
| **Cold Email** | Outbound email sequences to prospects | Low-Medium | `outreach` |
| **LinkedIn** | LinkedIn outreach, DMs, and connection-based prospecting | Medium | `social` |
| **Google/Facebook Ads** | Paid advertising campaigns | Medium | `ads` |
| **Social Media** | Organic social engagement (comments, DMs) | Low-Medium | `social` |

### Lead Scoring System (from `src/lib/lead-scoring.ts`)

The platform automatically scores leads from 0-100 across five dimensions (20 points max each):

#### 1. Contact Completeness (0-20 points)
- Has email: +7 points
- Has phone: +8 points
- Has both email AND phone: +3 bonus
- Has website: +2 points

#### 2. Source Quality (0-20 points)
| Source | Points |
|--------|--------|
| Referral | 20 |
| Organic / Google Local | 16 |
| HomeAdvisor / Angi Leads | 14 |
| Website | 12 |
| Paid ads | 10 |
| Social media | 8 |
| Outbound / outreach | 4 |
| Cold (no attribution) | 2 |

#### 3. Engagement Level (0-20 points)
- **Response time** (how quickly they responded):
  - Under 5 minutes: 10 pts
  - Under 30 minutes: 8 pts
  - Under 1 hour: 6 pts
  - Under 4 hours: 3 pts
  - Under 24 hours: 1 pt
- **Engagement count** (touchpoints):
  - 5+ interactions: 10 pts
  - 3-4 interactions: 7 pts
  - 1-2 interactions: 4 pts

#### 4. Business Fit (0-20 points)
- **High-value verticals** (12 pts): HVAC, Plumbing, Roofing, Electrical, Solar
- **Mid-value verticals** (8 pts): Landscaping, Painting, Flooring, Fencing, Windows, Siding, Gutters, Pest Control, Garage Door
- **Other trades** (4 pts): Any identified vertical not in the above lists
- **Business size bonus**: Medium (+20), Small (+15), Large (+10)
  - *Note: Small and medium businesses are our sweet spot*

#### 5. Online Presence (0-20 points)
- Has existing reviews: +5 pts
- Review count 50+: +10 pts / 20+: +7 pts / 5+: +4 pts / <5: +2 pts
- Has a website: +5 pts

#### Lead Grades & Recommended Actions

| Grade | Score Range | Action |
|-------|-----------|--------|
| **A** | 80-100 | Hot lead -- call immediately and schedule a strategy call |
| **B** | 60-79 | Strong prospect -- follow up within 24 hours with a personalized offer |
| **C** | 40-59 | Moderate interest -- add to nurture sequence and monitor engagement |
| **D** | 20-39 | Low priority -- include in drip campaign for long-term conversion |
| **F** | 0-19 | Unqualified -- archive and revisit only if new signals appear |

### Lead Pipeline Stages

Every lead moves through these statuses in the CRM:

```
new --> contacted --> qualified --> appointment --> proposal --> won / lost
```

---

## 3. Discovery Call Script

**Total duration:** 20 minutes (respect their time -- they're running a business)

**Pre-call checklist (do this before every call):**
- [ ] Look up their Google Business Profile (reviews, rating, photos, hours)
- [ ] Check their website (if they have one)
- [ ] Note their top 2-3 local competitors
- [ ] Pull up their city/service area in the platform for market data
- [ ] Have the ROI calculator ready with their vertical's benchmarks
- [ ] Review any previous CRM notes or chatbot transcripts

### Section 1: Opening & Rapport (2 minutes)

> "Hey [FIRST NAME], thanks for jumping on -- I appreciate you taking the time. I know you're busy running [COMPANY NAME], so I want to make this quick and valuable for you."
>
> "Before we dive in, I want to set expectations: this isn't a sales pitch. My goal is to understand where [COMPANY NAME] is right now, share some data I pulled on your market, and if it makes sense, talk about what a growth plan could look like. Sound good?"

**Rapport questions (pick one):**
- "How long have you been running [COMPANY NAME]?"
- "How's business been this year compared to last?"

### Section 2: Pain Point Exploration (5 minutes)

Ask these questions and LISTEN. Take notes -- you will use their exact words in the proposal.

> "What's your biggest challenge right now when it comes to getting new [SERVICE TYPE] jobs?"

**Follow-up questions based on their answer:**
- "Where are most of your leads coming from right now? Referrals, Google, Angi, other?"
- "How many new leads or calls would you say you're getting per month?"
- "Have you worked with a marketing agency or lead gen company before? How did that go?"
- "If you could wave a magic wand and fix one thing about your marketing, what would it be?"

### Section 3: Current Marketing Spend & Results (3 minutes)

> "Let me ask about what you're currently investing in marketing, so I can make sure any recommendation actually saves you money or makes you more."

- "Are you running any ads right now -- Google, Facebook, anything? What are you spending?"
- "Are you paying for leads from HomeAdvisor, Angi, Thumbtack, or similar? What's that running you?"
- "Do you have a marketing person or agency? What do they cost?"
- "What's the average value of a [SERVICE TYPE] job for you?"

**Mental math to do during the call:** Add up their total monthly marketing spend. Our platform should be positioned as an upgrade that costs the same or less than what they're already spending -- but delivers 3-10x more.

### Section 4: Market Analysis (5 minutes)

> "I actually ran an analysis of the [VERTICAL] market in [SERVICE AREA] before this call. Let me share what I found."

Present 3 key findings:
1. **The opportunity:** Strong demand for [SERVICE TYPE] in their area. Homeowners are searching for these services online right now.
2. **The gap:** Their top competitors are running AI-optimized campaigns and capturing leads that never see [COMPANY NAME]. 73% of homeowners Google before they hire, even for referrals.
3. **The fix:** The [VERTICAL] companies growing fastest all have three things: aggressive review generation, 24/7 lead capture (AI chatbot + voice), and automated follow-up sequences.

### Section 5: ROI Discussion (3 minutes)

Use the ROI calculator (from `src/lib/roi-calculator.ts`) with their vertical's benchmarks:

**Default benchmarks by vertical:**

| Vertical | Avg Job Value | Close Rate | Leads/Mo | Reviews/Mo |
|----------|-------------|-----------|---------|-----------|
| HVAC | $1,800 | 18% | 45 | 7 |
| Plumbing | $950 | 20% | 50 | 8 |
| Roofing | $8,500 | 10% | 25 | 4 |
| Electrical | $1,100 | 17% | 35 | 5 |
| Landscaping | $750 | 22% | 55 | 6 |
| Painting | $3,200 | 14% | 30 | 5 |
| Pest Control | $350 | 25% | 60 | 10 |
| Garage Door | $1,400 | 20% | 30 | 5 |

**Script the math live:**

> "Based on the data for [VERTICAL] businesses in [AREA], here's what the numbers look like:"
>
> "Projected leads per month: [X]. At a conservative [Y]% close rate, that's [Z] new jobs. At your average job value of $[V], that's $[REVENUE] in monthly revenue from leads alone."
>
> "On top of that, the platform automates about [H] hours of work per week -- follow-ups, review requests, scheduling -- which saves you roughly $[LABOR_SAVINGS] a month."
>
> "And with [R] new reviews per month, you're looking at an estimated $[REVIEW_VALUE] in additional lifetime revenue from improved online reputation."

### Section 6: Decision-Making & Next Steps (2 minutes)

- "Does that ROI math make sense for your business?"
- "Is there anyone else who needs to weigh in on this decision?"
- "What would need to be true for you to move forward?"

**If ready to proceed:**
> "I'd recommend the [BUNDLE] plan for where [COMPANY NAME] is right now. It includes [TOP 3 FEATURES]. Month-to-month, no long-term contract, 60-day money-back guarantee. We deploy in 48 hours. Want to get started?"

**If needs a proposal:**
> "Let me put together a custom proposal with the ROI numbers specific to [COMPANY NAME]. I'll have it in your inbox by [DATE]. Can we schedule 15 minutes on [DATE] to review it together?"

---

## 4. Proposal Generation

### Step 1: Use the AI Proposal Generator

The platform generates proposals automatically via `src/lib/acquisition/proposal-generator.ts`.

1. Navigate to **Sales Tools > Proposal Generator** in the dashboard
2. Input the discovery data (company name, vertical, city, pain points, deal value)
3. The system will auto-populate industry benchmarks and ROI projections
4. Select the recommended bundle

### Step 2: Customize Based on Trade/Vertical

Every proposal must be customized with:
- Their exact pain points (use their words from the discovery call)
- Competitive analysis specific to their market (from `src/lib/competitive-intel.ts`)
- ROI projections using their actual job value and close rate (from `src/lib/roi-calculator.ts`)
- A relevant case study for their trade

### Step 3: Include ROI Projections

The proposal must include a clear ROI breakdown:

| Line Item | Monthly Value |
|-----------|-------------|
| Revenue from new customer leads | $[calculated] |
| Profit from new customers | $[calculated] |
| Labor savings from automation | $[calculated] |
| Review-driven revenue | $[calculated] |
| **Total monthly value** | **$[calculated]** |
| Platform investment | -$[subscription] |
| **Net monthly ROI** | **$[calculated]** |
| **ROI multiple** | **[X]x** |
| **Payback period** | **[X] days** |

### Step 4: Include Competitive Comparison

When the prospect mentions a competitor or is currently using a competing tool, include a comparison section. The platform tracks these competitors with detailed battle cards:

| Competitor | Category | Pricing | Key Weakness vs. Sovereign AI |
|-----------|---------|---------|-------------------------------|
| Scorpion | Digital Marketing Agency | $1,500-5,000/mo | Long-term contracts, opaque pricing, minimal AI |
| Thryv | Business Management | $199-499/mo | Dated UI, limited AI, weak analytics |
| Vendasta | White-Label Platform | $299-1,099/mo | Agency-focused, steep learning curve, no native AI |
| ServiceTitan | Field Service Mgmt | $245-745/mo | Expensive, complex onboarding, no AI content |
| Podium | Communication Platform | $289-599/mo | Narrow feature set, no SEO/content tools |
| Housecall Pro | Home Service Mgmt | $65-229/mo | Zero AI features, limited marketing tools |
| Jobber | Field Service Mgmt | $49-249/mo | No AI, no reputation management, no marketing |
| GoHighLevel | All-in-One Marketing | $97-497/mo | Overwhelming complexity, AI feels bolted on |
| Broadly | Reputation Platform | $249-499/mo | Very narrow scope, no scheduling, no AI content |

**Sovereign AI advantages to highlight in every comparison:**
- AI is core to the platform, not an afterthought
- All-in-one: marketing + operations + reputation in one system
- Transparent, affordable pricing -- month-to-month
- 48-hour deployment, no lengthy onboarding
- 60-day money-back guarantee

### Step 5: Pricing Tiers to Include

| Bundle | Monthly Price | Setup Fee | Contracted Leads | Key Features |
|--------|-------------|----------|-----------------|-------------|
| **Starter** | $1,500 | $2,500 | 50/mo | AI chatbot, lead capture & CRM, automated follow-up, monthly reports |
| **Growth** | $3,500 | $5,000 | 150/mo | Everything in Starter + AI receptionist, review management, SEO content, social media, biweekly strategy calls |
| **Scale** | $6,000 | $7,500 | 300/mo | Everything in Growth + multi-location, ad management, predictive scoring, calendar integration, weekly strategy calls |
| **Enterprise** | $8,000+ | Custom | Custom | Everything in Scale + white-label, custom AI training, priority API, SLA guarantees, dedicated account manager |

### Step 6: Review & Send

- [ ] Proofread: names, numbers, company details are all correct
- [ ] Pricing matches the approved tier rates
- [ ] ROI projections use their actual (not generic) numbers where possible
- [ ] Manager approval for any custom pricing or discounts
- [ ] Send via email with a personalized cover note
- [ ] Log in CRM: proposal sent date, bundle recommended, deal value

---

## 5. Follow-Up Sequence

### After Proposal Sent

| Day | Action | Channel | Details |
|-----|--------|---------|---------|
| **Day 0** | Send proposal + recap email | Email | Attach proposal. Recap the 3 biggest pain points they shared. Include a Calendly link to review the proposal together. |
| **Day 2** | Check-in call or text | Phone/SMS | "Hey [NAME], just wanted to make sure you got the proposal I sent over. Any questions I can answer real quick?" Keep it under 2 minutes. |
| **Day 5** | Value-add content | Email | Share a relevant case study, industry report, or AI marketing insight. Do NOT ask for a decision -- just provide value. |
| **Day 7** | Urgency/deadline | Phone + Email | "I wanted to let you know we're only onboarding [X] new [VERTICAL] clients this month in [AREA] to ensure white-glove setup. I have [Y] spots left. Wanted to give you priority before I open them up." |
| **Day 14** | Final follow-up | Email | "I want to be respectful of your time. If [PAIN POINT] is still a challenge, the proposal is still available and I'm happy to update it. If priorities have shifted, totally understand." |
| **Day 30** | Nurture sequence | Email (automated) | Move to the automated nurture drip. Monthly value-add emails: industry insights, new features, case studies. Keep the relationship warm for when timing is right. |

### Follow-Up Email Templates

#### Day 0 -- Proposal + Recap

```
Subject: Your Custom Growth Plan -- [COMPANY NAME]

Hi [FIRST NAME],

Great talking with you earlier. As promised, I've attached a custom
proposal for [COMPANY NAME].

Quick recap of what we discussed:
- [PAIN POINT 1 -- use their exact words]
- [PAIN POINT 2]
- [PAIN POINT 3]

The [BUNDLE] plan addresses all of these. Key numbers:
- [X] projected new leads per month
- $[Y] in estimated monthly revenue from those leads
- [Z]x ROI on your investment

I'd love to walk through this together -- takes about 15 minutes.
Here's my calendar: [CALENDLY LINK]

Talk soon,
Seth
```

#### Day 5 -- Value-Add Content

```
Subject: How [SIMILAR COMPANY] went from 15 to 80+ leads/month

Hi [FIRST NAME],

Thought you'd find this interesting -- we worked with a [VERTICAL]
company similar to [COMPANY NAME] that was struggling with the same
challenges you mentioned (specifically [PAIN POINT]).

In 60 days, they went from about 15 leads a month to over 80.
Their cost per lead dropped by 70%.

[CASE STUDY LINK or 2-3 bullet points of results]

No pressure at all -- just thought it was relevant to what
you're working on.

Seth
```

#### Day 7 -- Urgency

```
Subject: Quick update on availability -- [SERVICE AREA]

Hi [FIRST NAME],

Wanted to give you a heads up -- we're only onboarding [X] new
[VERTICAL] clients in [SERVICE AREA] this month to make sure
everyone gets white-glove setup. I have [Y] spots left.

If you're still interested, I can hold a spot for [COMPANY NAME]
through [DATE]. After that I'll need to open it up.

Either way, no pressure. Just didn't want you to miss out
if the timing works.

[CALENDLY LINK] if you want to chat.

Seth
```

### Follow-Up Rules

1. **Never go more than 7 days without a touchpoint** during the active follow-up window (Days 0-14).
2. **Alternate channels.** Do not send 3 emails in a row. Mix: email, call, text, LinkedIn.
3. **Every touchpoint must add value.** No "just checking in" without something useful attached.
4. **After Day 14, respect the silence.** Move to the monthly nurture sequence. Do not chase.
5. **If they respond at any point, reset the sequence.** Treat a reply as a new conversation.

---

## 6. Objection Handling

### "Too expensive" / "I can't afford that"

**Framework: Reframe as ROI, not cost**

> "I hear you -- $[PRICE]/month is real money. So let's do the math together."
>
> "Your average [VERTICAL] job is worth about $[AVG_JOB_VALUE]. At a conservative [X]% close rate, you need [Y] new leads per month to break even. Our average client gets 15-30 leads in month one."
>
> "So the question isn't 'can I afford this?' -- it's 'can I afford NOT to have this?' Every month without a lead system, you're leaving money on the table."
>
> "Plus -- 60-day money-back guarantee, no long-term contract, cancel anytime. The risk is literally zero."

**Backup moves:**
- Compare to their current marketing spend: "You mentioned you're spending $[X] on [HomeAdvisor/agency/ads]. For the same money or less, you'd get exclusive leads, reputation management, AI automation, and a full CRM."
- Offer the Starter tier: "We can start with the Starter plan at $1,500/mo and upgrade once you see the results."
- Run the ROI calculator live on the call.

**Follow-up action:** Send a custom ROI calculation specific to their business.

### "I already have a marketing person / agency"

**Framework: AI augmentation, not replacement**

> "That's great -- having someone focused on marketing is smart. Here's the thing: our platform doesn't replace your marketing person. It makes them 10x more productive."
>
> "Right now, how much of their time is spent on repetitive tasks -- responding to reviews, posting on social media, following up with leads, sending emails? Our AI handles all of that on autopilot, which frees your person to focus on strategy and relationships."
>
> "Most of our clients who have a marketing person or agency keep them AND use our platform. The AI handles the grunt work; the human handles the high-value thinking."

**Backup moves:**
- If they have an agency: "What are you paying the agency? For comparison, here's what you'd get with us for [same or less money]." Pull up the competitive comparison.
- Ask: "On a scale of 1-10, how happy are you with the results you're getting from them?"
- Offer a free audit: "Let me run a free marketing audit on [COMPANY NAME]. If your current setup is crushing it, I'll tell you -- and you'll know for sure."

### "I'm not sure AI works for my business"

**Framework: Proof through data and trial**

> "Totally fair question. Here's what I'd say: AI marketing isn't theoretical anymore. We have [VERTICAL] clients in [SIMILAR AREA] generating [X] leads per month with the platform running on autopilot."
>
> "But I don't expect you to take my word for it. That's why we offer a 14-day free trial and a 60-day money-back guarantee. You can test the entire system risk-free and see the results in your own dashboard -- real leads, real data."

**Backup moves:**
- Share a case study from their specific vertical
- Offer to show them the live dashboard of a similar client (with permission)
- Explain what the 16 AI systems actually do in plain language -- demystify it

**Follow-up action:** Send the case study PDF and a link to start the free trial.

### "I need to think about it" / "Let me talk to my partner"

**Framework: Address the real concern, then lower the barrier**

> "Totally understand -- this is a business decision and you should take your time."

**Then dig for the real objection:**
> "Can I ask -- is there a specific part of the proposal you're unsure about? I want to make sure I've answered everything so you have what you need to make the decision."

Common underlying concerns:
- **Price:** See the "Too expensive" handler above.
- **Risk:** Emphasize the 60-day guarantee and month-to-month terms.
- **Timing:** "We deploy in 48 hours. You'd start seeing leads within the first week."
- **Spouse/partner buy-in:** "Would it help if I put together a one-page summary you can share? Or I'm happy to jump on a quick call with both of you."

> "Just so you know -- we're only onboarding [X] new [VERTICAL] clients this month in [AREA] to make sure everyone gets white-glove setup. So if timing matters, sooner is better."

**Follow-up action:** Send the free playbook PDF. Set a 5-day follow-up reminder (call, not email).

### "I had a bad experience with an agency / lead gen company"

**Framework: Differentiation and transparency**

> "I hear that a lot -- and honestly, most marketing companies do a terrible job for [VERTICAL] businesses. Here's why we're different:"
>
> "First -- you see everything in real-time. Every lead, every call, every dollar. No monthly PDF reports with vanity metrics. You log into a live dashboard and see exactly what's happening."
>
> "Second -- no long-term contracts. Month-to-month, cancel anytime. If we're not delivering, you walk away. No penalty, no hassle."
>
> "Third -- we guarantee results. If you don't see ROI in 60 days, you get every penny back. Full refund. No questions asked."
>
> "The businesses that come to us after a bad agency experience are usually our best clients -- because they can see the difference immediately."

**Backup moves:**
- Ask specifically what went wrong: "What happened with the last company? I want to make sure we're not making the same mistakes."
- Address their specific bad experience point by point
- Offer a reference call with a client in their vertical

### Additional Objection Handlers

#### "I get enough work from referrals / I'm busy enough"

> "That's great -- referrals are the best kind of lead. But what happens when [SEASON] slows down? Or when a big referral source moves or retires?"
>
> "73% of homeowners Google before hiring, even when they get a referral. If your online presence doesn't match the quality of your work, you're losing jobs you don't know about."
>
> "We're not replacing your referrals -- we're adding a second engine so [COMPANY NAME] isn't dependent on any single source."

#### "Just send me some information"

*Note: This is often a brush-off. The follow-up is critical.*

> "Absolutely -- I'll send over three things: a free AI marketing audit for [COMPANY NAME], a case study from a [VERTICAL] company similar to yours, and our AI marketing playbook with full ROI breakdown. You'll have everything within the hour."

**Follow-up action:** Send the materials immediately. Set a **2-day follow-up -- CALL, don't email.** This objection requires a phone follow-up to re-engage.

#### "Can you guarantee results?"

> "Yes -- and I'll put it in writing. If you don't see measurable results within 60 days, full refund. Every penny. No questions asked, no hoops."
>
> "Here's why we can do that: the platform runs 16 AI systems purpose-built for [VERTICAL] businesses. And if for some reason it doesn't perform for [COMPANY NAME] in [AREA], you don't pay. The risk is zero. The cost of doing nothing isn't."

---

## 7. Closing & Handoff

### Buying Signals to Watch For

When you hear any of these, transition to the close:
- "What happens after we sign up?"
- "How quickly can you get this running?"
- "Can you send me the contract/agreement?"
- "What does onboarding look like?"
- "Do you offer [specific feature]?" (they're visualizing using it)
- Asking about payment terms or discounts
- Involving a business partner or spouse in the conversation

### Closing Steps

#### 1. Payment Collection via Stripe

- Send a Stripe checkout link for the selected bundle
- Accepted: credit card or ACH bank transfer
- Setup fee is charged immediately; monthly subscription starts upon deployment
- For Enterprise deals or custom pricing, send a Stripe invoice instead

#### 2. Contract / Agreement Signing

- Send the Master Service Agreement (MSA) + SLA via DocuSign or PandaDoc
- Key terms to highlight verbally:
  - Month-to-month, cancel anytime with 30 days notice
  - 60-day money-back guarantee
  - Lead delivery guarantee (80%+ of contracted volume or pro-rated credit)
  - Data ownership: client owns all their data
- For deals requiring legal review, allow 48-72 hours for redlines
- Do NOT allow verbal agreements without a signed contract

#### 3. Handoff to Onboarding Team

Complete within 24 hours of payment receipt:

**Handoff Document (fill out in CRM):**
- [ ] Client company name and primary contact info
- [ ] Bundle selected and any custom terms or pricing
- [ ] Vertical and service area
- [ ] Pain points discussed (in their words)
- [ ] Current marketing spend and tools being replaced
- [ ] Specific promises made during sales process (be precise)
- [ ] Upsell opportunities identified for later
- [ ] Risks or concerns flagged

**Handoff Actions:**
- [ ] Update CRM status to "Won" with deal value and close date
- [ ] Schedule internal handoff meeting: Sales + Client Success Manager (30 min)
- [ ] Send introduction email connecting the client to their CSM (template below)
- [ ] CSM schedules onboarding kickoff within 48 hours of introduction
- [ ] Deployment target: platform live within 48 hours of kickoff

**Introduction Email Template:**

```
Subject: Welcome to Sovereign AI -- Meet Your Success Manager

Hi [CLIENT FIRST NAME],

Welcome to Sovereign AI! We're excited to have [COMPANY NAME] on board.

I'd like to introduce you to [CSM NAME], your dedicated Client Success
Manager. [CSM NAME] is going to handle your onboarding and make sure
everything is running perfectly.

[CSM NAME] -- meet [CLIENT FIRST NAME] from [COMPANY NAME]. They're a
[VERTICAL] company in [SERVICE AREA]. The biggest priorities they want
to tackle are [PAIN POINT 1] and [PAIN POINT 2].

[CSM NAME] will reach out within 24 hours to schedule your onboarding
kickoff. From there, we'll have your system deployed within 48 hours.

It's been a pleasure working with you, [FIRST NAME]. I'll check in
from time to time to make sure everything's going great.

-- Seth
```

#### 4. Commission Tracking

- Log the closed deal in the commission tracking sheet:
  - Rep name
  - Client name
  - Bundle and monthly recurring revenue (MRR)
  - Setup fee collected
  - Close date
  - Lead source (for attribution)
- Commission payout: [per company commission structure]
- Clawback policy: if client cancels within 60 days, commission is reversed

### Post-Close Checklist

- [ ] Payment received and confirmed in Stripe
- [ ] Contract signed and filed
- [ ] CRM updated to "Won"
- [ ] Handoff document completed
- [ ] CSM introduction email sent
- [ ] Commission logged
- [ ] Onboarding kickoff scheduled within 48 hours
- [ ] Thank the referral source (if applicable)

---

## Quick Reference: Key Numbers

| Metric | Value |
|--------|-------|
| Starter price | $1,500/mo + $2,500 setup |
| Growth price | $3,500/mo + $5,000 setup |
| Scale price | $6,000/mo + $7,500 setup |
| Enterprise price | $8,000+/mo, custom setup |
| Money-back guarantee | 60 days |
| Contract terms | Month-to-month |
| Deployment time | 48 hours |
| Free trial | 14 days |
| Lead delivery guarantee | 80%+ of contracted volume |
| Support SLA (Starter) | 24 hours |
| Support SLA (Growth) | 4 hours |
| Support SLA (Scale) | 1 hour |
| Support SLA (Enterprise) | 30 minutes |

---

## Platform Source Files Referenced

| File | What It Does |
|------|-------------|
| `src/lib/lead-scoring.ts` | Lead scoring algorithm (0-100, five dimensions) |
| `src/lib/roi-calculator.ts` | ROI projections with industry benchmarks by vertical |
| `src/lib/competitive-intel.ts` | Competitor data, battle cards, comparison matrices |
| `src/lib/playbooks/sales-scripts.ts` | Discovery call scripts with dynamic interpolation |
| `src/lib/playbooks/objection-handlers.ts` | Objection detection and response templates |
| `src/lib/acquisition/proposal-generator.ts` | AI-powered proposal generation via Claude |
| `src/lib/service-tiers.ts` | Tier definitions, SLAs, guarantee enforcement |
| `docs/sales/ONE-PAGER.md` | One-page summary for decision makers |
