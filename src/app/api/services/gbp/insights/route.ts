import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { getBusinessInsights } from "@/lib/integrations/gbp";

// GET: Fetch GBP insights (views, searches, calls, direction requests)
export async function GET() {
  try {
    await requireClient();

    const insights = await getBusinessInsights();

    return NextResponse.json({ insights });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[gbp/insights] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch GBP insights" },
      { status: 500 }
    );
  }
}
