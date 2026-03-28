"use client";

import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import type { Competitor } from "@/lib/comparisons";
import { cn } from "@/lib/utils";

function FeatureValue({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (value === true)
    return (
      <span className={cn("inline-flex items-center justify-center rounded-full p-1", highlight && "bg-[#22d3a1]/10")}>
        <Check className="h-4 w-4 text-[#22d3a1]" aria-label="Yes" />
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center justify-center rounded-full p-1 bg-red-400/5">
        <X className="h-4 w-4 text-red-400/50" aria-label="No" />
      </span>
    );
  return <span className="text-sm font-medium">{value}</span>;
}

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" as const },
  }),
};

export function ComparisonTable({ competitor }: { competitor: Competitor }) {
  const sovereignWins = competitor.features.filter(
    (f) =>
      (f.sovereign === true && f.competitor === false) ||
      (typeof f.sovereign === "string" && f.competitor === false) ||
      (typeof f.sovereign === "string" &&
        typeof f.competitor === "string"),
  ).length;
  const competitorWins = competitor.features.filter(
    (f) => f.competitor === true && f.sovereign === false,
  ).length;

  return (
    <div>
      {/* Score summary */}
      <motion.div
        className="mb-8 grid grid-cols-3 gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-xl border border-[#4c85ff]/20 bg-[#4c85ff]/5 p-4">
          <motion.p
            className="text-3xl font-bold text-[#4c85ff]"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            {sovereignWins}
          </motion.p>
          <p className="mt-1 text-xs text-muted-foreground">Sovereign AI Wins</p>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-lg font-bold text-muted-foreground/30">VS</span>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <motion.p
            className="text-3xl font-bold text-muted-foreground"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.4 }}
          >
            {competitorWins}
          </motion.p>
          <p className="mt-1 text-xs text-muted-foreground">
            {competitor.name} Wins
          </p>
        </div>
      </motion.div>

      {/* Table — scrollable on mobile with sticky feature column */}
      <div
        className="relative overflow-x-auto rounded-xl border border-white/[0.06] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
        role="region"
        aria-label={`Feature comparison between Sovereign AI and ${competitor.name}`}
        tabIndex={0}
      >
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-card px-5 py-4 text-left text-sm font-medium text-muted-foreground min-w-[180px]"
              >
                Feature
              </th>
              <th scope="col" className="px-5 py-4 text-center text-sm font-semibold min-w-[140px]">
                <span className="gradient-text">Sovereign AI</span>
              </th>
              <th scope="col" className="px-5 py-4 text-center text-sm font-medium text-muted-foreground min-w-[140px]">
                {competitor.name}
              </th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {competitor.features.map((feature, i) => {
              const sovereignBetter =
                (feature.sovereign === true && feature.competitor === false) ||
                (typeof feature.sovereign === "string" && feature.competitor === false);
              return (
                <motion.tr
                  key={feature.name}
                  variants={rowVariants}
                  custom={i}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
                    sovereignBetter && "bg-[#4c85ff]/[0.02]",
                  )}
                >
                  <td className="sticky left-0 z-10 bg-card px-5 py-3.5 text-sm font-medium">
                    {feature.name}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <FeatureValue value={feature.sovereign} highlight={sovereignBetter} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <FeatureValue value={feature.competitor} />
                  </td>
                </motion.tr>
              );
            })}
            {/* Pricing row */}
            <motion.tr
              variants={rowVariants}
              custom={competitor.features.length}
              className="bg-white/[0.02]"
            >
              <td className="sticky left-0 z-10 bg-card px-5 py-4 text-sm font-semibold">
                Pricing
              </td>
              <td className="px-5 py-4 text-center text-sm font-semibold gradient-text">
                {competitor.sovereignPrice}
              </td>
              <td className="px-5 py-4 text-center text-sm text-muted-foreground">
                {competitor.priceRange}
              </td>
            </motion.tr>
          </motion.tbody>
        </table>
      </div>

      {/* Price context note */}
      {competitor.priceSavingNote && (
        <motion.p
          className="mt-4 text-center text-sm text-muted-foreground/80 italic"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          {competitor.priceSavingNote}
        </motion.p>
      )}
    </div>
  );
}
