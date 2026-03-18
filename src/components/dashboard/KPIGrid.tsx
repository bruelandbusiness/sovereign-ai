"use client";

import { Users, PhoneIncoming, Star, Globe } from "lucide-react";
import { KPICard } from "./KPICard";

const DEMO_KPIS = [
  {
    label: "Leads This Month",
    value: 47,
    change: "+23%",
    changeType: "positive" as const,
    icon: Users,
    iconColor: "bg-blue-500/10 text-blue-400",
  },
  {
    label: "Calls Answered (AI)",
    value: 93,
    suffix: "%",
    change: "+5%",
    changeType: "positive" as const,
    subtext: "38 of 41 calls",
    icon: PhoneIncoming,
    iconColor: "bg-purple-500/10 text-purple-400",
  },
  {
    label: "Reviews Generated",
    value: 4.8,
    decimals: 1,
    change: "+0.3",
    changeType: "positive" as const,
    subtext: "67 total reviews",
    icon: Star,
    iconColor: "bg-amber-500/10 text-amber-400",
  },
  {
    label: "Website Visitors",
    value: 2847,
    prefix: "",
    change: "+18%",
    changeType: "positive" as const,
    icon: Globe,
    iconColor: "bg-emerald-500/10 text-emerald-400",
  },
];

export function KPIGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {DEMO_KPIS.map((kpi, i) => (
        <KPICard key={kpi.label} {...kpi} delay={i * 0.1} />
      ))}
    </div>
  );
}
