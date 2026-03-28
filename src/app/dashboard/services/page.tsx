"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import { SERVICES } from "@/lib/constants";
import { getServiceIcon } from "@/lib/service-icons";

/**
 * Add-on / marketplace services that are not in the core SERVICES constant
 * but still need to appear in the services grid when active.
 */
const ADDON_SERVICES: Array<{ id: string; name: string; tagline: string; color: string }> = [
  { id: "aeo", name: "AI Answer Engine", tagline: "Optimize for AI search engines", color: "bg-violet-500/10" },
  { id: "gbp", name: "Google Business Profile", tagline: "Manage your GBP listing", color: "bg-green-500/10" },
  { id: "referral-program", name: "Referral Program", tagline: "Turn customers into advocates", color: "bg-amber-500/10" },
  { id: "ai-estimate", name: "AI Estimate Builder", tagline: "Generate instant estimates", color: "bg-sky-500/10" },
  { id: "estimate", name: "AI Estimate Builder", tagline: "Generate instant estimates", color: "bg-sky-500/10" },
  { id: "fsm-sync", name: "FSM Integration", tagline: "Sync with field service tools", color: "bg-emerald-500/10" },
  { id: "fsm", name: "FSM Integration", tagline: "Sync with field service tools", color: "bg-emerald-500/10" },
  { id: "customer-ltv", name: "Customer Lifetime Value", tagline: "Maximize repeat revenue", color: "bg-rose-500/10" },
  { id: "ai-receptionist", name: "AI Receptionist", tagline: "24/7 virtual front desk", color: "bg-purple-500/10" },
];

export default function ServicesIndexPage() {
  const { services, isLoading } = useDashboard();

  const activeServiceIds = services
    .filter((s) => s.status === "active")
    .map((s) => s.serviceId);

  const coreActive = SERVICES.filter((s) => activeServiceIds.includes(s.id));

  // Include add-on services that are active but not in the core SERVICES list
  const coreIds = new Set<string>(SERVICES.map((s) => s.id));
  const addonActive = ADDON_SERVICES.filter(
    (a) => activeServiceIds.includes(a.id) && !coreIds.has(a.id),
  );

  const activeServices = [
    ...coreActive.map((s) => ({ id: s.id, name: s.name, tagline: s.tagline, color: s.color })),
    ...addonActive,
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" aria-busy="true">
          <div className="flex items-center gap-2 text-muted-foreground" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Loading your services...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Your AI Services</h1>
            <p className="mt-1 text-muted-foreground">
              Manage and monitor all of your active services.
            </p>
          </div>

          {activeServices.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeServices.map((service) => {
                const Icon = getServiceIcon(service.id);
                return (
                  <Link
                    key={service.id}
                    href={`/dashboard/services/${service.id}`}
                    aria-label={`${service.name} — ${service.tagline}`}
                  >
                    <Card className="h-full transition-colors hover:border-primary/50 focus-within:border-primary/50">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${service.color}`}
                            aria-hidden="true"
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="font-semibold">{service.name}</h3>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {service.tagline}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No services active yet. Complete your onboarding to activate your AI marketing services.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80"
                >
                  Back to Dashboard
                </Link>
              </CardContent>
            </Card>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
