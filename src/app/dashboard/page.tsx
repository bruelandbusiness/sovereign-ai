"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { LeadTable } from "@/components/dashboard/LeadTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ROISection } from "@/components/dashboard/ROISection";
import { ActiveServicesCard } from "@/components/dashboard/ActiveServicesCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import type { ClientProfile } from "@/types/dashboard";

const DEMO_PROFILE: ClientProfile = {
  businessName: "Smith's Heating & Air",
  ownerName: "John Smith",
  initials: "SH",
  city: "Phoenix, AZ",
  vertical: "HVAC",
  plan: "Growth Bundle",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Client header */}
          <DashboardHeader profile={DEMO_PROFILE} />

          {/* Tabs + Sidebar layout */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main content area */}
            <div className="min-w-0">
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="leads">Leads</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="space-y-8">
                    <KPIGrid />

                    <div className="grid gap-6 lg:grid-cols-2">
                      <LeadTable maxHeight="380px" />
                      <ActivityFeed maxHeight="380px" />
                    </div>

                    <ROISection />
                  </div>
                </TabsContent>

                {/* Leads Tab */}
                <TabsContent value="leads">
                  <LeadTable maxHeight="600px" />
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                  <ActivityFeed maxHeight="600px" />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="hidden space-y-6 lg:block">
              <ActiveServicesCard />
              <SubscriptionCard />
            </aside>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
