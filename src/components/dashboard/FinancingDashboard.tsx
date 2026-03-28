"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Calculator,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Send,
  AlertTriangle,
  BarChart3,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeInView } from "@/components/shared/FadeInView";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { SEMANTIC_COLORS } from "@/components/charts/chart-theme";

// ─── Demo Data ──────────────────────────────────────────────────

const DEMO_ACTIVE_PLANS = [
  {
    id: "fp-001",
    customerName: "Maria Rodriguez",
    jobDescription: "Full HVAC system replacement",
    totalAmount: 1450000,
    monthlyPayment: 24167,
    term: 60,
    status: "active" as const,
    remainingBalance: 1208333,
    startDate: "2025-08-15",
  },
  {
    id: "fp-002",
    customerName: "James Chen",
    jobDescription: "Kitchen remodel + plumbing",
    totalAmount: 875000,
    monthlyPayment: 36458,
    term: 24,
    status: "active" as const,
    remainingBalance: 583333,
    startDate: "2025-11-01",
  },
  {
    id: "fp-003",
    customerName: "Sarah Williams",
    jobDescription: "Roof replacement - full tear-off",
    totalAmount: 1200000,
    monthlyPayment: 33333,
    term: 36,
    status: "active" as const,
    remainingBalance: 966667,
    startDate: "2026-01-10",
  },
  {
    id: "fp-004",
    customerName: "Robert Davis",
    jobDescription: "Electrical panel upgrade + rewiring",
    totalAmount: 680000,
    monthlyPayment: 28333,
    term: 24,
    status: "paid_off" as const,
    remainingBalance: 0,
    startDate: "2024-06-20",
  },
  {
    id: "fp-005",
    customerName: "Emily Park",
    jobDescription: "Bathroom renovation",
    totalAmount: 520000,
    monthlyPayment: 14444,
    term: 36,
    status: "active" as const,
    remainingBalance: 448889,
    startDate: "2025-12-05",
  },
  {
    id: "fp-006",
    customerName: "Michael Torres",
    jobDescription: "Foundation repair",
    totalAmount: 950000,
    monthlyPayment: 15833,
    term: 60,
    status: "delinquent" as const,
    remainingBalance: 854167,
    startDate: "2025-09-22",
  },
  {
    id: "fp-007",
    customerName: "Lisa Anderson",
    jobDescription: "Solar panel installation",
    totalAmount: 2200000,
    monthlyPayment: 36667,
    term: 60,
    status: "active" as const,
    remainingBalance: 2016667,
    startDate: "2026-02-01",
  },
];

const DEMO_APPLICATIONS = [
  {
    id: "app-001",
    customerName: "David Kim",
    customerEmail: "david.kim@email.com",
    customerPhone: "(555) 234-5678",
    amountRequested: 1800000,
    jobDescription: "Complete kitchen renovation",
    status: "pending" as const,
    submittedAt: "2026-03-27T14:30:00Z",
  },
  {
    id: "app-002",
    customerName: "Jennifer Lopez",
    customerEmail: "j.lopez@email.com",
    customerPhone: "(555) 345-6789",
    amountRequested: 950000,
    jobDescription: "Master bathroom remodel",
    status: "approved" as const,
    submittedAt: "2026-03-26T09:15:00Z",
  },
  {
    id: "app-003",
    customerName: "Thomas Wright",
    customerEmail: "t.wright@email.com",
    customerPhone: "(555) 456-7890",
    amountRequested: 350000,
    jobDescription: "Water heater replacement",
    status: "approved" as const,
    submittedAt: "2026-03-25T11:45:00Z",
  },
  {
    id: "app-004",
    customerName: "Amanda Foster",
    customerEmail: "a.foster@email.com",
    customerPhone: null,
    amountRequested: 4500000,
    jobDescription: "Whole-home renovation",
    status: "denied" as const,
    submittedAt: "2026-03-24T16:00:00Z",
  },
  {
    id: "app-005",
    customerName: "Kevin Patel",
    customerEmail: "k.patel@email.com",
    customerPhone: "(555) 567-8901",
    amountRequested: 1250000,
    jobDescription: "Deck construction + landscaping",
    status: "pending" as const,
    submittedAt: "2026-03-27T10:20:00Z",
  },
  {
    id: "app-006",
    customerName: "Rachel Green",
    customerEmail: "r.green@email.com",
    customerPhone: "(555) 678-9012",
    amountRequested: 720000,
    jobDescription: "Garage conversion to ADU",
    status: "approved" as const,
    submittedAt: "2026-03-23T13:30:00Z",
  },
];

