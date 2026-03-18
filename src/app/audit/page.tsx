"use client";

import { useRef, useCallback, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { AuditHero } from "@/components/audit/AuditHero";
import { AuditForm } from "@/components/audit/AuditForm";
import { ScanningAnimation } from "@/components/audit/ScanningAnimation";
import { AuditResults } from "@/components/audit/AuditResults";
import { AuditFeatures } from "@/components/audit/AuditFeatures";
import { useAudit } from "@/hooks/useAudit";
import type { AuditFormValues } from "@/lib/validations";

export default function AuditPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const { state, result, error, submitAudit, reset } = useAudit();
  const [businessName, setBusinessName] = useState("");
  const [scanComplete, setScanComplete] = useState(false);

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSubmit = useCallback(
    (data: AuditFormValues) => {
      setBusinessName(data.business_name);
      setScanComplete(false);
      submitAudit(data);
    },
    [submitAudit]
  );

  const handleScanComplete = useCallback(() => {
    setScanComplete(true);
  }, []);

  const handleReset = useCallback(() => {
    setScanComplete(false);
    reset();
  }, [reset]);

  // Show scanning animation while API call is in progress
  const showScanning = state === "scanning" || (state === "results" && !scanComplete);

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="minimal" />

      <main className="flex-1">
        {/* Idle: Hero + Form */}
        {state === "idle" && (
          <>
            <AuditHero onScrollToForm={scrollToForm} />
            <Section id="audit-form">
              <Container size="lg">
                <div ref={formRef}>
                  <AuditForm onSubmit={handleSubmit} isLoading={false} />
                </div>
              </Container>
            </Section>
            <AuditFeatures />
          </>
        )}

        {/* Scanning */}
        {showScanning && (
          <ScanningAnimation
            businessName={businessName}
            onComplete={handleScanComplete}
          />
        )}

        {/* Results */}
        {state === "results" && scanComplete && result && (
          <>
            <AuditResults result={result} onReset={handleReset} />
            <AuditFeatures />
          </>
        )}

        {/* Error */}
        {state === "error" && (
          <Section>
            <Container size="sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <span className="text-2xl">!</span>
                </div>
                <h2 className="mb-2 font-display text-xl font-bold">
                  Something went wrong
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {error || "We couldn't complete your audit. Please try again."}
                </p>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-lg gradient-bg px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Try Again
                </button>
              </div>
            </Container>
          </Section>
        )}
      </main>

      <Footer />
    </div>
  );
}
