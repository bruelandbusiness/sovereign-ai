import { prisma } from "@/lib/db";
import { registerTool } from "../registry";
import { z } from "zod";

const inputSchema = z.object({
  period: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
});

registerTool({
  name: "client.getMetrics",
  description:
    "Get key performance metrics for the authenticated client including lead counts, review stats, and service information.",
  inputSchema: {
    type: "object",
    properties: {
      period: {
        type: "string",
        description: "Time period: 7d | 30d | 90d (default 30d)",
      },
    },
  },
  requiredScopes: ["client.read"],
  handler: async (input, ctx) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    if (!ctx.clientId)
      return { error: "No client associated with this API key" };

    const days =
      parsed.data.period === "7d" ? 7 : parsed.data.period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [leadCount, convertedCount, activeServices] = await Promise.all([
      prisma.lead.count({
        where: { clientId: ctx.clientId, createdAt: { gte: since } },
      }),
      prisma.lead.count({
        where: {
          clientId: ctx.clientId,
          status: "converted",
          createdAt: { gte: since },
        },
      }),
      prisma.clientService.count({
        where: { clientId: ctx.clientId, status: "active" },
      }),
    ]);

    return {
      period: `${days}d`,
      leads: leadCount,
      conversions: convertedCount,
      conversionRate:
        leadCount > 0
          ? ((convertedCount / leadCount) * 100).toFixed(1) + "%"
          : "0%",
      activeServices,
    };
  },
});
