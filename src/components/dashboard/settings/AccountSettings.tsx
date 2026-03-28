"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  User,
  Save,
  Loader2,
  AlertTriangle,
  Cog,
  Plug,
  Mail,
  Smartphone,
  Clock,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Upload,
  Palette,
  Shield,
  Monitor,
  LogOut,
  CreditCard,
  Trash2,
  X,
  ImageIcon,
  Download,
  Type,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { FadeInView } from "@/components/shared/FadeInView";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationPreferences {
  emailNotifications: boolean;
  smsAlerts: boolean;
  weeklyReportEmails: boolean;
  leadAlerts: boolean;
  reviewNotifications: boolean;
  billingAlerts: boolean;
  pushEnabled: boolean;
  frequency: "realtime" | "daily_digest" | "weekly_digest";
}

interface ProfileData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  vertical: string;
}

interface BrandingData {
  logoUrl: string | null;
  brandColor: string;
  accentColor: string;
  companyName: string;
  customDomain: string;
  emailFooter: string;
  showPoweredBy: boolean;
}

interface SecurityData {
  sessions: Array<{
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }>;
  lastLoginDate: string;
  lastLoginIp: string;
}

interface AccountData {
  profile: ProfileData;
  notifications: NotificationPreferences;
  branding: BrandingData;
  security: SecurityData;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
];

const VERTICALS = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "roofing", label: "Roofing" },
  { value: "electrical", label: "Electrical" },
  { value: "landscaping", label: "Landscaping" },
  { value: "pest-control", label: "Pest Control" },
  { value: "cleaning", label: "Cleaning Services" },
  { value: "painting", label: "Painting" },
  { value: "garage-doors", label: "Garage Doors" },
  { value: "general-contractor", label: "General Contractor" },
  { value: "other", label: "Other" },
];

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  emailNotifications: true,
  smsAlerts: false,
  weeklyReportEmails: true,
  leadAlerts: true,
  reviewNotifications: true,
  billingAlerts: true,
  pushEnabled: false,
  frequency: "realtime",
};

const DEFAULT_PROFILE: ProfileData = {
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  timezone: "America/New_York",
  vertical: "",
};

const DEFAULT_BRANDING: BrandingData = {
  logoUrl: null,
  brandColor: "#4C85FF",
  accentColor: "#10B981",
  companyName: "",
  customDomain: "",
  emailFooter: "",
  showPoweredBy: true,
};

const DEFAULT_SECURITY: SecurityData = {
  sessions: [],
  lastLoginDate: "",
  lastLoginIp: "",
};

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ---------------------------------------------------------------------------
// Section Footer (Save / Cancel)
// ---------------------------------------------------------------------------

