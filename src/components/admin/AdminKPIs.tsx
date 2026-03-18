"use client";

import { Users, DollarSign, Cpu, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/constants";

interface AdminStats {
  totalClients: number;
  mrr: number;
  activeServices: number;
  avgRevenue: number;
}

const KPI_CONFIG = [
  {
    key: "totalClients" as const,
    label: "Total Clients",
    icon: Users,
    format: (v: number) => v.toString(),
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    key: "mrr" as const,
    label: "Monthly Recurring Revenue",
    icon: DollarSign,
    format: (v: number) => formatPrice(v / 100),
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    key: "activeServices" as const,
    label: "Active Services",
    icon: Cpu,
    format: (v: number) => v.toString(),
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    key: "avgRevenue" as const,
    label: "Avg Revenue / Client",
    icon: TrendingUp,
    format: (v: number) => formatPrice(v / 100),
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

export function AdminKPIs({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((kpi) => (
        <Card key={kpi.key}>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}
            >
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                {kpi.format(stats[kpi.key])}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
