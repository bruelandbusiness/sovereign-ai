"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Rocket, Clock, Zap, Mail, UserCheck } from "lucide-react";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { SERVICES, formatPrice } from "@/lib/constants";
import type { OnboardingFormData } from "@/types/onboarding";

/* CSS confetti keyframes — injected via a <style> tag to avoid creating new files */
const confettiStyles = `
@keyframes confetti-fall-1 {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) translateX(80px) rotate(720deg); opacity: 0; }
}
@keyframes confetti-fall-2 {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) translateX(-60px) rotate(-540deg); opacity: 0; }
}
@keyframes confetti-fall-3 {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) translateX(40px) rotate(360deg); opacity: 0; }
}
@keyframes success-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }
  50% { box-shadow: 0 0 50px rgba(34, 197, 94, 0.4), 0 0 80px rgba(76, 133, 255, 0.15); }
}
.confetti-piece {
  position: fixed;
  top: -10px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  pointer-events: none;
  z-index: 50;
}
.confetti-1 { left: 10%; background: #4c85ff; animation: confetti-fall-1 3s ease-out forwards; animation-delay: 0.1s; }
.confetti-2 { left: 20%; background: #22d3a1; animation: confetti-fall-2 2.8s ease-out forwards; animation-delay: 0.3s; }
.confetti-3 { left: 30%; background: #f59e0b; animation: confetti-fall-3 3.2s ease-out forwards; animation-delay: 0.0s; }
.confetti-4 { left: 40%; background: #ec4899; animation: confetti-fall-1 2.6s ease-out forwards; animation-delay: 0.5s; }
.confetti-5 { left: 50%; background: #8b5cf6; animation: confetti-fall-2 3.4s ease-out forwards; animation-delay: 0.2s; }
.confetti-6 { left: 60%; background: #4c85ff; animation: confetti-fall-3 2.9s ease-out forwards; animation-delay: 0.4s; }
.confetti-7 { left: 70%; background: #22d3a1; animation: confetti-fall-1 3.1s ease-out forwards; animation-delay: 0.6s; }
.confetti-8 { left: 80%; background: #f59e0b; animation: confetti-fall-2 2.7s ease-out forwards; animation-delay: 0.15s; }
.confetti-9 { left: 90%; background: #ec4899; animation: confetti-fall-3 3.3s ease-out forwards; animation-delay: 0.35s; }
.confetti-10 { left: 15%; background: #8b5cf6; animation: confetti-fall-1 2.5s ease-out forwards; animation-delay: 0.55s; }
.confetti-11 { left: 45%; background: #4c85ff; animation: confetti-fall-2 3.0s ease-out forwards; animation-delay: 0.25s; width: 6px; height: 12px; }
.confetti-12 { left: 75%; background: #22d3a1; animation: confetti-fall-3 2.8s ease-out forwards; animation-delay: 0.45s; width: 10px; height: 6px; }
.success-glow-ring { animation: success-glow 2s ease-in-out infinite; }
`;

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
      {/* Confetti animation */}
      <style dangerouslySetInnerHTML={{ __html: confettiStyles }} />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={`confetti-piece confetti-${i + 1}`} />
      ))}

      {/* Animated check — more dramatic with scale and glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="success-glow-ring flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 15 }}
            >
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </motion.div>
          </motion.div>
          {/* Decorative rings */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ delay: 0.5, duration: 1.0 }}
            className="absolute inset-0 rounded-full border-2 border-green-500/30"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ delay: 0.7, duration: 1.2 }}
            className="absolute inset-0 rounded-full border border-primary/20"
          />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          We&apos;ve Received Your{" "}
          <GradientText>Onboarding Info</GradientText>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Thank you, {formData.step1.ownerName}! Everything looks great. Our
          team is preparing your AI marketing systems now.
        </p>
      </motion.div>

      {/* Account manager timeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2"
      >
        <UserCheck className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground sm:text-sm">
          Your dedicated account manager will reach out within 1 hour
        </span>
      </motion.div>

      {/* Email preview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.5 }}
        className="mt-4 w-full max-w-md"
      >
        <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Check your inbox — we just sent your welcome kit to{" "}
            <span className="font-medium text-foreground">{formData.step1.email}</span>
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
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
        transition={{ delay: 1.0, duration: 0.5 }}
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
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-8"
      >
        <Link href="/dashboard">
          <GradientButton size="lg">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </GradientButton>
        </Link>
      </motion.div>
    </div>
  );
}
