"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ClipboardList, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/shared/GradientButton";
import { step2Schema, type Step2Values } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { CurrentSetupData } from "@/types/onboarding";

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

interface Step2CurrentSetupProps {
  defaultValues?: Partial<CurrentSetupData>;
  onNext: (data: Step2Values) => void;
  onBack: () => void;
}

export function Step2CurrentSetup({
  defaultValues,
  onNext,
  onBack,
}: Step2CurrentSetupProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      averageJobValue: defaultValues?.averageJobValue ?? "",
      monthlyMarketingBudget: defaultValues?.monthlyMarketingBudget ?? "",
      currentMarketingActivities:
        defaultValues?.currentMarketingActivities ?? [],
      topCompetitors: defaultValues?.topCompetitors ?? "",
      googleBusinessProfile: defaultValues?.googleBusinessProfile ?? "unsure",
      primaryGoal: defaultValues?.primaryGoal ?? "",
      biggestChallenge: defaultValues?.biggestChallenge ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      {/* Contextual tip */}
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          This helps us identify quick wins for your business — the more detail, the faster your results.
        </p>
      </div>

      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Current Setup</h2>
          <p className="text-sm text-muted-foreground">
            Help us understand where you are today so we can maximize your results.
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
            {...register("averageJobValue")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monthlyMarketingBudget">
            Monthly Marketing Budget
          </Label>
          <Input
            id="monthlyMarketingBudget"
            placeholder="e.g. $2,000"
            {...register("monthlyMarketingBudget")}
          />
          <p className="text-xs text-muted-foreground/70">
            Most home service businesses spend $500-$2,000/mo on marketing
          </p>
        </div>
      </div>

      {/* Current Marketing Activities - checkboxes */}
      <div className="flex flex-col gap-2">
        <Label>Current Marketing Activities</Label>
        <p className="text-xs text-muted-foreground">
          Select all that apply.
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

      {/* Top Competitors */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="topCompetitors">Top Competitors</Label>
        <Input
          id="topCompetitors"
          placeholder="e.g. ABC Plumbing, XYZ HVAC"
          {...register("topCompetitors")}
        />
        <p className="text-xs text-muted-foreground">
          List your main local competitors, separated by commas.
        </p>
      </div>

      {/* Google Business Profile - radio */}
      <div className="flex flex-col gap-2">
        <Label>Google Business Profile Status</Label>
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

      {/* Primary Goal */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="primaryGoal">Primary Goal</Label>
        <Textarea
          id="primaryGoal"
          placeholder="e.g. Generate 50+ leads per month, rank #1 on Google for HVAC services..."
          {...register("primaryGoal")}
        />
      </div>

      {/* Biggest Challenge */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="biggestChallenge">Biggest Challenge</Label>
        <Textarea
          id="biggestChallenge"
          placeholder="e.g. Not enough leads, spending too much on ads with poor ROI..."
          {...register("biggestChallenge")}
        />
      </div>

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
        <GradientButton type="submit" size="lg">
          Next
          <ArrowRight className="h-4 w-4" />
        </GradientButton>
      </div>
    </form>
  );
}
