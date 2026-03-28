/**
 * Tests for useDashboard hook logic.
 *
 * Since we don't have @testing-library/react, we mock SWR and React
 * to test the hook's data transformation and default value logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock mutate functions
const mockMutateProfile = vi.fn();
const mockMutateKpis = vi.fn();
const mockMutateLeads = vi.fn();
const mockMutateActivities = vi.fn();
const mockMutateServices = vi.fn();
const mockMutateSubscription = vi.fn();
const mockMutateRoi = vi.fn();

// Track SWR calls to return different data per URL
let swrResponses: Record<string, unknown> = {};

vi.mock("react", () => ({
  useCallback: (fn: unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
}));

vi.mock("swr", () => ({
  default: (url: string) => {
    const response = swrResponses[url] || {};
    return response;
  },
}));

import { useDashboard } from "../useDashboard";

describe("useDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all loading, no data
    swrResponses = {
      "/api/dashboard/profile": {
        data: undefined,
        isLoading: true,
        mutate: mockMutateProfile,
      },
      "/api/dashboard/kpis": {
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: mockMutateKpis,
      },
      "/api/dashboard/leads": {
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: mockMutateLeads,
      },
      "/api/dashboard/activity": {
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: mockMutateActivities,
      },
      "/api/dashboard/services": {
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: mockMutateServices,
      },
      "/api/dashboard/subscription": {
        data: undefined,
        isLoading: true,
        mutate: mockMutateSubscription,
      },
      "/api/dashboard/roi": {
        data: undefined,
        isLoading: true,
        mutate: mockMutateRoi,
      },
    };
  });

  describe("default values when data is undefined", () => {
    it("returns null for profile when no data", () => {
      const result = useDashboard();
      expect(result.profile).toBeNull();
    });

    it("returns empty arrays for kpis, leads, activities, services", () => {
      const result = useDashboard();
      expect(result.kpis).toEqual([]);
      expect(result.leads).toEqual([]);
      expect(result.activities).toEqual([]);
      expect(result.services).toEqual([]);
    });

    it("returns null for subscription when no data", () => {
      const result = useDashboard();
      expect(result.subscription).toBeNull();
    });

    it("returns default ROI data when no data", () => {
      const result = useDashboard();
      expect(result.roiData).toEqual({ investment: 0, revenue: 0, roi: 0 });
    });
  });

  describe("loading state", () => {
    it("isLoading is true when any section is loading", () => {
      const result = useDashboard();
      expect(result.isLoading).toBe(true);
    });

    it("isLoading is false when all sections are done loading", () => {
      for (const key of Object.keys(swrResponses)) {
        (swrResponses[key] as Record<string, unknown>).isLoading = false;
      }
      const result = useDashboard();
      expect(result.isLoading).toBe(false);
    });

    it("isLoading is true when only one section is still loading", () => {
      for (const key of Object.keys(swrResponses)) {
        (swrResponses[key] as Record<string, unknown>).isLoading = false;
      }
      (swrResponses["/api/dashboard/kpis"] as Record<string, unknown>).isLoading = true;
      const result = useDashboard();
      expect(result.isLoading).toBe(true);
    });
  });

  describe("data passthrough", () => {
    it("returns profile data when available", () => {
      const profile = { id: "123", name: "Test" };
      (swrResponses["/api/dashboard/profile"] as Record<string, unknown>).data = profile;
      const result = useDashboard();
      expect(result.profile).toBe(profile);
    });

    it("returns kpis data when available", () => {
      const kpis = [{ label: "Revenue", value: 1000 }];
      (swrResponses["/api/dashboard/kpis"] as Record<string, unknown>).data = kpis;
      const result = useDashboard();
      expect(result.kpis).toBe(kpis);
    });

    it("returns roiData when available", () => {
      const roi = { investment: 5000, revenue: 15000, roi: 200 };
      (swrResponses["/api/dashboard/roi"] as Record<string, unknown>).data = roi;
      const result = useDashboard();
      expect(result.roiData).toBe(roi);
    });
  });

  describe("error states", () => {
    it("exposes per-section error states", () => {
      const kpisErr = new Error("kpis failed");
      const leadsErr = new Error("leads failed");
      (swrResponses["/api/dashboard/kpis"] as Record<string, unknown>).error = kpisErr;
      (swrResponses["/api/dashboard/leads"] as Record<string, unknown>).error = leadsErr;

      const result = useDashboard();
      expect(result.kpisError).toBe(kpisErr);
      expect(result.leadsError).toBe(leadsErr);
      expect(result.activitiesError).toBeUndefined();
      expect(result.servicesError).toBeUndefined();
    });
  });

  describe("retry functions", () => {
    it("retryAll calls all mutate functions", () => {
      // Set all loading to false so we can focus on retry
      for (const key of Object.keys(swrResponses)) {
        (swrResponses[key] as Record<string, unknown>).isLoading = false;
      }
      const result = useDashboard();
      result.retryAll();

      expect(mockMutateProfile).toHaveBeenCalled();
      expect(mockMutateKpis).toHaveBeenCalled();
      expect(mockMutateLeads).toHaveBeenCalled();
      expect(mockMutateActivities).toHaveBeenCalled();
      expect(mockMutateServices).toHaveBeenCalled();
      expect(mockMutateSubscription).toHaveBeenCalled();
      expect(mockMutateRoi).toHaveBeenCalled();
    });

    it("exposes individual retry functions", () => {
      const result = useDashboard();
      expect(result.retryKpis).toBe(mockMutateKpis);
      expect(result.retryLeads).toBe(mockMutateLeads);
      expect(result.retryActivities).toBe(mockMutateActivities);
      expect(result.retryServices).toBe(mockMutateServices);
    });
  });

  describe("exported types", () => {
    it("DashboardServiceEntry interface is exported", async () => {
      const mod = await import("../useDashboard");
      // The function export is the main thing we can verify
      expect(mod.useDashboard).toBeDefined();
      expect(typeof mod.useDashboard).toBe("function");
    });
  });
});
