"use client";

import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { formatPercentValue } from "@/lib/formatters";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  DollarSign,
  Plus,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  StickyNote,
  CalendarClock,
  Settings,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceType: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  createdAt: string;
  value?: number;
}

interface ServiceConfig {
  id: string;
  serviceId: string;
  status: string;
  activatedAt: string | null;
  config: {
    businessHours?: { start: string; end: string };
    allowWeekends?: boolean;
    slotDuration?: number;
    bufferTime?: number;
    autoConfirm?: boolean;
    notifications?: boolean;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

// ── Demo Data ────────────────────────────────────────────────

function generateDemoBookings(): Booking[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const services = [
    "AC Repair",
    "Furnace Tune-Up",
    "Plumbing Inspection",
    "Drain Cleaning",
    "Water Heater Install",
    "Roof Inspection",
    "Gutter Cleaning",
    "Electrical Panel Upgrade",
    "Duct Cleaning",
    "Sewer Line Repair",
  ];

  const customers = [
    { name: "Sarah Johnson", email: "sarah.j@gmail.com", phone: "(555) 234-5678" },
    { name: "Mike Rivera", email: "mike.r@outlook.com", phone: "(555) 345-6789" },
    { name: "Lisa Chen", email: "lisa.chen@yahoo.com", phone: "(555) 456-7890" },
    { name: "James Williams", email: "jwilliams@gmail.com", phone: "(555) 567-8901" },
    { name: "Emily Davis", email: "emily.d@hotmail.com", phone: "(555) 678-9012" },
    { name: "Robert Thompson", email: "rthompson@gmail.com", phone: "(555) 789-0123" },
    { name: "Amanda Garcia", email: "a.garcia@outlook.com", phone: "(555) 890-1234" },
    { name: "David Kim", email: "dkim@gmail.com", phone: "(555) 901-2345" },
    { name: "Jennifer Martinez", email: "jen.m@yahoo.com", phone: "(555) 012-3456" },
    { name: "Chris Anderson", email: "canderson@gmail.com", phone: "(555) 123-4567" },
    { name: "Rachel Brown", email: "rbrown@outlook.com", phone: "(555) 234-6789" },
    { name: "Tom Wilson", email: "twilson@gmail.com", phone: "(555) 345-7890" },
    { name: "Karen Taylor", email: "ktaylor@yahoo.com", phone: "(555) 456-8901" },
    { name: "Daniel Lee", email: "dlee@hotmail.com", phone: "(555) 567-9012" },
    { name: "Michelle White", email: "mwhite@gmail.com", phone: "(555) 678-0123" },
  ];

  const statuses = ["confirmed", "confirmed", "confirmed", "pending", "completed", "completed", "canceled", "no_show"];
  const values = [150, 200, 250, 350, 450, 120, 180, 300, 275, 500];
  const notes = [
    "Customer prefers morning appointments",
    "Second floor unit, buzzer code 4521",
    "Has two units that need servicing",
    "Referred by neighbor",
    null,
    "Warranty repair - no charge",
    "Needs quote before proceeding",
    null,
    "Elderly customer, please call ahead",
    "Gate code: 1234",
  ];

  const bookings: Booking[] = [];

  // Past bookings (this month, completed/no-show/canceled)
  for (let i = 0; i < 18; i++) {
    const daysAgo = Math.floor(Math.random() * 25) + 1;
    const hour = 8 + Math.floor(Math.random() * 9);
    const cust = customers[i % customers.length];
    const start = new Date(today);
    start.setDate(start.getDate() - daysAgo);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 60 + Math.floor(Math.random() * 3) * 30);

    const pastStatuses = ["completed", "completed", "completed", "completed", "no_show", "canceled"];
    bookings.push({
      id: `demo-past-${i}`,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      serviceType: services[i % services.length],
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      status: pastStatuses[i % pastStatuses.length],
      notes: notes[i % notes.length],
      createdAt: new Date(start.getTime() - 86400000 * 2).toISOString(),
      value: values[i % values.length],
    });
  }

  // Today's bookings
  const todayBookings = [
    { hour: 8, cIdx: 0, sIdx: 0, status: "completed", dur: 90 },
    { hour: 10, cIdx: 1, sIdx: 1, status: "confirmed", dur: 60 },
    { hour: 11, cIdx: 2, sIdx: 2, status: "confirmed", dur: 60 },
    { hour: 13, cIdx: 3, sIdx: 3, status: "pending", dur: 90 },
    { hour: 15, cIdx: 4, sIdx: 4, status: "confirmed", dur: 120 },
  ];

  for (const tb of todayBookings) {
    const start = new Date(today);
    start.setHours(tb.hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + tb.dur);
    const cust = customers[tb.cIdx];
    bookings.push({
      id: `demo-today-${tb.hour}`,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      serviceType: services[tb.sIdx],
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      status: tb.status,
      notes: notes[tb.cIdx % notes.length],
      createdAt: new Date(start.getTime() - 86400000).toISOString(),
      value: values[tb.sIdx % values.length],
    });
  }

  // Upcoming bookings (next 7 days)
  for (let day = 1; day <= 7; day++) {
    const numBookings = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numBookings; j++) {
      const hour = 8 + Math.floor(Math.random() * 9);
      const custIdx = (day * 3 + j) % customers.length;
      const cust = customers[custIdx];
      const start = new Date(today);
      start.setDate(start.getDate() + day);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 60 + Math.floor(Math.random() * 3) * 30);

      bookings.push({
        id: `demo-future-${day}-${j}`,
        customerName: cust.name,
        customerEmail: cust.email,
        customerPhone: cust.phone,
        serviceType: services[(day + j) % services.length],
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        status: statuses[j % 4] === "completed" ? "confirmed" : statuses[j % 4],
        notes: notes[(day + j) % notes.length],
        createdAt: new Date(start.getTime() - 86400000 * 3).toISOString(),
        value: values[(day + j) % values.length],
      });
    }
  }

  return bookings.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

