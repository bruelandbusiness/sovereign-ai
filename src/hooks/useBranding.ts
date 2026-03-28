"use client";

import useSWR from "swr";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandingSettings {
  logoUrl: string | null;
  brandColor: string;
  accentColor: string;
  companyName: string;
  customDomain: string;
  emailFooter: string;
  showPoweredBy: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: null,
  brandColor: "#4C85FF",
  accentColor: "#10B981",
  companyName: "",
  customDomain: "",
  emailFooter: "",
  showPoweredBy: true,
};

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch branding settings");
    return res.json();
  });

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches the current client's white-label branding settings.
 *
 * Returns sensible defaults when no custom branding has been configured,
 * so consumers can always rely on non-null values for colors, etc.
 *
 * Usage:
 *   const { branding, isLoading, error, mutate } = useBranding();
 *   // branding.brandColor is always a valid hex string
 */
export function useBranding() {
  const { data, error, isLoading, mutate } = useSWR<{
    branding: BrandingSettings;
  }>("/api/dashboard/settings/branding", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const branding: BrandingSettings = data?.branding
    ? {
        logoUrl: data.branding.logoUrl ?? DEFAULT_BRANDING.logoUrl,
        brandColor: data.branding.brandColor || DEFAULT_BRANDING.brandColor,
        accentColor:
          data.branding.accentColor || DEFAULT_BRANDING.accentColor,
        companyName:
          data.branding.companyName || DEFAULT_BRANDING.companyName,
        customDomain:
          data.branding.customDomain || DEFAULT_BRANDING.customDomain,
        emailFooter:
          data.branding.emailFooter || DEFAULT_BRANDING.emailFooter,
        showPoweredBy:
          typeof data.branding.showPoweredBy === "boolean"
            ? data.branding.showPoweredBy
            : DEFAULT_BRANDING.showPoweredBy,
      }
    : { ...DEFAULT_BRANDING };

  return {
    branding,
    isLoading,
    error: error as Error | undefined,
    mutate,
  } as const;
}
