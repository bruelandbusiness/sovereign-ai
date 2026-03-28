"use client";

import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FadeInView } from "@/components/shared/FadeInView";
import { getServiceById } from "@/lib/constants";
import { getServiceIcon } from "@/lib/service-icons";
import { cn } from "@/lib/utils";
import type { ServiceId } from "@/types/services";

interface ActiveServicesCardProps {
  /** Service IDs from the API — typed as string[] because the DB stores them as strings */
  serviceIds?: string[];
}

export function ActiveServicesCard({ serviceIds = [] }: ActiveServicesCardProps) {
  return (
    <FadeInView>
      <Card className="card-interactive">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Active Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceIds.length === 0 ? (
            <div className="flex flex-col items-center py-5 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No services active yet</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                Activate your first AI service to start generating results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(serviceIds as ServiceId[]).map((id) => {
                const service = getServiceById(id);
                if (!service) return null;
                const Icon = getServiceIcon(id);

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
          )}

          <Link
            href="/marketplace"
            className="mt-4 flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            {serviceIds.length === 0 ? "Browse services" : "Want to add more?"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
