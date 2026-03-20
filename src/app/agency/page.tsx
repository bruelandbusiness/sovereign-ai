"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/constants";
import { Building2, Users, DollarSign, TrendingUp } from "lucide-react";

interface AgencyClient {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  subscription: {
    bundleId: string | null;
    monthlyAmount: number;
    status: string;
    isTrial: boolean;
  } | null;
  leadsCount: number;
  bookingsCount: number;
  createdAt: string;
}

interface AgencyInfo {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
}

export default function AgencyDashboardPage() {
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [totalMrr, setTotalMrr] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/agency/clients");
        if (!res.ok) {
          setError(res.status === 403 ? "You are not an agency owner." : "Failed to load data.");
          return;
        }
        const data = await res.json();
        setAgency(data.agency);
        setClients(data.clients);
        setTotalMrr(data.totalMrr);
      } catch {
        setError("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="status" aria-label="Loading">
          <div className="text-muted-foreground">Loading agency dashboard...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="text-muted-foreground">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          {/* Agency Header */}
          <div className="flex items-center gap-4">
            {agency?.logoUrl ? (
              <Image src={agency.logoUrl} alt={`${agency.name} logo`} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: agency?.primaryColor || "#4c85ff" }}
                role="img"
                aria-label={`${agency?.name || "Agency"} logo`}
              >
                <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{agency?.name}</h1>
              <p className="text-sm text-muted-foreground">Agency Dashboard</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold tabular-nums">{clients.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total MRR</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {formatPrice(totalMrr / 100)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {clients.reduce((sum, c) => sum + c.leadsCount, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branding Preview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Brand Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Primary:</span>
                  <div
                    className="h-8 w-8 rounded-md border"
                    style={{ backgroundColor: agency?.primaryColor }}
                    role="img"
                    aria-label={`Primary color: ${agency?.primaryColor}`}
                  />
                  <code className="text-xs">{agency?.primaryColor}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Accent:</span>
                  <div
                    className="h-8 w-8 rounded-md border"
                    style={{ backgroundColor: agency?.accentColor }}
                    role="img"
                    aria-label={`Accent color: ${agency?.accentColor}`}
                  />
                  <code className="text-xs">{agency?.accentColor}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Slug:</span>
                  <code className="text-xs">{agency?.slug}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client List */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients yet. Once you onboard your first client through your agency portal, they will appear here.</p>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.04] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {client.businessName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.ownerName} &middot; {client.email}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-medium tabular-nums">
                            {client.leadsCount} leads
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.bookingsCount} bookings
                          </p>
                        </div>
                        {client.subscription ? (
                          <Badge
                            variant={
                              client.subscription.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {client.subscription.isTrial
                              ? "Trial"
                              : client.subscription.bundleId || "Custom"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No plan</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
