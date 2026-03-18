import type { LucideIcon } from "lucide-react";
import type { BundleId, ServiceId } from "./services";

export interface KPIData {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtext?: string;
}

export interface ActivityItem {
  id: string;
  type:
    | "lead_captured"
    | "review_received"
    | "call_booked"
    | "email_sent"
    | "ad_optimized"
    | "seo_update"
    | "content_published"
    | "review_response";
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
}

export interface SubscriptionInfo {
  bundleId: BundleId;
  bundleName: string;
  monthlyAmount: number;
  activeServiceCount: number;
  status: "active" | "past_due" | "canceled";
}

export interface ClientProfile {
  businessName: string;
  ownerName: string;
  initials: string;
  city: string;
  vertical: string;
  plan: string;
}

export interface DashboardLead {
  name: string;
  email: string;
  phone: string;
  source: string;
  date: string;
  status: "qualified" | "appointment" | "won" | "new";
}
