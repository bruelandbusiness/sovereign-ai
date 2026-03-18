"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FadeInView } from "@/components/shared/FadeInView";
import { LeadRow } from "./LeadRow";
import type { DashboardLead } from "@/types/dashboard";

export const DEMO_LEADS: DashboardLead[] = [
  {
    name: "Robert Martinez",
    email: "robert.m@email.com",
    phone: "(602) 555-0134",
    source: "AI Voice Agent",
    date: "Mar 17",
    status: "qualified",
  },
  {
    name: "David Thompson",
    email: "d.thompson@email.com",
    phone: "(480) 555-0198",
    source: "Google Ads",
    date: "Mar 16",
    status: "appointment",
  },
  {
    name: "Michael Brown",
    email: "m.brown@email.com",
    phone: "(623) 555-0276",
    source: "Cold Email",
    date: "Mar 16",
    status: "new",
  },
  {
    name: "Lisa Anderson",
    email: "lisa.a@email.com",
    phone: "(602) 555-0312",
    source: "Google Organic",
    date: "Mar 15",
    status: "won",
  },
  {
    name: "Jennifer Wilson",
    email: "j.wilson@email.com",
    phone: "(480) 555-0421",
    source: "Website Chat",
    date: "Mar 15",
    status: "qualified",
  },
  {
    name: "Chris Davis",
    email: "c.davis@email.com",
    phone: "(623) 555-0189",
    source: "AI Voice Agent",
    date: "Mar 14",
    status: "appointment",
  },
];

interface LeadTableProps {
  leads?: DashboardLead[];
  maxHeight?: string;
}

export function LeadTable({
  leads = DEMO_LEADS,
  maxHeight = "400px",
}: LeadTableProps) {
  return (
    <FadeInView>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="pr-2" style={{ maxHeight }}>
            <div className="space-y-1">
              {leads.map((lead) => (
                <LeadRow key={lead.email} lead={lead} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
