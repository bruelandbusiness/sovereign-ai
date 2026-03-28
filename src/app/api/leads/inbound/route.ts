import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const INBOUND_API_KEY = process.env.INBOUND_LEADS_API_KEY;

const inboundSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  trade: z.string().max(50).optional(),
  source: z.string().max(50).optional().default("clay"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const batchSchema = z.object({
  leads: z.array(inboundSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "leads-inbound", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Authenticate with API key
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!INBOUND_API_KEY || apiKey !== INBOUND_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await request.json();

    // Support single lead or batch
    const isBatch = Array.isArray(raw.leads);
    let leads: z.infer<typeof inboundSchema>[];

    if (isBatch) {
      const parsed = batchSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      leads = parsed.data.leads;
    } else {
      const parsed = inboundSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      leads = [parsed.data];
    }

    const created = await prisma.prospectLead.createMany({
      data: leads.map((lead) => ({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || null,
        source: lead.source || "clay",
        trade: lead.trade || null,
        metadata: lead.metadata
          ? (JSON.parse(JSON.stringify(lead.metadata)) as object)
          : undefined,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process leads" },
      { status: 500 }
    );
  }
}
