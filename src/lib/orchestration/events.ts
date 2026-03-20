import { prisma } from "@/lib/db";

/**
 * Emit an orchestration event that will be picked up and processed
 * by the event processor cron job.
 */
export async function emitEvent(
  type: string,
  payload: Record<string, unknown>,
  options?: { clientId?: string; source?: string }
): Promise<{ id: string }> {
  const event = await prisma.orchestrationEvent.create({
    data: {
      type,
      source: options?.source || "system",
      payload: JSON.stringify(payload),
      clientId: options?.clientId,
      status: "pending",
    },
  });
  return { id: event.id };
}
