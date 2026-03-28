"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import {
  Building2,
  TrendingUp,
  Users,
  Star,
  Award,
  Plus,
  MapPin,
  CheckCircle,
  XCircle,
  BarChart3,
  Shield,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Minus,
  Clock,
  MessageSquare,
  Image,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { SEMANTIC_COLORS } from "@/components/charts/chart-theme";
import { FadeInView } from "@/components/shared/FadeInView";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FranchiseLocation {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  manager: string | null;
  isActive: boolean;
  leadsThisMonth: number;
  revenueThisMonth: number;
  bookingsThisMonth: number;
  avgRating: number;
  createdAt: string;
}

interface FranchiseData {
  kpis: {
    totalLocations: number;
    combinedRevenue: number;
    totalLeads: number;
    avgRating: number;
  };
  locations: FranchiseLocation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to load data");
    return res.json();
  });

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function _formatCompactCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Derive a conversion rate from leads and bookings. */
function conversionRate(leads: number, bookings: number): number {
  if (leads === 0) return 0;
  return (bookings / leads) * 100;
}

/** Simulate a rank change for demo purposes based on location data. */
function getRankChange(loc: FranchiseLocation, _idx: number): number {
  // Deterministic pseudo-random based on id hash
  const hash = loc.id
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const options = [-2, -1, 0, 0, 1, 1, 2, 3];
  return options[hash % options.length];
}

/** Simulate brand compliance scores for each location. */
function getComplianceScores(loc: FranchiseLocation) {
  const hash = loc.id
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const logoScore = 70 + (hash % 31);
  const messagingScore = 60 + ((hash * 3) % 41);
  const responseTimeScore = 55 + ((hash * 7) % 46);
  const overall = Math.round(
    (logoScore + messagingScore + responseTimeScore) / 3
  );
  return { logoScore, messagingScore, responseTimeScore, overall };
}

