"use client";

import { useState, useMemo } from "react";

type Endpoint = { method: string; path: string; desc: string; auth: boolean };
// Compact: [method, path, description, authRequired]
type Row = [string, string, string, boolean];

const raw: Row[] = [
  // Auth
  ["GET", "/api/auth/session", "Get current session", false],
  ["GET", "/api/auth/google", "Initiate Google OAuth", false],
  ["GET", "/api/auth/google/callback", "Google OAuth callback", false],
  ["POST", "/api/auth/send-magic-link", "Send magic link email", false],
  ["GET", "/api/auth/verify", "Verify magic link token", false],
  ["POST", "/api/auth/signup-free", "Free tier signup", false],
  ["POST", "/api/auth/signout", "Sign out user", true],
  ["POST", "/api/auth/rotate-session", "Rotate session token", true],
  ["GET/DELETE", "/api/auth/sessions", "List or revoke sessions", true],
  ["DELETE", "/api/account/delete", "Delete user account", true],
  ["POST", "/api/onboarding", "Complete onboarding flow", true],
  // Dashboard
  ["GET", "/api/dashboard/kpis", "Key performance indicators", true],
  ["GET", "/api/dashboard/activity", "Recent activity feed", true],
  ["GET", "/api/dashboard/performance", "Performance metrics", true],
  ["GET", "/api/dashboard/attribution", "Marketing attribution data", true],
  ["GET", "/api/dashboard/benchmarks", "Industry benchmarks", true],
  ["GET", "/api/dashboard/billing", "Billing overview", true],
  ["POST", "/api/dashboard/billing/portal", "Create billing portal session", true],
  ["GET", "/api/dashboard/subscription", "Current subscription details", true],
  ["GET/PUT", "/api/dashboard/autopilot", "Autopilot config", true],
  ["GET/PUT", "/api/dashboard/autopilot/approvals", "Autopilot approval queue", true],
  ["GET/PUT", "/api/dashboard/checklist", "Setup checklist state", true],
  ["GET", "/api/dashboard/export", "Export dashboard data", true],
  ["GET", "/api/dashboard/capacity", "Service capacity overview", true],
  ["GET", "/api/dashboard/roi", "ROI dashboard summary", true],
  ["GET", "/api/dashboard/roi/realtime", "Realtime ROI metrics", true],
  ["GET/POST", "/api/dashboard/leads", "Lead management", true],
  ["PATCH", "/api/dashboard/leads/[id]/outcome", "Update lead outcome", true],
  ["GET/POST", "/api/dashboard/inbox", "Unified inbox", true],
  ["GET/POST/PATCH", "/api/dashboard/inbox/[threadId]", "Inbox thread actions", true],
  ["GET/POST", "/api/dashboard/invoices", "Invoice management", true],
  ["GET/POST", "/api/dashboard/quotes", "Quote management", true],
  ["POST", "/api/dashboard/quotes/generate", "AI-generate a quote", true],
  ["GET/POST", "/api/dashboard/locations", "Business locations", true],
  ["GET/POST", "/api/dashboard/referrals", "Referral program", true],
  ["GET/POST", "/api/dashboard/recruiting", "Job postings", true],
  ["GET", "/api/dashboard/reports", "Report list", true],
  ["GET", "/api/dashboard/services", "Enabled services list", true],
  ["GET/PUT", "/api/dashboard/settings/account", "Account settings", true],
  ["GET/PUT", "/api/dashboard/settings/automation", "Automation settings", true],
  ["GET/POST", "/api/dashboard/support", "Support tickets", true],
  ["GET/POST", "/api/dashboard/webhooks", "Webhook management", true],
  // Services
  ["GET/PUT", "/api/services/[serviceId]/config", "Service configuration", true],
  ["GET/POST/PUT", "/api/services/ads/campaigns", "Ad campaign management", true],
  ["GET", "/api/services/ads/metrics", "Ad performance metrics", true],
  ["GET/POST/PUT", "/api/services/aeo/strategies", "AEO strategies", true],
  ["POST", "/api/services/aeo/generate", "Generate AEO content", true],
  ["GET", "/api/services/aeo/score", "AEO visibility score", true],
  ["GET", "/api/services/analytics/overview", "Analytics overview", true],
  ["GET", "/api/services/analytics/roi", "Analytics ROI breakdown", true],
  ["POST", "/api/services/booking/book", "Create a booking", true],
  ["GET", "/api/services/booking/slots", "Available time slots", true],
  ["POST", "/api/services/chatbot/chat", "Chatbot conversation", true],
  ["GET/PUT", "/api/services/chatbot/config", "Chatbot configuration", true],
  ["POST", "/api/services/content/generate", "AI content generation", true],
  ["GET/POST", "/api/services/content/posts", "Content post management", true],
  ["GET/POST", "/api/services/email/campaigns", "Email campaigns", true],
  ["POST", "/api/services/email/send", "Send email", true],
  ["GET", "/api/services/gbp", "Google Business Profile", true],
  ["GET/PATCH", "/api/services/gbp/hours", "GBP business hours", true],
  ["GET", "/api/services/gbp/insights", "GBP insights", true],
  ["GET/POST", "/api/services/gbp/reviews", "GBP reviews", true],
  ["GET/POST/PUT", "/api/services/ltv/campaigns", "LTV campaigns", true],
  ["GET", "/api/services/ltv/customers", "Customer LTV data", true],
  ["GET/PUT", "/api/services/receptionist/config", "AI receptionist config", true],
  ["GET/POST", "/api/services/reputation/reviews", "Reputation reviews", true],
  ["GET", "/api/services/reputation/score", "Reputation score", true],
  ["POST", "/api/services/seo/audit", "Run SEO audit", true],
  ["GET/POST/DELETE", "/api/services/seo/keywords", "SEO keyword tracking", true],
  ["GET/POST/PUT/DELETE", "/api/services/social/posts", "Social media posts", true],
  ["POST", "/api/services/voice/inbound", "Voice inbound webhook", false],
  ["POST", "/api/services/voice/outbound", "Initiate outbound call", true],
  // Payments
  ["POST", "/api/payments/checkout", "Create checkout session", true],
  ["POST", "/api/payments/portal", "Create customer portal", true],
  ["POST", "/api/payments/upgrade", "Upgrade subscription", true],
  ["POST", "/api/payments/reactivate", "Reactivate subscription", true],
  ["GET", "/api/payments/subscriptions", "List subscriptions", true],
  ["POST", "/api/payments/webhooks/stripe", "Stripe webhook handler", false],
  ["POST", "/api/payments/webhooks/invoice", "Invoice webhook handler", false],
  // Admin
  ["GET", "/api/admin/stats", "Platform-wide statistics", true],
  ["GET", "/api/admin/activity", "Admin activity log", true],
  ["GET", "/api/admin/monitoring", "System monitoring data", true],
  ["GET/POST", "/api/admin/clients", "Client management", true],
  ["GET/PUT", "/api/admin/clients/[id]", "Single client CRUD", true],
  ["GET/POST", "/api/admin/agencies", "Agency management", true],
  ["GET/PATCH", "/api/admin/agencies/[id]", "Single agency CRUD", true],
  ["GET/POST/PUT/DELETE", "/api/admin/products", "Product catalog CRUD", true],
  ["GET", "/api/admin/products/analytics", "Product analytics", true],
  ["GET/PUT/POST", "/api/admin/alerts", "Alert management", true],
  ["GET", "/api/admin/errors", "Error log viewer", true],
  ["POST", "/api/admin/errors/report", "Report an error", true],
  ["GET/PUT", "/api/admin/subscriptions", "Subscription management", true],
  ["GET/PUT", "/api/admin/support", "Support ticket admin", true],
  ["GET/POST", "/api/admin/snapshots", "System snapshots", true],
  ["GET/POST", "/api/admin/telegram/config", "Telegram bot config", true],
  // Outreach
  ["GET/POST", "/api/outreach/campaigns", "Outreach campaigns", true],
  ["POST", "/api/outreach/campaigns/[id]/start", "Start a campaign", true],
  ["POST", "/api/outreach/campaigns/[id]/pause", "Pause a campaign", true],
  ["GET", "/api/outreach/campaigns/[id]/stats", "Campaign statistics", true],
  ["GET/POST", "/api/outreach/sequences", "Email sequences", true],
  ["PUT/DELETE", "/api/outreach/sequences/[id]", "Edit/delete sequence", true],
  ["GET/POST", "/api/outreach/domains", "Sending domains", true],
  ["POST", "/api/outreach/enroll", "Enroll prospect in sequence", true],
  ["GET", "/api/outreach/prospects", "Prospect list", true],
  ["POST", "/api/outreach/prospects/enrich", "Enrich prospect data", true],
  ["POST", "/api/outreach/call", "Initiate outreach call", true],
  // Leads & Discovery
  ["GET", "/api/leads", "List leads", true],
  ["POST", "/api/leads/capture", "Capture a new lead", false],
  ["POST", "/api/leads/inbound", "Inbound lead webhook", false],
  ["GET", "/api/leads/stats", "Lead statistics", true],
  ["POST", "/api/discovery/run", "Run prospect discovery", true],
  ["GET", "/api/discovery/leads", "Discovered leads", true],
  ["GET/POST", "/api/discovery/sources", "Discovery source config", true],
  // Acquisition
  ["GET/POST", "/api/acquisition/prospects", "Acquisition prospects", true],
  ["GET", "/api/acquisition/case-studies", "Case study library", true],
  ["POST", "/api/acquisition/case-studies/generate/[clientId]", "Generate case study", true],
  ["POST", "/api/acquisition/proposals/generate/[prospectId]", "Generate proposal", true],
  ["GET", "/api/acquisition/proposals/[shareToken]", "View shared proposal", false],
  // Public & Misc
  ["GET", "/api/health", "Health check", false],
  ["GET", "/api/products", "Product catalog (public)", false],
  ["GET", "/api/blog", "Blog posts", false],
  ["GET", "/api/templates", "Template library", false],
  ["GET", "/api/social-proof", "Social proof feed", false],
  ["POST", "/api/bookings", "Create public booking", false],
  ["POST", "/api/exit-capture", "Exit-intent capture", false],
  ["GET/PUT", "/api/notifications", "User notifications", true],
  ["GET/POST", "/api/affiliates", "Affiliate program", true],
  ["POST", "/api/audit", "Run site audit", true],
  ["GET/POST", "/api/audit/instant", "Instant audit", false],
  ["POST", "/api/mcp/execute", "Execute MCP tool", true],
  ["GET", "/api/mcp/tools", "List MCP tools", true],
  ["POST", "/api/webhooks/telegram", "Telegram incoming webhook", false],
];

