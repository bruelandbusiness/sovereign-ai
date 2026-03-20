import { prisma } from "@/lib/db";

/**
 * Provision the reputation management service for a client.
 * Sets up monitoring config and seeds initial review campaign data.
 */
export async function provisionReputation(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const defaultConfig = {
    googlePlaceId: null, // Client fills this in later
    yelpBusinessId: null,
    alertOnNegative: true,
    autoRespondPositive: false,
    monitoringEnabled: true,
  };

  // Update the ClientService record with default reputation config
  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "reputation" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(defaultConfig) },
    });
  }

  // Seed an initial review campaign so the dashboard has data
  const existingCampaign = await prisma.reviewCampaign.findFirst({
    where: { clientId },
  });

  if (!existingCampaign) {
    await prisma.reviewCampaign.create({
      data: {
        clientId,
        name: "Welcome Campaign",
        customerName: "Sample Customer",
        customerEmail: "sample@example.com",
        status: "completed",
        rating: 5,
        completedAt: new Date(),
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "review_received",
      title: "Reputation management activated",
      description: `Brand monitoring is now active for ${client.businessName}. Connect your Google Business and Yelp profiles to start tracking reviews.`,
    },
  });
}
