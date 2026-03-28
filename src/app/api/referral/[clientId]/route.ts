import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { z } from "zod";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// Public endpoint — no auth required
// Customers submit referrals via the public referral landing page

const referralSchema = z.object({
  referrerName: z.string().min(1),
  referrerPhone: z.string().optional(),
  referrerEmail: z.string().email().optional(),
  referredName: z.string().min(1),
  referredPhone: z.string().optional(),
  referredEmail: z.string().email().optional(),
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "REF-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "referral-submit", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { clientId } = await params;

    // Verify client exists and has referral program enabled.
    // Eagerly load account (for notifications) and the referral-program
    // service config in a single query to avoid separate N+1 lookups later.
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        businessName: true,
        account: { select: { id: true } },
        services: {
          where: { serviceId: "referral-program" },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const service = client.services[0] ?? null;

    let config: { enabled?: boolean; reward?: string; rewardText?: string } = { enabled: true };
    if (service?.config) {
      try {
        config = JSON.parse(service.config) as typeof config;
      } catch {
        // use defaults
      }
    }

    if (!config.enabled) {
      return NextResponse.json(
        { error: "Referral program is not currently active" },
        { status: 400 }
      );
    }

    // Validate body
    let body: z.infer<typeof referralSchema>;
    try {
      const rawBody = await request.json();
      const result = referralSchema.safeParse(rawBody);
      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      body = result.data;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Generate a unique referral code
    const code = generateReferralCode();

    // Determine reward text
    const reward = config.rewardText || config.reward || "$25 off";

    // Create the referral
    await prisma.customerReferral.create({
      data: {
        clientId,
        referrerName: body.referrerName,
        referrerPhone: body.referrerPhone,
        referrerEmail: body.referrerEmail,
        referredName: body.referredName,
        referredPhone: body.referredPhone,
        referredEmail: body.referredEmail,
        code,
        reward,
        status: "pending",
      },
    });

    // Log activity
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "lead_captured",
        title: "New customer referral",
        description: `${body.referrerName} referred ${body.referredName} via referral program.`,
      },
    });

    // Notify the business (using the account eagerly loaded above)
    if (client.account) {
      await prisma.notification.create({
        data: {
          accountId: client.account.id,
          type: "lead",
          title: "New customer referral",
          message: `${body.referrerName} referred ${body.referredName}. Referral code: ${code}`,
          actionUrl: "/dashboard/leads",
        },
      });
    }

    return NextResponse.json({
      success: true,
      referralCode: code,
      message: `Thank you for referring ${body.referredName}! Your referral code is ${code}.`,
    });
  } catch (err) {
    logger.errorWithCause("[referral/[clientId]] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to submit referral" },
      { status: 500 }
    );
  }
}

// GET: Fetch referral program info for the public page
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

    // Eagerly load client and referral-program service config in a single
    // query to avoid a separate N+1 lookup for the service.
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        businessName: true,
        vertical: true,
        services: {
          where: { serviceId: "referral-program" },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const service = client.services[0] ?? null;

    let config = {
      enabled: true,
      rewardText: "Refer a friend and you both get $25 off!",
      terms: "Referral reward is applied after the referred customer completes their first service.",
    };

    if (service?.config) {
      try {
        const parsed = JSON.parse(service.config) as Partial<typeof config>;
        config = { ...config, ...parsed };
      } catch {
        // use defaults
      }
    }

    return NextResponse.json({
      businessName: client.businessName,
      vertical: client.vertical,
      rewardText: config.rewardText,
      terms: config.terms,
      enabled: config.enabled,
    });
  } catch (err) {
    logger.errorWithCause("[referral/[clientId]] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch referral program info" },
      { status: 500 }
    );
  }
}
