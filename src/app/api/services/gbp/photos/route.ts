import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { getGBPPhotos, uploadPhoto } from "@/lib/integrations/gbp";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: Fetch GBP photos
export async function GET() {
  try {
    await requireClient();

    const photos = await getGBPPhotos();

    return NextResponse.json({ photos });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[gbp/photos] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch GBP photos" },
      { status: 500 }
    );
  }
}

// POST: Upload a photo to GBP
const uploadSchema = z.object({
  locationId: z.string().optional(),
  photoUrl: z.string().url(),
  category: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await requireClient();

    const validation = await validateBody(request, uploadSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { locationId, photoUrl, category } = validation.data;
    const result = await uploadPhoto(
      locationId || "default",
      photoUrl,
      category
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[gbp/photos] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
