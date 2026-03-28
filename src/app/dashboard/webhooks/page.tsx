"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Webhook, Plus, Trash2, Play, ExternalLink, Check, X, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";
import { fetcher } from "@/lib/fetcher";

const AVAILABLE_EVENTS = [
  { id: "lead.created", label: "Lead Created" },
  { id: "booking.confirmed", label: "Booking Confirmed" },
  { id: "review.received", label: "Review Received" },
];

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "lead.created": { bg: "rgba(76, 133, 255, 0.12)", text: "rgb(76, 133, 255)", border: "rgba(76, 133, 255, 0.3)" },
  "booking.confirmed": { bg: "rgba(34, 211, 161, 0.12)", text: "rgb(34, 211, 161)", border: "rgba(34, 211, 161, 0.3)" },
  "review.received": { bg: "rgba(245, 166, 35, 0.12)", text: "rgb(245, 166, 35)", border: "rgba(245, 166, 35, 0.3)" },
  "test": { bg: "rgba(255, 255, 255, 0.06)", text: "var(--muted-foreground)", border: "var(--border)" },
};

function eventStyle(eventId: string) {
  return EVENT_COLORS[eventId] ?? EVENT_COLORS["test"];
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered: string | null;
  lastSuccess: boolean | null;
  lastStatusCode: number | null;
  createdAt: string;
}

