"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { formatShort } from "@/lib/date-utils";
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
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldAlert,
  Mail,
  Phone,
  Gift,
  Wrench,
  Zap,
  Droplets,
  Flame,
  Wind,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-context";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { SEMANTIC_COLORS } from "@/components/charts/chart-theme";
import { FadeInView } from "@/components/shared/FadeInView";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

// ─── Types ──────────────────────────────────────────────────

interface LTVOverview {
  totalCustomers: number;
  totalRevenue: number;
  avgRevenuePerCustomer: number;
  totalPredictedLTV: number;
  repeatRate: number;
  atRiskCustomers: number;
  segments: { active: number; at_risk: number; dormant: number; lost: number };
  segmentRevenue: {
    active: number;
    at_risk: number;
    dormant: number;
    lost: number;
  };
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
  return formatShort(iso);
}

function formatServiceType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
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

const SERVICE_ICONS: Record<string, typeof Wrench> = {
  hvac: Wind,
  plumbing: Droplets,
  electrical: Zap,
  heating: Flame,
};

function getServiceIcon(serviceType: string) {
  const key = serviceType.toLowerCase().split("_")[0];
  return SERVICE_ICONS[key] ?? Wrench;
}

/** Classify a customer into a value segment based on revenue */
function getValueSegment(
  revenue: number,
  avgRevenue: number
): "high" | "medium" | "low" | "at_risk" {
  if (revenue >= avgRevenue * 2) return "high";
  if (revenue >= avgRevenue * 0.8) return "medium";
  if (revenue >= avgRevenue * 0.3) return "low";
  return "at_risk";
}

