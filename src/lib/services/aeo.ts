import { prisma } from "@/lib/db";

export async function provisionAEO(clientId: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { vertical: true, city: true, state: true, businessName: true },
  });

  if (client) {
    const vertical = client.vertical || "home service";
    const location = client.city && client.state
      ? `${client.city}, ${client.state}`
      : "your area";

    // Create initial AEO strategy
    await prisma.aEOStrategy.create({
      data: {
        clientId,
        title: `Create FAQ page for common ${vertical} questions`,
        description: `Build comprehensive FAQ content targeting AI search engines for ${client.businessName} in ${location}.`,
        priority: "high",
        status: "pending",
        contentType: "faq",
        impact: `High — targets top ${vertical} queries in ${location}`,
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "AEO activated",
      description: "Answer Engine Optimization is now monitoring AI search engines for your business visibility.",
    },
  });
}
