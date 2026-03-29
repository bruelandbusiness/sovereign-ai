# Data Processing Agreement (DPA)

> **Document Type:** Legal Template
> **Version:** 1.0
> **Effective Date:** [PLACEHOLDER — DATE]
> **Last Reviewed:** [PLACEHOLDER — DATE]
>
> **DISCLAIMER:** This template is provided for reference purposes only. It must be reviewed and approved by qualified legal counsel before use. This document is intended to address key requirements of the GDPR and CCPA but may require modification for specific jurisdictions or circumstances.

---

## 1. Parties

This Data Processing Agreement ("DPA") is entered into between:

**Data Controller / Business:**
[PLACEHOLDER — CLIENT LEGAL NAME]
[PLACEHOLDER — CLIENT ADDRESS]
("Controller")

**Data Processor / Service Provider:**
[PLACEHOLDER — COMPANY LEGAL NAME]
[PLACEHOLDER — ADDRESS]
("Processor")

This DPA supplements and forms part of the Master Service Agreement ("MSA") dated [PLACEHOLDER — MSA DATE] between the parties.

---

## 2. Definitions

| Term | Definition |
|---|---|
| **Personal Data** | Any information relating to an identified or identifiable natural person, as defined under GDPR Art. 4(1) and CCPA Cal. Civ. Code 1798.140(v) |
| **Processing** | Any operation performed on Personal Data, including collection, recording, storage, retrieval, use, disclosure, erasure, or destruction |
| **Data Subject** | An identified or identifiable natural person whose Personal Data is processed |
| **Sub-processor** | A third party engaged by Processor to process Personal Data on behalf of Controller |
| **Data Breach** | A breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to Personal Data |
| **GDPR** | Regulation (EU) 2016/679 (General Data Protection Regulation) |
| **CCPA** | California Consumer Privacy Act, Cal. Civ. Code 1798.100 et seq., as amended by the CPRA |
| **Supervisory Authority** | An independent public authority established by an EU Member State pursuant to GDPR Art. 51 |

---

## 3. Scope and Purpose of Processing

### 3.1 Purpose

Processor processes Personal Data solely for the purpose of providing the Services described in the MSA, including:

- User account management and authentication
- Client relationship management
- Communication delivery (email, SMS)
- Payment processing and billing
- Analytics and reporting
- AI-powered automation services

### 3.2 Categories of Data Subjects

| Category | Description |
|---|---|
| Controller's employees | Staff who access the platform |
| Controller's customers | End users of Controller's services managed through the platform |
| Controller's prospects | Potential customers whose data is stored in the platform |
| Controller's vendors | Third parties whose contact information is stored in the platform |

### 3.3 Types of Personal Data

| Data Category | Examples |
|---|---|
| **Identity Data** | First name, last name, title, company name |
| **Contact Data** | Email address, phone number, mailing address |
| **Account Data** | Username, password (hashed), role, preferences |
| **Transaction Data** | Payment history, invoices, subscription details |
| **Communication Data** | Emails sent/received, SMS messages, notes |
| **Usage Data** | Login timestamps, feature usage, IP addresses |
| **Device Data** | Browser type, operating system, device identifiers |

### 3.4 Special Categories of Data

Processor does **not** intentionally collect or process special categories of Personal Data as defined in GDPR Art. 9 (racial or ethnic origin, political opinions, religious beliefs, genetic data, biometric data, health data, sex life or sexual orientation).

Controller shall not submit special categories of data to the Service without prior written consent from Processor and execution of additional safeguards.

---

## 4. Processor Obligations

### 4.1 General Obligations

Processor shall:

