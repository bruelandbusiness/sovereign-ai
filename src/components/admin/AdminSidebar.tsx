"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, Zap, LifeBuoy, Target, Building2, Monitor, ShoppingBag, Camera, FileText, Cpu, Menu, X, ScrollText } from "lucide-react";
import { useSession } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/sales-toolkit", label: "Sales Toolkit", icon: Target },
  { href: "/admin/agencies", label: "Agencies", icon: Building2 },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/monitoring", label: "Monitoring", icon: Monitor },
  { href: "/admin/snapshots", label: "Snapshots", icon: Camera },
  { href: "/admin/api-docs", label: "API Docs", icon: FileText },
  { href: "/admin/mcp", label: "MCP Tools", icon: Cpu },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close mobile drawer on route change. The setState call inside the effect
  // is intentional: pathname is external state from Next.js navigation and
  // there is no event callback to hook into.
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pathname change is an external navigation event
      setMobileOpen(false);
    }
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close on Escape
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobile();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, closeMobile]);

  const sidebarContent = (
    <>
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Sovereign AI
            </span>
            <p className="text-[11px] leading-none text-muted-foreground">
              Admin Panel
            </p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={closeMobile}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-white/[0.06] p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center border-b border-white/[0.06] bg-secondary/80 px-4 backdrop-blur-sm md:hidden">
        <button
          ref={toggleRef}
          onClick={() => setMobileOpen(true)}
          className="mr-3 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold tracking-tight">Admin</span>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile slide-out sidebar */}
      <aside
        ref={navRef}
        role="dialog"
        aria-modal={mobileOpen ? "true" : undefined}
        aria-label="Admin navigation"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/[0.06] bg-secondary/95 backdrop-blur-md shadow-2xl transition-transform duration-200 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-white/[0.06] bg-secondary/50 md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
