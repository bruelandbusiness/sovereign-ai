"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Star, Trash2, Users, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";
import { fetcher } from "@/lib/fetcher";

interface LocationData {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  isPrimary: boolean;
  leadsCount: number;
  bookingsCount: number;
  createdAt: string;
}

export default function LocationsPage() {
  const { toast } = useToast();
  const { data: locations, isLoading, error: swrError } = useSWR<LocationData[]>("/api/dashboard/locations", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    isPrimary: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create location");
        return;
      }

      setFormData({ name: "", address: "", city: "", state: "", zip: "", phone: "", isPrimary: false });
      setShowForm(false);
      mutate("/api/dashboard/locations");
      toast("Location created", "success");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      const res = await fetch(`/api/dashboard/locations/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate("/api/dashboard/locations");
        toast("Location deleted", "success");
      }
    } catch {
      toast("We couldn't delete the location. Please try again.", "error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Locations</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your business locations for multi-location tracking.
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>

          {swrError && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
              Failed to load locations. Please try refreshing the page.
            </div>
          )}

          {/* Add Location Form */}
          {showForm && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>New Location</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4" aria-label="Add new location">
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="loc-name" className="text-sm font-medium">Location Name *</label>
                      <input
                        id="loc-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Main Office"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="loc-phone" className="text-sm font-medium">Phone</label>
                      <input
                        id="loc-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="loc-address" className="text-sm font-medium">Address</label>
                      <input
                        id="loc-address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <label htmlFor="loc-city" className="text-sm font-medium">City</label>
                      <input
                        id="loc-city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Phoenix"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="loc-state" className="text-sm font-medium">State</label>
                        <input
                          id="loc-state"
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="AZ"
                        />
                      </div>
                      <div>
                        <label htmlFor="loc-zip" className="text-sm font-medium">ZIP</label>
                        <input
                          id="loc-zip"
                          type="text"
                          value={formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="85001"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPrimary}
                          onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                          className="rounded border-border"
                        />
                        Set as primary location
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Location"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Location Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Locations">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" role="status" aria-label="Loading location" />
              ))
            ) : locations && locations.length > 0 ? (
              locations.map((loc) => (
                <Card key={loc.id} className="transition-colors hover:border-primary/30" role="listitem" aria-label={`Location: ${loc.name}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                        <h3 className="font-semibold">{loc.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {loc.isPrimary && (
                          <Badge variant="default" className="text-[10px]">
                            <Star className="mr-1 h-3 w-3" aria-hidden="true" />
                            Primary
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                          onClick={() => handleDelete(loc.id)}
                          aria-label={`Delete location: ${loc.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    {(loc.address || loc.city) && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {[loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {loc.phone && (
                      <p className="mt-1 text-sm text-muted-foreground">{loc.phone}</p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="tabular-nums">{loc.leadsCount} leads</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="tabular-nums">{loc.bookingsCount} bookings</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                    <h3 className="mt-3 text-base font-semibold">No locations yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add your first location to enable multi-location tracking.
                    </p>
                    <Button className="mt-4" onClick={() => setShowForm(true)}>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Add Your First Location
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
