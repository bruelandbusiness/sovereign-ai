import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const TAG = "[outreach-engagement]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EngagementType = "open" | "click" | "reply";

interface EngagementEvent {
  type: EngagementType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Record engagement
// ---------------------------------------------------------------------------

/**
 * Append an engagement event to an OutreachEntry's engagementData JSON array.
 * Creates the array if it does not yet exist.
 */
export async function recordEngagement(
  entryId: string,
  type: EngagementType,
  metadata?: Record<string, unknown>
): Promise<void> {
  const entry = await prisma.outreachEntry.findUnique({
    where: { id: entryId },
    select: { engagementData: true, currentStep: true, status: true },
  });

  if (!entry) {
    logger.warn(`${TAG} Entry not found: ${entryId}`);
    return;
  }

  const existing: EngagementEvent[] = entry.engagementData
    ? JSON.parse(entry.engagementData)
    : [];

  const event: EngagementEvent = {
    type,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };

  existing.push(event);

  const updateData: Record<string, unknown> = {
    engagementData: JSON.stringify(existing),
  };

  // If the prospect replied, mark the entry accordingly
  if (type === "reply" && entry.status === "active") {
    updateData.status = "replied";
    updateData.nextStepAt = null;
  }

  await prisma.outreachEntry.update({
    where: { id: entryId },
    data: updateData,
  });

  logger.info(`${TAG} Recorded ${type} for entry ${entryId}`);

  // Auto-accelerate on meaningful engagement
  if (shouldAccelerate({ engagementData: JSON.stringify(existing), currentStep: entry.currentStep })) {
    await accelerateSequence(entryId);
  }
}

// ---------------------------------------------------------------------------
// Sequence acceleration
// ---------------------------------------------------------------------------

/**
 * Move nextStepAt forward for an entry.
 * - For replies: sequence is paused (handled in recordEngagement by setting status to "replied").
 * - For clicks/opens: reduce wait to 1 day from now.
 */
export async function accelerateSequence(entryId: string): Promise<void> {
  const entry = await prisma.outreachEntry.findUnique({
    where: { id: entryId },
    select: { status: true, nextStepAt: true },
  });

  if (!entry || entry.status !== "active" || !entry.nextStepAt) {
    return;
  }

  const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Only accelerate if the current nextStepAt is further out than 1 day
  if (entry.nextStepAt > oneDayFromNow) {
    await prisma.outreachEntry.update({
      where: { id: entryId },
      data: { nextStepAt: oneDayFromNow },
    });

    logger.info(`${TAG} Accelerated sequence for entry ${entryId} to ${oneDayFromNow.toISOString()}`);
  }
}

// ---------------------------------------------------------------------------
// Acceleration logic
// ---------------------------------------------------------------------------

/**
 * Determine whether engagement data warrants accelerating the sequence.
 * Returns true if there are 2+ opens or any click on the current step.
 */
export function shouldAccelerate(entry: {
  engagementData: string | null;
  currentStep: number;
}): boolean {
  if (!entry.engagementData) return false;

  let events: EngagementEvent[];
  try {
    events = JSON.parse(entry.engagementData);
  } catch {
    return false;
  }

  if (!Array.isArray(events) || events.length === 0) return false;

  // Any click warrants acceleration
  const hasClick = events.some((e) => e.type === "click");
  if (hasClick) return true;

  // 2+ opens warrant acceleration
  const openCount = events.filter((e) => e.type === "open").length;
  if (openCount >= 2) return true;

  return false;
}
