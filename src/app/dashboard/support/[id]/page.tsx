"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, User, Headphones } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  const { data: ticket, mutate } = useSWR<TicketDetail>(
    `/api/dashboard/support/${id}`,
    fetcher
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    await fetch(`/api/dashboard/support/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setMessage("");
    setSending(false);
    mutate();
  };

  if (!ticket) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading ticket...</p>
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
            <ArrowLeft className="h-3.5 w-3.5" />
            All Tickets
          </Link>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold">{ticket.subject}</h1>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {ticket.status.replace("_", " ")}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {ticket.priority}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Opened {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Messages */}
          <div className="space-y-4">
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
                  <div className="mb-2 flex items-center gap-2">
                    {msg.senderRole === "admin" ? (
                      <Headphones className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {msg.senderRole === "admin" ? "Support Team" : "You"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reply form */}
          {ticket.status !== "closed" && (
            <form onSubmit={sendMessage} className="mt-6">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" disabled={sending || !message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
