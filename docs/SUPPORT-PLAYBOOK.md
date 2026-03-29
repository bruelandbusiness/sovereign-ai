# Support Playbook

> **Last Updated:** [PLACEHOLDER — DATE]
> **Owner:** [PLACEHOLDER — HEAD OF SUPPORT]
> **Review Cadence:** Monthly

---

## Table of Contents

1. [Support Tiers and Responsibilities](#support-tiers-and-responsibilities)
2. [SLA Definitions](#sla-definitions)
3. [Common Issues and Resolutions](#common-issues-and-resolutions)
4. [Escalation Procedures](#escalation-procedures)
5. [Communication Templates](#communication-templates)
6. [Tools and Access](#tools-and-access)

---

## Support Tiers and Responsibilities

| Tier | Role | Scope | Tools |
|---|---|---|---|
| **L1 — Front Line** | Support Agent | Account access, billing questions, known issues, FAQ, basic troubleshooting | Help desk, CRM, knowledge base |
| **L2 — Technical** | Senior Support / Support Engineer | Complex technical issues, integration troubleshooting, configuration, data queries | Platform admin, database read access, logs |
| **L3 — Engineering** | Software Engineer / DevOps | Bug fixes, infrastructure issues, code-level investigation, hotfixes | Full codebase, production access, monitoring |

### Tier Capabilities

**L1 Can:**
- Reset passwords and unlock accounts
- Explain billing and invoices
- Walk clients through documented features
- Apply known fixes from the knowledge base
- Update client records in CRM

**L2 Can:**
- Access server logs and application logs
- Run diagnostic queries on client data
- Modify client configuration settings
- Troubleshoot API and integration issues
- Create workarounds for known bugs

**L3 Can:**
- Deploy hotfixes to production
- Access and modify production databases
- Investigate and fix application code
- Resolve infrastructure and scaling issues
- Implement permanent fixes for recurring issues

---

## SLA Definitions

### Response Time SLAs

| Priority | Description | First Response | Update Frequency | Resolution Target |
|---|---|---|---|---|
| **P0 — Critical** | Service completely down, data loss, security breach | 15 minutes | Every 30 minutes | 4 hours |
| **P1 — High** | Major feature broken, payments affected, significant user impact | 1 hour | Every 2 hours | 8 hours |
| **P2 — Medium** | Non-critical feature issue, workaround available, integration problem | 4 hours | Every 8 hours | 24 hours |
| **P3 — Low** | Minor UI issue, feature request, documentation question | 8 hours | Daily | 72 hours |
| **P4 — Informational** | General inquiry, feedback, enhancement suggestion | 24 hours | As needed | 5 business days |

### SLA by Client Tier

| Metric | Starter | Growth | Enterprise |
|---|---|---|---|
| Support channels | Email | Email + Chat | Email + Chat + Phone + Dedicated CSM |
| Support hours | Business hours (9-5 ET) | Extended (8-8 ET) | 24/7 |
| P0 first response | 1 hour | 30 minutes | 15 minutes |
| P1 first response | 4 hours | 2 hours | 1 hour |
| Dedicated CSM | No | No | Yes |
| Quarterly reviews | No | Yes | Yes (monthly) |

### SLA Breach Protocol

1. **Automated alert** fires when SLA threshold is at 75%
2. **Ticket auto-escalated** to next tier at 90% of SLA
3. **Manager notified** when SLA breached
4. **Client receives** proactive communication acknowledging delay
5. **Post-breach review** conducted within 24 hours
6. **SLA credit applied** per contract terms (see SLA-TEMPLATE.md)

---

## Common Issues and Resolutions

### Issue 1: Client Cannot Log In

**Symptoms:** Login page shows "Invalid credentials" or account locked message.

**Diagnosis:**
1. Verify the email address exists in the system
2. Check if account is locked (> 5 failed attempts)
3. Confirm email invitation was accepted
4. Check for SSO configuration issues (Enterprise)

**Resolution:**
- **Wrong password:** Send password reset link via platform admin
- **Account locked:** Unlock via Admin → Users → [User] → Unlock Account
- **Invitation not accepted:** Resend invitation email
- **SSO issue:** Escalate to L2 for IdP configuration review

**Tier:** L1

---

### Issue 2: Stripe Payment Failing

**Symptoms:** Client reports subscription charge declined or checkout fails.

**Diagnosis:**
1. Check Stripe Dashboard → Payments for the specific charge
2. Review decline code (e.g., `insufficient_funds`, `card_declined`, `expired_card`)
3. Verify webhook delivery status in Stripe → Webhooks

**Resolution:**
- **Card declined:** Ask client to update payment method in billing settings
- **Webhook failure:** Check Vercel function logs; retry webhook from Stripe dashboard
- **Subscription stuck:** Manually sync subscription status: Admin → Billing → Sync
- **Currency mismatch:** Verify Stripe account currency settings

**Tier:** L1 (card issues) / L2 (webhook/sync issues)

---

### Issue 3: Emails Not Being Delivered

**Symptoms:** Client or their customers not receiving notification emails.

**Diagnosis:**
1. Check SendGrid Activity Feed for the recipient email
2. Look for bounces, blocks, or spam reports
3. Verify sender domain authentication (SPF, DKIM, DMARC)
4. Check if recipient is on the suppression list

**Resolution:**
- **Bounced:** Verify recipient email address; remove from suppression list if corrected
- **Blocked by ISP:** Review email content for spam triggers; contact SendGrid support
- **Domain not authenticated:** Guide client through DNS verification
- **Suppression list:** Remove valid addresses from SendGrid suppressions

**Tier:** L1 (basic) / L2 (domain/deliverability issues)

---

### Issue 4: SMS Not Sending

**Symptoms:** SMS notifications not reaching recipients.

**Diagnosis:**
1. Check Twilio Console → Messages for delivery status
2. Verify phone number format (E.164: +1XXXXXXXXXX)
3. Check Twilio account balance
4. Review message content for carrier filtering

**Resolution:**
- **Invalid number format:** Correct to E.164 format
- **Account balance low:** Alert finance team to add funds
- **Carrier filtered:** Shorten message, remove URLs, register for A2P 10DLC
- **Number unsubscribed:** Recipient must re-opt-in via STOP/START

**Tier:** L1 (format issues) / L2 (carrier/compliance issues)

---

### Issue 5: Dashboard Loading Slowly or Timing Out

**Symptoms:** Dashboard takes > 5 seconds to load or shows timeout errors.

**Diagnosis:**
1. Check application monitoring (Vercel Analytics / Sentry)
2. Review database query performance (slow query log)
3. Check if issue is user-specific or platform-wide
4. Verify client's data volume isn't exceeding tier limits

**Resolution:**
- **User-specific:** Clear browser cache, try incognito mode, check internet connection
- **Data volume:** Optimize queries or upgrade client tier
- **Platform-wide:** Escalate to L3 immediately (potential infrastructure issue)
- **Database:** Escalate to L2 for query optimization

**Tier:** L1 (user-specific) / L2 (data) / L3 (platform-wide)

---

### Issue 6: AI Automation Not Producing Expected Results

**Symptoms:** AI-generated content is low quality, irrelevant, or erroring.

**Diagnosis:**
1. Review the automation configuration and prompts
2. Check AI API status (OpenAI / Anthropic status pages)
3. Verify API keys are valid and have sufficient quota
4. Review input data quality

**Resolution:**
- **Poor output quality:** Guide client on prompt engineering best practices
- **API errors:** Check API key validity; rotate if needed
- **Rate limited:** Adjust automation frequency; upgrade API tier
- **Unexpected behavior:** Collect examples and escalate to L2 for investigation

**Tier:** L1 (guidance) / L2 (configuration) / L3 (bug investigation)

---

### Issue 7: Data Import/Export Failures

**Symptoms:** CSV import fails, export generates empty file, or data appears corrupted.

**Diagnosis:**
1. Verify file format (UTF-8 CSV, correct headers)
2. Check file size against limits (Starter: 5MB, Growth: 50MB, Enterprise: 500MB)
3. Review import error log for specific row failures
4. Confirm required fields are populated

**Resolution:**
- **Format error:** Provide CSV template with correct headers
- **File too large:** Split file or upgrade tier
- **Row failures:** Export error report showing failing rows with reasons
- **Export empty:** Check date range filters; verify data exists

**Tier:** L1 (format/guidance) / L2 (data investigation)

---

### Issue 8: Integration Connection Lost

**Symptoms:** Third-party integration (CRM, calendar, etc.) stops syncing.

**Diagnosis:**
1. Check integration status in platform settings
2. Verify OAuth tokens haven't expired
3. Check third-party service status
4. Review webhook delivery logs

**Resolution:**
- **Token expired:** Guide client to reconnect (disconnect → reconnect flow)
- **Third-party outage:** Monitor and notify client when restored
- **Webhook misconfigured:** Verify endpoint URL; reconfigure if needed
- **Permissions changed:** Re-authorize with required scopes

**Tier:** L1 (reconnect) / L2 (webhook/permission issues)

---

### Issue 9: Incorrect Invoice or Billing Amount

**Symptoms:** Client charged wrong amount, duplicate charge, or missing credits.

**Diagnosis:**
1. Pull invoice from Stripe Dashboard
2. Compare with contract terms and pricing tier
3. Check for proration from mid-cycle plan changes
4. Review coupon/discount codes applied

**Resolution:**
- **Overcharge:** Issue refund or credit via Stripe; notify finance
- **Proration confusion:** Explain proration calculation to client
- **Duplicate charge:** Refund duplicate; investigate subscription webhook
- **Missing discount:** Apply coupon retroactively; issue credit if applicable

**Tier:** L1 (explain) / L2 (refunds/credits, requires finance approval)

---

### Issue 10: Client Portal Not Displaying Correctly

**Symptoms:** Branding wrong, layout broken, or content not showing for end users.

**Diagnosis:**
1. Check portal configuration in admin settings
2. Verify custom domain DNS is resolving correctly
3. Test in multiple browsers and devices
4. Check if SSL certificate is valid

**Resolution:**
- **Branding wrong:** Re-upload logo/colors in portal settings; clear CDN cache
- **Layout broken:** Check for custom CSS conflicts; revert to default theme
- **Content missing:** Verify content is published, not draft
- **SSL error:** Re-provision certificate via platform settings

**Tier:** L1 (configuration) / L2 (DNS/SSL issues)

---

### Issue 11: Webhook Delivery Failures

**Symptoms:** Incoming or outgoing webhooks showing failed status.

**Diagnosis:**
1. Check webhook logs for HTTP status codes
2. Verify endpoint URL is correct and reachable
3. Check if receiving server is returning errors
4. Verify webhook signing secret matches

**Resolution:**
- **404 errors:** Correct endpoint URL
- **401/403 errors:** Update authentication credentials/signing secret
- **500 errors:** Issue on receiving end; contact client's dev team
- **Timeout:** Receiving endpoint too slow; recommend async processing

**Tier:** L2

---

### Issue 12: Account Permissions Not Working Correctly

**Symptoms:** Users can access features they shouldn't, or are blocked from authorized features.

**Diagnosis:**
1. Review user's assigned role in admin panel
2. Check organization-level permission overrides
3. Verify the feature is included in the client's tier
4. Check for recent permission changes

**Resolution:**
- **Wrong role:** Update role assignment in Admin → Users
- **Tier limitation:** Explain feature availability per tier; suggest upgrade
- **Permission cache:** Clear user session; have user log out and back in
- **Bug:** Document expected vs. actual behavior; escalate to L3

**Tier:** L1 (role changes) / L2 (investigation) / L3 (bugs)

---

## Escalation Procedures

### Escalation Flow

```
L1 Support Agent
    │
    ├── Cannot resolve within 30 minutes (P0-P1)
    ├── Cannot resolve within 2 hours (P2-P3)
    ├── Issue requires database or log access
    └── Client specifically requests escalation
         │
         ▼
L2 Senior Support / Support Engineer
    │
    ├── Confirmed software bug
    ├── Infrastructure or scaling issue
    ├── Requires code changes
    └── Cannot resolve within L2 SLA
         │
         ▼
L3 Engineering
    │
    ├── Requires production hotfix
    ├── Security incident
    └── Data loss or corruption
         │
         ▼
Engineering Manager / CTO
```

### Escalation Checklist

When escalating, always include:

- [ ] **Ticket ID** and link
- [ ] **Client name** and tier
- [ ] **Priority level** (P0-P4)
- [ ] **Issue summary** (1-2 sentences)
- [ ] **Steps already taken** (what was tried and failed)
- [ ] **Impact** (number of users affected, revenue impact, etc.)
- [ ] **Reproduction steps** (if applicable)
- [ ] **Screenshots or logs** attached
- [ ] **Client communication status** (what have they been told?)

### Escalation Contacts

| Level | Primary | Backup | Channel |
|---|---|---|---|
| L2 | [PLACEHOLDER] | [PLACEHOLDER] | `#support-escalations` |
| L3 | [PLACEHOLDER] | [PLACEHOLDER] | `#engineering-urgent` |
| Management | [PLACEHOLDER] | [PLACEHOLDER] | Direct message + phone |

---

## Communication Templates

### Initial Response — Acknowledgment

```
Subject: [Ticket #[ID]] We've received your request

Hi [CLIENT NAME],

Thank you for reaching out. We've received your support request and
a team member is reviewing it now.

Ticket: #[TICKET_ID]
Priority: [P0/P1/P2/P3/P4]
Expected response: within [SLA TIME]

If your issue is urgent, you can reach us at:
- Chat: [PLACEHOLDER — CHAT URL]
- Phone: [PLACEHOLDER — PHONE NUMBER] (Enterprise clients)

Best,
[AGENT NAME]
[COMPANY NAME] Support
```

### Status Update — In Progress

```
Subject: [Ticket #[ID]] Update on your request

Hi [CLIENT NAME],

I wanted to give you an update on your support request.

Current status: In Progress
What we've done so far:
  - [ACTION 1]
  - [ACTION 2]

Next steps:
  - [NEXT ACTION — EXPECTED TIMELINE]

We'll continue working on this and update you
by [NEXT UPDATE TIME].

Best,
[AGENT NAME]
```

### Escalation Notification to Client

```
Subject: [Ticket #[ID]] Your request has been escalated

Hi [CLIENT NAME],

To ensure we resolve your issue as quickly as possible, I've
escalated your request to our [senior technical / engineering] team.

What this means:
  - A specialist is now reviewing your case
  - You may be contacted by [ESCALATION CONTACT] for additional details
  - Target resolution: [UPDATED TIMELINE]

Your ticket reference: #[TICKET_ID]

We take this seriously and will keep you updated.

Best,
[AGENT NAME]
```

### Resolution Confirmation

```
Subject: [Ticket #[ID]] Your issue has been resolved

Hi [CLIENT NAME],

Great news — your support request has been resolved.

Issue: [BRIEF DESCRIPTION]
Resolution: [WHAT WAS DONE]
Ticket: #[TICKET_ID]

If the issue reoccurs or you have questions about the resolution,
simply reply to this email and we'll reopen the ticket.

We'd appreciate your feedback on this interaction:
[PLACEHOLDER — SATISFACTION SURVEY LINK]

Best,
[AGENT NAME]
[COMPANY NAME] Support
```

### SLA Breach Apology

```
Subject: [Ticket #[ID]] Our apologies for the delay

Hi [CLIENT NAME],

I want to sincerely apologize for the delay in resolving your
support request. We did not meet our committed response time,
and I understand this impacts your business.

What happened: [BRIEF EXPLANATION]
What we're doing: [CURRENT ACTION BEING TAKEN]
Expected resolution: [UPDATED TIMELINE]

As per our SLA terms, [CREDIT/REMEDY DETAILS IF APPLICABLE].

I'm personally monitoring this ticket to ensure prompt resolution.

Sincerely,
[MANAGER NAME]
[TITLE]
```

### Known Outage Communication

```
Subject: [Service Notice] [SERVICE NAME] — Performance Degradation

Hi [CLIENT NAME],

We're currently experiencing [BRIEF DESCRIPTION OF ISSUE]
affecting [SCOPE — e.g., "email delivery" or "dashboard performance"].

Started: [TIME AND TIMEZONE]
Impact: [DESCRIPTION OF CLIENT IMPACT]
Status: Investigating / Identified / Monitoring / Resolved

Our engineering team is actively working on this. We'll provide
updates every [FREQUENCY].

Track real-time status at: [PLACEHOLDER — STATUS PAGE URL]

We apologize for the inconvenience.

Best,
[COMPANY NAME] Support
```

---

## Tools and Access

### Support Team Tools

| Tool | Purpose | Access Level |
|---|---|---|
| [PLACEHOLDER — Help Desk] | Ticket management | All support staff |
| [PLACEHOLDER — CRM] | Client records and history | All support staff |
| Stripe Dashboard | Billing and payment investigation | L1+ (read-only), L2+ (actions) |
| SendGrid Dashboard | Email delivery monitoring | L2+ |
| Twilio Console | SMS delivery monitoring | L2+ |
| Vercel Dashboard | Deployment and function logs | L2+ (read-only), L3 (full) |
| Sentry | Error tracking and monitoring | L2+ |
| Database (Prisma Studio) | Data investigation | L2+ (read-only), L3 (write) |
| GitHub | Code and issue tracking | L3 |

### Knowledge Base

All support agents should be familiar with:

- [ ] Platform user documentation: [PLACEHOLDER — DOCS URL]
- [ ] Internal knowledge base: [PLACEHOLDER — KB URL]
- [ ] This support playbook
- [ ] SLA terms: `docs/legal/SLA-TEMPLATE.md`
- [ ] Known issues board: [PLACEHOLDER — BOARD URL]
