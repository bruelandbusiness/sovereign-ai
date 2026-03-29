"use client";

import { useState } from "react";
import {
  Plug,
  CheckCircle2,
  CircleDashed,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Integration {
  id: string;
  name: string;
  description: string;
  setupInstructions: string;
  icon: React.ReactNode;
  color: string;
  docsUrl: string;
}

type ConnectionStatus = "connected" | "not_connected" | "testing";

// ---------------------------------------------------------------------------
// Integration definitions
// ---------------------------------------------------------------------------

function GoogleAdsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M2 12h4M18 12h4M12 2v4M12 18v4" />
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function BusinessProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TwilioIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SendGridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

const INTEGRATIONS: Integration[] = [
  {
    id: "google-ads",
    name: "Google Ads",
    description:
      "Connect your Google Ads account to sync campaign performance, cost data, and conversion tracking.",
    setupInstructions:
      "Sign in with your Google account and grant Sovereign AI read access to your Ads data.",
    icon: <GoogleAdsIcon />,
    color: "bg-blue-500/10 text-blue-400",
    docsUrl: "https://ads.google.com",
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    description:
      "Link your Meta (Facebook/Instagram) Ads account for unified ad spend and lead attribution.",
    setupInstructions:
      "Authorize via Facebook Login and select the ad accounts you want to track.",
    icon: <MetaIcon />,
    color: "bg-indigo-500/10 text-indigo-400",
    docsUrl: "https://business.facebook.com",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description:
      "Import website traffic, conversions, and audience data from your GA4 property.",
    setupInstructions:
      "Sign in with Google, then choose the GA4 property linked to your website.",
    icon: <AnalyticsIcon />,
    color: "bg-orange-500/10 text-orange-400",
    docsUrl: "https://analytics.google.com",
  },
  {
    id: "google-business",
    name: "Google Business Profile",
    description:
      "Sync your GBP reviews, search impressions, and local ranking data automatically.",
    setupInstructions:
      "Authenticate with Google and select the business location you want to connect.",
    icon: <BusinessProfileIcon />,
    color: "bg-green-500/10 text-green-400",
    docsUrl: "https://business.google.com",
  },
  {
    id: "twilio",
    name: "Twilio",
    description:
      "Power AI voice agents and SMS campaigns through your Twilio account.",
    setupInstructions:
      "Enter your Twilio Account SID and Auth Token from the Twilio Console.",
    icon: <TwilioIcon />,
    color: "bg-red-500/10 text-red-400",
    docsUrl: "https://console.twilio.com",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description:
      "Send transactional and marketing emails through SendGrid for reliable deliverability.",
    setupInstructions:
      "Generate an API key in your SendGrid dashboard and paste it here.",
    icon: <SendGridIcon />,
    color: "bg-cyan-500/10 text-cyan-400",
    docsUrl: "https://app.sendgrid.com",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntegrationSetup() {
  // In production this would come from the backend; for now use local state.
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>(
    () =>
      Object.fromEntries(
        INTEGRATIONS.map((i) => [i.id, "not_connected" as ConnectionStatus])
      )
  );

  function handleConnect(id: string) {
    // Placeholder: in a real implementation this would open an OAuth flow
    // or an API key modal. For now we simulate a brief "testing" state.
    setStatuses((prev) => ({ ...prev, [id]: "testing" }));
    setTimeout(() => {
      setStatuses((prev) => ({ ...prev, [id]: "connected" }));
    }, 1500);
  }

  function handleTestConnection(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: "testing" }));
    setTimeout(() => {
      // Simulates a successful test — swap to connected
      setStatuses((prev) => ({ ...prev, [id]: "connected" }));
    }, 2000);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main id="main-content" className="flex-1 py-8">
        <Container>
          <div className="max-w-5xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Plug className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display">
                    Integrations &amp; Connections
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Connect your third-party services so Sovereign AI can pull
                    data and automate workflows on your behalf.
                  </p>
                </div>
              </div>
            </div>

            {/* Integration grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {INTEGRATIONS.map((integration) => {
                const status = statuses[integration.id];
                const isConnected = status === "connected";
                const isTesting = status === "testing";

                return (
                  <Card
                    key={integration.id}
                    className={cn(
                      "group relative transition-all",
                      isConnected && "border-emerald-500/20",
                      isTesting && "border-amber-500/20"
                    )}
                  >
                    <CardContent className="flex h-full flex-col p-5">
                      {/* Icon + name + status */}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            integration.color
                          )}
                        >
                          {integration.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold">
                              {integration.name}
                            </h3>
                            {isConnected ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            ) : isTesting ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-400" />
                            ) : (
                              <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </div>

                          {/* Status badge */}
                          <div className="mt-1">
                            {isConnected ? (
                              <Badge variant="qualified">Connected</Badge>
                            ) : isTesting ? (
                              <Badge variant="contacted">Testing...</Badge>
                            ) : (
                              <Badge variant="secondary">Not Connected</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {integration.description}
                      </p>

                      {/* Setup instructions when not connected */}
                      {!isConnected && !isTesting && (
                        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              How to connect:
                            </span>{" "}
                            {integration.setupInstructions}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-auto flex items-center gap-2 pt-4">
                        {isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => handleTestConnection(integration.id)}
                            >
                              Test Connection
                            </Button>
                            <a
                              href={integration.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${integration.name} dashboard`}
                            >
                              <Button variant="ghost" size="sm" className="text-xs">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          </>
                        ) : isTesting ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            disabled
                          >
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Testing...
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => handleConnect(integration.id)}
                            >
                              Connect {integration.name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground"
                              onClick={() =>
                                handleTestConnection(integration.id)
                              }
                            >
                              Test Connection
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
