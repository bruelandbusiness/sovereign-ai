import { prisma } from "@/lib/db";

/**
 * Provision the SEO tracking service for a client.
 * Seeds initial keywords based on their vertical and location so dashboards have data.
 */
export async function provisionSeo(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Check if any keywords already exist
  const existing = await prisma.sEOKeyword.findFirst({
    where: { clientId },
  });

  if (!existing) {
    const vertical = client.vertical ?? "home service";
    const city = client.city ?? "";
    const seedKeywords = [
      `${vertical} near me`,
      `best ${vertical} ${city}`.trim(),
      `${vertical} services ${city}`.trim(),
      `${client.businessName}`,
      `${vertical} reviews ${city}`.trim(),
    ].filter(Boolean);

    for (const keyword of seedKeywords) {
      await prisma.sEOKeyword.create({
        data: {
          clientId,
          keyword,
          trackedAt: new Date(),
        },
      });
    }
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "SEO tracking activated",
      description: `Keyword tracking has been set up for ${client.businessName}. Initial seed keywords have been added — rankings will be tracked weekly.`,
    },
  });
}
