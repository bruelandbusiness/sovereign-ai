"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Inbox,
  MessageSquare,
  Phone,
  Mail,
  Bot,
  Search,
  ChevronLeft,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  Check,
  CheckCheck,
  Eye,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = "sms" | "email" | "chatbot" | "voice";
type MessageStatus = "sent" | "delivered" | "read";

interface DemoMessage {
  id: string;
  channel: Channel;
  direction: "inbound" | "outbound";
  senderName: string | null;
  content: string;
  createdAt: string;
  status: MessageStatus;
  aiHandled: boolean;
}

interface DemoConversation {
  id: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  channel: Channel;
  status: "open" | "closed" | "snoozed";
  unread: boolean;
  lastMessageAt: string;
  messages: DemoMessage[];
}

// ---------------------------------------------------------------------------
// Channel config
// ---------------------------------------------------------------------------

const CHANNEL_CONFIG: Record<
  Channel,
  { label: string; icon: React.ReactNode; color: string }
> = {
  sms: {
    label: "SMS",
    icon: <MessageSquare className="h-4 w-4" aria-hidden="true" />,
    color: "text-emerald-400",
  },
  email: {
    label: "Email",
    icon: <Mail className="h-4 w-4" aria-hidden="true" />,
    color: "text-blue-400",
  },
  chatbot: {
    label: "Chat",
    icon: <Bot className="h-4 w-4" aria-hidden="true" />,
    color: "text-purple-400",
  },
  voice: {
    label: "Phone",
    icon: <Phone className="h-4 w-4" aria-hidden="true" />,
    color: "text-amber-400",
  },
};

