import { logger } from "@/lib/logger";

const TAG = "[compliance/can-spam]";

export interface ComplianceConfigInput {
  physicalAddress: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailValidationResult {
  valid: boolean;
  violations: string[];
}

/**
 * Validate email content for CAN-SPAM compliance.
 * Returns an object with valid=false and a list of violations if non-compliant.
 *
 * CAN-SPAM requires:
 * 1. Physical mailing address in every commercial email
 * 2. One-click unsubscribe mechanism
 * 3. From address accurately identifies the sender
 * 4. Subject line is not deceptive
 */
export function validateEmailContent(
  html: string,
  config: ComplianceConfigInput
): EmailValidationResult {
  const violations: string[] = [];

  // 1. Physical address must be present in the email body
  if (!config.physicalAddress || config.physicalAddress.trim().length < 10) {
    violations.push(
      "CAN-SPAM: Physical mailing address is required but not configured"
    );
  } else if (!html.includes(config.physicalAddress)) {
    violations.push(
      "CAN-SPAM: Physical mailing address must appear in email body"
    );
  }

  // 2. Unsubscribe link must be present
  const hasUnsubscribe =
    /unsubscribe/i.test(html) &&
    (html.includes("href=") || html.includes("HREF="));
  if (!hasUnsubscribe) {
    violations.push(
      "CAN-SPAM: One-click unsubscribe link is required in every commercial email"
    );
  }

  // 3. From email must be configured and valid
  if (!config.fromEmail || !config.fromEmail.includes("@")) {
    violations.push(
      "CAN-SPAM: From email address must be a valid, monitored mailbox"
    );
  }

  // 4. From name must be configured
  if (!config.fromName || config.fromName.trim().length === 0) {
    violations.push(
      "CAN-SPAM: From name must accurately identify the sender"
    );
  }

  if (violations.length > 0) {
    logger.warn(`${TAG} Email content validation failed`, {
      violationCount: violations.length,
      violations,
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Inject CAN-SPAM required elements into email HTML if missing.
 * This is a safety net — callers should include these elements in their templates.
 * Returns the modified HTML.
 */
export function injectCanSpamFooter(
  html: string,
  config: ComplianceConfigInput,
  unsubscribeUrl: string
): string {
  const footer = `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#888;text-align:center;">
      <p>${escapeHtmlBasic(config.fromName)} | ${escapeHtmlBasic(config.physicalAddress)}</p>
      <p><a href="${escapeHtmlBasic(unsubscribeUrl)}" style="color:#888;">Unsubscribe</a></p>
    </div>`;

  // If the HTML has a closing body tag, insert before it
  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }

  // Otherwise append
  return html + footer;
}

function escapeHtmlBasic(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
