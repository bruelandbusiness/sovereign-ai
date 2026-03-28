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

/** Default timeout for API requests (30 seconds). */
const API_TIMEOUT_MS = 30_000;

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Forward any existing signal from caller
  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (controller.signal.aborted && !(options?.signal?.aborted)) {
      throw new Error(`Request to ${path} timed out after ${API_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
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
