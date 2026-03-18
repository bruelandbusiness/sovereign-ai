"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { auditFormSchema, type AuditFormValues } from "@/lib/validations";
import { VERTICALS } from "@/lib/constants";
import { FadeInView } from "@/components/shared/FadeInView";

interface AuditFormProps {
  onSubmit: (data: AuditFormValues) => void;
  isLoading: boolean;
}

export function AuditForm({ onSubmit, isLoading }: AuditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      business_name: "",
      city: "",
      vertical: "",
      email: "",
    },
  });

  return (
    <FadeInView>
      <Card className="mx-auto w-full max-w-lg border-border/50 bg-card">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl font-bold">
            Get Your Marketing Score
          </CardTitle>
          <CardDescription>
            Takes 30 seconds. No credit card required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                placeholder="e.g. Smith HVAC"
                {...register("business_name")}
                aria-invalid={!!errors.business_name}
              />
              {errors.business_name && (
                <p className="text-xs text-destructive">{errors.business_name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
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
              <Label>Industry</Label>
              <Controller
                name="vertical"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.vertical}
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
                <p className="text-xs text-destructive">{errors.vertical.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
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

            <GradientButton
              type="submit"
              size="lg"
              disabled={isLoading}
              className="mt-2 w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Get My Free Marketing Score
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </GradientButton>

            <p className="text-center text-xs text-muted-foreground">
              Your data is 100% private. We never share or sell your information.
            </p>
          </form>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