1. Process Personal Data only on documented instructions from Controller, including transfers to third countries, unless required by applicable law
2. Ensure that persons authorized to process Personal Data have committed to confidentiality or are under statutory obligation of confidentiality
3. Implement appropriate technical and organizational security measures (see Section 6)
4. Comply with the conditions for engaging Sub-processors (see Section 7)
5. Assist Controller in responding to Data Subject requests (see Section 8)
6. Assist Controller in ensuring compliance with obligations regarding Data Breach notification (see Section 9)
7. Delete or return all Personal Data upon termination of the MSA, at Controller's choice (see Section 11)
8. Make available to Controller all information necessary to demonstrate compliance with this DPA
9. Allow for and contribute to audits conducted by Controller or an authorized auditor (see Section 10)

### 4.2 Data Processing Locations

Personal Data shall be processed in the following locations:

| Processing Activity | Location | Provider |
|---|---|---|
| Application hosting | United States (AWS us-east-1) | Vercel / AWS |
| Database | United States | [PLACEHOLDER — e.g., Supabase, Neon, AWS RDS] |
| Email delivery | United States | SendGrid (Twilio Inc.) |
| SMS delivery | United States | Twilio Inc. |
| Payment processing | United States | Stripe, Inc. |
| Error monitoring | United States | [PLACEHOLDER — e.g., Sentry] |
| AI processing | United States | [PLACEHOLDER — e.g., Anthropic, OpenAI] |

### 4.3 International Data Transfers

Where Personal Data is transferred outside the European Economic Area (EEA):

- Transfers to the United States are subject to the EU-U.S. Data Privacy Framework where applicable
- Where the Data Privacy Framework does not apply, Standard Contractual Clauses (SCCs) as approved by the European Commission shall govern
- Processor shall provide copies of relevant transfer mechanisms upon request

---

## 5. Controller Obligations

Controller shall:

1. Ensure it has a lawful basis for processing Personal Data and for instructing Processor
2. Provide clear, documented processing instructions to Processor
3. Comply with applicable data protection laws regarding collection and use of Personal Data
4. Ensure Data Subjects are provided appropriate privacy notices
5. Notify Processor promptly of any Data Subject requests or complaints
6. Conduct data protection impact assessments where required

---

## 6. Security Measures

### 6.1 Technical Measures

Processor implements and maintains the following technical security measures:

| Category | Measure |
|---|---|
| **Encryption at Rest** | AES-256 encryption for all stored Personal Data |
| **Encryption in Transit** | TLS 1.2+ for all data in transit |
| **Access Control** | Role-based access control (RBAC); principle of least privilege |
| **Authentication** | Multi-factor authentication (MFA) required for all staff with data access |
| **Network Security** | Firewall protection, DDoS mitigation, network segmentation |
| **Vulnerability Management** | Regular vulnerability scanning; dependency auditing |
| **Logging and Monitoring** | Audit logging of all data access; real-time anomaly detection |
| **Backup** | Automated encrypted backups; tested restoration procedures |
| **Password Storage** | Bcrypt hashing with appropriate cost factor; no plaintext storage |

### 6.2 Organizational Measures

| Category | Measure |
|---|---|
| **Employee Training** | Annual data protection and security training for all staff |
| **Background Checks** | Pre-employment screening for staff with data access |
| **Confidentiality** | All staff bound by written confidentiality obligations |
| **Access Reviews** | Quarterly review of access permissions |
| **Incident Response** | Documented incident response plan; tested annually |
| **Business Continuity** | Disaster recovery plan with defined RPO and RTO |
| **Vendor Management** | Due diligence and contractual data protection requirements for all Sub-processors |

---

## 7. Sub-processors

### 7.1 Authorized Sub-processors

Controller provides general authorization for Processor to engage Sub-processors, subject to the requirements in this Section.

**Current Sub-processor List:**

| Sub-processor | Purpose | Location | Data Processed |
|---|---|---|---|
| Vercel Inc. | Application hosting and CDN | United States | All application data |
| [PLACEHOLDER — DB Provider] | Database hosting | United States | All stored data |
| Stripe, Inc. | Payment processing | United States | Payment and billing data |
| Twilio Inc. (SendGrid) | Email delivery | United States | Email addresses, email content |
| Twilio Inc. | SMS delivery | United States | Phone numbers, message content |
| [PLACEHOLDER — AI Provider] | AI processing | United States | Content submitted for AI processing |
| [PLACEHOLDER — Monitoring] | Error tracking | United States | Error data, user context |

