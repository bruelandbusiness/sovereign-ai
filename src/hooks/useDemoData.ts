"use client";

import type { KPIData, DashboardLead, ClientProfile, SubscriptionInfo } from "@/types/dashboard";

const demoProfile: ClientProfile = {
  businessName: "Apex Roofing Solutions",
  ownerName: "Sarah Chen",
  initials: "AR",
  city: "Dallas, TX",
  vertical: "Roofing",
  plan: "Growth Bundle",
};

const demoKPIs: KPIData[] = [
  { label: "Leads This Month", value: 47, change: "+23", changeType: "positive" },
  { label: "Conversion Rate", value: "34%", change: "+8%", changeType: "positive" },
  { label: "Google Rating", value: "4.8", change: "+0.6", changeType: "positive" },
  { label: "Monthly ROI", value: "11.2x", change: "+3.1x", changeType: "positive" },
];

const demoLeads: DashboardLead[] = [
  { name: "John Miller", email: "john@miller.com", phone: "(214) 555-0142", source: "website", status: "qualified", date: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { name: "Lisa Park", email: "lisa@parkresidential.com", phone: "(972) 555-0198", source: "chatbot", status: "appointment", date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { name: "Robert Davis", email: "", phone: "(469) 555-0231", source: "phone", status: "new", date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { name: "Maria Garcia", email: "maria.g@email.com", phone: "(817) 555-0167", source: "referral", status: "won", date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { name: "Tom Wilson", email: "twilson@email.com", phone: "(214) 555-0293", source: "form", status: "qualified", date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { name: "Amy Chen", email: "amy.chen@outlook.com", phone: "(469) 555-0311", source: "chatbot", status: "new", date: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString() },
];

const demoActivities = [
  { id: "a1", type: "lead_captured" as const, title: "New lead: John Miller", description: "Captured via website contact form — roof inspection request", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "a2", type: "review_received" as const, title: "New 5-star review", description: "Lisa P. left a 5-star Google review: \"Best roofing company in Dallas!\"", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: "a3", type: "call_booked" as const, title: "Appointment booked", description: "AI Voice Agent booked estimate for Robert Davis — Thursday 2pm", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: "a4", type: "content_published" as const, title: "Blog post published", description: "\"5 Signs You Need a Roof Replacement in Dallas\" — targeting high-intent keywords", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: "a5", type: "email_sent" as const, title: "Drip email delivered", description: "Follow-up sequence sent to 23 leads — 47% open rate", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: "a6", type: "review_response" as const, title: "Review response posted", description: "AI responded to Google review from Mark T. with personalized thank you", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
];

const demoServices = [
  { serviceId: "lead-gen", status: "active", activatedAt: "2026-01-15T00:00:00Z" },
  { serviceId: "voice-agent", status: "active", activatedAt: "2026-01-15T00:00:00Z" },
  { serviceId: "seo", status: "active", activatedAt: "2026-01-15T00:00:00Z" },
  { serviceId: "email", status: "active", activatedAt: "2026-01-16T00:00:00Z" },
  { serviceId: "reviews", status: "active", activatedAt: "2026-01-15T00:00:00Z" },
  { serviceId: "crm", status: "active", activatedAt: "2026-01-16T00:00:00Z" },
];

const demoSubscription: SubscriptionInfo = {
  bundleId: "growth",
  bundleName: "Growth",
  status: "active",
  monthlyAmount: 6997,
  activeServiceCount: 6,
};

export function useDemoData() {
  return {
    profile: demoProfile,
    kpis: demoKPIs,
    leads: demoLeads,
    activities: demoActivities,
    services: demoServices,
    subscription: demoSubscription,
    isLoading: false,
  };
}
