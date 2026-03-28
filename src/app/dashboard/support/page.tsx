"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  LifeBuoy,
  Plus,
  ArrowRight,
  BookOpen,
  Zap,
  HelpCircle,
  Clock,
  Filter,
  ArrowUpDown,
  Upload,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/shared/GradientButton";
import { FileUploadDropzone } from "@/components/ui/FileUploadDropzone";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";
type SortOption = "date-desc" | "date-asc" | "priority-desc" | "priority-asc";

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
  low: "bg-slate-500/10 text-slate-400",
  medium: "bg-blue-500/10 text-blue-400",
  high: "bg-orange-500/10 text-orange-400",
  urgent: "bg-red-500/10 text-red-400",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityWeight: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const slaHours: Record<string, number> = {
  urgent: 1,
  high: 4,
  medium: 12,
  low: 24,
};

const categories = [
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General" },
];

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/* ---------- seed data used when the API returns nothing ---------- */
const SEED_TICKETS: Ticket[] = [
  {
    id: "demo-1",
    subject: "Unable to connect custom domain to landing page",
    description:
      "I followed the DNS setup guide but the domain still shows a 404 error after 48 hours.",
    status: "open",
    priority: "high",
    messageCount: 2,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: "demo-2",
    subject: "Billing charge doesn't match plan price",
    description:
      "My plan is $99/mo but I was charged $149 on the latest invoice. Please review.",
    status: "in_progress",
    priority: "medium",
    messageCount: 4,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "demo-3",
    subject: "Request: Add CSV export for lead reports",
    description:
      "It would be very helpful to export the weekly lead report as a CSV file.",
    status: "open",
    priority: "low",
    messageCount: 1,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "demo-4",
    subject: "AI chatbot giving incorrect service hours",
    description:
      "The chatbot tells visitors we are open until 10 PM but we close at 6 PM.",
    status: "resolved",
    priority: "high",
    messageCount: 6,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "demo-5",
    subject: "How do I update my business address?",
    description:
      "We moved offices. Where in the dashboard can I update the address shown on our website?",
    status: "closed",
    priority: "low",
    messageCount: 3,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

export default function SupportPage() {
  const {
    data: apiTickets,
    isLoading,
    mutate,
  } = useSWR<Ticket[]>("/api/dashboard/support", fetcher);

  /* Use seed data when the API returns an empty array (demo mode) */
  const tickets =
    apiTickets && apiTickets.length > 0
      ? apiTickets
      : isLoading
        ? undefined
        : SEED_TICKETS;

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  /* ---------- filtering & sorting ---------- */
  const filteredAndSorted = useMemo(() => {
    if (!tickets) return [];

    const filtered =
      statusFilter === "all"
        ? tickets
        : tickets.filter((t) => t.status === statusFilter);

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "priority-desc":
          return (
            (priorityWeight[b.priority] ?? 0) -
            (priorityWeight[a.priority] ?? 0)
          );
        case "priority-asc":
          return (
            (priorityWeight[a.priority] ?? 0) -
            (priorityWeight[b.priority] ?? 0)
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [tickets, statusFilter, sortOption]);

  /* ---------- form submission ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || submitting) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, priority, category }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create ticket.");
      }

      setSubject("");
      setDescription("");
      setPriority("medium");
      setCategory("general");
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
      }, 2000);
      mutate();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "date-desc", label: "Newest first" },
    { value: "date-asc", label: "Oldest first" },
    { value: "priority-desc", label: "Highest priority" },
    { value: "priority-asc", label: "Lowest priority" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container size="md">
          {/* ---------- page header ---------- */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <LifeBuoy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">Support</h1>
                <p className="text-sm text-muted-foreground">
                  We are here to help. Get answers fast.
                </p>
              </div>
            </div>
            <GradientButton
              size="sm"
              onClick={() => setShowForm(!showForm)}
              aria-expanded={showForm}
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New Ticket
                </>
              )}
            </GradientButton>
          </div>

          {/* ---------- SLA indicator ---------- */}
          <Card className="mb-6 border-primary/10">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                Expected Response Times
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["urgent", "high", "medium", "low"] as const).map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        p === "urgent"
                          ? "bg-red-400"
                          : p === "high"
                            ? "bg-orange-400"
                            : p === "medium"
                              ? "bg-blue-400"
                              : "bg-slate-400"
                      }`}
                    />
                    <span className="text-xs capitalize text-muted-foreground">
                      {p}:
                    </span>
                    <span className="text-xs font-semibold">
                      {slaHours[p]}h
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ---------- quick links ---------- */}
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Getting Started",
                desc: "Setup guides and onboarding help",
                href: "/help?category=getting-started",
                color: "bg-blue-500/10 text-blue-400",
              },
              {
                icon: Zap,
                title: "Service Guides",
                desc: "How each AI service works",
                href: "/help?category=services",
                color: "bg-purple-500/10 text-purple-400",
              },
              {
                icon: HelpCircle,
                title: "Common Questions",
                desc: "FAQ and common questions answered",
                href: "/help?category=faq",
                color: "bg-emerald-500/10 text-emerald-400",
              },
            ].map((kb) => (
              <Link key={kb.title} href={kb.href}>
                <Card className="group h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${kb.color}`}
                    >
                      <kb.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold transition-colors group-hover:text-primary">
                        {kb.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {kb.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* ---------- new ticket form ---------- */}
          {showForm && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-5">
                <h2 className="mb-4 text-lg font-semibold">
                  Create a New Ticket
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitSuccess && (
                    <div
                      role="status"
                      className="slide-up-fade flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Ticket created! Our team will respond within{" "}
                      {slaHours[priority] ?? 24} hours.
                    </div>
                  )}

                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    >
                      {submitError}
                    </div>
                  )}

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="support-subject"
                      className="mb-1 block text-sm font-medium"
                    >
                      Subject *
                    </label>
                    <Input
                      id="support-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  {/* Category + Priority row */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="support-category"
                        className="mb-1 block text-sm font-medium"
                      >
                        Category
                      </label>
                      <select
                        id="support-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="support-priority"
                        className="mb-1 block text-sm font-medium"
                      >
                        Priority
                      </label>
                      <select
                        id="support-priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estimated response:{" "}
                        <span className="font-medium">
                          {slaHours[priority] ?? 24} hours
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="support-description"
                      className="mb-1 block text-sm font-medium"
                    >
                      Description *
                    </label>
                    <textarea
                      id="support-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant context that will help us assist you faster."
                      rows={5}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* File attachment (UI only) */}
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Attachments{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <FileUploadDropzone
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                      maxSizeMB={10}
                      multiple
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex items-center gap-3 pt-1">
                    <GradientButton
                      type="submit"
                      size="sm"
                      disabled={submitting}
                      aria-busy={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" aria-hidden="true" />
                          Submit Ticket
                        </>
                      )}
                    </GradientButton>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ---------- filter & sort bar ---------- */}
          {!isLoading && tickets && tickets.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="flex gap-1">
                  {statusFilterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        statusFilter === opt.value
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <ArrowUpDown
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <select
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(e.target.value as SortOption)
                  }
                  aria-label="Sort tickets"
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ---------- ticket list ---------- */}
          {isLoading ? (
            <div
              className="space-y-3"
              role="status"
              aria-label="Loading support tickets"
            >
              <span className="sr-only">
                Loading support tickets, please wait...
              </span>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-border/50 bg-card"
                />
              ))}
            </div>
          ) : filteredAndSorted.length === 0 && statusFilter !== "all" ? (
            /* no results for current filter */
            <Card>
              <CardContent className="py-12 text-center">
                <Filter
                  className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  No{" "}
                  <span className="font-medium">
                    {statusFilterOptions
                      .find((o) => o.value === statusFilter)
                      ?.label.toLowerCase()}
                  </span>{" "}
                  tickets found.
                </p>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Show all tickets
                </button>
              </CardContent>
            </Card>
          ) : filteredAndSorted.length === 0 ? (
            /* true empty state */
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2
                    className="h-7 w-7 text-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="text-base font-semibold">
                  Everything running smoothly!
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Need help? Open a ticket anytime. Our support team typically
                  responds within 4 hours for standard requests.
                </p>
                <GradientButton
                  size="sm"
                  className="mt-5"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Open a Ticket
                </GradientButton>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAndSorted.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                >
                  <Card className="transition-all hover:border-primary/40 hover:shadow-md">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold">
                            {ticket.subject}
                          </h3>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                              statusColors[ticket.status] ??
                              statusColors.open
                            }`}
                          >
                            {statusLabels[ticket.status] ??
                              ticket.status.replace("_", " ")}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              priorityColors[ticket.priority] ??
                              priorityColors.medium
                            }`}
                          >
                            {priorityLabels[ticket.priority] ??
                              ticket.priority}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                          {ticket.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Created {formatRelativeDate(ticket.createdAt)}
                          </span>
                          <span className="hidden sm:inline">
                            Updated {formatRelativeDate(ticket.updatedAt)}
                          </span>
                          <span>
                            {ticket.messageCount}{" "}
                            {ticket.messageCount === 1
                              ? "message"
                              : "messages"}
                          </span>
                        </div>
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
