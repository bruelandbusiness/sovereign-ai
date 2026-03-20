import { handleLeadPerformanceTrack } from "./handlers/lead-performance-tracker";
import { handleLeadNotification } from "./handlers/lead-notification";
import { handleReviewResponseTrigger } from "./handlers/review-response-trigger";

export type EventHandler = (event: {
  id: string;
  type: string;
  clientId: string | null;
  payload: unknown;
  source: string;
}) => Promise<void>;

export const handlerRegistry: Record<string, EventHandler> = {
  "lead-performance-tracker": handleLeadPerformanceTrack,
  "lead-notification": handleLeadNotification,
  "review-response-trigger": handleReviewResponseTrigger,
};
