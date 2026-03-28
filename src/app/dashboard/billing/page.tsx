"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Shield,
  ArrowUpRight,
  X,
  Loader2,
  Zap,
  Download,
  Clock,
  AlertTriangle,
  Pause,
  MessageSquare,
  Users,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { getBundleById } from "@/lib/constants";
import type { BundleId } from "@/types/services";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed");
    return r.json();
  });

interface BillingData {
  plan: { id: string; name: string; price: number } | null;
  status: string;
  monthlyAmount: number;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  hasStripeCustomer: boolean;
  services: {
    id: string;
    name: string;
    status: string;
    activatedAt: string | null;
  }[];
}

/* -------------------------------------------------------------------
 * Plan tier ordering and feature lists
 * ---------------------------------------------------------------- */
const TIER_ORDER: BundleId[] = ["diy", "starter", "growth", "empire"];

function getNextTier(currentId: string): BundleId | null {
  const idx = TIER_ORDER.indexOf(currentId as BundleId);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

const PLAN_FEATURES: Record<string, string[]> = {
  diy: [
    "AI Chat Assistant",
    "AI Review Management",
    "AI Scheduling System",
    "Email support",
    "Basic analytics dashboard",
  ],
  starter: [
    "AI Lead Generation",
    "AI Review Management",
    "AI Scheduling System",
    "Priority email support",
    "Lead tracking dashboard",
    "Monthly strategy call",
  ],
  growth: [
    "AI Lead Generation",
    "AI Voice Agents",
    "AI SEO Domination",
    "AI Email Marketing",
    "AI Review Management",
    "AI CRM Automation",
    "Dedicated success manager",
    "Weekly performance reports",
    "Priority phone support",
  ],
  empire: [
    "All 16 AI services included",
    "Dedicated account manager",
    "Custom AI automations",
    "Quarterly strategy reviews",
    "White-glove onboarding",
    "Priority phone + Slack support",
    "Custom integrations",
  ],
};

const PLAN_LIMITS: Record<string, { conversations: number; leads: number; totalServices: number }> = {
  diy: { conversations: 500, leads: 100, totalServices: 3 },
  starter: { conversations: 2000, leads: 500, totalServices: 3 },
  growth: { conversations: 10000, leads: 2500, totalServices: 6 },
  empire: { conversations: 999999, leads: 999999, totalServices: 16 },
};

/* -------------------------------------------------------------------
 * Mock payment history (API-driven in production)
 * ---------------------------------------------------------------- */
interface PaymentRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  receiptUrl: string | null;
}

function generateMockPayments(planName: string, amount: number): PaymentRecord[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const status: PaymentRecord["status"] = i === 0 ? "paid" : i === 3 ? "failed" : "paid";
    return {
      id: `inv_${Date.now()}_${i}`,
      date: date.toISOString(),
      description: `${planName} Plan - Monthly`,
      amount,
      status,
      receiptUrl: status === "paid" ? "#receipt" : null,
    };
  });
}

/* -------------------------------------------------------------------
 * Cancellation reasons
 * ---------------------------------------------------------------- */
const CANCEL_REASONS = [
  "Too expensive",
  "Not seeing results",
  "Switching to a competitor",
  "Business closing/pausing",
  "Missing features I need",
  "Other",
] as const;

/* -------------------------------------------------------------------
 * Utility: day countdown
 * ---------------------------------------------------------------- */
function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------
 * UsageMeter component
 * ---------------------------------------------------------------- */
