import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));

    const backendUrl = new URL(`${API_URL}/api/leads`);
    backendUrl.searchParams.set("page", String(page));
    backendUrl.searchParams.set("limit", String(limit));

    const response = await fetch(backendUrl.toString());
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: response.status });
    }
    const data = await response.json();
    const items = Array.isArray(data) ? data : (data.data ?? data);
    const total: number = data.total ?? (Array.isArray(data) ? data.length : 0);
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    const res = NextResponse.json({
      data: Array.isArray(items) ? items : data,
      pagination: { page, limit, total, totalPages },
    });
    res.headers.set("Cache-Control", "private, max-age=60");
    return res;
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Could not connect to backend" }, { status: 502 });
  }
}
