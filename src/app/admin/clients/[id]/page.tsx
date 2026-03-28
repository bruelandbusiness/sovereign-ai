"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Layers,
  Users,
  Activity,
  Pause,
  Play,
  XCircle,
  ArrowUpCircle,
  Send,
  ExternalLink,
  StickyNote,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  getBundleById,
  SERVICES,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientDetail {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  vertical: string | null;
  website: string | null;
  createdAt: string;
  email: string;
  subscription: {
    id: string;
    bundleId: string | null;
    monthlyAmount: number;
    status: string;
    stripeSubId: string | null;
    stripeCustId: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
    isTrial?: boolean;
    trialEndsAt?: string | null;
  } | null;
  services: Array<{
    id: string;
    serviceId: string;
    status: string;
    activatedAt: string | null;
    createdAt: string;
  }>;
  leads: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string;
    status: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "provisioning":
      return "secondary" as const;
    case "paused":
      return "outline" as const;
    case "canceled":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function statusDot(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-400";
    case "provisioning":
      return "bg-blue-400";
    case "paused":
      return "bg-yellow-400";
    case "canceled":
      return "bg-red-400";
    default:
      return "bg-muted-foreground";
  }
}

function leadStatusVariant(status: string) {
  switch (status) {
    case "won":
      return "default" as const;
    case "qualified":
    case "appointment":
      return "secondary" as const;
    case "new":
      return "outline" as const;
    case "lost":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function activityIcon(type: string) {
  switch (type) {
    case "lead_captured":
      return <Users className="h-3.5 w-3.5 text-blue-400" />;
    case "email_sent":
      return <Mail className="h-3.5 w-3.5 text-violet-400" />;
    case "content_published":
      return <StickyNote className="h-3.5 w-3.5 text-emerald-400" />;
    case "review_response":
      return <CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" />;
    case "ad_optimized":
      return <TrendingUp className="h-3.5 w-3.5 text-orange-400" />;
    default:
      return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const fetchClient = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      } else {
        setError("Failed to load client details.");
      }
    } catch {
      setError("Connection issue while loading client details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  // Action handlers
  async function handleAction(action: string) {
    // Confirmation for destructive actions
    if (action === "deactivate") {
      if (!confirm("Are you sure you want to deactivate this client? Their services will be paused.")) return;
    } else if (action === "reactivate") {
      if (!confirm("Are you sure you want to reactivate this client?")) return;
    }

    setActionLoading(action);
    setError(null);
    try {
      if (action === "impersonate") {
        const res = await fetch(`/api/admin/clients/${id}/manage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "impersonate" }),
        });
        if (res.ok) {
          const data = await res.json();
          window.open(data.url, "_blank");
        } else {
          setError("Failed to impersonate client.");
        }
      } else if (action === "deactivate" || action === "reactivate") {
        const res = await fetch(`/api/admin/clients/${id}/manage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (res.ok) {
          await fetchClient();
        } else {
          setError(`Failed to ${action} client.`);
        }
      } else if (action === "email") {
        if (client) {
          window.open(`mailto:${client.email}`, "_blank");
        }
      }
    } catch {
      setError(`Connection issue while performing ${action}.`);
    } finally {
      setActionLoading(null);
    }
  }

  // Save notes (stored in localStorage for now)
  function handleSaveNotes() {
    localStorage.setItem(`admin_notes_${id}`, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`admin_notes_${id}`);
    if (saved) setNotes(saved);
  }, [id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="skeleton h-64 rounded-xl lg:col-span-2" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
        <div className="skeleton h-48 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // Not found
  if (!client) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            Client not found.
          </p>
          <Link
            href="/admin/clients"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to clients
          </Link>
        </div>
      </div>
    );
  }

  const bundle = client.subscription?.bundleId
    ? getBundleById(client.subscription.bundleId)
    : null;

  const subStatus = client.subscription?.status ?? "none";
  const isActive = subStatus === "active";

  // Lead metrics
  const totalLeads = client.leads.length;
  const wonLeads = client.leads.filter((l) => l.status === "won").length;
  const conversionRate =
    totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Service activation: map all 16 services
  const serviceMap = new Map(
    client.services.map((s) => [s.serviceId, s])
  );

  // Days since signup
  const daysSinceSignup = Math.floor(
    (Date.now() - new Date(client.createdAt).getTime()) / 86400000
  );

  // Next payment
  const nextPayment = client.subscription?.currentPeriodEnd
    ? new Date(client.subscription.currentPeriodEnd)
    : null;

  return (
    <div className="space-y-6 page-enter">
      {/* Breadcrumbs */}
      <AdminBreadcrumbs
        items={[
          { label: "Clients", href: "/admin/clients" },
          { label: client.businessName },
        ]}
      />

      {/* Header + action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {client.businessName}
              </h1>
              {client.subscription && (
                <Badge variant={statusVariant(subStatus)}>{subStatus}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {client.ownerName} &middot; Joined{" "}
              {new Date(client.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              ({daysSinceSignup}d ago)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {client.subscription && (
            <>
              {isActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading === "deactivate"}
                  onClick={() => handleAction("deactivate")}
                >
                  <Pause className="h-3.5 w-3.5 mr-1.5" />
                  {actionLoading === "deactivate"
                    ? "Pausing..."
                    : "Pause"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading === "reactivate"}
                  onClick={() => handleAction("reactivate")}
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  {actionLoading === "reactivate"
                    ? "Reactivating..."
                    : "Reactivate"}
                </Button>
              )}

              {isActive && (
                <Button variant="outline" size="sm" disabled>
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade
                </Button>
              )}

              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                  disabled={actionLoading === "deactivate"}
                  onClick={() => handleAction("deactivate")}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Cancel
                </Button>
              )}
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={actionLoading === "email"}
            onClick={() => handleAction("email")}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Email
          </Button>

          <Button
            variant="default"
            size="sm"
            disabled={actionLoading === "impersonate"}
            onClick={() => handleAction("impersonate")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            {actionLoading === "impersonate"
              ? "Opening..."
              : "Impersonate"}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Profile + Subscription + Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Client Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Business</dt>
                <dd className="font-medium text-foreground text-right">
                  {client.businessName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-medium text-foreground">
                  {client.ownerName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </dt>
                <dd className="text-foreground">{client.email}</dd>
              </div>
              {client.phone && (
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </dt>
                  <dd className="text-foreground">{client.phone}</dd>
                </div>
              )}
              {(client.city || client.state) && (
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Location
                  </dt>
                  <dd className="text-foreground">
                    {[client.city, client.state].filter(Boolean).join(", ")}
                  </dd>
                </div>
              )}
              {client.vertical && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Vertical</dt>
                  <dd className="text-foreground capitalize">
                    {client.vertical}
                  </dd>
                </div>
              )}
              {client.website && (
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </dt>
                  <dd>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      {new URL(client.website).hostname}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.subscription ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd>
                    <Badge
                      variant={
                        client.subscription.bundleId === "empire"
                          ? "default"
                          : client.subscription.bundleId === "growth"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {bundle?.name || "Custom"}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Monthly Amount</dt>
                  <dd className="text-lg font-bold tabular-nums text-foreground">
                    {formatPrice(client.subscription.monthlyAmount / 100)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={statusVariant(subStatus)}>
                      {subStatus}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Billing Cycle</dt>
                  <dd className="text-foreground">Monthly</dd>
                </div>
                {nextPayment && (
                  <div className="flex justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Next Payment
                    </dt>
                    <dd className="text-foreground">
                      {nextPayment.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                )}
                {client.subscription.stripeSubId && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stripe Sub</dt>
                    <dd className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                      {client.subscription.stripeSubId}
                    </dd>
                  </div>
                )}
                {client.subscription.stripeCustId && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stripe Cust</dt>
                    <dd className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                      {client.subscription.stripeCustId}
                    </dd>
                  </div>
                )}
                {client.subscription.isTrial &&
                  client.subscription.trialEndsAt && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Trial Ends</dt>
                      <dd className="text-yellow-400 text-sm font-medium">
                        {new Date(
                          client.subscription.trialEndsAt
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  )}
              </dl>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No active subscription.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Leads
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {totalLeads}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Leads Won
                </span>
                <span className="text-xl font-bold tabular-nums text-emerald-400">
                  {wonLeads}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Conversion Rate
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {conversionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Services
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {client.services.filter((s) => s.status === "active").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Days Active
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {daysSinceSignup}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Activation Grid — All 16 services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Service Activation ({client.services.length} of{" "}
            {SERVICES.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((svc) => {
              const activated = serviceMap.get(svc.id);
              const status = activated?.status ?? "not_activated";
              const isActivated = !!activated;

              return (
                <div
                  key={svc.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                    isActivated
                      ? "border-white/[0.06] bg-white/[0.02]"
                      : "border-white/[0.03] bg-transparent opacity-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {svc.name}
                    </p>
                    {activated?.activatedAt && (
                      <p className="text-[11px] text-muted-foreground">
                        Since{" "}
                        {new Date(activated.activatedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 shrink-0">
                    {isActivated ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`}
                        />
                        <span className="text-xs capitalize text-muted-foreground">
                          {status}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        --
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline + Leads + Notes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Timeline */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet.
              </p>
            ) : (
              <div className="relative space-y-0">
                {client.activities.map((event, idx) => (
                  <div key={event.id} className="relative flex gap-3 pb-4">
                    {/* Vertical line */}
                    {idx < client.activities.length - 1 && (
                      <div className="absolute left-[11px] top-6 h-full w-px bg-white/[0.06]" />
                    )}
                    {/* Icon */}
                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-card">
                      {activityIcon(event.type)}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                        {formatRelativeTime(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Recent Leads ({totalLeads})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              <div className="space-y-2">
                {client.leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.source} &middot;{" "}
                        {new Date(lead.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                    <Badge variant={leadStatusVariant(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>
                ))}

                {/* Conversion summary */}
                <div className="mt-3 flex items-center gap-4 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Won
                    </p>
                    <p className="text-sm font-bold tabular-nums text-emerald-400">
                      {wonLeads}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Lost
                    </p>
                    <p className="text-sm font-bold tabular-nums text-red-400">
                      {client.leads.filter((l) => l.status === "lost").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Conv.
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {conversionRate}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              Internal Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesSaved(false);
              }}
              placeholder="Add internal notes about this client..."
              rows={8}
              className="w-full resize-none rounded-lg border border-white/[0.08] bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-2 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
              {notesSaved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
