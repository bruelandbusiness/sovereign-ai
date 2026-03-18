"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, HelpCircle } from "lucide-react";
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
import { step1Schema, type Step1Values } from "@/lib/validations";
import { VERTICALS } from "@/lib/constants";
import type { BusinessInfoData } from "@/types/onboarding";

interface Step1BusinessInfoProps {
  defaultValues?: Partial<BusinessInfoData>;
  onNext: (data: Step1Values) => void;
}

export function Step1BusinessInfo({
  defaultValues,
  onNext,
}: Step1BusinessInfoProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: defaultValues?.businessName ?? "",
      ownerName: defaultValues?.ownerName ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      website: defaultValues?.website ?? "",
      address: defaultValues?.address ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "",
      industry: defaultValues?.industry ?? "",
      serviceAreaRadius: defaultValues?.serviceAreaRadius ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      {/* Welcome header */}
      <div className="text-center">
        <h1 className="font-display text-xl font-bold sm:text-2xl">
          Let&apos;s Get Your AI Marketing Running
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We&apos;ll have your first campaign live within 48 hours
        </p>
      </div>

      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Business Information</h2>
          <p className="text-sm text-muted-foreground">
            Tell us about your business so we can customize your setup.
          </p>
        </div>
      </div>

      {/* Two-column row: Business Name + Owner Name */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="e.g. Smith HVAC"
            {...register("businessName")}
            aria-invalid={!!errors.businessName}
          />
          {errors.businessName && (
            <p className="text-xs text-destructive">
              {errors.businessName.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ownerName">Contact Name *</Label>
          <Input
            id="ownerName"
            placeholder="e.g. John Smith"
            {...register("ownerName")}
            aria-invalid={!!errors.ownerName}
          />
          {errors.ownerName && (
            <p className="text-xs text-destructive">
              {errors.ownerName.message}
            </p>
          )}
        </div>
      </div>

      {/* Two-column row: Email + Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Website - full width */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="website">
          Website <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="website"
          placeholder="https://www.yourbusiness.com"
          {...register("website")}
          aria-invalid={!!errors.website}
        />
        {errors.website && (
          <p className="text-xs text-destructive">{errors.website.message}</p>
        )}
      </div>

      {/* Two-column row: City + State */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="e.g. Phoenix"
            {...register("city")}
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            placeholder="e.g. AZ"
            {...register("state")}
            aria-invalid={!!errors.state}
          />
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state.message}</p>
          )}
        </div>
      </div>

      {/* Two-column row: Industry + Service Area Radius */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Industry *</Label>
          <Controller
            name="industry"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.industry}
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
          {errors.industry && (
            <p className="text-xs text-destructive">
              {errors.industry.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serviceAreaRadius">
            Service Area Radius{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="serviceAreaRadius"
            placeholder="e.g. 30 miles"
            {...register("serviceAreaRadius")}
          />
        </div>
      </div>

      {/* Help text */}
      <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Not sure about something? Skip it — your account manager will help fill in the gaps.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <GradientButton type="submit" size="lg">
          Next
          <ArrowRight className="h-4 w-4" />
        </GradientButton>
      </div>
    </form>
  );
}
