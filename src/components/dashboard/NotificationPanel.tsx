"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Bell, X } from "lucide-react";

const typeIcons: Record<string, string> = {
  lead: "text-blue-400",
  review: "text-amber-400",
  content: "text-purple-400",
  booking: "text-teal-400",
  system: "text-muted-foreground",
};

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border/50 bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAsRead()}
              className="text-xs text-primary hover:text-primary/80"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <div
              key={n.id}
              className={`border-b border-border/30 px-4 py-3 transition-colors hover:bg-muted/50 ${
                !n.read ? "bg-primary/5" : ""
              }`}
              onClick={() => !n.read && markAsRead([n.id])}
            >
              <div className="flex items-start gap-2">
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full gradient-bg" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${typeIcons[n.type] || ""}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
