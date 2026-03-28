"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  RotateCcw,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookDelivery {
  id: string;
  endpointId: string;
  endpointUrl: string;
  clientId: string;
  event: string;
  status: "pending" | "delivered" | "failed" | "dead_letter";
  success: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  attemptLog: string | null;
  deliveredAt: string | null;
  deadLetteredAt: string | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type StatusFilter = "" | "pending" | "delivered" | "failed" | "dead_letter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string): React.ReactNode {
  switch (status) {
    case "delivered":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Delivered
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    case "dead_letter":
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Dead Letter
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen - 3) + "...";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminWebhooksPage() {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "25");
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    try {
      const res = await fetch(`/api/admin/webhooks?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `HTTP ${res.status}`,
        );
      }
      const json = (await res.json()) as {
        data: WebhookDelivery[];
        pagination: PaginationMeta;
      };
      setDeliveries(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `HTTP ${res.status}`,
        );
      }
      // Refresh the list
      await fetchDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhook Deliveries
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor webhook delivery status, retries, and dead letter queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-1 h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                !
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeliveries}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-1 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="dead_letter">Dead Letter</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Endpoint URL</th>
                <th className="px-4 py-3">HTTP</th>
                <th className="px-4 py-3">Time (ms)</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && deliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No webhook deliveries found.
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <DeliveryRow
                    key={d.id}
                    delivery={d}
                    isExpanded={expandedId === d.id}
                    isRetrying={retryingId === d.id}
                    onToggle={() =>
                      setExpandedId(expandedId === d.id ? null : d.id)
                    }
                    onRetry={() => handleRetry(d.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.pageSize + 1}
            {" - "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            {" of "}
            {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery Row
// ---------------------------------------------------------------------------

function DeliveryRow({
  delivery,
  isExpanded,
  isRetrying,
  onToggle,
  onRetry,
}: {
  delivery: WebhookDelivery;
  isExpanded: boolean;
  isRetrying: boolean;
  onToggle: () => void;
  onRetry: () => void;
}) {
  const isDeadLetter = delivery.status === "dead_letter";
  const rowClass = isDeadLetter
    ? "border-b border-red-500/20 bg-red-500/5"
    : "border-b border-border/50 hover:bg-muted/30";

  return (
    <>
      <tr className={`${rowClass} transition-colors`}>
        <td className="px-4 py-3">{statusBadge(delivery.status)}</td>
        <td className="px-4 py-3 font-mono text-xs">{delivery.event}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground" title={delivery.endpointUrl}>
          {truncateUrl(delivery.endpointUrl)}
        </td>
        <td className="px-4 py-3 font-mono text-xs">
          {delivery.statusCode ?? "-"}
        </td>
        <td className="px-4 py-3 font-mono text-xs">
          {delivery.responseTimeMs ?? "-"}
        </td>
        <td className="px-4 py-3 text-xs">
          {delivery.attempts}/{delivery.maxAttempts}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {formatDate(delivery.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle details"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {isDeadLetter && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
                className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <RotateCcw
                  className={`mr-1 h-3 w-3 ${isRetrying ? "animate-spin" : ""}`}
                />
                Retry
              </Button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className={isDeadLetter ? "bg-red-500/5" : "bg-muted/20"}>
          <td colSpan={8} className="px-4 py-3">
            <DeliveryDetails delivery={delivery} />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Delivery Details (expanded row)
// ---------------------------------------------------------------------------

function DeliveryDetails({ delivery }: { delivery: WebhookDelivery }) {
  let attempts: Array<{
    attempt: number;
    timestamp: string;
    statusCode: number | null;
    responseTimeMs: number;
    error: string | null;
  }> = [];

  if (delivery.attemptLog) {
    try {
      attempts = JSON.parse(delivery.attemptLog) as typeof attempts;
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <span className="font-medium text-muted-foreground">Endpoint ID</span>
          <p className="font-mono">{delivery.endpointId}</p>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Client ID</span>
          <p className="font-mono">{delivery.clientId}</p>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Delivered At</span>
          <p>{delivery.deliveredAt ? formatDate(delivery.deliveredAt) : "-"}</p>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Dead Lettered At</span>
          <p>
            {delivery.deadLetteredAt
              ? formatDate(delivery.deadLetteredAt)
              : "-"}
          </p>
        </div>
      </div>

      {delivery.lastError && (
        <div>
          <span className="font-medium text-muted-foreground">Last Error</span>
          <p className="mt-1 rounded bg-background p-2 font-mono text-red-400">
            {delivery.lastError}
          </p>
        </div>
      )}

      {attempts.length > 0 && (
        <div>
          <span className="font-medium text-muted-foreground">
            Attempt History
          </span>
          <div className="mt-1 rounded border border-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-background text-muted-foreground">
                  <th className="px-3 py-1.5 text-left">#</th>
                  <th className="px-3 py-1.5 text-left">Timestamp</th>
                  <th className="px-3 py-1.5 text-left">HTTP Status</th>
                  <th className="px-3 py-1.5 text-left">Response Time</th>
                  <th className="px-3 py-1.5 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.attempt} className="border-b border-border/30">
                    <td className="px-3 py-1.5">{a.attempt}</td>
                    <td className="px-3 py-1.5">{formatDate(a.timestamp)}</td>
                    <td className="px-3 py-1.5 font-mono">
                      {a.statusCode ?? "-"}
                    </td>
                    <td className="px-3 py-1.5 font-mono">
                      {a.responseTimeMs}ms
                    </td>
                    <td className="px-3 py-1.5 text-red-400">
                      {a.error ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
