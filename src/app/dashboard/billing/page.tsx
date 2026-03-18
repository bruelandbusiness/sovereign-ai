"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed");
    return r.json();
  });

interface BillingData {
  plan: { id: string; name: string; price: number } | null;
  status: string;
  monthlyAmount: number;
  currentPeriodEnd: string | null;
  stripeCustId: string | null;
  services: { id: string; name: string; status: string; activatedAt: string | null }[];
}

export default function BillingPage() {
  const { data, isLoading } = useSWR<BillingData>("/api/dashboard/billing", fetcher);
  const [portalLoading, setPortalLoading] = useState(false);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/dashboard/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } finally {
      setPortalLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    past_due: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    canceled: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Billing & Subscription</h1>
              <p className="text-sm text-muted-foreground">
                Manage your plan and payment details
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 flex justify-center py-20">
              <p className="text-sm text-muted-foreground">Loading billing info...</p>
            </div>
          ) : !data?.plan ? (
            <div className="mt-8">
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <CreditCard className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-4 text-sm text-muted-foreground">No active subscription</p>
                  <Link href="/onboarding" className="mt-4">
                    <Button>Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Plan Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{data.plan.name}</p>
                      <p className="text-2xl font-bold">
                        ${data.monthlyAmount.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    <Badge className={statusColors[data.status] || ""}>
                      {data.status === "active" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {data.status === "past_due" && <AlertCircle className="mr-1 h-3 w-3" />}
                      {data.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {data.currentPeriodEnd && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Next billing: {new Date(data.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}

                  {data.status === "past_due" && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                      <p className="text-sm text-amber-400">
                        Your payment is past due. Please update your payment method to avoid service interruption.
                      </p>
                    </div>
                  )}

                  {data.stripeCustId && (
                    <Button
                      onClick={openPortal}
                      disabled={portalLoading}
                      className="w-full"
                      variant="outline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {portalLoading ? "Opening..." : "Manage Subscription"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Active Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Services ({data.services.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.services.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                      >
                        <span className="text-sm font-medium">{s.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {s.status}
                        </Badge>
                      </div>
                    ))}
                    {data.services.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No active services
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
