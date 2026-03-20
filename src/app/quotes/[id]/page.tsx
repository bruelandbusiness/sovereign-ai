"use client";

import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteData {
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
  businessName?: string;
}

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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// We fetch the quote publicly via a dedicated endpoint
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch quote");
  return res.json() as Promise<QuoteData>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PublicQuotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quoteId = params.id as string;
  const token = searchParams.get("token") || "";
  const { data: quote, error, mutate } = useSWR<QuoteData>(
    token ? `/api/quotes/${quoteId}?token=${token}` : null,
    fetcher
  );

  const [responding, setResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const handleRespond = useCallback(
    async (action: "accept" | "decline") => {
      if (!confirm(
        action === "accept"
          ? "Accept this quote? The business will contact you to schedule."
          : "Decline this quote?"
      )) return;

      setResponding(true);
      try {
        const res = await fetch(`/api/quotes/${quoteId}/respond?token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (res.ok) {
          setResponseMessage(data.message);
          await mutate();
        } else {
          setResponseMessage(data.error || "Something went wrong.");
        }
      } catch {
        setResponseMessage("Failed to submit response. Please try again.");
      } finally {
        setResponding(false);
      }
    },
    [quoteId, token, mutate]
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center" role="alert">
            <XCircle className="mx-auto h-12 w-12 text-red-400 mb-3" aria-hidden="true" />
            <h2 className="text-xl font-bold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground">
              This quote may have been removed or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
        <div className="max-w-2xl w-full mx-4 space-y-6">
          <div className="rounded-xl border border-border/50 bg-card p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="skeleton h-6 w-24 rounded" />
                <div className="skeleton h-5 w-48 rounded" />
              </div>
              <div className="skeleton h-4 w-28 rounded" />
            </div>
            <div className="rounded-lg border border-border/50 p-4 space-y-2">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-5 w-40 rounded" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
            <div className="space-y-3">
              <div className="skeleton h-8 w-full rounded" />
              <div className="skeleton h-8 w-full rounded" />
              <div className="skeleton h-8 w-full rounded" />
            </div>
            <div className="skeleton h-10 w-full rounded" />
          </div>
          <span className="sr-only">Loading quote details, please wait...</span>
        </div>
      </div>
    );
  }

  const isActionable = quote.status === "sent";
  const isAccepted = quote.status === "accepted";
  const isDeclined = quote.status === "declined";
  const isExpired = quote.status === "expired";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Status banner */}
        {responseMessage && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center text-sm">
            {responseMessage}
          </div>
        )}

        {isAccepted && !responseMessage && (
          <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-emerald-400">Quote Accepted</p>
            <p className="text-xs text-muted-foreground">
              Accepted on {quote.acceptedAt ? formatDate(quote.acceptedAt) : ""}
            </p>
          </div>
        )}

        {isDeclined && !responseMessage && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
            <XCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
            <p className="text-sm font-semibold text-red-400">Quote Declined</p>
          </div>
        )}

        {isExpired && !responseMessage && (
          <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <Clock className="mx-auto h-8 w-8 text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-amber-400">Quote Expired</p>
          </div>
        )}

        {/* Quote Card */}
        <Card className="border-white/[0.06]">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <h1 className="text-xl font-bold">Quote</h1>
                </div>
                <h2 className="text-lg font-semibold">{quote.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {quote.description}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{formatDate(quote.createdAt)}</p>
                {quote.expiresAt && (
                  <p className="text-xs mt-1">
                    Expires: {formatDate(quote.expiresAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8 rounded-lg border border-white/[0.06] p-4">
              <p className="text-sm font-semibold mb-1">Prepared for</p>
              <p className="text-lg font-bold">{quote.customerName}</p>
              {quote.customerEmail && (
                <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
              )}
              {quote.customerPhone && (
                <p className="text-sm text-muted-foreground">{quote.customerPhone}</p>
              )}
            </div>

            {/* Line Items Table */}
            <div className="mb-8 overflow-x-auto">
              <table className="w-full text-sm" aria-label="Quote line items">
                <thead>
                  <tr className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 px-2 text-left font-medium">Description</th>
                    <th className="pb-3 px-2 text-right font-medium">Qty</th>
                    <th className="pb-3 px-2 text-right font-medium">Price</th>
                    <th className="pb-3 px-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {quote.lineItems.map((item, index) => (
                    <tr
                      key={index}
                      className="border border-white/[0.06] rounded-lg"
                    >
                      <td className="p-3 font-medium">{item.description}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-white/[0.06] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(quote.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/[0.06]">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(quote.total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isActionable && !responseMessage && (
              <div className="mt-8 flex gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  disabled={responding}
                  onClick={() => handleRespond("accept")}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Accept Quote
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  disabled={responding}
                  onClick={() => handleRespond("decline")}
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Decline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Sovereign AI
        </p>
      </div>
    </div>
  );
}
