import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIP } from "@/lib/rate-limit";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  // Rate limit: 5 audit requests per IP per hour (public but expensive)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIP(ip, "audit", 5);
  if (!allowed) {
    return NextResponse.json(
      { detail: "Too many audit requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(`${API_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: error.detail || "Audit failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { detail: "Could not connect to audit engine" },
      { status: 502 }
    );
  }
}
