import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { handlerRegistry } from "./handlers";
import { logger } from "@/lib/logger";

/**
 * Maximum number of times an event will be retried before being moved
 * to the dead-letter state. After this many failures the event is marked
 * as "dead_letter" and will no longer be picked up by the processor.
 */
const MAX_RETRIES = 5;

/**
 * How long (in minutes) an event can stay in "processing" before it is
 * considered stale and eligible for recovery. This handles the case where
 * the processor crashes mid-batch and events get stuck.
 */
const STALE_PROCESSING_MINUTES = 10;

/**
 * Process pending orchestration events in batches.
 *
 * Uses an atomic UPDATE ... RETURNING to claim pending events, preventing
 * concurrent cron invocations from processing the same events (pessimistic
 * locking via row-level atomicity in PostgreSQL).
 *
 * 1. Recovers stale "processing" events (crash recovery).
 * 2. Atomically claims a batch of pending events by setting status = 'processing'.
 * 3. For each claimed event, finds matching EventSubscription rows (isActive=true, ordered by priority desc).
 * 4. For each subscription, looks up handler in handlerRegistry and invokes it (isolated per handler).
 * 5. Marks event as "completed", "pending" (retry), or "dead_letter" (max retries exceeded).
 */
export async function processEvents(
  batchSize = 50
): Promise<{ processed: number; failed: number; deadLettered: number }> {
  // ── Step 0: Crash recovery ──────────────────────────────────────────
  // Reset events stuck in "processing" for longer than STALE_PROCESSING_MINUTES
  // back to "pending" so they get retried on the next invocation.
  const staleThreshold = new Date(
    Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000
  );
  await prisma.$executeRaw(
    Prisma.sql`UPDATE "OrchestrationEvent"
     SET "status" = 'pending'
     WHERE "status" = 'processing'
       AND "claimedAt" < ${staleThreshold}`
  );

  // ── Step 1: Atomically claim a batch of pending events ──────────────
  // The UPDATE ... WHERE ... RETURNING pattern ensures that if two cron
  // invocations overlap, each row is claimed by exactly one of them.
  const now = new Date();
  const claimedEvents = await prisma.$queryRaw<
    Array<{
      id: string;
      clientId: string | null;
      type: string;
      source: string;
      payload: unknown;
      status: string;
      retryCount: number;
      processedAt: Date | null;
      claimedAt: Date | null;
      error: string | null;
      createdAt: Date;
    }>
  >(
    Prisma.sql`UPDATE "OrchestrationEvent"
     SET "status" = 'processing', "claimedAt" = ${now}
     WHERE "id" IN (
       SELECT "id" FROM "OrchestrationEvent"
       WHERE "status" = 'pending'
       ORDER BY "createdAt" ASC
       LIMIT ${batchSize}
     )
     RETURNING *`
  );

  if (claimedEvents.length === 0) {
    return { processed: 0, failed: 0, deadLettered: 0 };
  }

  let processed = 0;
  let failed = 0;
  let deadLettered = 0;

  // Batch-load all subscriptions for the claimed event types to avoid N+1 queries
  const eventTypes = [...new Set(claimedEvents.map((e) => e.type))];
  const allSubscriptions = await prisma.eventSubscription.findMany({
    where: { eventType: { in: eventTypes }, isActive: true },
    orderBy: { priority: "desc" },
  });
  const subsByType = new Map<string, typeof allSubscriptions>();
  for (const sub of allSubscriptions) {
    const list = subsByType.get(sub.eventType) || [];
    list.push(sub);
    subsByType.set(sub.eventType, list);
  }

  for (const event of claimedEvents) {
    // ── Step 2: Find matching subscriptions ───────────────────────────
    const subscriptions = subsByType.get(event.type) || [];

    // ── Step 3: Run each handler (isolated — one failure won't block others) ──
    const handlerErrors: string[] = [];

    for (const sub of subscriptions) {
      const handler = handlerRegistry[sub.handlerKey];
      if (!handler) {
        logger.warn(
          `[orchestration] No handler registered for key "${sub.handlerKey}"`
        );
        continue;
      }

      try {
        await handler({
          id: event.id,
          type: event.type,
          clientId: event.clientId,
          payload: event.payload,
          source: event.source,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown handler error";
        handlerErrors.push(`${sub.handlerKey}: ${msg}`);
        logger.error(
          `[orchestration] Handler "${sub.handlerKey}" failed for event ${event.id}`,
          { error: msg }
        );
      }
    }

    // ── Step 4: Update event status ───────────────────────────────────
    // Wrap status updates in try/catch so a DB failure for one event
    // doesn't prevent the remaining events from being processed.
    // The stale-event recovery in Step 0 will handle any events left
    // in "processing" status if this fails.
    try {
      if (handlerErrors.length === 0) {
        // All handlers succeeded (or there were no handlers)
        await prisma.orchestrationEvent.update({
          where: { id: event.id },
          data: { status: "completed", processedAt: new Date() },
        });
        processed++;
      } else {
        // At least one handler failed — decide whether to retry or dead-letter
        const newRetryCount = event.retryCount + 1;
        const errorMessage = handlerErrors.join("; ");

        if (newRetryCount >= MAX_RETRIES) {
          // Max retries exceeded — move to dead letter
          await prisma.orchestrationEvent.update({
            where: { id: event.id },
            data: {
              status: "dead_letter",
              retryCount: newRetryCount,
              error: `Dead-lettered after ${newRetryCount} attempts. Last errors: ${errorMessage}`,
              processedAt: new Date(),
            },
          });
          deadLettered++;
          logger.error(
            `[orchestration] Event ${event.id} moved to dead letter after ${newRetryCount} attempts`
          );
        } else {
          // Retry — set back to pending with incremented retry count
          await prisma.orchestrationEvent.update({
            where: { id: event.id },
            data: {
              status: "pending",
              retryCount: newRetryCount,
              error: `Attempt ${newRetryCount} failed: ${errorMessage}`,
            },
          });
          failed++;
          logger.warn(
            `[orchestration] Event ${event.id} will be retried (attempt ${newRetryCount}/${MAX_RETRIES})`
          );
        }
      }
    } catch (statusErr) {
      logger.errorWithCause(
        `[orchestration] Failed to update status for event ${event.id}`,
        statusErr
      );
      failed++;
    }
  }

  return { processed, failed, deadLettered };
}
