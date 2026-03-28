import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { trackKeywordRankings } from "@/lib/integrations/seo";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Track keyword rankings weekly for all clients with SEO service active
export const GET = withCronErrorHandler("cron/seo-track", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
  // Find all clients with active SEO service
  const activeServices = await prisma.clientService.findMany({
    where: {
      serviceId: "seo",
      status: "active",
    },
    include: {
      client: { select: { id: true, businessName: true } },
    },
    take: 50,
  });

  if (activeServices.length === 0) {
    return NextResponse.json({
      tracked: 0,
      message: "No clients with active SEO service",
    });
  }

  // Batch-fetch all keywords for all active SEO clients in a single query
  const allClientIds = activeServices.map((s) => s.client.id);
  const allKeywords = await prisma.sEOKeyword.findMany({
    where: { clientId: { in: allClientIds } },
    take: 5000,
  });

  // Group keywords by clientId for efficient lookup
  const keywordsByClient = new Map<string, typeof allKeywords>();
  for (const kw of allKeywords) {
    const existing = keywordsByClient.get(kw.clientId);
    if (existing) {
      existing.push(kw);
    } else {
      keywordsByClient.set(kw.clientId, [kw]);
    }
  }

  const results: Array<{
    clientId: string;
    keywordsTracked: number;
    significantChanges: number;
    status: string;
  }> = [];

  for (const service of activeServices) {
    try {
      const clientId = service.client.id;

      // Look up keywords from the pre-fetched map instead of querying per client
      const existingKeywords = keywordsByClient.get(clientId) || [];

      if (existingKeywords.length === 0) {
        results.push({
          clientId,
          keywordsTracked: 0,
          significantChanges: 0,
          status: "skipped",
        });
        continue;
      }

      const keywordTexts = existingKeywords.map((k) => k.keyword);

      // Fetch fresh rankings
      const rankings = await trackKeywordRankings(clientId, keywordTexts);

      let significantChanges = 0;

      // Collect all keyword updates and activity events, then batch them
      // in a single transaction instead of issuing per-keyword updates.
      const keywordUpdates: Parameters<typeof prisma.sEOKeyword.update>[0][] = [];
      const activityEvents: Parameters<typeof prisma.activityEvent.create>[0][] = [];

      for (const ranking of rankings) {
        const existing = existingKeywords.find(
          (k) => k.keyword === ranking.keyword
        );

        if (!existing) continue;

        const prevPosition = existing.position;
        const newPosition = ranking.position;

        keywordUpdates.push({
          where: { id: existing.id },
          data: {
            prevPosition: prevPosition,
            position: newPosition,
            searchVolume: ranking.searchVolume,
            difficulty: ranking.difficulty,
            url: ranking.url,
            trackedAt: new Date(),
          },
        });

        // Check for significant ranking changes (5+ positions)
        if (prevPosition !== null && newPosition !== null) {
          const delta = prevPosition - newPosition; // positive = improved
          if (Math.abs(delta) >= 5) {
            significantChanges++;

            const direction = delta > 0 ? "improved" : "dropped";
            activityEvents.push({
              data: {
                clientId,
                type: "seo_update",
                title: `Keyword "${ranking.keyword}" ${direction} ${Math.abs(delta)} positions`,
                description: `"${ranking.keyword}" moved from position ${prevPosition} to ${newPosition}. ${delta > 0 ? "Great progress!" : "This may need attention."}`,
              },
            });
          }
        }

        // New ranking for previously unranked keyword
        if (prevPosition === null && newPosition !== null) {
          significantChanges++;
          activityEvents.push({
            data: {
              clientId,
              type: "seo_update",
              title: `New ranking: "${ranking.keyword}" at position ${newPosition}`,
              description: `Your website is now ranking at position ${newPosition} for "${ranking.keyword}". ${newPosition <= 10 ? "This is on the first page!" : "Keep optimizing to reach the first page."}`,
            },
          });
        }
      }

      // Summary activity event if there were significant changes
      if (significantChanges > 0) {
        activityEvents.push({
          data: {
            clientId,
            type: "seo_update",
            title: `Weekly SEO update: ${significantChanges} significant ranking changes`,
            description: `Tracked ${keywordTexts.length} keywords for ${service.client.businessName}. ${significantChanges} keywords had significant position changes this week.`,
          },
        });
      }

      // Execute all updates and creates in a single transaction
      await prisma.$transaction([
        ...keywordUpdates.map((u) => prisma.sEOKeyword.update(u)),
        ...activityEvents.map((e) => prisma.activityEvent.create(e)),
      ]);

      results.push({
        clientId,
        keywordsTracked: keywordTexts.length,
        significantChanges,
        status: "tracked",
      });
    } catch (error) {
      logger.errorWithCause(
        `Failed to track keywords for client ${service.client.id}`,
        error
      );
      results.push({
        clientId: service.client.id,
        keywordsTracked: 0,
        significantChanges: 0,
        status: "failed",
      });
    }
  }

  return NextResponse.json({
    tracked: results.filter((r) => r.status === "tracked").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
  } catch (err) {
    logger.errorWithCause("[cron/seo-track] Fatal error:", err);
    return NextResponse.json(
      { error: "SEO tracking cron job failed" },
      { status: 500 }
    );
  }
});
