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
  Download,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Copy,
  X,
  ArrowUpDown,
  MessageSquare,
  Mail,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/DatePicker";
import { useToast } from "@/components/ui/toast-context";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { exportCSV } from "@/lib/csv-export";
import type { ColumnDefinition } from "@/lib/csv-export";

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

interface LineItem {
  id: string;
  description: string;
  amount: string;
}

type StatusFilter =
  | "all"
  | "pending"
  | "sent"
  | "paid"
  | "overdue"
  | "canceled";
type SortField = "date" | "amount" | "status";
type SortDir = "asc" | "desc";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  sent: {
    label: "Sent",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Send,
  },
  paid: {
    label: "Paid",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  overdue: {
    label: "Overdue",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertTriangle,
  },
  canceled: {
    label: "Canceled",
    color: "bg-muted text-muted-foreground border-border/30",
    icon: XCircle,
  },
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "canceled", label: "Canceled" },
];

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

function getDaysOverdue(invoice: Invoice): number {
  if (invoice.status === "paid" || invoice.status === "canceled") return 0;
  const sent = invoice.sentAt
    ? new Date(invoice.sentAt)
    : new Date(invoice.createdAt);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (invoice.status === "overdue") return Math.max(diffDays, 1);
  return diffDays > 30 ? diffDays - 30 : 0;
}

function isOverdue(invoice: Invoice): boolean {
  if (invoice.status === "overdue") return true;
  if (invoice.status === "sent" && invoice.sentAt) {
    const sent = new Date(invoice.sentAt);
    return Date.now() - sent.getTime() > 30 * 24 * 60 * 60 * 1000;
  }
  return false;
}

function createLineItemId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<InvoiceResponse>;
  });

// ---------------------------------------------------------------------------
// Invoice Detail Modal
// ---------------------------------------------------------------------------

