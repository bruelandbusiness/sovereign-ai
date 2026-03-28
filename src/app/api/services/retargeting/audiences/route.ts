import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import {
  getAudiences,
  createRetargetingAudience,
  getRetargetingStats,
} from "@/lib/integrations/retargeting";
import type { AudienceCriteria } from "@/lib/integrations/retargeting";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: List retargeting audiences and stats
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const audiences = getAudiences(clientId);
    const stats = getRetargetingStats(clientId);

    return NextResponse.json({
      audiences,
      stats,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[retargeting/audiences] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch audiences" },
      { status: 500 }
    );
  }
}

// POST: Create audience segment
const audienceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  criteria: z.object({
    pages: z.array(z.string()).optional(),
    minVisits: z.number().min(1).optional(),
    daysActive: z.number().min(1).max(365).optional(),
    excludeConverted: z.boolean().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, audienceSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;

    const audience = createRetargetingAudience(
      clientId,
      body.name,
      body.description || "",
      body.criteria as AudienceCriteria
    );

    return NextResponse.json({ audience }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[retargeting/audiences] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create audience" },
      { status: 500 }
    );
  }
}
