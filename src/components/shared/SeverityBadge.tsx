import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import type { FindingSeverity } from "@/types/audit";

const config = {
  critical: {
    icon: AlertCircle,
    bg: "bg-red-500/10",
    text: "text-red-400",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    label: "Warning",
  },
  good: {
    icon: CheckCircle,
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    label: "Good",
  },
};

interface SeverityBadgeProps {
  severity: FindingSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const { icon: Icon, bg, text, label } = config[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        bg,
        text,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
