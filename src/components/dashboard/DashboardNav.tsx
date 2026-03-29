"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
  LayoutDashboard,
  Bot,
  FileText,
  BarChart3,
  TrendingUp,
  Search,
  Award,
  ClipboardList,
  Users,
  Inbox,
  FileStack,
  DollarSign,
  Receipt,
  CreditCard,
  Phone,
  Zap,
  Gift,
  UserPlus,
  Landmark,
  Building2,
  MapPin,
  Webhook,
  LineChart,
  Headphones,
  HelpCircle,
  Settings,
  Cog,
  Plug,
  PanelLeft,
  X,
  ChevronDown,
  Menu,
  Sparkles,
  LogOut,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  serviceId?: string;
  /** Static badge label (e.g. "New") */
  badge?: string;
  /** Key used to look up a dynamic count from the badge-counts map */
  badgeCountKey?: "leads" | "inbox" | "notifications" | "quotes";
  /** Onboarding tour data attribute (e.g. "step-2") */
  dataTour?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  alwaysVisible?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Data fetchers                                                      */
/* ------------------------------------------------------------------ */

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

/* ------------------------------------------------------------------ */
/*  Badge counts hook                                                  */
/* ------------------------------------------------------------------ */

interface BadgeCounts {
  leads: number;
  inbox: number;
  notifications: number;
  quotes: number;
}

function useBadgeCounts(): BadgeCounts {
  const { unreadCount } = useNotifications();

  const { data: leads } = useSWR<{ id: string; status: string }[]>(
    "/api/dashboard/leads",
    fetcher,
    {
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      errorRetryCount: 2,
    },
  );

  const { data: inbox } = useSWR<{ id: string; unread?: boolean }[]>(
    "/api/dashboard/inbox",
    fetcher,
    {
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      errorRetryCount: 2,
    },
  );

  const { data: quotes } = useSWR<{ id: string; status: string }[]>(
    "/api/dashboard/quotes",
    fetcher,
    {
      refreshInterval: 120_000,
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      errorRetryCount: 2,
    },
  );

  return useMemo(() => {
    const newLeads = leads
      ? leads.filter((l) => l.status === "new").length
      : 0;
    const unreadInbox = inbox
      ? inbox.filter((t) => (t as Record<string, unknown>).unread).length
      : 0;
    const pendingQuotes = quotes
      ? quotes.filter((q) => q.status === "pending" || q.status === "draft")
          .length
      : 0;

    return {
      leads: newLeads,
      inbox: unreadInbox,
      notifications: unreadCount,
      quotes: pendingQuotes,
    };
  }, [leads, inbox, quotes, unreadCount]);
}

/* ------------------------------------------------------------------ */
/*  Navigation structure                                               */
/* ------------------------------------------------------------------ */

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
    alwaysVisible: true,
  },
  {
    title: "Services",
    items: [
      { href: "/dashboard/services", label: "All Services", icon: Zap, dataTour: "step-2" },
      {
        href: "/dashboard/services/social-proof",
        label: "Social Proof",
        icon: Award,
        serviceId: "social",
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        href: "/dashboard/crm",
        label: "CRM / Leads",
        icon: Users,
        serviceId: "crm",
        badgeCountKey: "leads",
        dataTour: "step-3",
      },
      {
        href: "/dashboard/inbox",
        label: "Inbox",
        icon: Inbox,
        serviceId: "email",
        badgeCountKey: "inbox",
      },
      { href: "/dashboard/templates", label: "Templates", icon: FileStack },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        href: "/dashboard/performance",
        label: "Performance",
        icon: TrendingUp,
      },
      {
        href: "/dashboard/attribution",
        label: "Attribution",
        icon: BarChart3,
      },
      {
        href: "/dashboard/aeo",
        label: "AEO Insights",
        icon: Search,
        serviceId: "seo",
        badge: "New",
      },
      { href: "/dashboard/benchmarks", label: "Benchmarks", icon: LineChart },
      { href: "/dashboard/reports", label: "Reports", icon: ClipboardList, dataTour: "step-4" },
      { href: "/dashboard/ltv", label: "Customer LTV", icon: DollarSign },
      { href: "/dashboard/qbr", label: "QBR Reports", icon: FileText },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/dashboard/quotes",
        label: "Quotes",
        icon: Receipt,
        badgeCountKey: "quotes",
      },
      { href: "/dashboard/invoices", label: "Invoices", icon: DollarSign },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      {
        href: "/dashboard/voice",
        label: "AI Voice",
        icon: Phone,
        serviceId: "voice-agent",
      },
      { href: "/dashboard/autopilot", label: "Autopilot", icon: Bot },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
      { href: "/dashboard/recruiting", label: "Recruiting", icon: UserPlus },
      { href: "/dashboard/financing", label: "Financing", icon: Landmark },
      { href: "/dashboard/franchise", label: "Franchise", icon: Building2 },
      { href: "/dashboard/locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/dashboard/support", label: "Support", icon: Headphones, dataTour: "step-5" },
      { href: "/help", label: "Help Center", icon: HelpCircle },
      {
        href: "/dashboard/settings/account",
        label: "Account",
        icon: Settings,
      },
      {
        href: "/dashboard/settings/automation",
        label: "Automation",
        icon: Cog,
      },
      {
        href: "/dashboard/settings/integrations",
        label: "Integrations",
        icon: Plug,
      },
    ],
    alwaysVisible: true,
  },
];

