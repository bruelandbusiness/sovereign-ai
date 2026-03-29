/**
 * Compliance and regulatory checker utility.
 * Works on provided metadata — no actual content scanning.
 * Pure utility module — no database calls, no side effects.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type ComplianceStatus = "compliant" | "non_compliant" | "partial" | "unknown";

export type RegulationId =
  | "CAN-SPAM"
  | "TCPA"
  | "GDPR"
  | "CCPA"
  | "ADA"
  | "FTC";

export type ContentType =
  | "email"
  | "sms"
  | "web_page"
  | "advertisement"
  | "data_collection"
  | "social_media";

export interface Violation {
  readonly regulationId: RegulationId;
  readonly requirementKey: string;
  readonly description: string;
  readonly severity: "critical" | "high" | "medium" | "low";
  readonly remediation: string;
}

export interface ComplianceCheck {
  readonly regulationId: RegulationId;
  readonly status: ComplianceStatus;
  readonly violations: readonly Violation[];
  readonly checkedAt: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface Regulation {
  readonly id: RegulationId;
  readonly name: string;
  readonly description: string;
  readonly requirements: readonly RegulationRequirement[];
}

export interface RegulationRequirement {
  readonly key: string;
  readonly description: string;
  readonly severity: "critical" | "high" | "medium" | "low";
  readonly remediation: string;
}

export interface ComplianceReport {
  readonly generatedAt: Date;
  readonly overallStatus: ComplianceStatus;
  readonly checks: readonly ComplianceCheck[];
  readonly totalViolations: number;
  readonly criticalViolations: number;
  readonly summary: string;
}

export interface Disclosure {
  readonly regulationId: RegulationId;
  readonly requirementKey: string;
  readonly text: string;
  readonly required: boolean;
}

/* ------------------------------------------------------------------ */
/*  Input Metadata Types                                               */
/* ------------------------------------------------------------------ */

export interface EmailMetadata {
  readonly hasUnsubscribeLink: boolean;
  readonly hasPhysicalAddress: boolean;
  readonly hasAccurateFromField: boolean;
  readonly hasAccurateSubjectLine: boolean;
  readonly isTransactional: boolean;
}

export interface SMSMetadata {
  readonly hasRecipientConsent: boolean;
  readonly hasOptOutMechanism: boolean;
  readonly sendHour: number;
  readonly sendTimezone: string;
  readonly isAutomated: boolean;
}

export interface DataHandlingMetadata {
  readonly hasProcessingConsent: boolean;
  readonly supportsRightToDeletion: boolean;
  readonly supportsDataPortability: boolean;
  readonly disclosesDataCollection: boolean;
  readonly supportsOptOutOfSale: boolean;
  readonly supportsDeletionRequests: boolean;
  readonly dataSubjectRegion: "EU" | "California" | "other" | "unknown";
}

export interface AdMetadata {
  readonly isTruthfulClaim: boolean;
  readonly disclosesAIContent: boolean;
  readonly hasTestimonialDisclosure: boolean;
  readonly containsTestimonials: boolean;
  readonly containsAIGeneratedContent: boolean;
}

/* ------------------------------------------------------------------ */
/*  REGULATIONS Constant                                               */
/* ------------------------------------------------------------------ */

