"use client";

import { useRef, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useToast } from "@/components/ui/toast-context";
import {
  getNotificationConfig,
  TOAST_WORTHY_TYPES,
} from "@/lib/notification-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications() {
  const { toast } = useToast();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const { data, error, mutate, isLoading } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      shouldRetryOnError: true,
      onSuccess(freshData) {
        // On first load, just populate the seen set (no toasts)
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
          for (const n of freshData) {
            seenIdsRef.current.add(n.id);
          }
          return;
        }

        // On subsequent polls, toast any new toast-worthy notifications
        for (const n of freshData) {
          if (seenIdsRef.current.has(n.id)) continue;
          seenIdsRef.current.add(n.id);

          if (!n.read && TOAST_WORTHY_TYPES.has(n.type)) {
            const config = getNotificationConfig(n.type);
            toast(n.title, {
              type: "success",
              icon: config.Icon,
              iconColor: config.color,
              action:
                config.toastAction && (n.actionUrl ?? config.toastRoute)
                  ? {
                      label: config.toastAction,
                      href: n.actionUrl ?? config.toastRoute ?? "#",
                    }
                  : undefined,
              duration: 6000,
            });
          }
        }
      },
    }
  );

  const notifications = useMemo(() => data ?? [], [data]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ------ Mark as read (optimistic) ------
  const markAsRead = useCallback(
    async (ids?: string[]) => {
      const optimisticData = notifications.map((n) => {
        if (ids ? ids.includes(n.id) : !n.read) {
          return { ...n, read: true };
        }
        return n;
      });
      mutate(optimisticData, false);

      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ids ? { ids } : {}),
        });
      } catch {
        // Revert optimistic update on failure
      }
      mutate();
    },
    [notifications, mutate]
  );

  // ------ Dismiss (optimistic) ------
  const dismiss = useCallback(
    async (ids: string[]) => {
      const optimisticData = notifications.filter(
        (n) => !ids.includes(n.id)
      );
      mutate(optimisticData, false);

      try {
        await fetch("/api/notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      } catch {
        // Revert optimistic update on failure
      }
      mutate();
    },
    [notifications, mutate]
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    dismiss,
    isLoading,
    error,
    mutate,
  };
}
