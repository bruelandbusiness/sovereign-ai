import { prisma } from "@/lib/db";

export async function provisionFSMSync(clientId: string): Promise<void> {
  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "FSM Sync activated",
      description: "Field Service Management sync is ready. Connect your ServiceTitan, Jobber, or Housecall Pro account from your dashboard.",
    },
  });
}
