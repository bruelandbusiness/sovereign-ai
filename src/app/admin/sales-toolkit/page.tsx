"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Users,
  Target,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Cold email templates
// ---------------------------------------------------------------------------

const EMAIL_TEMPLATES = [
  {
    id: "cold-intro",
    name: "Cold Intro — First Touch",
    subject: "Quick question about {business_name}",
    body: `Hi {first_name},

I was looking at {business_name}'s online presence and noticed a few things that might be costing you leads — specifically around your Google Business Profile and local search rankings.

I help {trade} companies in {city} generate 30-80+ new leads per month using AI-powered marketing. No long-term contracts, no fluff.

Would it make sense to do a quick 15-minute call this week? I can show you exactly where you're losing leads to competitors and what to do about it.

Either way, I put together a free marketing audit for your business — happy to send it over.

Best,
Seth Brueland
Founder, Sovereign AI
trysovereignai.com`,
  },
  {
    id: "follow-up-1",
    name: "Follow-Up #1 — Value Add (Day 3)",
    subject: "Your competitors are doing this (you're not)",
    body: `Hi {first_name},

I don't know if you saw my last email, so I'll keep this quick.

I ran a quick analysis of {trade} companies in {city}. Here's what I found:

- Your top 3 competitors have 3-5x more Google reviews than {business_name}
- They're running AI-optimized ad campaigns that are crushing cost-per-lead
- At least 2 of them are using automated follow-up systems for missed calls

The good news? This is all fixable — and faster than you'd think. We deployed a full AI marketing system for a {trade} company in {similar_city} and they went from 12 leads/month to 67 in 60 days.

Want me to run a free marketing audit for {business_name}? Takes 60 seconds, no strings attached.

Best,
Seth`,
  },
  {
    id: "follow-up-2",
    name: "Follow-Up #2 — Social Proof (Day 7)",
    subject: "How a {trade} in {similar_city} went from 12 to 67 leads/month",
    body: `Hi {first_name},

Last email, I promise (unless you reply).

I wanted to share a quick case study that might be relevant:

Rodriguez HVAC in Phoenix was getting ~15 leads per month from word-of-mouth. They had no online presence and were losing jobs to competitors with worse service.

We deployed our AI marketing system in 48 hours. Within 60 days:
- 87 leads per month (up from 15)
- 189 Google reviews (up from 23)
- AI voice agent booking 23 appointments per week
- $89K monthly revenue (up from $24K)

The whole thing runs on autopilot. Mike (the owner) didn't have to learn any new software.

If you're curious what this would look like for {business_name}, I'm happy to do a free 15-minute strategy call. No pitch — just a custom roadmap.

Book a time here: https://www.trysovereignai.com/strategy-call

Best,
Seth Brueland
Founder, Sovereign AI`,
  },
  {
    id: "breakup",
    name: "Breakup Email (Day 14)",
    subject: "Should I close your file?",
    body: `Hi {first_name},

I've reached out a few times about helping {business_name} generate more leads with AI marketing.

I haven't heard back, so I'm guessing one of three things:

1. You're not interested (totally fine — no hard feelings)
2. You're interested but busy (I get it — reply "later" and I'll check back in a month)
3. You've already hired someone else (congrats!)

If it's #1, I'll remove you from my list. No worries at all.

If it's #2 or you ever want a free marketing audit, just reply and I'll make it happen.

Either way, wishing you and {business_name} all the best.

Seth`,
  },
  {
    id: "referral-ask",
    name: "Referral Ask — After Close",
    subject: "Quick favor?",
    body: `Hi {first_name},

Really glad to see {business_name} is getting results with Sovereign AI — those numbers are looking great.

Quick question: do you know any other {trade} owners (or other home service business owners) in the area who might benefit from the same kind of results?

For every referral that signs up, I'll give you a $500 credit on your next month. No limit.

If anyone comes to mind, just reply with their name and I'll take it from there. No pressure on them either — I'll just offer a free audit.

Thanks, {first_name}. Really appreciate the trust.

Seth`,
  },
];

