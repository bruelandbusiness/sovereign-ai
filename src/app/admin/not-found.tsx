import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Package,
  HeadphonesIcon,
  ArrowRight,
} from "lucide-react";

const adminLinks = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Support", href: "/admin/support", icon: HeadphonesIcon },
];

export default function AdminNotFound() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center py-20 text-center"
      role="main"
      aria-labelledby="admin-not-found-heading"
    >
      {/* 404 display */}
      <p
        className="text-7xl font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600"
        aria-hidden="true"
      >
        404
      </p>

      <h1
        id="admin-not-found-heading"
        className="mt-4 text-xl font-semibold text-white"
      >
        Page not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The admin page you are looking for does not exist or has been moved. Try
        one of the links below.
      </p>

      {/* Quick navigation */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-5 transition-all hover:border-border hover:bg-secondary/50"
            >
              <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-white" />
              <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-white">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Primary CTA */}
      <div className="mt-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Back to Admin
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
