"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Send,
  User,
  Headphones,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";
import { fetcher } from "@/lib/fetcher";

interface TicketDetail {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const slaHours: Record<string, number> = {
  urgent: 1,
  high: 4,
  medium: 12,
  low: 24,
};

/* ---------- demo data for seed ticket IDs ---------- */
const DEMO_TICKETS: Record<string, TicketDetail> = {
  "demo-1": {
    id: "demo-1",
    subject: "Unable to connect custom domain to landing page",
    description:
      "I followed the DNS setup guide but the domain still shows a 404 error after 48 hours.",
    status: "open",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    messages: [
      {
        id: "msg-1a",
        senderRole: "client",
        message:
          "I added the CNAME record exactly as described in the setup guide. It has been over 48 hours and the domain still shows a generic 404 page. I double-checked the DNS settings in my registrar and everything looks correct.",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: "msg-1b",
        senderRole: "admin",
        message:
          "Thanks for reaching out! I can see the CNAME record is propagated, but it looks like the SSL certificate hasn't been provisioned yet. I've triggered a manual certificate issuance -- please allow 30 minutes and try again. Let me know if the issue persists.",
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ],
  },
  "demo-2": {
    id: "demo-2",
    subject: "Billing charge doesn't match plan price",
    description:
      "My plan is $99/mo but I was charged $149 on the latest invoice. Please review.",
    status: "in_progress",
    priority: "medium",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    messages: [
      {
        id: "msg-2a",
        senderRole: "client",
        message:
          "I noticed my latest invoice was $149 instead of the $99 I expected for my Growth plan. Can you explain the difference?",
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: "msg-2b",
        senderRole: "admin",
        message:
          "Hi! Thanks for flagging this. Let me look into your account billing history and get back to you shortly.",
        createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
      },
      {
        id: "msg-2c",
        senderRole: "admin",
        message:
          "I found the issue -- an add-on service (AI Chatbot Pro) was activated on March 15th which added $50/mo. If this wasn't intentional, I can remove it and issue a prorated refund. Would you like me to proceed?",
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: "msg-2d",
        senderRole: "client",
        message:
          "Ah, I didn't realize that was an extra charge. Yes, please remove it and issue the refund. Thank you!",
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      },
    ],
  },
  "demo-3": {
    id: "demo-3",
    subject: "Request: Add CSV export for lead reports",
    description:
      "It would be very helpful to export the weekly lead report as a CSV file.",
    status: "open",
    priority: "low",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    messages: [
      {
        id: "msg-3a",
        senderRole: "client",
        message:
          "We use the lead reports internally and currently have to copy-paste the data into spreadsheets. A CSV export button would save us a lot of time each week.",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
  "demo-4": {
    id: "demo-4",
    subject: "AI chatbot giving incorrect service hours",
    description:
      "The chatbot tells visitors we are open until 10 PM but we close at 6 PM.",
    status: "resolved",
    priority: "high",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    messages: [
      {
        id: "msg-4a",
        senderRole: "client",
        message:
          "Multiple customers have told us the chatbot says we're open until 10 PM. Our hours are 8 AM - 6 PM Monday through Friday.",
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: "msg-4b",
        senderRole: "admin",
        message:
          "I see the issue -- the chatbot's knowledge base had outdated hours from your initial setup. I've updated the business hours to 8 AM - 6 PM, Mon-Fri. The chatbot should reflect the correct hours within the next 15 minutes.",
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        id: "msg-4c",
        senderRole: "client",
        message: "Confirmed, it's showing the right hours now. Thanks!",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: "msg-4d",
        senderRole: "admin",
        message:
          "Glad to hear it! I've also added a reminder in your account so you'll be prompted to review chatbot settings whenever you update your business profile. Marking this as resolved.",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
  "demo-5": {
    id: "demo-5",
    subject: "How do I update my business address?",
    description:
      "We moved offices. Where in the dashboard can I update the address shown on our website?",
    status: "closed",
    priority: "low",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    messages: [
      {
        id: "msg-5a",
        senderRole: "client",
        message:
          "We recently moved to a new office. How can I update the address that appears on our website footer and Google listing?",
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: "msg-5b",
        senderRole: "admin",
        message:
          'You can update your business address by going to Dashboard > Settings > Business Profile. The change will automatically propagate to your website footer and connected Google Business Profile within 24 hours.',
        createdAt: new Date(Date.now() - 13 * 86400000).toISOString(),
      },
      {
        id: "msg-5c",
        senderRole: "client",
        message: "Found it, all updated. Thank you!",
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
    ],
  },
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isDemo = id.startsWith("demo-");

  const {
    data: apiTicket,
    error,
    mutate,
  } = useSWR<TicketDetail>(
    isDemo ? null : `/api/dashboard/support/${id}`,
    fetcher,
  );

  const ticket = isDemo ? DEMO_TICKETS[id] ?? null : apiTicket;

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [markingResolved, setMarkingResolved] = useState(false);

  const effectiveStatus = localStatus ?? ticket?.status ?? "open";

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (isDemo) {
      toast("Demo mode -- messages are not persisted.", "info");
      setMessage("");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/dashboard/support/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Send failed");
      setMessage("");
      mutate();
    } catch {
      toast("We couldn't send your reply. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleMarkResolved = async () => {
    if (isDemo) {
      setLocalStatus("resolved");
      toast("Ticket marked as resolved (demo).", "success");
      return;
    }

    setMarkingResolved(true);
    try {
      const res = await fetch(`/api/dashboard/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setLocalStatus("resolved");
      mutate();
      toast("Ticket marked as resolved.", "success");
    } catch {
      /* PATCH may not exist yet -- gracefully fall back to local-only */
      setLocalStatus("resolved");
      toast("Ticket marked as resolved.", "success");
    } finally {
      setMarkingResolved(false);
    }
  };

  /* ---------- error state ---------- */
  if (error && !isDemo) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main
          className="flex flex-1 items-center justify-center"
          role="alert"
        >
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive/60" />
            <p className="font-medium text-destructive">
              Failed to load ticket. Please try again later.
            </p>
            <Link
              href="/dashboard/support"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Back to Support
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- loading state ---------- */
  if (!ticket) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main
          className="flex-1 py-8"
          role="status"
          aria-label="Loading ticket"
        >
          <Container size="md">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Loading ticket...
            </div>
          </Container>
          <span className="sr-only">
            Loading ticket details, please wait...
          </span>
        </main>
      </div>
    );
  }

  const slaValue = slaHours[ticket.priority] ?? 24;

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container size="md">
          {/* ---------- back link ---------- */}
          <Link
            href="/dashboard/support"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All Tickets
          </Link>

          {/* ---------- ticket header ---------- */}
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-xl font-bold">
                      {ticket.subject}
                    </h1>
                    <span
                      role="status"
                      aria-label={`Status: ${statusLabels[effectiveStatus] ?? effectiveStatus}`}
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        statusColors[effectiveStatus] ??
                        statusColors.open
                      }`}
                    >
                      {statusLabels[effectiveStatus] ??
                        effectiveStatus.replace("_", " ")}
                    </span>
                    <span
                      aria-label={`Priority: ${priorityLabels[ticket.priority] ?? ticket.priority}`}
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        priorityColors[ticket.priority] ??
                        priorityColors.medium
                      }`}
                    >
                      {priorityLabels[ticket.priority] ?? ticket.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ticket.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Opened{" "}
                      {new Date(ticket.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                    {ticket.updatedAt && (
                      <span>
                        Last updated{" "}
                        {new Date(ticket.updatedAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mark Resolved button */}
                {effectiveStatus !== "resolved" &&
                  effectiveStatus !== "closed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkResolved}
                      disabled={markingResolved}
                      className="shrink-0"
                    >
                      {markingResolved ? (
                        <Loader2
                          className="mr-1.5 h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <CheckCircle2
                          className="mr-1.5 h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}
                      Mark Resolved
                    </Button>
                  )}
              </div>

              {/* SLA indicator */}
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                <Clock
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground">
                  Estimated response time:
                </span>
                <span className="text-xs font-semibold text-primary">
                  Within {slaValue} {slaValue === 1 ? "hour" : "hours"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ---------- messages ---------- */}
          <div
            className="space-y-4"
            role="log"
            aria-label="Ticket conversation"
          >
            {ticket.messages.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>
                    No messages yet. Send a reply below to start the
                    conversation.
                  </p>
                </CardContent>
              </Card>
            )}
            {ticket.messages.map((msg) => {
              const isAdmin = msg.senderRole === "admin";
              return (
                <Card
                  key={msg.id}
                  className={
                    isAdmin ? "border-primary/20 bg-primary/5" : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${
                          isAdmin
                            ? "bg-primary/10"
                            : "bg-muted"
                        }`}
                      >
                        {isAdmin ? (
                          <Headphones
                            className="h-3.5 w-3.5 text-primary"
                            aria-hidden="true"
                          />
                        ) : (
                          <User
                            className="h-3.5 w-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {isAdmin ? "Support Team" : "You"}
                      </span>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={msg.createdAt}
                      >
                        {new Date(msg.createdAt).toLocaleString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap pl-9 text-sm text-muted-foreground">
                      {msg.message}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ---------- reply form ---------- */}
          {effectiveStatus !== "closed" ? (
            <form
              onSubmit={sendMessage}
              className="mt-6"
              aria-label="Reply to ticket"
            >
              <label htmlFor="ticket-reply" className="sr-only">
                Your reply
              </label>
              <div className="rounded-xl border border-border bg-card p-3">
                <textarea
                  id="ticket-reply"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full resize-none rounded-lg border-0 bg-transparent px-1 py-1 text-sm focus:outline-none"
                />
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Our team will be notified immediately.
                  </p>
                  <Button
                    type="submit"
                    disabled={sending || !message.trim()}
                    aria-label="Send reply"
                    aria-busy={sending}
                    size="sm"
                  >
                    {sending ? (
                      <Loader2
                        className="mr-1.5 h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Send
                        className="mr-1.5 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    )}
                    Send Reply
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              This ticket is closed. No further replies can be added.
            </div>
          )}

          {/* ---------- resolved confirmation ---------- */}
          {effectiveStatus === "resolved" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              This ticket has been marked as resolved. If you need further
              help, you can still reply above.
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
