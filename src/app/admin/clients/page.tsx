"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  ExternalLink,
  Pause,
  Play,
  Eye,
  Users,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientRow {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  createdAt: string;
  subscription: {
    bundleId: string | null;
    monthlyAmount: number;
    status: string;
  } | null;
  servicesCount: number;
}

type SortField =
  | "businessName"
  | "ownerName"
  | "email"
  | "plan"
  | "mrr"
  | "status"
  | "createdAt"
  | "servicesCount";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bundleLabel(bundleId: string | null): string {
  switch (bundleId) {
    case "empire":
      return "Empire";
    case "growth":
      return "Growth";
    case "starter":
      return "Starter";
    case "diy":
      return "DIY";
    default:
      return "Custom";
  }
}

function bundleVariant(bundleId: string | null) {
  switch (bundleId) {
    case "empire":
      return "default" as const;
    case "growth":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-emerald-400";
    case "past_due":
      return "text-yellow-400";
    case "canceled":
      return "text-red-400";
    default:
      return "text-muted-foreground";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch clients
  const fetchClients = useCallback(async (query: string) => {
    setError(null);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/clients${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
      } else {
        setError("Failed to load clients. Please try again.");
      }
    } catch {
      setError("Connection issue while loading clients. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(search);
  }, [search, fetchClients]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sort handler
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "createdAt" || field === "mrr" ? "desc" : "asc");
    }
  }

  // Filter + sort clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Plan filter
    if (filterPlan !== "all") {
      result = result.filter(
        (c) => (c.subscription?.bundleId || "custom") === filterPlan
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "no_subscription") {
        result = result.filter((c) => !c.subscription);
      } else {
        result = result.filter((c) => c.subscription?.status === filterStatus);
      }
    }

    // Date range filter
    if (filterDateFrom) {
      const from = new Date(filterDateFrom).getTime();
      result = result.filter((c) => new Date(c.createdAt).getTime() >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo).getTime() + 86400000; // end of day
      result = result.filter((c) => new Date(c.createdAt).getTime() <= to);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "businessName":
          cmp = a.businessName.localeCompare(b.businessName);
          break;
        case "ownerName":
          cmp = a.ownerName.localeCompare(b.ownerName);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "plan":
          cmp = bundleLabel(a.subscription?.bundleId ?? null).localeCompare(
            bundleLabel(b.subscription?.bundleId ?? null)
          );
          break;
        case "mrr":
          cmp =
            (a.subscription?.monthlyAmount ?? 0) -
            (b.subscription?.monthlyAmount ?? 0);
          break;
        case "status":
          cmp = (a.subscription?.status ?? "none").localeCompare(
            b.subscription?.status ?? "none"
          );
          break;
        case "createdAt":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "servicesCount":
          cmp = a.servicesCount - b.servicesCount;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    clients,
    filterPlan,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    sortField,
    sortDir,
  ]);

  // Pause / Unpause action
  async function handleTogglePause(clientId: string, currentStatus: string) {
    const action =
      currentStatus === "active" ? "deactivate" : "reactivate";
    const confirmMsg =
      action === "deactivate"
        ? "Are you sure you want to deactivate this client? Their services will be paused."
        : "Are you sure you want to reactivate this client?";
    if (!confirm(confirmMsg)) return;

    setActionLoading(clientId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchClients(search);
      } else {
        setError(`Failed to ${action} client. Please try again.`);
      }
    } catch {
      setError(`Connection issue while trying to ${action} client.`);
    } finally {
      setActionLoading(null);
    }
  }

  // Impersonate action
  async function handleImpersonate(clientId: string) {
    setActionLoading(clientId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "impersonate" }),
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.url, "_blank");
      } else {
        setError("Failed to impersonate client. Please try again.");
      }
    } catch {
      setError("Connection issue while impersonating client.");
    } finally {
      setActionLoading(null);
    }
  }

  // Stats summary
  const totalMRR = clients.reduce(
    (sum, c) => sum + (c.subscription?.monthlyAmount ?? 0),
    0
  );
  const activeCount = clients.filter(
    (c) => c.subscription?.status === "active"
  ).length;
  const hasActiveFilters =
    filterPlan !== "all" ||
    filterStatus !== "all" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  function clearFilters() {
    setFilterPlan("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  // Sort icon component
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return (
        <ChevronUp className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-30 inline" />
      );
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 inline text-primary" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 inline text-primary" />
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredClients.length} client
            {filteredClients.length !== 1 ? "s" : ""} &middot;{" "}
            {activeCount} active &middot; {formatPrice(totalMRR / 100)} MRR
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
                !
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-white/[0.06] bg-card p-4">
          {/* Plan filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Plan
            </label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="h-11 rounded-lg border border-white/[0.08] bg-background px-3 text-base sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Plans</option>
              <option value="empire">Empire</option>
              <option value="growth">Growth</option>
              <option value="starter">Starter</option>
              <option value="diy">DIY</option>
              <option value="custom">Custom / A la carte</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 rounded-lg border border-white/[0.08] bg-background px-3 text-base sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
              <option value="no_subscription">No Subscription</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Signed Up From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-11 rounded-lg border border-white/[0.08] bg-background px-3 text-base sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Signed Up To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-11 rounded-lg border border-white/[0.08] bg-background px-3 text-base sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-card p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "No clients match your filters."
              : "No clients found."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="mt-2"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th
                    className="group cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => handleSort("businessName")}
                  >
                    Company
                    <SortIcon field="businessName" />
                  </th>
                  <th
                    className="group hidden cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors md:table-cell"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    <SortIcon field="email" />
                  </th>
                  <th
                    className="group cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => handleSort("plan")}
                  >
                    Plan
                    <SortIcon field="plan" />
                  </th>
                  <th
                    className="group cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <SortIcon field="status" />
                  </th>
                  <th
                    className="group hidden cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors sm:table-cell"
                    onClick={() => handleSort("mrr")}
                  >
                    MRR
                    <SortIcon field="mrr" />
                  </th>
                  <th
                    className="group hidden cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors lg:table-cell"
                    onClick={() => handleSort("createdAt")}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Signed Up
                    </span>
                    <SortIcon field="createdAt" />
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const sub = client.subscription;
                  const status = sub?.status ?? "none";
                  const isActionLoading = actionLoading === client.id;

                  return (
                    <tr
                      key={client.id}
                      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Company + Owner */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {client.businessName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {client.ownerName}
                        </p>
                      </td>

                      {/* Email */}
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {client.email}
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={bundleVariant(sub?.bundleId ?? null)}
                        >
                          {bundleLabel(sub?.bundleId ?? null)}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {sub ? (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${statusColor(status)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                status === "active"
                                  ? "bg-emerald-400"
                                  : status === "past_due"
                                  ? "bg-yellow-400"
                                  : status === "canceled"
                                  ? "bg-red-400"
                                  : "bg-muted-foreground"
                              }`}
                            />
                            {status}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            --
                          </span>
                        )}
                      </td>

                      {/* MRR */}
                      <td className="hidden px-4 py-3 tabular-nums text-foreground sm:table-cell">
                        {sub
                          ? formatPrice(sub.monthlyAmount / 100)
                          : "--"}
                      </td>

                      {/* Signed Up */}
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {new Date(client.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View detail */}
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          {/* Pause / Unpause */}
                          {sub && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={
                                status === "active"
                                  ? "Deactivate client"
                                  : "Reactivate client"
                              }
                              disabled={isActionLoading}
                              onClick={() =>
                                handleTogglePause(client.id, status)
                              }
                            >
                              {status === "active" ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}

                          {/* Impersonate */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Impersonate (open client dashboard)"
                            disabled={isActionLoading}
                            onClick={() => handleImpersonate(client.id)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="border-t border-white/[0.04] px-4 py-2.5 text-xs text-muted-foreground">
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        </div>
      )}
    </div>
  );
}
