import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIP(ip, "referral-track", 30);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const referral = await prisma.referralCode.findUnique({
    where: { code },
    include: { client: { select: { businessName: true } } },
  });

  if (!referral || referral.status !== "active") {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    referrer: referral.client.businessName,
    code: referral.code,
  });
}