const DEMO_REVENUE_IMPACT = [
  { month: "Oct", withFinancing: 48500, withoutFinancing: 31200 },
  { month: "Nov", withFinancing: 52100, withoutFinancing: 29800 },
  { month: "Dec", withFinancing: 44800, withoutFinancing: 27500 },
  { month: "Jan", withFinancing: 58200, withoutFinancing: 33100 },
  { month: "Feb", withFinancing: 63400, withoutFinancing: 35200 },
  { month: "Mar", withFinancing: 71200, withoutFinancing: 38600 },
];

// ─── Types ──────────────────────────────────────────────────────

type PlanStatus = "active" | "paid_off" | "delinquent";
type AppStatus = "pending" | "approved" | "denied";

interface QuickApplyForm {
  customerName: string;
  jobDescription: string;
  amount: string;
  termPreference: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) return principal / termMonths;
  const monthlyRate = annualRate / 100 / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
}

// ─── Status Styling ─────────────────────────────────────────────

const PLAN_STATUS_CONFIG: Record<
  PlanStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: typeof CheckCircle;
  }
> = {
  active: { label: "Active", variant: "default", icon: CreditCard },
  paid_off: { label: "Paid Off", variant: "secondary", icon: CheckCircle },
  delinquent: {
    label: "Delinquent",
    variant: "destructive",
    icon: AlertTriangle,
  },
};

const APP_STATUS_CONFIG: Record<
  AppStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: typeof CheckCircle;
  }
> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  denied: { label: "Denied", variant: "destructive", icon: XCircle },
};

// ─── Sub-Components ─────────────────────────────────────────────

function FinancingOverview() {
  const activePlans = DEMO_ACTIVE_PLANS.filter(
    (p) => p.status === "active"
  ).length;
  const totalFinanced = DEMO_ACTIVE_PLANS.reduce(
    (sum, p) => sum + p.totalAmount,
    0
  );
  const approvedApps = DEMO_APPLICATIONS.filter(
    (a) => a.status === "approved"
  ).length;
  const approvalRate = Math.round(
    (approvedApps / DEMO_APPLICATIONS.length) * 100
  );
  const avgLoan = Math.round(totalFinanced / DEMO_ACTIVE_PLANS.length);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FadeInView delay={0}>
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                <AnimatedCounter
                  target={totalFinanced / 100}
                  prefix="$"
                  decimals={0}
                />
              </p>
              <p className="text-xs text-muted-foreground">
                Total Financed Amount
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInView>

      <FadeInView delay={0.05}>
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                <AnimatedCounter target={activePlans} />
              </p>
              <p className="text-xs text-muted-foreground">
                Active Financing Plans
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInView>

      <FadeInView delay={0.1}>
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Percent className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                <AnimatedCounter target={approvalRate} suffix="%" />
              </p>
              <p className="text-xs text-muted-foreground">Approval Rate</p>
            </div>
          </CardContent>
        </Card>
      </FadeInView>

      <FadeInView delay={0.15}>
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                <AnimatedCounter
                  target={avgLoan / 100}
                  prefix="$"
                  decimals={0}
                />
              </p>
              <p className="text-xs text-muted-foreground">Avg Loan Amount</p>
            </div>
          </CardContent>
        </Card>
      </FadeInView>
    </div>
  );
}

