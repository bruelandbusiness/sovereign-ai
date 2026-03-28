"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { UserPlus, FileText, BarChart3, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FadeInView } from "@/components/shared/FadeInView";
import { cn } from "@/lib/utils";

const ShareDashboardModal = dynamic(
  () =>
    import("@/components/dashboard/ShareDashboardModal").then(
      (m) => m.ShareDashboardModal,
    ),
  { ssr: false },
);

interface QuickAction {
  href?: string;
  icon: typeof UserPlus;
  label: string;
  description: string;
  color: string;
  borderHover: string;
  onClick?: () => void;
}

export function QuickActionsBar() {
  const [showShareModal, setShowShareModal] = useState(false);

  const QUICK_ACTIONS: QuickAction[] = [
    {
      href: "/dashboard/crm",
      icon: UserPlus,
      label: "Add Lead",
      description: "Capture a new contact",
      color: "bg-blue-500/10 text-blue-400 group-hover/qa:bg-blue-500/20",
      borderHover: "hover:border-blue-500/30",
    },
    {
      href: "/dashboard/invoices",
      icon: FileText,
      label: "Create Invoice",
      description: "Bill a customer",
      color: "bg-emerald-500/10 text-emerald-400 group-hover/qa:bg-emerald-500/20",
      borderHover: "hover:border-emerald-500/30",
    },
    {
      href: "/dashboard/reports",
      icon: BarChart3,
      label: "View Reports",
      description: "See analytics",
      color: "bg-purple-500/10 text-purple-400 group-hover/qa:bg-purple-500/20",
      borderHover: "hover:border-purple-500/30",
    },
    {
      icon: Share2,
      label: "Share Dashboard",
      description: "Send a snapshot",
      color: "bg-pink-500/10 text-pink-400 group-hover/qa:bg-pink-500/20",
      borderHover: "hover:border-pink-500/30",
      onClick: () => setShowShareModal(true),
    },
  ];

  return (
    <>
      <FadeInView delay={0.15}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const cardContent = (
              <Card
                className={cn(
                  "group/qa cursor-pointer border-border/50 transition-all duration-200",
                  "hover:shadow-md hover:shadow-primary/5",
                  action.borderHover,
                )}
              >
                <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                      action.color,
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {action.label}
                    </p>
                    <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );

            if (action.onClick) {
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="text-left"
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <Link key={action.href} href={action.href!}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </FadeInView>

      <ShareDashboardModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
