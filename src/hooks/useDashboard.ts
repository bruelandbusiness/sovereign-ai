"use client";

import { useCallback, useMemo } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import type { ClientProfile, KPIData, DashboardLead, SubscriptionInfo, ROIData } from "@/types/dashboard";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.json();
  });

/** Shared SWR defaults for all dashboard hooks */
const BASE_SWR_OPTIONS: SWRConfiguration = {
  errorRetryCount: 3,
  errorRetryInterval: 5_000,
  dedupingInterval: 5_000,
  revalidateOnFocus: false,
  shouldRetryOnError: true,
};

/** Fast-changing data (leads, activity) revalidates more often */
const FAST_SWR_OPTIONS: SWRConfiguration = {
  ...BASE_SWR_OPTIONS,
  refreshInterval: 30_000, // 30s polling for near-realtime feel
};

/** Slow-changing data (profile, services, subscription) revalidates less */
const SLOW_SWR_OPTIONS: SWRConfiguration = {
  ...BASE_SWR_OPTIONS,
  refreshInterval: 120_000, // 2 min
};

export interface DashboardServiceEntry {
  serviceId: string;
  status: string;
  activatedAt: string | null;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export function useDashboard() {
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    mutate: mutateProfile,
  } = useSWR<ClientProfile>("/api/dashboard/profile", fetcher, SLOW_SWR_OPTIONS);

  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
    mutate: mutateKpis,
  } = useSWR<KPIData[]>("/api/dashboard/kpis", fetcher, FAST_SWR_OPTIONS);

  const {
    data: leads,
    isLoading: leadsLoading,
    error: leadsError,
    mutate: mutateLeads,
  } = useSWR<DashboardLead[]>("/api/dashboard/leads", fetcher, FAST_SWR_OPTIONS);

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
    mutate: mutateActivities,
  } = useSWR<DashboardActivity[]>("/api/dashboard/activity", fetcher, FAST_SWR_OPTIONS);

  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
    mutate: mutateServices,
  } = useSWR<DashboardServiceEntry[]>("/api/dashboard/services", fetcher, SLOW_SWR_OPTIONS);

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    mutate: mutateSubscription,
  } = useSWR<SubscriptionInfo | null>("/api/dashboard/subscription", fetcher, SLOW_SWR_OPTIONS);

  const {
    data: roiData,
    isLoading: roiLoading,
    error: roiError,
    mutate: mutateRoi,
  } = useSWR<ROIData>("/api/dashboard/roi", fetcher, SLOW_SWR_OPTIONS);

  // Per-section loading is more useful than one global flag
  const isLoading =
    profileLoading ||
    kpisLoading ||
    leadsLoading ||
    activitiesLoading ||
    servicesLoading ||
    subscriptionLoading ||
    roiLoading;

  const retryAll = useCallback(() => {
    mutateProfile();
    mutateKpis();
    mutateLeads();
    mutateActivities();
    mutateServices();
    mutateSubscription();
    mutateRoi();
  }, [mutateProfile, mutateKpis, mutateLeads, mutateActivities, mutateServices, mutateSubscription, mutateRoi]);

  // Memoize the default ROI object to prevent unnecessary re-renders
  const defaultRoi = useMemo<ROIData>(() => ({ investment: 0, revenue: 0, roi: 0 }), []);

  return {
    profile: profile ?? null,
    kpis: kpis ?? [],
    leads: leads ?? [],
    activities: activities ?? [],
    services: services ?? [],
    subscription: subscription ?? null,
    roiData: roiData ?? defaultRoi,
    isLoading,
    // Per-section loading states
    profileLoading,
    kpisLoading,
    leadsLoading,
    activitiesLoading,
    servicesLoading,
    subscriptionLoading,
    roiLoading,
    // Per-section error states
    profileError,
    kpisError,
    leadsError,
    activitiesError,
    servicesError,
    subscriptionError,
    roiError,
    // Retry functions
    retryAll,
    retryProfile: mutateProfile,
    retryKpis: mutateKpis,
    retryLeads: mutateLeads,
    retryActivities: mutateActivities,
    retryServices: mutateServices,
    retrySubscription: mutateSubscription,
    retryRoi: mutateRoi,
  };
}
