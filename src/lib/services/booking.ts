import { prisma } from "@/lib/db";

/**
 * Provision the booking/scheduling service for a client.
 * Stores default business hours (Mon-Fri 9-5, 60-min slots) in ClientService.config.
 */
export async function provisionBooking(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const defaultConfig = {
    businessHours: {
      mon: "9:00-17:00",
      tue: "9:00-17:00",
      wed: "9:00-17:00",
      thu: "9:00-17:00",
      fri: "9:00-17:00",
    },
    slotDuration: 60,
  };

  // Update the ClientService record with default booking config
  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "booking" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(defaultConfig) },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: "Booking system activated",
      description: `Online booking is now available for ${client.businessName}. Default hours: Mon-Fri, 9 AM - 5 PM with 60-minute slots.`,
    },
  });
}
