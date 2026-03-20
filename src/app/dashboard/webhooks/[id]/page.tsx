"use client";

import { useState, use } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Play, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";
import { fetcher } from "@/lib/fetcher";

const AVAILABLE_EVENTS = [
  { id: "lead.created", label: "Lead Created" },
  { id: "booking.confirmed", label: "Booking Confirmed" },
  { id: "review.received", label: "Review Received" },
];

interface WebhookDetail {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
}

interface WebhookLog {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  response: string | null;
  createdAt: string;
}

export default function WebhookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const { data: endpoints, error } = useSWR<WebhookDetail[]>("/api/dashboard/webhooks", fetcher);
  const endpoint = endpoints?.find((ep) => ep.id === id);

  const [editUrl, setEditUrl] = useState("");
  const [editEvents, setEditEvents] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  function startEditing() {
    if (!endpoint) return;
    setEditUrl(endpoint.url);
    setEditEvents([...endpoint.events]);
    setIsEditing(true);
  }

  function toggleEvent(eventId: string) {
    setEditEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editUrl, events: editEvents }),
      });
      if (res.ok) {
        setIsEditing(false);
        mutate("/api/dashboard/webhooks");
        toast("Webhook endpoint updated", "success");
      } else {
        toast("We couldn't save your changes. Please try again.", "error");
      }
    } catch {
      toast("We couldn't save your changes. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setTestingId(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}/test`, { method: "POST" });
      if (res.ok) {
        setTestResult({ success: true, message: "Test event delivered successfully." });
        toast("Test event sent", "success");
      } else {
        setTestResult({ success: false, message: "The test event couldn't be delivered. Please check your endpoint URL and try again." });
        toast("Test delivery didn't go through. Check your endpoint URL.", "error");
      }
      mutate("/api/dashboard/webhooks");
    } catch {
      setTestResult({ success: false, message: "Connection issue. Please check your internet and try again." });
      toast("We couldn't send the test event. Please check your connection.", "error");
    } finally {
      setTestingId(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="p-4 text-center">
            <p className="text-destructive font-medium">Failed to load webhook data.</p>
            <Link href="/dashboard/webhooks" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Webhooks
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!endpoints) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="status" aria-label="Loading webhook details">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading webhook details...
          </div>
        </main>
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Webhook endpoint not found.</p>
            <Link href="/dashboard/webhooks" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Webhooks
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/webhooks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Webhook Endpoint</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testingId} aria-busy={testingId}>
              {testingId ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              )}
              {testingId ? "Sending..." : "Send Test"}
            </Button>
          </div>

          {/* Endpoint Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label htmlFor="edit-webhook-url" className="text-sm font-medium">URL</label>
                    <input
                      id="edit-webhook-url"
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                      pattern="https?://.*"
                      title="Please enter a valid URL starting with http:// or https://"
                    />
                  </div>
                  <fieldset>
                    <legend className="text-sm font-medium">Events</legend>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select events">
                      {AVAILABLE_EVENTS.map((ev) => {
                        const isSelected = editEvents.includes(ev.id);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => toggleEvent(ev.id)}
                            aria-pressed={isSelected}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {isSelected && <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                            {ev.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button onClick={handleSave} disabled={isSaving || editEvents.length === 0} aria-busy={isSaving}>
                      {isSaving ? "Saving Changes..." : "Save Changes"}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">URL</p>
                      <code className="text-sm font-mono break-all">{endpoint.url}</code>
                    </div>
                    <Badge
                      variant={endpoint.isActive ? "default" : "secondary"}
                      aria-label={endpoint.isActive ? "Endpoint is active" : "Endpoint is paused"}
                    >
                      {endpoint.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscribed Events</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {endpoint.events.map((ev) => (
                        <Badge key={ev} variant="outline">{ev}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    Edit
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Test result feedback */}
          {testResult && (
            <div
              className={`mt-6 rounded-lg border p-4 text-sm ${
                testResult.success
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              }`}
              role="alert"
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                {testResult.message}
              </div>
            </div>
          )}

          {/* Delivery Log Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delivery logs are tracked for each webhook dispatch. Test the endpoint above to see results here.
              </p>
            </CardContent>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
