"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { GradientButton } from "@/components/shared/GradientButton";
import { bookingFormSchema, type BookingFormValues } from "@/lib/validations";
import { trackBookingSubmission, getUtmParams } from "@/lib/tracking";

const planOptions = [
  { value: "starter", label: "Starter Bundle" },
  { value: "growth", label: "Growth Bundle" },
  { value: "empire", label: "Empire Bundle" },
  { value: "custom", label: "Custom / Not Sure" },
];

const callIncludes = [
  "Custom AI marketing roadmap",
  "Competitor analysis",
  "ROI projection for your business",
];

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ open, onOpenChange }: BookingModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      phone: "",
      interestedIn: "",
      notes: "",
    },
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(data: BookingFormValues) {
    setSubmitError(null);
    try {
      const utm = getUtmParams();
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.businessName,
          email: data.email,
          phone: data.phone || undefined,
          source: "booking-modal",
          trade: data.interestedIn,
          notes: data.notes || undefined,
          ...utm,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit");
      }
      trackBookingSubmission(data.interestedIn);
      setSubmitted(true);
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Book Your Free Growth Strategy Call
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span className="text-sm font-medium text-accent">
              Valued at $2,500 &mdash; Yours Free
            </span>
            <span>
              Tell us about your business and we&apos;ll prepare a custom AI
              marketing plan before our call.
            </span>
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-display text-lg font-bold">You&apos;re All Set!</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;ll be in touch within 24 hours to schedule your strategy call.
              Check your email for confirmation.
            </p>
            <GradientButton size="sm" onClick={() => { setSubmitted(false); onOpenChange(false); }}>
              Close
            </GradientButton>
          </div>
        ) : (
        <>
        {/* What's included */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What&apos;s included
          </p>
          <ul className="space-y-1.5">
            {callIncludes.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="booking-name">Full Name</Label>
            <Input
              id="booking-name"
              autoComplete="name"
              placeholder="John Smith"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "booking-name-error" : undefined}
            />
            {errors.name && (
              <p id="booking-name-error" role="alert" className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Business Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="booking-business">Business Name</Label>
            <Input
              id="booking-business"
              autoComplete="organization"
              placeholder="Smith Plumbing"
              {...register("businessName")}
              aria-invalid={!!errors.businessName}
              aria-describedby={errors.businessName ? "booking-business-error" : undefined}
            />
            {errors.businessName && (
              <p id="booking-business-error" role="alert" className="text-xs text-destructive">
                {errors.businessName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <Label htmlFor="booking-email">Email</Label>
            <Input
              id="booking-email"
              autoComplete="email"
              type="email"
              placeholder="john@smithplumbing.com"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "booking-email-error" : undefined}
            />
            {errors.email && (
              <p id="booking-email-error" role="alert" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="grid gap-1.5">
            <Label htmlFor="booking-phone">Phone (optional)</Label>
            <Input
              id="booking-phone"
              autoComplete="tel"
              type="tel"
              placeholder="(555) 123-4567"
              {...register("phone")}
            />
          </div>

          {/* Interested In */}
          <div className="grid gap-1.5">
            <Label>Interested In</Label>
            <Controller
              name="interestedIn"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.interestedIn} aria-describedby={errors.interestedIn ? "booking-plan-error" : undefined}>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.interestedIn && (
              <p id="booking-plan-error" role="alert" className="text-xs text-destructive">
                {errors.interestedIn.message}
              </p>
            )}
          </div>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Your information is 100% confidential
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
                Book My Free Strategy Call
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </GradientButton>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
