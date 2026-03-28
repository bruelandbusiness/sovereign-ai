"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Save, Loader2 } from "lucide-react";
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
import { FadeInView } from "@/components/shared/FadeInView";
import { useToast } from "@/components/ui/toast-context";

interface AutomationSettings {
  dailyBudgetCents: number;
  monthlyBudgetCents: number;
  requireContentApproval: boolean;
  requireReviewApproval: boolean;
  requireAdApproval: boolean;
  adBudgetThreshold: number;
}

const defaults: AutomationSettings = {
  dailyBudgetCents: 5000,
  monthlyBudgetCents: 100000,
  requireContentApproval: false,
  requireReviewApproval: false,
  requireAdApproval: true,
  adBudgetThreshold: 50,
};

export default function AutomationSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutomationSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const savedSettingsRef = useRef<AutomationSettings>(defaults);

  const isDirty =
    JSON.stringify(settings) !== JSON.stringify(savedSettingsRef.current);

  useEffect(() => {
    const toastRef = toast;
    fetch("/api/dashboard/settings/automation")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          savedSettingsRef.current = data.settings;
        }
        setLoaded(true);
      })
      .catch(() => {
        toastRef("We couldn't load your automation settings. Please refresh the page.", "error");
        setLoaded(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      savedSettingsRef.current = settings;
      toast("Automation settings saved", "success");
    } catch {
      toast("We couldn't save your automation settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div role="status" aria-label="Loading settings" className="text-muted-foreground">Loading settings...</div>
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
                  <Shield className="h-6 w-6 text-primary" />
                  Automation Controls
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Set budgets, approval rules, and automation limits
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
            {/* Budget Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Budget Limits</CardTitle>
                <CardDescription>
                  Control how much AI agents can spend on your behalf
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Daily Budget: $
                    {(settings.dailyBudgetCents / 100).toFixed(0)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={10000}
                    step={500}
                    value={settings.dailyBudgetCents}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        dailyBudgetCents: Number(e.target.value),
                      }))
                    }
                    className="mt-2 w-full accent-primary"
                    aria-label="Daily budget amount"
                    aria-valuenow={settings.dailyBudgetCents / 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`$${(settings.dailyBudgetCents / 100).toFixed(0)}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$0</span>
                    <span>$100</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Monthly Budget: $
                    {(settings.monthlyBudgetCents / 100).toFixed(0)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={500000}
                    step={5000}
                    value={settings.monthlyBudgetCents}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        monthlyBudgetCents: Number(e.target.value),
                      }))
                    }
                    className="mt-2 w-full accent-primary"
                    aria-label="Monthly budget amount"
                    aria-valuenow={settings.monthlyBudgetCents / 100}
                    aria-valuemin={0}
                    aria-valuemax={5000}
                    aria-valuetext={`$${(settings.monthlyBudgetCents / 100).toFixed(0)}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$0</span>
                    <span>$5,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval Rules</CardTitle>
                <CardDescription>
                  Require your approval before AI takes certain actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireContentApproval}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        requireContentApproval: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">Content Publishing</p>
                    <p className="text-xs text-muted-foreground">
                      Require approval before publishing blog posts and social
                      content
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireReviewApproval}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        requireReviewApproval: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">Review Responses</p>
                    <p className="text-xs text-muted-foreground">
                      Require approval before responding to customer reviews
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireAdApproval}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        requireAdApproval: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">Ad Budget Changes</p>
                    <p className="text-xs text-muted-foreground">
                      Require approval for ad budget changes above threshold
                    </p>
                  </div>
                </label>
                {settings.requireAdApproval && (
                  <div className="ml-7">
                    <label className="text-sm">
                      Threshold: ${settings.adBudgetThreshold}
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={500}
                      step={10}
                      value={settings.adBudgetThreshold}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          adBudgetThreshold: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full accent-primary"
                      aria-label="Ad budget approval threshold"
                      aria-valuenow={settings.adBudgetThreshold}
                      aria-valuemin={10}
                      aria-valuemax={500}
                      aria-valuetext={`$${settings.adBudgetThreshold}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
