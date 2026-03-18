"use client";

import { Check, X, Minus } from "lucide-react";
import type { Competitor } from "@/lib/comparisons";

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-5 w-5 text-accent" />;
  if (value === false) return <X className="h-5 w-5 text-red-400/60" />;
  return <span className="text-sm font-medium">{value}</span>;
}

export function ComparisonTable({ competitor }: { competitor: Competitor }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border/50">
            <th className="py-4 text-left text-sm font-medium text-muted-foreground">
              Feature
            </th>
            <th className="py-4 text-center text-sm font-semibold text-primary">
              Sovereign AI
            </th>
            <th className="py-4 text-center text-sm font-medium text-muted-foreground">
              {competitor.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {competitor.features.map((feature) => (
            <tr
              key={feature.name}
              className="border-b border-border/30 transition-colors hover:bg-muted/30"
            >
              <td className="py-3 text-sm">{feature.name}</td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center justify-center">
                  <FeatureValue value={feature.sovereign} />
                </span>
              </td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center justify-center">
                  <FeatureValue value={feature.competitor} />
                </span>
              </td>
            </tr>
          ))}
          <tr className="border-b border-border/50">
            <td className="py-4 text-sm font-semibold">Pricing</td>
            <td className="py-4 text-center text-sm font-semibold text-primary">
              {competitor.sovereignPrice}
            </td>
            <td className="py-4 text-center text-sm text-muted-foreground">
              {competitor.priceRange}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
