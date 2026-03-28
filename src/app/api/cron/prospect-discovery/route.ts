import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { findNewProspects } from "@/lib/acquisition";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Configured verticals to search for prospects.
 * Each entry defines a vertical + location pair.
 */
const DISCOVERY_VERTICALS = [
  { vertical: "HVAC", city: "Dallas", state: "TX" },
  { vertical: "plumbing", city: "Phoenix", state: "AZ" },
  { vertical: "roofing", city: "Atlanta", state: "GA" },
  { vertical: "electrical", city: "Denver", state: "CO" },
  { vertical: "landscaping", city: "Orlando", state: "FL" },
  { vertical: "pest control", city: "Houston", state: "TX" },
];

const MAX_VERTICALS_PER_RUN = 3;

export const GET = withCronErrorHandler("cron/prospect-discovery", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  logger.info("[cron/prospect-discovery] Starting prospect discovery run");

  // Rotate through verticals based on the current week
  const weekOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );
  const startIndex =
    (weekOfYear * MAX_VERTICALS_PER_RUN) % DISCOVERY_VERTICALS.length;

  const verticalsToSearch: typeof DISCOVERY_VERTICALS = [];
  for (let i = 0; i < MAX_VERTICALS_PER_RUN; i++) {
    const idx = (startIndex + i) % DISCOVERY_VERTICALS.length;
    verticalsToSearch.push(DISCOVERY_VERTICALS[idx]);
  }

  const results = [];

  for (const config of verticalsToSearch) {
    try {
      const prospects = await findNewProspects({
        vertical: config.vertical,
        city: config.city,
        state: config.state,
      });

      results.push({
        vertical: config.vertical,
        city: config.city,
        state: config.state,
        newProspects: prospects.length,
      });
    } catch (err) {
      logger.errorWithCause(
        `[cron/prospect-discovery] Failed for vertical: ${config.vertical}`,
        err
      );
      results.push({
        vertical: config.vertical,
        city: config.city,
        state: config.state,
        newProspects: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const totalNew = results.reduce((sum, r) => sum + r.newProspects, 0);

  logger.info("[cron/prospect-discovery] Discovery run complete", {
    verticalsSearched: verticalsToSearch.length,
    totalNewProspects: totalNew,
  });

  return NextResponse.json({
    processed: verticalsToSearch.length,
    totalNewProspects: totalNew,
    results,
  });
});
