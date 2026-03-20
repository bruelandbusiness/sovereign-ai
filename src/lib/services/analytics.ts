import { prisma } from "@/lib/db";

/**
 * Provision the analytics dashboard service for a client.
 * Sets up dashboard config and creates an initial snapshot activity.
 */
export async function provisionAnalytics(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const defaultConfig = {
    dashboardEnabled: true,
    roiTrackingEnabled: true,
    weeklyReportEnabled: true,
    channels: [
      "leads",
      "ads",
      "seo",
      "social",
      "email",
      "calls",
      "bookings",
      "reviews",
      "content",
    ],
  };

  // Update the ClientService record with analytics config
  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "analytics" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(defaultConfig) },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "Analytics dashboard activated",
      description: `Real-time analytics dashboard is now live for ${client.businessName}. Track leads, revenue, ROI, and all marketing channels in one place.`,
    },
  });
}
