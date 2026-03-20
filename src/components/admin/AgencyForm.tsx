"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AgencyData {
  id?: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  customDomain: string | null;
  starterPrice: number;
  growthPrice: number;
  empirePrice: number;
}

interface AgencyFormProps {
  agency?: AgencyData | null;
  onSuccess: () => void;
}

export function AgencyForm({ agency, onSuccess }: AgencyFormProps) {
  const isEdit = !!agency?.id;

  const [name, setName] = useState(agency?.name || "");
  const [slug, setSlug] = useState(agency?.slug || "");
  const [logoUrl, setLogoUrl] = useState(agency?.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(agency?.primaryColor || "#4c85ff");
  const [accentColor, setAccentColor] = useState(agency?.accentColor || "#22d3a1");
  const [customDomain, setCustomDomain] = useState(agency?.customDomain || "");
  const [starterPrice, setStarterPrice] = useState(agency?.starterPrice ?? 349700);
  const [growthPrice, setGrowthPrice] = useState(agency?.growthPrice ?? 699700);
  const [empirePrice, setEmpirePrice] = useState(agency?.empirePrice ?? 1299700);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        slug,
        logoUrl: logoUrl || undefined,
        primaryColor,
        accentColor,
        customDomain: customDomain || undefined,
        starterPrice,
        growthPrice,
        empirePrice,
      };

      const url = isEdit ? `/api/admin/agencies/${agency.id}` : "/api/admin/agencies";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      onSuccess();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="agency-name" className="text-sm font-medium text-foreground">Agency Name</label>
              <input
                id="agency-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Agency name"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="agency-slug" className="text-sm font-medium text-foreground">Slug</label>
              <input
                id="agency-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="agency-slug"
                required
                disabled={isEdit}
              />
            </div>

            {/* Logo URL */}
            <div className="sm:col-span-2">
              <label htmlFor="agency-logo-url" className="text-sm font-medium text-foreground">Logo URL</label>
              <input
                id="agency-logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Colors */}
            <div>
              <label htmlFor="agency-primary-color" className="text-sm font-medium text-foreground">Primary Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-border"
                  aria-label="Primary color picker"
                />
                <input
                  id="agency-primary-color"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>

            <div>
              <label htmlFor="agency-accent-color" className="text-sm font-medium text-foreground">Accent Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-border"
                  aria-label="Accent color picker"
                />
                <input
                  id="agency-accent-color"
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>

            {/* Custom Domain */}
            <div className="sm:col-span-2">
              <label htmlFor="agency-custom-domain" className="text-sm font-medium text-foreground">Custom Domain</label>
              <input
                id="agency-custom-domain"
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="marketing.youragency.com"
              />
            </div>

            {/* Pricing */}
            <div>
              <label htmlFor="agency-starter-price" className="text-sm font-medium text-foreground">Starter Price (cents)</label>
              <input
                id="agency-starter-price"
                type="number"
                value={starterPrice}
                onChange={(e) => setStarterPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                min={0}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                = ${(starterPrice / 100).toLocaleString()}/mo
              </p>
            </div>

            <div>
              <label htmlFor="agency-growth-price" className="text-sm font-medium text-foreground">Growth Price (cents)</label>
              <input
                id="agency-growth-price"
                type="number"
                value={growthPrice}
                onChange={(e) => setGrowthPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                min={0}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                = ${(growthPrice / 100).toLocaleString()}/mo
              </p>
            </div>

            <div>
              <label htmlFor="agency-empire-price" className="text-sm font-medium text-foreground">Empire Price (cents)</label>
              <input
                id="agency-empire-price"
                type="number"
                value={empirePrice}
                onChange={(e) => setEmpirePrice(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                min={0}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                = ${(empirePrice / 100).toLocaleString()}/mo
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update Agency" : "Create Agency"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
