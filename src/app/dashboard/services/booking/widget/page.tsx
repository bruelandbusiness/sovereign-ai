"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Code,
  Palette,
  Eye,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-context";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookingWidgetPage() {
  const { user } = useSession();
  const clientId = user?.client?.id || "YOUR_CLIENT_ID";
  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://app.sovereign-ai.com";

  const [copied, setCopied] = useState(false);
  const [buttonText, setButtonText] = useState("Book Now");
  const [color, setColor] = useState("#4c85ff");
  const [position, setPosition] = useState<"left" | "right">("right");

  const embedCode = `<script src="${appUrl}/embed/booking.js" data-client-id="${clientId}" data-button-text="${buttonText}" data-color="${color}" data-position="${position}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Booking Widget Setup</h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Configuration */}
            <div className="space-y-6">
              {/* Customization Options */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Customize Widget</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="sov-cfg-btn-text" className="text-sm font-medium text-muted-foreground">
                        Button Text
                      </label>
                      <Input
                        id="sov-cfg-btn-text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Book Now"
                      />
                    </div>

                    <div>
                      <label htmlFor="sov-cfg-color-hex" className="text-sm font-medium text-muted-foreground">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="h-10 w-16 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer"
                          aria-label="Pick primary color"
                        />
                        <Input
                          id="sov-cfg-color-hex"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          placeholder="#4c85ff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground" id="sov-cfg-position-label">
                        Position
                      </label>
                      <div className="flex gap-2 mt-1" role="group" aria-labelledby="sov-cfg-position-label">
                        {(["left", "right"] as const).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setPosition(pos)}
                            aria-pressed={position === pos}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                              position === pos
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-white/[0.06] text-muted-foreground hover:border-white/20"
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Embed Code */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Embed Code</h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    Add this code to your website, just before the closing{" "}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs">
                      &lt;/body&gt;
                    </code>{" "}
                    tag.
                  </p>

                  <div className="relative">
                    <pre className="rounded-lg bg-black/40 border border-white/[0.06] p-4 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all">
                      {embedCode}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                      aria-label={copied ? "Copied to clipboard" : "Copy embed code"}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div>
              <Card className="border-white/[0.06] sticky top-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Preview</h2>
                  </div>

                  <div className="relative rounded-lg border border-white/[0.06] bg-zinc-900 h-[500px] overflow-hidden">
                    {/* Mock website content */}
                    <div className="p-6 space-y-4">
                      <div className="h-8 w-40 rounded bg-white/[0.06]" />
                      <div className="h-4 w-full rounded bg-white/[0.04]" />
                      <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
                      <div className="h-4 w-5/6 rounded bg-white/[0.04]" />
                      <div className="h-32 w-full rounded bg-white/[0.03]" />
                      <div className="h-4 w-2/3 rounded bg-white/[0.04]" />
                    </div>

                    {/* Widget preview */}
                    <div
                      className="absolute bottom-4 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg"
                      style={{
                        backgroundColor: color,
                        [position]: "16px",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                      {buttonText}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground text-center">
                    The widget will appear as a floating button on your website
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