// ---------------------------------------------------------------------------
// Cold call scripts
// ---------------------------------------------------------------------------

const CALL_SCRIPTS = [
  {
    id: "cold-call",
    name: "Cold Call — First Touch",
    script: `**Opening (10 sec):**
"Hi, is this {first_name}? Hey {first_name}, this is Seth from Sovereign AI. I help {trade} companies in {city} get more leads using AI marketing. I know you're busy, so I'll be quick — do you have 60 seconds?"

**If yes (30 sec):**
"Great. I was actually looking at {business_name} online and noticed a couple things that might be costing you leads. For example, [mention one specific thing: low review count, no Google Ads, weak GBP listing, etc.].

We help contractors fix exactly that. We just helped a {trade} company in {similar_city} go from 15 leads a month to 87 in 60 days — all automated with AI.

I'm not trying to sell you anything right now. But I'd love to run a free marketing audit for {business_name} and show you what we find. Takes about 15 minutes. Would this week work for a quick call?"

**If busy / not interested:**
"Totally understand. Would it be okay if I emailed you a free marketing audit for {business_name}? No strings attached — it just shows you where you stand vs. competitors. What's the best email?"

**Objection handling:**
- "We're already working with someone" → "That's great. Do you mind if I ask — are you seeing 30+ new leads per month? If not, it might be worth getting a second opinion. The audit is free."
- "We don't need marketing" → "I hear that a lot. Most of our clients said the same thing — until they saw how many leads they were losing to competitors online. The audit takes 60 seconds and might surprise you."
- "How much does it cost?" → "Our plans start at $497/month with a 60-day money-back guarantee. But I don't want to talk pricing until I can show you what ROI looks like for your specific business. The free audit will do that."`,
  },
  {
    id: "follow-up-call",
    name: "Follow-Up Call — After Email",
    script: `**Opening:**
"Hi {first_name}, this is Seth from Sovereign AI. I sent you an email a few days ago about {business_name}'s online marketing — did you get a chance to look at it?"

**If yes:**
"Great — what did you think? I found some pretty interesting stuff when I looked at your competitor landscape. I'd love to walk you through a more detailed audit on a quick 15-minute call. When works best for you?"

**If no:**
"No worries — I know your inbox is probably flooded. The short version is: I ran a quick analysis of {trade} companies in {city}, and I found some opportunities where {business_name} could be getting a lot more leads. Can I walk you through it in 15 minutes? I think you'd find it really valuable."`,
  },
];

// ---------------------------------------------------------------------------
// LinkedIn messages
// ---------------------------------------------------------------------------

const LINKEDIN_MESSAGES = [
  {
    id: "connect",
    name: "Connection Request",
    message: `Hi {first_name}, I work with {trade} companies on AI-powered marketing. Saw {business_name} and thought we should connect. No pitch — just love connecting with fellow business owners in the home services space.`,
  },
  {
    id: "after-connect",
    name: "After Connection Accepted",
    message: `Thanks for connecting, {first_name}!

I actually took a look at {business_name}'s online presence — you've got a solid foundation. I noticed a few areas where you could be capturing more leads, though (especially around reviews and local search).

I put together free marketing audits for contractors. Want me to run one for {business_name}? Takes 60 seconds, no cost, no obligation. Just a breakdown of where you stand vs. competitors.`,
  },
  {
    id: "content-comment",
    name: "Engage on Their Content",
    message: `Great post, {first_name}. It's clear you care about quality work — that's exactly the kind of business that deserves better marketing.

A lot of {trade} companies like yours are leaving leads on the table without even knowing it. If you're ever curious, I'd be happy to run a free marketing analysis for {business_name}. No strings attached.`,
  },
];

// ---------------------------------------------------------------------------
// Direct mail copy
// ---------------------------------------------------------------------------

