# Service Level Agreement (SLA) Template

> **DISCLAIMER:** This document is a template provided for informational purposes only. It does not constitute legal advice. This template must be reviewed, customized, and approved by qualified legal counsel before use in any binding agreement. Sovereign AI makes no representations or warranties regarding the legal sufficiency or enforceability of this template.

---

**Service Level Agreement**

**Between:**
- **Service Provider:** [PROVIDER_LEGAL_NAME], a [PROVIDER_ENTITY_TYPE] organized under the laws of [PROVIDER_JURISDICTION], with its principal place of business at [PROVIDER_ADDRESS] ("Provider")
- **Customer:** [CUSTOMER_LEGAL_NAME], a [CUSTOMER_ENTITY_TYPE] organized under the laws of [CUSTOMER_JURISDICTION], with its principal place of business at [CUSTOMER_ADDRESS] ("Customer")

**Effective Date:** [EFFECTIVE_DATE]
**SLA Reference Number:** [SLA_REFERENCE_NUMBER]

This Service Level Agreement ("SLA") is incorporated into and forms part of the Master Service Agreement dated [MSA_DATE] ("Agreement") between Provider and Customer.

---

## 1. Definitions

- **"Downtime"** means any period during which the Services are unavailable or materially degraded, as measured by Provider's monitoring systems, excluding Scheduled Maintenance and Excused Downtime.
- **"Monthly Uptime Percentage"** means the total number of minutes in a calendar month minus the number of minutes of Downtime, divided by the total number of minutes in the calendar month, expressed as a percentage.
- **"Scheduled Maintenance"** means planned maintenance windows communicated to Customer at least [MAINTENANCE_NOTICE_PERIOD] in advance.
- **"Service Credit"** means a credit issued to Customer's account as described in Section 5.
- **"Response Time"** means the elapsed time between Customer's submission of a support request and Provider's initial substantive acknowledgment.

---

## 2. Service Availability Commitment

### 2.1 Uptime Guarantee

Provider commits to a Monthly Uptime Percentage of **99.9%** for the Services, equivalent to no more than approximately 43 minutes and 28 seconds of Downtime per calendar month.

| Metric | Target |
|---|---|
| Monthly Uptime Percentage | 99.9% |
| Maximum Monthly Downtime | ~43 minutes 28 seconds |
| Measurement Period | Calendar month |

### 2.2 Availability Measurement

Availability shall be measured using [MONITORING_TOOL_OR_METHOD] and calculated as:

```
Monthly Uptime % = ((Total Minutes in Month - Downtime Minutes) / Total Minutes in Month) x 100
```

### 2.3 Scheduled Maintenance Windows

- **Primary Window:** [PRIMARY_MAINTENANCE_WINDOW] (e.g., Sundays 02:00-06:00 UTC)
- **Secondary Window:** [SECONDARY_MAINTENANCE_WINDOW]
- **Advance Notice:** Minimum [MAINTENANCE_NOTICE_PERIOD] prior written notice
- **Maximum Scheduled Maintenance per Month:** [MAX_MAINTENANCE_HOURS] hours
- Scheduled Maintenance periods are excluded from Downtime calculations.

---

## 3. Response Time Guarantees

### 3.1 Severity Classifications

| Severity | Definition | Initial Response Time | Status Update Frequency | Target Resolution Time |
|---|---|---|---|---|
| **Severity 1 - Critical** | Complete service outage or data loss affecting all users | [SEV1_RESPONSE_TIME] (e.g., 15 minutes) | Every [SEV1_UPDATE_FREQ] (e.g., 30 minutes) | [SEV1_RESOLUTION_TIME] (e.g., 4 hours) |
| **Severity 2 - High** | Major feature unavailable, significant performance degradation, no workaround | [SEV2_RESPONSE_TIME] (e.g., 1 hour) | Every [SEV2_UPDATE_FREQ] (e.g., 2 hours) | [SEV2_RESOLUTION_TIME] (e.g., 8 hours) |
| **Severity 3 - Medium** | Feature impaired but workaround available, minor performance issues | [SEV3_RESPONSE_TIME] (e.g., 4 hours) | Every [SEV3_UPDATE_FREQ] (e.g., 1 business day) | [SEV3_RESOLUTION_TIME] (e.g., 3 business days) |
| **Severity 4 - Low** | General inquiries, cosmetic issues, feature requests | [SEV4_RESPONSE_TIME] (e.g., 1 business day) | Every [SEV4_UPDATE_FREQ] (e.g., 1 week) | [SEV4_RESOLUTION_TIME] (e.g., 10 business days) |

### 3.2 Support Hours

