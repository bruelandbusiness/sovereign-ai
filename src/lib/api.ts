import type { AuditRequest, AuditResult } from "@/types/audit";
import type { Lead, LeadStats } from "@/types/leads";
import type {
  CheckoutRequest,
  CheckoutResponse,
  PortalRequest,
  PortalResponse,
  SubscriptionsResponse,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  audit: {
    run: (data: AuditRequest) =>
      request<AuditResult>("/api/audit", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  leads: {
    list: () =>
      request<{ total: number; leads: Lead[] }>("/api/leads"),
    stats: () => request<LeadStats>("/api/leads/stats"),
  },

  payments: {
    checkout: (data: CheckoutRequest) =>
      request<CheckoutResponse>("/api/payments/checkout", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    portal: (data: PortalRequest) =>
      request<PortalResponse>("/api/payments/portal", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    subscriptions: () =>
      request<SubscriptionsResponse>("/api/payments/subscriptions"),
  },
};