const DIRECT_MAIL = {
  id: "letter",
  name: "Direct Mail Letter",
  body: `{first_name},

I'm writing because I noticed something about {business_name} that you might want to know.

When someone in {city} searches Google for "{trade} near me," your competitors are showing up above you. And they're not necessarily better — they just have better marketing.

I'm Seth Brueland, founder of Sovereign AI. We help {trade} companies like yours generate 30-80+ new leads per month using AI-powered marketing. No long-term contracts, no BS.

Here's what one of our clients did:

Before: 15 leads/month, $24K revenue
After (60 days): 87 leads/month, $89K revenue

If you want to see what's possible for {business_name}, scan the QR code below or visit:

trysovereignai.com/free-audit/{trade_slug}

It's a free AI marketing audit — takes 60 seconds, shows you exactly where you stand vs. competitors.

No salespeople will call you (unless you ask).

To your success,
Seth Brueland
Founder, Sovereign AI

P.S. We guarantee results or your money back. 60 days, no questions asked.`,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-accent" /> Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> Copy
        </>
      )}
    </button>
  );
}

type Tab = "email" | "call" | "linkedin" | "mail";

export default function SalesToolkitPage() {
  const [activeTab, setActiveTab] = useState<Tab>("email");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "email", label: "Cold Emails", icon: Mail },
    { id: "call", label: "Call Scripts", icon: Phone },
    { id: "linkedin", label: "LinkedIn", icon: MessageSquare },
    { id: "mail", label: "Direct Mail", icon: Send },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sales Toolkit</h1>
            <p className="text-sm text-muted-foreground">
              Copy-paste outreach templates for acquiring new clients
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200">
            <strong>Personalization variables:</strong>{" "}
            <code className="text-xs">{"{first_name}"}</code>,{" "}
            <code className="text-xs">{"{business_name}"}</code>,{" "}
            <code className="text-xs">{"{trade}"}</code>,{" "}
            <code className="text-xs">{"{city}"}</code>,{" "}
            <code className="text-xs">{"{similar_city}"}</code>,{" "}
            <code className="text-xs">{"{trade_slug}"}</code>
            — replace these before sending.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border/50 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email templates */}
      {activeTab === "email" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              5-email sequence: Intro → Value Add → Social Proof → Breakup → Referral
            </span>
          </div>
          {EMAIL_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-border/50 bg-card"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Subject: <em>{template.subject}</em>
                  </p>
                </div>
                <CopyButton
                  text={`Subject: ${template.subject}\n\n${template.body}`}
                />
              </div>
              <pre className="whitespace-pre-wrap p-5 font-sans text-sm text-muted-foreground">
                {template.body}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Call scripts */}
      {activeTab === "call" && (
        <div className="space-y-6">
          {CALL_SCRIPTS.map((script) => (
            <div
              key={script.id}
              className="rounded-xl border border-border/50 bg-card"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                <h3 className="font-semibold">{script.name}</h3>
                <CopyButton text={script.script} />
              </div>
              <div className="p-5 text-sm text-muted-foreground prose prose-invert max-w-none prose-strong:text-foreground prose-p:my-2">
                {script.script.split("\n").map((line, i) => {
                  if (line.startsWith("**")) {
                    const text = line.replace(/\*\*/g, "");
                    return (
                      <p key={i} className="mt-4 font-semibold text-foreground">
                        {text}
                      </p>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <p key={i} className="ml-4">
                        {line}
                      </p>
                    );
                  }
                  return line.trim() ? (
                    <p key={i}>{line}</p>
                  ) : (
                    <br key={i} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LinkedIn */}
      {activeTab === "linkedin" && (
        <div className="space-y-6">
          {LINKEDIN_MESSAGES.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border border-border/50 bg-card"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                <h3 className="font-semibold">{msg.name}</h3>
                <CopyButton text={msg.message} />
              </div>
              <pre className="whitespace-pre-wrap p-5 font-sans text-sm text-muted-foreground">
                {msg.message}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Direct mail */}
      {activeTab === "mail" && (
        <div className="space-y-6">
          <div
            className="rounded-xl border border-border/50 bg-card"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <h3 className="font-semibold">{DIRECT_MAIL.name}</h3>
              <CopyButton text={DIRECT_MAIL.body} />
            </div>
            <pre className="whitespace-pre-wrap p-5 font-sans text-sm text-muted-foreground">
              {DIRECT_MAIL.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
