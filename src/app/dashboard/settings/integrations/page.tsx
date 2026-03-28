"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  Megaphone,
  Facebook,
  Wrench,
  ClipboardList,
  Home,
  Calculator,
  CreditCard,
  ExternalLink,
  Check,
  Plug,
  Loader2,
  X,
  FlaskConical,
  KeyRound,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { useSession } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  oauthUrl: string;
  category: string;
  apiKeyPrefix?: string;
  apiKeyPlaceholder?: string;
}

interface IntegrationState {
  connected: boolean;
  hasApiKey: boolean;
  connectedAt: string | null;
}

// ---------------------------------------------------------------------------
// Static integration definitions (UI-only)
// ---------------------------------------------------------------------------

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    id: "google-business-profile",
    name: "Google Business Profile",
    description:
      "Manage your business listing, respond to reviews, and track local search visibility.",
    icon: <Globe className="h-6 w-6 text-blue-400" />,
    oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth?scope=business",
    category: "Marketing",
    apiKeyPlaceholder: "Enter your API key",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    description:
      "Sync campaign data, automate bid adjustments, and track conversion metrics.",
    icon: <Megaphone className="h-6 w-6 text-yellow-400" />,
    oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth?scope=ads",
    category: "Advertising",
    apiKeyPlaceholder: "Enter your API key",
  },
  {
    id: "meta-facebook-ads",
    name: "Meta / Facebook Ads",
    description:
      "Import ad performance data and manage campaigns from your dashboard.",
    icon: <Facebook className="h-6 w-6 text-blue-500" />,
    oauthUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    category: "Advertising",
    apiKeyPlaceholder: "Enter your access token",
  },
  {
    id: "servicetitan",
    name: "ServiceTitan",
    description:
      "Sync jobs, invoices, and customer data from your ServiceTitan account.",
    icon: <Wrench className="h-6 w-6 text-orange-400" />,
    oauthUrl: "https://auth.servicetitan.io/connect/authorize",
    category: "Field Service",
    apiKeyPlaceholder: "Enter your API key",
  },
  {
    id: "jobber",
    name: "Jobber",
    description:
      "Pull in scheduling, quoting, and client management data automatically.",
    icon: <ClipboardList className="h-6 w-6 text-green-400" />,
    oauthUrl: "https://api.getjobber.com/api/oauth/authorize",
    category: "Field Service",
    apiKeyPlaceholder: "Enter your API key",
  },
  {
    id: "housecall-pro",
    name: "Housecall Pro",
    description:
      "Connect dispatching, estimates, and payment data for seamless automation.",
    icon: <Home className="h-6 w-6 text-teal-400" />,
    oauthUrl: "https://api.housecallpro.com/oauth/authorize",
    category: "Field Service",
    apiKeyPlaceholder: "Enter your API key",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description:
      "Sync invoices, expenses, and financial reports for real-time bookkeeping.",
    icon: <Calculator className="h-6 w-6 text-emerald-400" />,
    oauthUrl: "https://appcenter.intuit.com/connect/oauth2",
    category: "Finance",
    apiKeyPlaceholder: "Enter your API key",
  },
  {
    id: "stripe",
    name: "Stripe",
    description:
      "Track payments, subscriptions, and revenue analytics in one place.",
    icon: <CreditCard className="h-6 w-6 text-purple-400" />,
    oauthUrl: "https://connect.stripe.com/oauth/authorize",
    category: "Finance",
    apiKeyPrefix: "sk_",
    apiKeyPlaceholder: "sk_live_... or sk_test_...",
  },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Not connected
    </span>
  );
}

