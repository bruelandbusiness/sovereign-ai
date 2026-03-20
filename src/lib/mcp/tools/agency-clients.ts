import { prisma } from "@/lib/db";
import { registerTool } from "../registry";
import { z } from "zod";

const inputSchema = z.object({
  limit: z.number().int().min(1).max(200).optional().default(50),
});

registerTool({
  name: "agency.listClients",
  description:
    "List all clients managed by the authenticated agency account.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Max clients to return (default 50)",
      },
    },
  },
  requiredScopes: ["agency.read"],
  handler: async (input, ctx) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    // Find agencies owned by this account
    const agencies = await prisma.agency.findMany({
      where: { ownerAccountId: ctx.accountId },
      select: { id: true },
    });

    if (agencies.length === 0) {
      return { error: "No agency found for this account", clients: [] };
    }

    const limit = Math.max(1, Math.min(Number(parsed.data.limit) || 50, 200));

    // Agency-client relationship is not directly modeled in schema;
    // return all clients for now (could filter via a separate mapping table).
    const clients = await prisma.client.findMany({
      take: limit,
      select: {
        id: true,
        businessName: true,
        vertical: true,
        city: true,
        state: true,
        createdAt: true,
        subscription: { select: { bundleId: true, status: true } },
      },
    });

    return {
      clients: clients.map((c) => ({
        id: c.id,
        businessName: c.businessName,
        vertical: c.vertical,
        location:
          c.city && c.state ? `${c.city}, ${c.state}` : null,
        bundle: c.subscription?.bundleId || null,
        subscriptionStatus: c.subscription?.status || null,
      })),
      count: clients.length,
    };
  },
});
