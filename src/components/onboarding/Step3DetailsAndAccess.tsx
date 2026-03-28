"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Lightbulb,
  ShieldCheck,
  SkipForward,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/shared/GradientButton";
import { step3DetailsSchema, type Step3DetailsValues } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { DetailsAndAccessData } from "@/types/onboarding";

const MARKETING_ACTIVITIES = [
  "Google Ads",
  "Facebook Ads",
  "SEO",
  "Email Marketing",
  "Social Media",
  "Door Knocking",
  "Referrals",
  "Other",
];

const GBP_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "none", label: "None" },
  { value: "unsure", label: "Unsure" },
] as const;

interface Step3DetailsAndAccessProps {
  defaultValues?: Partial<DetailsAndAccessData>;
  /** Email from step 1 to pre-fill GBP email */
  prefillEmail?: string;
  onNext: (data: Step3DetailsValues) => void;
  onBack: () => void;
  onSkip: () => void;
}

/** Inline tooltip component for field explanations */
function FieldTip({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1 text-xs text-muted-foreground/70">
      <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function Step3DetailsAndAccess({
  defaultValues,
  prefillEmail,
  onNext,
  onBack,
  onSkip,
}: Step3DetailsAndAccessProps) {
  const {
    register,
    handleSubmit,
    control,
  } = useForm<Step3DetailsValues>({
    resolver: zodResolver(step3DetailsSchema),
    defaultValues: {
      averageJobValue: defaultValues?.averageJobValue ?? "",
      monthlyMarketingBudget: defaultValues?.monthlyMarketingBudget ?? "",
      currentMarketingActivities:
        defaultValues?.currentMarketingActivities ?? [],
      topCompetitors: defaultValues?.topCompetitors ?? "",
      googleBusinessProfile: defaultValues?.googleBusinessProfile ?? "unsure",
      primaryGoal: defaultValues?.primaryGoal ?? "",
      biggestChallenge: defaultValues?.biggestChallenge ?? "",
      gbpEmail: defaultValues?.gbpEmail || prefillEmail || "",
      gaEmail: defaultValues?.gaEmail ?? "",
      socialAccounts: defaultValues?.socialAccounts ?? "",
      additionalNotes: defaultValues?.additionalNotes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      {/* Contextual tip */}
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">
            Everything on this page is optional. Fill in what you can now -- your
            account manager will help with the rest.
          </p>
        </div>
      </div>

      {/* Section: Current Setup */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Details & Access</h2>
          <p className="text-sm text-muted-foreground">
            Help us understand your business and connect your marketing tools.
          </p>
        </div>
      </div>

      {/* Two-column row: Avg Job Value + Monthly Marketing Budget */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="averageJobValue">Average Job Value</Label>
          <Input
            id="averageJobValue"
            placeholder="e.g. $5,000"
            inputMode="decimal"
            {...register("averageJobValue")}
          />
          <FieldTip>Helps us estimate your ROI from AI-generated leads.</FieldTip>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monthlyMarketingBudget">
            Monthly Marketing Budget
          </Label>
          <Input
            id="monthlyMarketingBudget"
            placeholder="e.g. $2,000"
            inputMode="decimal"
            {...register("monthlyMarketingBudget")}
          />
          <FieldTip>
            Most home service businesses spend $500-$2,000/mo on marketing.
          </FieldTip>
        </div>
      </div>

      {/* Current Marketing Activities - checkboxes */}
      <div className="flex flex-col gap-2">
        <Label>Current Marketing Activities</Label>
        <p className="text-xs text-muted-foreground">
          Select all that apply so we avoid duplicating effort.
        </p>
        <Controller
          name="currentMarketingActivities"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MARKETING_ACTIVITIES.map((activity) => {
                const isChecked = field.value?.includes(activity) ?? false;
                return (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => {
                      const updated = isChecked
                        ? field.value.filter((a: string) => a !== activity)
                        : [...(field.value || []), activity];
                      field.onChange(updated);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                      isChecked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {activity}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Google Business Profile - radio */}
      <div className="flex flex-col gap-2">
        <Label>Google Business Profile Status</Label>
        <FieldTip>We use this to optimize your local search presence.</FieldTip>
        <Controller
          name="googleBusinessProfile"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {GBP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                    field.value === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Primary Goal + Biggest Challenge side by side on desktop */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="primaryGoal">Primary Goal</Label>
          <Textarea
            id="primaryGoal"
            placeholder="e.g. Generate 50+ leads per month"
            rows={3}
            {...register("primaryGoal")}
          />
          <FieldTip>We prioritize services that align with your #1 goal.</FieldTip>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="biggestChallenge">Biggest Challenge</Label>
          <Textarea
            id="biggestChallenge"
            placeholder="e.g. Not enough leads, poor ad ROI"
            rows={3}
            {...register("biggestChallenge")}
          />
          <FieldTip>Knowing your pain points helps us fix them faster.</FieldTip>
        </div>
      </div>

      {/* Divider between sections */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Account Access
        </span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      {/* GBP + GA Email side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gbpEmail">Google Business Profile Email</Label>
          <Input
            id="gbpEmail"
            type="email"
            placeholder="your-gbp@gmail.com"
            {...register("gbpEmail")}
          />
          <FieldTip>
            So we can manage your GBP listing and respond to reviews.
          </FieldTip>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gaEmail">Google Analytics Email</Label>
          <Input
            id="gaEmail"
            type="email"
            placeholder="your-analytics@gmail.com"
            {...register("gaEmail")}
          />
          <FieldTip>
            We connect Analytics to track lead sources and campaign ROI.
          </FieldTip>
        </div>
      </div>

      {/* Social Accounts + Additional Notes side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="socialAccounts">Social Media Accounts</Label>
          <Textarea
            id="socialAccounts"
            placeholder="Facebook: facebook.com/you&#10;Instagram: @you"
            rows={3}
            {...register("socialAccounts")}
          />
          <FieldTip>
            List URLs or handles so we can cross-post your AI content.
          </FieldTip>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="additionalNotes">Additional Notes</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Anything else we should know..."
            rows={3}
            {...register("additionalNotes")}
          />
        </div>
      </div>

      {/* Privacy reassurance */}
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15">
            <ShieldCheck className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-300">
              Your data is secure
            </p>
            <p className="mt-0.5 text-xs text-green-400/80">
              256-bit encryption. Never shared or sold. You can update
              everything later from your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <GradientButton
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </GradientButton>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip for now
          </button>
          <GradientButton type="submit" size="lg">
            Review & Submit
            <ArrowRight className="h-4 w-4" />
          </GradientButton>
        </div>
      </div>
    </form>
  );
}
