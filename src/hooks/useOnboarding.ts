"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BUNDLES, SERVICES } from "@/lib/constants";
import type { ServiceId } from "@/types/services";
import type {
  OnboardingFormData,
  OnboardingStep,
  BusinessInfoData,
  DetailsAndAccessData,
} from "@/types/onboarding";
import { trackOnboardingStepNumber, trackCheckoutInitiated } from "@/lib/analytics";

const STORAGE_KEY = "sovereign-onboarding-v2";

type WizardPhase = "steps" | "summary" | "complete";

/** Internal wizard state: 3 visual steps + combined details step */
interface WizardFormData {
  step1: OnboardingFormData["step1"];
  step2: { selectedServices: ServiceId[] };
  step3: DetailsAndAccessData;
}

interface UseOnboardingReturn {
  step: OnboardingStep;
  phase: WizardPhase;
  formData: WizardFormData;
  isSubmitting: boolean;
  isComplete: boolean;
  error: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nextStep: (data: Record<string, any>) => void;
  prevStep: () => void;
  skipStep: () => void;
  goToSummary: () => void;
  backFromSummary: () => void;
  submit: () => Promise<void>;
  /** Convert internal 3-step shape to 4-key API shape */
  toApiShape: () => OnboardingFormData;
}

const DEFAULT_FORM_DATA: WizardFormData = {
  step1: {
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    industry: "" as BusinessInfoData["industry"],
    serviceAreaRadius: "",
  },
  step2: {
    selectedServices: [],
  },
  step3: {
    averageJobValue: "",
    monthlyMarketingBudget: "",
    currentMarketingActivities: [],
    topCompetitors: "",
    googleBusinessProfile: "unsure",
    primaryGoal: "",
    biggestChallenge: "",
    gbpEmail: "",
    gaEmail: "",
    socialAccounts: "",
    additionalNotes: "",
  },
};

const TOTAL_STEPS = 3;

function loadFromStorage(): {
  formData: WizardFormData;
  step: OnboardingStep;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      formData: parsed.formData ?? DEFAULT_FORM_DATA,
      step: parsed.step ?? 1,
    };
  } catch {
    return null;
  }
}

function saveToStorage(formData: WizardFormData, step: OnboardingStep) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, step }));
  } catch {
    // silently fail
  }
}

function clearStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear legacy key
    sessionStorage.removeItem("sovereign-onboarding");
  } catch {
    // silently fail
  }
}

/** Convert 3-step wizard data to 4-key API shape for backward compat */
function toApiPayload(data: WizardFormData): OnboardingFormData {
  return {
    step1: data.step1,
    step2: {
      averageJobValue: data.step3.averageJobValue,
      monthlyMarketingBudget: data.step3.monthlyMarketingBudget,
      currentMarketingActivities: data.step3.currentMarketingActivities,
      topCompetitors: data.step3.topCompetitors,
      googleBusinessProfile: data.step3.googleBusinessProfile,
      primaryGoal: data.step3.primaryGoal,
      biggestChallenge: data.step3.biggestChallenge,
    },
    step3: {
      selectedServices: data.step2.selectedServices,
    },
    step4: {
      gbpEmail: data.step3.gbpEmail,
      gaEmail: data.step3.gaEmail,
      socialAccounts: data.step3.socialAccounts,
      additionalNotes: data.step3.additionalNotes,
    },
  };
}

export function useOnboarding(): UseOnboardingReturn {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<WizardFormData>(DEFAULT_FORM_DATA);
  const [phase, setPhase] = useState<WizardPhase>("steps");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [agencySlug, setAgencySlug] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Load persisted data on mount, or pre-select from URL params
  useEffect(() => {
    // Capture referral code from URL (always, even on resume)
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferralCode(refParam);
    }

    // Capture agency slug from URL (always, even on resume)
    const agencyParam = searchParams.get("agency");
    if (agencyParam) {
      setAgencySlug(agencyParam);
    }

    // Map offer param to coupon code for reactivation/abandoned cart flows
    const offerParam = searchParams.get("offer");
    if (offerParam) {
      const offerToCoupon: Record<string, string> = {
        reactivation20: "reactivation_20",
        abandoned10: "abandoned_10",
      };
      const mappedCoupon = offerToCoupon[offerParam];
      if (mappedCoupon) {
        setCoupon(mappedCoupon);
      }
    }

    const saved = loadFromStorage();
    if (saved) {
      setFormData(saved.formData);
      setStep(saved.step);
      return;
    }

    // Pre-select services from URL params (only on fresh start)
    const serviceParam = searchParams.get("service");
    const bundleParam = searchParams.get("bundle");

    if (serviceParam && SERVICES.some((s) => s.id === serviceParam)) {
      setFormData((prev) => ({
        ...prev,
        step2: { selectedServices: [serviceParam as ServiceId] },
      }));
    } else if (bundleParam) {
      const bundle = BUNDLES.find((b) => b.id === bundleParam);
      if (bundle) {
        setFormData((prev) => ({
          ...prev,
          step2: { selectedServices: [...bundle.services] as ServiceId[] },
        }));
      }
    }
  }, [searchParams]);

  // Persist on every change (localStorage survives refresh + tab close)
  useEffect(() => {
    if (phase === "complete") return;
    saveToStorage(formData, step);
  }, [formData, step, phase]);

  const nextStep = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: Record<string, any>) => {
      setFormData((prev) => ({
        ...prev,
        [`step${step}`]: { ...prev[`step${step}` as keyof WizardFormData], ...data },
      }));

      trackOnboardingStepNumber(step);

      if (step < TOTAL_STEPS) {
        setStep((prev) => (prev + 1) as OnboardingStep);
      } else {
        // After last step, go to summary
        setPhase("summary");
      }
    },
    [step]
  );

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as OnboardingStep);
    }
  }, [step]);

  /** Skip the current step without saving data (for all-optional steps) */
  const skipStep = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => (prev + 1) as OnboardingStep);
    } else {
      setPhase("summary");
    }
  }, [step]);

  const goToSummary = useCallback(() => {
    setPhase("summary");
  }, []);

  const backFromSummary = useCallback(() => {
    setPhase("steps");
    setStep(TOTAL_STEPS as OnboardingStep);
  }, []);

  const toApiShape = useCallback(() => {
    return toApiPayload(formData);
  }, [formData]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const apiData = toApiPayload(formData);
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...apiData, referralCode, agencySlug, coupon }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.detail || "Submission failed. Please try again.");
        return;
      }

      const data = await res.json();

      // If a checkout URL was returned, redirect to Stripe
      if (data.checkout_url) {
        const bundleParam = searchParams.get("bundle") || "custom";
        const price = data.price ?? 0;
        trackCheckoutInitiated(bundleParam, price);
        window.location.href = data.checkout_url;
        return;
      }

      setPhase("complete");
      setIsComplete(true);
      clearStorage();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, referralCode, agencySlug, coupon]);

  return {
    step,
    phase,
    formData,
    isSubmitting,
    isComplete,
    error,
    nextStep,
    prevStep,
    skipStep,
    goToSummary,
    backFromSummary,
    submit,
    toApiShape,
  };
}
