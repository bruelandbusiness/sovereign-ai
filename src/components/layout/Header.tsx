"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/audit", label: "Free Audit" },
  { href: "/marketplace", label: "Marketplace" },
];

interface HeaderProps {
  variant?: "default" | "minimal";
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function Header({
  variant = "default",
  ctaLabel = "Book Strategy Call",
  onCtaClick,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              SOVEREIGN AI
            </span>
          </Link>

          {variant === "default" && (
            <>
              <nav className="hidden items-center gap-6 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden md:block">
                <Button
                  onClick={onCtaClick}
                  className="gradient-bg text-white hover:opacity-90"
                >
                  {ctaLabel}
                </Button>
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>

        <AnimatePresence>
          {variant === "default" && mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border/40 md:hidden"
            >
              <div className="pb-4 pt-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    onCtaClick?.();
                  }}
                  className="mt-2 w-full gradient-bg text-white btn-shine"
                >
                  {ctaLabel}
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}
