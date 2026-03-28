// Retargeting pixel tracking integration
// Generates tracking scripts, records page views, and manages audience segments
// Returns mock data when not connected to real ad platforms

// ── Types ────────────────────────────────────────────────────

export interface PageView {
  clientId: string;
  visitorId: string;
  url: string;
  referrer?: string;
  userAgent?: string;
  timestamp: string;
}

export interface RetargetingAudience {
  id: string;
  clientId: string;
  name: string;
  description: string;
  criteria: AudienceCriteria;
  size: number;
  createdAt: string;
}

export interface AudienceCriteria {
  pages?: string[]; // URL patterns to match
  minVisits?: number;
  daysActive?: number;
  excludeConverted?: boolean;
}

// ── In-memory store for development ──────────────────────────

const pageViews: PageView[] = [];
const audiences: RetargetingAudience[] = [];

// ── Generate Pixel Script ────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24,}$/;

export function generatePixelScript(clientId: string): string {
  // Validate clientId to prevent XSS injection
  if (!UUID_REGEX.test(clientId) && !CUID_REGEX.test(clientId)) {
    throw new Error("Invalid clientId format");
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `
<!-- Sovereign AI Retargeting Pixel -->
<script>
(function() {
  var SAI_CLIENT = ${JSON.stringify(clientId)};
  var SAI_ENDPOINT = ${JSON.stringify(`${appUrl}/api/services/retargeting/track`)};

  function getVisitorId() {
    var id = localStorage.getItem("sai_vid");
    if (!id) {
      id = "v_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
      localStorage.setItem("sai_vid", id);
    }
    return id;
  }

  function trackPageView() {
    var data = {
      clientId: SAI_CLIENT,
      visitorId: getVisitorId(),
      url: window.location.href,
      referrer: document.referrer || "",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(SAI_ENDPOINT, JSON.stringify(data));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", SAI_ENDPOINT, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
    }
  }

  // Track on page load
  if (document.readyState === "complete") {
    trackPageView();
  } else {
    window.addEventListener("load", trackPageView);
  }

  // Track on SPA navigation (pushState)
  var origPushState = history.pushState;
  history.pushState = function() {
    origPushState.apply(this, arguments);
    setTimeout(trackPageView, 100);
  };

  window.addEventListener("popstate", function() {
    setTimeout(trackPageView, 100);
  });
})();
</script>
<!-- End Sovereign AI Retargeting Pixel -->
`.trim();
}

// ── Track Page View ──────────────────────────────────────────

export function trackPageView(
  clientId: string,
  url: string,
  visitorId: string,
  referrer?: string,
  userAgent?: string
): PageView {
  const view: PageView = {
    clientId,
    visitorId,
    url,
    referrer,
    userAgent,
    timestamp: new Date().toISOString(),
  };

  pageViews.push(view);

  // Keep only last 10,000 views in memory
  if (pageViews.length > 10000) {
    pageViews.splice(0, pageViews.length - 10000);
  }

  return view;
}

// ── Get Page Views ───────────────────────────────────────────

function getPageViews(clientId: string): PageView[] {
  return pageViews.filter((v) => v.clientId === clientId);
}

// ── Create Retargeting Audience ──────────────────────────────

export function createRetargetingAudience(
  clientId: string,
  name: string,
  description: string,
  criteria: AudienceCriteria
): RetargetingAudience {
  const clientViews = getPageViews(clientId);

  // Calculate audience size based on criteria
  const uniqueVisitors = new Set<string>();
  clientViews.forEach((v) => {
    let matches = true;

    if (criteria.pages && criteria.pages.length > 0) {
      matches = criteria.pages.some((pattern) => v.url.includes(pattern));
    }

    if (criteria.daysActive) {
      const viewDate = new Date(v.timestamp);
      const daysAgo =
        (Date.now() - viewDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysAgo > criteria.daysActive) {
        matches = false;
      }
    }

    if (matches) {
      uniqueVisitors.add(v.visitorId);
    }
  });

  // Filter by minimum visits
  let matchedVisitors = uniqueVisitors.size;
  if (criteria.minVisits && criteria.minVisits > 1) {
    const visitorCounts: Record<string, number> = {};
    clientViews.forEach((v) => {
      if (uniqueVisitors.has(v.visitorId)) {
        visitorCounts[v.visitorId] = (visitorCounts[v.visitorId] || 0) + 1;
      }
    });
    matchedVisitors = Object.values(visitorCounts).filter(
      (count) => count >= (criteria.minVisits || 1)
    ).length;
  }

  const audience: RetargetingAudience = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    clientId,
    name,
    description,
    criteria,
    size: matchedVisitors,
    createdAt: new Date().toISOString(),
  };

  audiences.push(audience);
  return audience;
}

// ── Get Audiences ────────────────────────────────────────────

export function getAudiences(clientId: string): RetargetingAudience[] {
  return audiences.filter((a) => a.clientId === clientId);
}

// ── Get Retargeting Stats ────────────────────────────────────

export function getRetargetingStats(clientId: string): {
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: Array<{ url: string; views: number }>;
  audienceCount: number;
} {
  const clientViews = getPageViews(clientId);
  const uniqueVisitors = new Set(clientViews.map((v) => v.visitorId)).size;

  // Calculate top pages
  const pageCounts: Record<string, number> = {};
  clientViews.forEach((v) => {
    const path = new URL(v.url, "http://localhost").pathname;
    pageCounts[path] = (pageCounts[path] || 0) + 1;
  });

  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([url, views]) => ({ url, views }));

  return {
    totalPageViews: clientViews.length,
    uniqueVisitors,
    topPages,
    audienceCount: getAudiences(clientId).length,
  };
}
