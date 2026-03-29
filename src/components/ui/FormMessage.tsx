"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

type FormMessageType = "success" | "error" | "warning";

interface FormMessageProps {
  type: FormMessageType;
  message: string;
  className?: string;
}

const config: Record<
  FormMessageType,
  { icon: typeof AlertCircle; bg: string; text: string; border: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/20",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-500/20",
  },
};

export function FormMessage({ type, message, className }: FormMessageProps) {
  const { icon: Icon, bg, text, border } = config[type];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        bg,
        text,
        border,
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
