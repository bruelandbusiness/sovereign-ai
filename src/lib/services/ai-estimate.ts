import { prisma } from "@/lib/db";
import { createNotificationForClient } from "@/lib/notifications";

/**
 * Provision the AI Photo Estimating service for a client.
 * Configures the estimate widget settings and creates a sample estimate
 * so the dashboard isn't empty.
 */
export async function provisionAIEstimate(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const vertical = client.vertical ?? "home service";

  // Set up service config with default estimate settings
  const estimateConfig = {
    enabled: true,
    vertical,
    autoReply: true,
    requirePhoto: true,
    estimateDisclaimer: `This is an AI-generated estimate based on the photo provided. Final pricing may vary after on-site inspection by ${client.businessName}.`,
    responseTimeMinutes: 5,
  };

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "ai-estimate" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(estimateConfig) },
    });
  }

  // Create a sample photo estimate so the dashboard has data
  const existingEstimate = await prisma.photoEstimate.findFirst({
    where: { clientId },
  });

  if (!existingEstimate) {
    await prisma.photoEstimate.create({
      data: {
        clientId,
        customerName: "Sample Customer (Demo)",
        customerEmail: "demo@example.com",
        imageUrl: "https://placeholder.example.com/sample-estimate.jpg",
        issueDescription: `Sample ${vertical} estimate request — this shows how AI photo estimates will appear in your dashboard.`,
        estimateLow: 200000, // $2,000
        estimateHigh: 300000, // $3,000
        confidence: 85,
        status: "estimated",
      },
    });
  }

  await createNotificationForClient(clientId, {
    type: "service",
    title: "AI Photo Estimating Active",
    message: "Customers can now upload photos and receive instant AI-powered cost estimates for your services.",
    actionUrl: "/dashboard",
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "AI Photo Estimating activated",
      description: `AI-powered photo estimates are now available for ${client.businessName}. Customers can upload photos and receive instant cost estimates.`,
    },
  });
}
