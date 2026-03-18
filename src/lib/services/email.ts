import { prisma } from "@/lib/db";

/**
 * Provision the email marketing service for a client.
 * Creates an initial "Welcome Series" drip campaign in the EmailCampaign table.
 */
export async function provisionEmail(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Check if a Welcome Series already exists for this client
  const existing = await prisma.emailCampaign.findFirst({
    where: { clientId, name: "Welcome Series" },
  });

  if (!existing) {
    await prisma.emailCampaign.create({
      data: {
        clientId,
        name: "Welcome Series",
        subject: `Welcome to ${client.businessName}!`,
        body: `<p>Thank you for choosing ${client.businessName}! We're thrilled to have you as a customer.</p>
<p>As a leading ${client.vertical || "home service"} provider${client.city ? ` in ${client.city}, ${client.state}` : ""}, we're committed to delivering exceptional service every time.</p>
<p>Here's what you can expect from us:</p>
<ul>
  <li>Professional, reliable service</li>
  <li>Transparent pricing with no hidden fees</li>
  <li>A team that truly cares about your satisfaction</li>
</ul>
<p>If you ever need anything, don't hesitate to reach out. We're here to help!</p>
<p>Best regards,<br/>${client.ownerName}<br/>${client.businessName}</p>`,
        type: "drip",
        status: "draft",
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "email_sent",
      title: "Email automation activated",
      description: `Welcome Series drip campaign created for ${client.businessName}. Edit and activate it from your dashboard.`,
    },
  });
}
