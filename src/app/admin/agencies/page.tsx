"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgencyForm } from "@/components/admin/AgencyForm";
import { formatPrice } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-context";
import { Building2, Plus, Users, DollarSign } from "lucide-react";

interface Agency {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  customDomain: string | null;
  starterPrice: number;
  growthPrice: number;
  empirePrice: number;
  clientCount: number;
  createdAt: string;
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const { toast } = useToast();

  async function fetchAgencies() {
    try {
      const res = await fetch("/api/admin/agencies");
      if (res.ok) {
        const data = await res.json();
        setAgencies(data.agencies);
      } else {
        toast("We couldn't load your agencies. Please refresh the page.", "error");
      }
    } catch {
      toast("Connection issue while loading agencies. Please check your internet and try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAgencies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated() {
    setShowForm(false);
    setEditingAgency(null);
    fetchAgencies();
  }

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agencies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage white-label agency partners.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (showForm || editingAgency) {
    return (
      <div className="space-y-6 page-enter">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            {editingAgency ? "Edit Agency" : "Create Agency"}
          </h1>
          <Button
            variant="ghost"
            onClick={() => {
              setShowForm(false);
              setEditingAgency(null);
            }}
          >
            Cancel
          </Button>
        </div>
        <AgencyForm agency={editingAgency} onSuccess={handleCreated} />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agencies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage white-label agency partners.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agency
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Agencies</p>
              <p className="text-2xl font-bold tabular-nums">{agencies.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Agency Clients</p>
              <p className="text-2xl font-bold tabular-nums">
                {agencies.reduce((sum, a) => sum + a.clientCount, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agency Network</p>
              <p className="text-2xl font-bold tabular-nums">
                {agencies.filter((a) => a.clientCount > 0).length} active
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agency List */}
      {agencies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No agencies created yet. Click &quot;Create Agency&quot; above to set up your first white-label partner.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <Card key={agency.id} className="transition-colors hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{agency.name}</CardTitle>
                  <Badge variant="outline">{agency.slug}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: agency.primaryColor }}
                  />
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: agency.accentColor }}
                  />
                  <span className="text-xs text-muted-foreground">Brand colors</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clients</span>
                  <span className="font-medium">{agency.clientCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Starter price</span>
                  <span className="font-medium">{formatPrice(agency.starterPrice / 100)}/mo</span>
                </div>
                {agency.customDomain && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="font-medium text-primary">{agency.customDomain}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setEditingAgency(agency)}
                >
                  Edit Agency
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