const QUICK_RESPONSES = [
  "Thanks for reaching out! Let me look into that for you.",
  "I'd be happy to help. Can you provide more details?",
  "Our team will follow up within 24 hours.",
  "Great question! Here's what I recommend...",
  "Thanks for your patience. We're working on this now.",
];

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "conv-1",
    contactName: "Sarah Chen",
    contactPhone: "+1 (555) 234-5678",
    contactEmail: "sarah.chen@email.com",
    channel: "sms",
    status: "open",
    unread: true,
    lastMessageAt: minutesAgo(2),
    messages: [
      {
        id: "m1a",
        channel: "sms",
        direction: "inbound",
        senderName: "Sarah Chen",
        content:
          "Hi! I saw your ad on Facebook and I'm interested in learning more about your services.",
        createdAt: minutesAgo(45),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m1b",
        channel: "sms",
        direction: "outbound",
        senderName: null,
        content:
          "Hi Sarah! Thanks for reaching out. We'd love to help. What specific services are you interested in?",
        createdAt: minutesAgo(40),
        status: "read",
        aiHandled: true,
      },
      {
        id: "m1c",
        channel: "sms",
        direction: "inbound",
        senderName: "Sarah Chen",
        content:
          "I'm looking at the premium package. Can you tell me about pricing and what's included?",
        createdAt: minutesAgo(15),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m1d",
        channel: "sms",
        direction: "outbound",
        senderName: null,
        content:
          "Our premium package starts at $299/month and includes AI-powered lead management, automated follow-ups, multi-channel inbox, and analytics dashboard. Would you like to schedule a demo?",
        createdAt: minutesAgo(10),
        status: "delivered",
        aiHandled: true,
      },
      {
        id: "m1e",
        channel: "sms",
        direction: "inbound",
        senderName: "Sarah Chen",
        content: "Yes, that sounds great! Can we do Tuesday at 2pm?",
        createdAt: minutesAgo(2),
        status: "read",
        aiHandled: false,
      },
    ],
  },
  {
    id: "conv-2",
    contactName: "Marcus Johnson",
    contactPhone: "+1 (555) 876-5432",
    contactEmail: "marcus.j@company.com",
    channel: "email",
    status: "open",
    unread: true,
    lastMessageAt: minutesAgo(18),
    messages: [
      {
        id: "m2a",
        channel: "email",
        direction: "inbound",
        senderName: "Marcus Johnson",
        content:
          "Subject: Partnership Inquiry\n\nHello, I represent a franchise group with 12 locations and we're looking for an AI solution to manage our customer communications across all sites. Can we discuss enterprise pricing?",
        createdAt: minutesAgo(120),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m2b",
        channel: "email",
        direction: "outbound",
        senderName: null,
        content:
          "Hi Marcus, thank you for your interest! Enterprise plans for multi-location businesses start at $199/location/month with volume discounts. I'll have our partnerships team reach out to schedule a detailed walkthrough. In the meantime, is there anything specific you'd like to know?",
        createdAt: minutesAgo(90),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m2c",
        channel: "email",
        direction: "inbound",
        senderName: "Marcus Johnson",
        content:
          "That pricing sounds competitive. Our main concern is integration with our existing CRM (Salesforce). Do you support that? Also, what's the onboarding timeline like for multi-location setups?",
        createdAt: minutesAgo(18),
        status: "read",
        aiHandled: false,
      },
    ],
  },
  {
    id: "conv-3",
    contactName: "Emily Rodriguez",
    contactPhone: null,
    contactEmail: "emily.r@gmail.com",
    channel: "chatbot",
    status: "open",
    unread: false,
    lastMessageAt: minutesAgo(35),
    messages: [
      {
        id: "m3a",
        channel: "chatbot",
        direction: "inbound",
        senderName: "Emily Rodriguez",
        content: "How do I reset my password?",
        createdAt: minutesAgo(38),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m3b",
        channel: "chatbot",
        direction: "outbound",
        senderName: null,
        content:
          "You can reset your password by going to Settings > Account > Change Password. If you're locked out, click 'Forgot Password' on the login screen and we'll send a reset link to your email.",
        createdAt: minutesAgo(37),
        status: "read",
        aiHandled: true,
      },
      {
        id: "m3c",
        channel: "chatbot",
        direction: "inbound",
        senderName: "Emily Rodriguez",
        content: "Perfect, got it working. Thanks!",
        createdAt: minutesAgo(35),
        status: "read",
        aiHandled: false,
      },
    ],
  },
  {
    id: "conv-4",
    contactName: "David Park",
    contactPhone: "+1 (555) 345-6789",
    contactEmail: null,
    channel: "voice",
    status: "snoozed",
    unread: false,
    lastMessageAt: minutesAgo(180),
    messages: [
      {
        id: "m4a",
        channel: "voice",
        direction: "inbound",
        senderName: "David Park",
        content:
          "[Voicemail transcript] Hi, this is David Park calling about the proposal you sent over last week. I have a few questions about the implementation timeline. Please call me back at your earliest convenience.",
        createdAt: minutesAgo(180),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m4b",
        channel: "sms",
        direction: "outbound",
        senderName: null,
        content:
          "Hi David, thanks for your voicemail. I'll call you back shortly to discuss the implementation timeline. Would after 3pm today work?",
        createdAt: minutesAgo(170),
        status: "delivered",
        aiHandled: false,
      },
    ],
  },
  {
    id: "conv-5",
    contactName: "Aisha Thompson",
    contactPhone: "+1 (555) 987-1234",
    contactEmail: "aisha.t@startup.io",
    channel: "sms",
    status: "open",
    unread: false,
    lastMessageAt: minutesAgo(60),
    messages: [
      {
        id: "m5a",
        channel: "sms",
        direction: "inbound",
        senderName: "Aisha Thompson",
        content: "Hey, is there a free trial available?",
        createdAt: minutesAgo(65),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m5b",
        channel: "sms",
        direction: "outbound",
        senderName: null,
        content:
          "Hi Aisha! Yes, we offer a 14-day free trial with full access to all features. No credit card required. Would you like me to set one up for you?",
        createdAt: minutesAgo(63),
        status: "read",
        aiHandled: true,
      },
      {
        id: "m5c",
        channel: "sms",
        direction: "inbound",
        senderName: "Aisha Thompson",
        content: "That would be great, sign me up!",
        createdAt: minutesAgo(60),
        status: "read",
        aiHandled: false,
      },
    ],
  },
  {
    id: "conv-6",
    contactName: "James Wilson",
    contactPhone: "+1 (555) 456-7890",
    contactEmail: "j.wilson@enterprise.com",
    channel: "email",
    status: "closed",
    unread: false,
    lastMessageAt: minutesAgo(1440),
    messages: [
      {
        id: "m6a",
        channel: "email",
        direction: "inbound",
        senderName: "James Wilson",
        content:
          "Subject: Invoice Question\n\nHi, I received invoice #4521 but the amount doesn't match what we agreed upon. Can you please review?",
        createdAt: minutesAgo(2880),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m6b",
        channel: "email",
        direction: "outbound",
        senderName: null,
        content:
          "Hi James, I apologize for the confusion. I've reviewed the invoice and issued a corrected version. The updated invoice #4521-R reflects the agreed-upon amount of $2,400. Please let me know if you have any other questions.",
        createdAt: minutesAgo(1440),
        status: "read",
        aiHandled: false,
      },
    ],
  },
  {
    id: "conv-7",
    contactName: "Lisa Zhang",
    contactPhone: null,
    contactEmail: "lisa.zhang@design.co",
    channel: "chatbot",
    status: "open",
    unread: true,
    lastMessageAt: minutesAgo(5),
    messages: [
      {
        id: "m7a",
        channel: "chatbot",
        direction: "inbound",
        senderName: "Lisa Zhang",
        content:
          "I'm having trouble uploading files larger than 10MB. Is there a file size limit?",
        createdAt: minutesAgo(8),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m7b",
        channel: "chatbot",
        direction: "outbound",
        senderName: null,
        content:
          "The current file size limit is 25MB per file. If you're experiencing issues with 10MB files, it might be a browser cache issue. Try clearing your cache or using a different browser. If the problem persists, I can escalate this to our technical team.",
        createdAt: minutesAgo(7),
        status: "read",
        aiHandled: true,
      },
      {
        id: "m7c",
        channel: "chatbot",
        direction: "inbound",
        senderName: "Lisa Zhang",
        content:
          "Cleared cache and still getting the error. Can you escalate it please?",
        createdAt: minutesAgo(5),
        status: "read",
        aiHandled: false,
      },
    ],
  },
  {
    id: "conv-8",
    contactName: "Robert Kim",
    contactPhone: "+1 (555) 321-0987",
    contactEmail: null,
    channel: "sms",
    status: "open",
    unread: false,
    lastMessageAt: minutesAgo(95),
    messages: [
      {
        id: "m8a",
        channel: "sms",
        direction: "inbound",
        senderName: "Robert Kim",
        content: "Can I upgrade my plan mid-billing cycle?",
        createdAt: minutesAgo(100),
        status: "read",
        aiHandled: false,
      },
      {
        id: "m8b",
        channel: "sms",
        direction: "outbound",
        senderName: null,
        content:
          "Yes! You can upgrade anytime. The price difference will be prorated for the remaining days in your billing cycle. Go to Settings > Billing > Change Plan, or I can help you upgrade right now.",
        createdAt: minutesAgo(98),
        status: "read",
        aiHandled: true,
      },
      {
        id: "m8c",
        channel: "sms",
        direction: "inbound",
        senderName: "Robert Kim",
        content: "Great, I'll do it from settings. Thanks!",
        createdAt: minutesAgo(95),
        status: "read",
        aiHandled: false,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function shouldShowTimestamp(
  current: DemoMessage,
  previous: DemoMessage | undefined
): boolean {
  if (!previous) return true;
  const diff =
    new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime();
  return diff > 10 * 60_000; // 10 minutes gap
}

// ---------------------------------------------------------------------------
// Status icon for messages
// ---------------------------------------------------------------------------

function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "sent":
      return (
        <Check
          className="h-3 w-3 text-muted-foreground"
          aria-label="Sent"
        />
      );
    case "delivered":
      return (
        <CheckCheck
          className="h-3 w-3 text-muted-foreground"
          aria-label="Delivered"
        />
      );
    case "read":
      return (
        <Eye
          className="h-3 w-3 text-blue-400"
          aria-label="Read"
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Conversation List Item
// ---------------------------------------------------------------------------

function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: DemoConversation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const channelCfg = CHANNEL_CONFIG[conversation.channel];
  const lastMsgPreview = lastMsg
    ? lastMsg.direction === "outbound"
      ? `You: ${lastMsg.content}`
      : lastMsg.content
    : "";

  return (
    <button
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg transition-all duration-150 group",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-white/[0.04] border border-transparent"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold",
              isSelected
                ? "bg-primary/20 text-primary"
                : "bg-white/[0.06] text-muted-foreground"
            )}
          >
            {getInitials(conversation.contactName)}
          </div>
          {conversation.unread && (
            <span
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-background"
              aria-label="Unread messages"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm truncate",
                conversation.unread ? "font-semibold" : "font-medium"
              )}
            >
              {conversation.contactName}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatTimeAgo(conversation.lastMessageAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("shrink-0", channelCfg.color)}>
              {channelCfg.icon}
            </span>
            <p
              className={cn(
                "text-xs truncate",
                conversation.unread
                  ? "text-foreground/80"
                  : "text-muted-foreground"
              )}
            >
              {lastMsgPreview}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Conversation Sidebar
// ---------------------------------------------------------------------------

function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  channelFilter,
  onChannelFilterChange,
}: {
  conversations: DemoConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  channelFilter: Channel | "all";
  onChannelFilterChange: (c: Channel | "all") => void;
}) {
  const filtered = useMemo(() => {
    let result = conversations;
    if (channelFilter !== "all") {
      result = result.filter((c) => c.channel === channelFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.contactName.toLowerCase().includes(q) ||
          (c.contactEmail ?? "").toLowerCase().includes(q) ||
          (c.contactPhone ?? "").includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return result;
  }, [conversations, channelFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-9 text-sm"
            aria-label="Search conversations"
          />
        </div>

        {/* Channel filter pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto">
          {(["all", "sms", "email", "chatbot", "voice"] as const).map(
            (ch) => {
              const isActive = channelFilter === ch;
              return (
                <button
                  key={ch}
                  onClick={() => onChannelFilterChange(ch)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-white/[0.04] text-muted-foreground border border-transparent hover:bg-white/[0.08]"
                  )}
                  aria-pressed={isActive}
                >
                  {ch !== "all" && (
                    <span className={CHANNEL_CONFIG[ch].color}>
                      {CHANNEL_CONFIG[ch].icon}
                    </span>
                  )}
                  {ch === "all"
                    ? "All"
                    : CHANNEL_CONFIG[ch].label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Thread list */}
      <div
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
        role="listbox"
        aria-label="Conversation threads"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Search
              className="h-8 w-8 mb-3 opacity-30"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">No conversations found</p>
            <p className="text-xs mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onSelect={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>

      {/* Count */}
      <div className="px-3 py-2 border-t border-white/[0.06] text-[11px] text-muted-foreground">
        {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
        {channelFilter !== "all" &&
          ` in ${CHANNEL_CONFIG[channelFilter].label}`}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Thread View
// ---------------------------------------------------------------------------

function MessageThreadView({
  conversation,
  onSendReply,
  isSending,
  onBack,
}: {
  conversation: DemoConversation;
  onSendReply: (msg: string, channel: Channel) => void;
  isSending: boolean;
  onBack: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState<Channel>(
    conversation.channel
  );
  const [aiAutoReply, setAiAutoReply] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const channelCfg = CHANNEL_CONFIG[conversation.channel];

  function handleSend() {
    if (!replyText.trim() || isSending) return;
    onSendReply(replyText.trim(), replyChannel);
    setReplyText("");
    setShowTemplates(false);
  }

  function handleTemplateSelect(template: string) {
    setReplyText(template);
    setShowTemplates(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        {/* Mobile back */}
        <button
          onClick={onBack}
          className="lg:hidden flex items-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold shrink-0">
          {getInitials(conversation.contactName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">
              {conversation.contactName}
            </h3>
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 shrink-0"
            >
              <span className={cn("mr-1", channelCfg.color)}>
                {channelCfg.icon}
              </span>
              {channelCfg.label}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {conversation.contactPhone ?? conversation.contactEmail ?? ""}
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2 shrink-0"
          role="toolbar"
          aria-label="Conversation actions"
        >
          {conversation.status === "open" && (
            <>
              <Button variant="outline" size="sm" className="text-xs hidden sm:inline-flex">
                <Clock
                  className="h-3 w-3 mr-1"
                  aria-hidden="true"
                />
                Snooze
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <CheckCircle2
                  className="h-3 w-3 mr-1"
                  aria-hidden="true"
                />
                Close
              </Button>
            </>
          )}
          {conversation.status === "closed" && (
            <Button variant="outline" size="sm" className="text-xs">
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        role="log"
        aria-label={`Conversation with ${conversation.contactName}`}
        aria-live="polite"
      >
        {conversation.messages.map((msg, idx) => {
          const isOutbound = msg.direction === "outbound";
          const prev = conversation.messages[idx - 1];
          const showTime = shouldShowTimestamp(msg, prev);
          const msgChannelCfg = CHANNEL_CONFIG[msg.channel];

          return (
            <div key={msg.id}>
              {/* Timestamp divider */}
              {showTime && (
                <div className="flex items-center justify-center my-3">
                  <span className="text-[10px] text-muted-foreground bg-background px-3 py-0.5 rounded-full border border-white/[0.06]">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              )}

              {/* Message bubble */}
              <div
                className={cn(
                  "flex mb-1.5",
                  isOutbound ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5",
                    isOutbound
                      ? "bg-primary/15 border border-primary/25 rounded-br-md"
                      : "bg-white/[0.04] border border-white/[0.06] rounded-bl-md"
                  )}
                >
                  {/* Sender name for inbound */}
                  {!isOutbound && msg.senderName && (
                    <p
                      className="text-[10px] font-semibold text-muted-foreground mb-0.5"
                      aria-hidden="true"
                    >
                      {msg.senderName}
                    </p>
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <time
                      dateTime={msg.createdAt}
                      className="text-[10px] text-muted-foreground"
                    >
                      {formatMessageTime(msg.createdAt)}
                    </time>

                    {/* Channel badge if different from conversation channel */}
                    {msg.channel !== conversation.channel && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0"
                      >
                        <span className={cn("mr-0.5", msgChannelCfg.color)}>
                          {msgChannelCfg.icon}
                        </span>
                        {msgChannelCfg.label}
                      </Badge>
                    )}

                    {/* AI handled badge */}
                    {msg.aiHandled && isOutbound && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0 rounded-full border border-purple-500/20">
                        <Sparkles
                          className="h-2.5 w-2.5"
                          aria-hidden="true"
                        />
                        AI handled
                      </span>
                    )}

                    {/* Message status for outbound */}
                    {isOutbound && (
                      <MessageStatusIcon status={msg.status} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply composer */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {/* Toolbar row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Channel selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              Reply via
            </span>
            {(["sms", "email", "chatbot"] as const).map((ch) => {
              const cfg = CHANNEL_CONFIG[ch];
              const isActive = replyChannel === ch;
              return (
                <button
                  key={ch}
                  onClick={() => setReplyChannel(ch)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent"
                  )}
                  aria-pressed={isActive}
                  aria-label={`Reply via ${cfg.label}`}
                >
                  <span className={isActive ? "" : cfg.color}>
                    {cfg.icon}
                  </span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Quick templates */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                aria-expanded={showTemplates}
                aria-label="Quick response templates"
              >
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Templates</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    showTemplates && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>

              {showTemplates && (
                <div className="absolute bottom-8 right-0 w-80 bg-popover border border-white/[0.1] rounded-lg shadow-xl z-10 p-1.5">
                  {QUICK_RESPONSES.map((tmpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleTemplateSelect(tmpl)}
                      className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Bot className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Let AI respond
              </span>
              <Switch
                size="sm"
                checked={aiAutoReply}
                onCheckedChange={setAiAutoReply}
                aria-label="Let AI respond automatically"
              />
            </label>
          </div>
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <label
            htmlFor={`reply-${conversation.id}`}
            className="sr-only"
          >
            Reply to {conversation.contactName} via{" "}
            {CHANNEL_CONFIG[replyChannel].label}
          </label>
          <Textarea
            id={`reply-${conversation.id}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={
              aiAutoReply
                ? "AI will respond automatically..."
                : `Type a message via ${CHANNEL_CONFIG[replyChannel].label}...`
            }
            rows={2}
            disabled={aiAutoReply}
            className={cn(
              "text-sm resize-none min-h-[44px]",
              aiAutoReply && "opacity-50"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!replyText.trim() || isSending || aiAutoReply}
            className="shrink-0 self-end"
            size="sm"
            aria-label={isSending ? "Sending reply" : "Send reply"}
          >
            {isSending ? (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyConversationView() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] mb-4">
        <Inbox className="h-8 w-8 opacity-30" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium">Select a conversation to view messages</p>
      <p className="text-xs mt-1.5 max-w-xs text-center">
        Choose a conversation from the list to read messages and reply to your
        customers across SMS, email, chat, and phone.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function InboxPage() {
  const [conversations, setConversations] = useState(DEMO_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [isSending, setIsSending] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const unreadCount = conversations.filter((c) => c.unread).length;

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: false } : c))
    );
  }, []);

  const handleSendReply = useCallback(
    (message: string, channel: Channel) => {
      if (!selectedId) return;
      setIsSending(true);

      // Simulate sending delay
      const newMsgId = `m-${Date.now()}`;
      const now = new Date().toISOString();

      setTimeout(() => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: newMsgId,
                      channel,
                      direction: "outbound" as const,
                      senderName: null,
                      content: message,
                      createdAt: now,
                      status: "sent" as MessageStatus,
                      aiHandled: false,
                    },
                  ],
                  lastMessageAt: now,
                }
              : c
          )
        );

        setIsSending(false);

        // Simulate delivery after 1s
        setTimeout(() => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === newMsgId
                        ? { ...m, status: "delivered" as MessageStatus }
                        : m
                    ),
                  }
                : c
            )
          );
        }, 1000);
      }, 500);
    },
    [selectedId]
  );

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background page-enter">
        <Header variant="minimal" />

        <main className="flex-1 py-6 sm:py-8">
          <Container>
            {/* Page header */}
            <div className="flex items-center gap-3 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft
                    className="mr-1.5 h-4 w-4"
                    aria-hidden="true"
                  />
                  Dashboard
                </Button>
              </Link>
              <Inbox
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[calc(100vh-220px)]">
              {/* Left: Conversation list */}
              <Card
                className={cn(
                  "border-white/[0.06] overflow-hidden",
                  selectedId ? "hidden lg:flex lg:flex-col" : "flex flex-col"
                )}
              >
                <ConversationSidebar
                  conversations={conversations}
                  selectedId={selectedId}
                  onSelect={handleSelectConversation}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  channelFilter={channelFilter}
                  onChannelFilterChange={setChannelFilter}
                />
              </Card>

              {/* Right: Conversation detail */}
              <Card
                className={cn(
                  "border-white/[0.06] overflow-hidden min-h-[500px]",
                  !selectedId ? "hidden lg:flex" : "flex"
                )}
              >
                {selectedConversation ? (
                  <MessageThreadView
                    conversation={selectedConversation}
                    onSendReply={handleSendReply}
                    isSending={isSending}
                    onBack={() => setSelectedId(null)}
                  />
                ) : (
                  <EmptyConversationView />
                )}
              </Card>
            </div>
          </Container>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
