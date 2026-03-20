"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  HeartHandshake,
  DollarSign,
  Users,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Bell,
  Megaphone,
  UserCheck,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-context";

// ─── Types ──────────────────────────────────────────────────

interface LTVOverview {
  totalCustomers: number;
  totalRevenue: number;
  avgRevenuePerCustomer: number;
  totalPredictedLTV: number;
  repeatRate: number;
  atRiskCustomers: number;
  segments: { active: number; at_risk: number; dormant: number; lost: number };
  segmentRevenue: { active: number; at_risk: number; dormant: number; lost: number };
  upcomingReminders: Reminder[];
  reminderStats: {
    total: number;
    pending: number;
    sent: number;
    booked: number;
    completed: number;
    totalRevenue: number;
  };
  campaignStats: {
    total: number;
    active: number;
    totalSent: number;
    totalBooked: number;
    totalRevenue: number;
  };
}

interface Reminder {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceType: string;
  lastServiceDate: string;
  nextDueDate: string;
  frequency: string;
  status: string;
  sentAt: string | null;
  bookedAt: string | null;
  revenue: number | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  vertical: string;
  season: string;
  triggerMonth: number;
  subject: string;
  body: string;
  discount: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  totalSent: number;
  totalBooked: number;
  totalRevenue: number;
  createdAt: string;
}

interface CustomerLTV {
  id: string;
  customerEmail: string;
  customerName: string;
  totalJobs: number;
  totalRevenue: number;
  avgJobValue: number;
  firstJobDate: string | null;
  lastJobDate: string | null;
  predictedLTV: number;
  churnRisk: string;
  segment: string;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatServiceType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  sent: "secondary",
  booked: "default",
  completed: "default",
  dismissed: "destructive",
};

const SEGMENT_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  at_risk: "bg-amber-500/10 text-amber-400",
  dormant: "bg-orange-500/10 text-orange-400",
  lost: "bg-red-500/10 text-red-400",
};

const CHURN_COLORS: Record<string, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

// ─── Component ──────────────────────────────────────────────

