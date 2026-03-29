# Support Playbook

> **Last Updated:** 2026-03-29
> **Owner:** Head of Support
> **Review Cadence:** Monthly

---

## Table of Contents

1. [Support Tiers & SLAs](#support-tiers--slas)
2. [Common Issues & Resolutions](#common-issues--resolutions)
3. [Escalation Procedures](#escalation-procedures)
4. [Client Communication Templates](#client-communication-templates)
5. [Internal Tools & Access](#internal-tools--access)
6. [Metrics & Reporting](#metrics--reporting)

---

## Support Tiers & SLAs

### Tier Overview

| Tier | Channel | First Response | Resolution Target | Availability |
|------|---------|----------------|-------------------|--------------|
| **Tier 1: Self-Service** | Knowledge base, AI chatbot | Instant (automated) | Immediate | 24/7 |
| **Tier 2: Email Support** | Email ticketing system | 4 hours | 24 hours | Business hours (9 AM - 6 PM ET, Mon-Fri) |
| **Tier 3: Priority Support** | Email + live chat + phone | 1 hour | 4 hours | Extended hours (8 AM - 10 PM ET, 7 days) |
| **Tier 4: Emergency** | Direct phone + Slack escalation | 15 minutes | 1 hour | 24/7/365 |

### Tier 1: Self-Service

- **Channel:** Knowledge base articles, AI-powered chatbot, in-app tooltips
- **Response time:** Instant (automated)
- **Scope:** FAQs, how-to guides, account settings, feature walkthroughs, billing inquiries
- **Staffing:** No human agent required; chatbot handles initial triage
- **Escalation trigger:** Chatbot unable to resolve after 2 attempts, or client requests human support

### Tier 2: Email Support

- **Channel:** Email (support@[domain]) routed through ticketing system
- **Response time:** 4-hour first response
- **Resolution target:** 24 hours
- **Scope:** Account issues, configuration help, integration troubleshooting, billing disputes, data questions
- **Staffing:** Support agents (L1 trained)
- **Escalation trigger:** Cannot resolve within 4 hours of active work, requires database or log access, or confirmed software bug

### Tier 3: Priority Support

- **Channel:** Email + live chat + scheduled phone calls
- **Response time:** 1-hour first response
- **Resolution target:** 4 hours
- **Scope:** Revenue-impacting issues, broken integrations, data discrepancies, multi-user outages, urgent configuration changes
- **Staffing:** Senior support engineers with database read access and log review capability
- **Escalation trigger:** Requires code-level fix, infrastructure issue, or security incident

### Tier 4: Emergency

- **Channel:** Direct phone line + dedicated Slack channel (#emergency-support)
- **Response time:** 15-minute first response
- **Resolution target:** 1 hour
- **Scope:** Platform-wide outages, data loss or corruption, security breaches, payment processing failures affecting multiple clients
- **Staffing:** On-call engineering team with full production access
- **Escalation trigger:** CTO/VP Engineering notified immediately; all-hands if unresolved in 30 minutes

### SLA by Client Plan

| Metric | Starter | Growth | Enterprise |
|--------|---------|--------|------------|
| Default support tier | Tier 1 + Tier 2 | Tier 1 + Tier 2 + Tier 3 | Tier 1 + Tier 2 + Tier 3 + Tier 4 |
| Support hours | Business hours | Extended hours | 24/7 |
| Dedicated CSM | No | No | Yes |
| Quarterly reviews | No | Yes | Yes (monthly) |
| SLA credits on breach | No | Yes (per contract) | Yes (per contract) |

### SLA Breach Protocol

1. **Automated alert** fires when SLA threshold reaches 75% of allotted time
2. **Ticket auto-escalated** to next tier at 90% of SLA window
3. **Manager notified** when SLA is breached
4. **Client receives** proactive communication acknowledging the delay
5. **Post-breach review** conducted within 24 hours
6. **SLA credit applied** per contract terms (see `docs/legal/SLA-TEMPLATE.md`)

---

## Common Issues & Resolutions

### Issue 1: Dashboard Not Loading

**Symptoms:** Blank screen, infinite spinner, or timeout error when accessing the dashboard.

**Diagnosis:**
1. Ask client to clear browser cache and cookies
2. Verify client authentication status (token may be expired)
3. Check client subscription status (expired subscriptions lose dashboard access)
4. Test in incognito mode to rule out browser extensions
5. Check Vercel deployment status for platform-wide issues

**Resolution:**
- **Browser cache:** Clear cache and hard-reload (Ctrl+Shift+R / Cmd+Shift+R)
- **Auth expired:** Log out and log back in to refresh session token
- **Subscription lapsed:** Redirect client to billing page to reactivate
- **Platform-wide:** Escalate to Tier 4 if Vercel/infrastructure issue confirmed
- **Browser extension conflict:** Disable extensions and test; whitelist the domain

**Tier:** Tier 2 (client-specific) / Tier 4 (platform-wide)

---

### Issue 2: Leads Not Appearing

**Symptoms:** New leads are not showing up in the leads dashboard or CRM sync is missing entries.

**Diagnosis:**
1. Check API integration status in the client's settings panel
2. Verify the webhook endpoint URL is correct and receiving payloads
3. Inspect webhook delivery logs for HTTP errors (4xx/5xx)
4. Confirm lead source is properly configured (web form, landing page, API)
5. Check for duplicate-detection rules that may be filtering leads

**Resolution:**
- **API disconnected:** Reconnect integration via Settings > Integrations > Reconnect
- **Webhook failing:** Correct endpoint URL; check receiving server availability
- **Duplicate filter:** Adjust deduplication rules or merge duplicate records
- **Form misconfigured:** Verify form field mapping matches expected schema
- **Rate limit hit:** Space out API calls; upgrade API tier if needed

**Tier:** Tier 2 (configuration) / Tier 3 (API/webhook debugging)

---

### Issue 3: Reviews Not Syncing

**Symptoms:** Google reviews not appearing in the reputation dashboard, stale review data, or sync errors.

**Diagnosis:**
1. Check Google Business Profile connection status in integrations
2. Verify OAuth token has not expired (tokens expire after 90 days without refresh)
3. Confirm the correct Google Business listing is linked
4. Check Google API quota usage in the admin panel
5. Review sync logs for error messages

**Resolution:**
- **Token expired:** Guide client to disconnect and re-authorize Google connection
- **Wrong listing:** Update linked business profile to the correct location
- **API quota exceeded:** Wait for quota reset (midnight PT) or request quota increase
- **Sync delay:** Google API has up to 24-hour propagation delay; advise client to wait
- **Multiple locations:** Ensure each location is individually linked

**Tier:** Tier 2 (re-authorization) / Tier 3 (API quota/configuration issues)

---

### Issue 4: Chatbot Offline

**Symptoms:** Chat widget not appearing on client's website, or chatbot not responding to visitor messages.

**Diagnosis:**
1. Check if the widget embed code is correctly placed in the site's HTML (before `</body>`)
2. Verify the chatbot deployment status in the admin panel (Active vs Paused)
3. Inspect browser console for JavaScript errors related to the widget
4. Confirm the client's domain is whitelisted in widget settings
5. Check if the chatbot's AI model endpoint is responding

**Resolution:**
- **Missing embed code:** Provide fresh embed snippet; guide client on placement
- **Deployment paused:** Reactivate from Admin > Chatbot > Deploy
- **JS errors:** Check for conflicts with other scripts; provide async loading snippet
- **Domain not whitelisted:** Add client's domain(s) to allowed origins
- **AI endpoint down:** Escalate to Tier 3; check OpenAI/Anthropic API status

**Tier:** Tier 2 (embed/config) / Tier 3 (AI endpoint issues)

---

### Issue 5: Payment Failed

**Symptoms:** Client subscription charge declined, checkout fails, or "Payment failed" error displayed.

**Diagnosis:**
1. Check Stripe Dashboard > Payments for the specific charge and decline code
2. Review decline reason (e.g., `insufficient_funds`, `card_declined`, `expired_card`)
3. Verify webhook delivery status in Stripe > Webhooks
4. Check if the client's subscription object is in a valid state

**Resolution:**
- **Card declined:** Ask client to update payment method in Settings > Billing
- **Expired card:** Prompt client to add a new card
- **Webhook failure:** Check Vercel function logs; retry webhook from Stripe dashboard
- **Subscription stuck:** Manually sync subscription status via Admin > Billing > Sync
- **Persistent failures:** Contact Stripe support with the payment intent ID

**Tier:** Tier 2 (card updates) / Tier 3 (webhook/sync issues)

---

### Issue 6: Email Not Sending

**Symptoms:** Clients or their customers not receiving notification emails, campaign emails, or transactional messages.

**Diagnosis:**
1. Check SendGrid Activity Feed for the recipient email address
2. Look for bounces, blocks, or spam reports
3. Verify sender domain authentication (SPF, DKIM, DMARC records)
4. Check if recipient is on the SendGrid suppression list
5. Verify email quota has not been exceeded for the billing period

**Resolution:**
- **Bounced:** Verify recipient email is correct; remove from suppression list if address was fixed
- **Blocked by ISP:** Review email content for spam triggers; reduce link density
- **Domain not authenticated:** Walk client through DNS record setup (SPF, DKIM, DMARC)
- **Suppression list:** Remove valid addresses from SendGrid suppressions panel
- **Spam folder:** Advise recipient to check spam/junk and whitelist the sender domain

**Tier:** Tier 2 (basic delivery) / Tier 3 (domain authentication/deliverability)

---

### Issue 7: Reports Showing Wrong Data

**Symptoms:** Dashboard analytics, reports, or exported data show unexpected numbers or don't match client expectations.

**Diagnosis:**
1. Confirm the date range and timezone selected in the report filters
2. Verify data source connections are active and syncing
3. Check if data aggregation jobs have completed (some reports run on a schedule)
4. Compare raw data in the database with the report output
5. Determine if the client's expectation aligns with how metrics are defined

**Resolution:**
- **Wrong date range:** Adjust filters; ensure timezone matches client's locale
- **Stale data:** Trigger a manual data refresh from Admin > Reports > Refresh
- **Data source disconnected:** Reconnect the integration feeding the report
- **Metric confusion:** Share documentation on how each metric is calculated
- **Aggregation bug:** Escalate to Tier 3 with sample data and expected vs actual values

**Tier:** Tier 2 (filters/config) / Tier 3 (data integrity investigation)

---

### Issue 8: Voice Agent Not Answering

**Symptoms:** Inbound calls to the AI voice agent go unanswered, ring endlessly, or drop immediately.

**Diagnosis:**
1. Check Twilio Console > Phone Numbers to verify the number is active
2. Confirm the voice webhook URL is correct and responding
3. Check Twilio account balance (calls fail if balance is zero)
4. Review Twilio call logs for error codes
5. Test the phone number by calling it directly

**Resolution:**
- **Number inactive:** Reactivate or re-provision the phone number in Twilio
- **Webhook URL wrong:** Update to the correct voice handler endpoint
- **Balance depleted:** Alert finance team to add funds to Twilio account
- **Error 11200 (HTTP retrieval failure):** Verify the webhook server is running; check Vercel function logs
- **Call routing issue:** Review TwiML configuration for correct call flow

**Tier:** Tier 2 (configuration) / Tier 3 (webhook/infrastructure)

---

### Issue 9: Ad Spend Not Tracking

**Symptoms:** Google Ads or Meta Ads spend data is missing, delayed, or showing zero in the dashboard.

**Diagnosis:**
1. Check Google Ads / Meta Ads connection status in integrations
2. Verify OAuth tokens are still valid (re-auth may be needed)
3. Confirm the correct ad accounts are linked (clients may have multiple)
4. Check API rate limits and quota usage
5. Review the data sync schedule (ad data typically syncs every 6 hours)

**Resolution:**
- **Connection expired:** Guide client to re-authorize the ad platform connection
- **Wrong account linked:** Update to the correct ad account ID in settings
- **Sync delay:** Ad platforms have reporting delays of 4-24 hours; advise waiting
- **API quota exceeded:** Reduce sync frequency or request higher quota
- **Permissions changed:** Re-authorize with the required scopes (ads_read, ads_management)

**Tier:** Tier 2 (re-authorization) / Tier 3 (API/data pipeline issues)

---

### Issue 10: SEO Rankings Dropping

**Symptoms:** Client reports declining search rankings, reduced organic traffic, or keyword position drops.

**Diagnosis:**
1. Check if a Google algorithm update was recently released (Search Status Dashboard)
2. Review the client's content for recent changes that may have affected rankings
3. Verify the sitemap is properly submitted and indexed in Google Search Console
4. Check for manual actions or security issues in Search Console
5. Audit technical SEO factors (page speed, mobile-friendliness, broken links)

**Resolution:**
- **Algorithm update:** Analyze impact; recommend content improvements aligned with update focus
- **Content changes:** Revert detrimental changes; ensure keyword targeting is maintained
- **Sitemap issues:** Regenerate and resubmit sitemap; check for crawl errors
- **Manual action:** Follow Google's remediation steps; submit reconsideration request
- **Technical issues:** Run site audit; fix broken links, improve Core Web Vitals

**Tier:** Tier 2 (guidance/audit) / Tier 3 (technical SEO investigation)

---

### Issue 11: Client Cannot Log In

**Symptoms:** Login page shows "Invalid credentials" or account locked message.

**Diagnosis:**
1. Verify the email address exists in the system
2. Check if account is locked (more than 5 failed attempts)
3. Confirm email invitation was accepted
4. Check for SSO configuration issues (Enterprise clients)

**Resolution:**
- **Wrong password:** Send password reset link via Admin > Users > Reset Password
- **Account locked:** Unlock via Admin > Users > [User] > Unlock Account
- **Invitation not accepted:** Resend invitation email
- **SSO issue:** Escalate to Tier 3 for IdP configuration review

**Tier:** Tier 2

---

### Issue 12: SMS Not Sending

**Symptoms:** SMS notifications not reaching recipients.

**Diagnosis:**
1. Check Twilio Console > Messages for delivery status
2. Verify phone number format (E.164: +1XXXXXXXXXX)
3. Check Twilio account balance
4. Review message content for carrier filtering

**Resolution:**
- **Invalid number format:** Correct to E.164 format
- **Account balance low:** Alert finance team to add funds
- **Carrier filtered:** Shorten message, remove URLs, register for A2P 10DLC compliance
- **Number unsubscribed:** Recipient must re-opt-in via STOP/START flow

**Tier:** Tier 2 (format) / Tier 3 (carrier/compliance)

---

### Issue 13: AI Automation Producing Poor Results

**Symptoms:** AI-generated content is low quality, irrelevant, or returning errors.

**Diagnosis:**
1. Review the automation configuration and prompt templates
2. Check AI API status (OpenAI / Anthropic status pages)
3. Verify API keys are valid and have sufficient quota
4. Review input data quality feeding the automation

**Resolution:**
- **Poor output quality:** Guide client on prompt engineering best practices
- **API errors:** Check API key validity; rotate key if compromised
- **Rate limited:** Adjust automation frequency; upgrade API plan
- **Unexpected behavior:** Collect examples of bad output and escalate to Tier 3

**Tier:** Tier 2 (guidance) / Tier 3 (bug investigation)

---

### Issue 14: Data Import/Export Failures

**Symptoms:** CSV import fails, export generates empty file, or data appears corrupted.

**Diagnosis:**
1. Verify file format (UTF-8 encoded CSV, correct column headers)
2. Check file size against tier limits (Starter: 5 MB, Growth: 50 MB, Enterprise: 500 MB)
3. Review import error log for specific row failures
4. Confirm all required fields are populated

**Resolution:**
- **Format error:** Provide CSV template with correct headers and sample data
- **File too large:** Split file into smaller batches or upgrade tier
- **Row failures:** Export error report showing failing rows with reasons
- **Export empty:** Check date range filters and confirm data exists for the period

**Tier:** Tier 2 (format/guidance) / Tier 3 (data investigation)

---

### Issue 15: Integration Connection Lost

**Symptoms:** Third-party integration (CRM, calendar, ad platform) stops syncing data.

**Diagnosis:**
1. Check integration status in platform Settings > Integrations
2. Verify OAuth tokens haven't expired
3. Check third-party service status page
4. Review webhook delivery logs

**Resolution:**
- **Token expired:** Guide client through disconnect > reconnect flow
- **Third-party outage:** Monitor status page; notify client when service is restored
- **Webhook misconfigured:** Verify endpoint URL; reconfigure if needed
- **Permissions changed:** Re-authorize with all required scopes

**Tier:** Tier 2 (reconnect) / Tier 3 (webhook/permission investigation)

---

### Issue 16: Account Permissions Not Working Correctly

**Symptoms:** Users can access features they shouldn't, or are blocked from features they should have.

**Diagnosis:**
1. Review user's assigned role in the admin panel
2. Check organization-level permission overrides
3. Verify the feature is included in the client's subscription tier
4. Check for recent permission or role changes

**Resolution:**
- **Wrong role:** Update role assignment in Admin > Users > [User] > Role
- **Tier limitation:** Explain feature availability per plan; suggest upgrade path
- **Permission cache:** Clear user session; have user log out and back in
- **Bug:** Document expected vs actual behavior and escalate to Tier 3

**Tier:** Tier 2 (role changes) / Tier 3 (bugs)

---

### Issue 17: Incorrect Invoice or Billing Amount

**Symptoms:** Client charged wrong amount, duplicate charge, or missing credits/discounts.

**Diagnosis:**
1. Pull invoice from Stripe Dashboard
2. Compare with contract terms and pricing tier
3. Check for proration from mid-cycle plan changes
4. Review coupon/discount codes applied

**Resolution:**
- **Overcharge:** Issue refund or credit via Stripe; notify finance team
- **Proration confusion:** Explain proration calculation with specific line items
- **Duplicate charge:** Refund duplicate; investigate subscription webhook for double-fire
- **Missing discount:** Apply coupon retroactively; issue credit note if applicable

**Tier:** Tier 2 (explain) / Tier 3 (refunds require finance approval)

---

## Escalation Procedures

### When to Escalate

Escalate a ticket when any of the following conditions are met:

- **Time-based:** Cannot resolve within the SLA window for the ticket's priority
- **Scope-based:** Issue requires database access, log review, or code changes beyond the current tier's capability
- **Severity-based:** Issue is revenue-impacting, affects multiple clients, or involves data loss/security
- **Client-requested:** Client explicitly asks to speak with a manager or specialist
- **Recurring:** Same issue has occurred 3+ times for the same client

### Who to Escalate To

```
Tier 2 (Email Support Agent)
    |
    +-- Cannot resolve within 4 hours of active work
    +-- Requires log or database access
    +-- Client requests escalation
    |       |
    v       v
Tier 3 (Senior Support Engineer)
    |
    +-- Confirmed software bug
    +-- Infrastructure or scaling issue
    +-- Requires code-level changes
    +-- Cannot resolve within Tier 3 SLA
    |       |
    v       v
Tier 4 (On-Call Engineering)
    |
    +-- Platform-wide outage
    +-- Security incident
    +-- Data loss or corruption
    +-- Requires production hotfix
    |       |
    v       v
Engineering Manager / CTO
```

### Escalation Contacts

| Level | Primary Contact | Backup Contact | Channel |
|-------|----------------|----------------|---------|
| Tier 3 | Senior Support Lead | Support Engineering Manager | `#support-escalations` Slack channel |
| Tier 4 | On-Call Engineer (PagerDuty rotation) | Engineering Manager | `#emergency-support` Slack + PagerDuty |
| Executive | VP of Engineering | CTO | Direct message + phone call |

### Required Information for Escalation

Every escalation must include the following. Incomplete escalations will be sent back.

- [ ] **Ticket ID** and link to the ticket in the help desk system
- [ ] **Client name**, account ID, and subscription tier
- [ ] **Priority level** (P0-P4) and support tier
- [ ] **Issue summary** in 1-2 sentences
- [ ] **Steps already taken** and their outcomes (what was tried and what happened)
- [ ] **Impact assessment** (number of users affected, revenue impact, business criticality)
- [ ] **Reproduction steps** (if applicable, step-by-step to recreate the issue)
- [ ] **Screenshots, error messages, or log snippets** attached to the ticket
- [ ] **Client communication status** (what has the client been told so far, when was last update)
- [ ] **Urgency justification** (why this cannot wait for normal queue processing)

---

## Client Communication Templates

### Acknowledgment Template

```
Subject: [Ticket #[ID]] We've received your request

Hi [CLIENT NAME],

Thank you for reaching out. We have received your support request and
a team member is reviewing it now.

Ticket: #[TICKET_ID]
Priority: [PRIORITY LEVEL]
Expected first response: within [SLA TIME]

In the meantime, you may find a solution in our knowledge base:
[KNOWLEDGE BASE URL]

If your issue is urgent, you can reach us at:
- Live chat: [CHAT URL] (Growth and Enterprise plans)
- Phone: [PHONE NUMBER] (Enterprise plan)

Best regards,
[AGENT NAME]
Sovereign AI Support
```

### Investigation Update Template

```
Subject: [Ticket #[ID]] Update on your request

Hi [CLIENT NAME],

I wanted to give you an update on your support request.

Current status: In Progress

What we have done so far:
  - [ACTION 1 AND RESULT]
  - [ACTION 2 AND RESULT]

Next steps:
  - [NEXT ACTION] — expected to complete by [TIME/DATE]

We will continue working on this and provide another update
by [NEXT UPDATE TIME].

If you have additional information that may help, please reply
to this email.

Best regards,
[AGENT NAME]
Sovereign AI Support
```

### Resolution Template

```
Subject: [Ticket #[ID]] Your issue has been resolved

Hi [CLIENT NAME],

Your support request has been resolved. Here is a summary:

Issue: [BRIEF DESCRIPTION OF THE PROBLEM]
Root cause: [WHAT CAUSED THE ISSUE]
Resolution: [WHAT WAS DONE TO FIX IT]
Preventive measures: [WHAT WE ARE DOING TO PREVENT RECURRENCE, IF APPLICABLE]

Ticket: #[TICKET_ID]
Resolved by: [AGENT NAME]

If the issue reoccurs or you have any questions about the resolution,
simply reply to this email and we will reopen the ticket.

We would appreciate your feedback on this interaction:
[SATISFACTION SURVEY LINK]

Best regards,
[AGENT NAME]
Sovereign AI Support
```

### Follow-Up Template

```
Subject: [Ticket #[ID]] Following up on your resolved request

Hi [CLIENT NAME],

I am following up on the support request we resolved on [RESOLUTION DATE].

Ticket: #[TICKET_ID]
Issue: [BRIEF DESCRIPTION]

I wanted to check in and confirm:
  1. The issue has not reoccurred
  2. The solution is working as expected
  3. You do not have any additional questions

If everything is working well, no response is needed. If you are
experiencing any further issues, simply reply to this email and
we will prioritize your request.

Thank you for being a valued Sovereign AI client.

Best regards,
[AGENT NAME]
Sovereign AI Support
```

### SLA Breach Apology Template

```
Subject: [Ticket #[ID]] Our apologies for the delay

Hi [CLIENT NAME],

I want to sincerely apologize for the delay in responding to your
support request. We did not meet our committed response time,
and I understand this impacts your business.

What happened: [BRIEF EXPLANATION OF THE DELAY]
What we are doing now: [CURRENT ACTION BEING TAKEN]
Expected resolution: [UPDATED TIMELINE]

As per our SLA terms, [CREDIT/REMEDY DETAILS IF APPLICABLE].

I am personally monitoring this ticket to ensure prompt resolution.

Sincerely,
[MANAGER NAME]
[TITLE]
Sovereign AI Support
```

### Known Outage Communication Template

```
Subject: [Service Notice] [SERVICE NAME] — Performance Degradation

Hi [CLIENT NAME],

We are currently experiencing [BRIEF DESCRIPTION OF ISSUE]
affecting [SCOPE — e.g., "email delivery" or "dashboard performance"].

Started: [TIME AND TIMEZONE]
Impact: [DESCRIPTION OF CLIENT IMPACT]
Status: [Investigating / Identified / Monitoring / Resolved]

Our engineering team is actively working on this. We will provide
updates every [FREQUENCY].

Track real-time status at: [STATUS PAGE URL]

We apologize for the inconvenience.

Best regards,
Sovereign AI Support
```

---

## Internal Tools & Access

### Admin Dashboard

| Function | Location | Access Level |
|----------|----------|--------------|
| User management | Admin > Users | Tier 2+ |
| Subscription management | Admin > Billing | Tier 2+ (read), Tier 3+ (modify) |
| Integration status | Admin > Integrations | Tier 2+ |
| Feature flags | Admin > Features | Tier 3+ |
| System health | Admin > Status | All support staff |
| Client impersonation | Admin > Users > Impersonate | Tier 3+ (requires justification log) |

### Support Team Tooling

| Tool | Purpose | Access Level |
|------|---------|--------------|
| Help Desk (Intercom/Zendesk) | Ticket management, client communication | All support staff |
| CRM (HubSpot) | Client records, account history, deal info | All support staff |
| Stripe Dashboard | Billing investigation, refunds, subscription management | Tier 2+ (read-only), Tier 3+ (actions) |
| SendGrid Dashboard | Email delivery monitoring, suppression management | Tier 3+ |
| Twilio Console | SMS/voice delivery monitoring, call logs | Tier 3+ |
| Google Search Console | SEO performance, indexing status | Tier 2+ (read-only) |
| Google/Meta Ads Manager | Ad performance, spend verification | Tier 2+ (read-only) |

### Database Access Procedures

- **Read-only access** is available to Tier 3 support engineers via Prisma Studio
- **Write access** is restricted to Tier 4 (on-call engineering) and requires:
  1. Approved ticket with documented justification
  2. Peer review of any data modification query
  3. Backup snapshot taken before any write operation
  4. All changes logged in the `#database-changes` Slack channel
- **Direct SQL** is never permitted; all queries go through Prisma ORM
- **Production database** credentials are stored in 1Password and rotated monthly

### Log Review

| System | What It Shows | Access | URL |
|--------|--------------|--------|-----|
| **Sentry** | Application errors, stack traces, user impact, error frequency | Tier 2+ (read), Tier 3+ (resolve/ignore) | sentry.io/[org]/[project] |
| **Vercel** | Deployment logs, serverless function logs, build output, edge function logs | Tier 2+ (read), Tier 3+ (redeploy) | vercel.com/[team]/[project] |
| **Vercel Analytics** | Web vitals, page performance, visitor metrics | Tier 2+ | vercel.com/[team]/[project]/analytics |
| **Stripe Webhooks** | Webhook delivery attempts, payloads, retry status | Tier 3+ | dashboard.stripe.com/webhooks |
| **Twilio Debugger** | SMS/voice error logs, delivery status, carrier info | Tier 3+ | twilio.com/console/debugger |

### Log Review Procedures

1. **Start with Sentry** for any application error — search by client email or error message
2. **Check Vercel function logs** for API failures — filter by function name and time range
3. **Cross-reference** Sentry errors with Vercel logs using request IDs
4. **Document findings** in the ticket before escalating, including:
   - Error messages (exact text)
   - Timestamps (with timezone)
   - Frequency (one-time vs recurring)
   - Affected users (count and identification)

---

## Metrics & Reporting

### Key Metrics to Track

| Metric | Definition | Target | Measurement Frequency |
|--------|-----------|--------|----------------------|
| **First Response Time (FRT)** | Time from ticket creation to first human response | Within SLA per tier | Real-time |
| **Average Resolution Time (ART)** | Time from ticket creation to confirmed resolution | Tier 2: < 24h, Tier 3: < 4h, Tier 4: < 1h | Daily |
| **Customer Satisfaction (CSAT)** | Post-resolution survey score (1-5 scale) | 4.5+ average | Per ticket |
| **Net Promoter Score (NPS)** | Likelihood to recommend (quarterly survey) | 50+ | Quarterly |
| **Ticket Volume** | Total tickets created per period | Track trend (aim for decreasing) | Daily/Weekly |
| **First Contact Resolution (FCR)** | Percentage of tickets resolved without escalation | 70%+ | Weekly |
| **SLA Compliance Rate** | Percentage of tickets meeting SLA targets | 95%+ | Weekly |
| **Escalation Rate** | Percentage of tickets escalated to higher tier | < 20% | Weekly |
| **Reopen Rate** | Percentage of resolved tickets reopened within 7 days | < 5% | Weekly |
| **Self-Service Deflection Rate** | Percentage of issues resolved via Tier 1 (chatbot/KB) without human contact | 40%+ | Monthly |

### Reporting Dashboards

- **Real-time:** Help desk dashboard showing open tickets, SLA status, agent availability
- **Daily:** Automated Slack summary in `#support-metrics` — ticket volume, CSAT, SLA breaches
- **Weekly:** Detailed report generated every Monday covering the prior week
- **Monthly:** Executive summary with trends, top issues, staffing recommendations
- **Quarterly:** Strategic review with NPS trends, cost-per-ticket analysis, improvement roadmap

### Weekly Support Review Meeting

**Schedule:** Every Monday, 10:00 AM ET, 30 minutes
**Attendees:** Support team lead, all support agents, engineering liaison

**Agenda:**

1. **Metrics Review** (10 min)
   - Ticket volume vs prior week (trend direction)
   - Average resolution time by tier
   - SLA compliance rate and any breaches
   - CSAT scores and notable feedback
   - First contact resolution rate

2. **Top Issues Review** (10 min)
   - Top 5 most frequent issue categories from the past week
   - Any new/emerging issue patterns
   - Recurring issues that need a permanent fix (escalate to engineering backlog)
   - Knowledge base gaps identified (articles to create or update)

3. **Escalation Review** (5 min)
   - Review all Tier 3+ escalations from the past week
   - Identify preventable escalations (training opportunity)
   - Status of open escalated tickets

4. **Action Items & Improvements** (5 min)
   - Assign owners to knowledge base updates
   - Flag product feedback themes to the product team
   - Training needs for the coming week
   - Process improvements to implement

**Output:** Meeting notes posted to `#support-team` Slack channel within 1 hour. Action items tracked in the team task board.

### Monthly Reporting to Leadership

The support team lead prepares a monthly report for the leadership team covering:

- Total ticket volume and trend analysis
- SLA compliance rate with breach details
- CSAT and NPS scores with commentary
- Top 10 issue categories and resolution patterns
- Staffing utilization and capacity planning recommendations
- Cost per ticket and efficiency metrics
- Product feedback themes aggregated from support interactions
- Recommendations for product improvements to reduce ticket volume
