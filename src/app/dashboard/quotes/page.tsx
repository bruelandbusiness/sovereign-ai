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
  DollarSign,
  TrendingUp,
  BarChart3,
  Eye,
  Copy,
  ArrowRightLeft,
  Mail,
  MessageSquare,
  AlertTriangle,
  X,
  Printer,
  Search,
  Filter,
  MoreHorizontal,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  customerAddress: string;
  title: string;
  description: string;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
  sentAt: string | null;
  viewedAt: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  validityDays: number;
  terms: string;
  notes: string;
}

interface QuoteResponse {
  quotes: Quote[];
  total: number;
  page: number;
  totalPages: number;
}

type StatusFilter = "all" | "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    color: "bg-muted text-muted-foreground border-border/30",
    icon: FileText,
  },
  sent: {
    label: "Sent",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Send,
  },
  viewed: {
    label: "Viewed",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Eye,
  },
  accepted: {
    label: "Accepted",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Clock,
  },
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "accepted", label: "Won" },
  { value: "declined", label: "Lost" },
  { value: "expired", label: "Expired" },
];

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_QUOTES: Quote[] = [
  {
    id: "q-001",
    customerName: "Robert & Linda Chen",
    customerPhone: "+15551234567",
    customerEmail: "rchen@email.com",
    customerAddress: "4521 Oak Ridge Dr, Austin, TX 78745",
    title: "Full HVAC System Replacement",
    description: "Remove existing 15-year-old Trane system and install new 3-ton Carrier Infinity 24ANB1 with matching air handler. Includes new ductwork modifications, smart thermostat, and 10-year warranty.",
    lineItems: [
      { description: "Carrier Infinity 24ANB1 3-ton AC Unit", quantity: 1, unitPrice: 425000, total: 425000 },
      { description: "Carrier FE4ANB006 Air Handler", quantity: 1, unitPrice: 285000, total: 285000 },
      { description: "Ecobee Smart Thermostat Premium", quantity: 1, unitPrice: 24999, total: 24999 },
      { description: "Ductwork Modification & Sealing", quantity: 1, unitPrice: 85000, total: 85000 },
      { description: "Labor — Removal & Installation (2 crew, 2 days)", quantity: 1, unitPrice: 320000, total: 320000 },
      { description: "Permit & Inspection Fee", quantity: 1, unitPrice: 15000, total: 15000 },
    ],
    subtotal: 1154999,
    discount: 75000,
    tax: 86400,
    total: 1166399,
    status: "accepted",
    sentAt: "2026-03-10T09:00:00Z",
    viewedAt: "2026-03-10T14:22:00Z",
    expiresAt: "2026-04-09T09:00:00Z",
    acceptedAt: "2026-03-12T16:45:00Z",
    declinedAt: null,
    createdAt: "2026-03-09T15:30:00Z",
    validityDays: 30,
    terms: "50% deposit required upon acceptance. Remaining balance due upon completion. All work guaranteed for 1 year. Equipment covered by manufacturer 10-year warranty.",
    notes: "Homeowner prefers morning installation start. Has two dogs that will need to be kept in back bedroom during install.",
  },
  {
    id: "q-002",
    customerName: "Sarah Mitchell",
    customerPhone: "+15559876543",
    customerEmail: "sarah.m@gmail.com",
    customerAddress: "789 Elm Street, Austin, TX 78704",
    title: "Emergency Pipe Repair & Water Heater",
    description: "Repair burst pipe under kitchen sink, replace corroded section of copper line, and install new 50-gallon Rheem water heater to replace failing unit.",
    lineItems: [
      { description: "Copper Pipe Repair (6ft section)", quantity: 1, unitPrice: 35000, total: 35000 },
      { description: "Rheem 50-Gal Gas Water Heater", quantity: 1, unitPrice: 125000, total: 125000 },
      { description: "Water Heater Installation Labor", quantity: 1, unitPrice: 45000, total: 45000 },
      { description: "Pipe Repair Labor", quantity: 1, unitPrice: 28000, total: 28000 },
      { description: "Parts & Fittings", quantity: 1, unitPrice: 8500, total: 8500 },
    ],
    subtotal: 241500,
    discount: 0,
    tax: 19320,
    total: 260820,
    status: "sent",
    sentAt: "2026-03-26T11:00:00Z",
    viewedAt: null,
    expiresAt: "2026-04-09T11:00:00Z",
    acceptedAt: null,
    declinedAt: null,
    createdAt: "2026-03-26T10:15:00Z",
    validityDays: 14,
    terms: "Payment due upon completion. Parts warranty per manufacturer. Labor guaranteed for 90 days.",
    notes: "Customer mentioned water heater is making rumbling noises. May need same-day scheduling if pipe situation worsens.",
  },
  {
    id: "q-003",
    customerName: "Mark & Jennifer Davis",
    customerPhone: "+15552345678",
    customerEmail: "mdavis@outlook.com",
    customerAddress: "1200 Sunset Blvd, Round Rock, TX 78664",
    title: "Complete Roof Replacement — Architectural Shingles",
    description: "Full tear-off of existing 3-tab shingles on 2,400 sq ft roof. Install GAF Timberline HDZ architectural shingles with new underlayment, ridge vent, and flashing.",
    lineItems: [
      { description: "GAF Timberline HDZ Shingles (24 sq)", quantity: 24, unitPrice: 12500, total: 300000 },
      { description: "GAF FeltBuster Underlayment", quantity: 24, unitPrice: 2800, total: 67200 },
      { description: "Ridge Vent (40 linear ft)", quantity: 40, unitPrice: 1200, total: 48000 },
      { description: "Drip Edge & Flashing", quantity: 1, unitPrice: 35000, total: 35000 },
      { description: "Tear-off & Disposal (24 sq)", quantity: 24, unitPrice: 5500, total: 132000 },
      { description: "Installation Labor (3 crew, 3 days)", quantity: 1, unitPrice: 480000, total: 480000 },
      { description: "Permit & Inspection", quantity: 1, unitPrice: 25000, total: 25000 },
    ],
    subtotal: 1087200,
    discount: 50000,
    tax: 82976,
    total: 1120176,
    status: "viewed",
    sentAt: "2026-03-24T08:00:00Z",
    viewedAt: "2026-03-24T19:10:00Z",
    expiresAt: "2026-04-23T08:00:00Z",
    acceptedAt: null,
    declinedAt: null,
    createdAt: "2026-03-23T16:45:00Z",
    validityDays: 30,
    terms: "1/3 deposit on acceptance, 1/3 at midpoint, final 1/3 upon completion and inspection. GAF System Plus warranty included (50-year limited).",
    notes: "Prefer Weathered Wood color. HOA approval required — homeowner will handle submission.",
  },
  {
    id: "q-004",
    customerName: "David Park",
    customerPhone: "+15553456789",
    customerEmail: "dpark@email.com",
    customerAddress: "330 Congress Ave #12, Austin, TX 78701",
    title: "Bathroom Remodel — Master Bath",
    description: "Complete master bathroom renovation including new tile, vanity, shower enclosure, plumbing fixtures, and lighting.",
    lineItems: [
      { description: "Porcelain Floor Tile (120 sq ft)", quantity: 120, unitPrice: 850, total: 102000 },
      { description: "Shower Wall Tile (80 sq ft)", quantity: 80, unitPrice: 1200, total: 96000 },
      { description: "Double Vanity w/ Quartz Top", quantity: 1, unitPrice: 185000, total: 185000 },
      { description: "Frameless Glass Shower Enclosure", quantity: 1, unitPrice: 145000, total: 145000 },
      { description: "Plumbing Fixtures (Delta Trinsic)", quantity: 1, unitPrice: 65000, total: 65000 },
      { description: "Demolition & Prep", quantity: 1, unitPrice: 45000, total: 45000 },
      { description: "Installation Labor (2 crew, 5 days)", quantity: 1, unitPrice: 350000, total: 350000 },
    ],
    subtotal: 988000,
    discount: 0,
    tax: 79040,
    total: 1067040,
    status: "declined",
    sentAt: "2026-03-15T10:00:00Z",
    viewedAt: "2026-03-15T18:30:00Z",
    expiresAt: "2026-04-14T10:00:00Z",
    acceptedAt: null,
    declinedAt: "2026-03-18T09:15:00Z",
    createdAt: "2026-03-14T14:20:00Z",
    validityDays: 30,
    terms: "50% deposit required. Final payment upon completion. Tile selection subject to availability.",
    notes: "Customer wanted to compare with another contractor. Follow up in 2 weeks if no response.",
  },
  {
    id: "q-005",
    customerName: "Amanda Torres",
    customerPhone: "+15554567890",
    customerEmail: "atorres@email.com",
    customerAddress: "5678 Lamar Blvd, Austin, TX 78751",
    title: "Electrical Panel Upgrade — 200A",
    description: "Upgrade existing 100A panel to 200A service. Includes new meter base, main breaker panel, and whole-house surge protector.",
    lineItems: [
      { description: "200A Main Breaker Panel (Square D)", quantity: 1, unitPrice: 85000, total: 85000 },
      { description: "New Meter Base & Weatherhead", quantity: 1, unitPrice: 35000, total: 35000 },
      { description: "Whole-House Surge Protector", quantity: 1, unitPrice: 22000, total: 22000 },
      { description: "Wire & Conduit Materials", quantity: 1, unitPrice: 18000, total: 18000 },
      { description: "Installation Labor", quantity: 1, unitPrice: 175000, total: 175000 },
      { description: "Permit & Inspection", quantity: 1, unitPrice: 20000, total: 20000 },
    ],
    subtotal: 355000,
    discount: 15000,
    tax: 27200,
    total: 367200,
    status: "draft",
    sentAt: null,
    viewedAt: null,
    expiresAt: null,
    acceptedAt: null,
    declinedAt: null,
    createdAt: "2026-03-28T08:00:00Z",
    validityDays: 14,
    terms: "Full payment due upon completion. Work guaranteed for 1 year. Panel covered by manufacturer warranty.",
    notes: "Customer is adding EV charger next month — panel upgrade needed first. Coordinate with Austin Energy for meter swap.",
  },
  {
    id: "q-006",
    customerName: "James & Patricia Wilson",
    customerPhone: "+15555678901",
    customerEmail: "jwilson@email.com",
    customerAddress: "920 Barton Springs Rd, Austin, TX 78704",
    title: "Landscape Irrigation System Install",
    description: "Install complete 8-zone irrigation system with smart controller, rain sensor, and drip zones for garden beds.",
    lineItems: [
      { description: "Rachio 3 Smart Controller (8-zone)", quantity: 1, unitPrice: 22999, total: 22999 },
      { description: "Rain Bird Pop-up Sprinkler Heads", quantity: 32, unitPrice: 1500, total: 48000 },
      { description: "Drip Line Kit (garden beds, 200ft)", quantity: 1, unitPrice: 18000, total: 18000 },
      { description: "PVC Pipe, Fittings & Valves", quantity: 1, unitPrice: 28000, total: 28000 },
      { description: "Wireless Rain Sensor", quantity: 1, unitPrice: 4500, total: 4500 },
      { description: "Trenching & Installation Labor", quantity: 1, unitPrice: 195000, total: 195000 },
    ],
    subtotal: 316499,
    discount: 0,
    tax: 25320,
    total: 341819,
    status: "expired",
    sentAt: "2026-02-15T09:00:00Z",
    viewedAt: "2026-02-16T11:30:00Z",
    expiresAt: "2026-03-01T09:00:00Z",
    acceptedAt: null,
    declinedAt: null,
    createdAt: "2026-02-14T13:00:00Z",
    validityDays: 14,
    terms: "50% deposit upon acceptance. Balance due upon completion and system walkthrough.",
    notes: "Quote expired — customer was waiting on HOA landscape approval. Re-send if they reach back out.",
  },
  {
    id: "q-007",
    customerName: "Karen Nguyen",
    customerPhone: "+15556789012",
    customerEmail: "knguyen@email.com",
    customerAddress: "2100 S Lamar Blvd, Austin, TX 78704",
    title: "AC Tune-Up & Duct Cleaning",
    description: "Annual HVAC maintenance service with full duct cleaning. System is a 4-year-old Lennox.",
    lineItems: [
      { description: "AC Tune-Up Service", quantity: 1, unitPrice: 14900, total: 14900 },
      { description: "Full Duct Cleaning (8 vents)", quantity: 8, unitPrice: 3500, total: 28000 },
      { description: "Filter Replacement (MERV 13)", quantity: 2, unitPrice: 2500, total: 5000 },
    ],
    subtotal: 47900,
    discount: 5000,
    tax: 3432,
    total: 46332,
    status: "accepted",
    sentAt: "2026-03-20T10:00:00Z",
    viewedAt: "2026-03-20T12:45:00Z",
    expiresAt: "2026-04-03T10:00:00Z",
    acceptedAt: "2026-03-21T08:30:00Z",
    declinedAt: null,
    createdAt: "2026-03-20T09:00:00Z",
    validityDays: 14,
    terms: "Payment due upon completion of service.",
    notes: "Schedule for a weekday morning. Customer works from home.",
  },
  {
    id: "q-008",
    customerName: "Tom Bradley",
    customerPhone: "+15557890123",
    customerEmail: "tbradley@email.com",
    customerAddress: "456 Manor Rd, Austin, TX 78723",
    title: "Fence Replacement — Cedar Privacy",
    description: "Remove and replace 180 linear feet of existing wood fence with 6ft cedar privacy fence, including two gates.",
    lineItems: [
      { description: "6ft Cedar Privacy Fence Panels (180 lft)", quantity: 180, unitPrice: 3200, total: 576000 },
      { description: "4x4 Cedar Posts (set in concrete)", quantity: 30, unitPrice: 4500, total: 135000 },
      { description: "Cedar Gate (42\" walk-through)", quantity: 2, unitPrice: 25000, total: 50000 },
      { description: "Old Fence Removal & Disposal", quantity: 1, unitPrice: 65000, total: 65000 },
      { description: "Installation Labor (2 crew, 3 days)", quantity: 1, unitPrice: 280000, total: 280000 },
    ],
    subtotal: 1106000,
    discount: 100000,
    tax: 80480,
    total: 1086480,
    status: "sent",
    sentAt: "2026-03-25T14:00:00Z",
    viewedAt: null,
    expiresAt: "2026-04-08T14:00:00Z",
    acceptedAt: null,
    declinedAt: null,
    createdAt: "2026-03-25T12:30:00Z",
    validityDays: 14,
    terms: "50% deposit upon acceptance. Balance due upon completion. Cedar will weather naturally to silver-gray unless customer applies sealant.",
    notes: "Neighbor on east side has agreed to split cost of shared section. Verify property line before install.",
  },
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

function _formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function needsFollowUp(quote: Quote): boolean {
  if (quote.status !== "sent") return false;
  if (!quote.sentAt) return false;
  const sentTime = new Date(quote.sentAt).getTime();
  const now = Date.now();
  const hoursSinceSent = (now - sentTime) / (1000 * 60 * 60);
  return hoursSinceSent >= 48;
}

function daysUntilExpiry(quote: Quote): number | null {
  if (!quote.expiresAt) return null;
  const now = Date.now();
  const expiry = new Date(quote.expiresAt).getTime();
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<QuoteResponse>;
  });

