"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

const segmentLabels: Record<string, string> = {
  performance: "Performance",
  voice: "Voice Agent",
  crm: "CRM",
  inbox: "Inbox",
  invoices: "Invoices",
  quotes: "Quotes",
  billing: "Billing",
  settings: "Settings",
  account: "Account",
  automation: "Automation",
  support: "Support",
  reports: "Reports",
  referrals: "Referrals",
  ltv: "Lifetime Value",
  financing: "Financing",
  franchise: "Franchise",
  locations: "Locations",
  benchmarks: "Benchmarks",
  attribution: "Attribution",
  templates: "Templates",
  autopilot: "Autopilot",
  notifications: "Notifications",
  recruiting: "Recruiting",
  services: "Services",
  webhooks: "Webhooks",
  integrations: "Integrations",
  qbr: "Quarterly Review",
  aeo: "AEO",
  "social-proof": "Social Proof",
  booking: "Booking",
  widget: "Widget",
};

function formatSegment(segment: string): string {
  if (segmentLabels[segment]) return segmentLabels[segment];
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't render on the main dashboard page
  if (!pathname || pathname === "/dashboard") return null;

  const segments = pathname
    .replace(/^\/dashboard\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/dashboard/" + segments.slice(0, index + 1).join("/");
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="px-6 pt-4 pb-1">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <span className="text-muted-foreground/60">/</span>
            {crumb.isLast ? (
              <span className="text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
