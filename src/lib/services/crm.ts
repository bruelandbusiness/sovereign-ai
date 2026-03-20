import { prisma } from "@/lib/db";
import { createNotificationForClient } from "@/lib/notifications";

export async function provisionCRM(clientId: string): Promise<void> {
  await createNotificationForClient(clientId, {
    type: "service",
    title: "CRM Ready",
    message: "Your CRM is now active. All leads will be tracked and managed from your dashboard.",
    actionUrl: "/dashboard/leads",
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "CRM activated",
      description: "Your customer relationship management dashboard is now live.",
    },
  });
}
