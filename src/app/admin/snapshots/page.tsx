"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Camera,
  Check,
  Copy,
  Eye,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SnapshotSummary {
  id: string;
  businessName: string;
  vertical: string | null;
  city: string | null;
  state: string | null;
  overallScore: number;
  viewCount: number;
  shareToken: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreGrade(score: number): { grade: string; color: string } {
  if (score >= 80) return { grade: "A", color: "text-emerald-400" };
  if (score >= 60) return { grade: "B", color: "text-blue-400" };
  if (score >= 40) return { grade: "C", color: "text-amber-400" };
  return { grade: "D", color: "text-red-400" };
}

const VERTICALS = [
  { id: "hvac", label: "HVAC" },
  { id: "plumbing", label: "Plumbing" },
  { id: "roofing", label: "Roofing" },
  { id: "electrical", label: "Electrical" },
  { id: "landscaping", label: "Landscaping" },
  { id: "pest_control", label: "Pest Control" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSnapshotsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    businessName: "",
    website: "",
    phone: "",
    email: "",
    vertical: "",
    city: "",
    state: "",
  });

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/snapshots");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ businessName: "", website: "", phone: "", email: "", vertical: "", city: "", state: "" });
        fetchSnapshots();
      }
    } catch {
      // silently fail
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this snapshot?")) return;

    try {
      const res = await fetch(`/api/admin/snapshots/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSnapshots((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  function copyShareUrl(token: string, id: string) {
    const url = `${window.location.origin}/snapshots/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            Snapshot Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate branded prospect audit reports to close more deals.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Snapshot
        </Button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Generate Snapshot Report">
          <div className="w-full max-w-lg rounded-xl border border-white/[0.06] bg-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Generate Snapshot Report</h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="snap-business-name" className="text-xs font-medium text-muted-foreground">
                  Business Name *
                </label>
                <input
                  id="snap-business-name"
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Acme HVAC Services"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="snap-website" className="text-xs font-medium text-muted-foreground">Website</label>
                  <input
                    id="snap-website"
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label htmlFor="snap-phone" className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    id="snap-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="snap-email" className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  id="snap-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="owner@business.com"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="snap-vertical" className="text-xs font-medium text-muted-foreground">Vertical</label>
                  <select
                    id="snap-vertical"
                    value={form.vertical}
                    onChange={(e) => setForm((f) => ({ ...f, vertical: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select...</option>
                    {VERTICALS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="snap-city" className="text-xs font-medium text-muted-foreground">City</label>
                  <input
                    id="snap-city"
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Phoenix"
                  />
                </div>
                <div>
                  <label htmlFor="snap-state" className="text-xs font-medium text-muted-foreground">State</label>
                  <input
                    id="snap-state"
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="AZ"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="flex-1">
                  {isCreating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Generate Snapshot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && snapshots.length === 0 && (
        <Card className="border-white/[0.06]">
          <CardContent className="p-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Snapshots Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Generate a snapshot report for a prospect to create a branded audit they can view online.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Your First Snapshot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Snapshot List */}
      {!isLoading && snapshots.length > 0 && (
        <div className="space-y-3">
          {snapshots.map((snap) => {
            const grade = scoreGrade(snap.overallScore);
            const isCopied = copiedId === snap.id;

            return (
              <Card key={snap.id} className="border-white/[0.06]">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Score Badge */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] shrink-0">
                      <div className="text-center">
                        <p className={`text-lg font-bold ${grade.color}`}>
                          {snap.overallScore}
                        </p>
                        <p className={`text-[10px] font-semibold ${grade.color}`}>
                          {grade.grade}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {snap.businessName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {snap.vertical && (
                          <Badge variant="outline" className="text-[10px]">
                            {VERTICALS.find((v) => v.id === snap.vertical)?.label || snap.vertical}
                          </Badge>
                        )}
                        {(snap.city || snap.state) && (
                          <span className="text-xs text-muted-foreground">
                            {snap.city}{snap.city && snap.state ? ", " : ""}{snap.state}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(snap.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* View Count */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {snap.viewCount}
                    </div>

                    {/* Copy Link */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyShareUrl(snap.shareToken, snap.id)}
                      aria-label={isCopied ? "Link copied" : `Copy share link for ${snap.businessName}`}
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1">{isCopied ? "Copied" : "Copy Link"}</span>
                    </Button>

                    {/* View */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/snapshots/${snap.shareToken}`, "_blank")}
                      aria-label={`View snapshot for ${snap.businessName}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(snap.id)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Delete snapshot for ${snap.businessName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
