import { prisma } from "@/lib/db";
import { registerTool } from "../registry";
import { z } from "zod";

const inputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  status: z
    .enum(["new", "contacted", "qualified", "converted", "lost"])
    .optional(),
});

registerTool({
  name: "client.getLeads",
  description:
    "Fetch recent leads for the authenticated client. Returns lead data including name, email, phone, source, status, and creation date.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Max leads to return (default 20, max 100)",
      },
      status: {
        type: "string",
        description:
          "Filter by status: new | contacted | qualified | converted | lost",
      },
    },
  },
  requiredScopes: ["client.read"],
  handler: async (input, ctx) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    if (!ctx.clientId)
      return { error: "No client associated with this API key" };

    const limit = Math.max(1, Math.min(Number(parsed.data.limit) || 20, 100));
    const where: Record<string, unknown> = { clientId: ctx.clientId };
    if (parsed.data.status) where.status = parsed.data.status;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        createdAt: true,
      },
    });

    return { leads, count: leads.length };
  },
});
