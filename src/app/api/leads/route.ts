import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/leads`);
    if (!response.ok) {
      return NextResponse.json({ detail: "Failed to fetch leads" }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ detail: "Could not connect to backend" }, { status: 502 });
  }
}
