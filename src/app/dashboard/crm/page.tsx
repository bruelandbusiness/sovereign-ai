"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Clock,
  Phone,
  Mail,
  StickyNote,
  Calendar,
  UserPlus,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CRMLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  date: string;
  status: string;
  score: number;
  stage: string;
  notes: string;
  assignedTo: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  value: number | null;
  tags: string;
}

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "proposal",
  "won",
  "lost",
] as const;

type LeadStatus = (typeof STATUSES)[number];

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  qualified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  appointment: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  proposal: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_SR_LABELS: Record<LeadStatus, string> = {
  new: "New lead",
  contacted: "Contacted",
  qualified: "Qualified",
  appointment: "Appointment set",
  proposal: "Proposal sent",
  won: "Deal won",
  lost: "Deal lost",
};

const SOURCE_COLORS: Record<string, string> = {
  chatbot: "bg-violet-500/20 text-violet-300",
  website: "bg-blue-500/20 text-blue-300",
  referral: "bg-emerald-500/20 text-emerald-300",
  phone: "bg-amber-500/20 text-amber-300",
  ads: "bg-rose-500/20 text-rose-300",
  form: "bg-cyan-500/20 text-cyan-300",
  social: "bg-pink-500/20 text-pink-300",
  voice: "bg-orange-500/20 text-orange-300",
};

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<CRMLead[]>;
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function scoreColor(score: number): string {
  if (score >= 71) return "text-emerald-400";
  if (score >= 41) return "text-amber-400";
  if (score >= 21) return "text-blue-400";
  return "text-zinc-400";
}

function scoreBg(score: number): string {
  if (score >= 71) return "bg-emerald-500/20";
  if (score >= 41) return "bg-amber-500/20";
  if (score >= 21) return "bg-blue-500/20";
  return "bg-zinc-500/20";
}

