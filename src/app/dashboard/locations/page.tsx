"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Star,
  Trash2,
  Users,
  DollarSign,
  BarChart3,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  Building2,
  Layers,
  ToggleLeft,
  ToggleRight,
  Globe,
  TrendingUp,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationStatus = "active" | "setup" | "inactive";

interface AIService {
  id: string;
  name: string;
  enabled: boolean;
}

interface LocationData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  status: LocationStatus;
  isPrimary: boolean;
  leadsCount: number;
  revenue: number;
  rating: number;
  reviewsCount: number;
  conversionRate: number;
  serviceAreaRadius: number;
  operatingHours: string;
  primaryContact: string;
  citiesServed: string[];
  zipCodesServed: string[];
  aiServices: AIService[];
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

function buildInitialLocations(): LocationData[] {
  return [
    {
      id: "loc-1",
      name: "Downtown Phoenix HQ",
      address: "401 W Van Buren St",
      city: "Phoenix",
      state: "AZ",
      zip: "85003",
      phone: "(602) 555-0142",
      status: "active",
      isPrimary: true,
      leadsCount: 284,
      revenue: 187500,
      rating: 4.8,
      reviewsCount: 142,
      conversionRate: 34.2,
      serviceAreaRadius: 15,
      operatingHours: "Mon-Fri 8am-6pm, Sat 9am-2pm",
      primaryContact: "Sarah Mitchell",
      citiesServed: [
        "Phoenix",
        "Tempe",
        "Scottsdale",
        "Mesa",
        "Chandler",
      ],
      zipCodesServed: [
        "85003",
        "85004",
        "85006",
        "85008",
        "85012",
        "85014",
        "85016",
        "85018",
        "85251",
        "85281",
      ],
      aiServices: [
        { id: "svc-1", name: "AI Receptionist", enabled: true },
        { id: "svc-2", name: "Lead Scoring", enabled: true },
        { id: "svc-3", name: "Review Manager", enabled: true },
        { id: "svc-4", name: "Smart Scheduling", enabled: true },
        { id: "svc-5", name: "Email Campaigns", enabled: false },
      ],
    },
    {
      id: "loc-2",
      name: "Scottsdale Office",
      address: "7150 E Camelback Rd",
      city: "Scottsdale",
      state: "AZ",
      zip: "85251",
      phone: "(480) 555-0198",
      status: "active",
      isPrimary: false,
      leadsCount: 196,
      revenue: 132800,
      rating: 4.6,
      reviewsCount: 89,
      conversionRate: 29.8,
      serviceAreaRadius: 10,
      operatingHours: "Mon-Fri 9am-5pm",
      primaryContact: "James Rodriguez",
      citiesServed: [
        "Scottsdale",
        "Paradise Valley",
        "Fountain Hills",
        "Cave Creek",
      ],
      zipCodesServed: [
        "85251",
        "85254",
        "85255",
        "85258",
        "85260",
        "85262",
        "85253",
        "85268",
      ],
      aiServices: [
        { id: "svc-1", name: "AI Receptionist", enabled: true },
        { id: "svc-2", name: "Lead Scoring", enabled: true },
        { id: "svc-3", name: "Review Manager", enabled: false },
        { id: "svc-4", name: "Smart Scheduling", enabled: true },
        { id: "svc-5", name: "Email Campaigns", enabled: true },
      ],
    },
    {
      id: "loc-3",
      name: "East Valley Branch",
      address: "1920 S Alma School Rd",
      city: "Mesa",
      state: "AZ",
      zip: "85210",
      phone: "(480) 555-0267",
      status: "setup",
      isPrimary: false,
      leadsCount: 47,
      revenue: 18200,
      rating: 4.3,
      reviewsCount: 12,
      conversionRate: 22.1,
      serviceAreaRadius: 12,
      operatingHours: "Mon-Fri 8am-5pm",
      primaryContact: "Amy Chen",
      citiesServed: [
        "Mesa",
        "Gilbert",
        "Chandler",
        "Queen Creek",
        "Apache Junction",
      ],
      zipCodesServed: [
        "85210",
        "85202",
        "85204",
        "85205",
        "85233",
        "85234",
        "85286",
        "85142",
        "85120",
      ],
      aiServices: [
        { id: "svc-1", name: "AI Receptionist", enabled: true },
        { id: "svc-2", name: "Lead Scoring", enabled: false },
        { id: "svc-3", name: "Review Manager", enabled: false },
        { id: "svc-4", name: "Smart Scheduling", enabled: false },
        { id: "svc-5", name: "Email Campaigns", enabled: false },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function statusBadgeVariant(
  s: LocationStatus
): "default" | "secondary" | "destructive" {
  if (s === "active") return "default";
  if (s === "setup") return "secondary";
  return "destructive";
}

function statusLabel(s: LocationStatus): string {
  if (s === "active") return "Active";
  if (s === "setup") return "In Setup";
  return "Inactive";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBox({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        className="h-3.5 w-3.5 text-muted-foreground shrink-0"
        aria-hidden="true"
      />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Location Card
// ---------------------------------------------------------------------------

function LocationCard({
  loc,
  onDelete,
  onToggleService,
  expandedId,
  onToggleExpand,
}: {
  loc: LocationData;
  onDelete: (id: string) => void;
  onToggleService: (locId: string, svcId: string) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  const isExpanded = expandedId === loc.id;

  return (
    <Card
      variant="status"
      statusColor={
        loc.status === "active"
          ? "success"
          : loc.status === "setup"
            ? "warning"
            : "danger"
      }
      className="transition-colors hover:border-primary/30"
      role="listitem"
      aria-label={`Location: ${loc.name}`}
    >
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="font-semibold">{loc.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={statusBadgeVariant(loc.status)}>
              {statusLabel(loc.status)}
            </Badge>
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
              onClick={() => onDelete(loc.id)}
              aria-label={`Delete location: ${loc.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Address & phone */}
        <p className="mt-2 text-sm text-muted-foreground">
          {loc.address}, {loc.city}, {loc.state} {loc.zip}
        </p>
        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
          <Phone className="h-3 w-3" aria-hidden="true" />
          {loc.phone}
        </p>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatBox label="Leads" value={loc.leadsCount} icon={Users} />
          <StatBox
            label="Revenue"
            value={formatCurrency(loc.revenue)}
            icon={DollarSign}
          />
          <StatBox
            label="Rating"
            value={`${loc.rating} (${loc.reviewsCount})`}
            icon={Star}
          />
          <StatBox
            label="Conv."
            value={`${loc.conversionRate}%`}
            icon={TrendingUp}
          />
        </div>

        {/* Expand / collapse */}
        <button
          onClick={() => onToggleExpand(loc.id)}
          className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              Less details <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              More details <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            {/* Operating info */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Hours:</span>
                <span>{loc.operatingHours}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Contact:</span>
                <span>{loc.primaryContact}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Radius:</span>
                <span>{loc.serviceAreaRadius} mi</span>
              </div>
            </div>

            {/* AI Services toggles */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                AI Services
              </h4>
              <div className="space-y-1.5">
                {loc.aiServices.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => onToggleService(loc.id, svc.id)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <span>{svc.name}</span>
                    {svc.enabled ? (
                      <ToggleRight className="h-5 w-5 text-primary" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add Location Form
// ---------------------------------------------------------------------------

function AddLocationForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Omit<LocationData, "id">) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    serviceAreaRadius: "10",
    operatingHours: "Mon-Fri 9am-5pm",
    primaryContact: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newLoc: Omit<LocationData, "id"> = {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      phone: formData.phone,
      status: "setup",
      isPrimary: false,
      leadsCount: 0,
      revenue: 0,
      rating: 0,
      reviewsCount: 0,
      conversionRate: 0,
      serviceAreaRadius: parseInt(formData.serviceAreaRadius, 10) || 10,
      operatingHours: formData.operatingHours,
      primaryContact: formData.primaryContact,
      citiesServed: [formData.city].filter(Boolean),
      zipCodesServed: [formData.zip].filter(Boolean),
      aiServices: [
        { id: "svc-1", name: "AI Receptionist", enabled: false },
        { id: "svc-2", name: "Lead Scoring", enabled: false },
        { id: "svc-3", name: "Review Manager", enabled: false },
        { id: "svc-4", name: "Smart Scheduling", enabled: false },
        { id: "svc-5", name: "Email Campaigns", enabled: false },
      ],
    };
    onSubmit(newLoc);
  }

  function update(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Add New Location</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          aria-label="Add new location"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="loc-name" className="text-sm font-medium">
                Location Name *
              </label>
              <input
                id="loc-name"
                type="text"
                value={formData.name}
                onChange={(e) => update("name", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Branch Name"
                required
              />
            </div>
            <div>
              <label htmlFor="loc-phone" className="text-sm font-medium">
                Phone *
              </label>
              <input
                id="loc-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={INPUT_CLASS}
                placeholder="(555) 123-4567"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="loc-address" className="text-sm font-medium">
                Address *
              </label>
              <input
                id="loc-address"
                type="text"
                value={formData.address}
                onChange={(e) => update("address", e.target.value)}
                className={INPUT_CLASS}
                placeholder="123 Main St"
                required
              />
            </div>
            <div>
              <label htmlFor="loc-city" className="text-sm font-medium">
                City *
              </label>
              <input
                id="loc-city"
                type="text"
                value={formData.city}
                onChange={(e) => update("city", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Phoenix"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="loc-state" className="text-sm font-medium">
                  State *
                </label>
                <input
                  id="loc-state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="AZ"
                  required
                />
              </div>
              <div>
                <label htmlFor="loc-zip" className="text-sm font-medium">
                  ZIP *
                </label>
                <input
                  id="loc-zip"
                  type="text"
                  value={formData.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="85001"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="loc-radius" className="text-sm font-medium">
                Service Area Radius (miles)
              </label>
              <input
                id="loc-radius"
                type="number"
                min="1"
                max="100"
                value={formData.serviceAreaRadius}
                onChange={(e) => update("serviceAreaRadius", e.target.value)}
                className={INPUT_CLASS}
                placeholder="10"
              />
            </div>
            <div>
              <label htmlFor="loc-contact" className="text-sm font-medium">
                Primary Contact *
              </label>
              <input
                id="loc-contact"
                type="text"
                value={formData.primaryContact}
                onChange={(e) => update("primaryContact", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="loc-hours" className="text-sm font-medium">
                Operating Hours
              </label>
              <input
                id="loc-hours"
                type="text"
                value={formData.operatingHours}
                onChange={(e) => update("operatingHours", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Mon-Fri 9am-5pm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Create Location</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Location Comparison Table
// ---------------------------------------------------------------------------

function LocationComparison({
  locations,
}: {
  locations: LocationData[];
}) {
  const [sortKey, setSortKey] = useState<
    "leadsCount" | "revenue" | "reviewsCount" | "conversionRate"
  >("revenue");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...locations].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });
  }, [locations, sortKey, sortAsc]);

  function handleSort(
    key: "leadsCount" | "revenue" | "reviewsCount" | "conversionRate"
  ) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const headerBtn =
    "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
          Location Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Location comparison">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Location
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    className={headerBtn}
                    onClick={() => handleSort("leadsCount")}
                  >
                    Leads
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    className={headerBtn}
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    className={headerBtn}
                    onClick={() => handleSort("reviewsCount")}
                  >
                    Reviews
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    className={headerBtn}
                    onClick={() => handleSort("conversionRate")}
                  >
                    Conv. Rate
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((loc) => (
                <tr
                  key={loc.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 pr-4 font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="h-3.5 w-3.5 text-primary shrink-0"
                        aria-hidden="true"
                      />
                      {loc.name}
                      {loc.isPrimary && (
                        <Badge variant="default" className="text-[10px]">
                          HQ
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {loc.leadsCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(loc.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {loc.reviewsCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {loc.conversionRate}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Star
                        className="h-3 w-3 text-yellow-400"
                        aria-hidden="true"
                      />
                      {loc.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Service Area Coverage
// ---------------------------------------------------------------------------

function ServiceAreaCoverage({
  locations,
}: {
  locations: LocationData[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
          Service Area Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Service area coverage">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Radius
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cities Served
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ZIP Codes
                </th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr
                  key={loc.id}
                  className="border-b border-border/50 last:border-0 align-top"
                >
                  <td className="py-3 pr-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="h-3.5 w-3.5 text-primary shrink-0"
                        aria-hidden="true"
                      />
                      {loc.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                    {loc.serviceAreaRadius} mi
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {loc.citiesServed.map((city) => (
                        <Badge key={city} variant="secondary">
                          {city}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {loc.zipCodesServed.map((zip) => (
                        <span
                          key={zip}
                          className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground"
                        >
                          {zip}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Aggregate Summary Bar
// ---------------------------------------------------------------------------

function AggregateSummary({ locations }: { locations: LocationData[] }) {
  const totals = useMemo(() => {
    const leads = locations.reduce((s, l) => s + l.leadsCount, 0);
    const revenue = locations.reduce((s, l) => s + l.revenue, 0);
    const reviews = locations.reduce((s, l) => s + l.reviewsCount, 0);
    const avgRating =
      locations.length > 0
        ? locations.reduce((s, l) => s + l.rating, 0) / locations.length
        : 0;
    const avgConversion =
      locations.length > 0
        ? locations.reduce((s, l) => s + l.conversionRate, 0) /
          locations.length
        : 0;
    return { leads, revenue, reviews, avgRating, avgConversion };
  }, [locations]);

  const metrics = [
    {
      label: "Total Locations",
      value: locations.length,
      icon: Building2,
    },
    { label: "Total Leads", value: totals.leads, icon: Users },
    {
      label: "Total Revenue",
      value: formatCurrency(totals.revenue),
      icon: DollarSign,
    },
    { label: "Total Reviews", value: totals.reviews, icon: Star },
    {
      label: "Avg Rating",
      value: totals.avgRating.toFixed(1),
      icon: Star,
    },
    {
      label: "Avg Conversion",
      value: `${totals.avgConversion.toFixed(1)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map((m) => (
        <Card key={m.label} variant="metric">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <m.icon
              className="h-5 w-5 text-primary mb-1"
              aria-hidden="true"
            />
            <span className="text-lg font-bold tabular-nums">{m.value}</span>
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type ViewMode = "consolidated" | "per-location";

export default function LocationsPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<LocationData[]>(
    buildInitialLocations
  );
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("per-location");

  // --- Handlers ---

  function handleAddLocation(data: Omit<LocationData, "id">) {
    const newLoc: LocationData = {
      ...data,
      id: `loc-${Date.now()}`,
    };
    setLocations((prev) => [...prev, newLoc]);
    setShowForm(false);
    toast("Location created", "success");
  }

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this location?")) return;
    setLocations((prev) => prev.filter((l) => l.id !== id));
    if (expandedId === id) setExpandedId(null);
    toast("Location deleted", "success");
  }

  function handleToggleService(locId: string, svcId: string) {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locId) return loc;
        return {
          ...loc,
          aiServices: loc.aiServices.map((svc) =>
            svc.id === svcId ? { ...svc, enabled: !svc.enabled } : svc
          ),
        };
      })
    );
  }

  function handleToggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // --- Render ---

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          {/* Page header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" aria-hidden="true" />
                Multi-Location Management
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage locations, compare performance, and control AI services
                across all your service areas.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                <button
                  onClick={() => setViewMode("consolidated")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                    viewMode === "consolidated"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Consolidated
                </button>
                <button
                  onClick={() => setViewMode("per-location")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                    viewMode === "per-location"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Per-Location
                </button>
              </div>

              <Button onClick={() => setShowForm(!showForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          </div>

          {/* Aggregate summary — always visible in consolidated, collapsed in per-location */}
          {viewMode === "consolidated" && (
            <div className="mt-8">
              <AggregateSummary locations={locations} />
            </div>
          )}

          {/* Add Location Form */}
          {showForm && (
            <AddLocationForm
              onSubmit={handleAddLocation}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Consolidated View */}
          {viewMode === "consolidated" && (
            <div className="mt-8 space-y-8">
              <LocationComparison locations={locations} />
              <ServiceAreaCoverage locations={locations} />
            </div>
          )}

          {/* Per-Location View */}
          {viewMode === "per-location" && (
            <>
              {/* Location Cards */}
              <div
                className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
                aria-label="Locations"
              >
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <LocationCard
                      key={loc.id}
                      loc={loc}
                      onDelete={handleDelete}
                      onToggleService={handleToggleService}
                      expandedId={expandedId}
                      onToggleExpand={handleToggleExpand}
                    />
                  ))
                ) : (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MapPin
                          className="mx-auto h-10 w-10 text-muted-foreground/50"
                          aria-hidden="true"
                        />
                        <h3 className="mt-3 text-base font-semibold">
                          No locations yet
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add your first location to enable multi-location
                          tracking.
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setShowForm(true)}
                        >
                          <Plus
                            className="mr-2 h-4 w-4"
                            aria-hidden="true"
                          />
                          Add Your First Location
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Comparison & coverage below cards */}
              {locations.length > 1 && (
                <div className="mt-8 space-y-8">
                  <LocationComparison locations={locations} />
                  <ServiceAreaCoverage locations={locations} />
                </div>
              )}
            </>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
