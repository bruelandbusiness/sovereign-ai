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
import { trackFormSubmission } from "@/lib/analytics";

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
      <Card className="mx-auto w-full max-w-lg border-border/50 glass-card">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl font-bold">
            Enter Your Business Info Below
          </CardTitle>
          <CardDescription className="text-base">
            We&apos;ll analyze your entire online presence in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => { trackFormSubmission("free_audit"); onSubmit(data); })} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                placeholder="e.g. Smith HVAC"
                {...register("business_name")}
                aria-invalid={!!errors.business_name}
                aria-describedby={`business-name-hint${errors.business_name ? " business-name-error" : ""}`}
              />
              <p id="business-name-hint" className="text-xs text-muted-foreground">As it appears on Google</p>
              {errors.business_name && (
                <p id="business-name-error" role="alert" className="text-xs text-destructive">{errors.business_name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g. Phoenix"
                {...register("city")}
                aria-invalid={!!errors.city}
                aria-describedby={`city-hint${errors.city ? " city-error" : ""}`}
              />
              <p id="city-hint" className="text-xs text-muted-foreground">We&apos;ll analyze local competitors in your area</p>
              {errors.city && (
                <p id="city-error" role="alert" className="text-xs text-destructive">{errors.city.message}</p>
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
                      aria-describedby={`vertical-hint${errors.vertical ? " vertical-error" : ""}`}
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
              <p id="vertical-hint" className="text-xs text-muted-foreground">For industry-specific benchmarks</p>
              {errors.vertical && (
                <p id="vertical-error" role="alert" className="text-xs text-destructive">{errors.vertical.message}</p>
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
                aria-describedby={`email-hint${errors.email ? " email-error" : ""}`}
              />
              <p id="email-hint" className="text-xs text-muted-foreground">We&apos;ll send your detailed report here</p>
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                {...register("phone")}
              />
              <p className="text-xs text-muted-foreground">For a faster follow-up call</p>
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
                  <Zap className="h-4 w-4" aria-hidden="true" />
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
              <Shield className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Your data is encrypted and never shared with third parties.
            </div>
          </form>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
