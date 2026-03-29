import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSession } from "@/lib/auth";
import { cache } from "@/lib/cache";

export const dynamic = "force-dynamic";
const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = (session as { clientId?: string }).clientId || "default";

  try {
    const data = await cache.wrap(`lead-stats:${clientId}`, 60, async () => {
      const response = await fetch(`${API_URL}/api/leads/stats`);
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      return response.json();
    });

    const res = NextResponse.json(data);
    res.headers.set("Cache-Control", "private, max-age=60");
    return res;
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Could not connect to backend" }, { status: 502 });
  }
}