export function LTVDashboard() {
  const { toast } = useToast();
  const swrOpts = { refreshInterval: 60000, dedupingInterval: 10000, revalidateOnFocus: false } as const;

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useSWR<LTVOverview>(
    "/api/services/ltv/overview",
    fetcher,
    swrOpts
  );
  const {
    data: reminders,
    isLoading: remindersLoading,
    error: remindersError,
    mutate: mutateReminders,
  } = useSWR<Reminder[]>("/api/services/ltv/reminders", fetcher, swrOpts);
  const {
    data: campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
    mutate: mutateCampaigns,
  } = useSWR<Campaign[]>("/api/services/ltv/campaigns", fetcher, swrOpts);
  const { data: customers, isLoading: customersLoading, error: customersError } = useSWR<CustomerLTV[]>(
    "/api/services/ltv/customers",
    fetcher,
    swrOpts
  );

  // Reminder form state
  const [reminderName, setReminderName] = useState("");
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderPhone, setReminderPhone] = useState("");
  const [reminderService, setReminderService] = useState("");
  const [reminderLastDate, setReminderLastDate] = useState("");
  const [reminderFreq, setReminderFreq] = useState("annual");
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  // Campaign toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isLoading = overviewLoading || remindersLoading || campaignsLoading || customersLoading;

  async function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    setReminderError(null);

    if (!reminderName.trim() || !reminderService.trim() || !reminderLastDate) {
      setReminderError("Customer name, service type, and last service date are required.");
      return;
    }

    setReminderSubmitting(true);
    try {
      const res = await fetch("/api/services/ltv/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: reminderName.trim(),
          customerEmail: reminderEmail.trim() || undefined,
          customerPhone: reminderPhone.trim() || undefined,
          serviceType: reminderService.trim(),
          lastServiceDate: reminderLastDate,
          frequency: reminderFreq,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setReminderError(data.error || "Failed to create reminder.");
        return;
      }

      setReminderName("");
      setReminderEmail("");
      setReminderPhone("");
      setReminderService("");
      setReminderLastDate("");
      setReminderFreq("annual");
      mutateReminders();
    } catch {
      setReminderError("Something went wrong. Please try again.");
    } finally {
      setReminderSubmitting(false);
    }
  }

  async function handleToggleCampaign(campaignId: string, currentlyActive: boolean) {
    setTogglingId(campaignId);
    try {
      const res = await fetch("/api/services/ltv/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaignId, isActive: !currentlyActive }),
      });
      if (!res.ok) {
        toast("We couldn't update the campaign. Please try again.", "error");
        return;
      }
      mutateCampaigns();
    } catch {
      toast("We couldn't update the campaign. Please try again.", "error");
    } finally {
      setTogglingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Loading LTV data...</span>
      </div>
    );
  }

  if (overviewError || remindersError || campaignsError || customersError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
        Failed to load LTV data. Please try refreshing the page.
      </div>
    );
  }

  const ov = overview || {
    totalCustomers: 0,
    totalRevenue: 0,
    avgRevenuePerCustomer: 0,
    totalPredictedLTV: 0,
    repeatRate: 0,
    atRiskCustomers: 0,
    segments: { active: 0, at_risk: 0, dormant: 0, lost: 0 },
    segmentRevenue: { active: 0, at_risk: 0, dormant: 0, lost: 0 },
    upcomingReminders: [],
    reminderStats: { total: 0, pending: 0, sent: 0, booked: 0, completed: 0, totalRevenue: 0 },
    campaignStats: { total: 0, active: 0, totalSent: 0, totalBooked: 0, totalRevenue: 0 },
  };

  const reminderList = reminders || [];
  const campaignList = campaigns || [];
  const customerList = customers || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-emerald-400" />
          Customer LTV Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn one-time customers into lifetime revenue with AI-powered maintenance reminders and seasonal campaigns.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="campaigns">Seasonal Campaigns</TabsTrigger>
          <TabsTrigger value="customers">Customer Segments</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ──────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCents(ov.totalPredictedLTV)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Customer LTV</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCents(ov.avgRevenuePerCustomer)}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Revenue / Customer</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <RefreshCw className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{ov.repeatRate}%</p>
                    <p className="text-xs text-muted-foreground">Repeat Rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 pt-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{ov.atRiskCustomers}</p>
                    <p className="text-xs text-muted-foreground">At-Risk Customers</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Customer Segments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {(["active", "at_risk", "dormant", "lost"] as const).map((seg) => (
                    <div
                      key={seg}
                      className="rounded-lg border border-border/50 p-4 text-center"
                    >
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${SEGMENT_COLORS[seg]}`}>
                        {seg === "at_risk" ? "At Risk" : seg.charAt(0).toUpperCase() + seg.slice(1)}
                      </div>
                      <p className="mt-2 text-2xl font-bold tabular-nums">
                        {ov.segments[seg]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCents(ov.segmentRevenue[seg])} revenue
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Upcoming Reminders (Next 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ov.upcomingReminders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No upcoming reminders. Create service reminders to start re-engaging customers.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="Upcoming reminders">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Customer</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Service</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Due Date</th>
                          <th scope="col" className="pb-3 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ov.upcomingReminders.map((r) => (
                          <tr key={r.id} className="border-b border-border/50 last:border-0">
                            <td className="py-3 pr-4 font-medium">{r.customerName}</td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatServiceType(r.serviceType)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatDate(r.nextDueDate)}
                            </td>
                            <td className="py-3">
                              <Badge variant={STATUS_BADGE_VARIANT[r.status] || "outline"}>
                                {r.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Campaigns Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Seasonal Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{ov.campaignStats.active}</p>
                    <p className="text-xs text-muted-foreground">Active Campaigns</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{ov.campaignStats.totalSent}</p>
                    <p className="text-xs text-muted-foreground">Emails Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{ov.campaignStats.totalBooked}</p>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCents(ov.campaignStats.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">Campaign Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Reminders Tab ─────────────────────────────────── */}
        <TabsContent value="reminders">
          <div className="space-y-6">
            {/* Create Reminder Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Service Reminder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateReminder} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="reminderName"
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Customer Name *
                      </label>
                      <Input
                        id="reminderName"
                        placeholder="Jane Smith"
                        value={reminderName}
                        onChange={(e) => setReminderName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reminderEmail"
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Email
                      </label>
                      <Input
                        id="reminderEmail"
                        type="email"
                        placeholder="jane@example.com"
                        value={reminderEmail}
                        onChange={(e) => setReminderEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reminderPhone"
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Phone
                      </label>
                      <Input
                        id="reminderPhone"
                        placeholder="(555) 123-4567"
                        value={reminderPhone}
                        onChange={(e) => setReminderPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="reminderService"
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Service Type *
                      </label>
                      <Input
                        id="reminderService"
                        placeholder="hvac_tuneup"
                        value={reminderService}
                        onChange={(e) => setReminderService(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reminderLastDate"
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Last Service Date *
                      </label>
                      <Input
                        id="reminderLastDate"
                        type="date"
                        value={reminderLastDate}
                        onChange={(e) => setReminderLastDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reminderFreq"
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Frequency
                      </label>
                      <select
                        id="reminderFreq"
                        value={reminderFreq}
                        onChange={(e) => setReminderFreq(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="semi_annual">Semi-Annual</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>

                  {reminderError && (
                    <p className="text-sm text-destructive" role="alert">{reminderError}</p>
                  )}

                  <Button type="submit" disabled={reminderSubmitting}>
                    {reminderSubmitting ? "Creating..." : "Create Reminder"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reminder Stats */}
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-5">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">{ov.reminderStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">{ov.reminderStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">{ov.reminderStats.sent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">{ov.reminderStats.booked}</p>
                  <p className="text-xs text-muted-foreground">Booked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {formatCents(ov.reminderStats.totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Reminders Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  All Reminders ({reminderList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reminderList.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No reminders yet. Create your first service reminder above.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="All reminders">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Customer</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Service</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Last Service</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Next Due</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Frequency</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                          <th scope="col" className="pb-3 font-medium text-muted-foreground">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reminderList.map((r) => (
                          <tr key={r.id} className="border-b border-border/50 last:border-0">
                            <td className="py-3 pr-4">
                              <div className="font-medium">{r.customerName}</div>
                              {r.customerEmail && (
                                <div className="text-xs text-muted-foreground">{r.customerEmail}</div>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatServiceType(r.serviceType)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatDate(r.lastServiceDate)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatDate(r.nextDueDate)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground capitalize">
                              {r.frequency.replace("_", "-")}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={STATUS_BADGE_VARIANT[r.status] || "outline"}>
                                {r.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {r.revenue ? formatCents(r.revenue) : "--"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Seasonal Campaigns Tab ────────────────────────── */}
        <TabsContent value="campaigns">
          <div className="space-y-6">
            {campaignList.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No seasonal campaigns yet. Campaigns are automatically created when the LTV
                    Engine is activated based on your business vertical.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {campaignList.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {campaign.season}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Triggers: {MONTHS[campaign.triggerMonth - 1]}
                            </span>
                            {campaign.discount && (
                              <span className="text-xs font-medium text-emerald-400">
                                {campaign.discount}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleCampaign(campaign.id, campaign.isActive)}
                          disabled={togglingId === campaign.id}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          role="switch"
                          aria-checked={campaign.isActive}
                          aria-label={`${campaign.isActive ? "Deactivate" : "Activate"} ${campaign.name}`}
                        >
                          {campaign.isActive ? (
                            <ToggleRight className="h-6 w-6 text-emerald-400" aria-hidden="true" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" aria-hidden="true" />
                          )}
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                        {campaign.subject}
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">{campaign.totalSent}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">{campaign.totalBooked}</p>
                          <p className="text-xs text-muted-foreground">Booked</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">
                            {formatCents(campaign.totalRevenue)}
                          </p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                      </div>

                      {campaign.lastRunAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Last run: {formatDate(campaign.lastRunAt)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Customer Segments Tab ─────────────────────────── */}
        <TabsContent value="customers">
          <div className="space-y-6">
            {/* Segment summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(["active", "at_risk", "dormant", "lost"] as const).map((seg) => {
                const count = customerList.filter((c) => c.segment === seg).length;
                return (
                  <Card key={seg}>
                    <CardContent className="py-4 text-center">
                      <div
                        className={`mx-auto inline-flex rounded-full px-3 py-1 text-xs font-medium ${SEGMENT_COLORS[seg]}`}
                      >
                        {seg === "at_risk" ? "At Risk" : seg.charAt(0).toUpperCase() + seg.slice(1)}
                      </div>
                      <p className="mt-2 text-2xl font-bold tabular-nums">{count}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Customer Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customers ({customerList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customerList.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No customer LTV data yet. Customer profiles are built automatically
                    from completed jobs and invoices.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="Customer segments">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Customer</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Jobs</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Total Revenue</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Predicted LTV</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Last Job</th>
                          <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Churn Risk</th>
                          <th scope="col" className="pb-3 font-medium text-muted-foreground">Segment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerList.map((c) => (
                          <tr key={c.id} className="border-b border-border/50 last:border-0">
                            <td className="py-3 pr-4">
                              <div className="font-medium">{c.customerName}</div>
                              <div className="text-xs text-muted-foreground">{c.customerEmail}</div>
                            </td>
                            <td className="py-3 pr-4 tabular-nums">{c.totalJobs}</td>
                            <td className="py-3 pr-4 tabular-nums">
                              {formatCents(c.totalRevenue)}
                            </td>
                            <td className="py-3 pr-4 tabular-nums">
                              {formatCents(c.predictedLTV)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatDate(c.lastJobDate)}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`font-medium capitalize ${CHURN_COLORS[c.churnRisk] || ""}`}>
                                {c.churnRisk}
                              </span>
                            </td>
                            <td className="py-3">
                              <div
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SEGMENT_COLORS[c.segment] || ""}`}
                              >
                                {c.segment === "at_risk"
                                  ? "At Risk"
                                  : c.segment.charAt(0).toUpperCase() + c.segment.slice(1)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
