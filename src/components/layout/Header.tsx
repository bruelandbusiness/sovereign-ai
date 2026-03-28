"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { Container } from "./Container";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-context";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
  { href: "/free-audit", label: "Free Audit" },
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
  const router = useRouter();
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on Escape and return focus to toggle
  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
    mobileToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMobileMenu();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, closeMobileMenu]);

  // Focus the first link when mobile menu opens
  useEffect(() => {
    if (mobileOpen && mobileNavRef.current) {
      const firstLink = mobileNavRef.current.querySelector<HTMLElement>("a, button");
      if (firstLink) {
        // Small delay to let the animation start
        requestAnimationFrame(() => firstLink.focus());
      }
    }
  }, [mobileOpen]);

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
              <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
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
                <button
                  onClick={() => router.push("/search")}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
                {user && <NotificationBell />}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {user ? "Dashboard" : "Client Login"}
                </Link>
                {onCtaClick ? (
                  <Button
                    onClick={onCtaClick}
                    className="gradient-bg text-white hover:opacity-90"
                  >
                    {ctaLabel}
                  </Button>
                ) : (
                  <Link href="/strategy-call">
                    <Button className="gradient-bg text-white hover:opacity-90">
                      {ctaLabel}
                    </Button>
                  </Link>
                )}
              </div>

              <button
                ref={mobileToggleRef}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-11 w-11 items-center justify-center rounded-md md:hidden -mr-2 active:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </>
          )}
        </div>

        <AnimatePresence>
          {variant === "default" && mobileOpen && (
            <motion.nav
              id="mobile-nav"
              aria-label="Mobile navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border/40 md:hidden"
            >
              <div ref={mobileNavRef} className="pb-4 pt-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => closeMobileMenu()}
                      className={cn(
                        "block py-3.5 text-base text-muted-foreground transition-colors hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <Link
                  href="/search"
                  onClick={() => closeMobileMenu()}
                  className="flex items-center gap-2 py-3.5 text-base text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Search
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => closeMobileMenu()}
                    className="block py-3.5 text-base text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href={user ? "/dashboard" : "/login"}
                  onClick={() => closeMobileMenu()}
                  className="block py-3.5 text-base font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {user ? "Dashboard" : "Client Login"}
                </Link>
                {onCtaClick ? (
                  <Button
                    onClick={() => {
                      closeMobileMenu();
                      onCtaClick();
                    }}
                    className="mt-2 w-full gradient-bg text-white btn-shine"
                  >
                    {ctaLabel}
                  </Button>
                ) : (
                  <Link
                    href="/strategy-call"
                    onClick={() => closeMobileMenu()}
                    className="mt-2 block"
                  >
                    <Button className="w-full gradient-bg text-white btn-shine">
                      {ctaLabel}
                    </Button>
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}
