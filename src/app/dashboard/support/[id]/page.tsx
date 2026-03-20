"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, User, Headphones, Loader2 } from "lucide-react";
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
  messages: {
    id: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }[];
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: ticket, error, mutate } = useSWR<TicketDetail>(
    `/api/dashboard/support/${id}`,
    fetcher
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="text-center">
            <p className="text-destructive font-medium">Failed to load ticket. Please try again later.</p>
            <Link href="/dashboard/support" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Support
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" role="status" aria-label="Loading ticket">
          <Container size="md">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading ticket...
            </div>
          </Container>
          <span className="sr-only">Loading ticket details, please wait...</span>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container size="md">
          <Link
            href="/dashboard/support"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All Tickets
          </Link>

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold">{ticket.subject}</h1>
              <span
                role="status"
                aria-label={`Status: ${ticket.status.replace("_", " ")}`}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {ticket.status.replace("_", " ")}
              </span>
              <span
                aria-label={`Priority: ${ticket.priority}`}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize"
              >
                {ticket.priority}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Opened {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Messages */}
          <div className="space-y-4" role="log" aria-label="Ticket conversation">
            {ticket.messages.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No messages yet. Send a reply below to start the conversation.</p>
                </CardContent>
              </Card>
            )}
            {ticket.messages.map((msg) => (
              <Card
                key={msg.id}
                className={
                  msg.senderRole === "admin"
                    ? "border-primary/20 bg-primary/5"
                    : ""
                }
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {msg.senderRole === "admin" ? (
                      <Headphones className="h-4 w-4 text-primary" aria-hidden="true" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="text-sm font-medium">
                      {msg.senderRole === "admin" ? "Support Team" : "You"}
                    </span>
                    <time className="text-xs text-muted-foreground" dateTime={msg.createdAt}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reply form */}
          {ticket.status !== "closed" ? (
            <form onSubmit={sendMessage} className="mt-6" aria-label="Reply to ticket">
              <label htmlFor="ticket-reply" className="sr-only">Your reply</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <textarea
                  id="ticket-reply"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="submit"
                  disabled={sending || !message.trim()}
                  aria-label="Send reply"
                  aria-busy={sending}
                  className="self-end sm:self-start"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span className="ml-1.5 sm:sr-only">Send</span>
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              This ticket is closed. No further replies can be added.
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
