"use client";

import { Users, Zap, Star, MessageSquare } from "lucide-react";
import { KPICard } from "./KPICard";
import type { KPIData } from "@/types/dashboard";

const ICONS = [
  { icon: Users, iconColor: "bg-blue-500/10 text-blue-400" },
  { icon: Zap, iconColor: "bg-purple-500/10 text-purple-400" },
  { icon: Star, iconColor: "bg-amber-500/10 text-amber-400" },
  { icon: MessageSquare, iconColor: "bg-emerald-500/10 text-emerald-400" },
];

interface KPIGridProps {
  kpis?: KPIData[];
}

export function KPIGrid({ kpis = [] }: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const iconConfig = ICONS[i % ICONS.length];
        const numValue = typeof kpi.value === "string" ? parseFloat(kpi.value) || 0 : kpi.value;
        return (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={numValue}
            change={kpi.change}
            changeType={kpi.changeType}
            subtext={kpi.subtext}
            icon={iconConfig.icon}
            iconColor={iconConfig.iconColor}
            delay={i * 0.1}
          />
        );
      })}
    </div>
  );
}
