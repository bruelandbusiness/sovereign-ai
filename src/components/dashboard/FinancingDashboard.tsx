"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Calculator,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────

interface FinancingKPIs {
  totalApplications: number;
  fundedAmount: number; // cents
  conversionRate: number; // 0-100
  avgLoanAmount: number; // cents
}

interface FinancingApp {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  amount: number; // cents
  term: number;
  apr: number;
  monthlyPayment: number | null;
  status: string;
  externalId: string | null;
  prequalAmount: number | null;
  createdAt: string;
}

interface FinancingResponse {
  applications: FinancingApp[];
  kpis: FinancingKPIs;
  total: number;
  page: number;
  totalPages: number;
}

// ─── Helpers ────────────────────────────────────────────────────

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Status Styling ─────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof CheckCircle }
> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  prequalified: { label: "Prequalified", variant: "secondary", icon: CreditCard },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  funded: { label: "Funded", variant: "default", icon: DollarSign },
  declined: { label: "Declined", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "outline", icon: Clock },
};

type SortField = "createdAt" | "amount" | "status" | "customerName";
type SortDirection = "asc" | "desc";

// ─── Component ──────────────────────────────────────────────────

export function FinancingDashboard() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const { data, isLoading, error } = useSWR<FinancingResponse>(
    `/api/dashboard/financing?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 60000, dedupingInterval: 10000, revalidateOnFocus: false }
  );

  const kpis = data?.kpis || {
    totalApplications: 0,
    fundedAmount: 0,
    conversionRate: 0,
    avgLoanAmount: 0,
  };

  const applications = data?.applications || [];
  const totalPages = data?.totalPages || 1;

  // Client-side sort
  const sortedApplications = useMemo(() => {
    const sorted = [...applications].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "customerName":
          cmp = a.customerName.localeCompare(b.customerName);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [applications, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === "asc" ? "\u2191" : "\u2193"}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-8" role="status" aria-label="Loading financing data">
        <div>
          <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
        <span className="sr-only">Loading financing data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
        Failed to load financing data. Please try refreshing the page.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-400" />
          Embedded Financing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Offer buy-now-pay-later financing to your customers with Wisetack
          integration. Track applications, funded amounts, and conversion rates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Calculator className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {kpis.totalApplications}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Applications
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {formatCents(kpis.fundedAmount)}
              </p>
              <p className="text-xs text-muted-foreground">Funded Amount</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <TrendingUp className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {kpis.conversionRate}%
              </p>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <CreditCard className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {formatCents(kpis.avgLoanAmount)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Loan Amount</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Applications ({data?.total || 0})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
              <span className="text-xs text-muted-foreground">Status:</span>
              {["all", "pending", "prequalified", "approved", "funded", "declined", "expired"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    aria-pressed={statusFilter === status}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      statusFilter === status
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedApplications.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No financing applications yet. Share the financing calculator
                with your customers to start receiving applications.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm" aria-label="Financing applications">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th
                        scope="col"
                        className="cursor-pointer pb-3 pr-4 font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort("customerName")}
                        aria-sort={sortField === "customerName" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      >
                        Customer
                        <SortIndicator field="customerName" />
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer pb-3 pr-4 font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort("amount")}
                        aria-sort={sortField === "amount" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      >
                        Amount
                        <SortIndicator field="amount" />
                      </th>
                      <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">
                        Term
                      </th>
                      <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">
                        Monthly
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer pb-3 pr-4 font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort("status")}
                        aria-sort={sortField === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      >
                        Status
                        <SortIndicator field="status" />
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer pb-3 font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort("createdAt")}
                        aria-sort={sortField === "createdAt" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      >
                        Date
                        <SortIndicator field="createdAt" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedApplications.map((app) => {
                      const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConf.icon;

                      return (
                        <tr
                          key={app.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-3 pr-4">
                            <div className="font-medium">
                              {app.customerName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {app.customerEmail}
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-medium tabular-nums">
                            {formatCents(app.amount)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {app.term}mo
                            {app.apr === 0 ? (
                              <span className="ml-1 text-emerald-400">
                                0% APR
                              </span>
                            ) : (
                              <span className="ml-1">
                                {app.apr}% APR
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                            {app.monthlyPayment
                              ? formatCents(app.monthlyPayment)
                              : "--"}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={statusConf.variant}>
                              <StatusIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                              <span className="sr-only">Status: </span>{statusConf.label}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {formatDate(app.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 sm:hidden">
                {sortedApplications.map((app) => {
                  const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConf.icon;

                  return (
                    <div key={app.id} className="rounded-lg border border-border p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{app.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">{app.customerEmail}</p>
                        </div>
                        <Badge variant={statusConf.variant} className="shrink-0">
                          <StatusIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                          {statusConf.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-medium tabular-nums">{formatCents(app.amount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Monthly: </span>
                          <span className="tabular-nums">{app.monthlyPayment ? formatCents(app.monthlyPayment) : "--"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Term: </span>
                          <span>{app.term}mo @ {app.apr}% APR</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          <span>{formatDate(app.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
