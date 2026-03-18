"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CaseStudy } from "@/lib/case-studies";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Link href={`/results/${study.slug}`}>
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="flex h-full flex-col p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {study.vertical}
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
              {study.bundle} Bundle
            </span>
          </div>

          <h3 className="font-display text-xl font-bold">{study.headline}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{study.business} — {study.location}</p>
          <p className="mt-3 flex-1 text-sm text-muted-foreground">{study.excerpt}</p>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
            <div>
              <p className="text-2xl font-bold text-primary">{study.heroStat}</p>
              <p className="text-xs text-muted-foreground">{study.heroLabel}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              Read Case Study
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
