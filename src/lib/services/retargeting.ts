import { prisma } from "@/lib/db";

/**
 * Provision the retargeting service for a client.
 * Sets up pixel configuration and creates a default audience segment.
 */
export async function provisionRetargeting(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const defaultConfig = {
    pixelEnabled: true,
    pixelUrl: `${appUrl}/api/services/retargeting/pixel?clientId=${clientId}`,
    trackingEndpoint: `${appUrl}/api/services/retargeting/track`,
    defaultAudiences: [
      {
        name: "All Website Visitors",
        criteria: { daysActive: 30 },
      },
      {
        name: "High-Intent Visitors",
        criteria: { minVisits: 3, daysActive: 14 },
      },
    ],
  };

  // Update the ClientService record with retargeting config
  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "retargeting" } },
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
      type: "ad_optimized",
      title: "Retargeting pixel activated",
      description: `Retargeting pixel is ready for ${client.businessName}. Install the pixel script on your website to start tracking visitors and building audiences.`,
    },
  });
}
