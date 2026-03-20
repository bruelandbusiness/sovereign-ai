"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportPeriod {
  id: string;
  label: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_periods() {
      try {
        const res = await fetch("/api/dashboard/reports");
        if (res.ok) {
          const data = await res.json();
          setPeriods(data.periods);
        }
      } catch {
        toast("We couldn't load your reports. Please refresh the page.", "error");
      } finally {
        setIsLoading(false);
      }
    }
    fetch_periods();
  }, [toast]);

  function openReport(periodId: string) {
    setGeneratingId(periodId);
    // Open the HTML report in a new tab
    window.open(`/api/dashboard/reports/generate?period=${periodId}`, "_blank");
    // Reset generating state after a brief delay
    setTimeout(() => setGeneratingId(null), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8" aria-label="Reports page">
        <Container>
          {/* Header */}
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
                Reports
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Generate branded PDF reports of your marketing performance.
              </p>
            </div>
          </div>

          {/* Info */}
          <Card className="mb-8 border-primary/20 bg-primary/5" role="note">
            <CardContent className="p-5 flex items-start gap-3">
              <Download className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  How it works
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click &quot;Generate Report&quot; to open a branded, print-optimized report in a new tab.
                  Use your browser&apos;s print function (Ctrl+P or Cmd+P) to save it as a PDF.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <div className="py-8" role="status" aria-label="Loading reports">
              <span className="sr-only">Loading available reports...</span>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          )}

          {/* Period Cards */}
          {!isLoading && periods.length === 0 && (
            <Card className="border-white/[0.06]">
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-lg font-semibold mb-2">No Reports Available</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Report periods will appear once enough data has been collected.
                </p>
              </CardContent>
            </Card>
          )}
          {!isLoading && periods.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {periods.map((period) => (
                <Card key={period.id} className="border-white/[0.06]">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h2 className="text-sm font-semibold text-foreground">
                        {period.label}
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      {period.description}
                    </p>
                    <Button
                      onClick={() => openReport(period.id)}
                      disabled={generatingId === period.id}
                      className="w-full"
                      aria-label={generatingId === period.id ? `Generating ${period.label} report` : `Generate ${period.label} report`}
                    >
                      {generatingId === period.id ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      )}
                      {generatingId === period.id ? "Generating..." : "Generate Report"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
