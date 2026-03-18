"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { ArrowLeft, Copy, Check, MessageSquare, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// ── Types ────────────────────────────────────────────────────

interface ChatbotConfig {
  id: string;
  greeting: string;
  systemPrompt: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  leadCaptured: boolean;
  messageCount: number;
  createdAt: string;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Component ────────────────────────────────────────────────

export function ChatbotDashboard() {
  const {
    data: config,
    error: configError,
    isLoading: configLoading,
  } = useSWR<ChatbotConfig>("/api/services/chatbot/config", fetcher);

  const {
    data: conversations,
    error: convsError,
    isLoading: convsLoading,
  } = useSWR<Conversation[]>(
    "/api/services/chatbot/conversations",
    fetcher
  );

  const [greeting, setGreeting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derive the displayed greeting from local state or fetched config
  const displayGreeting = greeting ?? config?.greeting ?? "";

  async function handleSaveGreeting() {
    if (!config) return;
    setIsSaving(true);
    try {
      await fetch("/api/services/chatbot/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greeting: displayGreeting }),
      });
      await mutate("/api/services/chatbot/config");
      setGreeting(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!config) return;
    await fetch("/api/services/chatbot/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !config.isActive }),
    });
    await mutate("/api/services/chatbot/config");
  }

  function handleCopyEmbed() {
    if (!config) return;
    const snippet = `<script src="${window.location.origin}/embed/chatbot.js" data-chatbot-id="${config.id}"></script>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Loading / Error states ─────────────────────────────────

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading chatbot configuration...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load chatbot configuration. Make sure the chatbot service is provisioned.
        </p>
      </div>
    );
  }

  if (!config) return null;

  // ── Embed code snippet ─────────────────────────────────────

  const embedSnippet = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/chatbot.js" data-chatbot-id="${config.id}"></script>`;

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">AI Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Configure your website chatbot and view conversations
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={config.isActive ? "default" : "secondary"}>
            {config.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="chatbot-active">Chatbot Active</Label>
              <Switch
                id="chatbot-active"
                checked={config.isActive}
                onCheckedChange={handleToggleActive}
              />
            </div>

            {/* Greeting */}
            <div className="space-y-2">
              <Label htmlFor="chatbot-greeting">Greeting Message</Label>
              <Textarea
                id="chatbot-greeting"
                value={displayGreeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={3}
                placeholder="Enter a greeting message..."
              />
              {greeting !== null && greeting !== config.greeting && (
                <Button
                  size="sm"
                  onClick={handleSaveGreeting}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Greeting"}
                </Button>
              )}
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="chatbot-color">Primary Color</Label>
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg border border-border"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <Input
                  id="chatbot-color"
                  value={config.primaryColor}
                  disabled
                  className="max-w-[140px] font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embed Code Card */}
        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add this script tag to your website&apos;s HTML to embed the chatbot widget.
            </p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed">
                <code>{embedSnippet}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute right-2 top-2"
                onClick={handleCopyEmbed}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Chatbot ID:</span>{" "}
                <code className="font-mono">{config.id}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {convsLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading conversations...
            </p>
          )}

          {convsError && (
            <p className="py-8 text-center text-sm text-destructive">
              Failed to load conversations.
            </p>
          )}

          {!convsLoading && !convsError && conversations && conversations.length === 0 && (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No conversations yet. Once visitors start chatting, they will appear here.
              </p>
            </div>
          )}

          {!convsLoading && !convsError && conversations && conversations.length > 0 && (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {conv.visitorName || "Anonymous Visitor"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conv.visitorEmail || "No email captured"}
                      {" -- "}
                      {conv.messageCount} message{conv.messageCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {conv.leadCaptured && (
                      <Badge variant="default" className="mb-1">
                        Lead
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
