import type { ServiceId, VerticalId } from "./services";

export interface BusinessInfoData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  industry: VerticalId;
  serviceAreaRadius?: string;
}

export interface CurrentSetupData {
  averageJobValue?: string;
  monthlyMarketingBudget?: string;
  currentMarketingActivities: string[];
  topCompetitors?: string;
  googleBusinessProfile: "active" | "inactive" | "none" | "unsure";
  primaryGoal?: string;
  biggestChallenge?: string;
}

export interface ServiceSelectionData {
  selectedServices: ServiceId[];
}

export interface AccountAccessData {
  gbpEmail?: string;
  gaEmail?: string;
  socialAccounts?: string;
  additionalNotes?: string;
}

/**
 * Combined step for Current Setup + Account Access (all optional fields).
 * Merged from the old step2 + step4 to reduce perceived onboarding length.
 */
export interface DetailsAndAccessData {
  // Current Setup fields
  averageJobValue?: string;
  monthlyMarketingBudget?: string;
  currentMarketingActivities: string[];
  topCompetitors?: string;
  googleBusinessProfile: "active" | "inactive" | "none" | "unsure";
  primaryGoal?: string;
  biggestChallenge?: string;
  // Account Access fields
  gbpEmail?: string;
  gaEmail?: string;
  socialAccounts?: string;
  additionalNotes?: string;
}

/**
 * The form data shape submitted to the API.
 * Internally uses 3 wizard steps but maps back to the 4-key shape
 * the API expects (step1–step4) for backward compatibility.
 */
export interface OnboardingFormData {
  step1: BusinessInfoData;
  step2: CurrentSetupData;
  step3: ServiceSelectionData;
  step4: AccountAccessData;
}

/** Visual wizard step (3 steps shown to user). */
export type OnboardingStep = 1 | 2 | 3;
