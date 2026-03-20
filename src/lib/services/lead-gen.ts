import { prisma } from "@/lib/db";

export async function provisionLeadGen(clientId: string): Promise<void> {
  // Ensure the client has an activity event logging lead-gen activation
  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "Lead Generation activated",
      description: "Your lead generation pipeline is now live. Leads from all sources will flow into your dashboard.",
    },
  });
}
