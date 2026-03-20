import type { EventHandler } from "../handlers";
import { createNotificationForClient } from "@/lib/notifications";

/**
 * Creates a Notification for the client when a new lead is captured.
 * Uses createNotificationForClient to ensure push notifications are
 * triggered for this urgent event type (lead_captured).
 *
 * Errors are propagated to the processor so they can be tracked and retried.
 */
export const handleLeadNotification: EventHandler = async (event) => {
  if (!event.clientId) return;

  const payload = event.payload as { leadName?: string; source?: string };

  await createNotificationForClient(event.clientId, {
    type: "lead_captured",
    title: "New Lead Captured",
    message: `${payload.leadName || "A new lead"} was captured via ${payload.source || event.source}.`,
    actionUrl: "/dashboard/leads",
  });
};
