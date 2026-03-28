import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/leads`);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: response.status });
    }
    const data = await response.json();
    const res = NextResponse.json(data);
    res.headers.set("Cache-Control", "private, max-age=60");
    return res;
  } catch {
    return NextResponse.json({ error: "Could not connect to backend" }, { status: 502 });
  }
}