function UsageMeter({
  label,
  icon,
  used,
  limit,
}: {
  label: string;
  icon: React.ReactNode;
  used: number;
  limit: number;
}) {
  const isUnlimited = limit >= 999999;
  const pct = isUnlimited ? 15 : Math.min(100, Math.round((used / limit) * 100));
  const isHigh = pct >= 80 && !isUnlimited;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={isHigh ? "font-medium text-amber-400" : "text-muted-foreground"}>
          {used.toLocaleString()} / {isUnlimited ? "Unlimited" : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? "bg-amber-500" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------
 * PaymentHistoryRow
 * ---------------------------------------------------------------- */
function PaymentStatusBadge({ status }: { status: PaymentRecord["status"] }) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <Badge className={styles[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

/* ===================================================================
 * MAIN PAGE
 * ================================================================ */
export default function BillingPage() {
  const searchParams = useSearchParams();
  const { data, isLoading } = useSWR<BillingData>(
    "/api/dashboard/billing",
    fetcher
  );
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [cancelBannerDismissed, setCancelBannerDismissed] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "3mo" | "6mo">("all");

  const checkoutCanceled = searchParams.get("checkout") === "canceled";

  const dismissCancelBanner = useCallback(() => {
    setCancelBannerDismissed(true);
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/dashboard/billing/portal", {
        method: "POST",
      });
      if (!res.ok) {
        setPortalError("Unable to open billing portal. Please try again.");
        return;
      }
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setPortalError("Unable to open billing portal. Please try again.");
      }
    } catch {
      setPortalError("Unable to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    trial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    trialing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    canceling: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    past_due: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    canceled: "bg-red-500/10 text-red-400 border-red-500/20",
    expired: "bg-red-500/10 text-red-400 border-red-500/20",
    paused: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const statusLabels: Record<string, string> = {
    active: "Active",
    trial: "Trial",
    trialing: "Trial",
    canceling: "Canceling",
    past_due: "Past Due",
    canceled: "Canceled",
    expired: "Expired",
    paused: "Paused",
  };

  const isTrialing =
    data?.status === "trial" || data?.status === "trialing";

  /* Payment history with filtering */
  const allPayments = useMemo(() => {
    if (!data?.plan) return [];
    return generateMockPayments(data.plan.name, data.monthlyAmount);
  }, [data?.plan, data?.monthlyAmount]);

  const filteredPayments = useMemo(() => {
    const now = new Date();
    const filtered = allPayments.filter((p) => {
      if (dateFilter === "all") return true;
      const pDate = new Date(p.date);
      const months = dateFilter === "3mo" ? 3 : 6;
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - months);
      return pDate >= cutoff;
    });
    return showAllPayments ? filtered : filtered.slice(0, 3);
  }, [allPayments, dateFilter, showAllPayments]);

  /* Next tier info */
  const nextTierId = data?.plan ? getNextTier(data.plan.id) : null;
  const nextTierBundle = nextTierId ? getBundleById(nextTierId) : null;

  /* Plan limits */
  const limits = data?.plan ? PLAN_LIMITS[data.plan.id] ?? PLAN_LIMITS.starter : null;

  /* Simulated usage (in production, fetched from API) */
  const usage = useMemo(() => ({
    conversations: Math.floor(Math.random() * (limits?.conversations ?? 500) * 0.6),
    leads: Math.floor(Math.random() * (limits?.leads ?? 100) * 0.45),
  }), [limits?.conversations, limits?.leads]);

  /* Trial days remaining */
  const trialDaysLeft = data?.trialEnd ? daysUntil(data.trialEnd) : null;
  const billingDaysLeft = data?.currentPeriodEnd ? daysUntil(data.currentPeriodEnd) : null;

  /* Failed payment exists */
  const hasFailedPayment = data?.status === "past_due";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />

      {/* Checkout canceled banner */}
      {checkoutCanceled && !cancelBannerDismissed && (
        <div className="border-b border-amber-500/20 bg-amber-500/5">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-300">
                Checkout was canceled. No charges were made. You can try again
                whenever you are ready.
              </p>
            </div>
            <button
              onClick={dismissCancelBanner}
              className="shrink-0 rounded p-1 text-amber-400/60 transition-colors hover:text-amber-400"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 py-8">
        <Container>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon-sm">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to dashboard</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold sm:text-xl">
                  Billing & Subscription
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your plan, usage, and payment details
                </p>
              </div>
            </div>
            {data?.plan && data.hasStripeCustomer && (
              <Button
                onClick={openPortal}
                disabled={portalLoading}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                {portalLoading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                )}
                {portalLoading ? "Opening..." : "Stripe Portal"}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="mt-8 flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Loading billing info...
              </p>
            </div>
          ) : !data?.plan ? (
            <div className="mt-8">
              <Card>
                <CardContent className="flex flex-col items-center py-16">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <CreditCard className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                  </div>
                  <h2 className="text-base font-semibold">
                    No active subscription
                  </h2>
                  <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                    Choose a plan to unlock AI-powered marketing services for
                    your business. Start with a free audit to see what we can do
                    for you.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/onboarding" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto">Get Started</Button>
                    </Link>
                    <Link href="/pricing" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto">
                        View Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {/* ── Billing Alerts ──────────────────────────────── */}

              {/* Failed payment warning */}
              {hasFailedPayment && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-300">
                        Payment failed
                      </p>
                      <p className="mt-0.5 text-xs text-red-400/70">
                        Your last payment could not be processed. Please update your
                        payment method to avoid service interruption.
                      </p>
                      <Button
                        onClick={openPortal}
                        disabled={portalLoading}
                        size="sm"
                        variant="danger"
                        className="mt-3"
                      >
                        {portalLoading ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Retry Payment
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Trial banner with countdown */}
              {isTrialing && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-blue-300">
                          Free trial active
                        </p>
                        {trialDaysLeft !== null && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-blue-400/70">
                        {data.trialEnd
                          ? `Your trial ends on ${formatDateLong(data.trialEnd)}. You will not be charged until then.`
                          : "You will not be charged during the trial period. Cancel anytime."}
                      </p>
                      {trialDaysLeft !== null && trialDaysLeft <= 3 && (
                        <p className="mt-2 text-xs font-medium text-amber-400">
                          Your trial expires soon. Make sure your payment method is up to date.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Canceling warning */}
              {data.status === "canceling" && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-300">
                        Subscription canceling
                      </p>
                      <p className="mt-0.5 text-xs text-amber-400/70">
                        Your subscription will end on{" "}
                        {data.currentPeriodEnd
                          ? formatDateLong(data.currentPeriodEnd)
                          : "the end of the current billing period"}
                        . You will retain access until then.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Current Plan + Payment Method ────────────── */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Current Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Current Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">
                          {data.plan.name}
                        </p>
                        <p className="text-2xl font-bold">
                          ${data.monthlyAmount.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground">
                            /mo
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Billed monthly
                        </p>
                      </div>
                      <Badge className={statusColors[data.status] || ""}>
                        {data.status === "active" && (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        {data.status === "past_due" && (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        )}
                        {statusLabels[data.status] ||
                          data.status.replace("_", " ")}
                      </Badge>
                    </div>

                    {/* Plan features */}
                    {PLAN_FEATURES[data.plan.id] && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Included in your plan
                        </p>
                        <ul className="space-y-1">
                          {PLAN_FEATURES[data.plan.id].map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Upgrade CTA with next tier comparison */}
                    {nextTierBundle && data.plan.id !== "empire" && (
                      <Link href="/pricing" className="block">
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-primary">
                                Upgrade to {nextTierBundle.name}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              ${nextTierBundle.price.toLocaleString()}/mo
                            </span>
                          </div>
                          <p className="mt-1 pl-6 text-xs text-muted-foreground">
                            {nextTierBundle.services.length} AI services included
                            {" "}({nextTierBundle.savings})
                          </p>
                        </div>
                      </Link>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method + Next Billing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {data.hasStripeCustomer ? (
                      <>
                        {/* Card display */}
                        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                          <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gradient-to-br from-gray-700 to-gray-900">
                            <CreditCard className="h-5 w-5 text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Visa ending in 4242
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expires 12/2027
                            </p>
                          </div>
                        </div>

                        {/* Next billing date with countdown */}
                        {data.currentPeriodEnd && (
                          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Next billing date
                                </span>
                              </div>
                              {billingDaysLeft !== null && (
                                <Badge className="bg-muted text-muted-foreground">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {billingDaysLeft} day{billingDaysLeft !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-medium">
                              {formatDateLong(data.currentPeriodEnd)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              ${data.monthlyAmount.toLocaleString()} will be charged to your card
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={openPortal}
                          disabled={portalLoading}
                          className="w-full"
                          variant="outline"
                        >
                          {portalLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ExternalLink className="mr-2 h-4 w-4" />
                          )}
                          {portalLoading
                            ? "Opening..."
                            : "Update Payment Method"}
                        </Button>
                        {portalError && (
                          <p className="text-sm text-red-400">{portalError}</p>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center py-6 text-center">
                        <CreditCard className="mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          No payment method on file
                        </p>
                        <Link href="/onboarding" className="mt-3">
                          <Button size="sm">Add Payment Method</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Usage Meters ─────────────────────────────── */}
              {limits && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Usage This Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <UsageMeter
                        label="Conversations"
                        icon={<MessageSquare className="h-3.5 w-3.5" />}
                        used={usage.conversations}
                        limit={limits.conversations}
                      />
                      <UsageMeter
                        label="Leads Tracked"
                        icon={<Users className="h-3.5 w-3.5" />}
                        used={usage.leads}
                        limit={limits.leads}
                      />
                      <UsageMeter
                        label="Services Active"
                        icon={<Zap className="h-3.5 w-3.5" />}
                        used={data.services.length}
                        limit={limits.totalServices}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Active Services ──────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Active Services ({data.services.length}
                    {limits ? ` / ${limits.totalServices}` : ""})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {data.services.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span className="text-sm font-medium">
                            {s.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.activatedAt && (
                            <span className="text-xs text-muted-foreground">
                              Since {formatDate(s.activatedAt)}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {data.services.length === 0 && (
                      <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                        No active services
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Payment History ──────────────────────────── */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Payment History
                    </CardTitle>
                    <div className="flex gap-1">
                      {(["all", "3mo", "6mo"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setDateFilter(f)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            dateFilter === f
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {f === "all" ? "All" : f === "3mo" ? "3 months" : "6 months"}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredPayments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No payments found for this period.
                    </p>
                  ) : (
                    <>
                      {/* Table header */}
                      <div className="hidden border-b border-border/30 pb-2 sm:grid sm:grid-cols-5 sm:gap-4">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Date
                        </span>
                        <span className="col-span-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Description
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Status
                        </span>
                        <span className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Amount
                        </span>
                      </div>

                      {/* Table rows */}
                      <div className="divide-y divide-border/20">
                        {filteredPayments.map((p) => (
                          <div
                            key={p.id}
                            className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-5 sm:items-center sm:gap-4"
                          >
                            <span className="text-sm text-muted-foreground">
                              {formatDate(p.date)}
                            </span>
                            <span className="col-span-2 text-sm font-medium">
                              {p.description}
                            </span>
                            <div>
                              <PaymentStatusBadge status={p.status} />
                            </div>
                            <div className="flex items-center justify-between sm:justify-end sm:gap-3">
                              <span className="text-sm font-semibold">
                                ${p.amount.toLocaleString()}
                              </span>
                              {p.receiptUrl && (
                                <button
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  onClick={() => window.open(p.receiptUrl ?? "", "_blank")}
                                >
                                  <Download className="h-3 w-3" />
                                  Receipt
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Show more/less toggle */}
                      {allPayments.length > 3 && (
                        <button
                          onClick={() => setShowAllPayments(!showAllPayments)}
                          className="mt-3 flex w-full items-center justify-center gap-1 rounded-md py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showAllPayments ? (
                            <>
                              Show less <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              View all payments <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* ── Danger Zone: Cancel/Downgrade ────────────── */}
              <Card className="border-red-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Cancel Subscription
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Your services will remain active until the end of
                        your current billing period.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {data.hasStripeCustomer && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openPortal}
                          disabled={portalLoading}
                        >
                          <Pause className="mr-1.5 h-3.5 w-3.5" />
                          Pause for 1 Month
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowCancelModal(true)}
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guarantee footer */}
              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>
                  60-day money-back guarantee &middot; Cancel anytime &middot;
                  No hidden fees
                </span>
              </div>
            </div>
          )}
        </Container>
      </main>

      {/* ── Cancellation Retention Modal ───────────────────── */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Before you go...</DialogTitle>
            <DialogDescription>
              We are sorry to see you leave. Here is what you would lose:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* What they lose */}
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-red-400">
                You will lose access to
              </p>
              <ul className="space-y-1.5">
                {data?.services.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 text-sm text-red-300/80"
                  >
                    <X className="h-3 w-3 shrink-0 text-red-400" />
                    {s.name}
                  </li>
                ))}
                {(!data?.services || data.services.length === 0) && (
                  <li className="text-sm text-red-300/80">
                    All plan features and AI services
                  </li>
                )}
              </ul>
            </div>

            {/* Discount offer */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">
                  Special offer: 25% off for 3 months
                </p>
              </div>
              <p className="mt-1 text-xs text-emerald-400/70">
                Stay on your current plan at a discounted rate while we
                continue optimizing your results.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => {
                  setShowCancelModal(false);
                  openPortal();
                }}
              >
                Claim 25% Discount
              </Button>
            </div>

            {/* Reason selection */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Help us improve - why are you canceling?
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {CANCEL_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${
                      cancelReason === reason
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback text */}
            {cancelReason && (
              <textarea
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                placeholder="Any additional feedback? (optional)"
                className="w-full rounded-md border border-border/50 bg-muted/30 p-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                rows={2}
              />
            )}
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" size="sm" />
              }
            >
              Keep Subscription
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              disabled={!cancelReason}
              onClick={() => {
                setShowCancelModal(false);
                openPortal();
              }}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
