// ---------------------------------------------------------------------------
// Webhook Event Registry
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

/** All platform webhook event types. */
export const WebhookEventType = {
  // Lead events
  LEAD_CREATED: "lead.created",
  LEAD_UPDATED: "lead.updated",
  LEAD_SCORED: "lead.scored",
  LEAD_CONVERTED: "lead.converted",

  // Service events
  SERVICE_ACTIVATED: "service.activated",
  SERVICE_DEACTIVATED: "service.deactivated",
  SERVICE_HEALTH_CHANGED: "service.health_changed",

  // Payment & subscription events
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",

  // Review events
  REVIEW_RECEIVED: "review.received",
  REVIEW_RESPONDED: "review.responded",

  // Booking events
  BOOKING_CREATED: "booking.created",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_COMPLETED: "booking.completed",

  // Campaign events
  CAMPAIGN_SENT: "campaign.sent",
  CAMPAIGN_COMPLETED: "campaign.completed",

  // Client events
  CLIENT_ONBOARDED: "client.onboarded",
  CLIENT_CHURNED: "client.churned",
} as const;

export type WebhookEventType =
  (typeof WebhookEventType)[keyof typeof WebhookEventType];

// ---------------------------------------------------------------------------
// Event Categories
// ---------------------------------------------------------------------------

