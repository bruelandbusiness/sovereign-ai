"use client";

import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

function OnboardingContent() {
  return (
    <Container>
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8">
          <OnboardingWizard />
        </div>
      </div>
    </Container>
  );
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="minimal" />

      <main className="flex-1 py-8 sm:py-12 lg:py-16">
        <Suspense
          fallback={
            <Container>
              <div className="mx-auto max-w-3xl">
                <div className="flex h-96 items-center justify-center rounded-xl border border-border/50 bg-card">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">
                      Loading onboarding...
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          }
        >
          <OnboardingContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
