"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Trash2,
  Copy,
  DollarSign,
  TrendingUp,
  BarChart3,
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

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  title: string;
  description: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  sentAt: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

interface QuoteResponse {
  quotes: Quote[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Send },
  accepted: { label: "Accepted", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  declined: { label: "Declined", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  expired: { label: "Expired", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<QuoteResponse>;
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QuotesPage() {
  const { toast } = useToast();
  const { data, mutate, isLoading } = useSWR<QuoteResponse>(
    "/api/dashboard/quotes",
    fetcher
  );

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    title: "",
    description: "",
    lineItems: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }] as LineItem[],
  });

  // Stats
  const stats = useMemo(() => {
    const quotes = data?.quotes || [];
    const totalQuoted = quotes.reduce((sum, q) => sum + q.total, 0);
    const accepted = quotes.filter((q) => q.status === "accepted");
    const totalAccepted = accepted.reduce((sum, q) => sum + q.total, 0);
    const acceptanceRate =
      quotes.filter((q) => q.status !== "draft").length > 0
        ? ((accepted.length / quotes.filter((q) => q.status !== "draft").length) * 100).toFixed(0)
        : "0";
    return { totalQuoted, totalAccepted, total: quotes.length, acceptanceRate };
  }, [data]);

  // Line item helpers
  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const items = [...formData.lineItems];
    const item = { ...items[index] };

    if (field === "description") {
      item.description = value as string;
    } else if (field === "quantity") {
      item.quantity = Number(value) || 0;
      item.total = item.quantity * item.unitPrice;
    } else if (field === "unitPrice") {
      item.unitPrice = Math.round(Number(value) * 100);
      item.total = item.quantity * item.unitPrice;
    }

