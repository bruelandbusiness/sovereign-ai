"use client";

import { useMemo } from "react";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Clock, Rocket, BarChart3 } from "lucide-react";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { SERVICES, VERTICALS, formatPrice } from "@/lib/constants";
import type { OnboardingFormData } from "@/types/onboarding";

interface OnboardingSummaryProps {
  formData: OnboardingFormData;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function OnboardingSummary({
  formData,
  onConfirm,
  onBack,
  isSubmitting,
}: OnboardingSummaryProps) {
  const selectedServices = useMemo(
    () =>
      SERVICES.filter((s) =>
        formData.step3.selectedServices.includes(s.id)
      ),
    [formData.step3.selectedServices]
  );

  const estimatedTotal = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );

  const verticalLabel =
    VERTICALS.find((v) => v.id === formData.step1.industry)?.label ??
    formData.step1.industry;

  return (
    <div className="flex flex-col gap-6">
      {/* 30-Day Money-Back Guarantee badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          <span className="text-sm font-semibold text-green-300">
            30-Day Money-Back Guarantee
          </span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-display text-xl font-bold">
          Review Your <GradientText>Onboarding Info</GradientText>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please confirm everything looks correct before we start deploying your
          AI systems.
        </p>
      </div>

      {/* Step 1: Business Info */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Business Information
        </h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <SummaryField label="Business" value={formData.step1.businessName} />
          <SummaryField label="Contact" value={formData.step1.ownerName} />
          <SummaryField label="Email" value={formData.step1.email} />
          <SummaryField label="Phone" value={formData.step1.phone} />
          {formData.step1.website && (
            <SummaryField label="Website" value={formData.step1.website} />
          )}
          <SummaryField
            label="Location"
            value={`${formData.step1.city}, ${formData.step1.state}`}
          />
          <SummaryField label="Industry" value={verticalLabel} />
          {formData.step1.serviceAreaRadius && (
            <SummaryField
              label="Service Area"
              value={formData.step1.serviceAreaRadius}
            />
          )}
        </div>
      </div>

      {/* Step 2: Current Setup */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Current Setup
        </h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {formData.step2.averageJobValue && (
            <SummaryField
              label="Avg. Job Value"
              value={formData.step2.averageJobValue}
            />
          )}
          {formData.step2.monthlyMarketingBudget && (
            <SummaryField
              label="Marketing Budget"
              value={formData.step2.monthlyMarketingBudget}
            />
          )}
          {formData.step2.currentMarketingActivities.length > 0 && (
            <SummaryField
              label="Current Marketing"
              value={formData.step2.currentMarketingActivities.join(", ")}
              fullWidth
            />
          )}
          <SummaryField
            label="Google Business Profile"
            value={formData.step2.googleBusinessProfile}
          />
          {formData.step2.primaryGoal && (
            <SummaryField
              label="Primary Goal"
              value={formData.step2.primaryGoal}
              fullWidth
            />
          )}
          {formData.step2.biggestChallenge && (
            <SummaryField
              label="Biggest Challenge"
              value={formData.step2.biggestChallenge}
              fullWidth
            />
          )}
        </div>
      </div>

      {/* Step 3: Selected Services */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Selected Services ({selectedServices.length})
        </h3>
        <div className="flex flex-col gap-2">
          {selectedServices.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{service.name}</span>
                </div>
                <span className="text-sm font-medium">
                  {formatPrice(service.price)}
                  {service.priceSuffix}
                </span>
              </div>
            );
          })}
          {/* Prominent total price section */}
          <div className="mt-2 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-emerald-500/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Estimated Monthly Total</span>
              <span className="text-xl font-bold">
                <GradientText>{formatPrice(estimatedTotal)}</GradientText>
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* What happens after you submit - timeline */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="mb-3 text-center text-sm font-semibold text-foreground">
          What happens after you submit
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground">Team Review</p>
            <p className="text-[10px] text-muted-foreground">1 hour</p>
          </div>
          <div className="h-[1px] flex-shrink-0 w-8 bg-primary/30" />
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground">Setup Begins</p>
            <p className="text-[10px] text-muted-foreground">24 hours</p>
          </div>
          <div className="h-[1px] flex-shrink-0 w-8 bg-primary/30" />
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground">Live &amp; Reporting</p>
            <p className="text-[10px] text-muted-foreground">48 hours</p>
          </div>
        </div>
      </div>

      {/* Step 4: Account Access */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Account Access
        </h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {formData.step4.gbpEmail && (
            <SummaryField label="GBP Email" value={formData.step4.gbpEmail} />
          )}
          {formData.step4.gaEmail && (
            <SummaryField
              label="Analytics Email"
              value={formData.step4.gaEmail}
            />
          )}
          {formData.step4.socialAccounts && (
            <SummaryField
              label="Social Accounts"
              value={formData.step4.socialAccounts}
              fullWidth
            />
          )}
          {formData.step4.additionalNotes && (
            <SummaryField
              label="Additional Notes"
              value={formData.step4.additionalNotes}
              fullWidth
            />
          )}
          {!formData.step4.gbpEmail &&
            !formData.step4.gaEmail &&
            !formData.step4.socialAccounts &&
            !formData.step4.additionalNotes && (
              <p className="text-sm text-muted-foreground">
                No account access details provided.
              </p>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <GradientButton
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </GradientButton>
          <GradientButton
            type="button"
            size="lg"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm &amp; Submit
              </>
            )}
          </GradientButton>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          No contracts. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

function SummaryField({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}
