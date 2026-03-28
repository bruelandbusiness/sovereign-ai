"use client";

import Link from "next/link";
import { ChevronRight, LayoutDashboard } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation for admin pages.
 *
 * Usage:
 *   <AdminBreadcrumbs items={[
 *     { label: "Clients", href: "/admin/clients" },
 *     { label: "Acme Corp" },
 *   ]} />
 */
export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Admin</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <span key={idx} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            {isLast || !item.href ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-foreground truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
