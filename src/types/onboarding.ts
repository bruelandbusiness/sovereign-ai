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

export interface OnboardingFormData {
  step1: BusinessInfoData;
  step2: CurrentSetupData;
  step3: ServiceSelectionData;
  step4: AccountAccessData;
}

export type OnboardingStep = 1 | 2 | 3 | 4;
