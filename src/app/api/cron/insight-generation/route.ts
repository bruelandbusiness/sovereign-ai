import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron";
import { getClientBenchmarks } from "@/lib/intelligence/benchmarks";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { logger } from "@/lib/logger";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  const startTime = Date.now();

  // Early exit if ANTHROPIC_API_KEY is not configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      ok: true,
      clientsProcessed: 0,
      insightsGenerated: 0,
      message: "ANTHROPIC_API_KEY not configured — skipping",
    });
  }

  try {
    const clients = await prisma.client.findMany({
    where: {
      vertical: { not: null },
      subscription: { status: "active" },
    },
    select: {
      id: true,
      businessName: true,
      vertical: true,
      city: true,
      state: true,
    },
    take: 50,
  });

  if (clients.length === 0) {
    return NextResponse.json({
      ok: true,
      clientsProcessed: 0,
      insightsGenerated: 0,
      message: "No active clients with verticals",
    });
  }

  let insightsGenerated = 0;
  const errors: string[] = [];

  // Batch-load active services for all clients to avoid N+1 queries inside the loop
  const allClientIds = clients.map((c) => c.id);
  const allActiveServices = await prisma.clientService.findMany({
    where: { clientId: { in: allClientIds }, status: "active" },
    select: { clientId: true, serviceId: true },
  });
  const servicesByClient = new Map<string, string[]>();
  for (const svc of allActiveServices) {
    const list = servicesByClient.get(svc.clientId) || [];
    list.push(svc.serviceId);
    servicesByClient.set(svc.clientId, list);
  }

  for (const client of clients) {
    try {
      const benchmarks = await getClientBenchmarks(client.id);
      if (benchmarks.length === 0) continue;

      // Get active services (pre-loaded above to avoid N+1)
      const activeServiceIds = servicesByClient.get(client.id) || [];

      let response;
      try {
        response = await guardedAnthropicCall({
          clientId: client.id,
          action: "insight.generate",
          description: `Generate predictive insights for ${client.businessName}`,
          params: {
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: `Generate 3 actionable insights for a ${sanitizeForPrompt(client.vertical || "local", 100)} business. Return JSON array of objects with: "type" (service_recommendation | budget_optimization | performance_gap | seasonal_opportunity), "title" (short), "description" (1-2 sentences), "confidence" (0.0-1.0), "impact" (low|medium|high), "recommendation" (1 sentence action), "actionUrl" (dashboard path or null).

Context:
- Business: ${sanitizeForPrompt(client.businessName, 200)} in ${sanitizeForPrompt(client.city || "", 100)}, ${sanitizeForPrompt(client.state || "", 50)}
- Vertical: ${sanitizeForPrompt(client.vertical || "local", 100)}
- Active services: ${activeServiceIds.join(", ") || "none"}
- Benchmarks: ${JSON.stringify(
                    benchmarks.map((b) => ({
                      metric: b.label,
                      value: b.yourValue,
                      percentile: b.percentile,
                      median: b.p50,
                    })),
                  )}`,
              },
            ],
          },
        });
      } catch (err) {
        if (err instanceof GovernanceBlockedError) {
          logger.info(
            `Skipping insight generation for client ${client.id}: ${err.reason}`,
          );
          continue;
        }
        throw err;
      }

      const text = extractTextContent(response, "[]");

      let insights: Array<{
        type: string;
        title: string;
        description: string;
        confidence: number;
        impact: string;
        recommendation: string;
        actionUrl?: string;
      }> = [];

      try {
        // Extract JSON from the response — handle markdown code fences
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        continue; // Skip if AI response isn't valid JSON
      }

      if (!Array.isArray(insights)) continue;

      // Validate and filter insights
      const VALID_INSIGHT_TYPES = [
        "service_recommendation",
        "budget_optimization",
        "performance_gap",
        "seasonal_opportunity",
      ];

      const validInsights = insights.filter((insight) => {
        // Must have required fields
        if (!insight.type || !insight.title || !insight.description) return false;
        // Type must be one of expected values
        if (!VALID_INSIGHT_TYPES.includes(insight.type)) return false;
        // Validate string lengths
        if (typeof insight.title !== "string" || insight.title.length > 200) return false;
        if (typeof insight.description !== "string" || insight.description.length > 1000) return false;
        return true;
      });

      // Expire old insights for this client
      await prisma.predictiveInsight.updateMany({
        where: {
          clientId: client.id,
          dismissed: false,
          expiresAt: { lt: new Date() },
        },
        data: { dismissed: true },
      });

      // Create new insights in batch
      const insightsToCreate = validInsights.slice(0, 5).map((insight) => ({
        clientId: client.id,
        type: insight.type,
        title: insight.title.slice(0, 200),
        description: insight.description.slice(0, 1000),
        confidence: Math.min(1, Math.max(0, insight.confidence || 0.7)),
        impact: ["low", "medium", "high"].includes(insight.impact)
          ? insight.impact
          : "medium",
        recommendation: insight.recommendation || "",
        actionUrl: insight.actionUrl || null,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Expires in 14 days
      }));

      if (insightsToCreate.length > 0) {
        await prisma.predictiveInsight.createMany({
          data: insightsToCreate,
        });
        insightsGenerated += insightsToCreate.length;
      }
    } catch (error) {
      const message = `Insight generation failed for client ${client.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
      logger.error(`[cron/insight-generation] ${message}`);
      errors.push(message);
    }
  }

  logger.info(`[cron/insight-generation] Completed in ${Date.now() - startTime}ms`);

  return NextResponse.json({
    ok: true,
    clientsProcessed: clients.length,
    insightsGenerated,
    errors: errors.length > 0 ? errors : undefined,
  });
  } catch (err) {
    logger.errorWithCause("[cron/insight-generation] Fatal error", err);
    return NextResponse.json(
      { error: "Insight generation cron job failed" },
      { status: 500 }
    );
  }
}
