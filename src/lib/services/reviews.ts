import { prisma } from "@/lib/db";

/**
 * Provision the review automation service for a client.
 * Creates an initial "getting started" activity event.
 */
export async function provisionReviews(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "review_received",
      title: "Review automation activated",
      description: `Review request campaigns are ready for ${client.businessName}. Add your customers to start collecting 5-star reviews.`,
    },
  });
}
