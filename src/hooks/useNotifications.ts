"use client";

import useSWR from "swr";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useNotifications() {
  const { data, mutate, isLoading } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30000 }
  );

  const notifications = data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (ids?: string[]) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    });
    mutate();
  };

  return { notifications, unreadCount, markAsRead, isLoading, mutate };
}
