"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Ban,
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

interface Invoice {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  description: string;
  amount: number;
  status: string;
  stripePaymentLinkUrl: string | null;
  paidAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface InvoiceResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Send },
  paid: { label: "Paid", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Clock },
  canceled: { label: "Canceled", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: XCircle },
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
    return res.json() as Promise<InvoiceResponse>;
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InvoicesPage() {
  const { toast } = useToast();
  const { data, mutate, isLoading, error } = useSWR<InvoiceResponse>(
    "/api/dashboard/invoices",
    fetcher
  );

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    description: "",
    amount: "",
  });

  // Stats
  const stats = useMemo(() => {
    const invoices = data?.invoices || [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "pending")
      .reduce((sum, i) => sum + i.amount, 0);

    const paidThisMonth = invoices
      .filter(
        (i) => i.status === "paid" && i.paidAt && new Date(i.paidAt) >= monthStart
      )
      .reduce((sum, i) => sum + i.amount, 0);

    const totalSent = invoices.filter(
      (i) => i.status !== "canceled"
    ).length;

    const totalPaid = invoices.filter((i) => i.status === "paid").length;

    return { outstanding, paidThisMonth, totalSent, totalPaid };
  }, [data]);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const res = await fetch("/api/dashboard/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerEmail: formData.customerEmail || undefined,
            description: formData.description,
            amount: Math.round(parseFloat(formData.amount) * 100),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast(err.error || "We couldn't create the invoice. Please check your details and try again.", "error");
          return;
        }
        setFormData({ customerName: "", customerPhone: "", customerEmail: "", description: "", amount: "" });
        setShowForm(false);
        await mutate();
        toast("Invoice created and sent", "success");
      } finally {
        setSaving(false);
      }
    },
    [formData, mutate, toast]
  );

  const handleResend = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/dashboard/invoices/${id}`, { method: "POST" });
        if (!res.ok) throw new Error("Resend failed");
        await mutate();
        toast("Invoice resent", "success");
      } catch {
        toast("We couldn't resend the invoice. Please try again.", "error");
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  const handleCancel = useCallback(
    async (id: string) => {
      if (!confirm("Cancel this invoice?")) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/dashboard/invoices/${id}`, { method: "PATCH" });
        if (!res.ok) throw new Error("Cancel failed");
        await mutate();
        toast("Invoice canceled", "success");
      } catch {
        toast("We couldn't cancel the invoice. Please try again.", "error");
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8">
          <Container>
            <div className="flex items-center gap-3 mb-6">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">Text-to-Pay Invoices</h1>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
              Failed to load invoices. Please try refreshing the page.
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8">
          <Container>
            <div className="flex items-center justify-between mb-6">
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">Text-to-Pay Invoices</h1>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Invoice
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</p>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.paidThisMonth)}</p>
                  <p className="text-xs text-muted-foreground">Paid This Month</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Send className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSent}</p>
                  <p className="text-xs text-muted-foreground">Total Sent</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPaid}</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Create New Invoice</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="invoice-customer-name" className="text-sm font-medium text-muted-foreground">
                        Customer Name *
                      </label>
                      <Input
                        id="invoice-customer-name"
                        required
                        placeholder="John Smith"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="invoice-customer-phone" className="text-sm font-medium text-muted-foreground">
                        Phone Number *
                      </label>
                      <Input
                        id="invoice-customer-phone"
                        required
                        placeholder="+15555551234"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="invoice-customer-email" className="text-sm font-medium text-muted-foreground">
                        Email (optional)
                      </label>
                      <Input
                        id="invoice-customer-email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, customerEmail: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="invoice-amount" className="text-sm font-medium text-muted-foreground">
                        Amount ($) *
                      </label>
                      <Input
                        id="invoice-amount"
                        required
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="250.00"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="invoice-description" className="text-sm font-medium text-muted-foreground">
                      Description *
                    </label>
                    <Textarea
                      id="invoice-description"
                      required
                      placeholder="HVAC repair — replaced compressor unit"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} aria-busy={saving}>
                      {saving ? "Creating..." : "Create & Send Invoice"}
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

          {/* Invoice List */}
          <div className="space-y-3">
            {(!data?.invoices || data.invoices.length === 0) && (
              <Card className="border-white/[0.06]">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <DollarSign className="h-7 w-7 text-emerald-400/60" />
                  </div>
                  <h3 className="text-base font-semibold">No invoices yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Create your first text-to-pay invoice to get paid faster. Customers receive a secure payment link via SMS.
                  </p>
                  <Button className="mt-5" onClick={() => setShowForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Invoice
                  </Button>
                </CardContent>
              </Card>
            )}

            {data?.invoices.map((invoice) => {
              const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;

              return (
                <Card key={invoice.id} className="border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`rounded-lg p-2 ${cfg.color.split(" ")[0]}`} aria-hidden="true">
                          <StatusIcon className={`h-5 w-5 ${cfg.color.split(" ")[1]}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                              {invoice.customerName}
                            </span>
                            <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {invoice.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {invoice.customerPhone}
                            {invoice.sentAt && ` — Sent ${formatDate(invoice.sentAt)}`}
                            {invoice.paidAt && ` — Paid ${formatDate(invoice.paidAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-lg font-bold tabular-nums">
                          {formatCurrency(invoice.amount)}
                        </span>
                        {(invoice.status === "sent" || invoice.status === "pending") && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={saving}
                              onClick={() => handleResend(invoice.id)}
                              title="Resend SMS"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={saving}
                              onClick={() => handleCancel(invoice.id)}
                              title="Cancel"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
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
