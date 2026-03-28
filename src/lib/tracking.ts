import { logger } from "@/lib/logger";
/**
 * Client-side analytics & conversion tracking.
 *
 * Sends events to Facebook Pixel, Google Ads, and Google Analytics
 * when the corresponding global scripts are loaded. Falls back to
 * console.log in development.
 *
 * To activate:
 *   1. Add your Facebook Pixel ID to NEXT_PUBLIC_FB_PIXEL_ID in .env
 *   2. Add your Google Ads ID to NEXT_PUBLIC_GOOGLE_ADS_ID in .env
 *   3. Add your GA4 Measurement ID to NEXT_PUBLIC_GA_ID in .env
 *   4. The TrackingScripts component in layout.tsx loads the scripts.
 */

// ── Types ────────────────────────────────────────────────────

export type FunnelEvent =
  | "page_view"
  | "lead_capture"
  | "audit_request"
  | "webinar_register"
  | "playbook_download"
  | "strategy_call_booked"
  | "onboarding_start"
  | "onboarding_complete"
  | "cta_click"
  | "free_course_signup"
  | "partner_audit_start"
  | "newsletter_signup"
  | "form_submission"
  | "pricing_page_view"
  | "service_page_interaction"
  | "blog_scroll_depth"
  | "video_play"
  | "booking_submission"
  | "exit_intent_conversion";

interface EventParams {
  source?: string;
  trade?: string;
  page?: string;
  value?: number;
  currency?: string;
  [key: string]: string | number | undefined;
}

// ── Declare global ad platform functions ─────────────────────

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// ── Core tracking function ───────────────────────────────────

export function trackEvent(event: FunnelEvent, params: EventParams = {}) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    logger.info(`[TRACK] ${event}`, params);
  }

  // Facebook Pixel
  if (typeof window !== "undefined" && window.fbq) {
    const fbEventMap: Record<FunnelEvent, string> = {
      page_view: "PageView",
      lead_capture: "Lead",
      audit_request: "Lead",
      webinar_register: "CompleteRegistration",
      playbook_download: "Lead",
      strategy_call_booked: "Schedule",
      onboarding_start: "InitiateCheckout",
      onboarding_complete: "Purchase",
      cta_click: "ViewContent",
      free_course_signup: "CompleteRegistration",
      partner_audit_start: "Lead",
      newsletter_signup: "Lead",
      form_submission: "Lead",
      pricing_page_view: "ViewContent",
      service_page_interaction: "ViewContent",
      blog_scroll_depth: "ViewContent",
      video_play: "ViewContent",
      booking_submission: "Schedule",
      exit_intent_conversion: "Lead",
    };
    window.fbq("track", fbEventMap[event], {
      content_name: event,
      content_category: params.source || params.trade || "funnel",
      value: params.value,
      currency: params.currency || "USD",
    });
  }

  // Google Analytics 4 / Google Ads
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, {
      event_category: "funnel",
      event_label: params.source || params.trade || undefined,
      value: params.value,
      ...params,
    });

    // Fire Google Ads conversion for high-value events
    const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    if (
      googleAdsId &&
      ["lead_capture", "strategy_call_booked", "onboarding_complete", "booking_submission", "audit_request"].includes(event)
    ) {
      window.gtag("event", "conversion", {
        send_to: googleAdsId,
        value: params.value || 0,
        currency: "USD",
      });
    }
  }
}

// ── Convenience helpers ──────────────────────────────────────

export function trackAuditRequest(trade: string) {
  trackEvent("audit_request", { source: "free-audit", trade });
}

export function trackWebinarRegister() {
  trackEvent("webinar_register", { source: "webinar" });
}

export function trackPlaybookDownload(trade?: string) {
  trackEvent("playbook_download", { source: "playbook", trade });
}

export function trackNewsletterSignup(source: string = "footer") {
  trackEvent("newsletter_signup", { source });
}

export function trackFormSubmission(formName: string, trade?: string) {
  trackEvent("form_submission", { source: formName, trade });
}

export function trackPricingPageView() {
  trackEvent("pricing_page_view", { source: "pricing", page: "/pricing" });
}

export function trackServiceInteraction(serviceId: string) {
  trackEvent("service_page_interaction", {
    source: "services",
    page: "/services",
    service_id: serviceId,
  });
}

export function trackBlogScrollDepth(slug: string, depth: number) {
  trackEvent("blog_scroll_depth", {
    source: "blog",
    page: `/blog/${slug}`,
    scroll_depth: depth,
  });
}

export function trackVideoPlay(source: string = "homepage") {
  trackEvent("video_play", { source });
}

export function trackBookingSubmission(trade?: string) {
  trackEvent("booking_submission", { source: "booking-modal", trade });
}

export function trackStrategyCallBooked(trade?: string) {
  trackEvent("strategy_call_booked", { source: "strategy-call", trade });
}

export function trackExitIntentConversion() {
  trackEvent("exit_intent_conversion", { source: "exit-intent" });
}

// ── UTM parameter helpers ─────────────────────────────────────

export interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const UTM_STORAGE_KEY = "sovereign-utm-params";

/** Save UTM params from the current URL to sessionStorage. */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");

  if (utmSource || utmMedium || utmCampaign) {
    const utm: UtmParams = {
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
    };
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  }
}

/** Retrieve saved UTM params from sessionStorage. */
export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}

