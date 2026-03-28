"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastAction {
  label: string;
  href: string;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  icon?: LucideIcon;
  iconColor?: string;
  action?: ToastAction;
}

interface ToastOptions {
  type?: ToastType;
  icon?: LucideIcon;
  iconColor?: string;
  action?: ToastAction;
  /** Duration in ms before auto-dismiss. Default: 5000 */
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, typeOrOptions?: ToastType | ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, typeOrOptions?: ToastType | ToastOptions) => {
      const id = crypto.randomUUID();

      let type: ToastType = "info";
      let icon: LucideIcon | undefined;
      let iconColor: string | undefined;
      let action: ToastAction | undefined;
      let duration = 5000;

      if (typeof typeOrOptions === "string") {
        type = typeOrOptions;
      } else if (typeOrOptions) {
        type = typeOrOptions.type ?? "info";
        icon = typeOrOptions.icon;
        iconColor = typeOrOptions.iconColor;
        action = typeOrOptions.action;
        duration = typeOrOptions.duration ?? 5000;
      }

      setToasts((prev) => [
        ...prev,
        { id, message, type, icon, iconColor, action },
      ]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export type { Toast, ToastType, ToastAction, ToastOptions };