function scoreLabel(score: number): string {
  if (score >= 71) return "High";
  if (score >= 41) return "Medium";
  if (score >= 21) return "Low";
  return "Very low";
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CRMPage() {
  const { toast } = useToast();
  const {
    data: leads,
    mutate,
    isLoading,
  } = useSWR<CRMLead[]>("/api/dashboard/leads", fetcher);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "date" | "value">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editNotes, setEditNotes] = useState("");
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | "">("");
  const [saving, setSaving] = useState(false);

  // Filter + sort leads client-side (API already returns sorted data but we
  // also support client-side filtering for instant feedback while typing)
  const filtered = useMemo(() => {
    if (!leads) return [];
    let result = leads;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case "score":
        sorted.sort((a, b) => b.score - a.score);
        break;
      case "value":
        sorted.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        break;
      default:
        sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
    return sorted;
  }, [leads, search, sortBy]);

  // Group by status for pipeline view
  const pipeline = useMemo(() => {
    const groups: Record<string, CRMLead[]> = {};
    for (const s of STATUSES) groups[s] = [];
    for (const lead of filtered) {
      const status = lead.status as LeadStatus;
      if (groups[status]) {
        groups[status].push(lead);
      }
    }
    return groups;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    if (!leads || leads.length === 0)
      return { total: 0, avgScore: 0, conversionRate: "0", pipelineValue: 0 };
    const total = leads.length;
    const avgScore = Math.round(
      leads.reduce((s, l) => s + l.score, 0) / total
    );
    const won = leads.filter((l) => l.status === "won").length;
    const conversionRate =
      total > 0 ? ((won / total) * 100).toFixed(1) : "0";
    const pipelineValue = leads
      .filter((l) => l.status !== "lost")
      .reduce((s, l) => s + (l.value ?? 0), 0);
    return { total, avgScore, conversionRate, pipelineValue };
  }, [leads]);

  const hasActiveFilters = search.trim().length > 0;

  // --- Handlers ---

  const updateLead = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setSaving(true);
      try {
        const res = await fetch("/api/dashboard/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...data }),
        });
        if (!res.ok) throw new Error("Update failed");
        await mutate();
        toast("Lead updated", "success");
      } catch {
        toast("We couldn't update the lead. Please try again.", "error");
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  const handleStatusChange = useCallback(
    (id: string, newStatus: string) => {
      updateLead(id, { status: newStatus });
    },
    [updateLead]
  );

  const handleSaveNotes = useCallback(
    (id: string) => {
      updateLead(id, { notes: editNotes });
    },
    [updateLead, editNotes]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkStatusChange = useCallback(async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setSaving(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch("/api/dashboard/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: bulkStatus }),
        })
      );
      await Promise.all(promises);
      await mutate();
      toast(`${selectedIds.size} lead(s) moved to ${bulkStatus}`, "success");
      setSelectedIds(new Set());
      setBulkStatus("");
    } catch {
      toast("We couldn't update the selected leads. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }, [bulkStatus, selectedIds, mutate, toast]);

  const handleExpand = useCallback(
    (lead: CRMLead) => {
      if (expandedId === lead.id) {
        setExpandedId(null);
      } else {
        setExpandedId(lead.id);
        setEditNotes(lead.notes);
      }
    },
    [expandedId]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setSortBy("date");
  }, []);

  // --- Loading state with skeleton rows ---

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" aria-busy="true" aria-label="Loading CRM pipeline">
          <Container>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
              ))}
            </div>
            {/* Skeleton rows for pipeline columns */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-[1200px]">
                {Array.from({ length: 7 }).map((_, colIdx) => (
                  <div key={colIdx} className="flex-1 min-w-[160px] rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="space-y-2 p-2">
                      {Array.from({ length: 2 }).map((_, rowIdx) => (
                        <div key={rowIdx} className="h-20 animate-pulse rounded-lg bg-muted/30" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <span className="sr-only">Loading CRM data, please wait</span>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">CRM Pipeline</h1>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6" role="region" aria-label="Pipeline statistics">
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Users className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <BarChart3 className="h-5 w-5 text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    Conversion Rate
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <DollarSign className="h-5 w-5 text-violet-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.pipelineValue
                      ? formatCurrency(stats.pipelineValue)
                      : "$0"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pipeline Value
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search + sort + bulk actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <label htmlFor="crm-search" className="sr-only">Search leads by name, email, or phone</label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="crm-search"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort */}
              <fieldset className="flex items-center gap-1.5 text-sm text-muted-foreground border-none p-0 m-0">
                <legend className="sr-only">Sort leads by</legend>
                <span aria-hidden="true">Sort:</span>
                {(["date", "score", "value"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    aria-pressed={sortBy === s}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      sortBy === s
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-white/[0.06]"
                    }`}
                  >
                    {s === "date" ? "Newest" : s === "score" ? "Score" : "Value"}
                  </button>
                ))}
              </fieldset>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                  aria-label="Clear all filters"
                >
                  <X className="h-3 w-3 inline mr-1" aria-hidden="true" />
                  Clear
                </button>
              )}

              {/* Bulk actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/[0.06]" role="toolbar" aria-label="Bulk actions">
                  <span className="text-xs text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                  <label htmlFor="bulk-status-select" className="sr-only">Move selected leads to status</label>
                  <select
                    id="bulk-status-select"
                    value={bulkStatus}
                    onChange={(e) =>
                      setBulkStatus(e.target.value as LeadStatus | "")
                    }
                    className="rounded-md border border-white/[0.06] bg-background px-2 py-1 text-xs"
                  >
                    <option value="">Move to...</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={!bulkStatus || saving}
                    onClick={handleBulkStatusChange}
                  >
                    Apply
                  </Button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Clear selection"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Empty state when no leads at all */}
          {leads && leads.length === 0 && (
            <Card className="border-white/[0.06]">
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary/60" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">No leads yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Leads captured from your chatbot, forms, ads, and voice agents will appear here in your CRM pipeline.
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="mt-4">
                    <UserPlus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Empty search results */}
          {leads && leads.length > 0 && filtered.length === 0 && (
            <Card className="border-white/[0.06]">
              <div className="py-12 text-center">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" aria-hidden="true" />
                <h2 className="text-base font-semibold">No matching leads</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  No leads match &ldquo;{search}&rdquo;. Try a different search term.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                  Clear Search
                </Button>
              </div>
            </Card>
          )}

          {/* Pipeline Kanban */}
          {filtered.length > 0 && (
          <div className="overflow-x-auto pb-4" role="region" aria-label="Pipeline board" tabIndex={0}>
            <div className="flex gap-4 min-w-[1200px]">
              {STATUSES.map((status) => {
                const columnLeads = pipeline[status] || [];
                return (
                  <div
                    key={status}
                    className="flex-1 min-w-[160px] rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    role="region"
                    aria-label={`${status} column, ${columnLeads.length} leads`}
                  >
                    {/* Column header */}
                    <div
                      className="flex items-center justify-between rounded-t-xl border-b border-white/[0.06] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            STATUS_COLORS[status].split(" ")[0]
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold capitalize">
                          {status}
                        </span>
                      </div>
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {columnLeads.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2 p-2 max-h-[600px] overflow-y-auto">
                      {columnLeads.length === 0 && (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          No leads
                        </p>
                      )}
                      {columnLeads.map((lead) => {
                        const isExpanded = expandedId === lead.id;
                        const isSelected = selectedIds.has(lead.id);

                        return (
                          <div key={lead.id}>
                            <Card
                              className={`cursor-pointer border-white/[0.06] transition-colors hover:border-white/[0.12] ${
                                isSelected ? "ring-1 ring-primary/50" : ""
                              }`}
                              aria-selected={isSelected}
                            >
                              <CardContent className="p-3">
                                {/* Checkbox + name row */}
                                <div className="flex items-start gap-2">
                                  <button
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    aria-label={`Select ${lead.name}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSelect(lead.id);
                                    }}
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                      isSelected
                                        ? "border-primary bg-primary"
                                        : "border-white/20 hover:border-white/40"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 text-white" aria-hidden="true" />
                                    )}
                                  </button>

                                  <div
                                    className="flex-1 min-w-0"
                                    onClick={() => handleExpand(lead)}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={isExpanded}
                                    aria-label={`${lead.name}, score ${lead.score}, ${STATUS_SR_LABELS[lead.status as LeadStatus] || lead.status}`}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleExpand(lead);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold truncate">
                                        {lead.name}
                                      </span>
                                      <div
                                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${scoreBg(lead.score)} ${scoreColor(lead.score)}`}
                                        title={`Lead score: ${lead.score} (${scoreLabel(lead.score)})`}
                                      >
                                        {lead.score}
                                        <span className="sr-only"> lead score ({scoreLabel(lead.score)})</span>
                                      </div>
                                    </div>

                                    {/* Source + time */}
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <span
                                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                          SOURCE_COLORS[lead.source] ||
                                          "bg-white/[0.06] text-muted-foreground"
                                        }`}
                                      >
                                        {lead.source}
                                      </span>
                                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                        <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                                        <time dateTime={lead.date}>{timeAgo(lead.date)}</time>
                                      </span>
                                    </div>

                                    {/* Expand indicator */}
                                    <div className="mt-1 flex justify-end">
                                      {isExpanded ? (
                                        <ChevronUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Expanded details */}
                            {isExpanded && (
                              <Card className="mt-1 border-primary/20 bg-primary/[0.03]">
                                <CardContent className="p-3 space-y-3 text-sm">
                                  {/* Contact info */}
                                  {lead.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>{lead.email}</span>
                                    </div>
                                  )}
                                  {lead.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>{lead.phone}</span>
                                    </div>
                                  )}
                                  {lead.value != null && lead.value > 0 && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>
                                        {formatCurrency(lead.value)}
                                      </span>
                                    </div>
                                  )}
                                  {lead.nextFollowUpAt && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>
                                        Follow up:{" "}
                                        <time dateTime={lead.nextFollowUpAt}>
                                          {new Date(
                                            lead.nextFollowUpAt
                                          ).toLocaleDateString()}
                                        </time>
                                      </span>
                                    </div>
                                  )}

                                  {/* Score + Stage */}
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${scoreColor(lead.score)}`}
                                    >
                                      Score: {lead.score}
                                      <span className="sr-only"> ({scoreLabel(lead.score)})</span>
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {lead.stage}
                                    </Badge>
                                  </div>

                                  {/* Status change */}
                                  <div>
                                    <p className="text-xs font-medium mb-1.5 text-muted-foreground" id={`status-label-${lead.id}`}>
                                      Change status
                                    </p>
                                    <div className="flex flex-wrap gap-1" role="radiogroup" aria-labelledby={`status-label-${lead.id}`}>
                                      {STATUSES.map((s) => (
                                        <button
                                          key={s}
                                          disabled={saving}
                                          role="radio"
                                          aria-checked={lead.status === s}
                                          onClick={() =>
                                            handleStatusChange(lead.id, s)
                                          }
                                          className={`rounded-md px-2 py-0.5 text-[10px] font-medium capitalize transition-colors border ${
                                            lead.status === s
                                              ? STATUS_COLORS[s]
                                              : "border-white/[0.06] text-muted-foreground hover:border-white/20"
                                          }`}
                                        >
                                          {s}
                                          <span className="sr-only">{lead.status === s ? " (current)" : ""}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <StickyNote className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                      <label htmlFor={`notes-${lead.id}`} className="text-xs font-medium text-muted-foreground">
                                        Notes
                                      </label>
                                    </div>
                                    <Textarea
                                      id={`notes-${lead.id}`}
                                      rows={2}
                                      value={editNotes}
                                      onChange={(e) =>
                                        setEditNotes(e.target.value)
                                      }
                                      className="text-xs"
                                      placeholder="Add notes..."
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-1.5"
                                      disabled={saving}
                                      onClick={() => handleSaveNotes(lead.id)}
                                    >
                                      Save Notes
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
