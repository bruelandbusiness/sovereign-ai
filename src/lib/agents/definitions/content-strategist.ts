import { prisma } from "@/lib/db";
import type { AgentDefinition, StepContext, StepResult } from "../runner";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";

export const contentStrategist: AgentDefinition = {
  type: "content-strategist",
  description:
    "Analyzes content performance and generates new content briefs",
  steps: [
    {
      action: "fetch-content-performance",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const client = await prisma.client.findUnique({
          where: { id: ctx.clientId },
          select: { vertical: true, city: true, state: true, businessName: true },
        });

        const recentContent = await prisma.contentJob.findMany({
          where: { clientId: ctx.clientId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, status: true, createdAt: true },
        });

        return {
          output: {
            client: client || {},
            recentContent: recentContent.map((c) => ({
              title: c.title,
              status: c.status,
            })),
          },
        };
      },
    },
    {
      action: "generate-briefs",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const client = ctx.input.client as Record<string, unknown>;
        const recentContent = ctx.input.recentContent as Record<
          string,
          unknown
        >[];

        const response = await guardedAnthropicCall({
          clientId: ctx.clientId,
          action: "agent.content-strategist.generate-briefs",
          description: "Agent: generate content strategy briefs",
          params: {
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `You are a content strategist for a ${sanitizeForPrompt(String(client.vertical || "home services"), 100)} company called "${sanitizeForPrompt(String(client.businessName || "our client"), 200)}" in ${sanitizeForPrompt(String(client.city || "their area"), 100)}, ${sanitizeForPrompt(String(client.state || ""), 50)}.

Recent content titles: ${recentContent.map((c) => c.title).join(", ") || "None yet"}

Generate 5 new blog post briefs. Return JSON array of objects with: "topic" (string), "targetKeyword" (string), "outline" (string, 2-3 bullet points), "estimatedLength" (number, word count).`,
              },
            ],
          },
        });

        const text = extractTextContent(response, "[]");
        let briefs: unknown[] = [];
        try {
          briefs = JSON.parse(text);
        } catch (err) {
          console.warn("[content-strategist] Failed to parse AI response as JSON:", err);
          briefs = [
            {
              topic: text,
              targetKeyword: "",
              outline: "",
              estimatedLength: 800,
            },
          ];
        }

        return {
          output: {
            briefs,
            briefCount: Array.isArray(briefs) ? briefs.length : 0,
          },
          tokensUsed:
            response.usage.input_tokens + response.usage.output_tokens,
        };
      },
    },
    {
      action: "report",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        await prisma.activityEvent.create({
          data: {
            clientId: ctx.clientId,
            type: "content_published",
            title: "Content Strategy Generated",
            description: `AI generated ${ctx.input.briefCount || 0} new content briefs for your business.`,
          },
        });

        return { output: { reported: true } };
      },
    },
  ],
};