    items[index] = item;
    setFormData({ ...formData, lineItems: items });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: "", quantity: 1, unitPrice: 0, total: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length <= 1) return;
    const items = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: items });
  };

  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax;

  // AI Generate
  const handleAIGenerate = useCallback(async () => {
    if (!aiDescription.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/dashboard/quotes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: aiDescription,
          customerName: formData.customerName || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const generated = await res.json();

      setFormData({
        ...formData,
        title: generated.title,
        description: generated.description,
        lineItems: generated.lineItems,
        customerName: generated.customerName || formData.customerName,
      });
      setAiMode(false);
    } catch {
      toast("We couldn't generate the quote. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  }, [aiDescription, formData, toast]);

  // Create quote
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const res = await fetch("/api/dashboard/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: formData.customerName,
            customerPhone: formData.customerPhone || undefined,
            customerEmail: formData.customerEmail || undefined,
            title: formData.title,
            description: formData.description,
            lineItems: formData.lineItems,
            subtotal,
            tax,
            total,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast(err.error || "We couldn't create the quote. Please check your details and try again.", "error");
          return;
        }
        setFormData({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          title: "",
          description: "",
          lineItems: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        });
        setShowForm(false);
        await mutate();
        toast("Quote created", "success");
      } finally {
        setSaving(false);
      }
    },
    [formData, subtotal, tax, total, mutate]
  );

  // Send quote
  const handleSend = useCallback(
    async (id: string) => {
      if (!confirm("Send this quote to the customer?")) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/dashboard/quotes/${id}`, { method: "POST" });
        if (!res.ok) throw new Error("Send failed");
        await mutate();
        toast("Quote sent to customer", "success");
      } catch {
        toast("We couldn't send the quote. Please try again.", "error");
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading quotes">
        <Header variant="minimal" />
        <main className="flex-1 py-8">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
              ))}
            </div>
            <span className="sr-only">Loading quotes data...</span>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" aria-label="Back to dashboard">
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">Quotes & Proposals</h1>
            </div>
            <Button onClick={() => setShowForm(!showForm)} aria-expanded={showForm}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              New Quote
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Quotes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <DollarSign className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalQuoted)}</p>
                  <p className="text-xs text-muted-foreground">Total Quoted</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalAccepted)}</p>
                  <p className="text-xs text-muted-foreground">Total Accepted</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <BarChart3 className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Create New Quote</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAiMode(!aiMode)}
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {aiMode ? "Manual Entry" : "AI Assist"}
                  </Button>
                </div>

                {/* AI Assist Mode */}
                {aiMode && (
                  <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <label htmlFor="ai-description" className="text-sm font-medium mb-2 block">
                      Describe the job and we will generate line items and pricing:
                    </label>
                    <Textarea
                      id="ai-description"
                      placeholder="e.g. Replace AC compressor unit, 2-ton system, residential home. Includes refrigerant recharge and thermostat check."
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      rows={3}
                    />
                    <Button
                      className="mt-3"
                      size="sm"
                      disabled={generating || !aiDescription.trim()}
                      onClick={handleAIGenerate}
                      aria-busy={generating}
                    >
                      {generating ? "Generating..." : "Generate Quote"}
                    </Button>
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4" aria-label="Create new quote">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="quote-customer-name" className="text-sm font-medium text-muted-foreground">
                        Customer Name *
                      </label>
                      <Input
                        id="quote-customer-name"
                        required
                        placeholder="John Smith"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="quote-phone" className="text-sm font-medium text-muted-foreground">
                        Phone
                      </label>
                      <Input
                        id="quote-phone"
                        type="tel"
                        placeholder="+15555551234"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="quote-email" className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <Input
                        id="quote-email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, customerEmail: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="quote-title" className="text-sm font-medium text-muted-foreground">
                      Quote Title *
                    </label>
                    <Input
                      id="quote-title"
                      required
                      placeholder="AC Compressor Replacement"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="quote-description" className="text-sm font-medium text-muted-foreground">
                      Description *
                    </label>
                    <Textarea
                      id="quote-description"
                      required
                      placeholder="Detailed description of the work to be performed..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Line Items
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addLineItem}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.lineItems.map((item, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                          <Input
                            placeholder="Description"
                            className="min-w-0 flex-1 basis-full sm:basis-auto"
                            value={item.description}
                            aria-label={`Line item ${index + 1} description`}
                            onChange={(e) =>
                              updateLineItem(index, "description", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            min="1"
                            className="w-20"
                            placeholder="Qty"
                            value={item.quantity || ""}
                            aria-label={`Line item ${index + 1} quantity`}
                            onChange={(e) =>
                              updateLineItem(index, "quantity", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-28"
                            placeholder="Price ($)"
                            value={item.unitPrice ? (item.unitPrice / 100).toFixed(2) : ""}
                            aria-label={`Line item ${index + 1} unit price`}
                            onChange={(e) =>
                              updateLineItem(index, "unitPrice", e.target.value)
                            }
                          />
                          <span className="w-24 text-right text-sm font-semibold tabular-nums" aria-label={`Line item ${index + 1} total: ${formatCurrency(item.total)}`}>
                            {formatCurrency(item.total)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            disabled={formData.lineItems.length <= 1}
                            aria-label={`Remove line item ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-white/[0.06] pt-4 space-y-1 text-right">
                    <p className="text-sm">
                      Subtotal: <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </p>
                    <p className="text-sm">
                      Tax (8%): <span className="font-semibold">{formatCurrency(tax)}</span>
                    </p>
                    <p className="text-lg font-bold">
                      Total: <span className="text-primary">{formatCurrency(total)}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Creating..." : "Create Quote"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Quote List */}
          <div className="space-y-3" role="list" aria-label="Quotes list">
            {(!data?.quotes || data.quotes.length === 0) && (
              <Card className="border-white/[0.06]">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                    <FileText className="h-7 w-7 text-blue-400/60" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold">No quotes yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Create professional quotes and proposals in seconds. Use AI Assist to auto-generate line items from a job description.
                  </p>
                  <Button className="mt-5" onClick={() => setShowForm(true)}>
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create Your First Quote
                  </Button>
                </CardContent>
              </Card>
            )}

            {data?.quotes.map((quote) => {
              const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
              const StatusIcon = cfg.icon;

              return (
                <Card key={quote.id} className="border-white/[0.06]" role="listitem">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`rounded-lg p-2 shrink-0 ${cfg.color.split(" ")[0]}`}>
                          <StatusIcon className={`h-5 w-5 ${cfg.color.split(" ")[1]}`} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold truncate">
                              {quote.title}
                            </span>
                            <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                              <span className="sr-only">Status: </span>{cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {quote.customerName}
                            {quote.lineItems.length > 0 &&
                              ` — ${quote.lineItems.length} item${quote.lineItems.length > 1 ? "s" : ""}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Created {formatDate(quote.createdAt)}
                            {quote.sentAt && ` — Sent ${formatDate(quote.sentAt)}`}
                            {quote.acceptedAt && ` — Accepted ${formatDate(quote.acceptedAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pl-11 sm:pl-0">
                        <span className="text-lg font-bold tabular-nums">
                          {formatCurrency(quote.total)}
                        </span>
                        {quote.status === "draft" && (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={saving}
                            onClick={() => handleSend(quote.id)}
                            aria-label={`Send quote: ${quote.title}`}
                          >
                            <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
