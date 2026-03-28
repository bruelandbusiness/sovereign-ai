"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  /** Lucide icon component to render inside the illustration area */
  icon: LucideIcon;
  /** Headline text */
  title: string;
  /** Supporting description text */
  description: string;
  /** Label for the primary CTA button */
  actionLabel?: string;
  /** If provided, primary CTA renders as a Next.js Link to this href */
  actionHref?: string;
  /** Click handler for the primary CTA (ignored when actionHref is set) */
  onAction?: () => void;
  /** Label for optional secondary action */
  secondaryLabel?: string;
  /** Href for the optional secondary action */
  secondaryHref?: string;
  /** Click handler for optional secondary action */
  onSecondaryAction?: () => void;
  /** Visual variant — "default" uses a soft icon ring, "celebration" adds confetti-style accents */
  variant?: "default" | "celebration";
}

// ---------------------------------------------------------------------------
// SVG illustrations
// ---------------------------------------------------------------------------

/** Decorative concentric rings behind the icon */
function DefaultIllustration({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
      {/* Outer ring */}
      <svg
        className="absolute inset-0 h-full w-full text-primary/[0.06]"
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="48" cy="48" r="47" stroke="currentColor" strokeWidth="1" />
      </svg>
      {/* Middle ring */}
      <svg
        className="absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)] text-primary/[0.10]"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="40" cy="40" r="39" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
      {/* Icon container */}
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Celebration variant with sparkle accents */
function CelebrationIllustration({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
      {/* Sparkle accents */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
      >
        {/* Top-right sparkle */}
        <path d="M72 16l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor" className="text-amber-400/60" />
        {/* Top-left sparkle */}
        <path d="M20 20l1.5 4.5L26 26l-4.5 1.5L20 32l-1.5-4.5L14 26l4.5-1.5z" fill="currentColor" className="text-emerald-400/50" />
        {/* Bottom-right sparkle */}
        <path d="M76 68l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="currentColor" className="text-blue-400/50" />
        {/* Bottom-left sparkle */}
        <path d="M18 70l1.5 4.5L24 76l-4.5 1.5L18 82l-1.5-4.5L12 76l4.5-1.5z" fill="currentColor" className="text-violet-400/40" />
        {/* Center-top tiny sparkle */}
        <path d="M48 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="currentColor" className="text-primary/40" />
      </svg>
      {/* Glowing ring */}
      <svg
        className="absolute inset-0 h-full w-full text-emerald-400/[0.12]"
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {/* Icon container with celebration color */}
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <Icon className="h-7 w-7 text-emerald-400" aria-hidden="true" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  onSecondaryAction,
  variant = "default",
}: EmptyStateProps) {
  const Illustration =
    variant === "celebration" ? CelebrationIllustration : DefaultIllustration;

  const primaryButton = actionLabel ? (
    actionHref ? (
      <Link href={actionHref}>
        <Button className="min-h-[44px]">{actionLabel}</Button>
      </Link>
    ) : onAction ? (
      <Button className="min-h-[44px]" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null
  ) : null;

  const secondaryButton = secondaryLabel ? (
    secondaryHref ? (
      <Link href={secondaryHref}>
        <Button variant="outline" size="sm" className="min-h-[44px]">
          {secondaryLabel}
        </Button>
      </Link>
    ) : onSecondaryAction ? (
      <Button
        variant="outline"
        size="sm"
        className="min-h-[44px]"
        onClick={onSecondaryAction}
      >
        {secondaryLabel}
      </Button>
    ) : null
  ) : null;

  return (
    <Card className="border-white/[0.06] empty-state-enter">
      <div className="py-16 px-6 text-center">
        <Illustration icon={icon} />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        {(primaryButton || secondaryButton) && (
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {primaryButton}
            {secondaryButton}
          </div>
        )}
      </div>
    </Card>
  );
}
