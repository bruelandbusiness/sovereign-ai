"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  accountId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ─────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "error_captured", label: "Error Captured" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "signup", label: "Signup" },
  { value: "subscription_created", label: "Subscription Created" },
  { value: "subscription_canceled", label: "Subscription Canceled" },
  { value: "client_created", label: "Client Created" },
  { value: "client_updated", label: "Client Updated" },
  { value: "client_deleted", label: "Client Deleted" },
  { value: "service_activated", label: "Service Activated" },
  { value: "service_deactivated", label: "Service Deactivated" },
  { value: "payment_received", label: "Payment Received" },
  { value: "admin_action", label: "Admin Action" },
];

const PAGE_SIZE = 50;

// ─── Helpers ───────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCSV(entries: AuditLogEntry[]): string {
  const headers = [
    "Timestamp",
    "Account ID",
    "Action",
    "Resource",
    "Resource ID",
    "Metadata",
  ];
  const rows = entries.map((e) => [
    e.createdAt,
    e.accountId || "",
    e.action,
    e.resource,
    e.resourceId || "",
    e.metadata || "",
  ]);

  const lines = [
    headers.map(escapeCSV).join(","),
    ...rows.map((r) => r.map(escapeCSV).join(",")),
  ];
  return lines.join("\n");
}

// ─── Component ─────────────────────────────────────────────

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const fetchEntries = useCallback(
    async (targetPage: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setIsLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(PAGE_SIZE));
      if (action) params.set("action", action);
      if (accountSearch.trim()) params.set("accountId", accountSearch.trim());
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      try {
        const res = await fetch(
          `/api/admin/audit-log?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ||
              `Server error (${res.status})`,
          );
        }
        const json = (await res.json()) as AuditLogResponse;
        setData(json);
        setPage(json.page);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          (err as Error).message || "Failed to load audit log entries.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [action, accountSearch, dateFrom, dateTo],
  );

  useEffect(() => {
    fetchEntries(1);
  }, [fetchEntries]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all matching entries (up to 10000) for export
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "200");
      if (action) params.set("action", action);
      if (accountSearch.trim()) params.set("accountId", accountSearch.trim());
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const allEntries: AuditLogEntry[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore && currentPage <= 50) {
        params.set("page", String(currentPage));
        const res = await fetch(
          `/api/admin/audit-log?${params.toString()}`,
        );
        if (!res.ok) break;
        const json = (await res.json()) as AuditLogResponse;
        allEntries.push(...json.entries);
        hasMore = currentPage < json.totalPages;
        currentPage++;
      }

      const csv = buildCSV(allEntries);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export audit log.");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setAction("");
    setAccountSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = action || accountSearch || dateFrom || dateTo;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all system events and user actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || isLoading}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEntries(page)}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Action filter */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="action-filter"
            className="text-xs font-medium text-muted-foreground"
          >
            Action
          </label>
          <select
            id="action-filter"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-10 rounded-lg border border-white/[0.08] bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Account ID search */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="account-search"
            className="text-xs font-medium text-muted-foreground"
          >
            Account ID
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="account-search"
              type="text"
              placeholder="Search by Account ID"
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="h-10 w-52 rounded-lg border border-white/[0.08] bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="date-from"
            className="text-xs font-medium text-muted-foreground"
          >
            From
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 rounded-lg border border-white/[0.08] bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="date-to"
            className="text-xs font-medium text-muted-foreground"
          >
            To
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 rounded-lg border border-white/[0.08] bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10 text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                Timestamp
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                Account
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                Action
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                Resource
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                Resource ID
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !data ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : !data || data.entries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              data.entries.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const metadata = parseMetadata(entry.metadata);

                return (
                  <tr
                    key={entry.id}
                    className="group border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-foreground">
                      {formatTimestamp(entry.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.accountId || (
                        <span className="italic text-muted-foreground/50">
                          system
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {entry.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {entry.resource}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.resourceId || "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      {metadata ? (
                        <div>
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : entry.id)
                            }
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            {isExpanded ? "Hide" : "View"}
                          </button>
                          {isExpanded && (
                            <pre className="mt-2 max-h-64 max-w-lg overflow-auto rounded-lg bg-background p-3 text-xs font-mono text-muted-foreground">
                              {JSON.stringify(metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          {"\u2014"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.limit + 1}
            {"\u2013"}
            {Math.min(data.page * data.limit, data.total)} of{" "}
            {data.total.toLocaleString()} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || isLoading}
              onClick={() => fetchEntries(data.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages || isLoading}
              onClick={() => fetchEntries(data.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
