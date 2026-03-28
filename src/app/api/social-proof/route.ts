import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
/**
 * GET /api/social-proof
 * Returns recent lead signups (last 24h) for the social proof toast.
 * Only returns first name + city — never full emails or phones.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP (public endpoint)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "social-proof", 60);
  if (!allowed) {
    return NextResponse.json({ items: [] });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        name: true,
        source: true,
        createdAt: true,
      },
    });

    const items = leads
      .filter((l) => l.name)
      .map((l) => {
        // Extract first name + last initial
        const parts = (l.name || "").trim().split(/\s+/);
        const display =
          parts.length > 1
            ? `${parts[0]} ${parts[parts.length - 1][0]}.`
            : parts[0];

        // Map source to action text
        const action =
          l.source === "audit" || l.source === "free-audit"
            ? "just started a free audit"
            : l.source === "strategy-call"
              ? "booked a strategy call"
              : l.source === "webinar"
                ? "registered for the masterclass"
                : l.source === "playbook"
                  ? "requested the free playbook"
                  : l.source === "exit-intent"
                    ? "just started a free audit"
                    : "signed up";

        return { name: display, action, createdAt: l.createdAt };
      });

    const response = NextResponse.json({ items });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  } catch {
    return NextResponse.json({ items: [] });
  }
}