const DEMO_BOOKINGS = generateDemoBookings();

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ElementType;
    color: string;
  }
> = {
  confirmed: {
    label: "Confirmed",
    variant: "default",
    icon: CheckCircle2,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  pending: {
    label: "Pending",
    variant: "outline",
    icon: Clock,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  completed: {
    label: "Completed",
    variant: "secondary",
    icon: CheckCircle2,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  canceled: {
    label: "Canceled",
    variant: "destructive",
    icon: XCircle,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  no_show: {
    label: "No Show",
    variant: "destructive",
    icon: AlertCircle,
    color: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function _formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  );
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents);
}

// ── Sub-Components ───────────────────────────────────────────

function BookingDetailPanel({
  booking,
  onClose,
  onAction,
}: {
  booking: Booking;
  onClose: () => void;
  onAction: (action: string, bookingId: string) => void;
}) {
  const [notes, setNotes] = useState(booking.notes || "");
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Booking Details</CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{booking.customerName}</p>
              <Badge
                variant={statusConfig.variant}
                className={cn("mt-0.5", statusConfig.color)}
              >
                <StatusIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          <div className="ml-[52px] space-y-1.5">
            {booking.customerPhone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <a href={`tel:${booking.customerPhone}`} className="hover:text-foreground">
                  {booking.customerPhone}
                </a>
              </div>
            )}
            {booking.customerEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <a href={`mailto:${booking.customerEmail}`} className="hover:text-foreground">
                  {booking.customerEmail}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Service & Time */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          {booking.serviceType && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">{booking.serviceType}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{formatDateShort(booking.startsAt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">
              {formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">
              {formatDuration(booking.startsAt, booking.endsAt)}
            </span>
          </div>
          {booking.value != null && booking.value > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Value</span>
              <span className="font-medium text-emerald-400">
                {formatCurrency(booking.value)}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            {booking.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => onAction("confirm", booking.id)}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Confirm
              </Button>
            )}
            {(booking.status === "confirmed" || booking.status === "pending") && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction("reschedule", booking.id)}
                >
                  <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => onAction("cancel", booking.id)}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction("remind", booking.id)}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send Reminder
                </Button>
              </>
            )}
            {booking.status === "confirmed" && (
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                onClick={() => onAction("complete", booking.id)}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <Label htmlFor={`booking-notes-${booking.id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </Label>
          </div>
          <Textarea
            id={`booking-notes-${booking.id}`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this appointment..."
            className="text-sm"
          />
          {notes !== (booking.notes || "") && (
            <Button size="sm" variant="outline" className="w-full">
              Save Notes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NewBookingModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
}) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceType: "",
    date: "",
    startTime: "",
    duration: "60",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Booking
            </CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nb-name">Customer Name *</Label>
              <Input
                id="nb-name"
                required
                value={form.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nb-phone">Phone</Label>
                <Input
                  id="nb-phone"
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nb-email">Email</Label>
                <Input
                  id="nb-email"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => updateField("customerEmail", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb-service">Service Type</Label>
              <select
                id="nb-service"
                value={form.serviceType}
                onChange={(e) => updateField("serviceType", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a service...</option>
                <option value="AC Repair">AC Repair - $150</option>
                <option value="Furnace Tune-Up">Furnace Tune-Up - $120</option>
                <option value="Plumbing Inspection">Plumbing Inspection - $200</option>
                <option value="Drain Cleaning">Drain Cleaning - $180</option>
                <option value="Water Heater Install">Water Heater Install - $450</option>
                <option value="Roof Inspection">Roof Inspection - $250</option>
                <option value="Gutter Cleaning">Gutter Cleaning - $150</option>
                <option value="Electrical Panel Upgrade">Electrical Panel Upgrade - $500</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nb-date">Date *</Label>
                <Input
                  id="nb-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nb-time">Start Time *</Label>
                <Input
                  id="nb-time"
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nb-duration">Duration</Label>
                <select
                  id="nb-duration"
                  value={form.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb-notes">Notes</Label>
              <Textarea
                id="nb-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Any special instructions..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Booking
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Mini Calendar ────────────────────────────────────────────

function MiniCalendar({
  selectedDate,
  onSelectDate,
  bookingsByDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  bookingsByDate: Map<string, Booking[]>;
}) {
  const [viewMonth, setViewMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfWeek = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  ).getDay();

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    );
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon-sm" onClick={prevMonth} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <Button variant="ghost" size="icon-sm" onClick={nextMonth} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const date = new Date(
            viewMonth.getFullYear(),
            viewMonth.getMonth(),
            day
          );
          const dateKey = date.toISOString().split("T")[0];
          const bookingsOnDay = bookingsByDate.get(dateKey) || [];
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasBookings = bookingsOnDay.length > 0;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(date)}
              className={cn(
                "relative rounded-md p-1 text-xs transition-colors hover:bg-muted",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday && !isSelected && "font-bold text-primary",
              )}
              aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${hasBookings ? `, ${bookingsOnDay.length} bookings` : ""}`}
              aria-current={isToday ? "date" : undefined}
            >
              {day}
              {hasBookings && (
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-teal-400"
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export function BookingDashboard() {
  const {
    data: apiBookings,
    error: _bookingsError,
    isLoading: bookingsLoading,
  } = useSWR<Booking[]>("/api/services/booking/upcoming", fetcher);

  const {
    data: serviceConfig,
    isLoading: configLoading,
  } = useSWR<ServiceConfig>("/api/services/booking/config", fetcher);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "settings">("calendar");
  const [hoursStart, setHoursStart] = useState<string | null>(null);
  const [hoursEnd, setHoursEnd] = useState<string | null>(null);
  const [allowWeekends, setAllowWeekends] = useState<boolean | null>(null);
  const [bufferTime, setBufferTime] = useState<string | null>(null);
  const [autoConfirm, setAutoConfirm] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Use demo data when API returns empty or errors, merge with API data
  const allBookings = useMemo(() => {
    const apiList = apiBookings || [];
    return apiList.length > 0 ? apiList : DEMO_BOOKINGS;
  }, [apiBookings]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of allBookings) {
      const key = new Date(b.startsAt).toISOString().split("T")[0];
      const existing = map.get(key) || [];
      map.set(key, [...existing, b]);
    }
    return map;
  }, [allBookings]);

  // Today's bookings
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaysBookings = useMemo(
    () => allBookings.filter((b) => isSameDay(new Date(b.startsAt), today)),
    [allBookings, today]
  );

  // Selected day bookings
  const selectedDayBookings = useMemo(() => {
    const key = selectedDate.toISOString().split("T")[0];
    return bookingsByDate.get(key) || [];
  }, [selectedDate, bookingsByDate]);

  // Upcoming 7 days
  const upcomingBookings = useMemo(() => {
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    return allBookings.filter((b) => {
      const d = new Date(b.startsAt);
      return d >= today && d <= sevenDaysOut;
    });
  }, [allBookings, today]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = allBookings.filter((b) => {
      const d = new Date(b.startsAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalThisMonth = thisMonth.length;
    const completedCount = thisMonth.filter((b) => b.status === "completed").length;
    const noShowCount = thisMonth.filter((b) => b.status === "no_show").length;
    const completionRate = totalThisMonth > 0
      ? formatPercentValue((completedCount / totalThisMonth) * 100)
      : "0%";
    const noShowRate = totalThisMonth > 0
      ? formatPercentValue((noShowCount / totalThisMonth) * 100)
      : "0%";

    const totalValue = thisMonth.reduce((sum, b) => sum + (b.value || 0), 0);
    const avgValue = totalThisMonth > 0 ? Math.round(totalValue / totalThisMonth) : 0;

    return { totalThisMonth, completionRate, noShowRate, avgValue, todayCount: todaysBookings.length };
  }, [allBookings, todaysBookings]);

  const selectedBooking = selectedBookingId
    ? allBookings.find((b) => b.id === selectedBookingId) || null
    : null;

  // Config settings
  const displayStart = hoursStart ?? serviceConfig?.config?.businessHours?.start ?? "07:00";
  const displayEnd = hoursEnd ?? serviceConfig?.config?.businessHours?.end ?? "18:00";
  const displayWeekends = allowWeekends ?? serviceConfig?.config?.allowWeekends ?? false;
  const displayBuffer = bufferTime ?? String(serviceConfig?.config?.bufferTime ?? "15");
  const displayAutoConfirm = autoConfirm ?? serviceConfig?.config?.autoConfirm ?? true;

  const hasChanges = hoursStart !== null || hoursEnd !== null || allowWeekends !== null || bufferTime !== null || autoConfirm !== null;

  const handleSaveAvailability = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch("/api/services/booking/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessHours: { start: displayStart, end: displayEnd },
          allowWeekends: displayWeekends,
          bufferTime: parseInt(displayBuffer, 10),
          autoConfirm: displayAutoConfirm,
        }),
      });
      setHoursStart(null);
      setHoursEnd(null);
      setAllowWeekends(null);
      setBufferTime(null);
      setAutoConfirm(null);
    } finally {
      setIsSaving(false);
    }
  }, [displayStart, displayEnd, displayWeekends, displayBuffer, displayAutoConfirm]);

  const handleBookingAction = useCallback((_action: string, _bookingId: string) => {
    // TODO: call booking action API (confirm, cancel, reschedule, etc.)
  }, []);

  const handleNewBookingSubmit = useCallback((_data: Record<string, string>) => {
    // TODO: call new booking API
  }, []);

  // ── Loading ──────────────────────────────────────────────

  if (bookingsLoading && configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading booking system...
        </span>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" aria-label="Back to dashboard">
            <Button variant="ghost" size="icon-sm" aria-hidden="true" tabIndex={-1}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10" aria-hidden="true">
            <Calendar className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Booking Management</h1>
            <p className="text-sm text-muted-foreground">
              Schedule, manage, and track all your appointments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "calendar"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="mr-1.5 inline h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "settings"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="mr-1.5 inline h-3.5 w-3.5" />
              Settings
            </button>
          </div>

          <Link href="/dashboard/services/booking/widget">
            <Button variant="outline" size="sm">
              Widget Setup
            </Button>
          </Link>

          <Button size="sm" onClick={() => setShowNewBooking(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="card-interactive">
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
              <BarChart3 className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.totalThisMonth}</p>
              <p className="text-[11px] text-muted-foreground">Bookings This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.completionRate}</p>
              <p className="text-[11px] text-muted-foreground">Completion Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.noShowRate}</p>
              <p className="text-[11px] text-muted-foreground">No-Show Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <DollarSign className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {stats.avgValue > 0 ? formatCurrency(stats.avgValue) : "--"}
              </p>
              <p className="text-[11px] text-muted-foreground">Avg Booking Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
          {/* Left: Mini Calendar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <MiniCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  bookingsByDate={bookingsByDate}
                />
              </CardContent>
            </Card>

            {/* Today's Quick Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-teal-400" />
                  Today&apos;s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysBookings.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No appointments today
                  </p>
                ) : (
                  <div className="space-y-2">
                    {todaysBookings.map((b) => {
                      const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.confirmed;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedDate(today);
                            setSelectedBookingId(b.id);
                          }}
                          className={cn(
                            "w-full rounded-md border px-2.5 py-2 text-left transition-colors hover:bg-muted/50",
                            selectedBookingId === b.id
                              ? "border-primary/40 bg-primary/5"
                              : "border-border"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">
                              {b.customerName}
                            </span>
                            <span className={cn("text-[10px] font-medium rounded-full px-1.5 py-0.5", sc.color)}>
                              {sc.label}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatTime(b.startsAt)} - {b.serviceType}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center: Selected Day / Upcoming List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {isSameDay(selectedDate, today)
                      ? "Today's Appointments"
                      : selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                  </span>
                  <Badge variant="secondary">{selectedDayBookings.length} bookings</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayBookings.length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No appointments on this day
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowNewBooking(true)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Schedule Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayBookings
                      .sort(
                        (a, b) =>
                          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
                      )
                      .map((booking) => {
                        const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
                        const StatusIcon = sc.icon;
                        const isSelected = selectedBookingId === booking.id;

                        return (
                          <button
                            key={booking.id}
                            onClick={() =>
                              setSelectedBookingId(isSelected ? null : booking.id)
                            }
                            className={cn(
                              "w-full rounded-lg border p-3 text-left transition-all hover:shadow-md",
                              isSelected
                                ? "border-primary/40 bg-primary/5 shadow-md"
                                : "border-border hover:border-border/80"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {/* Time column */}
                              <div className="shrink-0 text-center min-w-[56px]">
                                <p className="text-sm font-bold tabular-nums">
                                  {formatTime(booking.startsAt)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatDuration(booking.startsAt, booking.endsAt)}
                                </p>
                              </div>

                              {/* Divider */}
                              <div className={cn(
                                "w-0.5 self-stretch rounded-full",
                                booking.status === "completed" ? "bg-blue-500/40" :
                                booking.status === "confirmed" ? "bg-emerald-500/40" :
                                booking.status === "pending" ? "bg-amber-500/40" :
                                "bg-red-500/40"
                              )} />

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold truncate">
                                    {booking.customerName}
                                  </p>
                                  <Badge
                                    variant={sc.variant}
                                    className={cn("shrink-0 text-[10px]", sc.color)}
                                  >
                                    <StatusIcon className="mr-0.5 h-2.5 w-2.5" aria-hidden="true" />
                                    {sc.label}
                                  </Badge>
                                </div>

                                {booking.serviceType && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {booking.serviceType}
                                    {booking.value != null && booking.value > 0 && (
                                      <span className="ml-2 text-emerald-400">
                                        {formatCurrency(booking.value)}
                                      </span>
                                    )}
                                  </p>
                                )}

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  {booking.customerPhone && (
                                    <span className="flex items-center gap-0.5">
                                      <Phone className="h-2.5 w-2.5" />
                                      {booking.customerPhone}
                                    </span>
                                  )}
                                  {booking.customerEmail && (
                                    <span className="flex items-center gap-0.5">
                                      <Mail className="h-2.5 w-2.5" />
                                      {booking.customerEmail}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming 7 Days Summary */}
            {isSameDay(selectedDate, today) && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Next 7 Days ({upcomingBookings.length} bookings)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(today);
                      date.setDate(date.getDate() + i + 1);
                      const key = date.toISOString().split("T")[0];
                      const dayBookings = bookingsByDate.get(key) || [];
                      const dayLabel = date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedDate(date)}
                          className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50"
                        >
                          <span className="text-muted-foreground">{dayLabel}</span>
                          <div className="flex items-center gap-2">
                            {dayBookings.length > 0 ? (
                              <>
                                <div className="flex -space-x-1">
                                  {dayBookings.slice(0, 3).map((b, idx) => (
                                    <div
                                      key={b.id}
                                      className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-[8px] font-bold text-teal-400 ring-1 ring-background"
                                      style={{ zIndex: 3 - idx }}
                                    >
                                      {b.customerName.charAt(0)}
                                    </div>
                                  ))}
                                </div>
                                <Badge variant="secondary" className="text-[10px] px-1.5">
                                  {dayBookings.length}
                                </Badge>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">--</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Booking Detail Panel */}
          <div>
            {selectedBooking ? (
              <BookingDetailPanel
                booking={selectedBooking}
                onClose={() => setSelectedBookingId(null)}
                onAction={handleBookingAction}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <User className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Select a booking to view details
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Click any appointment from the calendar to see customer info, service details, and quick actions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Set your available hours for accepting customer bookings.
              </p>

              {/* Hours grid */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="grid grid-cols-7 gap-2 text-center mb-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, idx) => (
                      <div key={day} className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {day}
                        </p>
                        <div
                          className={cn(
                            "h-8 rounded-md flex items-center justify-center text-[10px] font-medium",
                            idx < 5
                              ? "bg-teal-500/20 text-teal-400"
                              : displayWeekends
                                ? "bg-teal-500/10 text-teal-400/60"
                                : "bg-muted text-muted-foreground/40"
                          )}
                        >
                          {idx < 5 || displayWeekends
                            ? `${displayStart.slice(0, 5)}-${displayEnd.slice(0, 5)}`
                            : "Off"}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours-start">Opens At</Label>
                  <Input
                    id="hours-start"
                    type="time"
                    value={displayStart}
                    onChange={(e) => setHoursStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours-end">Closes At</Label>
                  <Input
                    id="hours-end"
                    type="time"
                    value={displayEnd}
                    onChange={(e) => setHoursEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-weekends">Weekend Bookings</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Allow customers to book on Saturday and Sunday
                  </p>
                </div>
                <Switch
                  id="allow-weekends"
                  checked={displayWeekends}
                  onCheckedChange={(checked) => setAllowWeekends(checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Scheduling Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="buffer-time">Buffer Time Between Appointments</Label>
                <p className="text-xs text-muted-foreground">
                  Travel or prep time between back-to-back bookings
                </p>
                <select
                  id="buffer-time"
                  value={displayBuffer}
                  onChange={(e) => setBufferTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="0">No buffer</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-confirm">Auto-Confirm Bookings</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically confirm new bookings without manual review
                  </p>
                </div>
                <Switch
                  id="auto-confirm"
                  checked={displayAutoConfirm}
                  onCheckedChange={(checked) => setAutoConfirm(checked)}
                />
              </div>

              {/* Service Types Overview */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Service Types</p>
                <p className="text-xs text-muted-foreground">
                  Services available for customer booking
                </p>
                <div className="space-y-1.5">
                  {[
                    { name: "AC Repair", duration: "90 min", price: "$150" },
                    { name: "Furnace Tune-Up", duration: "60 min", price: "$120" },
                    { name: "Plumbing Inspection", duration: "60 min", price: "$200" },
                    { name: "Drain Cleaning", duration: "60 min", price: "$180" },
                    { name: "Water Heater Install", duration: "120 min", price: "$450" },
                    { name: "Roof Inspection", duration: "90 min", price: "$250" },
                  ].map((svc) => (
                    <div
                      key={svc.name}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{svc.name}</p>
                        <p className="text-[11px] text-muted-foreground">{svc.duration}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">
                        {svc.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {hasChanges && (
                <Button
                  onClick={handleSaveAvailability}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Save All Settings
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Widget Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Booking Widget Preview
                </span>
                <Link href="/dashboard/services/booking/widget">
                  <Button variant="outline" size="sm">
                    Customize Widget
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-muted/10 p-6">
                <div className="mx-auto max-w-md">
                  {/* Simulated widget */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
                    <div className="text-center mb-4">
                      <h3 className="font-semibold">Schedule Your Service</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose a time that works for you
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"].map(
                        (time, idx) => (
                          <div
                            key={time}
                            className={cn(
                              "rounded-md border px-2 py-1.5 text-center text-[11px] font-medium",
                              idx === 2
                                ? "border-primary bg-primary/10 text-primary"
                                : idx === 5
                                  ? "border-border/40 bg-muted/30 text-muted-foreground/40 line-through"
                                  : "border-border text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            {time}
                          </div>
                        )
                      )}
                    </div>

                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Available: {displayStart.slice(0, 5)} - {displayEnd.slice(0, 5)}
                        {displayWeekends ? " (incl. weekends)" : " (Mon-Fri)"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {displayBuffer !== "0"
                          ? `${displayBuffer} min buffer between appointments`
                          : "No buffer between appointments"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBooking && (
        <NewBookingModal
          onClose={() => setShowNewBooking(false)}
          onSubmit={handleNewBookingSubmit}
        />
      )}
    </div>
  );
}
