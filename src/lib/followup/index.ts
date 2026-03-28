import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { canSendEmail, canSendSms, canMakeCall } from "@/lib/compliance";
import { queueEmail } from "@/lib/email-queue";
import { sendSms } from "@/lib/twilio";
import {
  getNextChannel,
  shouldEscalate,
  type EngagementEvent,
} from "./escalation";
import {
  classifyReply,
  generateAutoResponse,
  type ReplyClassification,
} from "./reply-classifier";

const TAG = "[followup]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FollowUpEnrollParams {
  clientId: string;
  sequenceId: string;
  leadId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
}

interface SequenceStep {
  dayOffset: number;
  channel: string;
  escalation?: boolean;
  templateKey: string;
  condition?: string;
}

interface FollowUpEntryWithSequence {
  id: string;
  clientId: string;
  sequenceId: string;
  leadId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  currentStep: number;
  currentChannel: string;
  status: string;
  lastStepAt: Date | null;
  nextStepAt: Date | null;
  engagementLog: string | null;
  replyClassification: string | null;
  sequence: {
    id: string;
    clientId: string;
    name: string;
    triggerType: string;
    isActive: boolean;
    steps: string;
  };
}

// Re-export types that callers need
export type { EngagementEvent, ReplyClassification, FollowUpEntryWithSequence };

// ---------------------------------------------------------------------------
// enrollInFollowUp
// ---------------------------------------------------------------------------

/**
 * Create a new FollowUpEntry and schedule the first step.
 * Returns the entry ID.
 */
export async function enrollInFollowUp(
  params: FollowUpEnrollParams,
): Promise<string> {
  const { clientId, sequenceId, leadId, contactEmail, contactPhone, contactName } =
    params;

  // Load the sequence to parse the first step's dayOffset
  const sequence = await prisma.followUpSequence.findUniqueOrThrow({
    where: { id: sequenceId },
    select: { steps: true },
  });

  const steps = JSON.parse(sequence.steps) as SequenceStep[];
  if (steps.length === 0) {
    throw new Error(`Sequence ${sequenceId} has no steps defined`);
  }

  const firstStep = steps[0];
  const nextStepAt = new Date(
    Date.now() + firstStep.dayOffset * 24 * 60 * 60 * 1000,
  );

  const entry = await prisma.followUpEntry.create({
    data: {
      clientId,
      sequenceId,
      leadId: leadId ?? null,
      contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null,
      contactName: contactName ?? null,
      currentStep: 0,
      currentChannel: firstStep.channel || "email",
      status: "active",
      nextStepAt,
      engagementLog: "[]",
    },
  });

  logger.info(`${TAG} Enrolled entry ${entry.id} in sequence ${sequenceId}`, {
    clientId,
    leadId,
    firstStepAt: nextStepAt.toISOString(),
  });

  return entry.id;
}

// ---------------------------------------------------------------------------
// processFollowUpStep
// ---------------------------------------------------------------------------

/**
 * Process the current step for a follow-up entry.
 *
 * 1. Parse sequence steps from JSON
 * 2. Get current step config
 * 3. Check escalation rules
 * 4. Run compliance gate
 * 5. Send via appropriate channel
 * 6. Update entry: increment step, set lastStepAt/nextStepAt, update channel
 * 7. If all steps exhausted, set status to "exhausted"
 */
export async function processFollowUpStep(
  entry: FollowUpEntryWithSequence,
): Promise<void> {
  const steps = JSON.parse(entry.sequence.steps) as SequenceStep[];

  // Check if we've gone past all steps
  if (entry.currentStep >= steps.length) {
    await prisma.followUpEntry.update({
      where: { id: entry.id },
      data: { status: "exhausted", nextStepAt: null },
    });
    logger.info(`${TAG} Entry ${entry.id} exhausted — no more steps`);
    return;
  }

  const stepConfig = steps[entry.currentStep];

  // Check escalation rules
  let channel = stepConfig.channel || entry.currentChannel;
  if (stepConfig.escalation !== false && shouldEscalate(entry)) {
    const engagementHistory: EngagementEvent[] = entry.engagementLog
      ? (JSON.parse(entry.engagementLog) as EngagementEvent[])
      : [];
    channel = getNextChannel(entry.currentChannel, engagementHistory);

    if (channel === "exhausted") {
      await prisma.followUpEntry.update({
        where: { id: entry.id },
        data: { status: "exhausted", nextStepAt: null },
      });
      logger.info(`${TAG} Entry ${entry.id} exhausted — escalation path ended`);
      return;
    }

    logger.info(
      `${TAG} Entry ${entry.id} escalating from ${entry.currentChannel} to ${channel}`,
    );
  }

  // Run compliance gate based on channel
  const complianceResult = await runComplianceGate(
    channel,
    entry.clientId,
    entry.contactEmail,
    entry.contactPhone,
  );

  if (!complianceResult.allowed) {
    logger.warn(
      `${TAG} Entry ${entry.id} blocked by compliance: ${complianceResult.reason}`,
      { channel },
    );
    // Skip this step but don't end the sequence — try next step
    await advanceEntry(entry, steps, channel);
    return;
  }

  // Send via appropriate channel
  const sent = await sendViaChannel(channel, entry, stepConfig);

  if (!sent) {
    logger.warn(`${TAG} Entry ${entry.id} failed to send on channel ${channel}`);
  }

  // Advance the entry to the next step
  await advanceEntry(entry, steps, channel);
}

