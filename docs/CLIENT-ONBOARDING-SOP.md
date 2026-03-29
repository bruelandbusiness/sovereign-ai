# Client Onboarding Standard Operating Procedure

> **Last Updated:** [PLACEHOLDER — DATE]
> **Owner:** [PLACEHOLDER — CLIENT SUCCESS MANAGER]
> **Review Cadence:** Monthly

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Onboarding Checklist](#pre-onboarding-checklist)
3. [Day 0: Account Setup](#day-0-account-setup)
4. [Day 1: Welcome & Orientation](#day-1-welcome--orientation)
5. [Service Activation Verification](#service-activation-verification)
6. [First-Week Check-In](#first-week-check-in)
7. [30-Day Review](#30-day-review)
8. [Escalation Procedures](#escalation-procedures)
9. [Templates](#templates)

---

## Overview

This SOP ensures every new client receives a consistent, high-quality onboarding experience. The goal is to achieve **Time to First Value (TTFV) within 48 hours** of contract signature.

### Onboarding Timeline

| Milestone | Timeframe | Owner |
|---|---|---|
| Contract signed | Day 0 | Sales |
| Account provisioned | Day 0 (within 2 hours) | Operations |
| Welcome call | Day 1 | Client Success |
| Service activation verified | Day 1-2 | Technical Support |
| First-week check-in | Day 5-7 | Client Success |
| 30-day review | Day 30 | Client Success + Account Manager |

---

## Pre-Onboarding Checklist

Complete before the client's start date.

### Sales Handoff

- [ ] Signed contract / MSA received and filed
- [ ] Selected service bundle documented: [ ] Starter / [ ] Growth / [ ] Enterprise
- [ ] Payment method on file (Stripe customer created)
- [ ] Client contact information collected:
  - Primary contact: [PLACEHOLDER]
  - Billing contact: [PLACEHOLDER]
  - Technical contact: [PLACEHOLDER]
- [ ] Special requirements or customizations noted
- [ ] Sales-to-Success handoff meeting completed
- [ ] CRM record updated with onboarding status

### Technical Preparation

- [ ] Client organization created in platform
- [ ] User accounts provisioned for all designated users
- [ ] Service tier limits configured per contract
- [ ] Custom domain configured (if applicable): [PLACEHOLDER]
- [ ] API keys generated (if applicable)
- [ ] Integration requirements documented
- [ ] Data migration plan prepared (if applicable)

### Materials Prepared

- [ ] Welcome email drafted (see template below)
- [ ] Onboarding deck customized for client's bundle
- [ ] Training schedule proposed
- [ ] Knowledge base access configured

---

## Day 0: Account Setup

**Owner:** Operations Team
**SLA:** Complete within 2 hours of contract signature

### Steps

1. **Create client organization**
   ```
   Platform → Admin → Organizations → Create New
   - Organization name: [CLIENT NAME]
   - Plan: [STARTER / GROWTH / ENTERPRISE]
   - Billing email: [CLIENT BILLING EMAIL]
   ```

2. **Provision user accounts**
   - Create accounts for all designated users
   - Set appropriate roles (Admin, Manager, Member)
   - Send invitation emails

3. **Configure services per bundle**

   | Service | Starter | Growth | Enterprise |
   |---|---|---|---|
   | AI Automation Suite | Basic | Advanced | Full |
   | Client Portal | Standard | Branded | Custom |
   | Analytics Dashboard | Basic | Advanced | Custom + API |
   | Email Campaigns | 1,000/mo | 10,000/mo | Unlimited |
   | SMS Notifications | 500/mo | 5,000/mo | Unlimited |
   | Support Level | Email | Email + Chat | Dedicated CSM |
   | API Access | -- | Standard | Premium |

4. **Verify billing**
   - Confirm Stripe subscription is active
   - Verify correct pricing tier
   - Set billing cycle start date

5. **Send welcome email** (see template below)

---

## Day 1: Welcome & Orientation

**Owner:** Client Success Manager
**Duration:** 45-60 minutes

### Welcome Call Agenda

1. **Introductions** (5 min)
   - Introduce the client success team
   - Confirm key contacts on both sides

2. **Platform Walkthrough** (20 min)
   - Dashboard overview
   - Key features relevant to their bundle
   - Navigation and core workflows

3. **Goal Setting** (10 min)
   - What does success look like in 30/60/90 days?
   - Document 3 specific, measurable goals
   - Identify KPIs to track

4. **Training Plan** (10 min)
   - Review available training resources
   - Schedule follow-up training sessions
   - Share knowledge base and documentation links

5. **Q&A and Next Steps** (10 min)
   - Address immediate questions
   - Confirm first-week check-in date
   - Share support contact information

### Post-Call Actions

- [ ] Send meeting summary email within 2 hours
- [ ] Create onboarding project in project management tool
- [ ] Document client goals in CRM
- [ ] Schedule first-week check-in
- [ ] Assign any open action items

---

## Service Activation Verification

**Owner:** Technical Support
**SLA:** Complete within 24 hours of account provisioning

### Verification Checklist

#### Account Access
- [ ] Client admin can log in successfully
- [ ] All invited users received and accepted invitations
- [ ] Role-based permissions working correctly
- [ ] MFA configured (required for Enterprise tier)

#### Core Services
- [ ] Dashboard loads with correct data
- [ ] AI automation features accessible per tier
- [ ] Client portal configured and accessible
- [ ] Custom branding applied (if applicable)

#### Communication Services
- [ ] Email integration active
  - [ ] Send test email → Delivered successfully
  - [ ] Sender domain verified (SPF, DKIM, DMARC)
- [ ] SMS integration active
  - [ ] Send test SMS → Delivered successfully
  - [ ] Phone number verified

#### Billing & Payments
- [ ] Stripe subscription status: Active
- [ ] Correct plan and pricing confirmed
- [ ] Invoice generation working
- [ ] Payment method valid

#### Integrations (if applicable)
- [ ] API keys working — test with: `curl -H "Authorization: Bearer [KEY]" [API_URL]/health`
- [ ] Webhook endpoints configured and responding
- [ ] Third-party integrations connected and syncing
- [ ] Data import completed and verified

### Verification Sign-Off

| Item | Status | Verified By | Date |
|---|---|---|---|
| Account Access | [ ] Pass / [ ] Fail | [PLACEHOLDER] | [PLACEHOLDER] |
| Core Services | [ ] Pass / [ ] Fail | [PLACEHOLDER] | [PLACEHOLDER] |
| Communications | [ ] Pass / [ ] Fail | [PLACEHOLDER] | [PLACEHOLDER] |
| Billing | [ ] Pass / [ ] Fail | [PLACEHOLDER] | [PLACEHOLDER] |
| Integrations | [ ] Pass / [ ] Fail | [PLACEHOLDER] | [PLACEHOLDER] |

---

## First-Week Check-In

**Owner:** Client Success Manager
**Timing:** Day 5-7 after onboarding
**Duration:** 30 minutes

### Check-In Template

#### Pre-Call Preparation
- [ ] Review platform usage analytics for the client
- [ ] Check support ticket history
- [ ] Review activation verification results
- [ ] Prepare usage summary

#### Agenda

1. **Usage Review** (10 min)
   - How has the first week been?
   - Which features have you used most?
   - Any features you haven't explored yet?

2. **Issue Resolution** (10 min)
   - Any blockers or challenges encountered?
   - Review and resolve any open support tickets
   - Technical issues to escalate?

3. **Quick Wins** (5 min)
   - Highlight a feature or workflow they may have missed
   - Share a relevant tip or best practice

4. **Next Steps** (5 min)
   - Action items for both sides
   - Confirm 30-day review date
   - Remind of support channels

#### Post-Call Actions
- [ ] Send summary email with action items
- [ ] Update CRM with check-in notes
- [ ] Escalate any unresolved technical issues
- [ ] Schedule additional training if needed

#### Health Score Assessment (Week 1)

| Metric | Target | Actual | Status |
|---|---|---|---|
| Logins (7 days) | >= 5 | [PLACEHOLDER] | [GREEN/YELLOW/RED] |
| Features activated | >= 50% of tier | [PLACEHOLDER] | [GREEN/YELLOW/RED] |
| Support tickets | <= 3 | [PLACEHOLDER] | [GREEN/YELLOW/RED] |
| User satisfaction (1-5) | >= 4 | [PLACEHOLDER] | [GREEN/YELLOW/RED] |

---

## 30-Day Review

**Owner:** Client Success Manager + Account Manager
**Duration:** 45 minutes

### 30-Day Review Template

#### Pre-Review Preparation
- [ ] Pull 30-day usage analytics report
- [ ] Review all support interactions
- [ ] Calculate ROI metrics against stated goals
- [ ] Prepare renewal/expansion talking points (if applicable)

#### Agenda

1. **Goal Progress Review** (15 min)

   | Goal (set during onboarding) | Target | Actual | Status |
   |---|---|---|---|
   | [PLACEHOLDER — Goal 1] | [PLACEHOLDER] | [PLACEHOLDER] | [ON TRACK / AT RISK / BEHIND] |
   | [PLACEHOLDER — Goal 2] | [PLACEHOLDER] | [PLACEHOLDER] | [ON TRACK / AT RISK / BEHIND] |
   | [PLACEHOLDER — Goal 3] | [PLACEHOLDER] | [PLACEHOLDER] | [ON TRACK / AT RISK / BEHIND] |

2. **Platform Adoption** (10 min)

   | Metric | Target | Actual |
   |---|---|---|
   | Active users / Total users | >= 80% | [PLACEHOLDER] |
   | Daily active usage | >= 60% of business days | [PLACEHOLDER] |
   | Features utilized | >= 70% of tier | [PLACEHOLDER] |
   | Automation workflows created | >= [PLACEHOLDER] | [PLACEHOLDER] |
   | Client satisfaction (NPS) | >= 8 | [PLACEHOLDER] |

3. **Value Delivered** (10 min)
   - Time saved per week: [PLACEHOLDER] hours
   - Revenue impact: $[PLACEHOLDER]
   - Process improvements identified: [PLACEHOLDER]
   - Key wins to highlight

4. **Forward Planning** (10 min)
   - 60/90-day goals
   - Feature requests or enhancements
   - Training needs
   - Expansion opportunities (upsell discussion if appropriate)
   - Identify client champion for case study / testimonial

#### Post-Review Actions
- [ ] Send 30-day review report to client
- [ ] Update CRM with review outcomes
- [ ] Create action plan for any "At Risk" goals
- [ ] Schedule 60-day check-in (or quarterly cadence)
- [ ] Flag expansion opportunities to Account Manager
- [ ] Request testimonial if satisfaction score >= 8

---

## Escalation Procedures

### Escalation Triggers

| Trigger | Severity | Escalation Path |
|---|---|---|
| Client cannot access platform | High | Technical Support → Engineering (15 min) |
| Billing discrepancy | Medium | Client Success → Finance (4 hours) |
| Service not performing as sold | High | Client Success → Account Manager → VP Sales (24 hours) |
| Client threatens cancellation | Critical | Client Success → Account Manager → VP CS (1 hour) |
| Data loss or security concern | Critical | Technical Support → Engineering → CTO (immediate) |
| Integration failure | Medium | Technical Support → Engineering (4 hours) |
| Missed SLA | High | Client Success → Operations Manager (2 hours) |

### Escalation Process

1. **Document** — Record the issue, impact, and steps taken in the CRM
2. **Notify** — Alert the next escalation level via Slack + email
3. **Own** — Original assignee remains the client's point of contact
4. **Update** — Provide client updates every [PLACEHOLDER — e.g., 2 hours / 4 hours]
5. **Resolve** — Confirm resolution with client and document root cause
6. **Prevent** — Create action item to prevent recurrence

---

## Templates

### Welcome Email Template

```
Subject: Welcome to [COMPANY NAME] — Your Account is Ready!

Hi [CLIENT FIRST NAME],

Welcome to [COMPANY NAME]! We're excited to have [CLIENT COMPANY] on board.

Your account has been set up and is ready to go:

  - Login URL: [PLACEHOLDER — APP URL]
  - Your username: [CLIENT EMAIL]
  - Temporary password: [SET VIA INVITATION LINK]

Your plan: [STARTER / GROWTH / ENTERPRISE]

Here's what happens next:
  1. Log in and explore your dashboard
  2. Join your welcome call on [DATE] at [TIME] — [CALENDAR LINK]
  3. Check out our getting started guide: [PLACEHOLDER — DOCS URL]

Your dedicated Client Success Manager is [CSM NAME] ([CSM EMAIL]).
Don't hesitate to reach out with any questions.

We look forward to helping [CLIENT COMPANY] achieve [STATED GOAL].

Best,
[CSM NAME]
[COMPANY NAME]
```

### First-Week Check-In Email Template

```
Subject: Week 1 Check-In — How's Everything Going?

Hi [CLIENT FIRST NAME],

It's been a week since you started with [COMPANY NAME]!
Here's a quick summary of your first week:

  - Logins: [X] times
  - Features activated: [X] of [Y]
  - Support tickets: [X]

During our call, we discussed:
  - [KEY DISCUSSION POINT 1]
  - [KEY DISCUSSION POINT 2]

Action items:
  - [ACTION 1 — OWNER — DUE DATE]
  - [ACTION 2 — OWNER — DUE DATE]

Your 30-day review is scheduled for [DATE].

Best,
[CSM NAME]
```

### 30-Day Review Summary Email Template

```
Subject: Your 30-Day Review Summary — [CLIENT COMPANY]

Hi [CLIENT FIRST NAME],

Thank you for a great 30-day review! Here's a summary:

GOAL PROGRESS:
  - [GOAL 1]: [STATUS]
  - [GOAL 2]: [STATUS]
  - [GOAL 3]: [STATUS]

KEY METRICS:
  - Active users: [X] / [Y] ([Z]%)
  - Time saved: ~[X] hours/week
  - Satisfaction score: [X] / 5

NEXT STEPS:
  - [ACTION 1 — OWNER — DUE DATE]
  - [ACTION 2 — OWNER — DUE DATE]
  - Next review: [DATE]

Thank you for your partnership. We're committed to making sure
[CLIENT COMPANY] gets the most out of [COMPANY NAME].

Best,
[CSM NAME]
```