### 7.2 Sub-processor Changes

1. Processor shall notify Controller at least **30 days** in advance of adding or replacing a Sub-processor
2. Notification shall include the Sub-processor's name, location, and processing activities
3. Controller may object to a new Sub-processor within **14 days** of notification
4. If Controller objects on reasonable data protection grounds and the parties cannot resolve the objection within 30 days, Controller may terminate the affected Services without penalty

### 7.3 Sub-processor Requirements

Processor shall:
- Impose data protection obligations no less protective than this DPA on all Sub-processors
- Remain fully liable for the acts and omissions of its Sub-processors
- Conduct appropriate due diligence on Sub-processors before engagement
- Maintain an up-to-date list of Sub-processors available to Controller upon request

---

## 8. Data Subject Rights

### 8.1 Supported Rights

Processor shall assist Controller in responding to the following Data Subject requests:

| Right | GDPR Article | CCPA Equivalent | Response Timeline |
|---|---|---|---|
| Right of Access | Art. 15 | Right to Know (1798.110) | 30 days |
| Right to Rectification | Art. 16 | Right to Correct (1798.106) | 30 days |
| Right to Erasure | Art. 17 | Right to Delete (1798.105) | 30 days |
| Right to Restriction | Art. 18 | — | 30 days |
| Right to Portability | Art. 20 | — | 30 days |
| Right to Object | Art. 21 | Right to Opt-Out (1798.120) | 30 days |
| Right re: Automated Decisions | Art. 22 | Right to Opt-Out of Automated Decision-Making (1798.185) | 30 days |

### 8.2 Request Handling Procedure

1. Controller receives Data Subject request
2. Controller notifies Processor (if assistance needed) via [PLACEHOLDER — PRIVACY EMAIL]
3. Processor acknowledges within **2 business days**
4. Processor provides requested data or completes action within **10 business days**
5. Controller responds to Data Subject within statutory deadline
6. Processor shall not respond directly to Data Subjects unless instructed by Controller

### 8.3 Data Export Format

Upon request, Processor shall export Personal Data in:
- JSON format (structured data)
- CSV format (tabular data)
- Encrypted archive for secure transfer

---

## 9. Data Breach Notification

### 9.1 Notification Timeline

| Action | Timeline |
|---|---|
| Processor notifies Controller of confirmed breach | Without undue delay, no later than **48 hours** |
| Processor provides initial breach report | Within **72 hours** of discovery |
| Processor provides detailed breach report | Within **5 business days** |
| Controller notifies Supervisory Authority (if required) | Within **72 hours** of becoming aware (GDPR Art. 33) |
| Controller notifies affected Data Subjects (if required) | Without undue delay (GDPR Art. 34) |

### 9.2 Breach Notification Content

Processor's notification shall include, to the extent available:

1. Description of the nature of the breach
2. Categories and approximate number of Data Subjects affected
3. Categories and approximate number of Personal Data records affected
4. Name and contact details of the Processor's data protection point of contact
5. Description of likely consequences of the breach
6. Description of measures taken or proposed to address the breach and mitigate adverse effects

### 9.3 Breach Response

Processor shall:

1. Take immediate steps to contain and remediate the breach
2. Preserve evidence for investigation
3. Cooperate fully with Controller's investigation
4. Not notify Data Subjects or third parties without Controller's prior written consent (unless required by law)
5. Conduct a post-incident review and provide findings to Controller
6. Implement measures to prevent recurrence

---

## 10. Audits and Compliance

### 10.1 Audit Rights

1. Controller may audit Processor's compliance with this DPA once per calendar year
2. Audits shall be conducted during business hours with at least **30 days** written notice
3. Controller shall bear its own costs for audits
4. Audits shall not unreasonably disrupt Processor's operations
5. Controller may engage a qualified third-party auditor, subject to confidentiality obligations

