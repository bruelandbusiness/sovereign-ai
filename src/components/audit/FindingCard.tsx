"use client";

import { motion } from "framer-motion";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { staggerItem } from "@/lib/animations";
import type { Finding } from "@/types/audit";

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="group rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h4 className="font-display text-sm font-semibold leading-snug">
          {finding.title}
        </h4>
        <SeverityBadge severity={finding.severity} className="shrink-0" />
      </div>

      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
        {finding.description}
      </p>

      <div className="rounded-lg bg-muted/50 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          <span className="mr-1.5 uppercase tracking-wider text-foreground/60">Impact:</span>
          {finding.impact}
        </p>
      </div>
    </motion.div>
  );
}
