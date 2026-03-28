import { logger } from "@/lib/logger";

const TAG = "[followup/escalation]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EngagementEvent {
  type: "open" | "click" | "reply" | "delivered";
  channel: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Channel escalation path
// ---------------------------------------------------------------------------

const ESCALATION_ORDER = ["email", "sms", "voice", "exhausted"] as const;

/**
 * Determine the next channel to use based on engagement history.
 *
 * Escalation rules:
 * - Email first (default starting channel).
 * - If 2+ emails were delivered but none were opened, escalate to SMS.
 * - If an SMS was delivered but no reply within 48 hours, escalate to voice.
 * - Never escalate if the contact has replied (route to human instead).
 * - Max escalation path: email -> sms -> voice -> exhausted.
 */
export function getNextChannel(
  currentChannel: string,
  engagementHistory: EngagementEvent[],
): string {
  // If the contact has replied on any channel, don't escalate — route to human
  const hasReplied = engagementHistory.some((e) => e.type === "reply");
  if (hasReplied) {
    logger.info(`${TAG} Contact has replied — routing to human`, {
      currentChannel,
    });
    return currentChannel;
  }

  const currentIdx = ESCALATION_ORDER.indexOf(
    currentChannel as (typeof ESCALATION_ORDER)[number],
  );
  if (currentIdx === -1) {
    logger.warn(`${TAG} Unknown channel "${currentChannel}", defaulting to email`);
    return "email";
  }

  // Already at or past the end of the escalation path
  if (currentIdx >= ESCALATION_ORDER.length - 1) {
    return "exhausted";
  }

  switch (currentChannel) {
    case "email": {
      // Count delivered emails vs opens
      const emailDelivered = engagementHistory.filter(
        (e) => e.type === "delivered" && e.channel === "email",
      ).length;
      const emailOpened = engagementHistory.filter(
        (e) => e.type === "open" && e.channel === "email",
      ).length;

      if (emailDelivered >= 2 && emailOpened === 0) {
        logger.info(
          `${TAG} ${emailDelivered} emails delivered, 0 opens — escalating to sms`,
        );
        return "sms";
      }
      return "email";
    }

    case "sms": {
      // Check if SMS was delivered but no reply within 48 hours
      const smsDelivered = engagementHistory
        .filter((e) => e.type === "delivered" && e.channel === "sms")
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

      if (smsDelivered.length > 0) {
        const latestSms = new Date(smsDelivered[0].timestamp);
        const hoursSinceDelivery =
          (Date.now() - latestSms.getTime()) / (1000 * 60 * 60);

        const smsReplied = engagementHistory.some(
          (e) => e.type === "reply" && e.channel === "sms",
        );

        if (hoursSinceDelivery >= 48 && !smsReplied) {
          logger.info(
            `${TAG} SMS delivered ${Math.round(hoursSinceDelivery)}h ago with no reply — escalating to voice`,
          );
          return "voice";
        }
      }
      return "sms";
    }

    case "voice": {
      // Voice is the last active channel; next would be exhausted
      return "voice";
    }

    default:
      return currentChannel;
  }
}

/**
 * Determine whether the current entry should escalate to the next channel.
 *
 * Returns `true` if escalation rules are met for the current channel and step.
 */
export function shouldEscalate(entry: {
  currentChannel: string;
  currentStep: number;
  engagementLog: string | null;
}): boolean {
  const engagementHistory: EngagementEvent[] = entry.engagementLog
    ? (JSON.parse(entry.engagementLog) as EngagementEvent[])
    : [];

  // Never escalate if the contact has replied
  const hasReplied = engagementHistory.some((e) => e.type === "reply");
  if (hasReplied) {
    return false;
  }

  const nextChannel = getNextChannel(entry.currentChannel, engagementHistory);
  return nextChannel !== entry.currentChannel;
}
