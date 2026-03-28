"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Filter,
  Settings2,
  Mail,
  MessageSquare as Sms,
  Smartphone,
  Moon,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PartyPopper } from "lucide-react";
import {
  getNotificationConfig,
  relativeTime,
} from "@/lib/notification-types";

// ---------------------------------------------------------------------------
// Notification preference types
// ---------------------------------------------------------------------------

type DeliveryMethod = "in_app" | "email" | "sms";

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  methods: DeliveryMethod[];
}

const DEFAULT_PREFS: NotificationPref[] = [
  {
    key: "lead_captured",
    label: "New Lead Captured",
    description: "When a new lead is captured through your website or ads",
    enabled: true,
    methods: ["in_app", "email"],
  },
  {
    key: "review_received",
    label: "New Review Received",
    description: "When a customer leaves a new review on any platform",
    enabled: true,
    methods: ["in_app", "email"],
  },
  {
    key: "booking",
    label: "Booking Confirmed",
    description: "When a customer confirms a booking or appointment",
    enabled: true,
    methods: ["in_app", "email", "sms"],
  },
  {
    key: "invoice_paid",
    label: "Invoice Paid",
    description: "When a customer pays an invoice",
    enabled: true,
    methods: ["in_app"],
  },
  {
    key: "ai_action",
    label: "AI Action Taken",
    description:
      "When your AI assistant performs an automated action",
    enabled: true,
    methods: ["in_app"],
  },
  {
    key: "approval_required",
    label: "Action Required",
    description:
      "When something needs your manual approval or attention",
    enabled: true,
    methods: ["in_app", "email", "sms"],
  },
  {
    key: "report_ready",
    label: "Weekly Report Ready",
    description: "When your weekly performance report is available",
    enabled: true,
    methods: ["in_app", "email"],
  },
];

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "lead", label: "Leads" },
  { value: "review", label: "Reviews" },
  { value: "booking", label: "Bookings" },
  { value: "billing", label: "Payments" },
];

// ---------------------------------------------------------------------------
// Delivery method config
// ---------------------------------------------------------------------------