/** Groups of related event types, keyed by domain category. */
export const EVENT_CATEGORIES = {
  lead: [
    WebhookEventType.LEAD_CREATED,
    WebhookEventType.LEAD_UPDATED,
    WebhookEventType.LEAD_SCORED,
    WebhookEventType.LEAD_CONVERTED,
  ],
  service: [
    WebhookEventType.SERVICE_ACTIVATED,
    WebhookEventType.SERVICE_DEACTIVATED,
    WebhookEventType.SERVICE_HEALTH_CHANGED,
  ],
  payment: [
    WebhookEventType.PAYMENT_SUCCEEDED,
    WebhookEventType.PAYMENT_FAILED,
    WebhookEventType.SUBSCRIPTION_CREATED,
    WebhookEventType.SUBSCRIPTION_CANCELLED,
  ],
  review: [
    WebhookEventType.REVIEW_RECEIVED,
    WebhookEventType.REVIEW_RESPONDED,
  ],
  booking: [
    WebhookEventType.BOOKING_CREATED,
    WebhookEventType.BOOKING_CANCELLED,
    WebhookEventType.BOOKING_COMPLETED,
  ],
  campaign: [
    WebhookEventType.CAMPAIGN_SENT,
    WebhookEventType.CAMPAIGN_COMPLETED,
  ],
  client: [
    WebhookEventType.CLIENT_ONBOARDED,
    WebhookEventType.CLIENT_CHURNED,
  ],
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

// ---------------------------------------------------------------------------
// Payload Types
// ---------------------------------------------------------------------------

/** Base fields present on every event payload. */
interface BasePayload {
  accountId: string;
}

interface LeadCreatedPayload extends BasePayload {
  leadId: string;
  source: string;
  email?: string;
  name?: string;
}

interface LeadUpdatedPayload extends BasePayload {
  leadId: string;
  changedFields: string[];
}

interface LeadScoredPayload extends BasePayload {
  leadId: string;
  previousScore: number;
  newScore: number;
}

interface LeadConvertedPayload extends BasePayload {
  leadId: string;
  clientId: string;
  convertedAt: string;
}

interface ServiceActivatedPayload extends BasePayload {
  serviceId: string;
  serviceName: string;
}

interface ServiceDeactivatedPayload extends BasePayload {
  serviceId: string;
  serviceName: string;
  reason?: string;
}

interface ServiceHealthChangedPayload extends BasePayload {
  serviceId: string;
  previousStatus: string;
  newStatus: string;
}

interface PaymentSucceededPayload extends BasePayload {
  paymentId: string;
  amount: number;
  currency: string;
}

interface PaymentFailedPayload extends BasePayload {
  paymentId: string;
  amount: number;
  currency: string;
  failureReason: string;
}

interface SubscriptionCreatedPayload extends BasePayload {
  subscriptionId: string;
  planId: string;
  interval: "monthly" | "yearly";
}

interface SubscriptionCancelledPayload extends BasePayload {
  subscriptionId: string;
  cancelledAt: string;
  reason?: string;
}

interface ReviewReceivedPayload extends BasePayload {
  reviewId: string;
  platform: string;
  rating: number;
  content?: string;
}

interface ReviewRespondedPayload extends BasePayload {
  reviewId: string;
  responseId: string;
  respondedAt: string;
}

interface BookingCreatedPayload extends BasePayload {
  bookingId: string;
  serviceId: string;
  scheduledAt: string;
}

interface BookingCancelledPayload extends BasePayload {
  bookingId: string;
  cancelledAt: string;
  reason?: string;
}

interface BookingCompletedPayload extends BasePayload {
  bookingId: string;
  completedAt: string;
}

interface CampaignSentPayload extends BasePayload {
  campaignId: string;
  recipientCount: number;
  channel: string;
}

interface CampaignCompletedPayload extends BasePayload {
  campaignId: string;
  delivered: number;
  opened: number;
  clicked: number;
}

interface ClientOnboardedPayload extends BasePayload {
  clientId: string;
  onboardedAt: string;
  planId?: string;
}

interface ClientChurnedPayload extends BasePayload {
  clientId: string;
  churnedAt: string;
  reason?: string;
}

/** Maps each event type string to its specific payload shape. */
export type WebhookEventPayload = {
  "lead.created": LeadCreatedPayload;
  "lead.updated": LeadUpdatedPayload;
  "lead.scored": LeadScoredPayload;
  "lead.converted": LeadConvertedPayload;
  "service.activated": ServiceActivatedPayload;
  "service.deactivated": ServiceDeactivatedPayload;
  "service.health_changed": ServiceHealthChangedPayload;
  "payment.succeeded": PaymentSucceededPayload;
  "payment.failed": PaymentFailedPayload;
  "subscription.created": SubscriptionCreatedPayload;
  "subscription.cancelled": SubscriptionCancelledPayload;
  "review.received": ReviewReceivedPayload;
  "review.responded": ReviewRespondedPayload;
  "booking.created": BookingCreatedPayload;
  "booking.cancelled": BookingCancelledPayload;
  "booking.completed": BookingCompletedPayload;
  "campaign.sent": CampaignSentPayload;
  "campaign.completed": CampaignCompletedPayload;
  "client.onboarded": ClientOnboardedPayload;
  "client.churned": ClientChurnedPayload;
};

// ---------------------------------------------------------------------------
// Webhook Event Envelope
// ---------------------------------------------------------------------------

/** A fully formed webhook event ready for dispatch. */
export interface WebhookEvent<T extends WebhookEventType = WebhookEventType> {
  readonly id: string;
  readonly type: T;
  readonly timestamp: string;
  readonly payload: WebhookEventPayload[T];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Build a typed webhook event with a unique id and ISO timestamp.
 *
 * @param type  - The event type constant.
 * @param payload - Event-specific data matching the type.
 * @returns A read-only WebhookEvent envelope.
 */
export function createWebhookEvent<T extends WebhookEventType>(
  type: T,
  payload: WebhookEventPayload[T],
): WebhookEvent<T> {
  return Object.freeze({
    id: randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    payload,
  });
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Return only the events that belong to a given category.
 *
 * @param events   - Array of webhook events to filter.
 * @param category - Domain category to match (e.g. "lead", "payment").
 * @returns A new array containing only events whose type belongs
 *          to the specified category.
 */
export function filterEventsByCategory(
  events: readonly WebhookEvent[],
  category: EventCategory,
): WebhookEvent[] {
  const allowed: readonly WebhookEventType[] = EVENT_CATEGORIES[category];
  return events.filter((e) =>
    (allowed as readonly string[]).includes(e.type),
  );
}

// ---------------------------------------------------------------------------
// Human-readable descriptions
// ---------------------------------------------------------------------------

const EVENT_DESCRIPTIONS: Record<WebhookEventType, string> = {
  "lead.created": "A new lead was created",
  "lead.updated": "A lead's details were updated",
  "lead.scored": "A lead's score changed",
  "lead.converted": "A lead was converted to a client",
  "service.activated": "A service was activated",
  "service.deactivated": "A service was deactivated",
  "service.health_changed": "A service's health status changed",
  "payment.succeeded": "A payment was processed successfully",
  "payment.failed": "A payment attempt failed",
  "subscription.created": "A new subscription was created",
  "subscription.cancelled": "A subscription was cancelled",
  "review.received": "A new review was received",
  "review.responded": "A review received a response",
  "booking.created": "A new booking was created",
  "booking.cancelled": "A booking was cancelled",
  "booking.completed": "A booking was completed",
  "campaign.sent": "A campaign was sent",
  "campaign.completed": "A campaign finished processing",
  "client.onboarded": "A new client was onboarded",
  "client.churned": "A client churned",
};

/**
 * Return a human-readable description for a webhook event type.
 *
 * @param eventType - The event type to describe.
 * @returns A short sentence describing the event.
 */
export function describeEvent(eventType: WebhookEventType): string {
  return EVENT_DESCRIPTIONS[eventType];
}
