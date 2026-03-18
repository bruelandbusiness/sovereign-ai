"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { LifeBuoy, Plus, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/shared/GradientButton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  messageCount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-400",
  resolved: "bg-accent/10 text-accent",
  closed: "bg-muted text-muted-foreground",
};

export default function SupportPage() {
  const { data: tickets, mutate } = useSWR<Ticket[]>(
    "/api/dashboard/support",
    fetcher
  );
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    await fetch("/api/dashboard/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description, priority }),
    });
    setSubject("");
    setDescription("");
    setPriority("medium");
    setShowForm(false);
    setSubmitting(false);
    mutate();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container size="md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LifeBuoy className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl font-bold">Support</h1>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Ticket
            </Button>
          </div>

          {showForm && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Subject</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide details about your issue..."
                      rows={4}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <GradientButton type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </GradientButton>
                </form>
              </CardContent>
            </Card>
          )}

          {!tickets?.length ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <LifeBuoy className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No support tickets yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
                  <Card className="transition-colors hover:border-primary/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{ticket.subject}</h3>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              statusColors[ticket.status] || statusColors.open
                            }`}
                          >
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()} ·{" "}
                          {ticket.messageCount} messages
                        </p>
                      </div>
                      <ArrowRight className="ml-4 h-4 w-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