export const REGULATIONS: readonly Regulation[] = [
  {
    id: "CAN-SPAM",
    name: "CAN-SPAM Act",
    description:
      "U.S. law setting rules for commercial email and messaging.",
    requirements: [
      {
        key: "unsubscribe_link",
        description: "Must include a visible, functional unsubscribe link.",
        severity: "critical",
        remediation:
          "Add a clearly labeled unsubscribe link to the email body.",
      },
      {
        key: "physical_address",
        description:
          "Must include the sender's valid physical postal address.",
        severity: "critical",
        remediation:
          "Add your business physical mailing address to the email footer.",
      },
      {
        key: "accurate_from",
        description:
          "The 'From' field must accurately identify the sender.",
        severity: "high",
        remediation:
          "Ensure the From header truthfully represents the sending entity.",
      },
      {
        key: "accurate_subject",
        description:
          "The subject line must not be deceptive or misleading.",
        severity: "high",
        remediation:
          "Revise the subject line to accurately reflect the email content.",
      },
    ],
  },
  {
    id: "TCPA",
    name: "Telephone Consumer Protection Act",
    description:
      "U.S. law governing telemarketing calls, SMS messages, and faxes.",
    requirements: [
      {
        key: "consent",
        description:
          "Must obtain prior express consent before sending SMS or making calls.",
        severity: "critical",
        remediation:
          "Collect and record explicit opt-in consent before contacting.",
      },
      {
        key: "opt_out",
        description: "Must provide a clear opt-out mechanism in every message.",
        severity: "critical",
        remediation:
          "Include opt-out instructions (e.g., 'Reply STOP to unsubscribe').",
      },
      {
        key: "time_restrictions",
        description:
          "Calls and messages may only be sent between 8:00 AM and 9:00 PM recipient local time.",
        severity: "high",
        remediation:
          "Schedule messages within 8:00 AM - 9:00 PM in the recipient's timezone.",
      },
    ],
  },
  {
    id: "GDPR",
    name: "General Data Protection Regulation",
    description:
      "EU regulation on data protection and privacy for individuals in the EU/EEA.",
    requirements: [
      {
        key: "processing_consent",
        description:
          "Must obtain explicit consent for data processing or have a lawful basis.",
        severity: "critical",
        remediation:
          "Implement a consent mechanism and record consent before processing data.",
      },
      {
        key: "right_to_deletion",
        description:
          "Data subjects have the right to request erasure of personal data.",
        severity: "critical",
        remediation:
          "Implement a data deletion workflow accessible to data subjects.",
      },
      {
        key: "data_portability",
        description:
          "Data subjects can request their data in a portable, machine-readable format.",
        severity: "high",
        remediation:
          "Provide a data export feature that outputs data in a standard format (e.g., JSON, CSV).",
      },
    ],
  },
  {
    id: "CCPA",
    name: "California Consumer Privacy Act",
    description:
      "California state law enhancing privacy rights for residents of California.",
    requirements: [
      {
        key: "disclosure",
        description:
          "Must disclose what personal data is collected and how it is used.",
        severity: "critical",
        remediation:
          "Publish a clear privacy notice detailing data collection practices.",
      },
      {
        key: "opt_out_of_sale",
        description:
          "Consumers must be able to opt out of the sale of their personal information.",
        severity: "critical",
        remediation:
          "Add a 'Do Not Sell My Personal Information' link to your site.",
      },
      {
        key: "deletion_requests",
        description:
          "Consumers may request deletion of their personal information.",
        severity: "high",
        remediation:
          "Implement a process to handle and fulfill deletion requests within 45 days.",
      },
    ],
  },
  {
    id: "ADA",
    name: "Americans with Disabilities Act",
    description:
      "U.S. civil rights law prohibiting discrimination based on disability, including digital accessibility.",
    requirements: [
      {
        key: "web_accessibility",
        description:
          "Web content must be accessible to users with disabilities (WCAG compliance).",
        severity: "critical",
        remediation:
          "Audit your site against WCAG 2.1 AA and remediate failures.",
      },
      {
        key: "alternative_text",
        description:
          "All non-decorative images must have descriptive alternative text.",
        severity: "high",
        remediation:
          "Add meaningful alt attributes to all informational images.",
      },
      {
        key: "keyboard_navigation",
        description:
          "All interactive elements must be operable via keyboard alone.",
        severity: "high",
        remediation:
          "Ensure every interactive element is focusable and operable without a mouse.",
      },
    ],
  },
  {
    id: "FTC",
    name: "Federal Trade Commission Act (Section 5)",
    description:
      "U.S. rules on unfair or deceptive acts in advertising and commerce.",
    requirements: [
      {
        key: "truth_in_advertising",
        description:
          "Advertising claims must be truthful, not misleading, and substantiated.",
        severity: "critical",
        remediation:
          "Review all ad claims for accuracy and remove or substantiate any unverified claims.",
      },
      {
        key: "ai_content_disclosure",
        description:
          "Content generated by AI must be clearly disclosed to consumers.",
        severity: "high",
        remediation:
          "Add a visible disclosure indicating that content is AI-generated.",
      },
      {
        key: "testimonial_guidelines",
        description:
          "Testimonials must reflect honest opinions and disclose material connections.",
        severity: "high",
        remediation:
          "Ensure endorsements include required disclosures (e.g., #ad, sponsored).",
      },
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Helper: find a regulation by ID                                    */
/* ------------------------------------------------------------------ */

function findRegulation(id: RegulationId): Regulation {
  const reg = REGULATIONS.find((r) => r.id === id);
  if (!reg) {
    throw new Error(`Unknown regulation: ${id}`);
  }
  return reg;
}

/* ------------------------------------------------------------------ */
/*  Helper: build a Violation from a requirement                       */
/* ------------------------------------------------------------------ */

function buildViolation(
  regulationId: RegulationId,
  req: RegulationRequirement,
): Violation {
  return {
    regulationId,
    requirementKey: req.key,
    description: req.description,
    severity: req.severity,
    remediation: req.remediation,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper: derive status from violations list                         */
/* ------------------------------------------------------------------ */

function deriveStatus(
  violations: readonly Violation[],
  totalRequirements: number,
): ComplianceStatus {
  if (violations.length === 0) {
    return "compliant";
  }
  if (violations.length === totalRequirements) {
    return "non_compliant";
  }
  return "partial";
}

/* ------------------------------------------------------------------ */
/*  checkEmailCompliance                                               */
/* ------------------------------------------------------------------ */

export function checkEmailCompliance(
  metadata: EmailMetadata,
): ComplianceCheck {
  const regulation = findRegulation("CAN-SPAM");
  const violations: Violation[] = [];

  if (metadata.isTransactional) {
    return {
      regulationId: "CAN-SPAM",
      status: "compliant",
      violations: [],
      checkedAt: new Date(),
      metadata: { isTransactional: true },
    };
  }

  if (!metadata.hasUnsubscribeLink) {
    const req = regulation.requirements.find(
      (r) => r.key === "unsubscribe_link",
    );
    if (req) {
      violations.push(buildViolation("CAN-SPAM", req));
    }
  }

  if (!metadata.hasPhysicalAddress) {
    const req = regulation.requirements.find(
      (r) => r.key === "physical_address",
    );
    if (req) {
      violations.push(buildViolation("CAN-SPAM", req));
    }
  }

  if (!metadata.hasAccurateFromField) {
    const req = regulation.requirements.find(
      (r) => r.key === "accurate_from",
    );
    if (req) {
      violations.push(buildViolation("CAN-SPAM", req));
    }
  }

  if (!metadata.hasAccurateSubjectLine) {
    const req = regulation.requirements.find(
      (r) => r.key === "accurate_subject",
    );
    if (req) {
      violations.push(buildViolation("CAN-SPAM", req));
    }
  }

  return {
    regulationId: "CAN-SPAM",
    status: deriveStatus(violations, regulation.requirements.length),
    violations,
    checkedAt: new Date(),
    metadata: { ...metadata },
  };
}

/* ------------------------------------------------------------------ */
/*  checkSMSCompliance                                                 */
/* ------------------------------------------------------------------ */

const TCPA_EARLIEST_HOUR = 8;
const TCPA_LATEST_HOUR = 21; // 9 PM in 24h, exclusive upper bound

export function checkSMSCompliance(
  metadata: SMSMetadata,
): ComplianceCheck {
  const regulation = findRegulation("TCPA");
  const violations: Violation[] = [];

  if (!metadata.hasRecipientConsent) {
    const req = regulation.requirements.find((r) => r.key === "consent");
    if (req) {
      violations.push(buildViolation("TCPA", req));
    }
  }

  if (!metadata.hasOptOutMechanism) {
    const req = regulation.requirements.find((r) => r.key === "opt_out");
    if (req) {
      violations.push(buildViolation("TCPA", req));
    }
  }

  if (
    metadata.sendHour < TCPA_EARLIEST_HOUR ||
    metadata.sendHour >= TCPA_LATEST_HOUR
  ) {
    const req = regulation.requirements.find(
      (r) => r.key === "time_restrictions",
    );
    if (req) {
      violations.push(buildViolation("TCPA", req));
    }
  }

  return {
    regulationId: "TCPA",
    status: deriveStatus(violations, regulation.requirements.length),
    violations,
    checkedAt: new Date(),
    metadata: { ...metadata },
  };
}

/* ------------------------------------------------------------------ */
/*  checkDataCompliance                                                */
/* ------------------------------------------------------------------ */

export function checkDataCompliance(
  metadata: DataHandlingMetadata,
): readonly ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // GDPR checks (applicable when region is EU or unknown)
  if (
    metadata.dataSubjectRegion === "EU" ||
    metadata.dataSubjectRegion === "unknown"
  ) {
    const gdpr = findRegulation("GDPR");
    const gdprViolations: Violation[] = [];

    if (!metadata.hasProcessingConsent) {
      const req = gdpr.requirements.find(
        (r) => r.key === "processing_consent",
      );
      if (req) {
        gdprViolations.push(buildViolation("GDPR", req));
      }
    }

    if (!metadata.supportsRightToDeletion) {
      const req = gdpr.requirements.find(
        (r) => r.key === "right_to_deletion",
      );
      if (req) {
        gdprViolations.push(buildViolation("GDPR", req));
      }
    }

    if (!metadata.supportsDataPortability) {
      const req = gdpr.requirements.find(
        (r) => r.key === "data_portability",
      );
      if (req) {
        gdprViolations.push(buildViolation("GDPR", req));
      }
    }

    checks.push({
      regulationId: "GDPR",
      status: deriveStatus(gdprViolations, gdpr.requirements.length),
      violations: gdprViolations,
      checkedAt: new Date(),
      metadata: { dataSubjectRegion: metadata.dataSubjectRegion },
    });
  }

  // CCPA checks (applicable when region is California or unknown)
  if (
    metadata.dataSubjectRegion === "California" ||
    metadata.dataSubjectRegion === "unknown"
  ) {
    const ccpa = findRegulation("CCPA");
    const ccpaViolations: Violation[] = [];

    if (!metadata.disclosesDataCollection) {
      const req = ccpa.requirements.find((r) => r.key === "disclosure");
      if (req) {
        ccpaViolations.push(buildViolation("CCPA", req));
      }
    }

    if (!metadata.supportsOptOutOfSale) {
      const req = ccpa.requirements.find(
        (r) => r.key === "opt_out_of_sale",
      );
      if (req) {
        ccpaViolations.push(buildViolation("CCPA", req));
      }
    }

    if (!metadata.supportsDeletionRequests) {
      const req = ccpa.requirements.find(
        (r) => r.key === "deletion_requests",
      );
      if (req) {
        ccpaViolations.push(buildViolation("CCPA", req));
      }
    }

    checks.push({
      regulationId: "CCPA",
      status: deriveStatus(ccpaViolations, ccpa.requirements.length),
      violations: ccpaViolations,
      checkedAt: new Date(),
      metadata: { dataSubjectRegion: metadata.dataSubjectRegion },
    });
  }

  return checks;
}

/* ------------------------------------------------------------------ */
/*  checkAdCompliance                                                  */
/* ------------------------------------------------------------------ */

export function checkAdCompliance(
  metadata: AdMetadata,
): ComplianceCheck {
  const regulation = findRegulation("FTC");
  const violations: Violation[] = [];

  if (!metadata.isTruthfulClaim) {
    const req = regulation.requirements.find(
      (r) => r.key === "truth_in_advertising",
    );
    if (req) {
      violations.push(buildViolation("FTC", req));
    }
  }

  if (metadata.containsAIGeneratedContent && !metadata.disclosesAIContent) {
    const req = regulation.requirements.find(
      (r) => r.key === "ai_content_disclosure",
    );
    if (req) {
      violations.push(buildViolation("FTC", req));
    }
  }

  if (
    metadata.containsTestimonials &&
    !metadata.hasTestimonialDisclosure
  ) {
    const req = regulation.requirements.find(
      (r) => r.key === "testimonial_guidelines",
    );
    if (req) {
      violations.push(buildViolation("FTC", req));
    }
  }

  return {
    regulationId: "FTC",
    status: deriveStatus(violations, regulation.requirements.length),
    violations,
    checkedAt: new Date(),
    metadata: { ...metadata },
  };
}

/* ------------------------------------------------------------------ */
/*  generateComplianceReport                                           */
/* ------------------------------------------------------------------ */

export function generateComplianceReport(
  checks: readonly ComplianceCheck[],
): ComplianceReport {
  const allViolations = checks.flatMap((c) => c.violations);
  const criticalCount = allViolations.filter(
    (v) => v.severity === "critical",
  ).length;

  const statuses = checks.map((c) => c.status);
  let overallStatus: ComplianceStatus;

  if (statuses.every((s) => s === "compliant")) {
    overallStatus = "compliant";
  } else if (statuses.every((s) => s === "non_compliant")) {
    overallStatus = "non_compliant";
  } else if (statuses.some((s) => s === "unknown")) {
    overallStatus = "unknown";
  } else {
    overallStatus = "partial";
  }

  const regulationIds = checks.map((c) => c.regulationId);
  const summary =
    overallStatus === "compliant"
      ? `All ${checks.length} regulation checks passed with no violations.`
      : `Found ${allViolations.length} violation(s) across ${regulationIds.join(", ")} — ${criticalCount} critical.`;

  return {
    generatedAt: new Date(),
    overallStatus,
    checks,
    totalViolations: allViolations.length,
    criticalViolations: criticalCount,
    summary,
  };
}

/* ------------------------------------------------------------------ */
/*  getRequiredDisclosures                                             */
/* ------------------------------------------------------------------ */

const DISCLOSURE_MAP: Readonly<
  Record<ContentType, readonly Disclosure[]>
> = {
  email: [
    {
      regulationId: "CAN-SPAM",
      requirementKey: "unsubscribe_link",
      text: "This email contains a commercial message. You may unsubscribe at any time.",
      required: true,
    },
    {
      regulationId: "CAN-SPAM",
      requirementKey: "physical_address",
      text: "Sender's physical mailing address must be included.",
      required: true,
    },
  ],
  sms: [
    {
      regulationId: "TCPA",
      requirementKey: "opt_out",
      text: "Reply STOP to unsubscribe from future messages.",
      required: true,
    },
    {
      regulationId: "TCPA",
      requirementKey: "consent",
      text: "Message sent with prior express consent on file.",
      required: true,
    },
  ],
  web_page: [
    {
      regulationId: "ADA",
      requirementKey: "web_accessibility",
      text: "This site conforms to WCAG 2.1 Level AA accessibility standards.",
      required: true,
    },
    {
      regulationId: "CCPA",
      requirementKey: "opt_out_of_sale",
      text: "Do Not Sell My Personal Information.",
      required: true,
    },
    {
      regulationId: "GDPR",
      requirementKey: "processing_consent",
      text: "We use cookies and process personal data. See our Privacy Policy for details.",
      required: true,
    },
  ],
  advertisement: [
    {
      regulationId: "FTC",
      requirementKey: "truth_in_advertising",
      text: "All claims in this advertisement are substantiated and truthful.",
      required: true,
    },
    {
      regulationId: "FTC",
      requirementKey: "ai_content_disclosure",
      text: "Portions of this content may be generated by artificial intelligence.",
      required: false,
    },
    {
      regulationId: "FTC",
      requirementKey: "testimonial_guidelines",
      text: "Testimonials reflect individual experiences. Results may vary. #ad",
      required: false,
    },
  ],
  data_collection: [
    {
      regulationId: "GDPR",
      requirementKey: "processing_consent",
      text: "Your data will be processed in accordance with our Privacy Policy. You may withdraw consent at any time.",
      required: true,
    },
    {
      regulationId: "CCPA",
      requirementKey: "disclosure",
      text: "We collect personal information as described in our Privacy Notice.",
      required: true,
    },
    {
      regulationId: "CCPA",
      requirementKey: "opt_out_of_sale",
      text: "You have the right to opt out of the sale of your personal information.",
      required: true,
    },
  ],
  social_media: [
    {
      regulationId: "FTC",
      requirementKey: "ai_content_disclosure",
      text: "This content is AI-generated.",
      required: false,
    },
    {
      regulationId: "FTC",
      requirementKey: "testimonial_guidelines",
      text: "Sponsored content. #ad #sponsored",
      required: false,
    },
  ],
};

export function getRequiredDisclosures(
  contentType: ContentType,
): readonly Disclosure[] {
  return DISCLOSURE_MAP[contentType] ?? [];
}
