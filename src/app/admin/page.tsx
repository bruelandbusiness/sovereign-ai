"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminKPIs } from "@/components/admin/AdminKPIs";
import { formatPrice, BUNDLES } from "@/lib/constants";
import {
  RefreshCw,
  Users,
  ShoppingBag,
  LifeBuoy,
  Monitor,
  ArrowRight,
} from "lucide-react";

interface AdminStatsData {
  totalClients: number;
  mrr: number;
  activeServices: number;
  avgRevenue: number;
  churnRate: number;
  bundleBreakdown: Record<string, number>;
  recentClients: Array<{
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
  }>;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError("Failed to load stats. The server returned an error.");
      }
    } catch {
      setError("Connection issue while loading stats. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Business performance at a glance.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-muted-foreground">
          {error || "Failed to load stats. Please try again."}
        </p>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Business performance at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <AdminKPIs stats={stats} />

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Manage Clients",
            href: "/admin/clients",
            icon: Users,
            description: "View, search, and manage all client accounts",
          },
          {
            label: "Products",
            href: "/admin/products",
            icon: ShoppingBag,
            description: "Create and edit digital products",
          },
          {
            label: "Support Tickets",
            href: "/admin/support",
            icon: LifeBuoy,
            description: "Review and respond to open tickets",
          },
          {
            label: "System Health",
            href: "/admin/monitoring",
            icon: Monitor,
            description: "Check API, database, and service status",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-card p-4 transition-colors hover:border-white/[0.1] hover:bg-white/[0.02]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {action.description}
              </p>
            </div>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>

      {/* Two-column: Recent Signups + Bundle Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clients yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentClients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.02] hover:border-white/[0.08]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {client.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.ownerName} &middot; {client.email}
                      </p>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      {client.subscription ? (
                        <span className="text-sm tabular-nums font-medium text-foreground">
                          {formatPrice(client.subscription.monthlyAmount / 100)}
                          <span className="text-muted-foreground">/mo</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No subscription
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bundle Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Bundle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {BUNDLES.map((bundle) => {
                const count = stats.bundleBreakdown[bundle.id] || 0;
                const totalClients = Object.values(
                  stats.bundleBreakdown
                ).reduce((a, b) => a + b, 0);
                const pct =
                  totalClients > 0
                    ? Math.round((count / totalClients) * 100)
                    : 0;

                return (
                  <div key={bundle.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            bundle.id === "empire"
                              ? "default"
                              : bundle.id === "growth"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {bundle.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(bundle.price)}/mo
                        </span>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        {count} client{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full gradient-bg transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Custom / a-la-carte */}
              {stats.bundleBreakdown["custom"] && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Custom</Badge>
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {stats.bundleBreakdown["custom"]} client
                      {stats.bundleBreakdown["custom"] !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
