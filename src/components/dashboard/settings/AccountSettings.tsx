"use client";

import { useState } from "react";
import useSWR from "swr";
import { User, Save, Loader2, Bell, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  newLeads: boolean;
  reportsReady: boolean;
  billingAlerts: boolean;
}

interface AccountProfile {
  ownerName: string;
  email: string;
  businessName: string;
  notifications: NotificationPreferences;
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AccountSettings() {
  const { toast } = useToast();
  const { data, mutate, isLoading } = useSWR<{ profile: AccountProfile }>(
    "/api/dashboard/settings/account",
    fetcher
  );

  const profile = data?.profile;

  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isDirty =
    ownerName !== null || businessName !== null || notifications !== null;

  // Derive display values: local edits override server data
  const displayName = ownerName ?? profile?.ownerName ?? "";
  const displayBusiness = businessName ?? profile?.businessName ?? "";
  const displayNotifications: NotificationPreferences = notifications ??
    profile?.notifications ?? {
      newLeads: true,
      reportsReady: true,
      billingAlerts: true,
    };

  // ------ Save handler ------
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: displayName,
          businessName: displayBusiness,
          notifications: displayNotifications,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      // Re-fetch server data and reset local overrides
      await mutate();
      setOwnerName(null);
      setBusinessName(null);
      setNotifications(null);
      toast("Account settings saved", "success");
    } catch {
      toast("We couldn't save your settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ------ Loading state ------
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div role="status" aria-label="Loading account settings" className="text-muted-foreground">Loading settings...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <FadeInView>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  Account Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your profile, notifications, and account
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving || !isDirty}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Save Changes
              </Button>
            </div>
          </FadeInView>

          <div className="space-y-6">
            {/* ── Profile ─────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
                <CardDescription>
                  Your personal and business information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Name</Label>
                    <Input
                      id="ownerName"
                      value={displayName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email ?? ""}
                      disabled
                      className="cursor-not-allowed opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email address
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Company Name</Label>
                  <Input
                    id="businessName"
                    value={displayBusiness}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your company name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Notifications ────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Choose which email notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" id="label-new-leads">New Leads</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified when a new lead comes in
                    </p>
                  </div>
                  <Switch
                    checked={displayNotifications.newLeads}
                    onCheckedChange={(val: boolean) =>
                      setNotifications({
                        ...displayNotifications,
                        newLeads: val,
                      })
                    }
                    aria-labelledby="label-new-leads"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" id="label-reports-ready">Reports Ready</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified when a weekly or monthly report is available
                    </p>
                  </div>
                  <Switch
                    checked={displayNotifications.reportsReady}
                    onCheckedChange={(val: boolean) =>
                      setNotifications({
                        ...displayNotifications,
                        reportsReady: val,
                      })
                    }
                    aria-labelledby="label-reports-ready"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" id="label-billing-alerts">Billing Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified about upcoming invoices and payment issues
                    </p>
                  </div>
                  <Switch
                    checked={displayNotifications.billingAlerts}
                    onCheckedChange={(val: boolean) =>
                      setNotifications({
                        ...displayNotifications,
                        billingAlerts: val,
                      })
                    }
                    aria-labelledby="label-billing-alerts"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Danger Zone ──────────────────────────────────────── */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect your entire account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Delete Account</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently remove your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>

                  <Dialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                  >
                    <DialogTrigger
                      render={
                        <Button variant="destructive" size="sm" />
                      }
                    >
                      Delete Account
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This will permanently delete your account, all your
                          data, leads, and service configurations. This action
                          cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose
                          render={<Button variant="outline" />}
                        >
                          Cancel
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            toast(
                              "Please contact support to delete your account",
                              "info"
                            );
                            setDeleteOpen(false);
                          }}
                        >
                          Delete Account
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
