"use client";

import Link from "next/link";
import { X, CheckCircle2, AlertCircle, Info, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./toast-context";

const DEFAULT_ICONS = {
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

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const Icon = t.icon ?? DEFAULT_ICONS[t.type];
          const iconColorClass = t.iconColor ?? "";

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm max-w-sm ${COLORS[t.type]}`}
            >
              <div className={`mt-0.5 shrink-0 ${iconColorClass}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t.message}
                </p>
                {t.action && (
                  <Link
                    href={t.action.href}
                    onClick={() => dismiss(t.id)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {t.action.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Dismiss: ${t.message}`}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
