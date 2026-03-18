"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Layers,
  Users,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, getBundleById, getServiceById } from "@/lib/constants";

interface ClientDetail {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  vertical: string | null;
  website: string | null;
  createdAt: string;
  email: string;
  subscription: {
    id: string;
    bundleId: string | null;
    monthlyAmount: number;
    status: string;
    stripeSubId: string | null;
    stripeCustId: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
  } | null;
  services: Array<{
    id: string;
    serviceId: string;
    status: string;
    activatedAt: string | null;
    createdAt: string;
  }>;
  leads: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string;
    status: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
}

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "provisioning":
      return "secondary" as const;
    case "paused":
      return "outline" as const;
    case "canceled":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function leadStatusVariant(status: string) {
  switch (status) {
    case "won":
      return "default" as const;
    case "qualified":
    case "appointment":
      return "secondary" as const;
    case "new":
      return "outline" as const;
    case "lost":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch(`/api/admin/clients/${id}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data.client);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchClient();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Client not found.</p>
          <Link
            href="/admin/clients"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to clients
          </Link>
        </div>
      </div>
    );
  }

  const bundle = client.subscription?.bundleId
    ? getBundleById(client.subscription.bundleId)
    : null;

  return (
    <div className="space-y-6 page-enter">
      {/* Back link + header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {client.businessName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {client.ownerName} &middot; Joined{" "}
            {new Date(client.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Profile + Subscription row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Business Name</dt>
                <dd className="font-medium text-foreground">
                  {client.businessName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-medium text-foreground">
                  {client.ownerName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </dt>
                <dd className="text-foreground">{client.email}</dd>
              </div>
              {client.phone && (
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </dt>
                  <dd className="text-foreground">{client.phone}</dd>
                </div>
              )}
              {(client.city || client.state) && (
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Location
                  </dt>
                  <dd className="text-foreground">
                    {[client.city, client.state].filter(Boolean).join(", ")}
                  </dd>
                </div>
              )}
              {client.vertical && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Vertical</dt>
                  <dd className="text-foreground capitalize">
                    {client.vertical}
                  </dd>
                </div>
              )}
              {client.website && (
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </dt>
                  <dd>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.subscription ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Bundle</dt>
                  <dd>
                    <Badge
                      variant={
                        client.subscription.bundleId === "empire"
                          ? "default"
                          : client.subscription.bundleId === "growth"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {bundle?.name || "Custom"}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Monthly Amount</dt>
                  <dd className="text-lg font-bold tabular-nums text-foreground">
                    {formatPrice(client.subscription.monthlyAmount / 100)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={statusVariant(client.subscription.status)}>
                      {client.subscription.status}
                    </Badge>
                  </dd>
                </div>
                {client.subscription.stripeSubId && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stripe Sub</dt>
                    <dd className="font-mono text-xs text-muted-foreground">
                      {client.subscription.stripeSubId}
                    </dd>
                  </div>
                )}
                {client.subscription.stripeCustId && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stripe Cust</dt>
                    <dd className="font-mono text-xs text-muted-foreground">
                      {client.subscription.stripeCustId}
                    </dd>
                  </div>
                )}
                {client.subscription.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Current Period End
                    </dt>
                    <dd className="text-foreground">
                      {new Date(
                        client.subscription.currentPeriodEnd
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active subscription.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Services ({client.services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No services provisioned.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {client.services.map((svc) => {
                const serviceInfo = getServiceById(svc.serviceId);
                return (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {serviceInfo?.name || svc.serviceId}
                    </span>
                    <Badge variant={statusVariant(svc.status)}>
                      {svc.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads + Activity row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Recent Leads ({client.leads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              <div className="space-y-2">
                {client.leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.source} &middot;{" "}
                        {new Date(lead.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={leadStatusVariant(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity ({client.activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-2">
                {client.activities.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-white/[0.04] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
