"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, HelpCircle, Crown } from "lucide-react";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SidebarProps {
  items: NavItem[];
  currentPath: string;
  planName?: string;
}

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 64 },
};

const labelVariants = {
  expanded: { opacity: 1, x: 0, display: "block" as const },
  collapsed: { opacity: 0, x: -8, display: "none" as const },
};

export function Sidebar({ items, currentPath, planName }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        aria-label="Dashboard sidebar"
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06] bg-[var(--bg-secondary)] max-md:hidden"
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-3 shrink-0 overflow-hidden",
            collapsed ? "px-3 py-6 justify-center" : "px-5 py-6",
          )}
        >
          <SovereignLogo variant="mark" size="sm" color="gradient" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-base font-semibold leading-tight font-display"
              >
                Sovereign
                <br />
                <span className="text-xs font-medium text-muted-foreground">
                  Empire
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute top-7 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.1] bg-[var(--bg-tertiary)] text-muted-foreground shadow-md transition-all duration-200 hover:text-foreground hover:bg-[var(--bg-surface)] hover:scale-110"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Navigation */}
        <nav
          aria-label="Dashboard navigation"
          className="flex-1 overflow-y-auto px-2 py-3"
        >
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
              const isActive = currentPath === item.href;
              const isNumericBadge =
                typeof item.badge === "number" ||
                (typeof item.badge === "string" && /^\d+$/.test(item.badge));
              const badgeCount = isNumericBadge ? Number(item.badge) : 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg text-sm transition-all duration-200",
                      collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5",
                      isActive
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#4c85ff] to-[#22d3a1]"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}

                    <span
                      className={cn(
                        "shrink-0 [&>svg]:h-5 [&>svg]:w-5 transition-all duration-200",
                        isActive
                          ? "text-primary"
                          : "group-hover:scale-105",
                      )}
                    >
                      {item.icon}
                    </span>

                    <motion.span
                      variants={labelVariants}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>

                    {/* Numeric count badge */}
                    {isNumericBadge && badgeCount > 0 && !collapsed && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold tabular-nums text-primary ring-1 ring-primary/20">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}

                    {/* String label badge (e.g. "New", "Beta") */}
                    {item.badge && !isNumericBadge && !collapsed && (
                      <span className="ml-auto rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/20">
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed badge dot */}
                    {item.badge && collapsed && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-white/[0.06] px-2 py-3">
          <Link
            href="/dashboard/support"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground",
              collapsed && "justify-center",
            )}
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Support
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Plan info */}
          {planName && !collapsed && (
            <Link
              href="/dashboard/billing"
              className="group mt-1.5 flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary/5 to-transparent px-3 py-2 transition-all hover:from-primary/10"
            >
              <Crown className="h-3.5 w-3.5 text-primary/60 transition-colors group-hover:text-primary" />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-medium text-muted-foreground/80 transition-colors group-hover:text-foreground"
              >
                {planName}
              </motion.span>
            </Link>
          )}
        </div>
      </motion.aside>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Dashboard navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/[0.06] bg-[var(--bg-secondary)]/95 backdrop-blur-lg md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.slice(0, 5).map((item) => {
          const isActive = currentPath === item.href;
          const hasBadge = item.badge != null && item.badge !== "" && item.badge !== 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2.5 text-xs transition-all duration-200 min-h-[48px] justify-center",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#4c85ff] to-[#22d3a1]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative [&>svg]:h-5 [&>svg]:w-5">
                {item.icon}
                {hasBadge && (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-primary-foreground">
                    {typeof item.badge === "number"
                      ? item.badge > 99
                        ? "99+"
                        : item.badge
                      : ""}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export type { NavItem, SidebarProps };
