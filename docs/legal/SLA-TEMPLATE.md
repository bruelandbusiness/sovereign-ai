# Service Level Agreement (SLA)

> **Document Type:** Legal Template
> **Version:** 1.0
> **Effective Date:** [PLACEHOLDER — DATE]
> **Last Reviewed:** [PLACEHOLDER — DATE]
>
> **DISCLAIMER:** This template is provided for reference purposes only. It must be reviewed and approved by qualified legal counsel before use. [PLACEHOLDER — COMPANY NAME] makes no representations regarding the legal sufficiency of this template.

---

## 1. Parties

This Service Level Agreement ("SLA") is entered into between:

**Service Provider:**
[PLACEHOLDER — COMPANY LEGAL NAME]
[PLACEHOLDER — ADDRESS]
("Provider")

**Client:**
[PLACEHOLDER — CLIENT LEGAL NAME]
[PLACEHOLDER — CLIENT ADDRESS]
("Client")

This SLA is incorporated by reference into the Master Service Agreement ("MSA") dated [PLACEHOLDER — MSA DATE] between Provider and Client.

---

## 2. Definitions

| Term | Definition |
|---|---|
| **Service** | The [PLACEHOLDER — PRODUCT NAME] platform and associated services as described in the MSA |
| **Uptime** | The percentage of time the Service is available and operational during a calendar month |
| **Downtime** | Any period during which the Service is unavailable, excluding Scheduled Maintenance and Exclusions |
| **Scheduled Maintenance** | Planned maintenance windows communicated at least 48 hours in advance |
| **Incident** | Any event that causes degradation or interruption of the Service |
| **Response Time** | The elapsed time between Client's report of an Incident and Provider's first substantive communication |
| **Resolution Time** | The elapsed time between Client's report of an Incident and full restoration of Service |
| **Business Hours** | Monday through Friday, 9:00 AM to 6:00 PM Eastern Time, excluding US federal holidays |
| **Severity Level** | Classification of Incident impact as defined in Section 5 |

---

## 3. Service Availability

### 3.1 Uptime Commitment

Provider commits to the following monthly uptime targets:

| Service Tier | Monthly Uptime Target | Maximum Allowed Downtime / Month |
|---|---|---|
| Starter | 99.5% | ~3 hours 39 minutes |
| Growth | 99.9% | ~43 minutes |
| Enterprise | 99.95% | ~21 minutes |

### 3.2 Uptime Calculation

```
Monthly Uptime % = ((Total Minutes in Month - Downtime Minutes) / Total Minutes in Month) x 100
```

Where:
- **Total Minutes in Month** = Calendar days in month x 1,440
- **Downtime Minutes** = Total minutes of unplanned Service unavailability

### 3.3 Uptime Monitoring

- Provider shall monitor Service availability continuously using independent monitoring tools
- Uptime reports shall be made available to Client upon request
- Enterprise clients receive automated monthly uptime reports

---

## 4. Scheduled Maintenance

### 4.1 Maintenance Windows

| Maintenance Type | Window | Notice Required |
|---|---|---|
| **Standard Maintenance** | Sundays 2:00-6:00 AM ET | 48 hours |
| **Emergency Maintenance** | As needed | Best effort (minimum 1 hour) |
| **Major Upgrades** | Negotiated with Client | 7 calendar days |

### 4.2 Maintenance Procedures

- Provider shall notify Client via email and status page of all scheduled maintenance
- Maintenance shall be performed during the designated maintenance windows whenever possible
- Provider shall make reasonable efforts to minimize Service disruption during maintenance
- Scheduled maintenance does not count toward Downtime calculations

---

## 5. Incident Severity Levels and Response Times

### 5.1 Severity Definitions

| Severity | Definition | Examples |
|---|---|---|
| **S1 — Critical** | Service is completely unavailable; data loss or security breach | Platform down for all users; payment processing failure; data breach |
| **S2 — High** | Major feature or function is severely impaired; no workaround available | Dashboard inaccessible; email/SMS delivery completely failed; authentication broken |
| **S3 — Medium** | Feature is impaired but workaround is available; limited user impact | Slow page loads; individual integration failure; reporting inaccuracies |
| **S4 — Low** | Minor issue with minimal business impact | UI cosmetic defect; non-critical feature request; documentation error |

### 5.2 Response and Resolution Times

| Severity | First Response | Status Updates | Target Resolution |
|---|---|---|---|
| **S1 — Critical** | 15 minutes (24/7) | Every 30 minutes | 4 hours |
| **S2 — High** | 1 hour (Business Hours*) | Every 2 hours | 8 hours |
| **S3 — Medium** | 4 hours (Business Hours) | Every 8 hours | 2 business days |
| **S4 — Low** | 1 business day | As needed | 5 business days |

*Enterprise tier: S2 incidents receive 24/7 response.

### 5.3 Severity Classification

- Initial severity is assigned by the reporting party
- Provider may reclassify severity with documented justification
- Client may request severity escalation at any time
- Disputes over severity classification shall be resolved by [PLACEHOLDER — ESCALATION CONTACT]