// ---------------------------------------------------------------------------
// handleFollowUpEngagement
// ---------------------------------------------------------------------------

/**
 * Record an engagement event (open, click, reply, delivered) on an entry.
 * If the event is a reply, triggers classification and auto-response.
 */
export async function handleFollowUpEngagement(
  entryId: string,
  event: EngagementEvent,
): Promise<void> {
  const entry = await prisma.followUpEntry.findUniqueOrThrow({
    where: { id: entryId },
  });

  // Append to engagement log
  const log: EngagementEvent[] = entry.engagementLog
    ? (JSON.parse(entry.engagementLog) as EngagementEvent[])
    : [];
  log.push(event);

  await prisma.followUpEntry.update({
    where: { id: entryId },
    data: { engagementLog: JSON.stringify(log) },
  });

  logger.info(`${TAG} Engagement recorded for entry ${entryId}`, {
    type: event.type,
    channel: event.channel,
  });
}

// ---------------------------------------------------------------------------
// handleFollowUpReply
// ---------------------------------------------------------------------------

/**
 * Classify a reply, update entry status, trigger auto-response or escalation
 * to a human, and return the classification.
 */
export async function handleFollowUpReply(
  entryId: string,
  replyText: string,
): Promise<ReplyClassification> {
  const entry = await prisma.followUpEntry.findUniqueOrThrow({
    where: { id: entryId },
    include: {
      sequence: { select: { clientId: true } },
      client: { select: { businessName: true } },
    },
  });

  // Classify the reply
  const classification = await classifyReply(replyText, {
    contactName: entry.contactName ?? undefined,
  });

  logger.info(`${TAG} Reply classified for entry ${entryId}`, {
    intent: classification.intent,
    confidence: classification.confidence,
  });

  // Determine new status based on intent
  let newStatus = entry.status;
  switch (classification.intent) {
    case "hot_lead":
    case "interested":
      newStatus = "replied";
      break;
    case "not_interested":
    case "unsubscribe":
      newStatus = "completed";
      break;
    case "question":
    case "complaint":
      newStatus = "replied";
      break;
    case "out_of_office":
      // Don't change status for OOO — keep the sequence running
      break;
  }

  // Record the reply as an engagement event
  const log: EngagementEvent[] = entry.engagementLog
    ? (JSON.parse(entry.engagementLog) as EngagementEvent[])
    : [];
  log.push({
    type: "reply",
    channel: entry.currentChannel,
    timestamp: new Date().toISOString(),
  });

  // Update entry
  await prisma.followUpEntry.update({
    where: { id: entryId },
    data: {
      status: newStatus,
      replyClassification: classification.intent,
      engagementLog: JSON.stringify(log),
      // Stop future scheduled steps if the contact replied meaningfully
      nextStepAt:
        classification.intent !== "out_of_office" ? null : entry.nextStepAt,
    },
  });

  // Generate auto-response for interested/question intents
  const autoResponse = await generateAutoResponse(classification, {
    clientBusinessName:
      (entry.client as { businessName: string | null })?.businessName ??
      "Our Team",
    contactName: entry.contactName ?? undefined,
  });

  if (autoResponse && entry.contactEmail) {
    try {
      await queueEmail(
        entry.contactEmail,
        `Re: Follow-up from ${(entry.client as { businessName: string | null })?.businessName ?? "Our Team"}`,
        `<p>${autoResponse.replace(/\n/g, "<br>")}</p>`,
        { clientId: entry.clientId },
      );
      logger.info(`${TAG} Auto-response queued for entry ${entryId}`);
    } catch (err) {
      logger.errorWithCause(
        `${TAG} Failed to queue auto-response for entry ${entryId}`,
        err,
      );
    }
  }

  return classification;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function runComplianceGate(
  channel: string,
  clientId: string,
  contactEmail: string | null,
  contactPhone: string | null,
): Promise<{ allowed: boolean; reason?: string }> {
  switch (channel) {
    case "email": {
      if (!contactEmail) {
        return { allowed: false, reason: "No contact email available" };
      }
      const result = await canSendEmail(clientId, contactEmail);
      return { allowed: result.allowed, reason: result.reason };
    }
    case "sms": {
      if (!contactPhone) {
        return { allowed: false, reason: "No contact phone available" };
      }
      const result = await canSendSms(clientId, contactPhone);
      return { allowed: result.allowed, reason: result.reason };
    }
    case "voice": {
      if (!contactPhone) {
        return { allowed: false, reason: "No contact phone available" };
      }
      const result = await canMakeCall(clientId, contactPhone);
      return { allowed: result.allowed, reason: result.reason };
    }
    default:
      return { allowed: false, reason: `Unknown channel: ${channel}` };
  }
}

async function sendViaChannel(
  channel: string,
  entry: FollowUpEntryWithSequence,
  stepConfig: SequenceStep,
): Promise<boolean> {
  switch (channel) {
    case "email": {
      if (!entry.contactEmail) {
        logger.warn(`${TAG} No email for entry ${entry.id}`);
        return false;
      }
      try {
        await queueEmail(
          entry.contactEmail,
          `Follow-up: ${stepConfig.templateKey}`,
          buildEmailHtml(entry, stepConfig),
          { clientId: entry.clientId },
        );
        return true;
      } catch (err) {
        logger.errorWithCause(
          `${TAG} Failed to queue email for entry ${entry.id}`,
          err,
        );
        return false;
      }
    }

    case "sms": {
      if (!entry.contactPhone) {
        logger.warn(`${TAG} No phone for entry ${entry.id}`);
        return false;
      }
      try {
        const result = await sendSms(
          entry.contactPhone,
          buildSmsBody(entry, stepConfig),
          entry.clientId,
        );
        return result.success;
      } catch (err) {
        logger.errorWithCause(
          `${TAG} Failed to send SMS for entry ${entry.id}`,
          err,
        );
        return false;
      }
    }

    case "voice": {
      // Voice calls require a TwiML endpoint — log for human follow-up
      logger.info(
        `${TAG} Voice step reached for entry ${entry.id} — flagging for human action`,
        { contactPhone: entry.contactPhone },
      );
      return true;
    }

    default:
      logger.warn(`${TAG} Unknown channel "${channel}" for entry ${entry.id}`);
      return false;
  }
}

async function advanceEntry(
  entry: FollowUpEntryWithSequence,
  steps: SequenceStep[],
  channel: string,
): Promise<void> {
  const nextStep = entry.currentStep + 1;
  const now = new Date();

  if (nextStep >= steps.length) {
    // All steps exhausted
    await prisma.followUpEntry.update({
      where: { id: entry.id },
      data: {
        currentStep: nextStep,
        currentChannel: channel,
        lastStepAt: now,
        nextStepAt: null,
        status: "exhausted",
      },
    });
    logger.info(`${TAG} Entry ${entry.id} completed all steps — exhausted`);
    return;
  }

  // Schedule next step
  const nextStepConfig = steps[nextStep];
  const nextStepAt = new Date(
    now.getTime() + nextStepConfig.dayOffset * 24 * 60 * 60 * 1000,
  );

  await prisma.followUpEntry.update({
    where: { id: entry.id },
    data: {
      currentStep: nextStep,
      currentChannel: channel,
      lastStepAt: now,
      nextStepAt,
    },
  });

  logger.info(`${TAG} Entry ${entry.id} advanced to step ${nextStep}`, {
    channel,
    nextStepAt: nextStepAt.toISOString(),
  });
}

function buildEmailHtml(
  entry: FollowUpEntryWithSequence,
  stepConfig: SequenceStep,
): string {
  const name = entry.contactName || "there";
  return `<p>Hi ${name},</p>
<p>We wanted to follow up regarding ${stepConfig.templateKey.replace(/_/g, " ")}.</p>
<p>If you have any questions, please don't hesitate to reach out.</p>
<p>Best regards,<br>${entry.sequence.name}</p>`;
}

function buildSmsBody(
  entry: FollowUpEntryWithSequence,
  stepConfig: SequenceStep,
): string {
  const name = entry.contactName || "";
  const greeting = name ? `Hi ${name}, ` : "";
  return `${greeting}Following up re: ${stepConfig.templateKey.replace(/_/g, " ")}. Reply to connect with our team.`;
}