function ActivePlansTable() {
  const [sortField, setSortField] = useState<
    "customerName" | "totalAmount" | "status" | "remainingBalance"
  >("customerName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = useCallback(
    (
      field: "customerName" | "totalAmount" | "status" | "remainingBalance"
    ) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  const sorted = useMemo(() => {
    return [...DEMO_ACTIVE_PLANS].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "customerName":
          cmp = a.customerName.localeCompare(b.customerName);
          break;
        case "totalAmount":
          cmp = a.totalAmount - b.totalAmount;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "remainingBalance":
          cmp = a.remainingBalance - b.remainingBalance;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [sortField, sortDir]);

  const arrow = sortDir === "asc" ? "\u2191" : "\u2193";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Active Financing Plans ({DEMO_ACTIVE_PLANS.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table
            className="w-full text-sm"
            aria-label="Active financing plans"
          >
            <thead>
              <tr className="border-b border-border text-left">
                <th
                  scope="col"
                  className="cursor-pointer pb-3 pr-3 font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("customerName")}
                >
                  Customer
                  {sortField === "customerName" && (
                    <span className="ml-1">{arrow}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="pb-3 pr-3 font-medium text-muted-foreground"
                >
                  Job Description
                </th>
                <th
                  scope="col"
                  className="cursor-pointer pb-3 pr-3 font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("totalAmount")}
                >
                  Total
                  {sortField === "totalAmount" && (
                    <span className="ml-1">{arrow}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="pb-3 pr-3 font-medium text-muted-foreground"
                >
                  Monthly
                </th>
                <th
                  scope="col"
                  className="pb-3 pr-3 font-medium text-muted-foreground"
                >
                  Term
                </th>
                <th
                  scope="col"
                  className="cursor-pointer pb-3 pr-3 font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortField === "status" && (
                    <span className="ml-1">{arrow}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="cursor-pointer pb-3 font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("remainingBalance")}
                >
                  Remaining
                  {sortField === "remainingBalance" && (
                    <span className="ml-1">{arrow}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((plan) => {
                const conf = PLAN_STATUS_CONFIG[plan.status];
                const StatusIcon = conf.icon;
                return (
                  <tr
                    key={plan.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 pr-3 font-medium">
                      {plan.customerName}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[200px] truncate">
                      {plan.jobDescription}
                    </td>
                    <td className="py-3 pr-3 font-medium tabular-nums">
                      {formatCents(plan.totalAmount)}
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-muted-foreground">
                      {formatCents(plan.monthlyPayment)}/mo
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {plan.term}mo
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={conf.variant}>
                        <StatusIcon
                          className="mr-1 h-3 w-3"
                          aria-hidden="true"
                        />
                        {conf.label}
                      </Badge>
                    </td>
                    <td className="py-3 tabular-nums font-medium">
                      {plan.remainingBalance > 0
                        ? formatCents(plan.remainingBalance)
                        : "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {sorted.map((plan) => {
            const conf = PLAN_STATUS_CONFIG[plan.status];
            const StatusIcon = conf.icon;
            return (
              <div
                key={plan.id}
                className="rounded-lg border border-border p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {plan.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {plan.jobDescription}
                    </p>
                  </div>
                  <Badge variant={conf.variant} className="shrink-0">
                    <StatusIcon
                      className="mr-1 h-3 w-3"
                      aria-hidden="true"
                    />
                    {conf.label}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium tabular-nums">
                      {formatCents(plan.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly: </span>
                    <span className="tabular-nums">
                      {formatCents(plan.monthlyPayment)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Term: </span>
                    <span>{plan.term}mo</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining: </span>
                    <span className="tabular-nums">
                      {plan.remainingBalance > 0
                        ? formatCents(plan.remainingBalance)
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationTracker() {
  const [filter, setFilter] = useState<"all" | AppStatus>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return DEMO_APPLICATIONS;
    return DEMO_APPLICATIONS.filter((a) => a.status === filter);
  }, [filter]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Recent Applications ({filtered.length})
          </CardTitle>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter applications by status"
          >
            <span className="text-xs text-muted-foreground">Status:</span>
            {(["all", "pending", "approved", "denied"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    filter === status
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No applications match this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const conf = APP_STATUS_CONFIG[app.status];
              const StatusIcon = conf.icon;
              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {app.customerName}
                      </p>
                      <Badge variant={conf.variant} className="shrink-0">
                        <StatusIcon
                          className="mr-1 h-3 w-3"
                          aria-hidden="true"
                        />
                        {conf.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {app.customerEmail}
                      {app.customerPhone
                        ? ` \u00B7 ${app.customerPhone}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {app.jobDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                    <p className="text-lg font-bold tabular-nums">
                      {formatCents(app.amountRequested)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(app.submittedAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueImpactChart() {
  const avgWith =
    DEMO_REVENUE_IMPACT.reduce((s, d) => s + d.withFinancing, 0) /
    DEMO_REVENUE_IMPACT.length;
  const avgWithout =
    DEMO_REVENUE_IMPACT.reduce((s, d) => s + d.withoutFinancing, 0) /
    DEMO_REVENUE_IMPACT.length;
  const uplift = Math.round(((avgWith - avgWithout) / avgWithout) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Revenue Impact: Financing vs No Financing
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <TrendingUp className="mr-1 h-3 w-3" aria-hidden="true" />
              +{uplift}% avg job size increase
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ComparisonBarChart
          data={DEMO_REVENUE_IMPACT}
          xKey="month"
          height={280}
          series={[
            {
              dataKey: "withFinancing",
              label: "With Financing",
              color: SEMANTIC_COLORS.revenue,
            },
            {
              dataKey: "withoutFinancing",
              label: "Without Financing",
              color: SEMANTIC_COLORS.neutral,
            },
          ]}
          valueFormatter={(v) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(v)
          }
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Avg with Financing
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-400">
              ${Math.round(avgWith).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Avg without Financing
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              ${Math.round(avgWithout).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Revenue Uplift</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-violet-400">
              +{uplift}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickApplyForm() {
  const [form, setForm] = useState<QuickApplyForm>({
    customerName: "",
    jobDescription: "",
    amount: "",
    termPreference: "24",
  });
  const [submitted, setSubmitted] = useState(false);

  const updateField = useCallback(
    (field: keyof QuickApplyForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (
        !form.customerName.trim() ||
        !form.jobDescription.trim() ||
        !form.amount.trim()
      ) {
        return;
      }
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({
          customerName: "",
          jobDescription: "",
          amount: "",
          termPreference: "24",
        });
      }, 3000);
    },
    [form]
  );

  const isValid =
    form.customerName.trim().length > 0 &&
    form.jobDescription.trim().length > 0 &&
    Number(form.amount) > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4" />
          Quick Apply -- Submit Financing Application
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium">
              Application Submitted Successfully
            </p>
            <p className="text-xs text-muted-foreground">
              {form.customerName} will receive a financing pre-qualification
              link shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qa-name">Customer Name</Label>
                <Input
                  id="qa-name"
                  placeholder="e.g. John Smith"
                  value={form.customerName}
                  onChange={(e) =>
                    updateField("customerName", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qa-amount">Loan Amount ($)</Label>
                <Input
                  id="qa-amount"
                  type="number"
                  placeholder="e.g. 15000"
                  min="500"
                  max="100000"
                  value={form.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-job">Job Description</Label>
              <Input
                id="qa-job"
                placeholder="e.g. Full HVAC system replacement"
                value={form.jobDescription}
                onChange={(e) =>
                  updateField("jobDescription", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-term">Preferred Term</Label>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Preferred financing term"
              >
                {["12", "24", "36", "48", "60"].map((term) => (
                  <button
                    key={term}
                    type="button"
                    role="radio"
                    aria-checked={form.termPreference === term}
                    onClick={() => updateField("termPreference", term)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      form.termPreference === term
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {term}mo
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={!isValid} className="w-full sm:w-auto">
              <Send className="mr-2 h-4 w-4" />
              Submit Application
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function FinancingCalculator() {
  const [amount, setAmount] = useState("15000");
  const [term, setTerm] = useState("36");
  const [apr, setApr] = useState("8.99");

  const numAmount = Number(amount) || 0;
  const numTerm = Number(term) || 1;
  const numApr = Number(apr) || 0;

  const monthly =
    numAmount > 0
      ? calculateMonthlyPayment(numAmount, numApr, numTerm)
      : 0;
  const totalCost = monthly * numTerm;
  const totalInterest = totalCost - numAmount;

  const formatDollars = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const principalPercent =
    totalCost > 0 ? Math.round((numAmount / totalCost) * 100) : 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Financing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calc-amount">Loan Amount</Label>
              <Input
                id="calc-amount"
                type="number"
                min="500"
                max="200000"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={numAmount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full accent-primary"
                aria-label="Loan amount slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$500</span>
                <span>$100,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calc-term">Term (months)</Label>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Loan term"
              >
                {["12", "24", "36", "48", "60"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={term === t}
                    onClick={() => setTerm(t)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      term === t
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {t}mo
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calc-apr">APR (%)</Label>
              <Input
                id="calc-apr"
                type="number"
                min="0"
                max="30"
                step="0.01"
                value={apr}
                onChange={(e) => setApr(e.target.value)}
              />
              <input
                type="range"
                min="0"
                max="25"
                step="0.25"
                value={numApr}
                onChange={(e) => setApr(e.target.value)}
                className="w-full accent-primary"
                aria-label="APR slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Monthly Payment
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-emerald-400">
                {numAmount > 0 ? formatDollars(monthly) : "--"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                for {numTerm} months at {numApr}% APR
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="mt-1 text-sm font-bold tabular-nums">
                  {numAmount > 0 ? formatDollars(totalCost) : "--"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Total Interest
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-amber-400">
                  {numAmount > 0 ? formatDollars(totalInterest) : "--"}
                </p>
              </div>
            </div>

            {/* Visual breakdown bar */}
            {numAmount > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Payment Breakdown
                </p>
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-emerald-500 transition-all duration-300"
                    style={{ width: `${principalPercent}%` }}
                    title={`Principal: ${principalPercent}%`}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-300"
                    style={{ width: `${100 - principalPercent}%` }}
                    title={`Interest: ${100 - principalPercent}%`}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Principal ({principalPercent}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    Interest ({100 - principalPercent}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function FinancingDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-400" />
          Customer Financing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Offer flexible financing options to help customers afford bigger jobs.
          Track active plans, process applications, and see how financing
          impacts your revenue.
        </p>
      </div>

      {/* 1. Financing Overview KPIs */}
      <FinancingOverview />

      {/* Tabbed sections */}
      <Tabs defaultValue="plans">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="plans">
            <CreditCard className="h-4 w-4" />
            Active Plans
          </TabsTrigger>
          <TabsTrigger value="applications">
            <FileText className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="impact">
            <BarChart3 className="h-4 w-4" />
            Revenue Impact
          </TabsTrigger>
        </TabsList>

        {/* 2. Active Plans Table */}
        <TabsContent value="plans" className="mt-4">
          <ActivePlansTable />
        </TabsContent>

        {/* 3. Application Tracker */}
        <TabsContent value="applications" className="mt-4">
          <ApplicationTracker />
        </TabsContent>

        {/* 4. Revenue Impact Chart */}
        <TabsContent value="impact" className="mt-4">
          <RevenueImpactChart />
        </TabsContent>
      </Tabs>

      {/* 5. Quick Apply + 6. Calculator side by side on large screens */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FadeInView delay={0}>
          <QuickApplyForm />
        </FadeInView>
        <FadeInView delay={0.1}>
          <FinancingCalculator />
        </FadeInView>
      </div>
    </div>
  );
}
