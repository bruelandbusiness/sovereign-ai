# Data Processing Agreement (DPA)

**Between**: Sovereign AI ("Processor")
**And**: [CLIENT_COMPANY_NAME] ("Controller")
**Effective Date**: [DATE]
**Agreement Number**: DPA-[YYYY]-[NNN]

*This DPA supplements the Master Service Agreement (MSA) between the parties and governs the processing of personal data in connection with the services provided.*

---

## 1. Definitions

- **Personal Data**: Any information relating to an identified or identifiable natural person, including but not limited to names, email addresses, phone numbers, IP addresses, and location data.
- **Processing**: Any operation performed on personal data, including collection, recording, storage, retrieval, use, disclosure, or deletion.
- **Data Subject**: An identified or identifiable natural person whose personal data is processed.
- **Controller**: The party that determines the purposes and means of processing personal data (the Client).
- **Processor**: The party that processes personal data on behalf of the Controller (Sovereign AI).
- **Sub-Processor**: A third party engaged by the Processor to process personal data on behalf of the Controller.
- **Data Breach**: A breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal data.

---

## 2. Roles and Responsibilities

### 2.1 Controller (Client)

The Controller:
- Determines the purposes and means of processing personal data
- Ensures a lawful basis exists for data collection (consent, legitimate interest, contract)
- Is responsible for providing notice to data subjects about data processing
- Is responsible for responding to data subject access requests
- Warrants that all personal data provided to the Processor has been lawfully collected

### 2.2 Processor (Sovereign AI)

The Processor:
- Processes personal data only on documented instructions from the Controller
- Ensures personnel authorized to process personal data are bound by confidentiality obligations
- Implements appropriate technical and organizational security measures
- Assists the Controller in responding to data subject requests
- Notifies the Controller of any data breach without undue delay
- Deletes or returns all personal data upon termination of the agreement

---

## 3. Types of Data Processed

### 3.1 Categories of Data Subjects

| Category | Description |
|----------|-------------|
| Client's customers | Individuals who contact or engage with the Client's business |
| Client's leads | Prospective customers who submit inquiries or request services |
| Client's employees | Staff members who access the Sovereign AI platform |
| Website visitors | Individuals who visit the Client's website with Sovereign AI integrations |

### 3.2 Categories of Personal Data

| Data Category | Specific Data Elements | Purpose |
|--------------|----------------------|---------|
| **Contact information** | Name, email, phone number, mailing address | Lead management, communication, service delivery |
| **Business information** | Company name, job title, industry | Account management, service customization |
| **Communication records** | Call transcripts, emails, SMS messages, chat logs | AI receptionist service, lead follow-up, quality assurance |
| **Service interaction data** | Dashboard usage, service preferences, support tickets | Service delivery, product improvement |
| **Financial data** | Billing address, payment status (no card numbers stored) | Billing and subscription management |
| **Technical data** | IP address, browser type, device information | Security, analytics, platform optimization |
| **Location data** | Service area, city, state, zip code | Local SEO, targeted advertising, lead routing |
| **Review data** | Review content, ratings, reviewer names | Reputation management services |

### 3.3 Sensitive Data

The Processor does not intentionally collect or process sensitive personal data (racial or ethnic origin, political opinions, religious beliefs, health data, biometric data, etc.). If the Controller becomes aware that sensitive data has been inadvertently collected, they must notify the Processor immediately.

---

## 4. Processing Purposes

Personal data is processed solely for the following purposes:

1. **Service delivery** -- Providing the contracted AI marketing and automation services
2. **Lead management** -- Capturing, scoring, routing, and nurturing leads
3. **Communication** -- Sending emails, SMS, and push notifications on behalf of the Controller
4. **AI services** -- Processing call transcripts and text through AI models for receptionist and automation services
5. **Analytics and reporting** -- Generating performance reports and dashboards
6. **Billing** -- Processing payments and managing subscriptions
7. **Support** -- Resolving technical issues and responding to support requests
8. **Security** -- Protecting the platform and detecting fraudulent activity
9. **Legal compliance** -- Meeting legal and regulatory requirements

The Processor will not process personal data for any purpose not listed above without prior written consent from the Controller.

---

## 5. Data Retention

### 5.1 Retention Periods

