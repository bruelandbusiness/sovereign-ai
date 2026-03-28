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