const METHODS: {
  key: DeliveryMethod;
  label: string;
  Icon: typeof Mail;
}[] = [
  { key: "in_app", label: "In-App", Icon: Smartphone },
  { key: "email", label: "Email", Icon: Mail },
  { key: "sms", label: "SMS", Icon: Sms },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, dismiss, isLoading } =
    useNotifications();
  const [filter, setFilter] = useState("all");
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [quietEnabled, setQuietEnabled] = useState(false);

  // Filter notifications
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    // Match type or type prefix
    return n.type === filter || n.type.startsWith(filter);
  });

  // Toggle a pref enabled/disabled
  function togglePref(key: string) {
    setPrefs((prev) =>
      prev.map((p) =>
        p.key === key ? { ...p, enabled: !p.enabled } : p
      )
    );
  }

  // Toggle a delivery method for a pref
  function toggleMethod(key: string, method: DeliveryMethod) {
    setPrefs((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p;
        const methods = p.methods.includes(method)
          ? p.methods.filter((m) => m !== method)
          : [...p.methods, method];
        return { ...p, methods };
      })
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrefs(!showPrefs)}
            className="gap-1.5"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {showPrefs ? "View Notifications" : "Preferences"}
          </Button>
          {!showPrefs && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsRead()}
              className="gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* ── Preferences panel ──────────────────────────────── */}
      {showPrefs ? (
        <div className="space-y-6">
          {/* Per-type preferences */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="border-b border-border/50 px-5 py-4">
              <h2 className="text-sm font-semibold">
                Notification Types
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Toggle each notification type and choose how you receive
                them.
              </p>
            </div>
            <div className="divide-y divide-border/30">
              {prefs.map((pref) => {
                const config = getNotificationConfig(pref.key);
                const TypeIcon = config.Icon;

                return (
                  <div
                    key={pref.key}
                    className={`px-5 py-4 transition-colors ${!pref.enabled ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                        >
                          <TypeIcon
                            className={`h-4 w-4 ${config.color}`}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-medium"
                            id={`label-${pref.key}`}
                          >
                            {pref.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pref.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={pref.enabled}
                        onCheckedChange={() =>
                          togglePref(pref.key)
                        }
                        aria-labelledby={`label-${pref.key}`}
                      />
                    </div>

                    {/* Delivery method toggles */}
                    {pref.enabled && (
                      <div className="mt-3 ml-11 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                          Deliver via:
                        </span>
                        {METHODS.map((method) => {
                          const active =
                            pref.methods.includes(method.key);
                          return (
                            <button
                              key={method.key}
                              onClick={() =>
                                toggleMethod(
                                  pref.key,
                                  method.key
                                )
                              }
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                active
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                              title={`${active ? "Disable" : "Enable"} ${method.label} delivery`}
                            >
                              <method.Icon className="h-3 w-3" />
                              {method.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiet hours */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="border-b border-border/50 px-5 py-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Quiet Hours
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pause non-critical notifications during off-hours.
                Action-required alerts will still come through.
              </p>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p
                    className="text-sm font-medium"
                    id="label-quiet-hours"
                  >
                    Enable Quiet Hours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Silence notifications during the specified window
                  </p>
                </div>
                <Switch
                  checked={quietEnabled}
                  onCheckedChange={setQuietEnabled}
                  aria-labelledby="label-quiet-hours"
                />
              </div>

              {quietEnabled && (
                <div className="flex items-center gap-3 ml-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <label
                      htmlFor="quiet-start"
                      className="text-xs text-muted-foreground"
                    >
                      From
                    </label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={quietStart}
                      onChange={(e) =>
                        setQuietStart(e.target.value)
                      }
                      className="rounded-md border border-border/50 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    to
                  </span>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="quiet-end"
                      className="text-xs text-muted-foreground"
                    >
                      Until
                    </label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={quietEnd}
                      onChange={(e) =>
                        setQuietEnd(e.target.value)
                      }
                      className="rounded-md border border-border/50 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowPrefs(false)}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Save Preferences
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Filter tabs ─────────────────────────────────── */}
          <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-lg border border-border/50 bg-card p-1">
            <Filter className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === opt.value
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {opt.label}
                {opt.value === "unread" && unreadCount > 0 && (
                  <span className="ml-1 rounded-full gradient-bg px-1 py-0.5 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Notification list ───────────────────────────── */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-2">
                <EmptyState
                  icon={PartyPopper}
                  variant="celebration"
                  title="All caught up!"
                  description={
                    filter !== "all"
                      ? `No ${filter} notifications right now.`
                      : "No new notifications right now. We'll let you know when there are new leads, reviews, bookings, or anything that needs your attention."
                  }
                  actionLabel="Back to Dashboard"
                  actionHref="/dashboard"
                />
              </div>
            ) : (
              filtered.map((n) => {
                const config = getNotificationConfig(n.type);
                const TypeIcon = config.Icon;

                const inner = (
                  <div
                    className={`group flex items-start gap-3 border-b border-border/30 px-5 py-4 transition-colors hover:bg-muted/50 ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Type icon in colored circle */}
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                    >
                      <TypeIcon
                        className={`h-4.5 w-4.5 ${config.color}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.bgColor} ${config.color} mb-1`}
                          >
                            {config.label}
                          </span>
                          <p
                            className={`text-sm leading-snug ${!n.read ? "font-semibold" : "font-medium"}`}
                          >
                            {n.title}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground/60 whitespace-nowrap">
                          {relativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {n.message}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        {n.actionUrl && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <ExternalLink className="h-3 w-3" />
                            View details
                          </span>
                        )}
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead([n.id]);
                            }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Check className="h-3 w-3" />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dismiss([n.id]);
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Dismiss
                        </button>
                      </div>
                    </div>

                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full gradient-bg" />
                    )}
                  </div>
                );

                if (n.actionUrl) {
                  return (
                    <Link
                      key={n.id}
                      href={n.actionUrl}
                      onClick={() => {
                        if (!n.read) markAsRead([n.id]);
                      }}
                      className="block"
                    >
                      {inner}
                    </Link>
                  );
                }

                return (
                  <div
                    key={n.id}
                    className="cursor-default"
                    onClick={() => !n.read && markAsRead([n.id])}
                  >
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
