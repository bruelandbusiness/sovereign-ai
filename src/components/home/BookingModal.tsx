"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Check } from "lucide-react";
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

  async function onSubmit(data: BookingFormValues) {
    // Future: send to API
    console.log("Booking form submitted:", data);
    reset();
    onOpenChange(false);
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

        {/* What's included */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What&apos;s included
          </p>
          <ul className="space-y-1.5">
            {callIncludes.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
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
              placeholder="John Smith"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Business Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="booking-business">Business Name</Label>
            <Input
              id="booking-business"
              placeholder="Smith Plumbing"
              {...register("businessName")}
              aria-invalid={!!errors.businessName}
            />
            {errors.businessName && (
              <p className="text-xs text-destructive">
                {errors.businessName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <Label htmlFor="booking-email">Email</Label>
            <Input
              id="booking-email"
              type="email"
              placeholder="john@smithplumbing.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="grid gap-1.5">
            <Label htmlFor="booking-phone">Phone (optional)</Label>
            <Input
              id="booking-phone"
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
                  <SelectTrigger className="w-full" aria-invalid={!!errors.interestedIn}>
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
              <p className="text-xs text-destructive">
                {errors.interestedIn.message}
              </p>
            )}
          </div>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Your information is 100% confidential
          </div>

          <GradientButton
            type="submit"
            size="lg"
            className="btn-shine mt-1 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                Book My Free Strategy Call
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </GradientButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
