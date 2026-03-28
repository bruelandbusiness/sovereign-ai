import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIP } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";
const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  // Rate limit: 5 audit requests per IP per hour (public but expensive)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "audit", 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many audit requests. Please try again later." },
      { status: 429 }
    );
  }

  const auditSchema = z.object({
    business_name: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    vertical: z.string().min(1).max(100),
    email: z.string().email().max(254),
    phone: z.string().max(30).optional(),
  });

  try {
    const body = await request.json();
    const parsed = auditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const response = await fetch(`${API_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || error.detail || "Audit failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: "Could not connect to audit engine" },
      { status: 502 }
    );
  }
}
