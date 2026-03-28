"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  RefreshCw,
  Link2,
  Link2Off,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-context";

// ─── Types ──────────────────────────────────────────────────

interface FSMConnectionData {
  id: string;
  platform: string;
  isActive: boolean;
  externalAccountId: string | null;
  lastSyncAt: string | null;
  syncStatus: string;
  syncError: string | null;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface FSMSyncLogData {
  id: string;
  connectionId: string;
  platform: string;
  direction: string;
  entityType: string;
  entityId: string | null;
  externalId: string | null;
  action: string;
  status: string;
  details: string | null;
  createdAt: string;
}

type PlatformId = "servicetitan" | "jobber" | "housecallpro";

interface PlatformMeta {
  id: PlatformId;
  name: string;
  color: string;
  bgColor: string;
}

const PLATFORMS: PlatformMeta[] = [
  { id: "servicetitan", name: "ServiceTitan", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { id: "jobber", name: "Jobber", color: "text-green-400", bgColor: "bg-green-500/10" },
  { id: "housecallpro", name: "Housecall Pro", color: "text-blue-400", bgColor: "bg-blue-500/10" },
];

// ─── Helpers ────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SYNC_STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  syncing: "secondary",
  synced: "default",
  error: "destructive",
};

const DIRECTION_ICON: Record<string, typeof ArrowDownToLine> = {
  inbound: ArrowDownToLine,
  outbound: ArrowUpFromLine,
};

const ACTION_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
  synced: "outline",
};

// ─── Component ──────────────────────────────────────────────

