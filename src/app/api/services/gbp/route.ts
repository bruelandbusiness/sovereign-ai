import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { getBusinessInfo } from "@/lib/integrations/gbp";

// GET: Fetch GBP profile info
export async function GET() {
  try {
    await requireClient();

    const info = await getBusinessInfo();

    return NextResponse.json({ profile: info });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[gbp] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch GBP profile" },
      { status: 500 }
    );
  }
}
