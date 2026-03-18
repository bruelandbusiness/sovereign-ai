"use client";

import useSWR from "swr";
import type { ClientProfile, KPIData, DashboardLead, SubscriptionInfo } from "@/types/dashboard";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useDashboard() {
  const { data: profile, isLoading: profileLoading } = useSWR<ClientProfile>(
    "/api/dashboard/profile",
    fetcher
  );

  const { data: kpis, isLoading: kpisLoading } = useSWR<KPIData[]>(
    "/api/dashboard/kpis",
    fetcher
  );

  const { data: leads, isLoading: leadsLoading } = useSWR<DashboardLead[]>(
    "/api/dashboard/leads",
    fetcher
  );

  const { data: activities, isLoading: activitiesLoading } = useSWR<
    {
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: string;
    }[]
  >("/api/dashboard/activity", fetcher);

  const { data: services, isLoading: servicesLoading } = useSWR<
    { serviceId: string; status: string; activatedAt: string | null }[]
  >("/api/dashboard/services", fetcher);

  const { data: subscription, isLoading: subscriptionLoading } =
    useSWR<SubscriptionInfo | null>("/api/dashboard/subscription", fetcher);

  const isLoading =
    profileLoading ||
    kpisLoading ||
    leadsLoading ||
    activitiesLoading ||
    servicesLoading ||
    subscriptionLoading;

  return {
    profile: profile || null,
    kpis: kpis || [],
    leads: leads || [],
    activities: activities || [],
    services: services || [],
    subscription: subscription || null,
    isLoading,
  };
}