export default function WebhooksPage() {
  const { toast } = useToast();
  const { data: endpoints, isLoading, error: swrError } = useSWR<WebhookEndpoint[]>("/api/dashboard/webhooks", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  function toggleEvent(eventId: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: selectedEvents }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create webhook");
        return;
      }

      setCreatedSecret(data.secret);
      setUrl("");
      setSelectedEvents([]);
      mutate("/api/dashboard/webhooks");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      mutate("/api/dashboard/webhooks");
      if (data.success) {
        toast(`Test delivered (HTTP ${data.statusCode})`, "success");
      } else {
        toast(
          data.statusCode
            ? `Test failed with HTTP ${data.statusCode}. Check your endpoint.`
            : "Test delivery failed. Check your endpoint URL.",
          "error",
        );
      }
    } catch {
      toast("We couldn't send the test event. Please try again.", "error");
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}`, { method: "DELETE" });
      if (res.ok) mutate("/api/dashboard/webhooks");
    } catch {
      toast("We couldn't delete the webhook. Please try again.", "error");
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await fetch(`/api/dashboard/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      mutate("/api/dashboard/webhooks");
    } catch {
      toast("We couldn't update the webhook. Please try again.", "error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Webhooks</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect external tools with real-time event notifications.
              </p>
            </div>
            <Button onClick={() => { setShowForm(!showForm); setCreatedSecret(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          </div>

          {swrError && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
              Failed to load webhook endpoints. Please try refreshing the page.
            </div>
          )}

          {/* Secret display after creation */}
          {createdSecret && (
            <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4" role="alert">
              <p className="text-sm font-medium text-accent">Webhook secret (copy it now, it won&apos;t be shown again):</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-black/20 px-3 py-2 text-sm font-mono">
                  {createdSecret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdSecret);
                    toast("Secret copied to clipboard", "success");
                  }}
                  aria-label="Copy webhook secret to clipboard"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCreatedSecret(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Create Form */}
          {showForm && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>New Webhook Endpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4" aria-label="Create webhook endpoint">
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
                      {error}
                    </div>
                  )}
                  <div>
                    <label htmlFor="webhook-url" className="text-sm font-medium">Endpoint URL <span aria-hidden="true" className="text-red-400">*</span></label>
                    <input
                      id="webhook-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 min-h-[44px] text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="https://your-app.com/webhooks/sovereign"
                      required
                      aria-required="true"
                      pattern="https?://.*"
                      title="Please enter a valid URL starting with http:// or https://"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Must be a valid HTTPS URL that can receive POST requests.</p>
                  </div>
                  <fieldset>
                    <legend className="text-sm font-medium">Events <span aria-hidden="true" className="text-red-400">*</span></legend>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select events to subscribe to">
                      {AVAILABLE_EVENTS.map((ev) => {
                        const isSelected = selectedEvents.includes(ev.id);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => toggleEvent(ev.id)}
                            aria-pressed={isSelected}
                            className={`rounded-full border px-4 py-2.5 min-h-[44px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {isSelected && <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                            {ev.label}
                          </button>
                        );
                      })}
                    </div>
                    {selectedEvents.length === 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">Select at least one event.</p>
                    )}
                  </fieldset>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || selectedEvents.length === 0} aria-busy={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Endpoint"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Endpoint List */}
          <div className="mt-8 space-y-4" role="region" aria-label="Webhook endpoints">
            {isLoading ? (
              <div role="status" aria-label="Loading webhook endpoints">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="mb-4 h-24 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
                ))}
                <span className="sr-only">Loading webhook endpoints...</span>
              </div>
            ) : endpoints && endpoints.length > 0 ? (
              endpoints.map((ep) => (
                <Card key={ep.id} className="transition-colors hover:border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Webhook className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                          <code className="text-sm font-mono truncate">{ep.url}</code>
                          <Badge
                            variant={ep.isActive ? "default" : "secondary"}
                            aria-label={ep.isActive ? "Endpoint is active" : "Endpoint is paused"}
                          >
                            {ep.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ep.events.map((ev) => {
                            const colors = eventStyle(ev);
                            return (
                              <span
                                key={ev}
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  border: `1px solid ${colors.border}`,
                                }}
                              >
                                {ev}
                              </span>
                            );
                          })}
                        </div>
                        {ep.lastTriggered && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: ep.lastSuccess
                                  ? "rgba(34, 197, 94, 0.12)"
                                  : "rgba(239, 68, 68, 0.12)",
                                color: ep.lastSuccess
                                  ? "rgb(34, 197, 94)"
                                  : "rgb(239, 68, 68)",
                              }}
                            >
                              {ep.lastSuccess ? (
                                <Check className="h-3 w-3" aria-hidden="true" />
                              ) : (
                                <X className="h-3 w-3" aria-hidden="true" />
                              )}
                              {ep.lastSuccess ? "Delivered" : "Failed"}
                              {ep.lastStatusCode != null && (
                                <span className="opacity-75">({ep.lastStatusCode})</span>
                              )}
                            </span>
                            <span className="sr-only">
                              {ep.lastSuccess ? "Last delivery succeeded" : "Last delivery failed"}.
                            </span>
                            <span>
                              {new Date(ep.lastTriggered).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(ep.id)}
                          disabled={testingId === ep.id}
                          aria-busy={testingId === ep.id}
                          aria-label={`Test webhook ${ep.url}`}
                        >
                          {testingId === ep.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />
                          ) : (
                            <Play className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          )}
                          {testingId === ep.id ? "Testing..." : "Test"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(ep.id, ep.isActive)}
                          aria-label={ep.isActive ? `Pause webhook ${ep.url}` : `Resume webhook ${ep.url}`}
                        >
                          {ep.isActive ? "Pause" : "Resume"}
                        </Button>
                        <Link href={`/dashboard/webhooks/${ep.id}`}>
                          <Button variant="ghost" size="sm" aria-label={`View details for ${ep.url}`}>
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-red-400"
                          onClick={() => handleDelete(ep.id)}
                          aria-label={`Delete webhook ${ep.url}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Webhook className="h-7 w-7 text-primary/60" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold">No webhook endpoints yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Connect your favorite tools by adding a webhook endpoint. You will receive real-time notifications for leads, bookings, and reviews.
                  </p>
                  <Button className="mt-5" onClick={() => { setShowForm(true); setCreatedSecret(null); }}>
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Add Your First Endpoint
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
