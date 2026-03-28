# Support Specialist Training Guide

Welcome to Sovereign AI. This guide will take you from zero to fully operational as a Client Support Specialist. Follow it sequentially -- each section builds on the previous one.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tool Access Setup](#2-tool-access-setup)
3. [Common Workflows](#3-common-workflows)
4. [Escalation Paths](#4-escalation-paths)
5. [Communication Templates](#5-communication-templates)
6. [Weekly Reporting](#6-weekly-reporting)
7. [30-Day Training Plan](#7-30-day-training-plan)

---

## 1. Platform Overview

### What Sovereign AI Does

Sovereign AI provides AI-powered marketing and operations tools to home service businesses. A single client subscription includes up to 16 integrated services, all managed through one dashboard.

### The 16 AI Services

| # | Service | What It Does |
|---|---------|-------------|
| 1 | AI Lead Generation | Multi-channel outbound prospecting, lead scoring, and nurturing |
| 2 | AI Voice Agents | 24/7 call answering, lead qualification, appointment booking |
| 3 | AI Chat Assistant | Website chatbot for lead capture and customer support |
| 4 | AI SEO Domination | Local keyword targeting, Google Business Profile optimization |
| 5 | AI Ad Management | Google and Facebook ad campaign management and optimization |
| 6 | AI Email Marketing | Automated drip campaigns, newsletters, and follow-ups |
| 7 | AI Social Media | Content generation, multi-platform scheduling and publishing |
| 8 | AI Review Management | Automated review requests, AI responses, monitoring |
| 9 | AI Scheduling System | Online booking, automated reminders, calendar sync |
| 10 | AI CRM Automation | Lead tracking, pipeline management, revenue forecasting |
| 11 | AI Website Builder | High-converting websites with A/B testing and heatmaps |
| 12 | AI Analytics | Multi-channel attribution, ROI tracking, custom dashboards |
| 13 | AI Content Engine | SEO blog posts, service pages, AI content optimization |
| 14 | AI Reputation Shield | 24/7 brand monitoring, sentiment analysis, crisis response |
| 15 | AI Retargeting | Cross-platform retargeting to bring back lost visitors |
| 16 | Custom AI Build | Custom workflow automation, API integrations, tailored solutions |

### Subscription Tiers

| Tier | Price | Services Included |
|------|-------|-------------------|
| **DIY** | $497/mo | 3 core AI tools (Chatbot, Reviews, Booking) -- self-managed |
| **Starter** | $3,497/mo | Done-for-you lead generation + review automation + scheduling |
| **Growth** | $6,997/mo | 6 AI systems (lead gen, voice agent, SEO, email, reviews, CRM) -- most popular |
| **Empire** | $12,997/mo | All 16 services + priority support + dedicated account manager |

### Key Architecture Components

- **Client Dashboard** -- what clients see when they log in. Shows service status, metrics, and settings.
- **Admin Panel** -- internal tool for managing clients, services, and configurations. You will live in this tool.
- **API Layer** -- connects the dashboard to all 16 services. You do not need to interact with this directly, but understanding it helps with troubleshooting.
- **Cron Jobs** -- automated tasks that run on schedules (report generation, health checks, ad optimization). Issues here often surface as "my reports are missing" tickets.

---

## 2. Tool Access Setup

Complete these access requests on your first day. The founder will approve and provision each one.

### 2.1 Admin Panel
- **URL:** `https://trysovereignai.com/admin`
- **Access level:** Support role (read/write on client records, read-only on billing, no access to system config)
- **Setup:** You will receive an invite email. Set up 2FA immediately.
- **Key sections to learn first:** Client list, Service health, Ticket queue

### 2.2 Stripe Dashboard
- **URL:** `https://dashboard.stripe.com`
- **Access level:** Support role (view payments, subscriptions, invoices; issue refunds up to $100; cannot modify products or pricing)
- **Setup:** Accept the team invite from Stripe. Enable 2FA.
- **Key actions:** Look up client payments, check subscription status, view failed charges, process small refunds

### 2.3 SendGrid
- **URL:** `https://app.sendgrid.com`
- **Access level:** Read-only (view email delivery stats, bounce logs, suppression lists)
- **Setup:** Accept team invite. Bookmark the Activity Feed page.
- **Key actions:** Check if a specific email was delivered, review bounce reasons, verify domain authentication status

### 2.4 Twilio
- **URL:** `https://console.twilio.com`
- **Access level:** Read-only (view call logs, SMS logs, phone number inventory)
- **Setup:** Accept team invite.
- **Key actions:** Look up call recordings, check SMS delivery status, verify phone number assignment to correct client

### 2.5 Sentry
- **URL:** `https://sentry.io/organizations/sovereign-ai/`
- **Access level:** Member (view errors, assign issues, add comments)
- **Setup:** Accept team invite. Set notification preferences to receive alerts for new high-priority errors.
- **Key actions:** Search for errors related to a client issue, attach client context to error reports, link Sentry issues to escalation tickets

### 2.6 Telegram
- **Channel:** Sovereign AI Alerts
- **Purpose:** Real-time alerts for service outages, deployment notifications, critical errors
- **Setup:** The founder will add you to the channel. Keep notifications on during business hours.

### 2.7 Slack
- **Workspace:** Sovereign AI
- **Key channels:** #support, #engineering, #general, #client-feedback
- **Setup:** Join via invite link. Set your status and working hours.

### 2.8 Calendly
- **URL:** Your personal Calendly link (will be created for you)
- **Purpose:** Scheduling onboarding calls and support calls with clients
- **Setup:** Connect your Google Calendar. Set availability to match your working hours.

---

## 3. Common Workflows

### 3.1 New Client Onboarding

**Trigger:** New subscription created in Stripe (you will receive a Telegram alert)

**Steps:**
1. Open the admin panel and verify the new client record was created automatically
2. Review the client's subscription tier and confirm which services should be activated
3. Send the welcome email (use Template W-1 below) within 1 hour of signup
4. Schedule an onboarding call within 48 hours via Calendly
5. Before the call, prepare:
   - Review their website (if they have one)
   - Look up their Google Business Profile
   - Check their current Google/Yelp reviews
   - Note their subscription tier and which services to cover
6. During the onboarding call (30 minutes):
   - Introduce yourself and confirm their business details
   - Walk through the dashboard (screenshare)
   - Collect any needed access (Google Business Profile admin, ad accounts, branding assets)
   - Set expectations: "Services will begin activating within 24-48 hours"
   - Ask about their top 3 priorities
7. After the call:
   - Update the client record in admin with notes from the call
   - Initiate service activation per the onboarding SOP
   - Send follow-up email (Template W-2) with next steps
   - Set a 7-day reminder to check in on service activation status

### 3.2 Service Troubleshooting

**Trigger:** Client reports a service is not working correctly

**Steps:**
1. Identify which service is affected
2. Check the admin panel service health for that client
3. Check Sentry for related errors (search by client ID)
4. For each service type, follow these diagnostic steps:

**AI Reputation Manager issues:**
- Check if Google Business Profile access is still valid
- Review recent auto-generated responses for quality
- Verify the review monitoring cron job ran successfully

**AI Ads issues (Google/Meta):**
- Check if the ad account is still connected
- Review campaign spend vs. budget
- Check for policy violations or disapproved ads
- Verify the optimization cron job ran

**AI Phone Agent issues:**
- Check Twilio call logs for the client's number
- Listen to recent call recordings for quality
- Verify the phone agent configuration (greeting, hours, routing)

**Email/SMS issues:**
- Check SendGrid delivery logs
- Look for bounces or blocks
- Verify the client's domain authentication is active
- Check Twilio SMS logs for delivery status

5. If you can resolve the issue, do so and notify the client
6. If you cannot resolve it, escalate per Section 4

### 3.3 Billing Questions

**Trigger:** Client asks about charges, invoices, or subscription changes

**Steps:**
1. Look up the client in Stripe
2. For billing inquiries:
   - Pull up their invoice history
   - Explain each line item clearly
   - If there is an incorrect charge, issue a refund (up to $100) or escalate for larger amounts
3. For subscription changes:
   - Upgrades: Process immediately in Stripe, activate new services in admin
   - Downgrades: Process at end of current billing period, note which services will be deactivated
   - Cancellations: Follow the cancellation workflow:
     a. Ask the reason for cancellation (log it)
     b. Offer a 1-month discount if appropriate (check with founder first)
     c. If proceeding, schedule cancellation for end of billing period
     d. Send cancellation confirmation email (Template B-3)

---

## 4. Escalation Paths

### Escalation Tiers

| Tier | Owner | Response Time | Examples |
|------|-------|--------------|----------|
| **L1 - Support** | You | 2 hours | Password resets, dashboard questions, billing lookups, basic config |
| **L2 - Support (Complex)** | You + Founder | 4 hours | Service quality issues, multi-service problems, client retention risks |
| **L3 - Engineering** | Engineering | 8 hours (24h for non-critical) | Bugs, API failures, data issues, infrastructure problems |
| **L4 - Critical** | Founder + Engineering | 1 hour | Service outage affecting multiple clients, data breach, payment system failure |

### How to Escalate

**To Founder (L2):**
- Slack DM in #support with: Client name, issue summary, what you have tried, your recommendation
- Tag with urgency: LOW / MEDIUM / HIGH

**To Engineering (L3):**
- Create a ticket in the #engineering Slack channel with:
  - Client ID
  - Service affected
  - Steps to reproduce
  - Sentry error link (if applicable)
  - Screenshots or logs
  - Client impact (how many clients affected, revenue at risk)

**Critical (L4):**
- Telegram message to the alerts channel immediately
- Slack message in #engineering with @channel tag
- Call the founder directly if no response within 15 minutes

### What NOT to Escalate
- Questions you can answer by reading the docs
- Billing lookups (use Stripe)
- Password resets (use admin panel)
- "How do I..." questions from clients (walk them through it)

---

## 5. Communication Templates

### Email Templates

**Template W-1: Welcome Email**
```
Subject: Welcome to Sovereign AI - Let's Get Started

Hi [Client Name],

Welcome to Sovereign AI! I'm [Your Name], your support specialist, and I'll be
your main point of contact.

Here's what happens next:

1. I'll schedule a 30-minute onboarding call with you in the next 48 hours
2. During that call, we'll walk through your dashboard and configure your services
3. Within 24-48 hours after the call, your AI services will begin activating

In the meantime, you can log into your dashboard at:
https://trysovereignai.com/dashboard

Your login email is: [client email]

If you have any questions before our call, reply to this email or reach out at
support@trysovereignai.com.

Looking forward to helping your business grow.

Best,
[Your Name]
Sovereign AI Support
```

**Template W-2: Post-Onboarding Follow-Up**
```
Subject: Your Sovereign AI Services Are Being Activated

Hi [Client Name],

Great talking with you today! Here's a summary of what we discussed and next steps:

Services being activated:
[List services from their tier]

What I need from you:
- [List any pending items: GBP access, ad account access, logo files, etc.]

Timeline:
- Services will begin activating within 24-48 hours
- You'll receive an email notification as each service goes live
- I'll check in with you in one week to review initial performance

Your dashboard: https://trysovereignai.com/dashboard

If anything comes up before then, reply to this email or reach me at
support@trysovereignai.com.

Best,
[Your Name]
```

**Template B-3: Cancellation Confirmation**
```
Subject: Your Sovereign AI Subscription - Cancellation Confirmed

Hi [Client Name],

This confirms that your Sovereign AI subscription has been scheduled for
cancellation at the end of your current billing period on [date].

You will continue to have access to all services until [date]. After that:
- Your dashboard will switch to read-only mode for 30 days
- Data exports will be available during that period
- AI services will be deactivated

If you change your mind before [date], just reply to this email and we'll
keep your account active.

We appreciate your time with Sovereign AI and wish you the best.

Best,
[Your Name]
```

**Template S-1: Issue Acknowledged**
```
Subject: Re: [Original Subject] - We're On It

Hi [Client Name],

Thanks for reaching out. I've received your report about [brief issue summary]
and I'm looking into it now.

I'll have an update for you within [timeframe based on severity].

If this is urgent, you can also reach me at support@trysovereignai.com.

Best,
[Your Name]
```

**Template S-2: Issue Resolved**
```
Subject: Re: [Original Subject] - Resolved

Hi [Client Name],

Good news -- the issue with [brief description] has been resolved.

What happened: [1-2 sentence explanation]
What we did: [1-2 sentence fix description]

Everything should be working normally now. Please let me know if you see
anything else unusual.

Best,
[Your Name]
```

### Slack Templates

**Engineering Escalation:**
```
:rotating_light: Support Escalation - [L3/L4]

Client: [Name] (ID: [client_id])
Tier: [DIY/Starter/Growth/Empire]
Service: [affected service]
Issue: [1-2 sentence description]
Steps to reproduce: [numbered list]
Sentry: [link if applicable]
Impact: [number of clients affected, revenue at risk]
Attempted: [what you already tried]
```

**Weekly Support Summary (posted in #support):**
```
:bar_chart: Weekly Support Summary - Week of [date]

Tickets: [total] ([resolved] resolved, [open] open)
Avg Response Time: [X hours]
Avg Resolution Time: [X hours]
New Clients Onboarded: [count]

Top Issues:
1. [issue] - [count] tickets
2. [issue] - [count] tickets
3. [issue] - [count] tickets

Escalations: [count] (L2: [x], L3: [x])
Client Feedback: [notable positive/negative]
Action Items: [list any]
```

---

## 6. Weekly Reporting

Every Friday by 3 PM CT, compile and post the weekly support summary in #support on Slack.

### Metrics to Track

| Metric | Target | How to Measure |
|--------|--------|---------------|
| First response time | < 2 hours | Average time from ticket creation to first response |
| Resolution time | < 24 hours (L1), < 48 hours (L2) | Average time from ticket creation to resolution |
| Ticket volume | Track trend | Total tickets opened this week |
| Client satisfaction | > 4.5/5 | Post-resolution survey (if implemented) |
| Onboarding completion | 100% within 48 hours | New signups vs. completed onboarding calls |
| Escalation rate | < 15% of tickets | Tickets escalated to L2+ / total tickets |

### Monthly Report (due first Monday of each month)

In addition to the weekly metrics, the monthly report includes:
- Churn risk clients (anyone who submitted 3+ tickets or expressed frustration)
- Feature requests ranked by frequency
- Support playbook updates needed
- Recommendations for process improvements
- MRR at risk from unhappy clients

---

## 7. 30-Day Training Plan

### Week 1: Learn the Platform (Days 1-7)

**Day 1 -- Setup & Orientation**
- [ ] Complete all tool access setup (Section 2)
- [ ] Read the full Support Playbook (`docs/SUPPORT-PLAYBOOK.md`)
- [ ] Read the Client Onboarding SOP (`docs/CLIENT-ONBOARDING-SOP.md`)
- [ ] Read the Architecture doc (`docs/ARCHITECTURE.md`)
- [ ] Shadow a founder-led onboarding call (recording)

**Day 2 -- Dashboard Deep Dive**
- [ ] Create a test client account in staging
- [ ] Walk through every section of the client dashboard
- [ ] Document any questions or confusion points
- [ ] Review 10 recent client support tickets (read-only)

**Day 3 -- Admin Panel Mastery**
- [ ] Learn to navigate the admin panel: client list, service health, ticket queue
- [ ] Practice looking up client records
- [ ] Practice checking service health status
- [ ] Learn to update client configurations

**Day 4 -- Billing & Stripe**
- [ ] Learn to look up a client in Stripe
- [ ] Understand subscription tiers, billing cycles, proration
- [ ] Practice reading invoice details
- [ ] Learn the refund process (in test mode)

**Day 5 -- Service Deep Dives (Part 1)**
- [ ] AI Reputation Manager: how it works, common issues, configuration
- [ ] AI SEO Optimizer: how it works, common issues, content review process
- [ ] AI Google Ads Manager: how campaigns are structured, optimization cycles
- [ ] AI Email Marketing: templates, send schedules, deliverability

**Day 6 -- Service Deep Dives (Part 2)**
- [ ] AI Phone Agent: call flow, Twilio integration, common misconfigurations
- [ ] AI Chat Widget: installation, customization, lead routing
- [ ] AI Meta Ads Manager: campaign structure, audience targeting
- [ ] AI Social Media Manager: content calendar, approval flow

**Day 7 -- Service Deep Dives (Part 3)**
- [ ] AI SMS Marketing, Lead Scoring, CRM, Scheduling
- [ ] AI Invoice & Payments, Reporting Dashboard, Competitor Monitor, Website Builder
- [ ] Review the Monitoring doc (`docs/MONITORING.md`)
- [ ] Review the Runbook (`docs/RUNBOOK.md`)

**Week 1 Milestone:** You can navigate all tools, explain each of the 16 services, and describe common issues for each.

---

### Week 2: Shadow & Practice (Days 8-14)

**Day 8-9 -- Shadow Live Support**
- [ ] Shadow the founder handling live support tickets (screen share)
- [ ] Take notes on tone, troubleshooting approach, and communication style
- [ ] Ask questions after each ticket

**Day 10-11 -- Supervised Ticket Handling**
- [ ] Handle 5 tickets per day with founder review before sending responses
- [ ] Practice using the communication templates
- [ ] Get feedback on response quality, tone, and accuracy

**Day 12 -- Onboarding Call Practice**
- [ ] Conduct a mock onboarding call with the founder as the "client"
- [ ] Get feedback on pacing, clarity, and coverage
- [ ] Revise your call script/notes based on feedback

**Day 13-14 -- Increasing Independence**
- [ ] Handle tickets independently (founder reviews at end of day)
- [ ] Conduct your first real onboarding call (founder shadows)
- [ ] Begin tracking your own metrics

**Week 2 Milestone:** You can handle L1 tickets independently and conduct an onboarding call with minimal support.

---

### Week 3: Independent Operations (Days 15-21)

**Day 15-17 -- Full Ticket Ownership**
- [ ] Handle all incoming tickets independently
- [ ] Escalate appropriately (founder reviews escalations, not every ticket)
- [ ] Complete at least 2 real onboarding calls independently

**Day 18-19 -- Troubleshooting Depth**
- [ ] Practice diagnosing issues using Sentry
- [ ] Practice cross-referencing SendGrid/Twilio logs with client reports
- [ ] Handle at least one L2 issue with founder guidance

**Day 20-21 -- Process Improvement**
- [ ] Identify 3 common questions that could be answered with better documentation
- [ ] Draft FAQ entries or help articles for those topics
- [ ] Submit your first weekly support summary

**Week 3 Milestone:** You are handling all L1 tickets and onboarding calls independently. Escalations are appropriate and well-documented.

---

### Week 4: Full Autonomy (Days 22-30)

**Day 22-25 -- Ownership**
- [ ] Full ownership of support queue with no daily review
- [ ] Handle L1 and simple L2 issues independently
- [ ] Conduct all onboarding calls
- [ ] Proactively reach out to at-risk clients

**Day 26-28 -- Optimization**
- [ ] Analyze your ticket data: what are the top 5 issues?
- [ ] Propose 2 process improvements based on your observations
- [ ] Update the support playbook with any new issues and solutions you have documented

**Day 29-30 -- 30-Day Review**
- [ ] Compile your 30-day metrics
- [ ] Prepare a summary of: tickets handled, avg response time, onboarding calls completed, escalations, process improvements proposed
- [ ] Meet with founder for 30-day review
- [ ] Set goals for next 60 days

**Week 4 Milestone:** You are fully autonomous on all L1 and L2 support. The founder is only involved in L3+ escalations and strategic decisions.

---

## Quick Reference Card

| Situation | Action |
|-----------|--------|
| New client signed up | Send welcome email within 1 hour, schedule onboarding within 48 hours |
| Client emails with question | Respond within 2 hours during business hours |
| Service appears down | Check admin panel health, check Sentry, escalate if confirmed |
| Client wants to cancel | Log reason, offer retention if appropriate, process at end of billing period |
| Client wants to upgrade | Process immediately, activate new services |
| You are unsure how to answer | Check docs first, then ask in #support on Slack |
| Multiple clients report same issue | Escalate as L4 immediately |
| Client is angry | Acknowledge, empathize, resolve quickly, follow up personally |
