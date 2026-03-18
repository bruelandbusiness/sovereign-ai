"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/constants";

interface ClientRow {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  createdAt: string;
  subscription: {
    bundleId: string | null;
    monthlyAmount: number;
    status: string;
  } | null;
  servicesCount: number;
}

function bundleVariant(bundleId: string | null) {
  switch (bundleId) {
    case "empire":
      return "default" as const;
    case "growth":
      return "secondary" as const;
    case "starter":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

function bundleLabel(bundleId: string | null) {
  switch (bundleId) {
    case "empire":
      return "Empire";
    case "growth":
      return "Growth";
    case "starter":
      return "Starter";
    default:
      return "Custom";
  }
}

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No clients found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Business
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Owner
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Bundle
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">
                MRR
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground lg:table-cell">
                Services
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground lg:table-cell">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {client.businessName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {client.ownerName}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {client.email}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={bundleVariant(client.subscription?.bundleId ?? null)}>
                    {bundleLabel(client.subscription?.bundleId ?? null)}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-foreground sm:table-cell">
                  {client.subscription
                    ? formatPrice(client.subscription.monthlyAmount / 100)
                    : "--"}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {client.servicesCount}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {new Date(client.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
