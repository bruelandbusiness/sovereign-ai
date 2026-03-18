"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Rocket, Clock, Zap } from "lucide-react";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { SERVICES, formatPrice } from "@/lib/constants";
import type { OnboardingFormData } from "@/types/onboarding";

interface OnboardingSuccessProps {
  formData: OnboardingFormData;
}

export function OnboardingSuccess({ formData }: OnboardingSuccessProps) {
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

  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated check */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            >
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </motion.div>
          </motion.div>
          {/* Decorative ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute inset-0 rounded-full border-2 border-green-500/30"
          />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h2 className="font-display text-2xl font-bold">
          We&apos;ve Received Your{" "}
          <GradientText>Onboarding Info</GradientText>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Thank you, {formData.step1.ownerName}! Everything looks great. Our
          team is preparing your AI marketing systems now.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-8 grid w-full max-w-sm gap-4 sm:grid-cols-2"
      >
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Zap className="h-4 w-4" />
            <span className="text-2xl font-bold">
              {selectedServices.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            AI Services Selected
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <span className="text-2xl font-bold">
              {formatPrice(estimatedTotal)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimated Monthly
          </p>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-8 w-full max-w-md"
      >
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center justify-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              What happens next
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </div>
              <p className="text-sm text-muted-foreground">
                Our team reviews your onboarding details and begins configuration.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </div>
              <div className="flex items-start gap-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Within 48 hours
                  </span>{" "}
                  — your AI systems will be deployed and active.
                </p>
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </div>
              <p className="text-sm text-muted-foreground">
                You&apos;ll receive a welcome email with dashboard access and
                a kickoff call link.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="mt-8"
      >
        <Link href="/">
          <GradientButton size="lg">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </GradientButton>
        </Link>
      </motion.div>
    </div>
  );
}
