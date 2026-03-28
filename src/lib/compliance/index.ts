import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isOnSuppressionList } from "./suppression";
import { hasValidConsent } from "./consent";
import {
  isQuietHours,
  isInContactCooldown,
  logContactAttempt,
} from "./tcpa";
import { validateEmailContent } from "./can-spam";

const TAG = "[compliance]";

export interface CheckResult {
  check: string;
  passed: boolean;
  reason?: string;
}

export interface ComplianceResult {
  allowed: boolean;
  reason?: string;
  checks: CheckResult[];
}

/**
 * Compliance gate for email sends.
 * Runs all CAN-SPAM and suppression checks before allowing an email.
 *
 * @param clientId - The client sending the email
 * @param toEmail - The recipient email address
 * @param html - The email HTML content (optional — if provided, validates CAN-SPAM content)
 * @returns ComplianceResult with allowed flag and detailed check results
 */
export async function canSendEmail(
  clientId: string,
  toEmail: string,
  html?: string
): Promise<ComplianceResult> {
  const checks: CheckResult[] = [];

  // 1. Suppression list check
  const suppressed = await isOnSuppressionList({
    clientId,
    contactEmail: toEmail,
    channel: "email",
  });
  checks.push({
    check: "suppression_list",
    passed: !suppressed,
    reason: suppressed ? "Recipient is on suppression list" : undefined,
  });

  if (suppressed) {
    await logContactAttempt({
      clientId,
      contactEmail: toEmail,
      channel: "email",
      status: "blocked",
      blockReason: "suppressed",
    });
    return { allowed: false, reason: "Recipient is on suppression list", checks };
  }

  // 2. Contact cooldown check
  const config = await getComplianceConfig(clientId);
  if (config) {
    const inCooldown = await isInContactCooldown(
      clientId,
      toEmail,
      "email",
      config.maxContactAttempts,
      config.cooldownDays
    );
    checks.push({
      check: "contact_cooldown",
      passed: !inCooldown,
      reason: inCooldown
        ? `Exceeded ${config.maxContactAttempts} attempts in ${config.cooldownDays} days`
        : undefined,
    });

    if (inCooldown) {
      await logContactAttempt({
        clientId,
        contactEmail: toEmail,
        channel: "email",
        status: "blocked",
        blockReason: "cooldown",
      });
      return { allowed: false, reason: "Contact attempt cooldown active", checks };
    }
  }

  // 3. CAN-SPAM content validation (if HTML provided)
  if (html && config) {
    const contentCheck = validateEmailContent(html, {
      physicalAddress: config.physicalAddress,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    });
    checks.push({
      check: "can_spam_content",
      passed: contentCheck.valid,
      reason: contentCheck.valid
        ? undefined
        : contentCheck.violations.join("; "),
    });

    if (!contentCheck.valid) {
      await logContactAttempt({
        clientId,
        contactEmail: toEmail,
        channel: "email",
        status: "blocked",
        blockReason: "can_spam_violation",
      });
      return {
        allowed: false,
        reason: `CAN-SPAM violation: ${contentCheck.violations[0]}`,
        checks,
      };
    }
  }

  // All checks passed
  return { allowed: true, checks };
}

/**
 * Compliance gate for SMS sends.
 * Runs TCPA consent, quiet hours, suppression, and cooldown checks.
 *
 * @param clientId - The client sending the SMS
 * @param toPhone - The recipient phone number
 * @returns ComplianceResult with allowed flag and detailed check results
 */
export async function canSendSms(
  clientId: string,
  toPhone: string
): Promise<ComplianceResult> {
  const checks: CheckResult[] = [];
  const config = await getComplianceConfig(clientId);

  // 1. Suppression list check
  const suppressed = await isOnSuppressionList({
    clientId,
    contactPhone: toPhone,
    channel: "sms",
  });
  checks.push({
    check: "suppression_list",
    passed: !suppressed,
    reason: suppressed ? "Recipient is on SMS suppression list" : undefined,
  });

  if (suppressed) {
    await logContactAttempt({
      clientId,
      contactPhone: toPhone,
      channel: "sms",
      status: "blocked",
      blockReason: "suppressed",
    });
    return { allowed: false, reason: "Recipient is on SMS suppression list", checks };
  }

  // 2. TCPA consent check (required for automated SMS)
  if (config?.tcpaConsentRequired !== false) {
    const hasConsent = await hasValidConsent(clientId, "sms", toPhone);
    checks.push({
      check: "tcpa_consent",
      passed: hasConsent,
      reason: hasConsent
        ? undefined
        : "No prior express written consent for SMS",
    });

    if (!hasConsent) {
      await logContactAttempt({
        clientId,
        contactPhone: toPhone,
        channel: "sms",
        status: "blocked",
        blockReason: "no_consent",
      });
      return {
        allowed: false,
        reason: "TCPA: No prior express written consent for SMS",
        checks,
      };
    }
  }

  // 3. Quiet hours check
  const timezone = config?.timezone ?? "America/Chicago";
  const startHour = config?.smsQuietStartHour ?? 8;
  const endHour = config?.smsQuietEndHour ?? 21;

  const quiet = isQuietHours(timezone, startHour, endHour);
  checks.push({
    check: "quiet_hours",
    passed: !quiet,
    reason: quiet
      ? `Quiet hours: no SMS before ${startHour}:00 or after ${endHour}:00 ${timezone}`
      : undefined,
  });

  if (quiet) {
    await logContactAttempt({
      clientId,
      contactPhone: toPhone,
      channel: "sms",
      status: "blocked",
      blockReason: "quiet_hours",
    });
    return {
      allowed: false,
      reason: `TCPA: Quiet hours in effect (${timezone})`,
      checks,
    };
  }

  // 4. Contact cooldown check
  if (config) {
    const inCooldown = await isInContactCooldown(
      clientId,
      toPhone,
      "sms",
      config.maxContactAttempts,
      config.cooldownDays
    );
    checks.push({
      check: "contact_cooldown",
      passed: !inCooldown,
      reason: inCooldown
        ? `Exceeded ${config.maxContactAttempts} SMS attempts in ${config.cooldownDays} days`
        : undefined,
    });

    if (inCooldown) {
      await logContactAttempt({
        clientId,
        contactPhone: toPhone,
        channel: "sms",
        status: "blocked",
        blockReason: "cooldown",
      });
      return { allowed: false, reason: "Contact attempt cooldown active", checks };
    }
  }

  // All checks passed
  return { allowed: true, checks };
}

