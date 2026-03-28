import { trackPerformanceLead } from "@/lib/performance-tracking";
import type { EventHandler } from "../handlers";

/**
 * When a lead.created event fires, call trackPerformanceLead to ensure
 * performance-based billing is applied for the captured lead.
 *
 * Errors are propagated to the processor so they can be tracked and retried.
 */
export const handleLeadPerformanceTrack: EventHandler = async (event) => {
  if (!event.clientId) return;

  const payload = event.payload as { leadId?: string; leadName?: string };
  if (!payload.leadId) return;

  await trackPerformanceLead(
    event.clientId,
    payload.leadId,
    payload.leadName || "AI-captured lead"
  );
};
