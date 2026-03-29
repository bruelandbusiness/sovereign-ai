import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { canSendEmail, canSendSms } from "@/lib/compliance";
import { queueEmail } from "@/lib/email-queue";
import { sendSms } from "@/lib/twilio";
import {
  canSendFromDomain,
  canSendSmsOutreach,
  incrementDomainCount,
  incrementSmsCount,
} from "./warmup";
import { generatePersonalization } from "./personalization";
import {
  getSmsColdTemplate,
  renderSmsTemplate,
  getSmsSegmentCount,
} from "./sms-templates";

const TAG = "[outreach]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnrollParams {
  clientId: string;
  sequenceId: string;
  leadId?: string;
  discoveredLeadId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
}

interface SequenceStep {
  dayOffset: number;
  channel: "email" | "sms";
  templateKey: string;
  subject?: string;
}

/** OutreachEntry with its sequence relation attached. */
export interface OutreachEntryWithSequence {
  id: string;
  clientId: string;
  sequenceId: string;
  leadId: string | null;
  discoveredLeadId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactName: string | null;
  currentStep: number;
  status: string;
  lastStepAt: Date | null;
  nextStepAt: Date | null;
  personalizedData: string | null;
  engagementData: string | null;
  createdAt: Date;
  updatedAt: Date;
  sequence: {
    id: string;
    clientId: string;
    name: string;
    channel: string;
    isActive: boolean;
    steps: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// ---------------------------------------------------------------------------
// Enroll
// ---------------------------------------------------------------------------

/**
 * Create an OutreachEntry for a contact, generate personalization, and
 * schedule the first step.
 *
 * @returns The created entry ID.
 */
export async function enrollInSequence(params: EnrollParams): Promise<string> {
  const {
    clientId,
    sequenceId,
    leadId,
    discoveredLeadId,
    contactEmail,
    contactPhone,
    contactName,
  } = params;

  // Fetch the sequence to get the first step's dayOffset
  const sequence = await prisma.outreachSequence.findUnique({
    where: { id: sequenceId },
  });

  if (!sequence || sequence.clientId !== clientId) {
    throw new Error(`Sequence ${sequenceId} not found or does not belong to client`);
  }

  if (!sequence.isActive) {
    throw new Error(`Sequence ${sequenceId} is not active`);
  }

  const steps: SequenceStep[] = JSON.parse(sequence.steps);
  if (steps.length === 0) {
    throw new Error(`Sequence ${sequenceId} has no steps`);
  }

  // Determine the channel for personalization from the first step
  const firstStep = steps[0];
  const firstStepChannel = firstStep.channel === "sms" ? "sms" : "email";

  // Generate personalization (non-blocking: falls back to defaults on error)
  const personalized = await generatePersonalization(clientId, {
    contactName,
    vertical: sequence.name,
    channel: firstStepChannel,
  });

  // Calculate nextStepAt from first step's dayOffset
  const nextStepAt = new Date(
    Date.now() + firstStep.dayOffset * 24 * 60 * 60 * 1000
  );

  const entry = await prisma.outreachEntry.create({
    data: {
      clientId,
      sequenceId,
      leadId: leadId ?? null,
      discoveredLeadId: discoveredLeadId ?? null,
      contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null,
      contactName: contactName ?? null,
      currentStep: 0,
      status: "active",
      nextStepAt,
      personalizedData: JSON.stringify(personalized),
    },
  });

  logger.info(`${TAG} Enrolled entry ${entry.id} in sequence ${sequenceId}`, {
    clientId,
    contactEmail,
    contactPhone,
    nextStepAt: nextStepAt.toISOString(),
  });

  return entry.id;
}

// ---------------------------------------------------------------------------
// Process a single outreach step
// ---------------------------------------------------------------------------

/**
 * Process the current step of an outreach entry:
 * 1. Check compliance gate
 * 2. Check warmup capacity
 * 3. Send the message (email or SMS)
 * 4. Increment warmup counters
 * 5. Advance entry to next step or complete
 */
export async function processOutreachStep(
  entry: OutreachEntryWithSequence
): Promise<void> {
  const steps: SequenceStep[] = JSON.parse(entry.sequence.steps);
  const step = steps[entry.currentStep];

  if (!step) {
    logger.warn(`${TAG} No step at index ${entry.currentStep} for entry ${entry.id}`);
    await prisma.outreachEntry.update({
      where: { id: entry.id },
      data: { status: "completed", nextStepAt: null },
    });
    return;
  }

  // Load personalization
  const personalized = entry.personalizedData
    ? JSON.parse(entry.personalizedData)
    : null;

  if (step.channel === "email") {
    await processEmailStep(entry, step, personalized);
  } else if (step.channel === "sms") {
    await processSmsStep(entry, step, personalized);
  } else {
    logger.warn(`${TAG} Unknown channel "${step.channel}" for entry ${entry.id}`);
    return;
  }

  // Advance to next step or complete
  const nextStepIndex = entry.currentStep + 1;
  const isLastStep = nextStepIndex >= steps.length;

  if (isLastStep) {
    await prisma.outreachEntry.update({
      where: { id: entry.id },
      data: {
        currentStep: nextStepIndex,
        lastStepAt: new Date(),
        nextStepAt: null,
        status: "completed",
      },
    });
    logger.info(`${TAG} Entry ${entry.id} completed sequence`);
  } else {
    const nextStep = steps[nextStepIndex];
    const nextStepAt = new Date(
      Date.now() + nextStep.dayOffset * 24 * 60 * 60 * 1000
    );

    await prisma.outreachEntry.update({
      where: { id: entry.id },
      data: {
        currentStep: nextStepIndex,
        lastStepAt: new Date(),
        nextStepAt,
      },
    });
    logger.info(`${TAG} Entry ${entry.id} advanced to step ${nextStepIndex}, next at ${nextStepAt.toISOString()}`);
  }
}

// ---------------------------------------------------------------------------
// Internal step processors
// ---------------------------------------------------------------------------

async function processEmailStep(
  entry: OutreachEntryWithSequence,
  step: SequenceStep,
  personalized: Record<string, string> | null
): Promise<void> {
  if (!entry.contactEmail) {
    logger.warn(`${TAG} No contact email for entry ${entry.id}, skipping email step`);
    return;
  }

  // 1. Compliance gate
  const compliance = await canSendEmail(entry.clientId, entry.contactEmail);
  if (!compliance.allowed) {
    logger.warn(`${TAG} Compliance blocked email for entry ${entry.id}: ${compliance.reason}`);
    return;
  }

  // 2. Domain warmup capacity
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const domain = entry.contactEmail.split("@")[1] ?? "";
  const senderDomain = await getSenderDomain(entry.clientId);
  if (senderDomain) {
    const warmup = await canSendFromDomain(entry.clientId, senderDomain);
    if (!warmup.allowed) {
      logger.warn(`${TAG} Domain warmup limit reached for ${senderDomain}, skipping entry ${entry.id}`);
      return;
    }
  }

  // 3. Build and send
  const subject = personalized?.subjectLine ?? step.subject ?? "A quick note";
  const body = personalized?.fullMessage ?? "We would love to connect with you about our services.";

  await queueEmail(entry.contactEmail, subject, wrapEmailHtml(body), {
    clientId: entry.clientId,
  });

  // 4. Increment warmup counter
  if (senderDomain) {
    try {
      await incrementDomainCount(entry.clientId, senderDomain);
    } catch (err) {
      logger.errorWithCause(`${TAG} Failed to increment domain count`, err, {
        entryId: entry.id,
        domain: senderDomain,
      });
    }
  }
}

async function processSmsStep(
  entry: OutreachEntryWithSequence,
  step: SequenceStep,
  personalized: Record<string, string> | null
): Promise<void> {
  if (!entry.contactPhone) {
    logger.warn(`${TAG} No contact phone for entry ${entry.id}, skipping SMS step`);
    return;
  }

  // 1. Compliance gate
  const compliance = await canSendSms(entry.clientId, entry.contactPhone);
  if (!compliance.allowed) {
    logger.warn(`${TAG} Compliance blocked SMS for entry ${entry.id}: ${compliance.reason}`);
    return;
  }

  // 2. SMS warmup capacity
  const warmup = await canSendSmsOutreach(entry.clientId);
  if (!warmup.allowed) {
    logger.warn(`${TAG} SMS warmup limit reached for client ${entry.clientId}, skipping entry ${entry.id}`);
    return;
  }

  // 3. Build message from SMS cold sequence template (fall back to personalized or default)
  let body: string;
  const smsTemplate = getSmsColdTemplate(entry.currentStep + 1);
  if (smsTemplate) {
    const vars: Record<string, string> = {
      firstName: entry.contactName?.split(" ")[0] ?? "there",
      businessName: personalized?.businessName ?? "your business",
      vertical: personalized?.vertical ?? "home service",
      senderName: personalized?.senderName ?? "Seth",
      calLink: personalized?.calLink ?? "https://cal.com/sovereign-ai",
    };
    body = renderSmsTemplate(smsTemplate.body, vars);
  } else {
    body =
      personalized?.fullMessage ??
      "Hi, we noticed your business and wanted to connect. Reply YES to learn more.";
  }

  logger.info(`${TAG} SMS for entry ${entry.id}: ${getSmsSegmentCount(body)} segment(s), ${body.length} chars`);

  const result = await sendSms(entry.contactPhone, body, entry.clientId);
  if (!result.success) {
    logger.warn(`${TAG} SMS send failed for entry ${entry.id}: ${result.error}`);
    return;
  }

  // 4. Increment warmup counter
  try {
    await incrementSmsCount(entry.clientId);
  } catch (err) {
    logger.errorWithCause(`${TAG} Failed to increment SMS count`, err, {
      entryId: entry.id,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Look up the first outreach domain for a client (for sender domain determination).
 */
async function getSenderDomain(clientId: string): Promise<string | null> {
  const domain = await prisma.outreachDomain.findFirst({
    where: { clientId },
    select: { domain: true },
    orderBy: { createdAt: "asc" },
  });
  return domain?.domain ?? null;
}

/**
 * Wrap plain text in basic HTML for email.
 */
function wrapEmailHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${escaped.replace(/\n/g, "<br>")}</div>`;
}
