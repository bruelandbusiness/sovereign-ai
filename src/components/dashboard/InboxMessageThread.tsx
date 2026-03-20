"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  MessageSquare,
  Phone,
  Mail,
  Bot,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThreadInfo {
  id: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  channel: string;
  status: string;
  lastMessageAt: string;
  leadId: string | null;
}

interface ThreadMessage {
  id: string;
  channel: string;
  direction: string;
  senderName: string | null;
  senderContact: string | null;
  content: string;
  metadata: string | null;
  createdAt: string;
}

interface InboxMessageThreadProps {
  thread: ThreadInfo;
  messages: ThreadMessage[];
  onSendReply: (message: string) => Promise<void>;
  onUpdateStatus: (status: string) => Promise<void>;
  isSending: boolean;
}

// ---------------------------------------------------------------------------
// Channel icon + labels
// ---------------------------------------------------------------------------

const CHANNEL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  sms: { label: "SMS", icon: <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> },
  email: { label: "Email", icon: <Mail className="h-3.5 w-3.5" aria-hidden="true" /> },
  chatbot: { label: "Chatbot", icon: <Bot className="h-3.5 w-3.5" aria-hidden="true" /> },
  voice: { label: "Voice", icon: <Phone className="h-3.5 w-3.5" aria-hidden="true" /> },
  social: { label: "Social", icon: <Globe className="h-3.5 w-3.5" aria-hidden="true" /> },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InboxMessageThread({
  thread,
  messages,
  onSendReply,
  onUpdateStatus,
  isSending,
}: InboxMessageThreadProps) {
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const displayName =
    thread.contactName ||
    thread.contactPhone ||
    thread.contactEmail ||
    "Unknown Contact";

  const channelInfo = CHANNEL_LABELS[thread.channel] ?? {
    label: thread.channel,
    icon: <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />,
  };

  async function handleSend() {
    if (!replyText.trim() || isSending) return;
    const text = replyText.trim();
    setReplyText("");
    await onSendReply(text);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {channelInfo.icon}
            <span className="text-[10px] uppercase font-semibold">
              {channelInfo.label}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            {thread.contactPhone && thread.contactName && (
              <p className="text-[11px] text-muted-foreground font-mono">
                {thread.contactPhone}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0" role="toolbar" aria-label="Conversation actions">
          {thread.status === "open" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus("snoozed")}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                Snooze
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus("closed")}
                className="text-xs"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                Close
              </Button>
            </>
          )}
          {thread.status === "closed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus("open")}
              className="text-xs"
            >
              Reopen
            </Button>
          )}
          {thread.status === "snoozed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus("open")}
              className="text-xs"
            >
              Unsnooze
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        role="log"
        aria-label={`Conversation with ${displayName}`}
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-3 opacity-30" aria-hidden="true" />
            <p className="text-sm">No messages in this conversation yet. Send a reply below to get started.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOutbound = msg.direction === "outbound";
          return (
            <div
              key={msg.id}
              className={cn(
                "max-w-[75%] rounded-xl px-3.5 py-2.5",
                isOutbound
                  ? "ml-auto bg-primary/20 border border-primary/30"
                  : "mr-auto bg-white/[0.04] border border-white/[0.06]"
              )}
            >
              <span className="sr-only">
                {isOutbound ? "Sent message" : "Received message"}
                {msg.senderName ? ` from ${msg.senderName}` : ""}
              </span>
              {msg.senderName && (
                <p className="text-[10px] font-semibold text-muted-foreground mb-0.5" aria-hidden="true">
                  {msg.senderName}
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">
                {msg.content}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <time
                  dateTime={msg.createdAt}
                  className="text-[10px] text-muted-foreground"
                >
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
                {msg.channel !== thread.channel && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {msg.channel}
                    <span className="sr-only"> channel</span>
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div className="border-t border-white/[0.06] p-3">
        <label htmlFor={`reply-${thread.id}`} className="sr-only">
          Reply to {displayName} via {channelInfo.label}
        </label>
        <div className="flex gap-2">
          <Textarea
            id={`reply-${thread.id}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply via ${channelInfo.label}...`}
            rows={2}
            className="text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!replyText.trim() || isSending}
            className="shrink-0 self-end"
            size="sm"
            aria-label={isSending ? "Sending reply" : "Send reply"}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