| Data Category | Retention Period | Justification |
|--------------|-----------------|---------------|
| Active client data | Duration of service agreement | Service delivery |
| Lead data | 24 months after last interaction | Lead nurturing lifecycle |
| Call transcripts | 12 months | Quality assurance, dispute resolution |
| Email/SMS communication logs | 12 months | Compliance, audit trail |
| Billing records | 7 years after transaction | Tax and legal compliance |
| Support tickets | 24 months after resolution | Service improvement |
| Analytics/usage data | 24 months | Reporting, trend analysis |
| Website visitor data | 13 months | Analytics (aligned with cookie consent) |

### 5.2 Post-Termination

Upon termination of the MSA:
1. Controller may request export of all personal data within 30 days
2. Processor will delete all personal data within 90 days of termination
3. Processor will provide written confirmation of deletion upon request
4. Retention obligations for billing records (7 years) survive termination

---

## 6. Security Measures

### 6.1 Technical Measures

The Processor implements the following technical security measures:

- **Encryption in transit**: TLS 1.2+ for all data in transit
- **Encryption at rest**: AES-256 encryption for stored data
- **Access control**: Role-based access control (RBAC) with principle of least privilege
- **Authentication**: Multi-factor authentication for administrative access
- **Network security**: Firewall protection, DDoS mitigation (via Vercel)
- **Monitoring**: Real-time error monitoring (Sentry), automated health checks
- **Logging**: Structured audit logs for all data access and modifications
- **Rate limiting**: API rate limiting to prevent abuse
- **CSRF protection**: Origin-based CSRF validation on all endpoints
- **Input validation**: Schema-based validation (Zod) on all inputs

### 6.2 Organizational Measures

- **Employee training**: All personnel receive data protection training
- **Confidentiality agreements**: All personnel sign confidentiality obligations
- **Access reviews**: Quarterly review of access permissions
- **Incident response plan**: Documented and tested incident response procedures
- **Vendor assessment**: Security evaluation of all sub-processors
- **Background checks**: Background checks for personnel with data access

### 6.3 Infrastructure Security

- **Hosting**: Vercel (SOC 2 Type II certified)
- **Database**: Neon PostgreSQL (SOC 2 Type II certified, encrypted at rest)
- **Payment processing**: Stripe (PCI DSS Level 1 certified)
- **No card data storage**: Payment card numbers are never stored on Sovereign AI systems

---

## 7. Sub-Processors

### 7.1 Authorized Sub-Processors

The Controller provides general authorization for the Processor to engage the following sub-processors:

| Sub-Processor | Service | Data Processed | Location |
|--------------|---------|---------------|----------|
| Vercel Inc. | Hosting, CDN, serverless functions | All platform data | United States |
| Neon Inc. | Database hosting | All stored data | United States |
| Stripe Inc. | Payment processing | Billing data, email | United States |
| Anthropic PBC | AI language model | Call transcripts, text content | United States |
| Twilio Inc. | SMS and voice services | Phone numbers, call data | United States |
| Sentry (Functional Software) | Error monitoring | Error context, IP addresses | United States |

### 7.2 Sub-Processor Changes

- Processor will notify Controller at least 30 days before engaging a new sub-processor
- Controller may object to a new sub-processor within 14 days of notification
- If Controller objects, the parties will work in good faith to resolve the concern
- If no resolution is reached, Controller may terminate the affected service without penalty

### 7.3 Sub-Processor Obligations

The Processor ensures that all sub-processors:
- Are bound by data protection obligations no less protective than this DPA
- Implement appropriate technical and organizational security measures
- Process data only for the specified purposes
- Delete or return data upon termination of the sub-processing relationship

---

## 8. Data Subject Rights

### 8.1 Supported Rights

The Processor will assist the Controller in fulfilling data subject requests for:

| Right | Description | Response Timeline |
|-------|-------------|-------------------|
| **Access** | Right to obtain a copy of their personal data | 30 days |
| **Rectification** | Right to correct inaccurate personal data | 30 days |
| **Erasure** ("Right to be Forgotten") | Right to request deletion of personal data | 30 days |
| **Restriction** | Right to restrict processing of personal data | 30 days |
| **Portability** | Right to receive data in a structured, machine-readable format | 30 days |
| **Objection** | Right to object to processing based on legitimate interests | 30 days |
| **Opt-out of sale** (CCPA) | Right to opt out of the sale of personal information | 15 business days |

### 8.2 Process

1. Controller receives data subject request
2. Controller forwards request to Processor at privacy@trysovereignai.com
3. Processor fulfills the request within the applicable timeline
4. Processor confirms completion to Controller
5. Controller communicates outcome to data subject

