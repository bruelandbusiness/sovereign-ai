"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
            Book a Strategy Call
          </DialogTitle>
          <DialogDescription>
            Tell us about your business and we&apos;ll prepare a custom AI
            marketing plan before our call.
          </DialogDescription>
        </DialogHeader>

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

          <GradientButton
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Book My Free Call"}
          </GradientButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