/** Generate system-wide alerts from location data. */
function generateAlerts(locations: FranchiseLocation[]) {
  const alerts: {
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
    location: string;
  }[] = [];

  for (const loc of locations) {
    if (!loc.isActive) {
      alerts.push({
        id: `inactive-${loc.id}`,
        severity: "critical",
        title: "Location Inactive",
        description: `${loc.name} is currently inactive and not generating revenue.`,
        location: loc.name,
      });
    }
    if (loc.avgRating < 3.5 && loc.avgRating > 0) {
      alerts.push({
        id: `rating-${loc.id}`,
        severity: "warning",
        title: "Low Customer Rating",
        description: `${loc.name} has a ${formatRating(loc.avgRating)}/5 rating, below the 3.5 threshold.`,
        location: loc.name,
      });
    }
    if (loc.leadsThisMonth === 0 && loc.isActive) {
      alerts.push({
        id: `noleads-${loc.id}`,
        severity: "warning",
        title: "No Leads This Month",
        description: `${loc.name} has not received any leads this month.`,
        location: loc.name,
      });
    }
    const compliance = getComplianceScores(loc);
    if (compliance.overall < 75) {
      alerts.push({
        id: `compliance-${loc.id}`,
        severity: "info",
        title: "Brand Compliance Below Target",
        description: `${loc.name} compliance score is ${compliance.overall}%, below the 75% target.`,
        location: loc.name,
      });
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RankChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
        <ChevronUp className="h-3 w-3" />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-400">
        <ChevronDown className="h-3 w-3" />
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  );
}

function ComplianceBar({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const color =
    score >= 90
      ? "bg-emerald-500"
      : score >= 75
        ? "bg-blue-500"
        : score >= 60
          ? "bg-yellow-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium">{score}%</span>
    </div>
  );
}

function AlertBadge({
  severity,
}: {
  severity: "critical" | "warning" | "info";
}) {
  const styles = {
    critical: "bg-red-500/15 text-red-400",
    warning: "bg-yellow-500/15 text-yellow-400",
    info: "bg-blue-500/15 text-blue-400",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[severity]
      )}
    >
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FranchiseDashboard() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useSWR<FranchiseData>(
    "/api/dashboard/franchise",
    fetcher,
    {
      refreshInterval: 60000,
      dedupingInterval: 10000,
      revalidateOnFocus: false,
    }
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formZip, setFormZip] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formManager, setFormManager] = useState("");

  const handleAddLocation = useCallback(async () => {
    if (!formName.trim() || !formCity.trim() || !formState.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/franchise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          address: formAddress.trim() || null,
          zip: formZip.trim() || null,
          phone: formPhone.trim() || null,
          manager: formManager.trim() || null,
        }),
      });
      if (!res.ok) {
        toast(
          "We couldn't add the location. Please check your details and try again.",
          "error"
        );
        return;
      }
      setShowAddForm(false);
      setFormName("");
      setFormCity("");
      setFormState("");
      setFormAddress("");
      setFormZip("");
      setFormPhone("");
      setFormManager("");
      await mutate();
      toast("Franchise location added", "success");
    } finally {
      setCreating(false);
    }
  }, [
    formName,
    formCity,
    formState,
    formAddress,
    formZip,
    formPhone,
    formManager,
    mutate,
    toast,
  ]);

  const kpis = data?.kpis ?? {
    totalLocations: 0,
    combinedRevenue: 0,
    totalLeads: 0,
    avgRating: 0,
  };
  const locations = useMemo(() => data?.locations ?? [], [data?.locations]);

  // Sorted locations by revenue (used throughout)
  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => b.revenueThisMonth - a.revenueThisMonth),
    [locations]
  );

  // Active vs inactive counts
  const activeCount = useMemo(
    () => locations.filter((l) => l.isActive).length,
    [locations]
  );
  const inactiveCount = locations.length - activeCount;

  // Find top performer
  const topPerformer = useMemo(
    () =>
      locations.length > 0
        ? locations.reduce((top, loc) =>
            loc.revenueThisMonth > top.revenueThisMonth ? loc : top
          )
        : null,
    [locations]
  );

  // Max values for performance bars
  const maxRevenue = useMemo(
    () => Math.max(...locations.map((l) => l.revenueThisMonth), 1),
    [locations]
  );
  const maxLeads = useMemo(
    () => Math.max(...locations.map((l) => l.leadsThisMonth), 1),
    [locations]
  );

  // Bar chart data: top 8 locations by revenue
  const barChartData = useMemo(() => {
    return sortedLocations.slice(0, 8).map((loc) => ({
      location: loc.name.length > 14
        ? loc.name.slice(0, 12) + "..."
        : loc.name,
      revenue: loc.revenueThisMonth / 100,
      leads: loc.leadsThisMonth,
      bookings: loc.bookingsThisMonth,
    }));
  }, [sortedLocations]);

  // Locations grouped by state for the franchise map
  const locationsByState = useMemo(() => {
    const groups = new Map<string, FranchiseLocation[]>();
    for (const loc of locations) {
      const state = loc.state.toUpperCase();
      const existing = groups.get(state) ?? [];
      existing.push(loc);
      groups.set(state, existing);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length);
  }, [locations]);

  // System-wide alerts
  const alerts = useMemo(() => generateAlerts(locations), [locations]);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10"
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-400">
            Failed to load franchise data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeInView>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Franchise Intelligence
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor location performance, compare metrics, and identify top
              performers across your franchise network.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </button>
        </div>
      </FadeInView>

      {/* ================================================================ */}
      {/* 1. FRANCHISE OVERVIEW - KPI Cards                                */}
      {/* ================================================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          label="Total Locations"
          value={kpis.totalLocations}
          icon={Building2}
          iconColor="bg-blue-500/10 text-blue-400"
          subtext={`${activeCount} active, ${inactiveCount} inactive`}
          delay={0}
        />
        <KPICard
          label="Active Locations"
          value={activeCount}
          icon={CheckCircle}
          iconColor="bg-emerald-500/10 text-emerald-400"
          change={
            kpis.totalLocations > 0
              ? `${Math.round((activeCount / kpis.totalLocations) * 100)}%`
              : undefined
          }
          changeType="positive"
          subtext="of total"
          delay={0.05}
        />
        <KPICard
          label="Combined Revenue"
          value={kpis.combinedRevenue / 100}
          prefix="$"
          icon={TrendingUp}
          iconColor="bg-emerald-500/10 text-emerald-400"
          delay={0.1}
        />
        <KPICard
          label="Total Leads"
          value={kpis.totalLeads}
          icon={Users}
          iconColor="bg-purple-500/10 text-purple-400"
          delay={0.15}
        />
        <KPICard
          label="Avg Rating"
          value={kpis.avgRating}
          decimals={1}
          suffix="/5"
          icon={Star}
          iconColor="bg-yellow-500/10 text-yellow-400"
          delay={0.2}
        />
      </div>

      {/* Add Location Form */}
      {showAddForm && (
        <FadeInView>
          <Card>
            <CardHeader>
              <CardTitle>Add Franchise Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="franchise-name"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Location Name *
                  </label>
                  <input
                    id="franchise-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., North Dallas Branch"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="franchise-city"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    City *
                  </label>
                  <input
                    id="franchise-city"
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Dallas"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="franchise-state"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    State *
                  </label>
                  <input
                    id="franchise-state"
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="TX"
                    maxLength={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="franchise-address"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Address
                  </label>
                  <input
                    id="franchise-address"
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="franchise-zip"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    ZIP Code
                  </label>
                  <input
                    id="franchise-zip"
                    type="text"
                    value={formZip}
                    onChange={(e) => setFormZip(e.target.value)}
                    placeholder="75201"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="franchise-phone"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Phone
                  </label>
                  <input
                    id="franchise-phone"
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(214) 555-0100"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="franchise-manager"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Manager
                  </label>
                  <input
                    id="franchise-manager"
                    type="text"
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    placeholder="John Smith"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-2">
                  <button
                    onClick={handleAddLocation}
                    disabled={
                      creating ||
                      !formName.trim() ||
                      !formCity.trim() ||
                      !formState.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creating ? "Adding..." : "Add Location"}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInView>
      )}

      {/* ================================================================ */}
      {/* 2. LOCATION LEADERBOARD                                          */}
      {/* ================================================================ */}
      <FadeInView delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              Location Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {locations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No franchise locations yet. Click &quot;Add Location&quot; above
                to add your first franchise location and start tracking
                performance.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Rank</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">Leads</th>
                        <th className="px-4 py-3 font-medium">Revenue</th>
                        <th className="px-4 py-3 font-medium">Conv. Rate</th>
                        <th className="px-4 py-3 font-medium">Rating</th>
                        <th className="px-4 py-3 font-medium">Rank Change</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedLocations.map((loc, idx) => {
                        const isTop =
                          topPerformer && loc.id === topPerformer.id;
                        const rankChange = getRankChange(loc, idx);
                        const convRate = conversionRate(
                          loc.leadsThisMonth,
                          loc.bookingsThisMonth
                        );
                        return (
                          <tr
                            key={loc.id}
                            className={cn(
                              "transition-colors hover:bg-muted/30",
                              isTop && "bg-amber-500/5"
                            )}
                          >
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                  idx === 0
                                    ? "bg-amber-500/20 text-amber-400"
                                    : idx === 1
                                      ? "bg-slate-400/20 text-slate-300"
                                      : idx === 2
                                        ? "bg-orange-600/20 text-orange-400"
                                        : "bg-muted text-muted-foreground"
                                )}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isTop && (
                                  <Award className="h-4 w-4 text-amber-400" />
                                )}
                                <span
                                  className={cn(
                                    "font-medium",
                                    isTop && "text-amber-400"
                                  )}
                                >
                                  {loc.name}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                <MapPin className="mr-0.5 inline h-3 w-3" />
                                {loc.city}, {loc.state}
                                {loc.manager && ` | ${loc.manager}`}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-8 text-right font-medium">
                                  {loc.leadsThisMonth}
                                </span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-purple-500"
                                    style={{
                                      width: `${(loc.leadsThisMonth / maxLeads) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-emerald-400">
                                  {formatCurrency(loc.revenueThisMonth)}
                                </span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{
                                      width: `${(loc.revenueThisMonth / maxRevenue) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "font-medium",
                                  convRate >= 30
                                    ? "text-emerald-400"
                                    : convRate >= 15
                                      ? "text-yellow-400"
                                      : "text-muted-foreground"
                                )}
                              >
                                {convRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Star
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    loc.avgRating >= 4
                                      ? "fill-yellow-400 text-yellow-400"
                                      : loc.avgRating >= 3
                                        ? "fill-yellow-600 text-yellow-600"
                                        : "text-muted-foreground"
                                  )}
                                />
                                <span
                                  className={cn(
                                    "font-medium",
                                    loc.avgRating >= 4
                                      ? "text-yellow-400"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {formatRating(loc.avgRating)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <RankChangeIndicator change={rankChange} />
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                  loc.isActive
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-red-500/15 text-red-400"
                                )}
                              >
                                {loc.isActive ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {loc.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="grid gap-3 p-4 md:hidden">
                  {sortedLocations.map((loc, idx) => {
                    const isTop = topPerformer && loc.id === topPerformer.id;
                    const rankChange = getRankChange(loc, idx);
                    const convRate = conversionRate(
                      loc.leadsThisMonth,
                      loc.bookingsThisMonth
                    );
                    return (
                      <div
                        key={loc.id}
                        className={cn(
                          "rounded-lg border border-border p-4",
                          isTop && "border-amber-500/30 bg-amber-500/5"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                isTop
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {idx + 1}
                            </span>
                            <h3
                              className={cn(
                                "font-medium",
                                isTop && "text-amber-400"
                              )}
                            >
                              {loc.name}
                            </h3>
                            {isTop && (
                              <Award className="h-4 w-4 text-amber-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <RankChangeIndicator change={rankChange} />
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                loc.isActive
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-red-500/15 text-red-400"
                              )}
                            >
                              {loc.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        <p className="mb-3 text-xs text-muted-foreground">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {loc.city}, {loc.state}
                          {loc.manager && ` | Mgr: ${loc.manager}`}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              Leads:{" "}
                            </span>
                            <span className="font-medium">
                              {loc.leadsThisMonth}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Revenue:{" "}
                            </span>
                            <span className="font-medium text-emerald-400">
                              {formatCurrency(loc.revenueThisMonth)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Conv. Rate:{" "}
                            </span>
                            <span className="font-medium">
                              {convRate.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Rating:{" "}
                            </span>
                            <span className="font-medium text-yellow-400">
                              {formatRating(loc.avgRating)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeInView>

      {/* ================================================================ */}
      {/* 3. PERFORMANCE COMPARISON - Bar Chart                            */}
      {/* ================================================================ */}
      {locations.length > 0 && (
        <FadeInView delay={0.15}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonBarChart
                data={barChartData}
                xKey="location"
                series={[
                  {
                    dataKey: "revenue",
                    label: "Revenue ($)",
                    color: SEMANTIC_COLORS.revenue,
                  },
                  {
                    dataKey: "leads",
                    label: "Leads",
                    color: SEMANTIC_COLORS.leads,
                  },
                  {
                    dataKey: "bookings",
                    label: "Bookings",
                    color: SEMANTIC_COLORS.bookings,
                  },
                ]}
                height={320}
                barRadius={3}
                valueFormatter={(v) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
            </CardContent>
          </Card>
        </FadeInView>
      )}

      {/* Two-column row: Brand Compliance + Franchise Map */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ================================================================ */}
        {/* 4. BRAND COMPLIANCE SCORE                                        */}
        {/* ================================================================ */}
        <FadeInView delay={0.2}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Shield className="h-5 w-5 text-primary" />
                Brand Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Add locations to see brand compliance scores.
                </p>
              ) : (
                <div className="space-y-4">
                  {sortedLocations.slice(0, 6).map((loc) => {
                    const scores = getComplianceScores(loc);
                    return (
                      <div
                        key={loc.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {loc.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {loc.city}, {loc.state}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-bold",
                              scores.overall >= 90
                                ? "bg-emerald-500/15 text-emerald-400"
                                : scores.overall >= 75
                                  ? "bg-blue-500/15 text-blue-400"
                                  : scores.overall >= 60
                                    ? "bg-yellow-500/15 text-yellow-400"
                                    : "bg-red-500/15 text-red-400"
                            )}
                          >
                            {scores.overall}%
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <ComplianceBar
                            label="Logo Usage"
                            score={scores.logoScore}
                            icon={Image}
                          />
                          <ComplianceBar
                            label="Messaging"
                            score={scores.messagingScore}
                            icon={MessageSquare}
                          />
                          <ComplianceBar
                            label="Response Time"
                            score={scores.responseTimeScore}
                            icon={Clock}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInView>

        {/* ================================================================ */}
        {/* 5. FRANCHISE MAP - Location distribution by state/region         */}
        {/* ================================================================ */}
        <FadeInView delay={0.25}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Globe className="h-5 w-5 text-primary" />
                Location Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Add locations to see your franchise footprint.
                </p>
              ) : (
                <div className="space-y-3">
                  {locationsByState.map(([state, locs]) => (
                    <div key={state}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">{state}</span>
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            {locs.length}{" "}
                            {locs.length === 1 ? "location" : "locations"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(
                            locs.reduce(
                              (sum, l) => sum + l.revenueThisMonth,
                              0
                            )
                          )}{" "}
                          revenue
                        </span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {locs
                          .sort(
                            (a, b) =>
                              b.revenueThisMonth - a.revenueThisMonth
                          )
                          .map((loc) => (
                            <div
                              key={loc.id}
                              className="flex items-center justify-between rounded px-2 py-1 text-xs transition-colors hover:bg-muted/30"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    loc.isActive
                                      ? "bg-emerald-400"
                                      : "bg-red-400"
                                  )}
                                />
                                <span className="text-foreground">
                                  {loc.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {loc.city}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>
                                  {loc.leadsThisMonth} leads
                                </span>
                                <span className="font-medium text-emerald-400">
                                  {formatCurrency(loc.revenueThisMonth)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}

                  {/* Summary footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>
                      {locationsByState.length}{" "}
                      {locationsByState.length === 1 ? "state" : "states"} covered
                    </span>
                    <span>
                      {locations.length} total{" "}
                      {locations.length === 1 ? "location" : "locations"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInView>
      </div>

      {/* ================================================================ */}
      {/* 6. SYSTEM-WIDE ALERTS                                            */}
      {/* ================================================================ */}
      <FadeInView delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              System-Wide Alerts
              {alerts.length > 0 && (
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400">
                  {alerts.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    All Clear
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    No issues detected across your franchise network. All
                    locations are performing within acceptable thresholds.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                      alert.severity === "critical" &&
                        "border-red-500/20 bg-red-500/5",
                      alert.severity === "warning" &&
                        "border-yellow-500/20 bg-yellow-500/5",
                      alert.severity === "info" &&
                        "border-blue-500/20 bg-blue-500/5"
                    )}
                  >
                    {alert.severity === "critical" ? (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    ) : alert.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                    ) : (
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {alert.title}
                        </span>
                        <AlertBadge severity={alert.severity} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInView>
    </div>
  );
}