function InvoiceDetailModal({
  invoice,
  onClose,
  onMarkPaid,
  onResend,
  saving,
}: {
  invoice: Invoice;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onResend: (id: string) => void;
  saving: boolean;
}) {
  const effectiveStatus = isOverdue(invoice) ? "overdue" : invoice.status;
  const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.pending;
  const daysOver = getDaysOverdue(invoice);
  const { toast } = useToast();

  const handleCopyLink = useCallback(() => {
    if (invoice.stripePaymentLinkUrl) {
      navigator.clipboard.writeText(invoice.stripePaymentLinkUrl);
      toast("Payment link copied to clipboard", "success");
    }
  }, [invoice.stripePaymentLinkUrl, toast]);

  // Parse line items from description
  const lineItems = useMemo(() => {
    const lines = invoice.description
      .split("\n")
      .filter(
        (l) =>
          l.trim() &&
          !l.startsWith("Tax ") &&
          !l.startsWith("Notes:") &&
          !l.startsWith("Due:")
      );
    return lines.map((line) => {
      const parts = line.split(" | $");
      if (parts.length === 2) {
        return {
          description: parts[0].trim(),
          amount: parseFloat(parts[1]) * 100,
        };
      }
      return { description: line.trim(), amount: invoice.amount };
    });
  }, [invoice.description, invoice.amount]);

  const hasMultipleItems = lineItems.length > 1;
  const notesMatch = invoice.description.match(/Notes: (.+)/);
  const notes = notesMatch ? notesMatch[1] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Invoice details"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-background ring-1 ring-foreground/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 hover:bg-muted transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-foreground/5">
          <div className="flex items-start justify-between pr-8">
            <div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center mb-3">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Invoice</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                #{invoice.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <Badge variant="outline" className={`text-xs ${cfg.color} mt-1`}>
              {cfg.label}
            </Badge>
          </div>
        </div>

        {/* Customer */}
        <div className="px-6 py-4 border-b border-foreground/5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
            Bill To
          </p>
          <p className="font-semibold">{invoice.customerName}</p>
          <p className="text-sm text-muted-foreground">{invoice.customerPhone}</p>
          {invoice.customerEmail && (
            <p className="text-sm text-muted-foreground">{invoice.customerEmail}</p>
          )}
        </div>

        {/* Dates */}
        <div className="px-6 py-3 border-b border-foreground/5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Issued: </span>
            <span className="font-medium">{formatDate(invoice.createdAt)}</span>
          </div>
          {invoice.sentAt && (
            <div>
              <span className="text-muted-foreground">Sent: </span>
              <span className="font-medium">{formatDate(invoice.sentAt)}</span>
            </div>
          )}
          {invoice.paidAt && (
            <div>
              <span className="text-muted-foreground">Paid: </span>
              <span className="font-medium text-emerald-400">{formatDate(invoice.paidAt)}</span>
            </div>
          )}
        </div>

        {/* Overdue warning */}
        {isOverdue(invoice) && daysOver > 0 && (
          <div className="mx-6 mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-400 font-medium">
              {daysOver} day{daysOver !== 1 ? "s" : ""} overdue
            </span>
          </div>
        )}

        {/* Line items */}
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/5">
                <th className="text-left py-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Description
                </th>
                <th className="text-right py-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {hasMultipleItems ? (
                lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-foreground/5 last:border-0">
                    <td className="py-2.5">{item.description}</td>
                    <td className="py-2.5 text-right tabular-nums font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-foreground/5">
                  <td className="py-2.5">{invoice.description.split("\n")[0]}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">
                    {formatCurrency(invoice.amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-4 pt-3 border-t border-foreground/10">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold tabular-nums">
                {formatCurrency(invoice.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Notes</p>
            <p className="text-sm text-muted-foreground">{notes}</p>
          </div>
        )}

        {/* Payment link */}
        {invoice.stripePaymentLinkUrl &&
          invoice.status !== "paid" &&
          invoice.status !== "canceled" && (
            <div className="px-6 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">
                Payment Link
              </p>
              <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                  {invoice.stripePaymentLinkUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="rounded-md p-1.5 hover:bg-muted transition-colors shrink-0"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <a
                  href={invoice.stripePaymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 hover:bg-muted transition-colors shrink-0"
                  title="Open link"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="p-6 pt-2 flex flex-col gap-2 sm:flex-row">
          {invoice.status !== "paid" && invoice.status !== "canceled" && (
            <>
              <Button
                onClick={() => onMarkPaid(invoice.id)}
                disabled={saving}
                className="flex-1 min-h-[44px]"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Mark as Paid
              </Button>
              <Button
                variant="outline"
                onClick={() => onResend(invoice.id)}
                disabled={saving}
                className="flex-1 min-h-[44px]"
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Resend
              </Button>
            </>
          )}
          {invoice.status === "paid" && (
            <div className="w-full rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">
                  Payment received
                  {invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Invoice Form
// ---------------------------------------------------------------------------

function CreateInvoiceForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: createLineItemId(), description: "", amount: "" },
  ]);
  const [taxRate, setTaxRate] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [sendViaSms, setSendViaSms] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      { id: createLineItemId(), description: "", amount: "" },
    ]);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((i) => i.id !== id)
    );
  }, []);

  const updateLineItem = useCallback(
    (id: string, field: "description" | "amount", value: string) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const subtotalCents = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const val = parseFloat(item.amount);
      return sum + (isNaN(val) ? 0 : Math.round(val * 100));
    }, 0);
  }, [lineItems]);

  const taxRateNum = useMemo(() => {
    const val = parseFloat(taxRate);
    return isNaN(val) ? 0 : val;
  }, [taxRate]);

  const taxAmountCents = Math.round(subtotalCents * (taxRateNum / 100));
  const totalCents = subtotalCents + taxAmountCents;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validItems = lineItems.filter(
        (item) => item.description.trim() && parseFloat(item.amount) > 0
      );
      if (validItems.length === 0) {
        toast("Add at least one line item with a description and amount.", "error");
        return;
      }
      if (totalCents < 100) {
        toast("Total must be at least $1.00.", "error");
        return;
      }

      setSaving(true);
      try {
        const parts: string[] = [];
        if (validItems.length === 1) {
          parts.push(validItems[0].description);
        } else {
          validItems.forEach((item) => {
            parts.push(`${item.description} | $${parseFloat(item.amount).toFixed(2)}`);
          });
        }
        if (taxRateNum > 0) parts.push(`Tax (${taxRateNum}%)`);
        if (dueDate) {
          parts.push(
            `Due: ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
          );
        }
        if (notes.trim()) parts.push(`Notes: ${notes.trim()}`);

        const res = await fetch("/api/dashboard/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            customerPhone,
            customerEmail: customerEmail || undefined,
            description: parts.join("\n"),
            amount: totalCents,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast(
            err.error || "We couldn't create the invoice. Please check your details and try again.",
            "error"
          );
          return;
        }

        onCreated();
        toast("Invoice created and sent", "success");
      } finally {
        setSaving(false);
      }
    },
    [customerName, customerPhone, customerEmail, lineItems, taxRateNum, notes, dueDate, totalCents, onCreated, toast]
  );

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Create New Invoice</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
            aria-label="Close form"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer details */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
              Customer Details
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="inv-name" className="text-sm font-medium text-muted-foreground">
                  Customer Name *
                </label>
                <Input
                  id="inv-name"
                  required
                  placeholder="John Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="inv-phone" className="text-sm font-medium text-muted-foreground">
                  Phone Number *
                </label>
                <Input
                  id="inv-phone"
                  required
                  placeholder="+15555551234"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inv-email" className="text-sm font-medium text-muted-foreground">
                  Email (optional)
                </label>
                <Input
                  id="inv-email"
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Line Items
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={addLineItem} className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    {idx === 0 && (
                      <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                    )}
                    <Input
                      placeholder="HVAC repair — replaced compressor"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-28">
                    {idx === 0 && (
                      <label className="text-xs text-muted-foreground mb-1 block">Amount ($)</label>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="250.00"
                      value={item.amount}
                      onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                      required
                    />
                  </div>
                  <div className={idx === 0 ? "mt-5" : ""}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length <= 1}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax + Due date */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="inv-tax" className="text-sm font-medium text-muted-foreground">
                Tax Rate (%)
              </label>
              <Input
                id="inv-tax"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Due Date (optional)
              </label>
              <DatePicker
                value={dueDate}
                onChange={(d) => setDueDate(d)}
                placeholder="Select due date"
                minDate={new Date()}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="inv-notes" className="text-sm font-medium text-muted-foreground">
              Notes / Terms (optional)
            </label>
            <Textarea
              id="inv-notes"
              placeholder="Payment due within 30 days. Thank you for your business!"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Send method toggles */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={sendViaSms} onCheckedChange={setSendViaSms} />
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Send via SMS</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={sendViaEmail} onCheckedChange={setSendViaEmail} />
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Send via Email</span>
            </label>
          </div>

          {/* Total preview */}
          <div className="rounded-xl bg-muted/50 ring-1 ring-foreground/5 p-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({lineItems.length} item{lineItems.length !== 1 ? "s" : ""})
                </span>
                <span className="tabular-nums font-medium">{formatCurrency(subtotalCents)}</span>
              </div>
              {taxRateNum > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({taxRateNum}%)</span>
                  <span className="tabular-nums font-medium">{formatCurrency(taxAmountCents)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-foreground/10 text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold tabular-nums">{formatCurrency(totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={saving} aria-busy={saving} className="w-full sm:w-auto min-h-[44px]">
              {saving ? "Creating..." : "Create & Send Invoice"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto min-h-[44px]">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function InvoicesPage() {
  const { toast } = useToast();
  const { data, mutate, isLoading, error } = useSWR<InvoiceResponse>(
    "/api/dashboard/invoices",
    fetcher
  );

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Stats
  const stats = useMemo(() => {
    const invoices = data?.invoices || [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + i.amount, 0);

    const paidThisMonth = invoices
      .filter((i) => i.status === "paid" && i.paidAt && new Date(i.paidAt) >= monthStart)
      .reduce((sum, i) => sum + i.amount, 0);

    const totalNonCanceled = invoices.filter((i) => i.status !== "canceled").length;
    const totalPaid = invoices.filter((i) => i.status === "paid").length;

    const paidWithDates = invoices.filter((i) => i.status === "paid" && i.paidAt && i.sentAt);
    const avgDaysToPayment =
      paidWithDates.length > 0
        ? Math.round(
            paidWithDates.reduce((sum, i) => {
              const sent = new Date(i.sentAt!).getTime();
              const paid = new Date(i.paidAt!).getTime();
              return sum + (paid - sent) / (1000 * 60 * 60 * 24);
            }, 0) / paidWithDates.length
          )
        : 0;

    const collectionRate =
      totalNonCanceled > 0 ? Math.round((totalPaid / totalNonCanceled) * 100) : 0;

    const overdueCount = invoices.filter((i) => isOverdue(i)).length;

    return {
      outstanding,
      paidThisMonth,
      totalSent: totalNonCanceled,
      totalPaid,
      avgDaysToPayment,
      collectionRate,
      overdueCount,
    };
  }, [data]);

  // Filtered & sorted
  const filteredInvoices = useMemo(() => {
    const invoices = data?.invoices || [];

    const filtered =
      statusFilter === "all"
        ? invoices
        : statusFilter === "overdue"
          ? invoices.filter((i) => isOverdue(i))
          : invoices.filter((i) => i.status === statusFilter);

    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "date":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "amount":
          return dir * (a.amount - b.amount);
        case "status": {
          const order: Record<string, number> = { overdue: 0, pending: 1, sent: 2, paid: 3, canceled: 4 };
          return dir * ((order[a.status] ?? 5) - (order[b.status] ?? 5));
        }
        default:
          return 0;
      }
    });
  }, [data, statusFilter, sortField, sortDir]);

  // Actions
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
        setSelectedInvoice(null);
        toast("Invoice canceled", "success");
      } catch {
        toast("We couldn't cancel the invoice. Please try again.", "error");
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  const handleMarkPaid = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/dashboard/invoices/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "paid" }),
        });
        if (!res.ok) throw new Error("Mark paid failed");
        await mutate();
        setSelectedInvoice(null);
        toast("Invoice marked as paid", "success");
      } catch {
        toast("We couldn't update the invoice. Please try again.", "error");
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  const handleExportCSV = useCallback(() => {
    const invoices = data?.invoices;
    if (!invoices || invoices.length === 0) return;
    const columns: ColumnDefinition<Record<string, unknown>>[] = [
      { key: "customerName", header: "Customer" },
      { key: "customerEmail", header: "Email" },
      { key: "customerPhone", header: "Phone" },
      { key: "description", header: "Description" },
      { key: "amount", header: "Amount", format: (v) => `${(((v as number) ?? 0) / 100).toFixed(2)}` },
      { key: "status", header: "Status" },
      { key: "createdAt", header: "Created" },
      { key: "paidAt", header: "Paid Date", format: (v) => (v ? formatDate(v as string) : "") },
    ];
    exportCSV(invoices as unknown as Record<string, unknown>[], columns, "invoices");
  }, [data]);

  // Error state
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

  // Loading state
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
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
          {/* Page header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Text-to-Pay Invoices</h1>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(data?.invoices?.length ?? 0) > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="min-h-[44px]">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </Button>
              )}
              <Button onClick={() => setShowForm(!showForm)} className="flex-1 sm:flex-none min-h-[44px]">
                <Plus className="mr-1.5 h-4 w-4" />
                New Invoice
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
            <Card className="border-white/[0.06] card-interactive">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 hidden sm:block">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.outstanding)}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Outstanding</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] card-interactive">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 hidden sm:block">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.paidThisMonth)}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Paid This Month</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] card-interactive">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 hidden sm:block">
                  <Send className="h-5 w-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalSent}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Total Sent</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] card-interactive">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2 hidden sm:block">
                  <CheckCircle2 className="h-5 w-5 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalPaid}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Total Paid</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] card-interactive">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-cyan-500/10 p-2 hidden sm:block">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">
                    {stats.avgDaysToPayment}
                    <span className="text-sm font-normal text-muted-foreground ml-0.5">d</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Avg. Days to Pay</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] card-interactive">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-pink-500/10 p-2 hidden sm:block">
                  <Percent className="h-5 w-5 text-pink-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">
                    {stats.collectionRate}
                    <span className="text-sm font-normal text-muted-foreground">%</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Collection Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create form */}
          {showForm && (
            <CreateInvoiceForm
              onClose={() => setShowForm(false)}
              onCreated={() => {
                setShowForm(false);
                mutate();
              }}
            />
          )}

          {/* Status filter tabs + sort controls */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
              {STATUS_TABS.map((tab) => {
                const isActive = statusFilter === tab.value;
                const count =
                  tab.value === "all"
                    ? data?.invoices.length || 0
                    : tab.value === "overdue"
                      ? stats.overdueCount
                      : (data?.invoices || []).filter((i) => i.status === tab.value).length;

                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`ml-1.5 text-xs ${isActive ? "text-primary/70" : "text-muted-foreground/60"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              {(["date", "amount", "status"] as SortField[]).map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    sortField === field
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  {sortField === field && <ArrowUpDown className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice list */}
          <div className="space-y-2">
            {filteredInvoices.length === 0 && !showForm && (
              <>
                {statusFilter === "all" && (!data?.invoices || data.invoices.length === 0) ? (
                  <EmptyState
                    icon={DollarSign}
                    title="Create your first text-to-pay invoice in 30 seconds"
                    description="Send a secure payment link via SMS and get paid faster. Your customer taps the link, pays instantly, and you get notified in real time."
                    actionLabel="Create Your First Invoice"
                    onAction={() => setShowForm(true)}
                    secondaryLabel="Learn How It Works"
                    secondaryHref="/knowledge?category=services"
                  />
                ) : (
                  <Card className="border-white/[0.06]">
                    <CardContent className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        No {statusFilter === "all" ? "" : statusFilter + " "}invoices found.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {filteredInvoices.map((invoice) => {
              const overdue = isOverdue(invoice);
              const effectiveStatus = overdue ? "overdue" : invoice.status;
              const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const daysOver = getDaysOverdue(invoice);

              return (
                <Card
                  key={invoice.id}
                  className={`transition-colors hover:bg-muted/30 cursor-pointer ${
                    overdue ? "border-red-500/20 bg-red-500/[0.03]" : "border-white/[0.06]"
                  }`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`rounded-lg p-2 shrink-0 ${cfg.color.split(" ")[0]}`} aria-hidden="true">
                          <StatusIcon className={`h-5 w-5 ${cfg.color.split(" ")[1]}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">{invoice.customerName}</span>
                            <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                              {cfg.label}
                            </Badge>
                            {overdue && daysOver > 0 && (
                              <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {daysOver}d overdue
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {invoice.description.split("\n")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {invoice.customerPhone}
                            {invoice.sentAt && ` — Sent ${formatDate(invoice.sentAt)}`}
                            {invoice.paidAt && ` — Paid ${formatDate(invoice.paidAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-base sm:text-lg font-bold tabular-nums">
                          {formatCurrency(invoice.amount)}
                        </span>
                        {(invoice.status === "sent" || invoice.status === "pending" || overdue) && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 min-h-[44px] min-w-[44px]"
                              disabled={saving}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResend(invoice.id);
                              }}
                              title="Resend SMS"
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span className="sr-only">Resend SMS</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 min-h-[44px] min-w-[44px]"
                              disabled={saving}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(invoice.id);
                              }}
                              title="Cancel"
                            >
                              <Ban className="h-4 w-4" />
                              <span className="sr-only">Cancel invoice</span>
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

      {/* Invoice detail modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onMarkPaid={handleMarkPaid}
          onResend={handleResend}
          saving={saving}
        />
      )}
    </div>
  );
}