// ---------------------------------------------------------------------------
// Quote Preview Modal
// ---------------------------------------------------------------------------

function QuotePreviewModal({
  quote,
  open,
  onClose,
}: {
  quote: Quote;
  open: boolean;
  onClose: () => void;
}) {
  const expiryDays = daysUntilExpiry(quote);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quote Preview</DialogTitle>
          <DialogDescription>
            Professional quote ready to send to {quote.customerName}
          </DialogDescription>
        </DialogHeader>

        {/* Quote document */}
        <div className="rounded-xl border border-white/[0.06] bg-card p-6 space-y-6">
          {/* Business header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <span className="text-lg font-bold">Sovereign AI</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Professional Home Services
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Quote
              </p>
              <p className="text-sm font-mono text-muted-foreground">
                #{quote.id.toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(quote.createdAt)}
              </p>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.06] p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Prepared For
              </p>
              <p className="font-semibold">{quote.customerName}</p>
              {quote.customerAddress && (
                <p className="text-sm text-muted-foreground">{quote.customerAddress}</p>
              )}
              {quote.customerEmail && (
                <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
              )}
              {quote.customerPhone && (
                <p className="text-sm text-muted-foreground">{quote.customerPhone}</p>
              )}
            </div>
            <div className="rounded-lg border border-white/[0.06] p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Quote Details
              </p>
              <p className="font-semibold">{quote.title}</p>
              {quote.expiresAt && (
                <p className="text-sm text-muted-foreground">
                  Valid until {formatDate(quote.expiresAt)}
                  {expiryDays !== null && expiryDays > 0 && expiryDays <= 7 && (
                    <span className="text-amber-400 ml-1">
                      ({expiryDays} day{expiryDays !== 1 ? "s" : ""} left)
                    </span>
                  )}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {quote.description}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Quote line items">
              <thead>
                <tr className="text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="pb-2 px-2 text-left font-medium">Item</th>
                  <th className="pb-2 px-2 text-right font-medium">Qty</th>
                  <th className="pb-2 px-2 text-right font-medium">Unit Price</th>
                  <th className="pb-2 px-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="py-2 px-2 font-medium">{item.description}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2 text-right text-muted-foreground tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 px-2 text-right font-semibold tabular-nums">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-white/[0.06] pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">Discount</span>
                <span className="text-emerald-400 tabular-nums">
                  -{formatCurrency(quote.discount)}
                </span>
              </div>
            )}
            {quote.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(quote.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/[0.06]">
              <span>Total</span>
              <span className="text-primary tabular-nums">
                {formatCurrency(quote.total)}
              </span>
            </div>
          </div>

          {/* Terms & Notes */}
          {quote.terms && (
            <div className="rounded-lg border border-white/[0.06] p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Terms & Conditions
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {quote.terms}
              </p>
            </div>
          )}

          {quote.notes && (
            <div className="rounded-lg border border-white/[0.06] p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {quote.notes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            aria-label="Print quote"
          >
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Send Quote Modal
// ---------------------------------------------------------------------------

function SendQuoteModal({
  quote,
  open,
  onClose,
  onSend,
  sending,
}: {
  quote: Quote;
  open: boolean;
  onClose: () => void;
  onSend: (method: "email" | "sms") => void;
  sending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Quote</DialogTitle>
          <DialogDescription>
            Choose how to send this quote to {quote.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-3">
            <p className="text-sm font-semibold">{quote.title}</p>
            <p className="text-lg font-bold text-primary tabular-nums">
              {formatCurrency(quote.total)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-lg border border-white/[0.06] p-4 hover:bg-muted/50 transition-colors disabled:opacity-50"
              disabled={sending || !quote.customerEmail}
              onClick={() => onSend("email")}
            >
              <div className="rounded-full bg-blue-500/10 p-3">
                <Mail className="h-6 w-6 text-blue-400" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium">Send via Email</span>
              <span className="text-xs text-muted-foreground truncate max-w-full">
                {quote.customerEmail || "No email on file"}
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-lg border border-white/[0.06] p-4 hover:bg-muted/50 transition-colors disabled:opacity-50"
              disabled={sending || !quote.customerPhone}
              onClick={() => onSend("sms")}
            >
              <div className="rounded-full bg-emerald-500/10 p-3">
                <MessageSquare className="h-6 w-6 text-emerald-400" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium">Send via SMS</span>
              <span className="text-xs text-muted-foreground truncate max-w-full">
                {quote.customerPhone || "No phone on file"}
              </span>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function QuotesPage() {
  const { toast } = useToast();
  const { data, mutate, isLoading } = useSWR<QuoteResponse>(
    "/api/dashboard/quotes",
    fetcher
  );

  // Use demo data when API returns nothing
  const quotes = useMemo(() => {
    if (data?.quotes && data.quotes.length > 0) return data.quotes as Quote[];
    return DEMO_QUOTES;
  }, [data]);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [sendQuote, setSendQuote] = useState<Quote | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    title: "",
    description: "",
    lineItems: [
      { description: "", quantity: 1, unitPrice: 0, total: 0 },
    ] as LineItem[],
    discount: 0,
    validityDays: 30,
    terms: "50% deposit required upon acceptance. Remaining balance due upon completion. All work guaranteed for 1 year.",
    notes: "",
  });

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const totalQuoted = quotes.reduce((sum, q) => sum + q.total, 0);
    const accepted = quotes.filter((q) => q.status === "accepted");
    const declined = quotes.filter((q) => q.status === "declined");
    const totalAccepted = accepted.reduce((sum, q) => sum + q.total, 0);
    const sentAndResolved = quotes.filter(
      (q) => q.status !== "draft"
    ).length;
    const acceptanceRate =
      sentAndResolved > 0
        ? ((accepted.length / sentAndResolved) * 100).toFixed(0)
        : "0";
    const avgQuoteValue =
      quotes.length > 0
        ? Math.round(totalQuoted / quotes.length)
        : 0;
    const followUpCount = quotes.filter(needsFollowUp).length;

    return {
      total: quotes.length,
      totalQuoted,
      totalAccepted,
      acceptanceRate,
      avgQuoteValue,
      won: accepted.length,
      lost: declined.length,
      followUpCount,
    };
  }, [quotes]);

  // ---------------------------------------------------------------------------
  // Filtered & searched quotes
  // ---------------------------------------------------------------------------

  const filteredQuotes = useMemo(() => {
    let result = quotes;
    if (statusFilter !== "all") {
      result = result.filter((q) => q.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.customerName.toLowerCase().includes(query) ||
          q.title.toLowerCase().includes(query) ||
          q.description.toLowerCase().includes(query)
      );
    }
    return result;
  }, [quotes, statusFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // Line item helpers
  // ---------------------------------------------------------------------------

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
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
      lineItems: [
        ...formData.lineItems,
        { description: "", quantity: 1, unitPrice: 0, total: 0 },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length <= 1) return;
    const items = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: items });
  };

  const subtotal = formData.lineItems.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const discountCents = Math.round(formData.discount * 100);
  const taxableAmount = subtotal - discountCents;
  const tax = Math.round(Math.max(taxableAmount, 0) * 0.08);
  const total = Math.max(taxableAmount, 0) + tax;

  // ---------------------------------------------------------------------------
  // AI Generate
  // ---------------------------------------------------------------------------

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
      toast(
        "We couldn't generate the quote. Please try again.",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  }, [aiDescription, formData, toast]);

  // ---------------------------------------------------------------------------
  // Create quote
  // ---------------------------------------------------------------------------

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      title: "",
      description: "",
      lineItems: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
      discount: 0,
      validityDays: 30,
      terms: "50% deposit required upon acceptance. Remaining balance due upon completion. All work guaranteed for 1 year.",
      notes: "",
    });
  };

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
            customerAddress: formData.customerAddress || undefined,
            title: formData.title,
            description: formData.description,
            lineItems: formData.lineItems,
            subtotal,
            discount: discountCents,
            tax,
            total,
            validityDays: formData.validityDays,
            terms: formData.terms,
            notes: formData.notes,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast(
            err.error ||
              "We couldn't create the quote. Please check your details and try again.",
            "error"
          );
          return;
        }
        resetForm();
        setShowForm(false);
        await mutate();
        toast("Quote created", "success");
      } finally {
        setSaving(false);
      }
    },
    [formData, subtotal, discountCents, tax, total, mutate, toast]
  );

  // ---------------------------------------------------------------------------
  // Send quote
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(
    async (id: string, method: "email" | "sms" = "email") => {
      setSaving(true);
      try {
        const res = await fetch(`/api/dashboard/quotes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method }),
        });
        if (!res.ok) throw new Error("Send failed");
        await mutate();
        setSendQuote(null);
        toast(
          `Quote sent via ${method === "email" ? "email" : "SMS"}`,
          "success"
        );
      } catch {
        toast(
          "We couldn't send the quote. Please try again.",
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  // ---------------------------------------------------------------------------
  // Duplicate quote
  // ---------------------------------------------------------------------------

  const handleDuplicate = useCallback(
    (quote: Quote) => {
      setFormData({
        customerName: quote.customerName,
        customerPhone: quote.customerPhone,
        customerEmail: quote.customerEmail,
        customerAddress: quote.customerAddress,
        title: `${quote.title} (Copy)`,
        description: quote.description,
        lineItems: quote.lineItems.map((item) => ({ ...item })),
        discount: quote.discount / 100,
        validityDays: quote.validityDays,
        terms: quote.terms,
        notes: quote.notes,
      });
      setShowForm(true);
      setActionsOpen(null);
      toast("Quote duplicated — edit and save as new", "success");
    },
    [toast]
  );

  // ---------------------------------------------------------------------------
  // Convert to invoice
  // ---------------------------------------------------------------------------

  const handleConvertToInvoice = useCallback(
    async (quote: Quote) => {
      setSaving(true);
      try {
        const res = await fetch("/api/dashboard/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: quote.customerName,
            customerPhone: quote.customerPhone,
            customerEmail: quote.customerEmail,
            description: `${quote.title} — ${quote.description}`,
            amount: quote.total,
            fromQuoteId: quote.id,
          }),
        });
        if (!res.ok) throw new Error("Conversion failed");
        setActionsOpen(null);
        toast("Invoice created from quote", "success");
      } catch {
        toast(
          "We couldn't convert to invoice. Please try again.",
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-col bg-background"
        role="status"
        aria-label="Loading quotes"
      >
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10"
                />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10"
                />
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
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft
                    className="mr-1.5 h-4 w-4"
                    aria-hidden="true"
                  />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">
                Quotes & Proposals
              </h1>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              aria-expanded={showForm}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              New Quote
            </Button>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* Stats Cards                                                       */}
          {/* ----------------------------------------------------------------- */}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 shrink-0">
                  <FileText
                    className="h-5 w-5 text-blue-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">
                    Total Quotes
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2 shrink-0">
                  <DollarSign
                    className="h-5 w-5 text-violet-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold truncate">
                    {formatCurrency(stats.totalQuoted)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Quoted
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 shrink-0">
                  <TrendingUp
                    className="h-5 w-5 text-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold truncate">
                    {formatCurrency(stats.totalAccepted)}
                  </p>
                  <p className="text-xs text-muted-foreground">Won Value</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 shrink-0">
                  <BarChart3
                    className="h-5 w-5 text-amber-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">
                    {stats.acceptanceRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-cyan-500/10 p-2 shrink-0">
                  <DollarSign
                    className="h-5 w-5 text-cyan-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold truncate">
                    {formatCurrency(stats.avgQuoteValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg. Quote</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex gap-1 shrink-0">
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">
                    <span className="text-emerald-400">{stats.won}</span>
                    <span className="text-muted-foreground text-lg mx-1">
                      /
                    </span>
                    <span className="text-red-400">{stats.lost}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Won / Lost</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Follow-up reminder banner */}
          {stats.followUpCount > 0 && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="rounded-full bg-amber-500/10 p-2 shrink-0">
                <AlertTriangle
                  className="h-5 w-5 text-amber-400"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-400">
                  {stats.followUpCount} quote{stats.followUpCount > 1 ? "s" : ""} need
                  follow-up
                </p>
                <p className="text-xs text-muted-foreground">
                  Sent more than 48 hours ago with no response. Consider
                  following up with the customer.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => setStatusFilter("sent")}
              >
                View
              </Button>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Create Quote Form                                                 */}
          {/* ----------------------------------------------------------------- */}

          {showForm && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    Create New Quote
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAiMode(!aiMode)}
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {aiMode ? "Manual Entry" : "AI Assist"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowForm(false)}
                      aria-label="Close form"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* AI Assist Mode */}
                {aiMode && (
                  <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <label
                      htmlFor="ai-description"
                      className="text-sm font-medium mb-2 block"
                    >
                      Describe the job and we will generate line items
                      and pricing:
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

                <form
                  onSubmit={handleCreate}
                  className="space-y-4"
                  aria-label="Create new quote"
                >
                  {/* Customer info */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-muted-foreground mb-2">
                      Customer Information
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label
                          htmlFor="quote-customer-name"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Customer Name *
                        </label>
                        <Input
                          id="quote-customer-name"
                          required
                          placeholder="John Smith"
                          value={formData.customerName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quote-phone"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Phone
                        </label>
                        <Input
                          id="quote-phone"
                          type="tel"
                          placeholder="+15555551234"
                          value={formData.customerPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quote-email"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Email
                        </label>
                        <Input
                          id="quote-email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.customerEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerEmail: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quote-address"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Address
                        </label>
                        <Input
                          id="quote-address"
                          placeholder="123 Main St, Austin, TX"
                          value={formData.customerAddress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerAddress: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Job details */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-muted-foreground mb-2">
                      Job Details
                    </legend>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="quote-title"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Quote Title *
                        </label>
                        <Input
                          id="quote-title"
                          required
                          placeholder="AC Compressor Replacement"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quote-description"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Job Description *
                        </label>
                        <Textarea
                          id="quote-description"
                          required
                          placeholder="Detailed description of the work to be performed..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Line Items */}
                  <fieldset>
                    <div className="flex items-center justify-between mb-2">
                      <legend className="text-sm font-semibold text-muted-foreground">
                        Line Items
                      </legend>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addLineItem}
                      >
                        <Plus className="mr-1 h-3 w-3" aria-hidden="true" />{" "}
                        Add Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {/* Header row */}
                      <div className="hidden sm:flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <span className="flex-1">Description</span>
                        <span className="w-20 text-center">Qty</span>
                        <span className="w-28 text-center">Unit Price</span>
                        <span className="w-24 text-right">Total</span>
                        <span className="w-9" />
                      </div>
                      {formData.lineItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                        >
                          <Input
                            placeholder="Description"
                            className="min-w-0 flex-1 basis-full sm:basis-auto"
                            value={item.description}
                            aria-label={`Line item ${index + 1} description`}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "description",
                                e.target.value
                              )
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
                              updateLineItem(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-28"
                            placeholder="Price ($)"
                            value={
                              item.unitPrice
                                ? (item.unitPrice / 100).toFixed(2)
                                : ""
                            }
                            aria-label={`Line item ${index + 1} unit price`}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "unitPrice",
                                e.target.value
                              )
                            }
                          />
                          <span
                            className="w-24 text-right text-sm font-semibold tabular-nums"
                            aria-label={`Line item ${index + 1} total: ${formatCurrency(item.total)}`}
                          >
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
                            <Trash2
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </fieldset>

                  {/* Discount & Validity */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="quote-discount"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Discount ($)
                      </label>
                      <Input
                        id="quote-discount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.discount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="quote-validity"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Valid For (days)
                      </label>
                      <Input
                        id="quote-validity"
                        type="number"
                        min="1"
                        max="365"
                        value={formData.validityDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validityDays:
                              Number(e.target.value) || 30,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Terms & Notes */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="quote-terms"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Terms & Conditions
                      </label>
                      <Textarea
                        id="quote-terms"
                        placeholder="Payment terms, warranties, etc."
                        value={formData.terms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            terms: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="quote-notes"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Internal Notes
                      </label>
                      <Textarea
                        id="quote-notes"
                        placeholder="Notes visible only to your team..."
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notes: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-white/[0.06] pt-4 space-y-1 text-right">
                    <p className="text-sm">
                      Subtotal:{" "}
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(subtotal)}
                      </span>
                    </p>
                    {discountCents > 0 && (
                      <p className="text-sm text-emerald-400">
                        Discount:{" "}
                        <span className="font-semibold tabular-nums">
                          -{formatCurrency(discountCents)}
                        </span>
                      </p>
                    )}
                    <p className="text-sm">
                      Tax (8%):{" "}
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(tax)}
                      </span>
                    </p>
                    <p className="text-lg font-bold">
                      Total:{" "}
                      <span className="text-primary tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Creating..." : "Create Quote"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Filters & Search                                                  */}
          {/* ----------------------------------------------------------------- */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            {/* Status tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
              <Filter
                className="h-4 w-4 text-muted-foreground shrink-0 mr-1"
                aria-hidden="true"
              />
              {STATUS_TABS.map((tab) => {
                const isActive = statusFilter === tab.value;
                const count =
                  tab.value === "all"
                    ? quotes.length
                    : quotes.filter((q) => q.status === tab.value).length;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    aria-pressed={isActive}
                  >
                    {tab.label}
                    <span className="ml-1 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search quotes..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search quotes"
              />
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* Quote List — Table                                                */}
          {/* ----------------------------------------------------------------- */}

          {filteredQuotes.length === 0 && !showForm && (
            <Card className="border-white/[0.06]">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                  <FileText
                    className="h-7 w-7 text-blue-400/60"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-base font-semibold">
                  {searchQuery || statusFilter !== "all"
                    ? "No matching quotes"
                    : "No quotes yet"}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters or search query."
                    : "Create professional quotes and proposals in seconds. Use AI Assist to auto-generate line items from a job description."}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    className="mt-5"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    Create Your First Quote
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {filteredQuotes.length > 0 && (
            <Card className="border-white/[0.06] overflow-hidden">
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  aria-label="Quotes table"
                >
                  <thead>
                    <tr className="border-b border-white/[0.06] text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="p-3 text-left font-medium">
                        Customer
                      </th>
                      <th className="p-3 text-left font-medium hidden md:table-cell">
                        Job Description
                      </th>
                      <th className="p-3 text-right font-medium">
                        Amount
                      </th>
                      <th className="p-3 text-center font-medium">
                        Status
                      </th>
                      <th className="p-3 text-left font-medium hidden lg:table-cell">
                        Sent
                      </th>
                      <th className="p-3 text-left font-medium hidden lg:table-cell">
                        Expires
                      </th>
                      <th className="p-3 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.map((quote) => {
                      const cfg =
                        STATUS_CONFIG[quote.status] ||
                        STATUS_CONFIG.draft;
                      const StatusIcon = cfg.icon;
                      const followUp = needsFollowUp(quote);
                      const expiryDays = daysUntilExpiry(quote);
                      const isActionsVisible =
                        actionsOpen === quote.id;

                      return (
                        <tr
                          key={quote.id}
                          className="border-b border-white/[0.04] last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          {/* Customer */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {followUp && (
                                <div
                                  className="h-2 w-2 rounded-full bg-amber-400 shrink-0"
                                  title="Needs follow-up — sent 48+ hours ago"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold truncate max-w-[180px]">
                                  {quote.customerName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {quote.title}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Job Description */}
                          <td className="p-3 hidden md:table-cell">
                            <p className="text-muted-foreground truncate max-w-[250px]">
                              {quote.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {quote.lineItems.length} item
                              {quote.lineItems.length !== 1 ? "s" : ""}
                            </p>
                          </td>

                          {/* Amount */}
                          <td className="p-3 text-right">
                            <span className="font-bold tabular-nums">
                              {formatCurrency(quote.total)}
                            </span>
                            {quote.discount > 0 && (
                              <p className="text-xs text-emerald-400">
                                -{formatCurrency(quote.discount)}{" "}
                                disc.
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${cfg.color}`}
                            >
                              <StatusIcon
                                className="mr-1 h-3 w-3"
                                aria-hidden="true"
                              />
                              <span className="sr-only">
                                Status:{" "}
                              </span>
                              {cfg.label}
                            </Badge>
                            {followUp && (
                              <p className="text-xs text-amber-400 mt-1">
                                Needs follow-up
                              </p>
                            )}
                          </td>

                          {/* Sent Date */}
                          <td className="p-3 hidden lg:table-cell">
                            <span className="text-muted-foreground text-xs">
                              {quote.sentAt
                                ? formatDate(quote.sentAt)
                                : "--"}
                            </span>
                            {quote.viewedAt && (
                              <p className="text-xs text-purple-400">
                                Viewed{" "}
                                {formatDate(quote.viewedAt)}
                              </p>
                            )}
                          </td>

                          {/* Expiry Date */}
                          <td className="p-3 hidden lg:table-cell">
                            {quote.expiresAt ? (
                              <span
                                className={`text-xs ${
                                  expiryDays !== null &&
                                  expiryDays <= 3 &&
                                  expiryDays > 0
                                    ? "text-amber-400 font-medium"
                                    : expiryDays !== null &&
                                        expiryDays <= 0
                                      ? "text-red-400 font-medium"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {formatDate(quote.expiresAt)}
                                {expiryDays !== null &&
                                  expiryDays > 0 &&
                                  expiryDays <= 7 && (
                                    <span className="block text-xs">
                                      {expiryDays}d left
                                    </span>
                                  )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                --
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-center">
                            <div className="relative inline-block">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setActionsOpen(
                                    isActionsVisible
                                      ? null
                                      : quote.id
                                  )
                                }
                                aria-label={`Actions for ${quote.title}`}
                                aria-expanded={isActionsVisible}
                              >
                                <MoreHorizontal
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </Button>

                              {isActionsVisible && (
                                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-white/[0.06] bg-card shadow-xl py-1">
                                  {/* Preview */}
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                      setPreviewQuote(quote);
                                      setActionsOpen(null);
                                    }}
                                  >
                                    <Eye
                                      className="h-4 w-4 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                    Preview Quote
                                  </button>

                                  {/* Send — only for draft */}
                                  {quote.status === "draft" && (
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                      onClick={() => {
                                        setSendQuote(quote);
                                        setActionsOpen(null);
                                      }}
                                    >
                                      <Send
                                        className="h-4 w-4 text-blue-400"
                                        aria-hidden="true"
                                      />
                                      Send Quote
                                    </button>
                                  )}

                                  {/* Resend — for sent/viewed quotes */}
                                  {(quote.status === "sent" ||
                                    quote.status === "viewed") && (
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                      onClick={() => {
                                        setSendQuote(quote);
                                        setActionsOpen(null);
                                      }}
                                    >
                                      <Send
                                        className="h-4 w-4 text-blue-400"
                                        aria-hidden="true"
                                      />
                                      Resend Quote
                                    </button>
                                  )}

                                  {/* Duplicate */}
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                    onClick={() =>
                                      handleDuplicate(quote)
                                    }
                                  >
                                    <Copy
                                      className="h-4 w-4 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                    Duplicate Quote
                                  </button>

                                  {/* Convert to Invoice — only for accepted */}
                                  {quote.status === "accepted" && (
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                      onClick={() =>
                                        handleConvertToInvoice(
                                          quote
                                        )
                                      }
                                      disabled={saving}
                                    >
                                      <ArrowRightLeft
                                        className="h-4 w-4 text-emerald-400"
                                        aria-hidden="true"
                                      />
                                      Convert to Invoice
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer with summary */}
              <div className="border-t border-white/[0.06] px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing {filteredQuotes.length} of {quotes.length}{" "}
                  quote{quotes.length !== 1 ? "s" : ""}
                </span>
                <span className="font-medium tabular-nums">
                  Total:{" "}
                  {formatCurrency(
                    filteredQuotes.reduce(
                      (sum, q) => sum + q.total,
                      0
                    )
                  )}
                </span>
              </div>
            </Card>
          )}

          {/* Close actions dropdown on outside click */}
          {actionsOpen && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setActionsOpen(null)}
              aria-hidden="true"
            />
          )}
        </Container>
      </main>

      <Footer />

      {/* Preview Modal */}
      {previewQuote && (
        <QuotePreviewModal
          quote={previewQuote}
          open={!!previewQuote}
          onClose={() => setPreviewQuote(null)}
        />
      )}

      {/* Send Modal */}
      {sendQuote && (
        <SendQuoteModal
          quote={sendQuote}
          open={!!sendQuote}
          onClose={() => setSendQuote(null)}
          onSend={(method) => handleSend(sendQuote.id, method)}
          sending={saving}
        />
      )}
    </div>
  );
}
