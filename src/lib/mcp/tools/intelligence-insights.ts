import { prisma } from "@/lib/db";
import { registerTool } from "../registry";
import { z } from "zod";

const inputSchema = z.object({
  includeDismissed: z.boolean().optional().default(false),
});

registerTool({
  name: "intelligence.getInsights",
  description:
    "Get AI-generated predictive insights and recommendations for the authenticated client.",
  inputSchema: {
    type: "object",
    properties: {
      includeDismissed: {
        type: "boolean",
        description: "Include previously dismissed insights (default false)",
      },
    },
  },
  requiredScopes: ["intelligence.read"],
  handler: async (input, ctx) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    if (!ctx.clientId)
      return { error: "No client associated with this API key" };

    const where: Record<string, unknown> = { clientId: ctx.clientId };
    if (!parsed.data.includeDismissed) {
      where.dismissed = false;
    }

    const insights = await prisma.predictiveInsight.findMany({
      where,
      orderBy: [{ impact: "desc" }, { confidence: "desc" }],
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        confidence: true,
        impact: true,
        recommendation: true,
        actionUrl: true,
        dismissed: true,
        createdAt: true,
      },
    });

    return { insights, count: insights.length };
  },
});
