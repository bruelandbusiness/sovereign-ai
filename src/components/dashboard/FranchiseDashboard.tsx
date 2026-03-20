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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
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

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FranchiseDashboard() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useSWR<FranchiseData>(
    "/api/dashboard/franchise",
    fetcher,
    { refreshInterval: 60000, dedupingInterval: 10000, revalidateOnFocus: false }
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
        toast("We couldn't add the location. Please check your details and try again.", "error");
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
  ]);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  const kpis = data?.kpis ?? {
    totalLocations: 0,
    combinedRevenue: 0,
    totalLeads: 0,
    avgRating: 0,
  };
  const locations = data?.locations ?? [];

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
              performers.
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Locations"
          value={kpis.totalLocations}
          icon={Building2}
          iconColor="bg-blue-500/10 text-blue-400"
          delay={0}
        />
        <KPICard
          label="Combined Monthly Revenue"
          value={kpis.combinedRevenue / 100}
          prefix="$"
          icon={TrendingUp}
          iconColor="bg-emerald-500/10 text-emerald-400"
          delay={0.05}
        />
        <KPICard
          label="Total Leads"
          value={kpis.totalLeads}
          icon={Users}
          iconColor="bg-purple-500/10 text-purple-400"
          delay={0.1}
        />
        <KPICard
          label="Avg Rating"
          value={kpis.avgRating}
          decimals={1}
          suffix="/5"
          icon={Star}
          iconColor="bg-yellow-500/10 text-yellow-400"
          delay={0.15}
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
                  <label htmlFor="franchise-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
                  <label htmlFor="franchise-city" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
                  <label htmlFor="franchise-state" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
                  <label htmlFor="franchise-address" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
                  <label htmlFor="franchise-zip" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
                  <label htmlFor="franchise-phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
                  <label htmlFor="franchise-manager" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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

      {/* Location Performance Table */}
      <FadeInView delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              Location Performance Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {locations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No franchise locations yet. Click &quot;Add Location&quot; above to add your first franchise location and start tracking performance.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">#</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">City</th>
                        <th className="px-4 py-3 font-medium">Leads</th>
                        <th className="px-4 py-3 font-medium">Revenue</th>
                        <th className="px-4 py-3 font-medium">Bookings</th>
                        <th className="px-4 py-3 font-medium">Rating</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {locations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No franchise locations added yet. Click "Add Location" above to get started.
                          </td>
                        </tr>
                      ) : locations
                        .sort(
                          (a, b) =>
                            b.revenueThisMonth - a.revenueThisMonth
                        )
                        .map((loc, idx) => {
                          const isTop =
                            topPerformer && loc.id === topPerformer.id;
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
                                    isTop
                                      ? "bg-amber-500/20 text-amber-400"
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
                                {loc.manager && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    Mgr: {loc.manager}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {loc.city}, {loc.state}
                                </span>
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
                              <td className="px-4 py-3 font-medium">
                                {loc.bookingsThisMonth}
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
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                    loc.isActive
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : "bg-zinc-500/15 text-zinc-400"
                                  )}
                                >
                                  <CheckCircle className="h-3 w-3" />
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
                  {locations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No franchise locations added yet. Click "Add Location" above to get started.
                    </p>
                  ) : locations
                    .sort(
                      (a, b) =>
                        b.revenueThisMonth - a.revenueThisMonth
                    )
                    .map((loc, idx) => {
                      const isTop =
                        topPerformer && loc.id === topPerformer.id;
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
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                loc.isActive
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-zinc-500/15 text-zinc-400"
                              )}
                            >
                              {loc.isActive ? "Active" : "Inactive"}
                            </span>
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
                                Bookings:{" "}
                              </span>
                              <span className="font-medium">
                                {loc.bookingsThisMonth}
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
    </div>
  );
}
