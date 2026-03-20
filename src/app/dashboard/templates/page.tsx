"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Monitor,
  Share2,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateSummary {
  id: string;
  category: string;
  vertical: string;
  name: string;
  description: string;
  tags: string[];
  usageCount: number;
}

interface TemplateDetail extends TemplateSummary {
  content: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "email_sequence", label: "Email Sequence" },
  { id: "social_calendar", label: "Social Calendar" },
  { id: "ad_campaign", label: "Ad Campaign" },
  { id: "chatbot_script", label: "Chatbot Script" },
  { id: "landing_page", label: "Landing Page" },
];

const VERTICALS = [
  { id: "all", label: "All Verticals" },
  { id: "hvac", label: "HVAC" },
  { id: "plumbing", label: "Plumbing" },
  { id: "roofing", label: "Roofing" },
  { id: "electrical", label: "Electrical" },
  { id: "landscaping", label: "Landscaping" },
  { id: "pest_control", label: "Pest Control" },
];

const CATEGORY_ICONS: Record<string, typeof Mail> = {
  email_sequence: Mail,
  social_calendar: Share2,
  ad_campaign: Megaphone,
  chatbot_script: MessageSquare,
  landing_page: Monitor,
};

const CATEGORY_COLORS: Record<string, string> = {
  email_sequence: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  social_calendar: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  ad_campaign: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  chatbot_script: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  landing_page: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [vertical, setVertical] = useState("all");

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDetail | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Apply state
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{ id: string; message: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (vertical !== "all") params.set("vertical", vertical);
      const res = await fetch(`/api/templates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch {
      toast("We couldn't load the templates. Please refresh the page.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [category, vertical, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function openPreview(id: string) {
    setIsPreviewLoading(true);
    setPreviewTemplate(null);
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewTemplate(data);
      }
    } catch {
      toast("We couldn't load the template preview. Please try again.", "error");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function applyTemplate(id: string) {
    setApplyingId(id);
    setApplyResult(null);
    try {
      const res = await fetch(`/api/templates/${id}/apply`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setApplyResult({
          id,
          message: data.type === "landing_page"
            ? "Landing page content ready — check the preview."
            : `Applied successfully! Created ${data.count || 1} item(s).`,
        });
        // Refresh to update usage counts
        fetchTemplates();
      } else {
        const err = await res.json();
        setApplyResult({ id, message: err.error || "Failed to apply template." });
      }
    } catch {
      setApplyResult({ id, message: "Failed to apply template." });
    } finally {
      setApplyingId(null);
    }
  }

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.id === cat)?.label || cat;

  const getVerticalLabel = (vert: string) =>
    VERTICALS.find((v) => v.id === vert)?.label || vert;

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
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Template Library
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Pre-built marketing playbooks by industry. Apply to your account in one click.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-8">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    category === cat.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-white/[0.06]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Vertical filter */}
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              aria-label="Filter by vertical"
              className="rounded-md border border-white/[0.06] bg-secondary/50 px-3 py-1.5 text-sm text-foreground"
            >
              {VERTICALS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20" role="status" aria-label="Loading templates">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Templates Grid */}
          {!isLoading && templates.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">
                No templates match your current filters. Try selecting a different category or industry.
              </p>
            </div>
          )}

          {!isLoading && templates.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => {
                const Icon = CATEGORY_ICONS[t.category] || BookOpen;
                const colorClass = CATEGORY_COLORS[t.category] || "bg-zinc-500/10 text-zinc-400";
                const isApplied = applyResult?.id === t.id;

                return (
                  <Card key={t.id} className="border-white/[0.06] flex flex-col">
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge variant="outline" className={`text-xs ${colorClass}`}>
                          <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
                          {getCategoryLabel(t.category)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t.usageCount} used
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {t.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 flex-1 line-clamp-2">
                        {t.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        <Badge variant="secondary" className="text-[10px]">
                          {getVerticalLabel(t.vertical)}
                        </Badge>
                        {t.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPreview(t.id)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          disabled={applyingId === t.id}
                          onClick={() => applyTemplate(t.id)}
                          className="flex-1"
                        >
                          {applyingId === t.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : isApplied ? (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          ) : null}
                          {isApplied ? "Applied" : "Apply to My Account"}
                        </Button>
                      </div>

                      {isApplied && (
                        <p className="mt-2 text-xs text-emerald-400">
                          {applyResult.message}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </main>

      {/* Preview Modal */}
      {(previewTemplate || isPreviewLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={previewTemplate ? `Preview: ${previewTemplate.name}` : "Loading template preview"}
        >
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/[0.06] bg-secondary p-6">
            <button
              onClick={() => {
                setPreviewTemplate(null);
                setIsPreviewLoading(false);
              }}
              aria-label="Close preview"
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {isPreviewLoading && (
              <div className="flex items-center justify-center py-12" role="status" aria-label="Loading preview">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {previewTemplate && (
              <>
                <h2 className="text-lg font-bold text-foreground pr-8">
                  {previewTemplate.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {previewTemplate.description}
                </p>
                <div className="mt-4 rounded-lg border border-white/[0.06] bg-background p-4">
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono max-h-96 overflow-y-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(previewTemplate.content), null, 2);
                      } catch {
                        return previewTemplate.content;
                      }
                    })()}
                  </pre>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      applyTemplate(previewTemplate.id);
                      setPreviewTemplate(null);
                    }}
                  >
                    Apply to My Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