- **Severity 1 & 2:** 24 hours per day, 7 days per week, 365 days per year
- **Severity 3 & 4:** [SUPPORT_HOURS] (e.g., Monday-Friday, 08:00-20:00 [TIMEZONE])

### 3.3 Support Channels

| Channel | Availability | Severity Levels |
|---|---|---|
| [SUPPORT_CHANNEL_1] (e.g., Phone) | 24/7 | Severity 1-2 |
| [SUPPORT_CHANNEL_2] (e.g., Email) | Business Hours | Severity 1-4 |
| [SUPPORT_CHANNEL_3] (e.g., Portal) | 24/7 | Severity 1-4 |

### 3.4 Escalation Path

| Escalation Level | Timeframe | Contact |
|---|---|---|
| Level 1 - Support Engineer | Immediate | [L1_CONTACT] |
| Level 2 - Senior Engineer | After [L2_ESCALATION_TIME] | [L2_CONTACT] |
| Level 3 - Engineering Manager | After [L3_ESCALATION_TIME] | [L3_CONTACT] |
| Level 4 - VP of Engineering | After [L4_ESCALATION_TIME] | [L4_CONTACT] |

---

## 4. Performance Benchmarks

### 4.1 Application Performance

| Metric | Target | Measurement Method |
|---|---|---|
| API Response Time (p50) | [API_P50_TARGET] (e.g., < 200ms) | [MEASUREMENT_METHOD] |
| API Response Time (p95) | [API_P95_TARGET] (e.g., < 500ms) | [MEASUREMENT_METHOD] |
| API Response Time (p99) | [API_P99_TARGET] (e.g., < 1000ms) | [MEASUREMENT_METHOD] |
| Error Rate | [ERROR_RATE_TARGET] (e.g., < 0.1%) | [MEASUREMENT_METHOD] |
| Throughput | [THROUGHPUT_TARGET] (e.g., 1000 requests/second) | [MEASUREMENT_METHOD] |

### 4.2 Data Processing Performance

| Metric | Target |
|---|---|
| Data Ingestion Latency | [INGESTION_LATENCY_TARGET] |
| Query Response Time | [QUERY_RESPONSE_TARGET] |
| Batch Processing Completion | [BATCH_PROCESSING_TARGET] |
| Data Freshness | [DATA_FRESHNESS_TARGET] |

### 4.3 Infrastructure Performance

| Metric | Target |
|---|---|
| Network Latency | [NETWORK_LATENCY_TARGET] |
| Storage IOPS | [STORAGE_IOPS_TARGET] |
| Backup Completion | [BACKUP_COMPLETION_TARGET] |
| Recovery Time Objective (RTO) | [RTO_TARGET] |
| Recovery Point Objective (RPO) | [RPO_TARGET] |

---

## 5. Service Credits for Downtime

### 5.1 Service Credit Schedule

If Provider fails to meet the Monthly Uptime Percentage commitment, Customer is entitled to the following Service Credits:

| Monthly Uptime Percentage | Service Credit (% of Monthly Fees) |
|---|---|
| 99.0% - 99.89% | [CREDIT_TIER_1]% (e.g., 10%) |
| 95.0% - 98.99% | [CREDIT_TIER_2]% (e.g., 25%) |
| 90.0% - 94.99% | [CREDIT_TIER_3]% (e.g., 50%) |
| Below 90.0% | [CREDIT_TIER_4]% (e.g., 100%) |

### 5.2 Service Credit Request Process

1. Customer must submit a Service Credit request within [CREDIT_REQUEST_WINDOW] (e.g., 30 days) of the end of the calendar month in which the Downtime occurred.
2. Requests must be submitted to [CREDIT_REQUEST_EMAIL] and include: the dates and times of the Downtime, the affected Services, and any relevant incident ticket numbers.
3. Provider shall review and respond to Service Credit requests within [CREDIT_REVIEW_PERIOD] (e.g., 15 business days).

### 5.3 Service Credit Limitations

- Service Credits are the sole and exclusive remedy for failure to meet the uptime commitment.
- Service Credits may not exceed [MAX_CREDIT_PERCENTAGE]% of the total monthly fees for the applicable month.
- Service Credits are applied as a credit against future invoices and are not redeemable for cash.
- Unused Service Credits expire [CREDIT_EXPIRY_PERIOD] after issuance.

### 5.4 Chronic Failure

If the Monthly Uptime Percentage falls below [CHRONIC_FAILURE_THRESHOLD]% for [CHRONIC_FAILURE_CONSECUTIVE_MONTHS] consecutive months, Customer may terminate the Agreement without penalty upon [CHRONIC_FAILURE_NOTICE_PERIOD] written notice.

