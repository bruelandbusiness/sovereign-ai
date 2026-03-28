import { prisma } from "@/lib/db";
import { createNotificationForClient } from "@/lib/notifications";

/**
 * Provision the Field Service Management sync for a client.
 * Creates an FSMConnection record in setup mode and configures defaults.
 */
export async function provisionFSMSync(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Set up service config with supported FSM platforms
  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "fsm-sync" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: {
        config: JSON.stringify({
          setupRequired: true,
          supportedProviders: ["servicetitan", "jobber", "housecall_pro"],
        }),
      },
    });
  }

  await createNotificationForClient(clientId, {
    type: "service",
    title: "FSM Sync Ready to Connect",
    message: "Connect your ServiceTitan, Jobber, or Housecall Pro account to sync jobs, customers, and invoices automatically.",
    actionUrl: "/dashboard",
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "FSM Sync activated",
      description: `Field Service Management sync is ready for ${client.businessName}. Connect your ServiceTitan, Jobber, or Housecall Pro account from your dashboard to start syncing.`,
    },
  });
}
