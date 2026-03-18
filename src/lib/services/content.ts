import { prisma } from "@/lib/db";

/**
 * Provision the content engine for a client.
 * Queues the first batch of content jobs (2 blog posts to start).
 */
export async function provisionContent(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const vertical = client.vertical || "home service";
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "your area";

  // Queue 2 initial blog posts
  const initialTopics = [
    {
      title: `Top 5 ${vertical} Tips Every Homeowner in ${location} Should Know`,
      keywords: `${vertical} tips, ${location} ${vertical}, home maintenance`,
    },
    {
      title: `How to Choose the Best ${vertical} Company in ${location}`,
      keywords: `best ${vertical} ${location}, ${vertical} company near me`,
    },
  ];

  for (const topic of initialTopics) {
    await prisma.contentJob.create({
      data: {
        clientId,
        type: "blog",
        title: topic.title,
        keywords: topic.keywords,
        status: "queued",
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: "Content engine activated",
      description: `${initialTopics.length} blog posts queued for ${client.businessName}. First post will be generated within 24 hours.`,
    },
  });
}
