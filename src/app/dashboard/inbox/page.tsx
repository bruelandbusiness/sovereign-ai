"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Inbox,
  MessageSquare,
  Phone,
  Mail,
  Bot,
  Globe,
  Filter,
  ChevronLeft,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InboxThreadList,
  type ThreadPreview,
} from "@/components/dashboard/InboxThreadList";
import { InboxMessageThread } from "@/components/dashboard/InboxMessageThread";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InboxData {
  threads: ThreadPreview[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface ThreadDetailData {
  thread: {
    id: string;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    channel: string;
    status: string;
    lastMessageAt: string;
    leadId: string | null;
  };
  messages: {
    id: string;
    channel: string;
    direction: string;
    senderName: string | null;
    senderContact: string | null;
    content: string;
    metadata: string | null;
    createdAt: string;
  }[];
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
// Component
// ---------------------------------------------------------------------------

export default function InboxPage() {
  const { toast } = useToast();
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isSending, setIsSending] = useState(false);

  // Fetch threads
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "30",
    status: statusFilter,
    ...(channelFilter !== "all" ? { channel: channelFilter } : {}),
  });

  const {
    data: inboxData,
    isLoading: threadsLoading,
    error: threadsError,
    mutate: mutateThreads,
  } = useSWR<InboxData>(
    `/api/dashboard/inbox?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  // Fetch selected thread detail
  const {
    data: threadDetail,
    isLoading: detailLoading,
    error: detailError,
    mutate: mutateDetail,
  } = useSWR<ThreadDetailData>(
    selectedThreadId
      ? `/api/dashboard/inbox/${selectedThreadId}`
      : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const threads = inboxData?.threads ?? [];
  const pagination = inboxData?.pagination;

  const handleSendReply = useCallback(
    async (message: string) => {
      if (!selectedThreadId) return;
      setIsSending(true);
      try {
        const res = await fetch(`/api/dashboard/inbox/${selectedThreadId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        if (!res.ok) throw new Error("Send failed");
        await mutateDetail();
        await mutateThreads();
      } catch {
        toast("We couldn't send your reply. Please try again.", "error");
      } finally {
        setIsSending(false);
      }
    },
    [selectedThreadId, mutateDetail, mutateThreads, toast]
  );

  const handleUpdateStatus = useCallback(
    async (status: string) => {
      if (!selectedThreadId) return;
      try {
        const res = await fetch(`/api/dashboard/inbox/${selectedThreadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Update failed");
        await mutateDetail();
        await mutateThreads();
        toast(`Conversation marked as ${status}`, "success");
      } catch {
        toast("We couldn't update the conversation status. Please try again.", "error");
      }
    },
    [selectedThreadId, mutateDetail, mutateThreads, toast]
  );

  // Error
  if (threadsError) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="p-4 text-red-600">Failed to load inbox data. Please try refreshing.</div>
        </main>
      </div>
    );
  }

  // Loading skeleton
  if (threadsLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" aria-busy="true" aria-label="Loading inbox">
          <Container>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-9 w-80 animate-pulse rounded-lg bg-muted" />
              <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[600px]">
              <Card className="border-white/[0.06] p-2 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />
                ))}
              </Card>
              <Card className="border-white/[0.06] flex items-center justify-center">
                <div className="h-12 w-48 animate-pulse rounded-lg bg-muted/30" />
              </Card>
            </div>
            <span className="sr-only">Loading inbox conversations, please wait</span>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Button>
            </Link>
            <Inbox className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
            {pagination && (
              <span className="text-sm text-muted-foreground ml-2">
                {pagination.totalCount} conversation{pagination.totalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Channel filter tabs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-4">
            <Tabs value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
              <TabsList aria-label="Filter by channel">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="chatbot">
                  <Bot className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="voice">
                  <Phone className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="social">
                  <Globe className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Social
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status filter */}
            <fieldset className="flex items-center gap-1.5 border-none p-0 m-0">
              <legend className="sr-only">Filter by conversation status</legend>
              <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {["open", "snoozed", "closed", "all"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "ghost"}
                  size="sm"
                  aria-pressed={statusFilter === s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className="text-xs capitalize"
                >
                  {s}
                </Button>
              ))}
            </fieldset>
          </div>

          {/* Empty state when no threads */}
          {threads.length === 0 && (
            <Card className="border-white/[0.06]">
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Inbox className="h-7 w-7 text-primary/60" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">Your inbox is empty</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  When leads reach out via SMS, email, chat, or phone, their conversations will appear here in one unified inbox.
                </p>
              </div>
            </Card>
          )}

          {/* Two-panel layout */}
          {threads.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[600px]">
            {/* Left: Thread list -- on mobile, hide when a thread is selected */}
            <Card className={`border-white/[0.06] overflow-y-auto max-h-[700px] ${
              selectedThreadId ? "hidden lg:block" : ""
            }`}>
              <InboxThreadList
                threads={threads}
                selectedThreadId={selectedThreadId}
                onSelect={setSelectedThreadId}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <nav className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06]" aria-label="Thread list pagination">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="Previous page"
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground" aria-current="page">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    Next
                  </Button>
                </nav>
              )}
            </Card>

            {/* Right: Thread detail -- on mobile, show back button when a thread is selected */}
            <Card className={`border-white/[0.06] flex flex-col min-h-[600px] ${
              !selectedThreadId ? "hidden lg:flex" : ""
            }`}>
              {!selectedThreadId ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-3 opacity-30" aria-hidden="true" />
                  <p className="text-sm">Select a conversation to view</p>
                </div>
              ) : detailError ? (
                <div className="flex items-center justify-center h-full" role="alert">
                  <div className="p-4 text-red-600">Failed to load conversation. Please try again.</div>
                </div>
              ) : detailLoading || !threadDetail ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground" aria-busy="true">
                  <div className="space-y-3 w-full max-w-md px-4">
                    <div className="h-10 animate-pulse rounded-lg bg-muted/30" />
                    <div className="h-16 w-3/4 animate-pulse rounded-xl bg-muted/20" />
                    <div className="h-16 w-2/3 animate-pulse rounded-xl bg-muted/20 ml-auto" />
                    <div className="h-16 w-3/4 animate-pulse rounded-xl bg-muted/20" />
                  </div>
                  <span className="sr-only">Loading conversation, please wait</span>
                </div>
              ) : (
                <>
                  {/* Mobile back button */}
                  <div className="lg:hidden border-b border-white/[0.06] px-3 py-2">
                    <button
                      onClick={() => setSelectedThreadId(null)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Back to thread list"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      Back to conversations
                    </button>
                  </div>
                  <InboxMessageThread
                    thread={threadDetail.thread}
                    messages={threadDetail.messages}
                    onSendReply={handleSendReply}
                    onUpdateStatus={handleUpdateStatus}
                    isSending={isSending}
                  />
                </>
              )}
            </Card>
          </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
    </ErrorBoundary>
  );
}