export function FSMDashboard() {
  const { toast } = useToast();
  const {
    data: connectionsData,
    isLoading: connectionsLoading,
    mutate: mutateConnections,
  } = useSWR<{ connections: FSMConnectionData[] }>(
    "/api/services/fsm/connections",
    fetcher
  );
  const {
    data: logsData,
    isLoading: logsLoading,
    mutate: mutateLogs,
  } = useSWR<{ total: number; logs: FSMSyncLogData[] }>(
    "/api/services/fsm/logs?limit=50",
    fetcher
  );

  const connections = connectionsData?.connections || [];
  const logs = logsData?.logs || [];

  // Connect form state
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformId | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [accountId, setAccountId] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSubmitting, setConnectSubmitting] = useState(false);

  // Sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);

  function getConnection(platform: PlatformId): FSMConnectionData | undefined {
    return connections.find((c) => c.platform === platform);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!connectingPlatform) return;
    setConnectError(null);

    if (!apiKey.trim()) {
      setConnectError("API key is required");
      return;
    }

    setConnectSubmitting(true);
    try {
      const res = await fetch("/api/services/fsm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: connectingPlatform,
          accessToken: apiKey.trim(),
          externalAccountId: accountId.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setConnectError(data.error || "Failed to connect");
        return;
      }

      setConnectingPlatform(null);
      setApiKey("");
      setAccountId("");
      mutateConnections();
    } catch {
      setConnectError("Something went wrong. Please try again.");
    } finally {
      setConnectSubmitting(false);
    }
  }

  async function handleSync(connectionId: string) {
    setSyncingId(connectionId);
    try {
      const res = await fetch("/api/services/fsm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) {
        toast("We couldn't sync your field service data. Please try again.", "error");
        return;
      }
      mutateConnections();
      mutateLogs();
    } catch {
      toast("We couldn't sync your field service data. Please try again.", "error");
    } finally {
      setSyncingId(null);
    }
  }

  const isLoading = connectionsLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Loading FSM data...</span>
      </div>
    );
  }

  // Compute KPIs from logs
  const jobsSynced = logs.filter((l) => l.entityType === "job" && l.status === "success").length;
  const customersSynced = logs.filter((l) => l.entityType === "customer" && l.status === "success").length;
  const leadsPushed = logs.filter((l) => l.direction === "outbound" && l.entityType === "customer" && l.action === "created").length;
  const lastSyncTime = connections.reduce<string | null>((latest, c) => {
    if (!c.lastSyncAt) return latest;
    if (!latest) return c.lastSyncAt;
    return new Date(c.lastSyncAt) > new Date(latest) ? c.lastSyncAt : latest;
  }, null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-cyan-400" />
          FSM Live Sync
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bidirectional sync with ServiceTitan, Jobber, and Housecall Pro.
          Jobs, customers, leads, and bookings sync automatically every 15 minutes.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <Briefcase className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{jobsSynced}</p>
              <p className="text-xs text-muted-foreground">Jobs Synced</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{customersSynced}</p>
              <p className="text-xs text-muted-foreground">Customers Synced</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowUpFromLine className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{leadsPushed}</p>
              <p className="text-xs text-muted-foreground">Leads Pushed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {formatRelativeTime(lastSyncTime)}
              </p>
              <p className="text-xs text-muted-foreground">Last Sync</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connections">
        <TabsList className="mb-6">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        {/* ─── Connections Tab ───────────────────────────────── */}
        <TabsContent value="connections">
          <div className="space-y-6">
            {/* Platform Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PLATFORMS.map((pm) => {
                const conn = getConnection(pm.id);
                const isConnected = !!conn && conn.isActive;
                const isSyncing = syncingId === conn?.id;

                return (
                  <Card key={pm.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pm.bgColor}`}>
                            {isConnected ? (
                              <Link2 className={`h-5 w-5 ${pm.color}`} />
                            ) : (
                              <Link2Off className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{pm.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {isConnected ? "Connected" : "Not connected"}
                            </p>
                          </div>
                        </div>
                        {isConnected && conn && (
                          <Badge variant={SYNC_STATUS_BADGE[conn.syncStatus] || "outline"}>
                            {conn.syncStatus}
                          </Badge>
                        )}
                      </div>

                      {isConnected && conn && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Last sync</span>
                            <span>{formatRelativeTime(conn.lastSyncAt)}</span>
                          </div>
                          {conn.externalAccountId && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Account ID</span>
                              <span className="font-mono">{conn.externalAccountId}</span>
                            </div>
                          )}
                          {conn.syncError && (
                            <div className="flex items-center gap-1.5 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="line-clamp-2">{conn.syncError}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        {isConnected && conn ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(conn.id)}
                            disabled={isSyncing}
                            className="flex-1"
                          >
                            {isSyncing ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {isSyncing ? "Syncing..." : "Sync Now"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setConnectingPlatform(pm.id);
                              setApiKey("");
                              setAccountId("");
                              setConnectError(null);
                            }}
                            className="flex-1"
                          >
                            <Link2 className="mr-1.5 h-3.5 w-3.5" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Connect Form */}
            {connectingPlatform && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Connect {PLATFORMS.find((p) => p.id === connectingPlatform)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="apiKey"
                          className="mb-1.5 block text-xs font-medium text-muted-foreground"
                        >
                          API Key / Access Token *
                        </label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          autoComplete="off"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="accountId"
                          className="mb-1.5 block text-xs font-medium text-muted-foreground"
                        >
                          Account / Tenant ID{" "}
                          {connectingPlatform === "servicetitan" ? "*" : "(optional)"}
                        </label>
                        <Input
                          id="accountId"
                          placeholder={
                            connectingPlatform === "servicetitan"
                              ? "Your ServiceTitan Tenant ID"
                              : "External account ID"
                          }
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                        />
                      </div>
                    </div>

                    {connectError && (
                      <p className="text-sm text-destructive" role="alert">{connectError}</p>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={connectSubmitting}>
                        {connectSubmitting ? "Connecting..." : "Save Connection"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConnectingPlatform(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Sync Logs Tab ────────────────────────────────── */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Sync Events ({logsData?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No sync events yet. Connect a platform and trigger a sync to see activity.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table" aria-label="Sync event log">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Time</th>
                        <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Platform</th>
                        <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Direction</th>
                        <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Type</th>
                        <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Action</th>
                        <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                        <th scope="col" className="pb-3 font-medium text-muted-foreground">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const DirIcon = DIRECTION_ICON[log.direction] || ArrowDownToLine;
                        return (
                          <tr key={log.id} className="border-b border-border/50 last:border-0">
                            <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant="outline" className="capitalize">
                                {log.platform}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <DirIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                <span className="capitalize">{log.direction}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 capitalize text-muted-foreground">
                              {log.entityType}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={ACTION_BADGE[log.action] || "outline"} className="capitalize">
                                {log.action}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              {log.status === "success" ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                                  <span className="sr-only">Success</span>
                                </span>
                              ) : log.status === "error" ? (
                                <span className="flex items-center gap-1">
                                  <XCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
                                  <span className="sr-only">Error</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                                  <span className="sr-only">Warning</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-xs text-muted-foreground max-w-[300px] truncate">
                              {log.details || "--"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
