import { z } from "zod";

export const auditFormSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  vertical: z.string().min(1, "Select an industry"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
});

export type AuditFormValues = z.infer<typeof auditFormSchema>;

export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  interestedIn: z.string().min(1, "Select an option"),
  notes: z.string().optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const step1Schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  industry: z.string().min(1, "Select an industry"),
  serviceAreaRadius: z.string().optional(),
});

export type Step1Values = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  averageJobValue: z.string().optional(),
  monthlyMarketingBudget: z.string().optional(),
  currentMarketingActivities: z.array(z.string()),
  topCompetitors: z.string().optional(),
  googleBusinessProfile: z.enum(["active", "inactive", "none", "unsure"]),
  primaryGoal: z.string().optional(),
  biggestChallenge: z.string().optional(),
});

export type Step2Values = z.infer<typeof step2Schema>;

export const step3Schema = z.object({
  selectedServices: z.array(z.string()).min(1, "Select at least one service"),
});

export type Step3Values = z.infer<typeof step3Schema>;

export const step4Schema = z.object({
  gbpEmail: z.string().email().optional().or(z.literal("")),
  gaEmail: z.string().email().optional().or(z.literal("")),
  socialAccounts: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type Step4Values = z.infer<typeof step4Schema>;
