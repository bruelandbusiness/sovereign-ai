"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Copy, Check, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-context";

interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  _count: { usageLogs: number };
}

export default function MCPAdminPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const { toast } = useToast();

  async function loadKeys() {
    try {
      const res = await fetch("/api/mcp/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      } else {
        toast("We couldn't load your API keys. Please refresh the page.", "error");
      }
    } catch {
      toast("Connection issue while loading API keys. Please check your internet and try again.", "error");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadKeys();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createKey() {
    const name = prompt("API key name:");
    if (!name) return;

    try {
      const res = await fetch("/api/mcp/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          accountId: "admin",
          scopes: ["client.read", "intelligence.read", "agency.read"],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        loadKeys();
      } else {
        toast("We couldn't create the API key. Please try again.", "error");
      }
    } catch {
      toast("Connection issue while creating the API key. Please check your internet and try again.", "error");
    }
  }

  async function revokeKey(keyId: string, keyName: string) {
    if (!confirm(`Revoke API key "${keyName}"? This cannot be undone.`)) return;

    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/mcp/keys/${keyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("API key revoked.", "success");
        loadKeys();
      } else {
        toast("We couldn't revoke the API key. Please try again.", "error");
      }
    } catch {
      toast("Connection issue while revoking the API key. Please check your internet and try again.", "error");
    } finally {
      setRevokingId(null);
    }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-foreground">MCP API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage API keys for MCP tool access.
          </p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" aria-hidden="true" />
            MCP API Keys
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for MCP tool access
          </p>
        </div>
        <Button onClick={createKey}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Key
        </Button>
      </div>

      {/* New Key Banner */}
      {newKey && (
        <Card className="border-amber-500/20 bg-amber-500/5" role="alert">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-400 mb-2">
              New API Key (save now — won&apos;t be shown again)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-black/50 px-3 py-2 font-mono text-sm break-all">
                {newKey}
              </code>
              <Button variant="outline" size="sm" onClick={copyKey} aria-label={copied ? "Copied" : "Copy API key"}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key List */}
      <div className="space-y-3">
        {keys.map((key) => (
          <Card key={key.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{key.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {key.scopes.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {key._count.usageLogs} requests &middot;
                    {key.lastUsedAt
                      ? ` Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                      : " Never used"}{" "}
                    &middot; Created{" "}
                    {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {key.revokedAt ? (
                    <Badge
                      variant="outline"
                      className="bg-red-500/10 text-red-400 border-red-500/20"
                    >
                      Revoked
                    </Badge>
                  ) : (
                    <>
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      >
                        Active
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeKey(key.id, key.name)}
                        disabled={revokingId === key.id}
                        className="text-red-400 hover:text-red-300"
                        aria-label={`Revoke API key ${key.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {keys.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No API keys yet. Click &quot;Create Key&quot; above to generate your first API key for MCP tool access.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