function SectionActions({
  isDirty,
  saving,
  onSave,
  onCancel,
}: {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!isDirty) return null;

  return (
    <CardFooter className="justify-end gap-2 border-t border-border/50 pt-4">
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
        <X className="h-3.5 w-3.5 mr-1.5" />
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5 mr-1.5" />
        )}
        Save
      </Button>
    </CardFooter>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AccountSettings() {
  const { toast } = useToast();
  const { data, mutate, isLoading } = useSWR<{ account: AccountData }>(
    "/api/dashboard/settings/account",
    fetcher,
  );

  const account = data?.account;
  const serverProfile = account?.profile ?? DEFAULT_PROFILE;
  const serverNotifications =
    account?.notifications ?? DEFAULT_NOTIFICATIONS;
  const serverBranding = account?.branding ?? DEFAULT_BRANDING;
  const serverSecurity = account?.security ?? DEFAULT_SECURITY;

  // ---- Profile state ----
  const [profileEdits, setProfileEdits] = useState<
    Partial<ProfileData> | null
  >(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const displayProfile: ProfileData = {
    ...serverProfile,
    ...profileEdits,
  };

  const profileDirty = profileEdits !== null;

  const updateProfile = useCallback(
    (field: keyof ProfileData, value: string) => {
      setProfileEdits((prev) => ({
        ...(prev ?? {}),
        [field]: value,
      }));
    },
    [],
  );

  async function saveProfile() {
    if (!displayProfile.ownerName.trim()) {
      toast("Owner name is required", "error");
      return;
    }
    if (!displayProfile.businessName.trim()) {
      toast("Business name is required", "error");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "profile", data: displayProfile }),
      });
      if (!res.ok) throw new Error("Save failed");
      await mutate();
      setProfileEdits(null);
      toast("Profile updated successfully", "success");
    } catch {
      toast("Failed to save profile. Please try again.", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  // ---- Notifications state ----
  const [notifEdits, setNotifEdits] = useState<
    Partial<NotificationPreferences> | null
  >(null);
  const [notifSaving, setNotifSaving] = useState(false);

  const displayNotifications: NotificationPreferences = {
    ...serverNotifications,
    ...notifEdits,
  };

  const notifDirty = notifEdits !== null;

  const updateNotif = useCallback(
    (field: keyof NotificationPreferences, value: boolean | string) => {
      setNotifEdits((prev) => ({
        ...(prev ?? {}),
        [field]: value,
      }));
    },
    [],
  );

  async function saveNotifications() {
    setNotifSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "notifications",
          data: displayNotifications,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      await mutate();
      setNotifEdits(null);
      toast("Notification preferences saved", "success");
    } catch {
      toast("Failed to save notification preferences.", "error");
    } finally {
      setNotifSaving(false);
    }
  }

  // ---- Branding state ----
  const [brandEdits, setBrandEdits] = useState<
    Partial<BrandingData> | null
  >(null);
  const [brandSaving, setBrandSaving] = useState(false);

  const displayBranding: BrandingData = {
    ...serverBranding,
    ...brandEdits,
  };

  const brandDirty = brandEdits !== null;

  async function saveBranding() {
    setBrandSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "branding",
          data: displayBranding,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      await mutate();
      setBrandEdits(null);
      toast("Branding settings saved", "success");
    } catch {
      toast("Failed to save branding settings.", "error");
    } finally {
      setBrandSaving(false);
    }
  }

  // ---- Security state ----
  const [signingOut, setSigningOut] = useState(false);

  async function signOutAllDevices() {
    setSigningOut(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-all", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      await mutate();
      toast("All other sessions have been signed out", "success");
    } catch {
      toast("Failed to sign out devices. Please try again.", "error");
    } finally {
      setSigningOut(false);
    }
  }

  // ---- Data Export state ----
  const [exporting, setExporting] = useState(false);

  async function handleDataExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/dashboard/export-data", {
        method: "POST",
      });
      if (res.status === 429) {
        toast(
          "You can only export your data once per day. Please try again tomorrow.",
          "error",
        );
        return;
      }
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ??
        `sovereign-ai-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Your data export has been downloaded.", "success");
    } catch {
      toast(
        "Failed to export your data. Please try again later.",
        "error",
      );
    } finally {
      setExporting(false);
    }
  }

  // ---- Danger Zone state ----
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ------ Loading state ------
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8">
          <Container>
            <div className="space-y-6">
              {/* Header skeleton */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="space-y-2">
                  <div className="h-7 w-56 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-72 animate-pulse rounded bg-muted" />
                </div>
              </div>
              {/* Nav skeleton */}
              <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
              {/* Card skeletons */}
              {[0, 1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-4 py-6">
                    <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="h-10 animate-pulse rounded-lg bg-muted" />
                      <div className="h-10 animate-pulse rounded-lg bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main id="main-content" className="flex-1 py-8">
        <Container>
          <FadeInView>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" aria-hidden="true" />
                  Account Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your profile, notifications, branding, and account
                  security
                </p>
              </div>
            </div>
          </FadeInView>

          {/* Settings sub-navigation */}
          <div className="mb-8 flex items-center gap-1 rounded-lg border border-border/50 bg-card p-1">
            {[
              {
                href: "/dashboard/settings/account",
                icon: User,
                label: "Account",
                active: true,
              },
              {
                href: "/dashboard/settings/automation",
                icon: Cog,
                label: "Automation",
                active: false,
              },
              {
                href: "/dashboard/settings/integrations",
                icon: Plug,
                label: "Integrations",
                active: false,
              },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all ${
                  tab.active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="space-y-6">
            {/* ================================================================
                1. PROFILE SECTION
            ================================================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Your personal and business information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Row 1: Business name + Owner name */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      value={displayProfile.businessName}
                      onChange={(e) =>
                        updateProfile("businessName", e.target.value)
                      }
                      placeholder="Acme Plumbing Co."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">
                      Owner Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="ownerName"
                      value={displayProfile.ownerName}
                      onChange={(e) =>
                        updateProfile("ownerName", e.target.value)
                      }
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                {/* Row 2: Email (read-only) + Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={displayProfile.email}
                      disabled
                      className="cursor-not-allowed opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email address
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={displayProfile.phone}
                      onChange={(e) =>
                        updateProfile("phone", e.target.value)
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Row 3: Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    <MapPin className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                    Business Address
                  </Label>
                  <Input
                    id="address"
                    value={displayProfile.address}
                    onChange={(e) =>
                      updateProfile("address", e.target.value)
                    }
                    placeholder="123 Main St, Suite 100, Austin, TX 78701"
                  />
                </div>

                {/* Row 4: Timezone + Vertical */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">
                      <Globe className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                      Timezone
                    </Label>
                    <Select
                      value={displayProfile.timezone}
                      onValueChange={(val) => {
                        if (val !== null) updateProfile("timezone", val);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vertical">
                      <Briefcase className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                      Business Vertical / Trade
                    </Label>
                    <Select
                      value={displayProfile.vertical}
                      onValueChange={(val) => {
                        if (val !== null) updateProfile("vertical", val);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your trade" />
                      </SelectTrigger>
                      <SelectContent>
                        {VERTICALS.map((v) => (
                          <SelectItem key={v.value} value={v.value}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <SectionActions
                isDirty={profileDirty}
                saving={profileSaving}
                onSave={saveProfile}
                onCancel={() => setProfileEdits(null)}
              />
            </Card>

            {/* ================================================================
                2. NOTIFICATION PREFERENCES
            ================================================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control which notifications you receive and how often
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Toggle switches */}
                <div className="space-y-4">
                  {[
                    {
                      key: "emailNotifications" as const,
                      label: "Email Notifications",
                      description:
                        "Receive general email notifications about your account",
                      icon: Mail,
                    },
                    {
                      key: "smsAlerts" as const,
                      label: "SMS Alerts",
                      description:
                        "Get text message alerts for urgent events like new leads",
                      icon: Smartphone,
                    },
                    {
                      key: "weeklyReportEmails" as const,
                      label: "Weekly Report Emails",
                      description:
                        "Receive a weekly performance summary every Monday",
                      icon: Clock,
                    },
                    {
                      key: "leadAlerts" as const,
                      label: "Lead Alerts",
                      description:
                        "Get notified immediately when a new lead comes in",
                      icon: User,
                    },
                    {
                      key: "reviewNotifications" as const,
                      label: "Review Notifications",
                      description:
                        "Get notified when you receive a new customer review",
                      icon: Smartphone,
                    },
                    {
                      key: "billingAlerts" as const,
                      label: "Billing Alerts",
                      description:
                        "Notifications about invoices, payments, and subscription changes",
                      icon: CreditCard,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium"
                            id={`label-${item.key}`}
                          >
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={
                          displayNotifications[item.key] as boolean
                        }
                        onCheckedChange={(val: boolean) =>
                          updateNotif(item.key, val)
                        }
                        aria-labelledby={`label-${item.key}`}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Notification Frequency */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Delivery Frequency
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Billing alerts and lead notifications are always sent in
                    real time regardless of this setting.
                  </p>
                  <fieldset>
                    <legend className="sr-only">Notification frequency</legend>
                    <div className="space-y-2">
                      {[
                        {
                          value: "realtime" as const,
                          label: "Real-time",
                          description:
                            "Get each notification as it happens",
                        },
                        {
                          value: "daily_digest" as const,
                          label: "Daily Digest",
                          description:
                            "One summary email per day at 9:00 AM",
                        },
                        {
                          value: "weekly_digest" as const,
                          label: "Weekly Digest",
                          description:
                            "One summary email per week on Monday morning",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            displayNotifications.frequency === option.value
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="notification-frequency"
                            value={option.value}
                            checked={
                              displayNotifications.frequency === option.value
                            }
                            onChange={() =>
                              updateNotif("frequency", option.value)
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <Separator />

                {/* Quiet Hours */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Quiet Hours
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Pause non-critical notifications during off-hours.
                    Action-required alerts will always come through.
                  </p>
                  <div className="rounded-lg border border-border/50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" id="label-quiet-hours-settings">Enable Quiet Hours</p>
                        <p className="text-xs text-muted-foreground">
                          No notifications between the specified times
                        </p>
                      </div>
                      <Switch
                        checked={displayNotifications.pushEnabled}
                        onCheckedChange={(val: boolean) =>
                          updateNotif("pushEnabled", val)
                        }
                        aria-labelledby="label-quiet-hours-settings"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <label htmlFor="quiet-start-settings" className="text-xs text-muted-foreground">From</label>
                      <input
                        id="quiet-start-settings"
                        type="time"
                        defaultValue="22:00"
                        className="rounded-md border border-border/50 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <label htmlFor="quiet-end-settings" className="text-xs text-muted-foreground">Until</label>
                      <input
                        id="quiet-end-settings"
                        type="time"
                        defaultValue="07:00"
                        className="rounded-md border border-border/50 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <SectionActions
                isDirty={notifDirty}
                saving={notifSaving}
                onSave={saveNotifications}
                onCancel={() => setNotifEdits(null)}
              />
            </Card>

            {/* ================================================================
                3. WHITE-LABEL BRANDING
            ================================================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  White-Label Branding
                </CardTitle>
                <CardDescription>
                  Customize your dashboard appearance, reports, and
                  client-facing assets with your own branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo upload */}
                <div className="space-y-2">
                  <Label>Business Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50">
                      {displayBranding.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL */
                        <img
                          src={displayBranding.logoUrl}
                          alt="Business logo"
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/png,image/jpeg,image/svg+xml";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement)
                                .files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) {
                                toast(
                                  "Logo must be under 2 MB",
                                  "error",
                                );
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setBrandEdits((prev) => ({
                                  ...(prev ?? {}),
                                  logoUrl: reader.result as string,
                                }));
                              };
                              reader.readAsDataURL(file);
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Upload Logo
                        </Button>
                        {displayBranding.logoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setBrandEdits((prev) => ({
                                ...(prev ?? {}),
                                logoUrl: null,
                              }))
                            }
                          >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, or SVG. Max 2 MB. Recommended 200x200px.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Brand colors */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" />
                    Brand Colors
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Primary color */}
                    <div className="space-y-2">
                      <Label htmlFor="brandColor">Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            id="brandColor"
                            type="color"
                            value={displayBranding.brandColor}
                            onChange={(e) =>
                              setBrandEdits((prev) => ({
                                ...(prev ?? {}),
                                brandColor: e.target.value,
                              }))
                            }
                            className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                          />
                        </div>
                        <Input
                          value={displayBranding.brandColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                              setBrandEdits((prev) => ({
                                ...(prev ?? {}),
                                brandColor: val,
                              }));
                            }
                          }}
                          placeholder="#4C85FF"
                          className="w-28 font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    {/* Accent color */}
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            id="accentColor"
                            type="color"
                            value={displayBranding.accentColor}
                            onChange={(e) =>
                              setBrandEdits((prev) => ({
                                ...(prev ?? {}),
                                accentColor: e.target.value,
                              }))
                            }
                            className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                          />
                        </div>
                        <Input
                          value={displayBranding.accentColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                              setBrandEdits((prev) => ({
                                ...(prev ?? {}),
                                accentColor: val,
                              }));
                            }
                          }}
                          placeholder="#10B981"
                          className="w-28 font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Color preview bar */}
                  <div className="mt-3 flex h-10 overflow-hidden rounded-lg border border-border">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: displayBranding.brandColor }}
                      aria-label={`Primary color preview: ${displayBranding.brandColor}`}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: displayBranding.accentColor }}
                      aria-label={`Accent color preview: ${displayBranding.accentColor}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    These colors appear on customer-facing pages, reports, and
                    email templates.
                  </p>
                </div>

                <Separator />

                {/* Company name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    <Type className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                    Company Display Name
                  </Label>
                  <Input
                    id="companyName"
                    value={displayBranding.companyName}
                    onChange={(e) =>
                      setBrandEdits((prev) => ({
                        ...(prev ?? {}),
                        companyName: e.target.value,
                      }))
                    }
                    placeholder="Acme Services Inc."
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown on client-facing reports, invoices, and email headers.
                  </p>
                </div>

                <Separator />

                {/* Custom domain */}
                <div className="space-y-2">
                  <Label htmlFor="customDomain">
                    <Globe className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                    Custom Domain
                  </Label>
                  <Input
                    id="customDomain"
                    value={displayBranding.customDomain}
                    onChange={(e) =>
                      setBrandEdits((prev) => ({
                        ...(prev ?? {}),
                        customDomain: e.target.value,
                      }))
                    }
                    placeholder="app.yourdomain.com"
                    maxLength={253}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the domain you want clients to see. DNS configuration
                    (CNAME record) must be set up manually. Contact support for
                    setup instructions.
                  </p>
                </div>

                <Separator />

                {/* Email footer */}
                <div className="space-y-2">
                  <Label htmlFor="emailFooter">
                    <FileText className="h-3.5 w-3.5 inline mr-1.5" aria-hidden="true" />
                    Email Footer Text
                  </Label>
                  <Textarea
                    id="emailFooter"
                    value={displayBranding.emailFooter}
                    onChange={(e) =>
                      setBrandEdits((prev) => ({
                        ...(prev ?? {}),
                        emailFooter: e.target.value,
                      }))
                    }
                    placeholder="Thank you for choosing Acme Services. Visit us at acme.com"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom text appended to the footer of outgoing emails.
                    Max 500 characters.
                  </p>
                </div>

                <Separator />

                {/* Report branding toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {displayBranding.showPoweredBy ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium"
                        id="label-showPoweredBy"
                      >
                        Show &quot;Powered by Sovereign AI&quot;
                      </p>
                      <p className="text-xs text-muted-foreground">
                        When enabled, client-facing reports and pages display a
                        small &quot;Powered by Sovereign AI&quot; badge. Disable
                        for fully white-labeled reports.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={displayBranding.showPoweredBy}
                    onCheckedChange={(val: boolean) =>
                      setBrandEdits((prev) => ({
                        ...(prev ?? {}),
                        showPoweredBy: val,
                      }))
                    }
                    aria-labelledby="label-showPoweredBy"
                  />
                </div>
              </CardContent>
              <SectionActions
                isDirty={brandDirty}
                saving={brandSaving}
                onSave={saveBranding}
                onCancel={() => setBrandEdits(null)}
              />
            </Card>

            {/* ================================================================
                4. SECURITY
            ================================================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage active sessions and review login activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Last login info */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Last Login
                  </p>
                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Date: </span>
                      <span className="font-medium">
                        {serverSecurity.lastLoginDate
                          ? new Date(
                              serverSecurity.lastLoginDate,
                            ).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">IP: </span>
                      <span className="font-mono text-xs font-medium">
                        {serverSecurity.lastLoginIp || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Active Sessions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Active Sessions
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signOutAllDevices}
                      disabled={signingOut}
                    >
                      {signingOut ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <LogOut className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Sign Out All Devices
                    </Button>
                  </div>

                  {serverSecurity.sessions.length === 0 ? (
                    <div className="rounded-lg border border-border/50 p-6 text-center">
                      <Monitor className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No other active sessions found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {serverSecurity.sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between rounded-lg border p-3 ${
                            session.isCurrent
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {session.browser} on {session.device}
                                {session.isCurrent && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session.location} &middot; Last active{" "}
                                {session.lastActive}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ================================================================
                5. PRIVACY & DATA
            ================================================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Privacy &amp; Data
                </CardTitle>
                <CardDescription>
                  Manage your personal data and exercise your privacy rights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div>
                    <p className="text-sm font-medium">Download My Data</p>
                    <p className="text-xs text-muted-foreground">
                      Export all your personal data in machine-readable JSON
                      format (GDPR Article 20). Limited to once per day.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    onClick={handleDataExport}
                  >
                    {exporting ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {exporting ? "Exporting..." : "Download My Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ================================================================
                6. DANGER ZONE
            ================================================================ */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect your entire account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cancel Subscription */}
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Cancel Subscription
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Downgrade to the free tier. Your data will be
                      preserved but services will be paused.
                    </p>
                  </div>
                  <Link href="/dashboard/billing">
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Manage Billing
                    </Button>
                  </Link>
                </div>

                <Separator />

                {/* Delete Account */}
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Delete Account
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Permanently remove your account, all data, leads, and
                      service configurations. This cannot be undone.
                    </p>
                  </div>

                  <Dialog
                    open={deleteOpen}
                    onOpenChange={(open) => {
                      setDeleteOpen(open);
                      if (!open) setDeleteConfirmText("");
                    }}
                  >
                    <DialogTrigger
                      render={
                        <Button variant="destructive" size="sm" />
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete Account
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          Delete your account?
                        </DialogTitle>
                        <DialogDescription>
                          This will permanently delete your account,
                          including all leads, analytics data, service
                          configurations, and billing history. This action
                          is irreversible.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3 py-2">
                        <p className="text-sm font-medium">
                          To confirm, type{" "}
                          <span className="font-mono text-destructive font-bold">
                            DELETE
                          </span>{" "}
                          below:
                        </p>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) =>
                            setDeleteConfirmText(e.target.value)
                          }
                          placeholder="Type DELETE to confirm"
                          className="font-mono"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>

                      <DialogFooter>
                        <DialogClose
                          render={<Button variant="outline" />}
                        >
                          Cancel
                        </DialogClose>
                        <Button
                          variant="destructive"
                          disabled={
                            deleting || deleteConfirmText !== "DELETE"
                          }
                          onClick={async () => {
                            setDeleting(true);
                            try {
                              const res = await fetch(
                                "/api/account/delete",
                                { method: "DELETE" },
                              );
                              if (!res.ok)
                                throw new Error("Delete failed");
                              toast(
                                "Your account has been deleted. Redirecting...",
                                "success",
                              );
                              setDeleteOpen(false);
                              setTimeout(() => {
                                window.location.href = "/";
                              }, 1500);
                            } catch {
                              toast(
                                "Failed to delete account. Please try again or contact support.",
                                "error",
                              );
                              setDeleting(false);
                            }
                          }}
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1.5" />
                          )}
                          {deleting
                            ? "Deleting..."
                            : "Permanently Delete Account"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