---

## 6. Exclusions

### 6.1 Scheduled Maintenance

Downtime resulting from Scheduled Maintenance performed during the designated maintenance windows and communicated in accordance with Section 2.3 is excluded from Downtime calculations.

### 6.2 Force Majeure

Neither party shall be liable for failure to meet SLA commitments to the extent caused by events beyond its reasonable control, including but not limited to:

- Natural disasters (earthquakes, floods, hurricanes, wildfires)
- Acts of war, terrorism, or civil unrest
- Government actions, sanctions, or embargoes
- Pandemics or epidemics
- Failure of third-party telecommunications or power infrastructure
- Cyberattacks constituting acts of war

The affected party must provide prompt notice and use commercially reasonable efforts to mitigate the impact.

### 6.3 Customer-Caused Issues

The following are excluded from Downtime calculations and SLA commitments:

- Downtime caused by Customer's misuse of the Services or failure to follow documented guidelines
- Issues arising from Customer's own infrastructure, software, or network connectivity
- Downtime resulting from Customer-requested changes or configurations
- Use of the Services in excess of documented capacity limits without prior arrangement
- Customer's failure to implement Provider-recommended updates or patches within [PATCH_WINDOW]

### 6.4 Third-Party Dependencies

Downtime attributable to failures in third-party services or infrastructure not under Provider's direct control, provided that Provider has implemented commercially reasonable redundancy and failover measures, shall be excluded. Affected third-party services include: [LIST_OF_THIRD_PARTY_SERVICES].

### 6.5 Beta or Preview Services

Services designated as "Beta," "Preview," or "Early Access" are excluded from all SLA commitments.

---

## 7. Monitoring and Reporting

### 7.1 Real-Time Monitoring

Provider shall maintain real-time monitoring of the Services and make a status dashboard available to Customer at [STATUS_DASHBOARD_URL].

### 7.2 Incident Notification

- **Severity 1:** Provider shall notify Customer within [SEV1_NOTIFICATION_TIME] (e.g., 15 minutes) of detecting a Severity 1 incident via [NOTIFICATION_CHANNELS].
- **Severity 2:** Provider shall notify Customer within [SEV2_NOTIFICATION_TIME] (e.g., 1 hour) of detecting a Severity 2 incident.
- **Severity 3-4:** Notification via the status dashboard and/or email within [SEV3_4_NOTIFICATION_TIME].

### 7.3 Monthly Reports

Provider shall deliver a monthly SLA performance report to Customer within [REPORT_DELIVERY_DAYS] (e.g., 10 business days) of the end of each calendar month. Each report shall include:

- Monthly Uptime Percentage
- Summary of all incidents, including root cause and resolution
- Response time compliance by severity level
- Performance benchmark results
- Trend analysis and improvement actions
- Upcoming scheduled maintenance

### 7.4 Quarterly Reviews

Provider and Customer shall conduct quarterly service review meetings to discuss SLA performance, planned improvements, and any adjustments to this SLA. The Provider's representative shall be [PROVIDER_REVIEW_CONTACT] and Customer's representative shall be [CUSTOMER_REVIEW_CONTACT].

### 7.5 Root Cause Analysis

For any Severity 1 or Severity 2 incident, Provider shall deliver a written root cause analysis (RCA) to Customer within [RCA_DELIVERY_DAYS] (e.g., 5 business days) of incident resolution. The RCA shall include:

- Timeline of events
- Root cause identification
- Impact assessment
- Corrective actions taken
- Preventive measures implemented

---

## 8. SLA Modifications

This SLA may be modified only by written agreement signed by authorized representatives of both parties. Provider shall provide at least [SLA_MODIFICATION_NOTICE] (e.g., 90 days) written notice of any proposed material changes to the SLA.

---

## 9. Governing Terms

In the event of a conflict between this SLA and the Master Service Agreement, the terms of the Master Service Agreement shall prevail unless this SLA expressly states otherwise.

---

## Signatures

**Provider: [PROVIDER_LEGAL_NAME]**

| | |
|---|---|
| Signature | _________________________ |
| Name | [PROVIDER_SIGNATORY_NAME] |
| Title | [PROVIDER_SIGNATORY_TITLE] |
| Date | [PROVIDER_SIGN_DATE] |

**Customer: [CUSTOMER_LEGAL_NAME]**

| | |
|---|---|
| Signature | _________________________ |
| Name | [CUSTOMER_SIGNATORY_NAME] |
| Title | [CUSTOMER_SIGNATORY_TITLE] |
| Date | [CUSTOMER_SIGN_DATE] |
