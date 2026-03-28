"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check, Loader2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GradientButton } from "@/components/shared/GradientButton";
import { VERTICALS } from "@/lib/constants";
import { trackStrategyCallBooked, getUtmParams } from "@/lib/tracking";
import { trackFormSubmission, trackFormCompletion } from "@/lib/analytics";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  vertical: z.string().min(1, "Select your industry"),
});

type FormValues = z.infer<typeof schema>;

export function StrategyCallForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      phone: "",
      vertical: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    trackFormSubmission("strategy_call");
    try {
      const utm = getUtmParams();
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.businessName,
          email: data.email,
          phone: data.phone || undefined,
          source: "strategy-call",
          trade: data.vertical,
          metadata: { contactName: data.name },
          ...utm,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit");
      }
      trackStrategyCallBooked(data.vertical);
      trackFormCompletion("strategy_call");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Check className="h-7 w-7 text-accent" aria-hidden="true" />
        </div>
        <h3 className="font-display text-lg font-bold">Request Received!</h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ll reach out within 24 hours to schedule your free strategy
          call. Check your email for confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="sc-name">Your Name</Label>
        <Input
          id="sc-name"
          placeholder="John Smith"
          required
          autoComplete="name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "sc-name-error" : undefined}
        />
        {errors.name && (
          <p id="sc-name-error" className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sc-business">Business Name</Label>
        <Input
          id="sc-business"
          placeholder="Smith HVAC"
          required
          autoComplete="organization"
          {...register("businessName")}
          aria-invalid={!!errors.businessName}
          aria-describedby={errors.businessName ? "sc-business-error" : undefined}
        />
        {errors.businessName && (
          <p id="sc-business-error" className="text-xs text-destructive">
            {errors.businessName.message}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sc-email">Email</Label>
        <Input
          id="sc-email"
          type="email"
          placeholder="john@smithhvac.com"
          required
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "sc-email-error" : undefined}
        />
        {errors.email && (
          <p id="sc-email-error" className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sc-phone">
          Phone <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="sc-phone"
          type="tel"
          placeholder="(555) 123-4567"
          {...register("phone")}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Industry</Label>
        <Controller
          name="vertical"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                className="w-full"
                aria-invalid={!!errors.vertical}
                aria-describedby={errors.vertical ? "sc-vertical-error" : undefined}
              >
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {VERTICALS.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.vertical && (
          <p id="sc-vertical-error" className="text-xs text-destructive">{errors.vertical.message}</p>
        )}
      </div>

      {submitError && (
        <p role="alert" className="text-center text-xs text-destructive">{submitError}</p>
      )}

      <GradientButton
        type="submit"
        size="lg"
        className="btn-shine mt-1 w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reserving your spot...
          </>
        ) : (
          <>
            Claim My Free Strategy Call
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </GradientButton>

      <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          100% free &middot; No obligation &middot; No credit card
        </div>
        <span>Available Mon&ndash;Fri, 8am&ndash;6pm AZ time</span>
      </div>
    </form>
  );
}
