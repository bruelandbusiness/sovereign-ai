"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Settings2,
} from "lucide-react";
import {
  getNotificationConfig,
  relativeTime,
} from "@/lib/notification-types";

// ---------------------------------------------------------------------------
// Animation variants for staggered list items
// ---------------------------------------------------------------------------

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, dismiss } =
    useNotifications();

  const displayed = notifications.slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-50 bg-card sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:rounded-xl sm:border sm:border-border/50 sm:shadow-2xl"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full gradient-bg px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAsRead()}
              className="flex items-center gap-1 rounded-md px-2 py-1 min-h-[44px] text-xs text-primary hover:bg-primary/10 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="h-3 w-3" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto overscroll-contain">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bell
                  className="h-6 w-6 text-muted-foreground/60"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground">
              All caught up!
            </p>
            <p className="mt-1 max-w-[220px] text-center text-xs text-muted-foreground">
              We&apos;ll notify you when a new lead arrives, a review comes
              in, or something needs your attention.
            </p>
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {displayed.map((n) => {
              const config = getNotificationConfig(n.type);
              const TypeIcon = config.Icon;

              const content = (
                <motion.div
                  variants={itemVariants}
                  className={`group flex items-start gap-3 border-b border-border/30 px-4 py-4 sm:py-3 min-h-[56px] transition-colors hover:bg-muted/50 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Type icon in colored circle */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                  >
                    <TypeIcon
                      className={`h-4 w-4 ${config.color}`}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${!n.read ? "font-semibold" : "font-medium"}`}
                      >
                        {n.title}
                      </p>
                      {/* Action buttons - always visible on mobile, hover on desktop */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead([n.id]);
                            }}
                            className="rounded p-2 min-h-[44px] min-w-[44px] sm:p-0.5 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4 sm:h-3 sm:w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dismiss([n.id]);
                          }}
                          className="rounded p-2 min-h-[44px] min-w-[44px] sm:p-0.5 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          aria-label="Dismiss notification"
                          title="Dismiss"
                        >
                          <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/70">
                        {relativeTime(n.createdAt)}
                      </span>
                      {n.actionUrl && (
                        <span className="flex items-center gap-0.5 text-[10px] text-primary">
                          <ExternalLink
                            className="h-2.5 w-2.5"
                            aria-hidden="true"
                          />
                          View
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span
                      className="mt-2.5 h-2 w-2 shrink-0 rounded-full gradient-bg"
                      aria-hidden="true"
                    />
                  )}
                </motion.div>
              );

              if (n.actionUrl) {
                return (
                  <Link
                    key={n.id}
                    href={n.actionUrl}
                    onClick={() => {
                      if (!n.read) markAsRead([n.id]);
                      onClose();
                    }}
                    className="block"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={n.id}
                  className="cursor-default"
                  onClick={() => !n.read && markAsRead([n.id])}
                >
                  {content}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="flex items-center min-h-[44px] rounded-md px-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all notifications
          {notifications.length > 5 && (
            <span className="ml-1 text-muted-foreground">
              ({notifications.length})
            </span>
          )}
        </Link>
        <Link
          href="/dashboard/settings/account"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Notification settings"
          aria-label="Notification settings"
        >
          <Settings2 className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
