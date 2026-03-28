"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  Users,
  Zap,
  TrendingUp,
  BarChart3,
  FileText,
  Inbox,
  Phone,
  Bot,
  Gift,
  Settings,
  Cog,
  CreditCard,
  Download,
  ClipboardList,
  Headphones,
  MapPin,
  LineChart,
  DollarSign,
  Webhook,
  UserPlus,
  Landmark,
  Building2,
  Award,
  FileStack,
  Plug,
  Receipt,
  Plus,
  Calendar,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  shortcut?: string;
  keywords?: string[];
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

// ---------------------------------------------------------------------------
// Recent searches (persisted in localStorage)
// ---------------------------------------------------------------------------

const RECENT_KEY = "sovereign-cmd-recent";
const MAX_RECENT = 5;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addRecent(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getRecent().filter((r) => r !== id);
    list.unshift(id);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(list.slice(0, MAX_RECENT)),
    );
  } catch {
    // localStorage unavailable
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Reset state when the dialog opens.  We defer the setState calls to a
  // microtask so they don't run synchronously inside the effect body, which
  // the React Compiler lint rule flags as a cascading-render risk.
  const prevOpen = useRef(open);
  useEffect(() => {
    if (open && !prevOpen.current) {
      requestAnimationFrame(() => {
        setSearch("");
        setRecentIds(getRecent());
        inputRef.current?.focus();
      });
    }
    prevOpen.current = open;
  }, [open]);

  // ---------------------------------------------------------------------------
  // Build all command items
  // ---------------------------------------------------------------------------

  const navigationItems: CommandItem[] = [
    { id: "p-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", shortcut: "G H", keywords: ["home", "overview"] },
    { id: "p-crm", label: "CRM / Leads", icon: Users, href: "/dashboard/crm", shortcut: "G L", keywords: ["contacts", "customers"] },
    { id: "p-inbox", label: "Inbox", icon: Inbox, href: "/dashboard/inbox", keywords: ["messages", "notifications"] },
    { id: "p-templates", label: "Templates", icon: FileStack, href: "/dashboard/templates", keywords: ["email", "message"] },
    { id: "p-services", label: "All Services", icon: Zap, href: "/dashboard/services", shortcut: "G S", keywords: ["products"] },
    { id: "p-social-proof", label: "Social Proof", icon: Award, href: "/dashboard/services/social-proof", keywords: ["reviews", "testimonials"] },
    { id: "p-performance", label: "Performance", icon: TrendingUp, href: "/dashboard/performance", shortcut: "G P", keywords: ["metrics", "stats"] },
    { id: "p-attribution", label: "Attribution", icon: BarChart3, href: "/dashboard/attribution", keywords: ["tracking", "source"] },
    { id: "p-aeo", label: "AEO Insights", icon: Search, href: "/dashboard/aeo", keywords: ["answer engine", "optimization"] },
    { id: "p-benchmarks", label: "Benchmarks", icon: LineChart, href: "/dashboard/benchmarks", keywords: ["comparison", "industry"] },
    { id: "p-reports", label: "Reports", icon: ClipboardList, href: "/dashboard/reports", keywords: ["analytics", "data"] },
    { id: "p-ltv", label: "Customer LTV", icon: DollarSign, href: "/dashboard/ltv", keywords: ["lifetime value", "revenue"] },
    { id: "p-qbr", label: "QBR Reports", icon: FileText, href: "/dashboard/qbr", keywords: ["quarterly", "business review"] },
    { id: "p-quotes", label: "Quotes", icon: Receipt, href: "/dashboard/quotes", keywords: ["estimates", "proposals"] },
    { id: "p-invoices", label: "Invoices", icon: DollarSign, href: "/dashboard/invoices", keywords: ["payments", "billing"] },
    { id: "p-billing", label: "Billing", icon: CreditCard, href: "/dashboard/billing", keywords: ["subscription", "plan"] },
    { id: "p-voice", label: "AI Voice", icon: Phone, href: "/dashboard/voice", keywords: ["phone", "calls"] },
    { id: "p-autopilot", label: "Autopilot", icon: Bot, href: "/dashboard/autopilot", keywords: ["automation", "ai"] },
    { id: "p-referrals", label: "Referrals", icon: Gift, href: "/dashboard/referrals", keywords: ["rewards", "affiliate"] },
    { id: "p-recruiting", label: "Recruiting", icon: UserPlus, href: "/dashboard/recruiting", keywords: ["hiring", "jobs"] },
    { id: "p-financing", label: "Financing", icon: Landmark, href: "/dashboard/financing", keywords: ["loans", "capital"] },
    { id: "p-franchise", label: "Franchise", icon: Building2, href: "/dashboard/franchise", keywords: ["locations", "expansion"] },
    { id: "p-locations", label: "Locations", icon: MapPin, href: "/dashboard/locations", keywords: ["offices", "branches"] },
    { id: "p-webhooks", label: "Webhooks", icon: Webhook, href: "/dashboard/webhooks", keywords: ["api", "integrations"] },
    { id: "p-support", label: "Support", icon: Headphones, href: "/dashboard/support", keywords: ["help", "contact"] },
  ];

  const actionItems: CommandItem[] = [
    { id: "a-new-lead", label: "New Lead", icon: Plus, href: "/dashboard/crm?new=true", keywords: ["add", "create", "contact"] },
    { id: "a-new-invoice", label: "New Invoice", icon: Plus, href: "/dashboard/invoices?new=true", keywords: ["add", "create", "bill"] },
    { id: "a-new-booking", label: "New Booking", icon: Calendar, href: "/dashboard/crm?booking=true", keywords: ["add", "create", "appointment", "schedule"] },
    { id: "a-export", label: "Export Leads", icon: Download, action: () => router.push("/dashboard/crm?export=true"), keywords: ["download", "csv"] },
    { id: "a-reports", label: "View Reports", icon: ClipboardList, href: "/dashboard/reports", keywords: ["analytics"] },
    { id: "a-billing", label: "Manage Billing", icon: CreditCard, href: "/dashboard/billing", keywords: ["subscription", "payment"] },
    { id: "a-support", label: "Contact Support", icon: Headphones, href: "/dashboard/support", keywords: ["help", "ticket"] },
  ];

  const leadItems: CommandItem[] = [
    { id: "l-all", label: "All Leads", icon: Users, href: "/dashboard/crm", keywords: ["contacts"] },
    { id: "l-new", label: "New Leads", icon: Users, href: "/dashboard/crm?status=new", keywords: ["fresh", "uncontacted"] },
    { id: "l-contacted", label: "Contacted Leads", icon: Users, href: "/dashboard/crm?status=contacted", keywords: ["follow up"] },
    { id: "l-qualified", label: "Qualified Leads", icon: Users, href: "/dashboard/crm?status=qualified", keywords: ["hot", "ready"] },
  ];

  const serviceItems: CommandItem[] = [
    { id: "s-chatbot", label: "AI Chatbot", icon: Bot, href: "/dashboard/services/chatbot", keywords: ["chat", "widget"] },
    { id: "s-voice", label: "AI Voice Agent", icon: Phone, href: "/dashboard/voice", keywords: ["phone", "calls"] },
    { id: "s-seo", label: "SEO Service", icon: Search, href: "/dashboard/services/seo", keywords: ["search", "ranking"] },
    { id: "s-reviews", label: "Review Management", icon: Award, href: "/dashboard/services/reviews", keywords: ["reputation"] },
    { id: "s-email", label: "Email Campaigns", icon: Inbox, href: "/dashboard/services/email", keywords: ["marketing", "newsletter"] },
    { id: "s-social", label: "Social Media", icon: Award, href: "/dashboard/services/social", keywords: ["posting", "content"] },
    { id: "s-analytics", label: "Analytics", icon: BarChart3, href: "/dashboard/services/analytics", keywords: ["data", "tracking"] },
  ];

  const settingsItems: CommandItem[] = [
    { id: "p-account", label: "Account Settings", icon: Settings, href: "/dashboard/settings/account", keywords: ["profile", "preferences"] },
    { id: "p-automation", label: "Automation Settings", icon: Cog, href: "/dashboard/settings/automation", keywords: ["workflows", "rules"] },
    { id: "p-integrations", label: "Integrations", icon: Plug, href: "/dashboard/settings/integrations", keywords: ["connect", "apps", "api"] },
  ];

  // Flatten all items for recent-search lookup
  const allItems: CommandItem[] = [
    ...navigationItems,
    ...actionItems,
    ...leadItems,
    ...serviceItems,
    ...settingsItems,
  ];

  const allItemsMap = new Map(allItems.map((item) => [item.id, item]));

  // Build recent items from stored IDs
  const recentItems: CommandItem[] = recentIds
    .map((id) => allItemsMap.get(id))
    .filter((item): item is CommandItem => item !== undefined);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const selectItem = useCallback(
    (item: CommandItem) => {
      addRecent(item.id);
      onClose();
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [onClose, router],
  );

  // ---------------------------------------------------------------------------
  // Build groups
  // ---------------------------------------------------------------------------

  const groups: CommandGroup[] = [
    ...(recentItems.length > 0 && !search
      ? [{ heading: "Recent", items: recentItems }]
      : []),
    { heading: "Navigation", items: navigationItems },
    { heading: "Actions", items: actionItems },
    { heading: "Leads", items: leadItems },
    { heading: "Services", items: serviceItems },
    { heading: "Settings", items: settingsItems },
  ];

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <Command
        className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-card shadow-2xl"
        loop
        filter={(value, search, keywords) => {
          const extendedValue = [value, ...(keywords ?? [])].join(" ");
          if (extendedValue.toLowerCase().includes(search.toLowerCase()))
            return 1;
          return 0;
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Search pages, actions, services..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          />
          <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <Command.List className="max-h-[50vh] overflow-y-auto px-2 py-2 [&_[cmdk-list-sizer]]:space-y-1">
          <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {groups.map((group) => (
            <Command.Group
              key={group.heading}
              heading={group.heading}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    keywords={item.keywords}
                    onSelect={() => selectItem(item)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 transition-colors data-[selected=true]:bg-primary/20 data-[selected=true]:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.shortcut && (
                      <div className="ml-auto flex items-center gap-1">
                        {item.shortcut.split(" ").map((key) => (
                          <kbd
                            key={key}
                            className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    )}
                    {group.heading === "Recent" && (
                      <Clock className="ml-auto h-3 w-3 text-muted-foreground/50" />
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono">
                &uarr;&darr;
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono">
                &crarr;
              </kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono">
                esc
              </kbd>
              close
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono">
              {typeof navigator !== "undefined" &&
              /Mac/.test(navigator.userAgent)
                ? "\u2318"
                : "Ctrl"}
              K
            </kbd>
          </span>
        </div>
      </Command>
    </div>
  );
}
