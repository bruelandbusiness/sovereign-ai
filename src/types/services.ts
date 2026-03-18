import type { LucideIcon } from "lucide-react";

export type ServiceId =
  | "lead-gen"
  | "voice-agent"
  | "chatbot"
  | "seo"
  | "ads"
  | "email"
  | "social"
  | "reviews"
  | "booking"
  | "crm"
  | "website"
  | "analytics"
  | "content"
  | "reputation"
  | "retargeting"
  | "custom";

export type BundleId = "starter" | "growth" | "empire";

export type ServiceCategory =
  | "generation"
  | "engagement"
  | "management"
  | "intelligence";

export type VerticalId =
  | "hvac"
  | "plumbing"
  | "roofing"
  | "electrical"
  | "landscaping"
  | "general-contractor"
  | "other";

export interface Service {
  id: ServiceId;
  name: string;
  tagline: string;
  description: string;
  price: number;
  priceSuffix?: string;
  setupFee?: number;
  icon: LucideIcon;
  color: string;
  features: string[];
  category: ServiceCategory;
  popular?: boolean;
}

export interface Bundle {
  id: BundleId;
  name: string;
  price: number;
  services: ServiceId[];
  description: string;
  popular?: boolean;
  savings: string;
}

export interface Vertical {
  id: VerticalId;
  label: string;
}

export interface Testimonial {
  name: string;
  business: string;
  location: string;
  quote: string;
  rating: number;
  vertical: string;
}
