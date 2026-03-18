"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useOnboarding } from "@/hooks/useOnboarding";
import { StepIndicator } from "./StepIndicator";
import { Step1BusinessInfo } from "./Step1BusinessInfo";
import { Step2CurrentSetup } from "./Step2CurrentSetup";
import { Step3ServiceSelection } from "./Step3ServiceSelection";
import { Step4AccountAccess } from "./Step4AccountAccess";
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
    nextStep,
    prevStep,
    backFromSummary,
    submit,
  } = useOnboarding();

  // Track direction for slide animation
  const direction = 1; // simplified — always slide forward visually

  if (phase === "complete") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <OnboardingSuccess formData={formData} />
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
          formData={formData}
          onConfirm={submit}
          onBack={backFromSummary}
          isSubmitting={isSubmitting}
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
              onNext={(data) => nextStep(data)}
            />
          )}
          {step === 2 && (
            <Step2CurrentSetup
              defaultValues={formData.step2}
              onNext={(data) => nextStep(data)}
              onBack={prevStep}
            />
          )}
          {step === 3 && (
            <Step3ServiceSelection
              defaultValues={formData.step3}
              onNext={(data) => nextStep(data)}
              onBack={prevStep}
            />
          )}
          {step === 4 && (
            <Step4AccountAccess
              defaultValues={formData.step4}
              onNext={(data) => nextStep(data)}
              onBack={prevStep}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
