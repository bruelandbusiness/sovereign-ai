"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  OnboardingFormData,
  OnboardingStep,
  BusinessInfoData,
  CurrentSetupData,
  ServiceSelectionData,
  AccountAccessData,
} from "@/types/onboarding";

const STORAGE_KEY = "sovereign-onboarding";

type WizardPhase = "steps" | "summary" | "complete";

interface UseOnboardingReturn {
  step: OnboardingStep;
  phase: WizardPhase;
  formData: OnboardingFormData;
  isSubmitting: boolean;
  isComplete: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nextStep: (data: Record<string, any>) => void;
  prevStep: () => void;
  goToSummary: () => void;
  backFromSummary: () => void;
  submit: () => Promise<void>;
}

const DEFAULT_FORM_DATA: OnboardingFormData = {
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
    averageJobValue: "",
    monthlyMarketingBudget: "",
    currentMarketingActivities: [],
    topCompetitors: "",
    googleBusinessProfile: "unsure",
    primaryGoal: "",
    biggestChallenge: "",
  },
  step3: {
    selectedServices: [],
  },
  step4: {
    gbpEmail: "",
    gaEmail: "",
    socialAccounts: "",
    additionalNotes: "",
  },
};

function loadFromStorage(): {
  formData: OnboardingFormData;
  step: OnboardingStep;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
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

function saveToStorage(formData: OnboardingFormData, step: OnboardingStep) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, step }));
  } catch {
    // silently fail
  }
}

function clearStorage() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function useOnboarding(): UseOnboardingReturn {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<OnboardingFormData>(DEFAULT_FORM_DATA);
  const [phase, setPhase] = useState<WizardPhase>("steps");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setFormData(saved.formData);
      setStep(saved.step);
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    if (phase === "complete") return;
    saveToStorage(formData, step);
  }, [formData, step, phase]);

  const nextStep = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: Record<string, any>) => {
      setFormData((prev) => ({
        ...prev,
        [`step${step}`]: { ...prev[`step${step}`], ...data },
      }));

      if (step < 4) {
        setStep((prev) => (prev + 1) as OnboardingStep);
      } else {
        // After step 4, go to summary
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

  const goToSummary = useCallback(() => {
    setPhase("summary");
  }, []);

  const backFromSummary = useCallback(() => {
    setPhase("steps");
    setStep(4);
  }, []);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call — replace with actual api.onboarding.submit(formData)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPhase("complete");
      setIsComplete(true);
      clearStorage();
    } catch {
      // Error handling can be added here
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    step,
    phase,
    formData,
    isSubmitting,
    isComplete,
    nextStep,
    prevStep,
    goToSummary,
    backFromSummary,
    submit,
  };
}
