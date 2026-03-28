import type { EventHandler } from "../handlers";
import { createNotificationForClient } from "@/lib/notifications";

/**
 * When a review is received, creates a notification for the client.
 * Uses createNotificationForClient to ensure push notifications are
 * triggered for this urgent event type (review_received).
 * The actual AI response generation is handled by the reviews cron job.
 *
 * Errors are propagated to the processor so they can be tracked and retried.
 */
export const handleReviewResponseTrigger: EventHandler = async (event) => {
  if (!event.clientId) return;

  const payload = event.payload as {
    reviewId?: string;
    rating?: number;
    reviewerName?: string;
  };

  await createNotificationForClient(event.clientId, {
    type: "review_received",
    title: `New ${payload.rating || 5}-Star Review`,
    message: `${payload.reviewerName || "A customer"} left a review. AI response will be generated shortly.`,
    actionUrl: "/dashboard/services/reviews",
  });
};