/**
 * Compliance gate for voice calls.
 * Runs TCPA consent, quiet hours, suppression, and cooldown checks.
 */
export async function canMakeCall(
  clientId: string,
  toPhone: string
): Promise<ComplianceResult> {
  const checks: CheckResult[] = [];
  const config = await getComplianceConfig(clientId);

  // 1. Suppression list check
  const suppressed = await isOnSuppressionList({
    clientId,
    contactPhone: toPhone,
    channel: "voice",
  });
  checks.push({
    check: "suppression_list",
    passed: !suppressed,
    reason: suppressed ? "Recipient is on voice suppression list" : undefined,
  });

  if (suppressed) {
    await logContactAttempt({
      clientId,
      contactPhone: toPhone,
      channel: "voice",
      status: "blocked",
      blockReason: "suppressed",
    });
    return { allowed: false, reason: "Recipient is on voice suppression list", checks };
  }

  // 2. TCPA consent check
  if (config?.tcpaConsentRequired !== false) {
    const hasConsent = await hasValidConsent(clientId, "voice", toPhone);
    checks.push({
      check: "tcpa_consent",
      passed: hasConsent,
      reason: hasConsent
        ? undefined
        : "No prior express consent for voice calls",
    });

    if (!hasConsent) {
      await logContactAttempt({
        clientId,
        contactPhone: toPhone,
        channel: "voice",
        status: "blocked",
        blockReason: "no_consent",
      });
      return {
        allowed: false,
        reason: "TCPA: No prior express consent for voice calls",
        checks,
      };
    }
  }

  // 3. Quiet hours check
  const timezone = config?.timezone ?? "America/Chicago";
  const startHour = config?.smsQuietStartHour ?? 8;
  const endHour = config?.smsQuietEndHour ?? 21;

  const quiet = isQuietHours(timezone, startHour, endHour);
  checks.push({
    check: "quiet_hours",
    passed: !quiet,
    reason: quiet
      ? `Quiet hours: no calls before ${startHour}:00 or after ${endHour}:00 ${timezone}`
      : undefined,
  });

  if (quiet) {
    await logContactAttempt({
      clientId,
      contactPhone: toPhone,
      channel: "voice",
      status: "blocked",
      blockReason: "quiet_hours",
    });
    return {
      allowed: false,
      reason: `TCPA: Quiet hours in effect (${timezone})`,
      checks,
    };
  }

  // 4. Contact cooldown check
  if (config) {
    const inCooldown = await isInContactCooldown(
      clientId,
      toPhone,
      "voice",
      config.maxContactAttempts,
      config.cooldownDays
    );
    checks.push({
      check: "contact_cooldown",
      passed: !inCooldown,
      reason: inCooldown
        ? `Exceeded ${config.maxContactAttempts} call attempts in ${config.cooldownDays} days`
        : undefined,
    });

    if (inCooldown) {
      await logContactAttempt({
        clientId,
        contactPhone: toPhone,
        channel: "voice",
        status: "blocked",
        blockReason: "cooldown",
      });
      return { allowed: false, reason: "Contact attempt cooldown active", checks };
    }
  }

  return { allowed: true, checks };
}

// ─── Internal Helpers ────────────────────────────────────────

/** Cache compliance config for the duration of a request to avoid repeated DB hits. */
const configCache = new Map<
  string,
  { data: ComplianceConfigData | null; expiresAt: number }
>();

interface ComplianceConfigData {
  physicalAddress: string;
  fromName: string;
  fromEmail: string;
  tcpaConsentRequired: boolean;
  smsQuietStartHour: number;
  smsQuietEndHour: number;
  timezone: string;
  maxContactAttempts: number;
  cooldownDays: number;
  dataPurgeDays: number;
}

async function getComplianceConfig(
  clientId: string
): Promise<ComplianceConfigData | null> {
  const now = Date.now();
  const cached = configCache.get(clientId);
  if (cached && cached.expiresAt > now) return cached.data;

  const config = await prisma.complianceConfig.findUnique({
    where: { clientId },
  });

  const data = config
    ? {
        physicalAddress: config.physicalAddress,
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        tcpaConsentRequired: config.tcpaConsentRequired,
        smsQuietStartHour: config.smsQuietStartHour,
        smsQuietEndHour: config.smsQuietEndHour,
        timezone: config.timezone,
        maxContactAttempts: config.maxContactAttempts,
        cooldownDays: config.cooldownDays,
        dataPurgeDays: config.dataPurgeDays,
      }
    : null;

  // Cache for 60 seconds
  configCache.set(clientId, { data, expiresAt: now + 60_000 });

  if (!data) {
    logger.warn(`${TAG} No compliance config found for client ${clientId}`);
  }

  return data;
}

// Clean up config cache every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of configCache) {
    if (value.expiresAt < now) configCache.delete(key);
  }
}, 300_000);
