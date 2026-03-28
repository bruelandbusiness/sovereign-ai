import { cn } from "@/lib/utils";

const colors = {
  active: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  neutral: "bg-muted-foreground",
};

interface StatusDotProps {
  status: keyof typeof colors;
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("h-2 w-2 rounded-full", colors[status])}
        aria-hidden
      />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}
