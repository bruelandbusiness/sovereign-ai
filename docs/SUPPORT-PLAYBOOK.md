# Sovereign AI -- Support Playbook

## Overview

This playbook defines how Sovereign AI handles client support requests. Every support interaction should be fast, professional, and resolution-oriented. When in doubt, escalate early rather than leaving a client waiting.

---

## 1. Support Tiers

### Tier 1 -- Basic Support

**Handled by**: Front-line support staff
**Response SLA**: Within 1 hour (business hours)

| Issue | Resolution Steps |
|-------|-----------------|
| **Password reset / login issues** | 1. Verify client identity (email on file). 2. Trigger magic link resend via admin dashboard. 3. If magic link not received, check spam folder. 4. Verify email address in database. 5. If persistent, escalate to Tier 2. |
| **Dashboard navigation questions** | 1. Identify which section the client needs help with. 2. Walk through the relevant dashboard area. 3. Share the appropriate help article or screenshot. 4. Offer a brief screen-share if needed. |
| **Billing inquiries** | 1. Look up subscription in Stripe Dashboard. 2. Verify current plan, billing date, and payment method. 3. For invoice requests, generate from Stripe. 4. For plan changes, confirm new pricing and process via Stripe. 5. For refund requests, escalate to Tier 2. |
| **Notification preferences** | 1. Guide client to Settings > Notifications in dashboard. 2. Help toggle email, SMS, and push preferences. 3. Verify changes saved successfully. |
| **Report access** | 1. Confirm client has correct dashboard access. 2. Walk through report location and filters. 3. Export report if client needs offline copy. |

### Tier 2 -- Technical Support

**Handled by**: Senior support / engineering support
**Response SLA**: Within 4 hours

| Issue | Resolution Steps |
|-------|-----------------|
| **Service not working (no leads, calls failing)** | 1. Check service status in admin dashboard. 2. Verify service is activated for the client's account. 3. Check `/api/health` endpoint for system status. 4. Review Vercel logs for errors related to the client's account. 5. Test the service end-to-end with test data. 6. If infrastructure issue, escalate to Tier 3. |
| **Integration problems (CRM sync, calendar)** | 1. Verify integration credentials are valid. 2. Check API connection status in admin panel. 3. Review error logs for failed sync attempts. 4. Re-authorize the integration if token expired. 5. Test with a manual sync trigger. 6. If API changes detected, escalate to Tier 3. |
| **Email deliverability issues** | 1. Check email queue status (`/api/cron/email-queue`). 2. Verify SPF/DKIM/DMARC records for client's domain. 3. Check if emails are hitting spam (request client check spam folder). 4. Review bounce logs for hard/soft bounces. 5. If domain blacklisted, escalate to Tier 3. |
| **Incorrect data in dashboard** | 1. Identify the specific metric or data point. 2. Cross-reference with source data (Stripe, lead DB, call logs). 3. Check for data sync delays (cron job timing). 4. If data discrepancy confirmed, log a bug and escalate to Tier 3. |
| **Stripe payment failures** | 1. Check Stripe Dashboard for the failed payment. 2. Identify failure reason (insufficient funds, expired card, etc.). 3. For card issues, ask client to update payment method. 4. For Stripe-side errors, check Stripe status page. 5. Retry the payment via Stripe Dashboard if appropriate. |
| **Refund processing** | 1. Verify refund eligibility per MSA terms. 2. Calculate refund amount (pro-rata or full per guarantee). 3. Get manager approval for refunds over $500. 4. Process refund via Stripe Dashboard. 5. Confirm refund with client via email. |

### Tier 3 -- Engineering / Platform Issues

**Handled by**: Engineering team
**Response SLA**: Within 24 hours (critical: 4 hours)

| Issue | Resolution Steps |
|-------|-----------------|
| **Data integrity issues** | 1. Identify affected records and scope. 2. Check database logs for anomalies. 3. Compare with Neon point-in-time data. 4. Write corrective queries if needed. 5. Verify data consistency post-fix. 6. Communicate resolution to affected clients. |
| **Platform bugs** | 1. Reproduce the issue in staging. 2. Check Sentry for related error reports. 3. Identify root cause in codebase. 4. Write fix with tests. 5. Deploy via standard deployment process. 6. Verify fix in production. |
| **Infrastructure outages** | 1. Check external service status pages (Vercel, Neon, Stripe). 2. If Sovereign AI issue, check Vercel deployment status. 3. Rollback if recent deployment caused the issue. 4. Communicate status to affected clients. 5. Post-mortem after resolution. |
| **Security incidents** | 1. Follow incident response protocol (see RUNBOOK.md). 2. Isolate affected systems. 3. Assess scope and impact. 4. Notify affected clients within 72 hours (per DPA). 5. Remediate and document. |

---

## 2. Response Time SLAs

| Severity | Description | First Response | Resolution Target |
|----------|-------------|---------------|-------------------|
| **P1 -- Critical** | Platform down, all clients affected, data breach | 30 minutes | 4 hours |
| **P2 -- High** | Service degraded, individual client's services not working | 1 hour | 8 hours |
| **P3 -- Medium** | Feature not working as expected, workaround available | 4 hours | 24 hours |
| **P4 -- Low** | Questions, feature requests, minor UI issues | 24 hours | 72 hours |

### Business Hours

- **Standard support**: Monday--Friday, 9:00 AM -- 6:00 PM CT
- **P1 critical issues**: 24/7 (on-call rotation)
- **Weekend coverage**: P1 and P2 only

---

## 3. Common Issues with Step-by-Step Resolutions

### 3.1 Client Cannot Log In

