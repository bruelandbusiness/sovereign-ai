"use client";

import { useCallback, useRef } from "react";
import { MessageSquare, Phone, Mail, Bot, Globe, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThreadPreview {
  id: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  channel: string;
  status: string;
  lastMessageAt: string;
  leadId: string | null;
  lastMessage: {
    content: string;
    channel: string;
    direction: string;
    createdAt: string;
  } | null;
  createdAt: string;
}

interface InboxThreadListProps {
  threads: ThreadPreview[];
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
}

// ---------------------------------------------------------------------------
// Channel icon
// ---------------------------------------------------------------------------

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  sms: <MessageSquare className="h-4 w-4 text-emerald-400" aria-hidden="true" />,
  email: <Mail className="h-4 w-4 text-blue-400" aria-hidden="true" />,
  chatbot: <Bot className="h-4 w-4 text-purple-400" aria-hidden="true" />,
  voice: <Phone className="h-4 w-4 text-amber-400" aria-hidden="true" />,
  social: <Globe className="h-4 w-4 text-pink-400" aria-hidden="true" />,
};

const CHANNEL_LABELS: Record<string, string> = {
  sms: "SMS",
  email: "Email",
  chatbot: "Chatbot",
  voice: "Voice",
  social: "Social",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border/30",
  snoozed: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const STATUS_SR_LABELS: Record<string, string> = {
  open: "Open conversation",
  closed: "Closed conversation",
  snoozed: "Snoozed conversation",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InboxThreadList({
  threads,
  selectedThreadId,
  onSelect,
}: InboxThreadListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (threads.length === 0) return;
      const currentIdx = threads.findIndex((t) => t.id === selectedThreadId);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIdx = currentIdx < threads.length - 1 ? currentIdx + 1 : 0;
        onSelect(threads[nextIdx].id);
        // Focus the next button
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
        buttons?.[nextIdx]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : threads.length - 1;
        onSelect(threads[prevIdx].id);
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
        buttons?.[prevIdx]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        onSelect(threads[0].id);
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
        buttons?.[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        onSelect(threads[threads.length - 1].id);
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
        buttons?.[threads.length - 1]?.focus();
      }
    },
    [threads, selectedThreadId, onSelect]
  );

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
        <Volume2 className="h-8 w-8 mb-3 opacity-40" aria-hidden="true" />
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="text-xs mt-1">Messages from your chatbot, email, SMS, and voice channels will appear here as customers reach out.</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Conversation threads"
      onKeyDown={handleKeyDown}
      className="space-y-0.5"
    >
      {threads.map((thread) => {
        const isSelected = thread.id === selectedThreadId;
        const displayName =
          thread.contactName ||
          thread.contactPhone ||
          thread.contactEmail ||
          "Unknown Contact";
        const channelLabel = CHANNEL_LABELS[thread.channel] || thread.channel;

        return (
          <button
            key={thread.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(thread.id)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg transition-colors",
              isSelected
                ? "bg-primary/10 border border-primary/30"
                : "hover:bg-white/[0.04] border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0" aria-hidden="true">
                {CHANNEL_ICONS[thread.channel] ?? (
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {displayName}
                  </span>
                  <time
                    dateTime={thread.lastMessageAt}
                    className="text-[10px] text-muted-foreground shrink-0"
                  >
                    {formatTimeAgo(thread.lastMessageAt)}
                  </time>
                </div>
                <span className="sr-only">via {channelLabel}</span>
                {thread.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {thread.lastMessage.direction === "outbound" && "You: "}
                    {thread.lastMessage.content}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] shrink-0",
                  STATUS_COLORS[thread.status] ?? ""
                )}
              >
                {thread.status}
                <span className="sr-only">
                  {STATUS_SR_LABELS[thread.status] || `Status: ${thread.status}`}
                </span>
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
