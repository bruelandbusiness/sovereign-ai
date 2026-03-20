import { prisma } from "@/lib/db";
import type { AgentDefinition, StepContext, StepResult } from "../runner";
import { extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";

export const leadNurtureOptimizer: AgentDefinition = {
  type: "lead-nurture-optimizer",
  description:
    "Analyzes lead conversion funnel and optimizes nurture sequences",
  steps: [
    {
      action: "fetch-funnel-data",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [totalLeads, convertedLeads, emailCampaigns] = await Promise.all([
          prisma.lead.count({
            where: {
              clientId: ctx.clientId,
              createdAt: { gte: thirtyDaysAgo },
            },
          }),
          prisma.lead.count({
            where: {
              clientId: ctx.clientId,
              stage: "converted",
              createdAt: { gte: thirtyDaysAgo },
            },
          }),
          prisma.emailCampaign.findMany({
            where: { clientId: ctx.clientId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              subject: true,
              status: true,
              recipients: true,
              opens: true,
              clicks: true,
            },
          }),
        ]);

        return {
          output: {
            totalLeads,
            convertedLeads,
            conversionRate:
              totalLeads > 0
                ? ((convertedLeads / totalLeads) * 100).toFixed(1)
                : "0",
            emailCampaigns: emailCampaigns.map((e) => ({
              subject: e.subject,
              sent: e.recipients,
              opened: e.opens,
              clicked: e.clicks,
              openRate:
                e.recipients > 0
                  ? ((e.opens / e.recipients) * 100).toFixed(1)
                  : "0",
            })),
          },
        };
      },
    },
    {
      action: "analyze-and-recommend",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const response = await guardedAnthropicCall({
          clientId: ctx.clientId,
          action: "agent.lead-nurture-optimizer.analyze-and-recommend",
          description: "Agent: analyze lead nurture funnel",
          params: {
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: `Analyze this lead nurture funnel and provide recommendations. Return JSON with "analysis" (summary string) and "recommendations" (array of actionable strings).

Data: ${JSON.stringify({
                  totalLeads: ctx.input.totalLeads,
                  convertedLeads: ctx.input.convertedLeads,
                  conversionRate: ctx.input.conversionRate,
                  emailCampaigns: ctx.input.emailCampaigns,
                })}`,
              },
            ],
          },
        });

        const text = extractTextContent(response, "");
        let parsed: Record<string, unknown> = {
          analysis: text,
          recommendations: [],
        };
        try {
          parsed = JSON.parse(text);
        } catch (err) {
          console.warn("[lead-nurture] Failed to parse AI response as JSON:", err);
          // Use raw text as analysis
        }

        return {
          output: parsed,
          tokensUsed:
            response.usage.input_tokens + response.usage.output_tokens,
        };
      },
    },
    {
      action: "report",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const recommendations = (ctx.input.recommendations || []) as string[];

        await prisma.activityEvent.create({
          data: {
            clientId: ctx.clientId,
            type: "seo_update",
            title: "Lead Nurture Analysis Complete",
            description: `AI analyzed your conversion funnel (${ctx.input.conversionRate || 0}% rate) and generated ${recommendations.length} recommendations.`,
          },
        });

        return {
          output: {
            reported: true,
            recommendationCount: recommendations.length,
          },
        };
      },
    },
  ],
};