```
1. Ask: "What happens when you click the login link?"
2. If "link expired" → Resend magic link from admin dashboard
3. If "no email received":
   a. Verify email address in client database
   b. Check email-queue logs for delivery status
   c. Ask client to check spam/junk folder
   d. If email provider is blocking, whitelist sending domain
4. If "error after clicking link":
   a. Check if session creation succeeded in logs
   b. Verify AUTH_SECRET is set in production
   c. Check for CSRF validation errors in middleware logs
5. If persistent → Escalate to Tier 2
```

### 3.2 Leads Not Appearing in Dashboard

```
1. Check: Is the lead capture form live and accessible?
2. Submit a test lead through the form
3. Check /api/leads endpoint for recent entries
4. Verify the lead-capture cron job is running (check Vercel cron logs)
5. Check if lead scoring is filtering out the leads
6. If test lead does not appear:
   a. Check Vercel function logs for errors
   b. Verify database connectivity (/api/health)
   c. Check rate limiting (429 responses)
7. If test lead appears but client leads do not:
   a. Check lead source attribution
   b. Verify form is posting to correct endpoint
   c. Check for CORS or domain mismatch issues
```

### 3.3 AI Receptionist Not Answering Calls

```
1. Verify Twilio account is active and funded
2. Check Twilio call logs for the client's number
3. Verify phone number routing in Twilio console
4. Test with an inbound call to the assigned number
5. Check for Twilio webhook failures (misconfigured URL)
6. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in env vars
7. If calls connect but AI not responding:
   a. Check ANTHROPIC_API_KEY is valid
   b. Verify AI receptionist script is configured for client
   c. Check for API rate limits on Anthropic
```

### 3.4 Review Requests Not Sending

```
1. Check email queue status for pending review request emails
2. Verify client's customer contact list is populated
3. Check SMS delivery status in Twilio logs
4. Verify review request template is configured
5. Check if review request cron job ran successfully
6. Test by manually triggering a review request
```

### 3.5 Dashboard Showing Stale Data

```
1. Check when cron jobs last ran (Vercel Dashboard > Cron Jobs)
2. Verify the relevant data sync cron is scheduled
3. Check for cron job failures in logs
4. Manually trigger a data refresh via admin panel
5. Check browser cache (ask client to hard-refresh: Ctrl+Shift+R)
6. If persistent → Escalate to Tier 3
```

### 3.6 Stripe Subscription Issues

```
1. Look up client in Stripe Dashboard by email
2. Check subscription status (active, past_due, canceled)
3. For "past_due":
   a. Check failed payment reason
   b. Contact client to update payment method
   c. Retry payment once updated
4. For webhook sync issues:
   a. Check Stripe Dashboard > Webhooks > Recent events
   b. Look for failed webhook deliveries
   c. Resend failed events from Stripe
5. Verify local subscription record matches Stripe
```

---

## 4. Escalation Matrix

### By Role

| Role | Handles | Escalates To |
|------|---------|-------------|
| Support Agent (Tier 1) | Basic inquiries, account questions, billing | Support Lead |
| Support Lead (Tier 2) | Technical issues, refunds, service problems | Engineering Lead |
| Engineering Lead (Tier 3) | Platform bugs, data issues, infrastructure | Head of Operations |
| Head of Operations | Major outages, client escalations | Founder / CEO |

### By Issue Type

| Issue Type | Primary | Backup | Executive Sponsor |
|------------|---------|--------|-------------------|
| Billing & payments | Support Lead | Account Manager | Head of Ops |
| Service outage | Engineering Lead | On-call Engineer | CTO |
| Client dissatisfaction | Account Manager | Client Success Lead | CEO |
| Security incident | Engineering Lead | Security Reviewer | CTO + CEO |
| Legal / compliance | Head of Operations | Legal Counsel | CEO |

### Escalation Triggers (Auto-Escalate)

- Client has submitted 3+ tickets on the same issue
- Issue has been open for more than 2x the SLA target
- Client explicitly requests escalation
- Issue affects more than one client
- Any mention of cancellation or legal action

---

## 5. Support Tools and Access

| Tool | URL | Purpose |
|------|-----|---------|
| Admin Dashboard | `https://trysovereignai.com/admin` | Client management, service status |
| Vercel Dashboard | `https://vercel.com` | Deployment logs, cron jobs |
| Stripe Dashboard | `https://dashboard.stripe.com` | Billing, subscriptions, refunds |
| Neon Console | `https://console.neon.tech` | Database management |
| Sentry | `https://sentry.io` | Error monitoring |
| Twilio Console | `https://console.twilio.com` | SMS/voice logs |
| Telegram Bot | Internal | Alert monitoring |

---

## 6. Support Interaction Templates

### First Response Template

```
Hi [CLIENT_NAME],

Thanks for reaching out. I've received your request regarding [ISSUE].

I'm looking into this now and will have an update for you within [SLA_TIME].

In the meantime, [ANY IMMEDIATE STEPS THE CLIENT CAN TAKE].

Best,
[AGENT_NAME]
Sovereign AI Support
```

### Resolution Template

```
Hi [CLIENT_NAME],

Good news -- your issue regarding [ISSUE] has been resolved.

Here's what we found and fixed:
- [ROOT CAUSE]
- [WHAT WAS DONE]
- [ANY FOLLOW-UP STEPS]

Please let me know if you experience any further issues.

Best,
[AGENT_NAME]
Sovereign AI Support
```

### Escalation Notification Template

```
Hi [CLIENT_NAME],

I've escalated your request regarding [ISSUE] to our [TIER 2 / ENGINEERING] team
for further investigation.

You can expect an update within [ESCALATED_SLA_TIME].

Your case reference: [TICKET_ID]

Best,
[AGENT_NAME]
Sovereign AI Support
```