---

## 6. Performance Metrics

### 6.1 Platform Performance

| Metric | Target | Measurement Method |
|---|---|---|
| Page Load Time (p95) | < 3 seconds | Synthetic monitoring |
| API Response Time (p95) | < 500 milliseconds | Server-side logging |
| API Error Rate | < 0.1% | Server-side logging |
| Email Delivery Rate | > 98% | SendGrid analytics |
| SMS Delivery Rate | > 95% | Twilio analytics |
| Database Query Time (p95) | < 200 milliseconds | Database monitoring |

### 6.2 Support Performance

| Metric | Target |
|---|---|
| First Response SLA Compliance | >= 95% |
| Resolution SLA Compliance | >= 90% |
| Customer Satisfaction (CSAT) | >= 4.0 / 5.0 |
| Ticket Backlog (> 5 days old) | < 5% of total tickets |

### 6.3 Reporting

- Provider shall deliver monthly SLA compliance reports to Enterprise clients
- Reports shall include: uptime percentage, incident summary, response time compliance, and performance metrics
- Reports delivered within 10 business days of month end
- Growth tier clients may request quarterly reports

---

## 7. Remedies and Service Credits

### 7.1 Service Credit Schedule

If Provider fails to meet the monthly uptime commitment, Client is entitled to the following credits applied to the next monthly invoice:

| Monthly Uptime | Service Credit (% of Monthly Fee) |
|---|---|
| 99.0% - 99.89% (Growth/Enterprise) | 10% |
| 98.0% - 98.99% | 20% |
| 95.0% - 97.99% | 30% |
| Below 95.0% | 50% |

### 7.2 Credit Request Procedure

1. Client must request credits within 30 days of the month in which the SLA was not met
2. Request must be submitted in writing to [PLACEHOLDER — SUPPORT EMAIL]
3. Request must include: dates and times of Downtime, description of impact
4. Provider shall respond to credit requests within 10 business days
5. Approved credits applied to the next billing cycle

### 7.3 Credit Limitations

- Maximum service credits in any calendar month shall not exceed 50% of the monthly fee for that month
- Service credits are the Client's sole and exclusive remedy for Provider's failure to meet uptime commitments
- Credits are not redeemable for cash and may not be transferred
- Credits do not accumulate across months

### 7.4 Chronic Failure

If Provider fails to meet the uptime commitment for three (3) consecutive months:
- Client may terminate the MSA without penalty upon 30 days written notice
- Client shall receive a prorated refund of any prepaid fees
- Provider shall provide reasonable transition assistance for up to 30 days

---

## 8. Exclusions

The following are excluded from Downtime calculations and SLA commitments:

1. **Scheduled Maintenance** — as defined in Section 4
2. **Force Majeure** — events beyond Provider's reasonable control, including but not limited to:
   - Natural disasters, acts of war, terrorism, or government action
   - Internet backbone outages or DNS failures affecting multiple providers
   - Widespread power outages
3. **Third-Party Failures** — outages caused by:
   - Client's internet service provider
   - Third-party services not operated by Provider (e.g., Stripe, SendGrid, Twilio)
   - Client's hardware, software, or network infrastructure
4. **Client Actions** — including:
   - Unauthorized modifications to the Service or configuration
   - Exceeding documented usage limits or API rate limits
   - Failure to follow Provider's documented procedures or recommendations
5. **Beta or Preview Features** — features explicitly marked as beta, preview, or experimental
6. **Suspension** — Service suspension due to Client's breach of the MSA (e.g., non-payment)

---

## 9. Client Responsibilities

Client agrees to:

1. Designate at least one (1) technical contact for incident communication
2. Report incidents promptly via designated support channels
3. Provide reasonable cooperation in incident diagnosis and resolution
4. Maintain current contact information in the Client portal
5. Implement Provider's recommended security practices (MFA, strong passwords)
6. Keep integrations and API implementations up to date with documented specifications

---

## 10. Escalation Path

| Level | Contact | Triggered When |
|---|---|---|
| L1 — Support | [PLACEHOLDER — SUPPORT EMAIL] | Initial incident report |
| L2 — Support Management | [PLACEHOLDER — SUPPORT MANAGER] | SLA at risk; Client requests escalation |
| L3 — Engineering | [PLACEHOLDER — ENGINEERING LEAD] | Confirmed bug; infrastructure issue |
| L4 — Executive | [PLACEHOLDER — VP/CTO] | Chronic SLA failure; Client escalation |

---

## 11. Term and Amendments

- This SLA is effective for the duration of the MSA
- Provider may update this SLA with 30 days written notice to Client
- Material adverse changes require Client's written consent
- In the event of conflict between this SLA and the MSA, the MSA shall govern

---

## 12. Signatures

| | Provider | Client |
|---|---|---|
| **Name** | [PLACEHOLDER] | [PLACEHOLDER] |
| **Title** | [PLACEHOLDER] | [PLACEHOLDER] |
| **Signature** | _________________________ | _________________________ |
| **Date** | [PLACEHOLDER] | [PLACEHOLDER] |
