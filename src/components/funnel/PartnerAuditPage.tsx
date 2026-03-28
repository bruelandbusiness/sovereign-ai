"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { AuditForm } from "@/components/audit/AuditForm";
import { ScanningAnimation } from "@/components/audit/ScanningAnimation";
import { AuditResults } from "@/components/audit/AuditResults";
import { useAudit } from "@/hooks/useAudit";
import { trackEvent } from "@/lib/tracking";
import { Gift, Shield, Star } from "lucide-react";
import type { AuditFormValues } from "@/lib/validations";

interface PartnerAuditPageProps {
  slug: string;
}

interface PartnerData {
  name: string;
  company: string | null;
  slug: string;
}

export function PartnerAuditPage({ slug }: PartnerAuditPageProps) {
  const { state, result, error, submitAudit, reset } = useAudit();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [, setPartnerLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    fetch(`/api/partners/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.partner) setPartner(data.partner);
      })
      .catch(() => {})
      .finally(() => setPartnerLoading(false));
  }, [slug]);

  const handleSubmit = useCallback(
    (data: AuditFormValues) => {
      setBusinessName(data.business_name);
      setScanComplete(false);

      trackEvent("partner_audit_start", { partner: slug, trade: data.vertical });

      // Capture as a prospect lead
      fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.business_name,
          email: data.email,
          source: "partner",
          trade: data.vertical,
          partnerSlug: slug,
        }),
      }).catch(() => {});

      submitAudit(data);
    },
    [slug, submitAudit]
  );

  const handleScanComplete = useCallback(() => {
    setScanComplete(true);
  }, []);

  const handleReset = useCallback(() => {
    setScanComplete(false);
    reset();
  }, [reset]);

  const partnerName = partner?.company || partner?.name || formatSlug(slug);
  const showScanning = state === "scanning" || (state === "results" && !scanComplete);

  if (state === "results" && scanComplete && result) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0f] pb-20 pt-32">
          <PartnerBanner partnerName={partnerName} />
          <AuditResults result={result} onReset={handleReset} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0f] pb-20 pt-32">
        <PartnerBanner partnerName={partnerName} />
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Hero */}
            {state === "idle" && (
              <>
                <div className="mb-10 text-center">
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                    Free AI Marketing Audit
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                    Exclusive offer through{" "}
                    <span className="font-medium text-white">{partnerName}</span>.
                    See how your online presence stacks up against local competitors
                    — in 30 seconds.
                  </p>
                </div>

                {/* Trust Signals */}
                <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-4 w-4 text-emerald-400" />
                    20% partner discount included
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                    4.9/5 from 500+ businesses
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-blue-400" />
                    100% free, no obligation
                  </span>
                </div>

                <AuditForm onSubmit={handleSubmit} isLoading={false} />

                {/* How It Works */}
                <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {[
                    {
                      step: "1",
                      title: "Enter Your Info",
                      desc: "Business name, city, and industry. Takes 15 seconds.",
                    },
                    {
                      step: "2",
                      title: "AI Scans Everything",
                      desc: "We analyze your Google profile, website, reviews, SEO, and competitors.",
                    },
                    {
                      step: "3",
                      title: "Get Your Score + Plan",
                      desc: "See exactly where you're losing leads and how to fix it.",
                    },
                  ].map((s) => (
                    <div key={s.step} className="text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] text-sm font-bold text-white">
                        {s.step}
                      </div>
                      <h4 className="font-semibold text-white">{s.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Scanning */}
            {showScanning && (
              <ScanningAnimation
                businessName={businessName}
                onComplete={handleScanComplete}
              />
            )}

            {/* Error */}
            {state === "error" && (
              <div className="text-center">
                <div className="mx-auto mt-4 max-w-lg rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
                  {error || "Something went wrong. Please try again."}
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function PartnerBanner({ partnerName }: { partnerName: string }) {
  return (
    <div className="bg-gradient-to-r from-[#4c85ff]/10 to-[#22d3a1]/10 border-b border-white/5 py-2 text-center text-sm text-foreground/80">
      Exclusive offer through{" "}
      <span className="font-medium text-white">{partnerName}</span> — includes
      20% partner discount on all plans
    </div>
  );
}

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