// Bottom nav items shown on mobile - the most important destinations
const MOBILE_BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  {
    href: "/dashboard/crm",
    label: "Leads",
    icon: Users,
    badgeCountKey: "leads",
  },
  { href: "/dashboard/performance", label: "Analytics", icon: TrendingUp },
  {
    href: "/dashboard/inbox",
    label: "Inbox",
    icon: Inbox,
    badgeCountKey: "inbox",
  },
  { href: "/dashboard/settings/account", label: "Settings", icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isItemActive(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"))
  );
}

function sectionContainsActive(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => isItemActive(pathname, item.href));
}

/* ------------------------------------------------------------------ */
/*  Badge sub-components                                               */
/* ------------------------------------------------------------------ */

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold tabular-nums text-primary ring-1 ring-primary/20 transition-transform">
      {label}
    </span>
  );
}

function LabelBadge({ label }: { label: string }) {
  return (
    <span className="ml-auto flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/20">
      <Sparkles className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function MobileBadgeDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  User profile footer                                                */
/* ------------------------------------------------------------------ */

function UserProfileFooter({
  onClose,
}: {
  onClose: () => void;
}) {
  const { data: profile } = useSWR<{
    businessName: string;
    ownerName: string;
    initials: string;
    plan: string;
  }>("/api/dashboard/profile", fetcher, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    errorRetryCount: 2,
  });

  const { data: subscription } = useSWR<{
    bundleName: string;
    status: string;
  }>("/api/dashboard/subscription", fetcher, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    errorRetryCount: 2,
  });

  const displayName = profile?.ownerName || "Dashboard";
  const initials = profile?.initials || displayName.charAt(0).toUpperCase();
  const planLabel = subscription?.bundleName || profile?.plan || null;

  return (
    <div className="border-t border-border/60 px-3 py-3">
      {/* Plan / billing quick-access */}
      {planLabel && (
        <Link
          href="/dashboard/billing"
          onClick={onClose}
          className="group mb-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/[0.02] px-2.5 py-3 min-h-[44px] text-xs transition-all hover:from-primary/10 hover:to-primary/5"
        >
          <Crown className="h-3.5 w-3.5 text-primary/70 transition-colors group-hover:text-primary" />
          <span className="font-medium text-foreground/80 transition-colors group-hover:text-foreground">
            {planLabel}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
            Manage
          </span>
        </Link>
      )}

      {/* User avatar row */}
      <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary ring-1 ring-primary/10">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight text-foreground/90">
            {displayName}
          </p>
          {profile?.businessName && (
            <p className="truncate text-[11px] leading-tight text-muted-foreground/60">
              {profile.businessName}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/settings/account"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Account settings"
        >
          <LogOut className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  What's New indicator                                               */
/* ------------------------------------------------------------------ */

function WhatsNewBanner({ onClose }: { onClose: () => void }) {
  return (
    <Link
      href="/dashboard/aeo"
      onClick={onClose}
      className="group mx-3 mb-2 flex items-center gap-2.5 rounded-lg border border-violet-500/10 bg-gradient-to-r from-violet-500/[0.06] to-fuchsia-500/[0.04] px-3 py-2.5 transition-all hover:border-violet-500/20 hover:from-violet-500/10 hover:to-fuchsia-500/[0.06]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 transition-colors group-hover:bg-violet-500/15">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground/90">What&apos;s New</p>
        <p className="truncate text-[10px] text-muted-foreground/70">
          AEO Insights now available
        </p>
      </div>
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function DashboardNav() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const openTriggerRef = useRef<HTMLButtonElement>(null);

  const badgeCounts = useBadgeCounts();

  const { data: services = [] } = useSWR<
    { serviceId: string; status: string; activatedAt: string | null }[]
  >("/api/dashboard/services", fetcher);

  // Auto-expand the section that contains the active page
  useEffect(() => {
    requestAnimationFrame(() => {
      setCollapsed((prev) => {
        const next = { ...prev };
        for (const section of sections) {
          if (sectionContainsActive(pathname, section.items)) {
            next[section.title] = false;
          }
        }
        return next;
      });
    });
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape and return focus to trigger
  const closeNav = useCallback(() => {
    setOpen(false);
    openTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeNav();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeNav]);

  // Focus trap within the nav drawer
  useEffect(() => {
    if (!open || !navRef.current) return;
    const nav = navRef.current;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = nav.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [open]);

  // Swipe-to-close gesture for mobile drawer
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      // Swipe left to close (threshold: 80px)
      if (deltaX < -80) {
        closeNav();
      }
      touchStartX.current = null;
    },
    [closeNav],
  );

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  // Get active service IDs
  const activeServiceIds = useMemo(() => {
    return new Set(services.map((s) => s.serviceId));
  }, [services]);

  // Filter sections based on active services
  const filteredSections = useMemo(() => {
    return sections
      .map((section) => {
        if (section.alwaysVisible) {
          return section;
        }
        const filteredItems = section.items.filter((item) => {
          if (!item.serviceId) {
            return true;
          }
          return activeServiceIds.has(item.serviceId);
        });
        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => {
        return section.alwaysVisible || section.items.length > 0;
      });
  }, [activeServiceIds]);

  // Total badge count for the floating trigger button
  const totalBadgeCount = badgeCounts.leads + badgeCounts.inbox;

  return (
    <>
      {/* Desktop/tablet floating trigger button */}
      <button
        ref={openTriggerRef}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 left-6 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-border bg-background/95 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-muted hover:shadow-xl md:flex",
          open && "pointer-events-none opacity-0",
        )}
        aria-label="Open navigation"
      >
        <PanelLeft className="h-5 w-5" />
        {totalBadgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {totalBadgeCount > 99 ? "99+" : totalBadgeCount}
          </span>
        )}
      </button>

      {/* Mobile top bar trigger */}
      <div className="sticky top-0 z-30 flex h-12 items-center border-b border-border bg-background/95 px-4 backdrop-blur-sm md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="relative -ml-2 mr-2 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
          {totalBadgeCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
        <span className="text-sm font-semibold tracking-tight">Dashboard</span>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={closeNav}
        />
      )}

      {/* Sidebar drawer */}
      <nav
        ref={navRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-background shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Dashboard navigation"
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight">
                Sovereign AI
              </span>
            </div>
          </div>
          <button
            onClick={closeNav}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* What's New banner */}
        <div className="shrink-0 pt-3">
          <WhatsNewBanner onClose={() => setOpen(false)} />
        </div>

        {/* Scrollable nav content */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filteredSections.map((section, sectionIndex) => {
            const isCollapsed = collapsed[section.title];
            const hasActive = sectionContainsActive(pathname, section.items);

            // Sum up badge counts in this section for collapsed indicator
            const sectionBadgeTotal = section.items.reduce((sum, item) => {
              if (item.badgeCountKey) {
                return sum + (badgeCounts[item.badgeCountKey] || 0);
              }
              return sum;
            }, 0);

            return (
              <div key={section.title}>
                {/* Section divider between groups (not before the first) */}
                {sectionIndex > 0 && (
                  <div className="mx-2 my-2 border-t border-border/40" />
                )}

                {/* Section header */}
                <button
                  onClick={() => toggle(section.title)}
                  aria-expanded={!isCollapsed}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-2.5 min-h-[44px] text-[11px] font-semibold uppercase tracking-widest transition-colors duration-150",
                    hasActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {section.title}
                    {/* Show aggregate badge count when section is collapsed */}
                    {isCollapsed && sectionBadgeTotal > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[9px] font-semibold tabular-nums text-primary">
                        {sectionBadgeTotal > 99 ? "99+" : sectionBadgeTotal}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isCollapsed && "-rotate-90",
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Section items */}
                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = isItemActive(pathname, item.href);
                      const Icon = item.icon;
                      const dynamicCount = item.badgeCountKey
                        ? badgeCounts[item.badgeCountKey]
                        : 0;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          data-tour={item.dataTour}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 min-h-[44px] text-sm transition-all duration-150",
                            isActive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                          )}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary/60" />
                          )}

                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>

                          <span className="truncate">{item.label}</span>

                          {/* Dynamic count badge */}
                          {dynamicCount > 0 && (
                            <CountBadge count={dynamicCount} />
                          )}

                          {/* Static label badge (e.g. "New") */}
                          {item.badge && dynamicCount <= 0 && (
                            <LabelBadge label={item.badge} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User profile footer */}
        <UserProfileFooter onClose={() => setOpen(false)} />
      </nav>

      {/* Mobile bottom navigation bar */}
      <nav
        aria-label="Quick navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          minHeight: "4rem",
        }}
      >
        {MOBILE_BOTTOM_NAV.map((item) => {
          const isActive = isItemActive(pathname, item.href);
          const Icon = item.icon;
          const dynamicCount = item.badgeCountKey
            ? badgeCounts[item.badgeCountKey]
            : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors duration-150 min-h-[48px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "relative flex h-8 w-10 items-center justify-center rounded-lg transition-all duration-200",
                  isActive && "bg-primary/15 scale-110",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", isActive && "text-primary")} />
                <MobileBadgeDot count={dynamicCount} />
              </div>
              <span
                className={cn(
                  "transition-all duration-150",
                  isActive && "font-semibold",
                )}
              >
                {item.label}
              </span>
              {/* Active bar indicator under label */}
              {isActive && (
                <span className="absolute bottom-1.5 h-[3px] w-5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer so mobile page content is not hidden behind the bottom nav */}
      <div
        className="md:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      />
    </>
  );
}
