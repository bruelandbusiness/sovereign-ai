"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, KeyRound, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/shared/GradientButton";
import { step4Schema, type Step4Values } from "@/lib/validations";
import type { AccountAccessData } from "@/types/onboarding";

interface Step4AccountAccessProps {
  defaultValues?: Partial<AccountAccessData>;
  onNext: (data: Step4Values) => void;
  onBack: () => void;
}

export function Step4AccountAccess({
  defaultValues,
  onNext,
  onBack,
}: Step4AccountAccessProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      gbpEmail: defaultValues?.gbpEmail ?? "",
      gaEmail: defaultValues?.gaEmail ?? "",
      socialAccounts: defaultValues?.socialAccounts ?? "",
      additionalNotes: defaultValues?.additionalNotes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Account Access</h2>
          <p className="text-sm text-muted-foreground">
            Provide access details so we can connect your marketing tools.
          </p>
        </div>
      </div>

      {/* Google Business Profile Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gbpEmail">Google Business Profile Email</Label>
        <Input
          id="gbpEmail"
          type="email"
          placeholder="your-gbp@gmail.com"
          {...register("gbpEmail")}
          aria-invalid={!!errors.gbpEmail}
        />
        {errors.gbpEmail && (
          <p className="text-xs text-destructive">{errors.gbpEmail.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The email associated with your Google Business Profile (if you have one).
        </p>
      </div>

      {/* Google Analytics Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gaEmail">Google Analytics Email</Label>
        <Input
          id="gaEmail"
          type="email"
          placeholder="your-analytics@gmail.com"
          {...register("gaEmail")}
          aria-invalid={!!errors.gaEmail}
        />
        {errors.gaEmail && (
          <p className="text-xs text-destructive">{errors.gaEmail.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The email used for Google Analytics access (if applicable).
        </p>
      </div>

      {/* Social Accounts */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="socialAccounts">Social Media Accounts</Label>
        <Textarea
          id="socialAccounts"
          placeholder="Facebook: facebook.com/yourbusiness&#10;Instagram: @yourbusiness&#10;LinkedIn: linkedin.com/company/yourbusiness"
          rows={4}
          {...register("socialAccounts")}
        />
        <p className="text-xs text-muted-foreground">
          List your social media profile URLs or handles, one per line.
        </p>
      </div>

      {/* Additional Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="additionalNotes">Additional Notes</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Anything else we should know about your business or current marketing setup..."
          rows={4}
          {...register("additionalNotes")}
        />
      </div>

      {/* Privacy reassurance */}
      <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Your data is secure
          </p>
          <p className="text-xs text-green-600/80 dark:text-green-400/80">
            All information is encrypted and used exclusively to configure your
            AI marketing systems. We never share or sell your access credentials.
          </p>
        </div>
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
          Submit Onboarding
          <ArrowRight className="h-4 w-4" />
        </GradientButton>
      </div>
    </form>
  );
}
