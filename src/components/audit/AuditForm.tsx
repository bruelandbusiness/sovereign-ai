"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Zap, Shield } from "lucide-react";
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
          <CardTitle className="font-display text-2xl font-bold">
            Enter Your Business Info Below
          </CardTitle>
          <CardDescription className="text-base">
            We&apos;ll analyze your entire online presence in seconds
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
              <p className="text-xs text-muted-foreground">As it appears on Google</p>
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
              <p className="text-xs text-muted-foreground">We&apos;ll analyze local competitors in your area</p>
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
              <p className="text-xs text-muted-foreground">For industry-specific benchmarks</p>
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
              <p className="text-xs text-muted-foreground">We&apos;ll send your detailed report here</p>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <GradientButton
              type="submit"
              size="lg"
              disabled={isLoading}
              className="btn-shine mt-2 w-full text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Scan My Marketing Now
                </>
              )}
            </GradientButton>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="text-emerald-400">&#10003; Free forever</span>
              <span className="text-emerald-400">&#10003; No credit card</span>
              <span className="text-emerald-400">&#10003; Results in 30 seconds</span>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-2.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Your data is encrypted and never shared with third parties.
            </div>
          </form>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
