"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanInfo {
  id: string;
  isActive: boolean;
  pricePerLead: number;
  pricePerBooking: number;
  monthlyMinimum: number;
  monthlyCap: number | null;
  servicesIncluded: string[];
  billingCycleStart: string;
}

interface CycleStats {
  leadCount: number;
  bookingCount: number;
  totalCharges: number;
  effectiveCharges: number;
  effectiveCostPerLead: number;
  daysRemaining: number;
  totalDays: number;
  cycleStart: string;
  cycleEnd: string;
}

interface PrevCycle {
  leadCount: number;
  bookingCount: number;
  totalCharges: number;
}

interface PerformanceData {
  plan: PlanInfo;
  currentCycle: CycleStats;
  previousCycle: PrevCycle;
}

interface PerformanceEvent {
  id: string;
  type: string;
  amount: number;
  leadId: string | null;
  bookingId: string | null;
  description: string;
  invoiced: boolean;
  createdAt: string;
}

interface EventsResponse {
  events: PerformanceEvent[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PerformanceDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [events, setEvents] = useState<PerformanceEvent[]>([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/performance")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load performance data");
        return res.json();
      })
      .then((json: PerformanceData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fetchEvents = useCallback((page: number) => {
    fetch(`/api/dashboard/performance/events?page=${page}&limit=20`)
      .then((res) => res.json())
      .then((json: EventsResponse) => {
        setEvents(json.events);
        setEventsPage(json.page);
        setEventsTotalPages(json.totalPages);
      })
      .catch(() => {
        toast("We couldn't load your performance events. Please refresh the page.", "error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" aria-busy="true" aria-label="Loading performance data">
          <Container>
            <div className="mb-8 flex items-center gap-4">
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
              <div>
                <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
                <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
            <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
            <div className="mt-6 h-24 animate-pulse rounded-xl bg-muted" />
            <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" />
          </Container>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="text-center max-w-md px-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <DollarSign className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold">
              {error ? "Unable to Load Data" : "No Performance Plan"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || "No performance plan found for your account. If you recently signed up, your plan will be set up soon. Contact support if you need help."}
            </p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-primary underline">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { plan, currentCycle, previousCycle } = data;

  // Progress bar percentages
  const chargesPercent = plan.monthlyCap
    ? Math.min(100, Math.round((currentCycle.totalCharges / plan.monthlyCap) * 100))
    : 0;
  const minimumPercent =
    plan.monthlyCap
      ? Math.min(100, Math.round((plan.monthlyMinimum / plan.monthlyCap) * 100))
      : currentCycle.totalCharges >= plan.monthlyMinimum
        ? 100
        : Math.round((currentCycle.totalCharges / plan.monthlyMinimum) * 100);

  const leadChange = pctChange(currentCycle.leadCount, previousCycle.leadCount);
  const bookingChange = pctChange(currentCycle.bookingCount, previousCycle.bookingCount);
  const chargesChange = pctChange(currentCycle.totalCharges, previousCycle.totalCharges);

  // Bar chart data (current vs previous)
  const barMax = Math.max(
    currentCycle.leadCount,
    previousCycle.leadCount,
    currentCycle.bookingCount,
    previousCycle.bookingCount,
    1
  );

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8" aria-label="Performance dashboard">
        <Container>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Performance Plan</h1>
              <p className="text-sm text-muted-foreground">
                Outcome-based billing &mdash; you pay for results, not retainers
              </p>
            </div>
            {plan.isActive && (
              <span className="ml-auto rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Active
              </span>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Key performance metrics">
            <Card aria-label={`Qualified Leads: ${currentCycle.leadCount}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Qualified Leads
                  </div>
                  {leadChange !== 0 && (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        leadChange > 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                      aria-label={`${leadChange > 0 ? "Up" : "Down"} ${Math.abs(leadChange)}% from last period`}
                    >
                      {leadChange > 0 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {leadChange > 0 ? "+" : ""}
                      {leadChange}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold">{currentCycle.leadCount.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCents(plan.pricePerLead)} each
                </p>
              </CardContent>
            </Card>

            <Card aria-label={`Bookings: ${currentCycle.bookingCount}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Bookings
                  </div>
                  {bookingChange !== 0 && (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        bookingChange > 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                      aria-label={`${bookingChange > 0 ? "Up" : "Down"} ${Math.abs(bookingChange)}% from last period`}
                    >
                      {bookingChange > 0 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {bookingChange > 0 ? "+" : ""}
                      {bookingChange}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold">{currentCycle.bookingCount.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCents(plan.pricePerBooking)} each
                </p>
              </CardContent>
            </Card>

            <Card aria-label={`Total Charges: ${formatCents(currentCycle.effectiveCharges)}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" aria-hidden="true" />
                    Total Charges
                  </div>
                  {chargesChange !== 0 && (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        chargesChange > 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                      aria-label={`${chargesChange > 0 ? "Up" : "Down"} ${Math.abs(chargesChange)}% from last period`}
                    >
                      {chargesChange > 0 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {chargesChange > 0 ? "+" : ""}
                      {chargesChange}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold">
                  {formatCents(currentCycle.effectiveCharges)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Min: {formatCents(plan.monthlyMinimum)}
                  {plan.monthlyCap ? ` / Cap: ${formatCents(plan.monthlyCap)}` : ""}
                </p>
              </CardContent>
            </Card>

            <Card aria-label={`Days Remaining: ${currentCycle.daysRemaining} of ${currentCycle.totalDays}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Days Remaining
                </div>
                <p className="mt-2 text-3xl font-bold">{currentCycle.daysRemaining}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  of {currentCycle.totalDays} days in cycle
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar: charges vs minimum vs cap */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold">Billing Progress</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Charges: {formatCents(currentCycle.totalCharges)}
                  </span>
                  <span>
                    {plan.monthlyCap
                      ? `Cap: ${formatCents(plan.monthlyCap)}`
                      : "No cap"}
                  </span>
                </div>
                <div
                  className="relative h-4 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={plan.monthlyCap ? chargesPercent : minimumPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Billing progress: ${formatCents(currentCycle.totalCharges)} of ${plan.monthlyCap ? formatCents(plan.monthlyCap) : formatCents(plan.monthlyMinimum)}`}
                >
                  {/* Charges fill */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: plan.monthlyCap
                        ? `${chargesPercent}%`
                        : `${Math.min(100, minimumPercent)}%`,
                    }}
                  />
                  {/* Minimum marker */}
                  {plan.monthlyCap && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-yellow-400"
                      style={{ left: `${minimumPercent}%` }}
                      title={`Minimum: ${formatCents(plan.monthlyMinimum)}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                {plan.monthlyCap && (
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>$0</span>
                    <span
                      style={{ marginLeft: `${Math.max(0, minimumPercent - 10)}%` }}
                      className="text-yellow-400"
                    >
                      Min ({formatCents(plan.monthlyMinimum)})
                    </span>
                    <span className="ml-auto">
                      {formatCents(plan.monthlyCap)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Effective Cost Per Lead */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold">Your Effective Cost Per Lead</h2>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {currentCycle.leadCount > 0
                  ? formatCents(currentCycle.effectiveCostPerLead)
                  : "--"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {currentCycle.leadCount > 0
                  ? `Based on ${formatCents(currentCycle.effectiveCharges)} total charges across ${currentCycle.leadCount} lead${currentCycle.leadCount !== 1 ? "s" : ""}`
                  : "Generate leads to see your effective cost"}
              </p>
            </CardContent>
          </Card>

          {/* Month-over-Month Comparison (CSS bar chart) */}
          <Card className="mt-6" role="figure" aria-label="Month-over-month lead and booking comparison chart">
            <CardContent className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Month-over-Month Comparison</h2>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {/* Leads comparison */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Qualified Leads
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-xs text-muted-foreground">This mo</span>
                      <div className="flex-1">
                        <div
                          className="h-6 rounded bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${Math.max(4, (currentCycle.leadCount / barMax) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold">
                        {currentCycle.leadCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-xs text-muted-foreground">Last mo</span>
                      <div className="flex-1">
                        <div
                          className="h-6 rounded bg-muted-foreground/30 transition-all duration-500"
                          style={{
                            width: `${Math.max(4, (previousCycle.leadCount / barMax) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold text-muted-foreground">
                        {previousCycle.leadCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bookings comparison */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Booked Appointments
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-xs text-muted-foreground">This mo</span>
                      <div className="flex-1">
                        <div
                          className="h-6 rounded bg-primary transition-all duration-500"
                          style={{
                            width: `${Math.max(4, (currentCycle.bookingCount / barMax) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold">
                        {currentCycle.bookingCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-xs text-muted-foreground">Last mo</span>
                      <div className="flex-1">
                        <div
                          className="h-6 rounded bg-muted-foreground/30 transition-all duration-500"
                          style={{
                            width: `${Math.max(4, (previousCycle.bookingCount / barMax) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold text-muted-foreground">
                        {previousCycle.bookingCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Log */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Event Log</h2>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No performance events yet. Events will appear here as leads
                  and bookings are generated.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-5 px-5" tabIndex={0} role="region" aria-label="Performance events table">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                          <th scope="col" className="pb-2 pr-4 font-medium">Date</th>
                          <th scope="col" className="pb-2 pr-4 font-medium">Type</th>
                          <th scope="col" className="pb-2 pr-4 font-medium">Description</th>
                          <th scope="col" className="pb-2 text-right font-medium">Charge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {events.map((event) => (
                          <tr key={event.id}>
                            <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(event.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  event.type === "qualified_lead"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : event.type === "booked_appointment"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {event.type === "qualified_lead"
                                  ? "Lead"
                                  : event.type === "booked_appointment"
                                    ? "Booking"
                                    : "Job"}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-foreground">
                              {event.description}
                            </td>
                            <td className="py-2.5 text-right font-medium tabular-nums">
                              {formatCents(event.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {eventsTotalPages > 1 && (
                    <nav className="mt-4 flex items-center justify-between" aria-label="Event log pagination">
                      <p className="text-xs text-muted-foreground">
                        Page {eventsPage} of {eventsTotalPages}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={eventsPage <= 1}
                          onClick={() => fetchEvents(eventsPage - 1)}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={eventsPage >= eventsTotalPages}
                          onClick={() => fetchEvents(eventsPage + 1)}
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </nav>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
