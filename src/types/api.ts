// ---------------------------------------------------------------------------
// Generic API Response Envelope
// ---------------------------------------------------------------------------

/** Shape of a successful API response body (mirrors apiSuccess in lib/api-response). */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Shape of an error API response body (mirrors apiError in lib/api-response). */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Union of all possible API response bodies. */
export type ApiResponse<T = unknown> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Query-string parameters accepted by paginated endpoints. */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Pagination metadata returned alongside paginated data. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Wrapper returned by paginated list endpoints. */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Common Entity Types
// ---------------------------------------------------------------------------

/** Lead status as stored in the database. */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "appointment"
  | "proposal"
  | "won"
  | "lost";

/** Lead source channel. */
export type LeadSource =
  | "chatbot"
  | "website"
  | "referral"
  | "phone"
  | "ads"
  | "form"
  | "social"
  | "voice";

/** Lean lead representation commonly returned by API routes. */
export interface Lead {
  id: string;
  clientId: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  score: number | null;
  stage: string | null;
  value: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Notification type discriminator. */
export type NotificationType =
  | "lead"
  | "review"
  | "content"
  | "booking"
  | "system";

/** Notification entity returned by the notifications API. */
export interface Notification {
  id: string;
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

/** Activity event type discriminator. */
export type ActivityEventType =
  | "lead_captured"
  | "review_received"
  | "call_booked"
  | "email_sent"
  | "content_published"
  | "review_response"
  | "ad_optimized"
  | "seo_update"
  | "seasonal_campaign_sent";

/** Activity event returned by the activity feed API. */
export interface ActivityEvent {
  id: string;
  clientId: string;
  type: ActivityEventType;
  title: string;
  description: string;
  metadata: string | null;
  createdAt: string;
}

/** Single KPI card returned by the dashboard/kpis endpoint. */
export interface KpiCard {
  label: string;
  value: number | string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtext?: string;
}

/** Shape returned by GET /api/dashboard/kpis. */
export type KpisResponse = KpiCard[];

// ---------------------------------------------------------------------------
// Existing Stripe / Checkout Types
// ---------------------------------------------------------------------------

export interface CheckoutRequest {
  items: string[];
  customer_email: string;
  customer_name?: string;
  business_name?: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface PortalRequest {
  customer_email: string;
}

export interface PortalResponse {
  portal_url: string;
}

export interface SubscriptionsResponse {
  total: number;
  mrr: number;
  subscriptions: Array<{
    customer_email: string;
    customer_id: string;
    subscription_id: string;
    business_name: string;
    services: string[];
    amount: number;
    status: "active" | "canceled";
    created_at: string;
  }>;
}
