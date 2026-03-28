"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import type { ProductListItem } from "@/types/products";
import { TierBadge } from "./TierBadge";
import { ProductPriceDisplay } from "./ProductPriceDisplay";
import { StarRating } from "./StarRating";
import { GradientButton } from "@/components/shared/GradientButton";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductListItem;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  // features may arrive as a JSON string from the API — ensure it's always an array
  const features: string[] = Array.isArray(product.features)
    ? product.features
    : (() => { try { return JSON.parse(product.features as unknown as string); } catch { return []; } })();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/products/${product.slug}`}
        aria-label={`${product.name} — ${product.tagline}`}
        className={cn(
          "group relative flex h-full flex-col rounded-xl border glass-card p-6 transition-all duration-300",
          "hover:-translate-y-2 hover:shadow-xl hover:shadow-[#4c85ff]/8",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          product.isFeatured
            ? "border-primary/40 hover:border-primary/60 ring-1 ring-primary/20"
            : "border-border/60 hover:border-primary/30"
        )}
      >
        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute -top-2.5 right-4">
            <span className="inline-flex items-center rounded-full gradient-bg px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Featured
            </span>
          </div>
        )}

        {/* Header: Tier badge + name */}
        <div className="mb-3">
          <TierBadge tier={product.tier} size="sm" />
        </div>

        <h3 className="text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {product.tagline}
        </p>

        {/* Rating & sales */}
        <div className="mt-4 flex items-center gap-3">
          <StarRating rating={product.rating} size="sm" />
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount}<span className="sr-only"> reviews</span>)
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" aria-hidden="true" />
            {formatNumber(product.salesCount)} sold
          </div>
        </div>

        {/* Price */}
        <div className="mt-4 flex-1">
          <ProductPriceDisplay
            price={product.price}
            comparePrice={product.comparePrice}
            size="sm"
          />
        </div>

        {/* Feature pills */}
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Key features">
          {features.slice(0, 3).map((feature) => (
            <li
              key={feature}
              className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground line-clamp-1"
            >
              {feature.length > 30 ? feature.slice(0, 30) + "..." : feature}
            </li>
          ))}
          {features.length > 3 && (
            <li className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              +{features.length - 3} more
            </li>
          )}
        </ul>

        {/* CTA */}
        <div className="mt-5 border-t border-border/40 pt-4">
          <GradientButton
            size="sm"
            variant="outline"
            className="w-full group-hover:gradient-bg group-hover:text-white group-hover:border-transparent transition-all"
            tabIndex={-1}
            aria-hidden="true"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </GradientButton>
        </div>
      </Link>
    </motion.article>
  );
}
