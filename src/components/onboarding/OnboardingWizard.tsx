"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnboarding } from "@/hooks/useOnboarding";
import { StepIndicator } from "./StepIndicator";
import { Step1BusinessInfo } from "./Step1BusinessInfo";
import { Step2ServiceSelection } from "./Step2ServiceSelection";
import { Step3DetailsAndAccess } from "./Step3DetailsAndAccess";
import { OnboardingSummary } from "./OnboardingSummary";
import { OnboardingSuccess } from "./OnboardingSuccess";

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

export function OnboardingWizard() {
  const {
    step,
    phase,
    formData,
    isSubmitting,
    error,
    nextStep,
    prevStep,
    skipStep,
    backFromSummary,
    submit,
    toApiShape,
  } = useOnboarding();

  // Track direction for slide animation: positive = forward, negative = back
  const [direction, setDirection] = useState(1);

  // Scroll to top on step/phase change so mobile users start at the top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, phase]);

  const handleNext = useCallback(
    (data: Record<string, unknown>) => {
      setDirection(1);
      nextStep(data);
    },
    [nextStep],
  );

  const handleSkip = useCallback(() => {
    setDirection(1);
    skipStep();
  }, [skipStep]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    prevStep();
  }, [prevStep]);

  const handleBackFromSummary = useCallback(() => {
    setDirection(-1);
    backFromSummary();
  }, [backFromSummary]);

  if (phase === "complete") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <OnboardingSuccess formData={toApiShape()} />
      </motion.div>
    );
  }

  if (phase === "summary") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <OnboardingSummary
          formData={toApiShape()}
          onConfirm={submit}
          onBack={handleBackFromSummary}
          isSubmitting={isSubmitting}
          error={error}
        />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {step === 1 && (
            <Step1BusinessInfo
              defaultValues={formData.step1}
              onNext={(data) => handleNext(data)}
            />
          )}
          {step === 2 && (
            <Step2ServiceSelection
              defaultValues={formData.step2}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <Step3DetailsAndAccess
              defaultValues={formData.step3}
              prefillEmail={formData.step1.email}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
