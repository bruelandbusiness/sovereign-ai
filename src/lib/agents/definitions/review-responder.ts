import { prisma } from "@/lib/db";
import type { AgentDefinition, StepContext, StepResult } from "../runner";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";

export const reviewResponder: AgentDefinition = {
  type: "review-responder",
  description: "Generates AI responses to customer reviews",
  steps: [
    {
      action: "analyze-review",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        const reviewId = ctx.input.reviewId as string;
        if (!reviewId) {
          return { output: { skip: true, reason: "No reviewId provided" } };
        }

        // Get client info for context
        const client = await prisma.client.findUnique({
          where: { id: ctx.clientId },
          select: { businessName: true, vertical: true },
        });

        return {
          output: {
            businessName: client?.businessName || "the business",
            vertical: client?.vertical || "home services",
            reviewId,
          },
        };
      },
    },
    {
      action: "generate-response",
      requiresApproval: true, // Can be gated by governance
      execute: async (ctx: StepContext): Promise<StepResult> => {
        if (ctx.input.skip) {
          return { output: { skipped: true } };
        }

        const reviewText = (ctx.input.reviewText as string) || "";
        const rating = (ctx.input.rating as number) || 5;
        const businessName = ctx.input.businessName as string;

        const response = await guardedAnthropicCall({
          clientId: ctx.clientId,
          action: "agent.review-responder.generate-response",
          description: `Agent: generate review response for ${rating}-star review`,
          params: {
            model: "claude-haiku-4-5-20251001",
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: `Write a professional, warm response to this ${rating}-star review for ${sanitizeForPrompt(String(businessName), 200)}. Keep it under 100 words, be genuine, and address any concerns.

Review: "${sanitizeForPrompt(String(reviewText || "Great service!"), 2000)}"`,
              },
            ],
          },
        });

        const responseText = extractTextContent(response, "");

        return {
          output: { generatedResponse: responseText, rating },
          tokensUsed:
            response.usage.input_tokens + response.usage.output_tokens,
        };
      },
    },
    {
      action: "report",
      execute: async (ctx: StepContext): Promise<StepResult> => {
        if (ctx.input.skipped) {
          return { output: { reported: false } };
        }

        await prisma.activityEvent.create({
          data: {
            clientId: ctx.clientId,
            type: "review_response",
            title: "Review Response Generated",
            description: `AI drafted a response to a ${ctx.input.rating || 5}-star review.`,
          },
        });

        return { output: { reported: true } };
      },
    },
  ],
};
