"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Star,
  FileText,
  Megaphone,
  MessageSquare,
  Search,
  Activity,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Download,
  ArrowRight,
  CalendarCheck,
  Receipt,
  Bot,
  Wrench,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/shared/FadeInView";
import { ActivityItemRow } from "./ActivityItem";

import type { LucideIcon } from "lucide-react";

interface TypeConfig {
  icon: LucideIcon;
  color: string;
  actionHref: string;
  actionLabel: string;
}

const TYPE_ICONS: Record<string, TypeConfig> = {
  lead_captured: {
    icon: UserPlus,
    color: "bg-blue-500/10 text-blue-400",
    actionHref: "/dashboard/crm",
    actionLabel: "View in CRM",
  },
  review_received: {
    icon: Star,
    color: "bg-amber-500/10 text-amber-400",
    actionHref: "/dashboard/services/reviews",
    actionLabel: "See reviews",
  },
  call_booked: {
    icon: CalendarCheck,
    color: "bg-emerald-500/10 text-emerald-400",
    actionHref: "/dashboard/services/booking",
    actionLabel: "View booking",
  },
  email_sent: {
    icon: Mail,
    color: "bg-sky-500/10 text-sky-400",
    actionHref: "/dashboard/services/email",
    actionLabel: "View emails",
  },
  content_published: {
    icon: FileText,
    color: "bg-purple-500/10 text-purple-400",
    actionHref: "/dashboard/services/content",
    actionLabel: "View content",
  },
  review_response: {
    icon: MessageSquare,
    color: "bg-amber-500/10 text-amber-400",
    actionHref: "/dashboard/services/reviews",
    actionLabel: "See response",
  },
  ad_optimized: {
    icon: Megaphone,
    color: "bg-pink-500/10 text-pink-400",
    actionHref: "/dashboard/services/ads",
    actionLabel: "View ads",
  },
  seo_update: {
    icon: Search,
    color: "bg-indigo-500/10 text-indigo-400",
    actionHref: "/dashboard/services/seo",
    actionLabel: "View SEO",
  },
  invoice_paid: {
    icon: Receipt,
    color: "bg-emerald-500/10 text-emerald-400",
    actionHref: "/dashboard/billing",
    actionLabel: "View invoice",
  },
  chatbot_conversation: {
    icon: Bot,
    color: "bg-violet-500/10 text-violet-400",
    actionHref: "/dashboard/services/chatbot",
    actionLabel: "View chat",
  },
  service_update: {
    icon: Wrench,
    color: "bg-orange-500/10 text-orange-400",
    actionHref: "/dashboard/services",
    actionLabel: "View services",
  },
  booking_confirmed: {
    icon: CalendarCheck,
    color: "bg-teal-500/10 text-teal-400",
    actionHref: "/dashboard/services/booking",
    actionLabel: "View booking",
  },
};

const DEFAULT_TYPE_CONFIG: TypeConfig = {
  icon: Activity,
  color: "bg-muted text-muted-foreground",
  actionHref: "/dashboard",
  actionLabel: "View",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ActivitySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
          <div className="mt-0.5 h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

const PAGE_SIZE = 10;

const FILTER_CATEGORIES = [
  { label: "All", types: null },
  { label: "Leads", types: ["lead_captured", "call_booked", "booking_confirmed"] },
  { label: "Services", types: ["content_published", "seo_update", "ad_optimized", "chatbot_conversation", "service_update"] },
  { label: "Billing", types: ["email_sent", "review_received", "review_response", "invoice_paid"] },
] as const;

interface ActivityFeedProps {
  activities?: { id: string; type: string; title: string; description: string; timestamp: string }[];
  maxHeight?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function ActivityFeed({
  activities = [],
  maxHeight = "400px",
  isLoading,
  error,
  onRetry,
}: ActivityFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filterTypes = FILTER_CATEGORIES.find((f) => f.label === activeFilter)?.types ?? null;
  const filteredActivities = filterTypes
    ? activities.filter((a) => (filterTypes as readonly string[]).includes(a.type))
    : activities;
  const visibleActivities = filteredActivities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredActivities.length;

  return (
    <FadeInView>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">
                AI Activity Feed
              </CardTitle>
              <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                </span>
                <span className="text-xs font-medium text-red-400">Live</span>
              </div>
              <span className="hidden sm:inline text-xs text-muted-foreground">
                AI systems active
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activities.length > 0 && !isLoading && !error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/api/dashboard/export?type=activities", "_blank")}
                  className="hidden sm:inline-flex"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export
                </Button>
              )}
            </div>
          </div>
          {activities.length > 0 && !isLoading && !error && (
            <div className="flex items-center gap-1.5 pt-2" role="group" aria-label="Filter activities">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => {
                    setActiveFilter(cat.label);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  aria-pressed={activeFilter === cat.label}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeFilter === cat.label
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ActivitySkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-destructive/60" aria-hidden="true" />
              <p className="text-sm font-medium">Unable to load activity</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We could not fetch your activity feed right now.
              </p>
              {onRetry && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => onRetry()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-lg" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Activity className="h-6 w-6 text-purple-400/60" aria-hidden="true" />
                </div>
              </div>
              <p className="text-sm font-semibold">No activity yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                This live feed will show every action your AI services take -- emails sent, reviews responded to, ads optimized, and more.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
                </span>
                <span className="text-[11px] text-muted-foreground">Monitoring AI services</span>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No matching activity</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No activities match the selected filter.
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="pr-2" style={{ maxHeight }}>
                <div className="space-y-0.5" aria-live="polite" aria-relevant="additions">
                  {visibleActivities.map((activity) => {
                    const typeConfig = TYPE_ICONS[activity.type] ?? DEFAULT_TYPE_CONFIG;
                    return (
                      <ActivityItemRow
                        key={activity.id}
                        icon={typeConfig.icon}
                        iconColor={typeConfig.color}
                        title={activity.title}
                        description={activity.description}
                        timestamp={timeAgo(activity.timestamp)}
                        actionHref={typeConfig.actionHref}
                        actionLabel={typeConfig.actionLabel}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="mt-3 flex items-center justify-between">
                {hasMore ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="text-xs"
                  >
                    <ChevronDown className="mr-1 h-3.5 w-3.5" />
                    Load more ({filteredActivities.length - visibleCount} remaining)
                  </Button>
                ) : (
                  <div />
                )}
                <Link
                  href="/dashboard/notifications"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View all activity
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </FadeInView>
  );
}
