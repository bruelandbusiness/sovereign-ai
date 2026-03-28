"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ClipboardCopy,
  Eye,
  Link2,
  Loader2,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActiveSnapshot {
  id: string;
  token: string;
  shareUrl: string;
  snapshotDate: string;
  expiresAt: string;
  viewCount: number;
}

interface ShareDashboardModalProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareDashboardModal({
  open,
  onClose,
}: ShareDashboardModalProps) {
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<ActiveSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/snapshots");
      if (res.ok) {
        const body = await res.json();
        setSnapshots(body.snapshots ?? []);
      }
    } catch {
      // Silent failure; list will be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSnapshots();
    }
  }, [open, fetchSnapshots]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/dashboard/snapshots", { method: "POST" });
      if (!res.ok) {
        toast("Failed to generate snapshot. Please try again.", "error");
        return;
      }
      const body = await res.json();
      toast("Snapshot created! Copy the link to share.", "success");

      // Add to top of list
      setSnapshots((prev) => [
        {
          id: body.id,
          token: body.token,
          shareUrl: body.shareUrl,
          snapshotDate: new Date().toISOString(),
          expiresAt: body.expiresAt,
          viewCount: 0,
        },
        ...prev,
      ]);
    } catch {
      toast("Failed to generate snapshot.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch("/api/dashboard/snapshots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSnapshots((prev) => prev.filter((s) => s.id !== id));
        toast("Snapshot revoked.", "success");
      } else {
        toast("Failed to revoke snapshot.", "error");
      }
    } catch {
      toast("Failed to revoke snapshot.", "error");
    }
  };

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast("Link copied to clipboard!", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast("Failed to copy link.", "error");
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 id="share-modal-title" className="text-lg font-semibold">
              Share Dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="mb-4 text-sm text-muted-foreground">
            Generate a read-only snapshot of your current dashboard KPIs.
            Anyone with the link can view it. Snapshots expire after 7 days.
          </p>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Generate Snapshot Link
              </>
            )}
          </button>

          {/* Active snapshots */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Active Snapshots
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : snapshots.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No active snapshots. Generate one above.
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {snap.shareUrl}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>
                          Created {formatShortDate(snap.snapshotDate)}
                        </span>
                        <span>
                          Expires {formatShortDate(snap.expiresAt)}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {snap.viewCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(snap.shareUrl, snap.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Copy link"
                      >
                        {copiedId === snap.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <ClipboardCopy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(snap.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Revoke snapshot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
