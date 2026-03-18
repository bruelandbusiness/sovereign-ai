"use client";

import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToast } from "./toast-context";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-primary/30 bg-primary/10 text-primary",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${COLORS[t.type]}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium text-foreground">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 shrink-0 rounded p-0.5 hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
