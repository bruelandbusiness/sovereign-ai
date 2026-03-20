import { prisma } from "@/lib/db";

export async function provisionAIEstimate(clientId: string): Promise<void> {
  // Check if client already has photo estimates enabled
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { vertical: true, businessName: true },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "AI Photo Estimating activated",
      description: `AI-powered photo estimates are now available for ${client?.businessName || "your business"}. Customers can upload photos for instant cost estimates.`,
    },
  });
}
