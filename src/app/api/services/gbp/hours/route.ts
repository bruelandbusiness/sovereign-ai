import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { getBusinessInfo, updateBusinessHours } from "@/lib/integrations/gbp";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: Fetch current business hours
export async function GET() {
  try {
    await requireClient();

    const info = await getBusinessInfo();

    return NextResponse.json({ hours: info.hours });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[gbp/hours] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch business hours" },
      { status: 500 }
    );
  }
}

// PATCH: Update business hours
const hoursSchema = z.object({
  locationId: z.string().optional(),
  hours: z.array(
    z.object({
      day: z.string(),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean(),
    })
  ),
});

export async function PATCH(request: Request) {
  try {
    await requireClient();

    const validation = await validateBody(request, hoursSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { locationId, hours } = validation.data;
    const result = await updateBusinessHours(locationId || "default", hours);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[gbp/hours] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update business hours" },
      { status: 500 }
    );
  }
}
