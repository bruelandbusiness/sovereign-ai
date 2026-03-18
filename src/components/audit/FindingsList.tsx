"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import { FindingCard } from "./FindingCard";
import type { Finding, FindingSeverity } from "@/types/audit";

const severityOrder: FindingSeverity[] = ["critical", "warning", "good"];

interface FindingsListProps {
  findings: Finding[];
}

export function FindingsList({ findings }: FindingsListProps) {
  const sorted = [...findings].sort(
    (a, b) =>
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3"
    >
      {sorted.map((finding, i) => (
        <FindingCard key={`${finding.title}-${i}`} finding={finding} />
      ))}
    </motion.div>
  );
}
