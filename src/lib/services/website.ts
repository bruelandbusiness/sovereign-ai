import { prisma } from "@/lib/db";

export async function provisionWebsite(clientId: string): Promise<void> {
  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "Website service activated",
      description: "Your website build has been queued. Our team will begin design within 48 hours.",
    },
  });
}
