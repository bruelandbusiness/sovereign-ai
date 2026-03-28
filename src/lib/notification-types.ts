import {
  Bell,
  User,
  Star,
  Calendar,
  DollarSign,
  Bot,
  AlertTriangle,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Notification type → icon, color, label mapping
// ---------------------------------------------------------------------------

export interface NotificationTypeConfig {
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
  /** Default action label shown on toast notifications */
  toastAction?: string;
  /** Default route for the toast action link */
  toastRoute?: string;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
  // New lead captured
  lead: {
    Icon: User,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    label: "New Lead",
    toastAction: "View Lead",
    toastRoute: "/dashboard/crm",
  },
  lead_captured: {
    Icon: User,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    label: "New Lead",
    toastAction: "View Lead",
    toastRoute: "/dashboard/crm",
  },

  // New review received
  review: {
    Icon: Star,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "Review",
    toastAction: "View Review",
    toastRoute: "/dashboard/reviews",
  },
  review_received: {
    Icon: Star,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "Review",
    toastAction: "View Review",
    toastRoute: "/dashboard/reviews",
  },

  // Booking confirmed
  booking: {
    Icon: Calendar,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "Booking",
    toastAction: "View Booking",
    toastRoute: "/dashboard/bookings",
  },

  // Invoice paid
  billing: {
    Icon: DollarSign,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    label: "Payment",
    toastAction: "View Invoice",
    toastRoute: "/dashboard/billing",
  },
  invoice_paid: {
    Icon: DollarSign,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    label: "Payment",
    toastAction: "View Invoice",
    toastRoute: "/dashboard/billing",
  },

  // AI action taken
  ai_action: {
    Icon: Bot,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    label: "AI Action",
  },
  content: {
    Icon: Bot,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    label: "AI Action",
  },

  // Action required
  approval_required: {
    Icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Action Required",
  },
  action_required: {
    Icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Action Required",
  },

  // Weekly report ready
  report: {
    Icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    label: "Report",
  },
  report_ready: {
    Icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    label: "Report",
  },

  // Fallback
  system: {
    Icon: Bell,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "System",
  },
};

export function getNotificationConfig(type: string): NotificationTypeConfig {
  return NOTIFICATION_TYPES[type] ?? NOTIFICATION_TYPES.system;
}

// ---------------------------------------------------------------------------
// Relative time formatting (shared utility)
// ---------------------------------------------------------------------------

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Types that should trigger real-time toasts
// ---------------------------------------------------------------------------

export const TOAST_WORTHY_TYPES = new Set([
  "lead",
  "lead_captured",
  "review",
  "review_received",
  "booking",
  "billing",
  "invoice_paid",
]);
