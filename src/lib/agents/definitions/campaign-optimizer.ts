import { prisma } from "@/lib/db";
import type { AgentDefinition, StepContext, StepResult } from "../runner";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";

import { logger } from "@/lib/logger";
const AI_MODEL =
  process.env.CLAUDE_AGENT_MODEL || "claude-haiku-4-5-20251001";

export const campaignOptimizer: AgentDefinition = {
  type: "campaign-optimizer",
  description:
    "Analyzes ad campaign performance and generates optimization recommendations",
  steps: [
    {
      action: "fetch-ad-performance",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const campaigns = await prisma.adCampaign.findMany({
          where: { clientId: ctx.clientId },
          orderBy: { updatedAt: "desc" },
          take: 10,
        });
        return {
          output: {
            campaigns: campaigns.map((c) => ({
              id: c.id,
              platform: c.platform,
              name: c.name,
              status: c.status,
              budget: c.budget,
              spent: c.spent,
              impressions: c.impressions,
              clicks: c.clicks,
              conversions: c.conversions,
            })),
            campaignCount: campaigns.length,
          },
        };
      },
    },
    {
      action: "analyze-performance",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const campaigns = (ctx.input.campaigns || []) as Record<
          string,
          unknown
        >[];
        if (campaigns.length === 0) {
          return {
            output: {
              analysis: "No campaigns found to analyze.",
              recommendations: [],
            },
          };
        }

        const response = await guardedAnthropicCall({
          clientId: ctx.clientId,
          action: "agent.campaign-optimizer.analyze-performance",
          description: "Agent: analyze ad campaign performance",
          params: {
            model: AI_MODEL,
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: `Analyze these ad campaigns and provide optimization recommendations. Return JSON with "analysis" (string summary) and "recommendations" (array of {campaign_id, action, reasoning}).

Campaigns: ${sanitizeForPrompt(JSON.stringify(campaigns), 5000)}`,
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
          logger.warnWithCause("[campaign-optimizer] Failed to parse AI response as JSON", err);
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
      action: "generate-report",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const analysis = (ctx.input.analysis as string) || "No analysis available";
        const recommendations = (ctx.input.recommendations || []) as Record<
          string,
          unknown
        >[];

        // Create activity event with results
        await prisma.activityEvent.create({
          data: {
            clientId: ctx.clientId,
            type: "ad_optimized",
            title: "Campaign Optimization Report",
            description: `AI analyzed ${ctx.input.campaignCount || 0} campaigns and generated ${recommendations.length} recommendations.`,
          },
        });

        return {
          output: {
            reportGenerated: true,
            summary: analysis,
            recommendationCount: recommendations.length,
          },
        };
      },
    },
  ],
};
