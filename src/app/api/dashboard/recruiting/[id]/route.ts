import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const updateJobSchema = z.object({
  status: z.enum(["active", "paused", "closed", "filled"]),
});

// ---------------------------------------------------------------------------
// GET — Single job posting with applicants
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  try {
    const job = await prisma.jobPosting.findFirst({
      where: { id, clientId },
      include: {
        applicants: {
          orderBy: { aiScore: "desc" },
          take: 200,
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job posting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      compensation: job.compensation,
      location: job.location,
      type: job.type,
      status: job.status,
      applicantCount: job.applicantCount,
      viewCount: job.viewCount,
      createdAt: job.createdAt.toISOString(),
      applicants: job.applicants.map((a) => ({
        id: a.id,
        jobId: a.jobId,
        name: a.name,
        email: a.email,
        phone: a.phone,
        experience: a.experience,
        certifications: a.certifications,
        aiScore: a.aiScore,
        aiSummary: a.aiSummary,
        status: a.status,
        coverLetter: a.coverLetter,
        notes: a.notes,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[api/dashboard/recruiting/[id]] GET failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update job posting status
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { status } = parsed.data;

  try {
    // Verify ownership
    const existing = await prisma.jobPosting.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Job posting not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[api/dashboard/recruiting/[id]] PUT failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