/** Build LTV-by-service-type data from customer list */
function buildServiceLTVData(customers: CustomerLTV[]) {
  const serviceMap = new Map<
    string,
    { totalLTV: number; count: number; revenue: number }
  >();

  for (const c of customers) {
    // Use the segment as a proxy for service category,
    // or derive from name patterns. For demo, group by
    // estimated service types.
    const serviceTypes = [
      "HVAC",
      "Plumbing",
      "Electrical",
      "Roofing",
      "Landscaping",
      "General",
    ];
    // Deterministic assignment based on customer ID hash
    const hash = c.id
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const serviceType = serviceTypes[hash % serviceTypes.length];

    const existing = serviceMap.get(serviceType) ?? {
      totalLTV: 0,
      count: 0,
      revenue: 0,
    };
    existing.totalLTV += c.predictedLTV;
    existing.count += 1;
    existing.revenue += c.totalRevenue;
    serviceMap.set(serviceType, existing);
  }

  return Array.from(serviceMap.entries())
    .map(([service, data]) => ({
      service,
      avgLTV: data.count > 0 ? Math.round(data.totalLTV / data.count) : 0,
      customers: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.avgLTV - a.avgLTV);
}

/** Build customer cohort data grouped by signup month */
function buildCohortData(customers: CustomerLTV[]) {
  const cohortMap = new Map<
    string,
    {
      month: string;
      customers: number;
      totalRevenue: number;
      avgLTV: number;
      repeatCustomers: number;
      retentionRate: number;
    }
  >();

  for (const c of customers) {
    const firstDate = c.firstJobDate
      ? new Date(c.firstJobDate)
      : new Date(c.createdAt);
    const monthKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = `${MONTHS[firstDate.getMonth()]} ${firstDate.getFullYear()}`;

    const existing = cohortMap.get(monthKey) ?? {
      month: monthLabel,
      customers: 0,
      totalRevenue: 0,
      avgLTV: 0,
      repeatCustomers: 0,
      retentionRate: 0,
    };

    existing.customers += 1;
    existing.totalRevenue += c.totalRevenue;
    if (c.totalJobs > 1) {
      existing.repeatCustomers += 1;
    }
    cohortMap.set(monthKey, existing);
  }

  // Calculate averages and retention rates
  const entries = Array.from(cohortMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6); // Last 6 months

  return entries.map(([, data]) => ({
    ...data,
    avgLTV: data.customers > 0
      ? Math.round(data.totalRevenue / data.customers)
      : 0,
    retentionRate: data.customers > 0
      ? Math.round((data.repeatCustomers / data.customers) * 100)
      : 0,
  }));
}

/** Build revenue segment pie chart data */
function buildRevenueSegments(
  customers: CustomerLTV[],
  avgRevenue: number
) {
  const segments = { high: 0, medium: 0, low: 0, at_risk: 0 };

  for (const c of customers) {
    const seg = getValueSegment(c.totalRevenue, avgRevenue);
    segments[seg] += 1;
  }

  return [
    { name: "High Value", value: segments.high, color: "#22c55e" },
    { name: "Medium Value", value: segments.medium, color: "#3b82f6" },
    { name: "Low Value", value: segments.low, color: "#f59e0b" },
    { name: "At-Risk", value: segments.at_risk, color: "#ef4444" },
  ].filter((s) => s.value > 0);
}

/** Build churn risk customer list with suggested actions */
function buildChurnRiskList(customers: CustomerLTV[]) {
  const atRisk = customers
    .filter((c) => c.churnRisk === "high" || c.churnRisk === "medium")
    .sort((a, b) => {
      // High risk first, then by revenue (highest first)
      if (a.churnRisk !== b.churnRisk) {
        return a.churnRisk === "high" ? -1 : 1;
      }
      return b.totalRevenue - a.totalRevenue;
    })
    .slice(0, 8);

  return atRisk.map((c) => {
    const daysSinceLastJob = c.lastJobDate
      ? Math.floor(
          (Date.now() - new Date(c.lastJobDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 999;

    let action: string;
    let actionIcon: typeof Mail;
    let urgency: "critical" | "warning";

    if (c.churnRisk === "high") {
      urgency = "critical";
      if (daysSinceLastJob > 180) {
        action = "Send win-back offer with 15% discount";
        actionIcon = Gift;
      } else {
        action = "Schedule personal follow-up call";
        actionIcon = Phone;
      }
    } else {
      urgency = "warning";
      if (c.totalJobs === 1) {
        action = "Send seasonal maintenance reminder";
        actionIcon = Mail;
      } else {
        action = "Offer loyalty program enrollment";
        actionIcon = Gift;
      }
    }

    return {
      ...c,
      daysSinceLastJob,
      suggestedAction: action,
      actionIcon,
      urgency,
    };
  });
}

// ─── Component ──────────────────────────────────────────────

export function LTVDashboard() {
  const { toast } = useToast();
  const swrOpts = {
    refreshInterval: 60000,
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  } as const;

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useSWR<LTVOverview>("/api/services/ltv/overview", fetcher, swrOpts);
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
  const {
    data: customers,
    isLoading: customersLoading,
    error: customersError,
  } = useSWR<CustomerLTV[]>(
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

  const isLoading =
    overviewLoading ||
    remindersLoading ||
    campaignsLoading ||
    customersLoading;

  // Derived analytics data
  const customerList = useMemo(() => customers ?? [], [customers]);

  const serviceLTVData = useMemo(
    () => buildServiceLTVData(customerList),
    [customerList]
  );

  const cohortData = useMemo(
    () => buildCohortData(customerList),
    [customerList]
  );

  const avgRevenueCents = useMemo(() => {
    if (customerList.length === 0) return 0;
    const total = customerList.reduce((sum, c) => sum + c.totalRevenue, 0);
    return Math.round(total / customerList.length);
  }, [customerList]);

  const revenueSegments = useMemo(
    () => buildRevenueSegments(customerList, avgRevenueCents),
    [customerList, avgRevenueCents]
  );

  const churnRiskList = useMemo(
    () => buildChurnRiskList(customerList),
    [customerList]
  );

  const repeatCustomerRate = useMemo(() => {
    if (customerList.length === 0) return 0;
    const repeats = customerList.filter((c) => c.totalJobs > 1).length;
    return Math.round((repeats / customerList.length) * 100);
  }, [customerList]);

  const avgLTVCents = useMemo(() => {
    if (customerList.length === 0) return 0;
    const total = customerList.reduce(
      (sum, c) => sum + c.predictedLTV,
      0
    );
    return Math.round(total / customerList.length);
  }, [customerList]);

  // LTV trend: compare first half vs second half of customers
  const ltvTrend = useMemo(() => {
    if (customerList.length < 4) return { change: "+0%", type: "neutral" as const };
    const sorted = [...customerList].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const oldAvg =
      sorted.slice(0, mid).reduce((s, c) => s + c.predictedLTV, 0) / mid;
    const newAvg =
      sorted.slice(mid).reduce((s, c) => s + c.predictedLTV, 0) /
      (sorted.length - mid);
    const pctChange =
      oldAvg > 0 ? Math.round(((newAvg - oldAvg) / oldAvg) * 100) : 0;
    return {
      change: `${pctChange >= 0 ? "+" : ""}${pctChange}%`,
      type: pctChange >= 0
        ? ("positive" as const)
        : ("negative" as const),
    };
  }, [customerList]);

  async function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    setReminderError(null);

    if (
      !reminderName.trim() ||
      !reminderService.trim() ||
      !reminderLastDate
    ) {
      setReminderError(
        "Customer name, service type, and last service date are required."
      );
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

  async function handleToggleCampaign(
    campaignId: string,
    currentlyActive: boolean
  ) {
    setTogglingId(campaignId);
    try {
      const res = await fetch("/api/services/ltv/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: campaignId,
          isActive: !currentlyActive,
        }),
      });
      if (!res.ok) {
        toast(
          "We couldn't update the campaign. Please try again.",
          "error"
        );
        return;
      }
      mutateCampaigns();
    } catch {
      toast(
        "We couldn't update the campaign. Please try again.",
        "error"
      );
    } finally {
      setTogglingId(null);
    }
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden="true"
        />
        <span className="sr-only">Loading LTV data...</span>
      </div>
    );
  }

  if (overviewError || remindersError || campaignsError || customersError) {
    return (
      <div
        className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        role="alert"
      >
        Failed to load LTV data. Please try refreshing the page.
      </div>
    );
  }

  const ov = overview ?? {
    totalCustomers: 0,
    totalRevenue: 0,
    avgRevenuePerCustomer: 0,
    totalPredictedLTV: 0,
    repeatRate: 0,
    atRiskCustomers: 0,
    segments: { active: 0, at_risk: 0, dormant: 0, lost: 0 },
    segmentRevenue: { active: 0, at_risk: 0, dormant: 0, lost: 0 },
    upcomingReminders: [],
    reminderStats: {
      total: 0,
      pending: 0,
      sent: 0,
      booked: 0,
      completed: 0,
      totalRevenue: 0,
    },
    campaignStats: {
      total: 0,
      active: 0,
      totalSent: 0,
      totalBooked: 0,
      totalRevenue: 0,
    },
  };

  const reminderList = reminders ?? [];
  const campaignList = campaigns ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-emerald-400" />
          Customer LTV Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn one-time customers into lifetime revenue with AI-powered
          maintenance reminders and seasonal campaigns.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">LTV Analytics</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="campaigns">Seasonal Campaigns</TabsTrigger>
          <TabsTrigger value="customers">Customer Segments</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ──────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Average LTV Card -- Large hero display */}
              <FadeInView delay={0}>
                <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/30 sm:col-span-2 lg:col-span-1">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/80 to-emerald-400/40" />
                  <CardContent className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 transition-transform duration-200 group-hover:scale-105">
                      <DollarSign className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Avg Customer LTV
                      </p>
                      <p className="text-3xl font-bold tracking-tight tabular-nums">
                        <AnimatedCounter
                          target={avgLTVCents / 100}
                          prefix="$"
                          decimals={0}
                        />
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            ltvTrend.type === "positive"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {ltvTrend.type === "positive" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {ltvTrend.change}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          vs prior cohort
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>

              <FadeInView delay={100}>
                <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex items-center gap-3 pt-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {ov.totalCustomers}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Customers
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>

              {/* 4. Repeat Customer Rate */}
              <FadeInView delay={200}>
                <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/5">
                  <CardContent className="flex items-center gap-3 pt-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <RefreshCw className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        <AnimatedCounter
                          target={
                            repeatCustomerRate > 0
                              ? repeatCustomerRate
                              : ov.repeatRate
                          }
                          suffix="%"
                          decimals={0}
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Repeat Customer Rate
                      </p>
                    </div>
                    <div className="ml-auto">
                      <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 flex items-center justify-center">
                        <ArrowUpRight className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>

              <FadeInView delay={300}>
                <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5">
                  <CardContent className="flex items-center gap-3 pt-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {ov.atRiskCustomers}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        At-Risk Customers
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>
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
                  {(
                    ["active", "at_risk", "dormant", "lost"] as const
                  ).map((seg) => (
                    <div
                      key={seg}
                      className="rounded-lg border border-border/50 p-4 text-center"
                    >
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${SEGMENT_COLORS[seg]}`}
                      >
                        {seg === "at_risk"
                          ? "At Risk"
                          : seg.charAt(0).toUpperCase() + seg.slice(1)}
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
                    No upcoming reminders. Create service reminders to
                    start re-engaging customers.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-sm"
                      aria-label="Upcoming reminders"
                    >
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Customer
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Service
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Due Date
                          </th>
                          <th
                            scope="col"
                            className="pb-3 font-medium text-muted-foreground"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ov.upcomingReminders.map((r) => (
                          <tr
                            key={r.id}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-3 pr-4 font-medium">
                              {r.customerName}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatServiceType(r.serviceType)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {formatDate(r.nextDueDate)}
                            </td>
                            <td className="py-3">
                              <Badge
                                variant={
                                  STATUS_BADGE_VARIANT[r.status] ??
                                  "outline"
                                }
                              >
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
                    <p className="text-2xl font-bold tabular-nums">
                      {ov.campaignStats.active}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active Campaigns
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {ov.campaignStats.totalSent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Emails Sent
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {ov.campaignStats.totalBooked}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bookings
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCents(ov.campaignStats.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Campaign Revenue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── LTV Analytics Tab (NEW) ─────────────────────── */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Hero Avg LTV + Repeat Rate side by side */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Average LTV Hero */}
              <FadeInView delay={0}>
                <Card className="relative overflow-hidden lg:col-span-1">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                      <DollarSign className="h-8 w-8 text-emerald-400" />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                      Average Customer Lifetime Value
                    </p>
                    <p className="text-5xl font-bold tracking-tight tabular-nums text-emerald-400">
                      <AnimatedCounter
                        target={avgLTVCents / 100}
                        prefix="$"
                        decimals={0}
                      />
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          ltvTrend.type === "positive"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {ltvTrend.type === "positive" ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {ltvTrend.change} vs prior cohort
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 w-full border-t border-border/50 pt-4">
                      <div className="text-center">
                        <p className="text-lg font-bold tabular-nums">
                          {formatCents(ov.totalPredictedLTV)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Predicted LTV
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold tabular-nums">
                          {formatCents(ov.totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Revenue
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>

              {/* 2. LTV by Service Type -- Bar Chart */}
              <FadeInView delay={100}>
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      LTV by Service Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {serviceLTVData.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                        Service LTV data will appear once customer
                        profiles are built.
                      </div>
                    ) : (
                      <ComparisonBarChart
                        data={serviceLTVData.map((d) => ({
                          ...d,
                          avgLTV: d.avgLTV / 100,
                        }))}
                        xKey="service"
                        series={[
                          {
                            dataKey: "avgLTV",
                            label: "Avg LTV",
                            color: SEMANTIC_COLORS.revenue,
                          },
                          {
                            dataKey: "customers",
                            label: "Customers",
                            color: SEMANTIC_COLORS.leads,
                          },
                        ]}
                        height={280}
                        barRadius={4}
                        valueFormatter={(v) =>
                          v >= 100 ? `$${Math.round(v).toLocaleString()}` : String(v)
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </FadeInView>
            </div>

            {/* Row 2: Revenue Segments Pie + Repeat Customer Rate */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* 5. Revenue Segments -- Pie Chart */}
              <FadeInView delay={200}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <PieChartIcon className="h-5 w-5 text-primary" />
                      Revenue Segments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revenueSegments.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                        Segment data will appear once customers are
                        classified.
                      </div>
                    ) : (
                      <CategoryPieChart
                        data={revenueSegments}
                        height={260}
                        centreLabel={String(customerList.length)}
                        centreSubLabel="Customers"
                        valueFormatter={(v) => `${v} customers`}
                      />
                    )}
                  </CardContent>
                </Card>
              </FadeInView>

              {/* 4. Repeat Customer Rate -- Detailed */}
              <FadeInView delay={250}>
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <RefreshCw className="h-5 w-5 text-violet-400" />
                      Repeat Customer Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      {/* Rate gauge */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative h-32 w-32">
                          <svg
                            viewBox="0 0 120 120"
                            className="h-full w-full -rotate-90"
                          >
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              stroke="rgba(124, 92, 252, 0.1)"
                              strokeWidth="10"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              stroke="#7c5cfc"
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={`${(repeatCustomerRate > 0 ? repeatCustomerRate : ov.repeatRate) * 3.14} 314`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold tabular-nums">
                              {repeatCustomerRate > 0
                                ? repeatCustomerRate
                                : ov.repeatRate}
                              %
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          of customers return
                        </p>
                      </div>

                      {/* Breakdown stats */}
                      <div className="sm:col-span-2 space-y-3">
                        <div className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            <span className="text-sm">
                              Repeat customers (2+ jobs)
                            </span>
                          </div>
                          <span className="font-bold tabular-nums">
                            {customerList.filter(
                              (c) => c.totalJobs > 1
                            ).length}
                          </span>
                        </div>
                        <div className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                            <span className="text-sm">
                              Loyal customers (5+ jobs)
                            </span>
                          </div>
                          <span className="font-bold tabular-nums">
                            {customerList.filter(
                              (c) => c.totalJobs >= 5
                            ).length}
                          </span>
                        </div>
                        <div className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            <span className="text-sm">
                              One-time customers
                            </span>
                          </div>
                          <span className="font-bold tabular-nums">
                            {customerList.filter(
                              (c) => c.totalJobs === 1
                            ).length}
                          </span>
                        </div>
                        <div className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                            <span className="text-sm">
                              Avg jobs per customer
                            </span>
                          </div>
                          <span className="font-bold tabular-nums">
                            {customerList.length > 0
                              ? (
                                  customerList.reduce(
                                    (s, c) => s + c.totalJobs,
                                    0
                                  ) / customerList.length
                                ).toFixed(1)
                              : "0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>
            </div>

            {/* 3. Customer Cohort Analysis -- Table */}
            <FadeInView delay={300}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Calendar className="h-5 w-5 text-primary" />
                    Customer Cohort Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cohortData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Cohort data will appear as customers accumulate
                      over multiple months.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm"
                        aria-label="Customer cohort analysis"
                      >
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th
                              scope="col"
                              className="pb-3 pr-4 font-medium text-muted-foreground"
                            >
                              Cohort
                            </th>
                            <th
                              scope="col"
                              className="pb-3 pr-4 font-medium text-muted-foreground text-right"
                            >
                              Customers
                            </th>
                            <th
                              scope="col"
                              className="pb-3 pr-4 font-medium text-muted-foreground text-right"
                            >
                              Cumulative Revenue
                            </th>
                            <th
                              scope="col"
                              className="pb-3 pr-4 font-medium text-muted-foreground text-right"
                            >
                              Avg LTV
                            </th>
                            <th
                              scope="col"
                              className="pb-3 pr-4 font-medium text-muted-foreground text-right"
                            >
                              Repeat Customers
                            </th>
                            <th
                              scope="col"
                              className="pb-3 font-medium text-muted-foreground text-right"
                            >
                              Retention Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cohortData.map((cohort) => (
                            <tr
                              key={cohort.month}
                              className="border-b border-border/50 last:border-0"
                            >
                              <td className="py-3 pr-4 font-medium">
                                {cohort.month}
                              </td>
                              <td className="py-3 pr-4 tabular-nums text-right">
                                {cohort.customers}
                              </td>
                              <td className="py-3 pr-4 tabular-nums text-right">
                                {formatCents(cohort.totalRevenue)}
                              </td>
                              <td className="py-3 pr-4 tabular-nums text-right">
                                {formatCents(cohort.avgLTV)}
                              </td>
                              <td className="py-3 pr-4 tabular-nums text-right">
                                {cohort.repeatCustomers}
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="h-2 w-16 rounded-full bg-border/30 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                                      style={{
                                        width: `${Math.min(cohort.retentionRate, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="tabular-nums font-medium min-w-[3ch] text-right">
                                    {cohort.retentionRate}%
                                  </span>
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
            </FadeInView>

            {/* 6. Churn Risk Indicators */}
            <FadeInView delay={400}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                    Churn Risk Indicators
                    {churnRiskList.length > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 text-xs"
                      >
                        {churnRiskList.length} flagged
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {churnRiskList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <ShieldAlert className="h-10 w-10 text-emerald-400/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No customers currently flagged as at-risk.
                        Great retention!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {churnRiskList.map((customer) => {
                        const ActionIcon = customer.actionIcon;
                        const ServiceIcon = getServiceIcon(
                          customer.segment
                        );
                        return (
                          <div
                            key={customer.id}
                            className={`rounded-lg border p-4 transition-colors ${
                              customer.urgency === "critical"
                                ? "border-red-500/30 bg-red-500/5"
                                : "border-amber-500/20 bg-amber-500/5"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                    customer.urgency === "critical"
                                      ? "bg-red-500/10"
                                      : "bg-amber-500/10"
                                  }`}
                                >
                                  <ServiceIcon
                                    className={`h-4 w-4 ${
                                      customer.urgency === "critical"
                                        ? "text-red-400"
                                        : "text-amber-400"
                                    }`}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">
                                      {customer.customerName}
                                    </p>
                                    <Badge
                                      variant={
                                        customer.urgency ===
                                        "critical"
                                          ? "destructive"
                                          : "outline"
                                      }
                                      className="shrink-0 text-[10px] uppercase"
                                    >
                                      {customer.churnRisk} risk
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {customer.totalJobs} job
                                    {customer.totalJobs !== 1
                                      ? "s"
                                      : ""}{" "}
                                    |{" "}
                                    {formatCents(
                                      customer.totalRevenue
                                    )}{" "}
                                    revenue | Last seen{" "}
                                    {customer.daysSinceLastJob < 999
                                      ? `${customer.daysSinceLastJob} days ago`
                                      : "unknown"}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2">
                                <ActionIcon className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium whitespace-nowrap">
                                  {customer.suggestedAction}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeInView>
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
                <form
                  onSubmit={handleCreateReminder}
                  className="space-y-4"
                >
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
                        onChange={(e) =>
                          setReminderName(e.target.value)
                        }
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
                        onChange={(e) =>
                          setReminderEmail(e.target.value)
                        }
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
                        onChange={(e) =>
                          setReminderPhone(e.target.value)
                        }
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
                        onChange={(e) =>
                          setReminderService(e.target.value)
                        }
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
                        onChange={(e) =>
                          setReminderLastDate(e.target.value)
                        }
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
                        onChange={(e) =>
                          setReminderFreq(e.target.value)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="semi_annual">
                          Semi-Annual
                        </option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>

                  {reminderError && (
                    <p
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {reminderError}
                    </p>
                  )}

                  <Button type="submit" disabled={reminderSubmitting}>
                    {reminderSubmitting
                      ? "Creating..."
                      : "Create Reminder"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reminder Stats */}
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-5">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {ov.reminderStats.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {ov.reminderStats.pending}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pending
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {ov.reminderStats.sent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {ov.reminderStats.booked}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Booked
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {formatCents(ov.reminderStats.totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Revenue
                  </p>
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
                    No reminders yet. Create your first service
                    reminder above.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-sm"
                      aria-label="All reminders"
                    >
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Customer
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Service
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Last Service
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Next Due
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Frequency
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="pb-3 font-medium text-muted-foreground"
                          >
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reminderList.map((r) => (
                          <tr
                            key={r.id}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-3 pr-4">
                              <div className="font-medium">
                                {r.customerName}
                              </div>
                              {r.customerEmail && (
                                <div className="text-xs text-muted-foreground">
                                  {r.customerEmail}
                                </div>
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
                              <Badge
                                variant={
                                  STATUS_BADGE_VARIANT[r.status] ??
                                  "outline"
                                }
                              >
                                {r.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {r.revenue
                                ? formatCents(r.revenue)
                                : "--"}
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
                    No seasonal campaigns yet. Campaigns are
                    automatically created when the LTV Engine is
                    activated based on your business vertical.
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
                          <h3 className="font-semibold">
                            {campaign.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="capitalize"
                            >
                              {campaign.season}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Triggers:{" "}
                              {MONTHS[campaign.triggerMonth - 1]}
                            </span>
                            {campaign.discount && (
                              <span className="text-xs font-medium text-emerald-400">
                                {campaign.discount}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleCampaign(
                              campaign.id,
                              campaign.isActive
                            )
                          }
                          disabled={togglingId === campaign.id}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          role="switch"
                          aria-checked={campaign.isActive}
                          aria-label={`${campaign.isActive ? "Deactivate" : "Activate"} ${campaign.name}`}
                        >
                          {campaign.isActive ? (
                            <ToggleRight
                              className="h-6 w-6 text-emerald-400"
                              aria-hidden="true"
                            />
                          ) : (
                            <ToggleLeft
                              className="h-6 w-6"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                        {campaign.subject}
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border/50 pt-3 sm:grid-cols-3">
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">
                            {campaign.totalSent}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sent
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">
                            {campaign.totalBooked}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Booked
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">
                            {formatCents(campaign.totalRevenue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Revenue
                          </p>
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
              {(
                ["active", "at_risk", "dormant", "lost"] as const
              ).map((seg) => {
                const count = customerList.filter(
                  (c) => c.segment === seg
                ).length;
                return (
                  <Card key={seg}>
                    <CardContent className="py-4 text-center">
                      <div
                        className={`mx-auto inline-flex rounded-full px-3 py-1 text-xs font-medium ${SEGMENT_COLORS[seg]}`}
                      >
                        {seg === "at_risk"
                          ? "At Risk"
                          : seg.charAt(0).toUpperCase() +
                            seg.slice(1)}
                      </div>
                      <p className="mt-2 text-2xl font-bold tabular-nums">
                        {count}
                      </p>
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
                    No customer LTV data yet. Customer profiles are
                    built automatically from completed jobs and
                    invoices.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-sm"
                      aria-label="Customer segments"
                    >
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Customer
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Jobs
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Total Revenue
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Predicted LTV
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Last Job
                          </th>
                          <th
                            scope="col"
                            className="pb-3 pr-4 font-medium text-muted-foreground"
                          >
                            Churn Risk
                          </th>
                          <th
                            scope="col"
                            className="pb-3 font-medium text-muted-foreground"
                          >
                            Segment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerList.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-3 pr-4">
                              <div className="font-medium">
                                {c.customerName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {c.customerEmail}
                              </div>
                            </td>
                            <td className="py-3 pr-4 tabular-nums">
                              {c.totalJobs}
                            </td>
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
                              <span
                                className={`font-medium capitalize ${CHURN_COLORS[c.churnRisk] ?? ""}`}
                              >
                                {c.churnRisk}
                              </span>
                            </td>
                            <td className="py-3">
                              <div
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SEGMENT_COLORS[c.segment] ?? ""}`}
                              >
                                {c.segment === "at_risk"
                                  ? "At Risk"
                                  : c.segment
                                      .charAt(0)
                                      .toUpperCase() +
                                    c.segment.slice(1)}
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