### 8.3 Verification

The Processor will verify the identity of data subjects (via the Controller) before fulfilling requests to prevent unauthorized access or deletion.

---

## 9. Data Breach Notification

### 9.1 Notification Timeline

- Processor will notify Controller of any confirmed data breach **within 72 hours** of becoming aware
- Notification will be sent to Controller's designated privacy contact via email and phone

### 9.2 Notification Contents

Breach notifications will include:

1. Nature of the breach (what happened)
2. Categories and approximate number of data subjects affected
3. Categories and approximate number of records affected
4. Name and contact details of the Processor's data protection contact
5. Likely consequences of the breach
6. Measures taken or proposed to address the breach and mitigate harm

### 9.3 Cooperation

The Processor will:
- Cooperate with the Controller in investigating the breach
- Assist the Controller in notifying supervisory authorities and data subjects as required
- Take immediate steps to contain and remediate the breach
- Preserve evidence related to the breach
- Provide regular updates until the breach is resolved

### 9.4 Documentation

The Processor will maintain a record of all data breaches, including facts, effects, and remedial actions taken, regardless of whether notification to the Controller was required.

---

## 10. CCPA Compliance (California)

### 10.1 Processor as Service Provider

Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), the Processor acts as a "Service Provider" and:

- Processes personal information only for the business purposes specified in this DPA
- Does not sell personal information
- Does not retain, use, or disclose personal information for purposes other than providing the services
- Does not combine personal information with data from other sources except as permitted
- Provides the same level of privacy protection as required by the CCPA

### 10.2 Consumer Rights

The Processor will assist the Controller in responding to consumer requests under CCPA, including:
- Right to know what personal information is collected
- Right to delete personal information
- Right to opt-out of the sale of personal information (N/A -- Processor does not sell data)
- Right to non-discrimination for exercising privacy rights

### 10.3 Certification

The Processor certifies that it understands and will comply with the restrictions and obligations set forth in this DPA and the CCPA.

---

## 11. GDPR Compliance (European Union)

### 11.1 Applicability

This section applies when the Processor processes personal data of data subjects located in the European Economic Area (EEA) or United Kingdom.

### 11.2 Legal Basis

The Controller is responsible for ensuring a valid legal basis for processing under GDPR Article 6 (consent, contract, legitimate interest, legal obligation, vital interest, or public interest).

### 11.3 International Transfers

- Personal data is processed in the United States
- Transfers are governed by Standard Contractual Clauses (SCCs) as adopted by the European Commission
- The Processor implements supplementary measures (encryption, access controls) to protect transferred data
- The Controller acknowledges and consents to the transfer of data to the United States

### 11.4 Data Protection Officer

If required by applicable law, the Controller should designate a Data Protection Officer. The Processor's privacy contact is:

**Privacy Contact**: privacy@trysovereignai.com

### 11.5 Data Protection Impact Assessments

The Processor will assist the Controller in conducting Data Protection Impact Assessments (DPIAs) when processing is likely to result in a high risk to data subjects.

---

## 12. Audit Rights

### 12.1 Controller Audit Rights

The Controller may audit the Processor's compliance with this DPA:
- Upon 30 days written notice
- During normal business hours
- No more than once per year (unless a breach has occurred)
- At the Controller's expense

### 12.2 Audit Alternatives

In lieu of an on-site audit, the Processor may provide:
- SOC 2 Type II audit reports (from infrastructure providers)
- Completed security questionnaires
- Results of third-party penetration tests
- Data protection compliance certifications

---

## 13. Term and Termination

- This DPA remains in effect for the duration of the MSA
- Obligations regarding data deletion survive termination (see Section 5.2)
- Obligations regarding confidentiality survive termination indefinitely
- The Processor will cooperate with any post-termination data requests for 90 days

---

## 14. Signatures

| | Processor (Sovereign AI) | Controller (Client) |
|-|--------------------------|---------------------|
| **Name** | ________________________ | ________________________ |
| **Title** | ________________________ | ________________________ |
| **Date** | ________________________ | ________________________ |
| **Signature** | ________________________ | ________________________ |

---

## Appendix A: Standard Contractual Clauses

*For international data transfers involving EEA data subjects, the Standard Contractual Clauses (Module Two: Controller to Processor) as adopted by the European Commission Decision 2021/914 are incorporated by reference.*

## Appendix B: Technical and Organizational Measures

*See Section 6 of this DPA for the complete list of security measures implemented by the Processor.*
