"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { Container } from "./Container";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-context";

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
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <SovereignLogo variant="wordmark" size="sm" />
          </Link>

          {variant === "minimal" && (
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to site
            </Link>
          )}

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

              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {user ? "Dashboard" : "Client Login"}
                </Link>
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
                <Link
                  href={user ? "/dashboard" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {user ? "Dashboard" : "Client Login"}
                </Link>
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