const endpoints: Endpoint[] = raw.map(([method, path, desc, auth]) => ({ method, path, desc, auth }));

const catPrefixes: [string, string[]][] = [
  ["Auth", ["/api/auth/", "/api/account/", "/api/onboarding"]],
  ["Dashboard", ["/api/dashboard/"]],
  ["Services", ["/api/services/"]],
  ["Payments", ["/api/payments/"]],
  ["Admin", ["/api/admin/"]],
  ["Outreach", ["/api/outreach/"]],
  ["Leads & Discovery", ["/api/leads", "/api/discovery/"]],
  ["Acquisition", ["/api/acquisition/"]],
];

function categorize(ep: Endpoint): string {
  for (const [cat, prefixes] of catPrefixes) {
    if (prefixes.some((p) => ep.path.startsWith(p))) return cat;
  }
  return "Public & Misc";
}

const methodColors: Record<string, string> = {
  GET: "bg-emerald-600/20 text-emerald-400", POST: "bg-blue-600/20 text-blue-400",
  PUT: "bg-amber-600/20 text-amber-400", PATCH: "bg-orange-600/20 text-orange-400",
  DELETE: "bg-red-600/20 text-red-400",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="flex gap-1 flex-wrap">
      {method.split("/").map((m) => (
        <span key={m} className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${methodColors[m] ?? "bg-secondary text-muted-foreground"}`}>{m}</span>
      ))}
    </span>
  );
}

export default function ApiDocsPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = endpoints.filter((ep) => {
      const matchSearch = !q || ep.path.toLowerCase().includes(q) || ep.desc.toLowerCase().includes(q) || ep.method.toLowerCase().includes(q);
      return matchSearch && (catFilter === "All" || categorize(ep) === catFilter);
    });
    const groups: Record<string, Endpoint[]> = {};
    for (const ep of filtered) (groups[categorize(ep)] ??= []).push(ep);
    return groups;
  }, [search, catFilter]);

  const catNames = ["All", ...catPrefixes.map(([c]) => c), "Public & Misc"];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">API Reference</h1>
        <p className="text-muted-foreground text-sm mt-1">{endpoints.length} endpoints &mdash; internal admin reference</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search endpoints..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
          {catNames.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {Object.keys(grouped).length === 0 && <p className="text-muted-foreground text-center py-12">No endpoints match your search.</p>}
      {Object.entries(grouped).map(([cat, eps]) => (
        <div key={cat} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground/80 mb-3 border-b border-border pb-2">{cat}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left text-xs uppercase tracking-wider">
                  <th className="pb-2 pr-4 w-36">Method</th>
                  <th className="pb-2 pr-4">Path</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 w-16 text-center">Auth</th>
                </tr>
              </thead>
              <tbody>
                {eps.map((ep) => (
                  <tr key={ep.path} className="border-t border-border/50 hover:bg-secondary/50">
                    <td className="py-2 pr-4"><MethodBadge method={ep.method} /></td>
                    <td className="py-2 pr-4 font-mono text-xs text-foreground/80">{ep.path}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{ep.desc}</td>
                    <td className="py-2 text-center">{ep.auth ? <span className="text-status-warning">Yes</span> : <span className="text-muted-foreground/60">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
