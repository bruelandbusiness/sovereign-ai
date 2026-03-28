"use client";

import { useState } from "react";
import useSWR from "swr";
import { LifeBuoy, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AdminTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  businessName: string;
  messageCount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-400",
  resolved: "bg-accent/10 text-accent",
  closed: "bg-muted text-muted-foreground",
};

export default function AdminSupportPage() {
  const { data: tickets, error, isLoading, mutate } = useSWR<AdminTicket[]>("/api/admin/support", fetcher);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAction = async (ticketId: string) => {
    setSending(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          status: newStatus || undefined,
          message: reply || undefined,
        }),
      });
      if (res.ok) {
        setReply("");
        setNewStatus("");
        setSelectedId(null);
        mutate();
      } else {
        setActionError("Failed to update ticket. Please try again.");
      }
    } catch {
      setActionError("Connection issue while updating ticket.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LifeBuoy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Support Tickets</h1>
      </div>

      {/* Error */}
      {(error || actionError) && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {actionError || "Failed to load support tickets. Please refresh the page."}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" role="status" aria-label="Loading support tickets">
          <span className="sr-only">Loading support tickets, please wait...</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border/50 bg-card" />
          ))}
        </div>
      ) : !tickets?.length ? (
        <p className="text-muted-foreground">No support tickets.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{ticket.subject}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[ticket.status] || ""}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-primary">{ticket.businessName}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {ticket.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()} · {ticket.messageCount} messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedId(selectedId === ticket.id ? null : ticket.id)
                    }
                  >
                    Reply
                  </Button>
                </div>

                {selectedId === ticket.id && (
                  <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                    <div className="flex gap-2">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Update status...</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type admin reply..."
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <Button
                      onClick={() => handleAction(ticket.id)}
                      disabled={sending || (!reply && !newStatus)}
                      aria-busy={sending}
                    >
                      {sending ? (
                        <div className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Send className="mr-1.5 h-4 w-4" />
                      )}
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