### 10.2 Certifications and Reports

Processor shall maintain and provide upon request:

- SOC 2 Type II report (or equivalent) — [PLACEHOLDER — AVAILABLE / IN PROGRESS]
- Penetration test summary (conducted annually by [PLACEHOLDER — FIRM NAME])
- Data protection impact assessment results (where applicable)
- Records of processing activities (GDPR Art. 30)

---

## 11. Data Retention and Deletion

### 11.1 Retention Periods

| Data Category | Retention Period | Basis |
|---|---|---|
| Active account data | Duration of MSA | Contractual necessity |
| Communication logs | 12 months after creation | Legitimate interest (support) |
| Transaction records | 7 years after transaction | Legal obligation (tax/accounting) |
| Usage/analytics data | 24 months after collection | Legitimate interest (improvement) |
| Error and debug logs | 90 days | Legitimate interest (operations) |
| Backup data | 30 days after primary deletion | Business continuity |

### 11.2 Post-Termination

Upon termination of the MSA:

1. Controller may request data export within **30 days** of termination
2. Processor shall delete all Personal Data within **60 days** of termination (or earlier upon written request)
3. Processor shall provide written certification of deletion upon request
4. Data retained for legal obligations shall be isolated and protected until deletion is permissible

### 11.3 Deletion Standards

- Electronic data: Cryptographic erasure or overwrite per NIST SP 800-88
- Backup data: Deleted upon normal backup rotation cycle (maximum 30 days)
- Sub-processors: Processor shall ensure Sub-processors delete data per the same standards

---

## 12. CCPA-Specific Provisions

Where Controller is a "Business" and Processor is a "Service Provider" under the CCPA:

1. Processor shall not sell or share Personal Data
2. Processor shall not retain, use, or disclose Personal Data for any purpose other than performing the Services
3. Processor shall not combine Personal Data with data received from other sources, except as permitted by the CCPA
4. Processor shall comply with the CCPA and grant Controller the same level of privacy protection as required by the CCPA
5. Processor shall notify Controller if it determines it can no longer meet its CCPA obligations
6. Controller has the right to take reasonable steps to ensure Processor uses Personal Data consistently with Controller's CCPA obligations

---

## 13. Liability

- Liability under this DPA is subject to the limitation of liability provisions in the MSA
- Each party shall be liable for damages caused by its breach of applicable data protection laws
- Processor shall indemnify Controller for fines and penalties arising from Processor's breach of this DPA or applicable data protection laws, subject to the liability cap in the MSA

---

## 14. Term

- This DPA shall remain in effect for the duration of the MSA
- Obligations regarding data deletion and confidentiality shall survive termination
- Sections 9 (Data Breach), 10 (Audits), 11 (Retention/Deletion), and 13 (Liability) shall survive termination

---

## 15. Contact Information

| Role | Contact |
|---|---|
| Processor's Data Protection Officer (or Privacy Contact) | [PLACEHOLDER — NAME, EMAIL] |
| Controller's Data Protection Contact | [PLACEHOLDER — NAME, EMAIL] |
| Privacy Inquiries | [PLACEHOLDER — PRIVACY@COMPANY.COM] |
| Breach Notifications | [PLACEHOLDER — SECURITY@COMPANY.COM] |

---

## 16. Signatures

| | Controller | Processor |
|---|---|---|
| **Name** | [PLACEHOLDER] | [PLACEHOLDER] |
| **Title** | [PLACEHOLDER] | [PLACEHOLDER] |
| **Signature** | _________________________ | _________________________ |
| **Date** | [PLACEHOLDER] | [PLACEHOLDER] |

---

## Appendix A: Standard Contractual Clauses

[PLACEHOLDER — Attach the EU Commission's Standard Contractual Clauses (Module Two: Controller to Processor) as adopted by Commission Implementing Decision (EU) 2021/914, if international data transfers are applicable.]
