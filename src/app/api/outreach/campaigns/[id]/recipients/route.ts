import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const recipientSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(200).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  vertical: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
});

const recipientsUploadSchema = z.object({
  recipients: z.array(recipientSchema).min(1).max(10_000),
});

// ---------------------------------------------------------------------------
// POST /api/outreach/campaigns/[id]/recipients — Upload recipients
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { id: campaignId } = await params;

  // Verify campaign exists
  const campaign = await prisma.coldOutreachCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = recipientsUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { recipients } = parsed.data;

  // Deduplicate by email within the batch
  const seen = new Set<string>();
  const unique = recipients.filter((r) => {
    const lower = r.email.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  // Use skipDuplicates to handle existing emails in the campaign
  const result = await prisma.coldEmailRecipient.createMany({
    data: unique.map((r) => ({
      campaignId,
      email: r.email.toLowerCase(),
      name: r.name ?? null,
      company: r.company ?? null,
      vertical: r.vertical ?? null,
      city: r.city ?? null,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json(
    {
      uploaded: unique.length,
      created: result.count,
      duplicatesSkipped: unique.length - result.count,
    },
    { status: 201 }
  );
}