function LoadingSpinner() {
  return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  useSession();
  const { toast } = useToast();

  // State from the API
  const [stateMap, setStateMap] = useState<Record<string, IntegrationState>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  // Per-card connect form state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});

  // ------------------------------------------------------------------
  // Fetch integration state from backend
  // ------------------------------------------------------------------

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/settings/integrations");
      if (!res.ok) {
        throw new Error("Failed to load integrations");
      }
      const data = await res.json();
      const map: Record<string, IntegrationState> = {};
      for (const item of data.integrations ?? []) {
        map[item.id] = {
          connected: item.connected,
          hasApiKey: item.hasApiKey,
          connectedAt: item.connectedAt,
        };
      }
      setStateMap(map);
    } catch {
      toast("Failed to load integration status", "error");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // ------------------------------------------------------------------
  // Connect an integration
  // ------------------------------------------------------------------

  async function handleConnect(id: string) {
    const apiKey = apiKeyInputs[id]?.trim();
    if (!apiKey) {
      toast("Please enter an API key", "error");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/dashboard/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: id, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to connect", "error");
        return;
      }
      setStateMap((prev) => ({
        ...prev,
        [id]: {
          connected: true,
          hasApiKey: true,
          connectedAt: data.integration?.connectedAt ?? null,
        },
      }));
      setExpandedId(null);
      setApiKeyInputs((prev) => ({ ...prev, [id]: "" }));
      const name =
        INTEGRATION_DEFS.find((d) => d.id === id)?.name ?? id;
      toast(`${name} connected successfully`, "success");
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  // ------------------------------------------------------------------
  // Disconnect an integration
  // ------------------------------------------------------------------

  async function handleDisconnect(id: string) {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/dashboard/settings/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to disconnect", "error");
        return;
      }
      setStateMap((prev) => ({
        ...prev,
        [id]: { connected: false, hasApiKey: false, connectedAt: null },
      }));
      const name =
        INTEGRATION_DEFS.find((d) => d.id === id)?.name ?? id;
      toast(`${name} disconnected`, "info");
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  // ------------------------------------------------------------------
  // Test connection (validate API key format)
  // ------------------------------------------------------------------

  async function handleTestConnection(id: string) {
    const apiKey = apiKeyInputs[id]?.trim();
    if (!apiKey) {
      toast("Please enter an API key to test", "error");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`test-${id}`]: true }));
    try {
      const res = await fetch(
        "/api/dashboard/settings/integrations?action=test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ integrationId: id, apiKey }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Invalid API key format", "error");
        return;
      }
      toast("API key format is valid", "success");
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`test-${id}`]: false }));
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />

      <main className="flex-1 py-10">
        <Container>
          {/* Page heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link
                href="/dashboard/settings/account"
                className="hover:text-foreground transition-colors"
              >
                Settings
              </Link>
              <span>/</span>
              <span className="text-foreground">Integrations</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Integrations
            </h1>
            <p className="mt-1 text-muted-foreground">
              Connect your accounts to unlock full AI automation
            </p>
          </div>

          {/* Integration cards grid */}
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {INTEGRATION_DEFS.map((def) => {
              const state = stateMap[def.id] ?? {
                connected: false,
                hasApiKey: false,
                connectedAt: null,
              };
              const busy = actionLoading[def.id] ?? false;
              const testBusy = actionLoading[`test-${def.id}`] ?? false;
              const isExpanded = expandedId === def.id;

              return (
                <motion.div
                  key={def.id}
                  variants={cardVariants}
                  className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  {/* Icon + status */}
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]">
                      {def.icon}
                    </div>
                    <StatusBadge connected={state.connected} />
                  </div>

                  {/* Name + description */}
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {def.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {def.description}
                  </p>

                  {/* Category tag */}
                  <span className="mt-3 inline-block rounded bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {def.category}
                  </span>

                  {/* Connected at timestamp */}
                  {state.connected && state.connectedAt && (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Connected{" "}
                      {new Date(state.connectedAt).toLocaleDateString()}
                    </p>
                  )}

                  {/* Action area */}
                  <div className="mt-4 space-y-2">
                    {state.connected ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDisconnect(def.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive disabled:opacity-50"
                      >
                        {busy ? (
                          <LoadingSpinner />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Disconnect
                      </button>
                    ) : isExpanded ? (
                      /* Connect form */
                      <div className="space-y-2">
                        <div className="relative">
                          <KeyRound className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="password"
                            placeholder={
                              def.apiKeyPlaceholder ?? "Enter API key"
                            }
                            value={apiKeyInputs[def.id] ?? ""}
                            onChange={(e) =>
                              setApiKeyInputs((prev) => ({
                                ...prev,
                                [def.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleConnect(def.id)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                          >
                            {busy ? (
                              <LoadingSpinner />
                            ) : (
                              <Plug className="h-3.5 w-3.5" />
                            )}
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={testBusy}
                            onClick={() =>
                              handleTestConnection(def.id)
                            }
                            className="flex items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-white/[0.12] hover:text-foreground disabled:opacity-50"
                            title="Test Connection"
                          >
                            {testBusy ? (
                              <LoadingSpinner />
                            ) : (
                              <FlaskConical className="h-3.5 w-3.5" />
                            )}
                            Test
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedId(null)}
                            className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2 text-xs text-muted-foreground transition-colors hover:border-white/[0.12] hover:text-foreground"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedId(def.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <Plug className="h-3.5 w-3.5" />
                        Connect
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
