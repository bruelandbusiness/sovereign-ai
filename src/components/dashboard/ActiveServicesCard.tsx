"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FadeInView } from "@/components/shared/FadeInView";
import { getServiceById } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ServiceId } from "@/types/services";

const GROWTH_SERVICES: ServiceId[] = [
  "lead-gen",
  "voice-agent",
  "seo",
  "email",
  "reviews",
  "crm",
];

export function ActiveServicesCard() {
  return (
    <FadeInView>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Active Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {GROWTH_SERVICES.map((id) => {
              const service = getServiceById(id);
              if (!service) return null;
              const Icon = service.icon;

              return (
                <div
                  key={id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                    service.color
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{service.name.replace("AI ", "")}</span>
                </div>
              );
            })}
          </div>

          <Link
            href="/marketplace"
            className="mt-4 flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Want to add more?
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
