import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  requirements: z.array(z.string().max(500)).max(20).optional(),
  compensation: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
});

// ---------------------------------------------------------------------------
// GET — Recruiting dashboard: job postings + KPIs + all applicants
// ---------------------------------------------------------------------------

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch job postings with applicant counts
    const jobPostings = await prisma.jobPosting.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        applicants: {
          orderBy: { aiScore: "desc" },
          select: {
            id: true,
            jobId: true,
            name: true,
            email: true,
            phone: true,
            experience: true,
            certifications: true,
            aiScore: true,
            aiSummary: true,
            status: true,
            coverLetter: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    // Flatten applicants with job title
    const allApplicants = jobPostings.flatMap((job) =>
      job.applicants.map((a) => ({
        ...a,
        jobTitle: job.title,
        createdAt: a.createdAt.toISOString(),
      }))
    );

    // Compute KPIs
    const openPositions = jobPostings.filter((j) => j.status === "active").length;
    const totalApplicants = allApplicants.length;
    const scores = allApplicants
      .map((a) => a.aiScore)
      .filter((s): s is number => s !== null);
    const avgAiScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;
    const hiredThisMonth = allApplicants.filter(
      (a) =>
        a.status === "hired" && new Date(a.createdAt) >= startOfMonth
    ).length;

    return NextResponse.json({
      kpis: {
        openPositions,
        totalApplicants,
        avgAiScore,
        hiredThisMonth,
      },
      jobPostings: jobPostings.map((job) => ({
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
      })),
      applicants: allApplicants,
    });
  } catch (error) {
    logger.errorWithCause("[api/dashboard/recruiting] GET failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create a new job posting
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, requirements, compensation, location, type } = parsed.data;

  if (!description) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 }
    );
  }

  const validTypes = ["full_time", "part_time", "contract"];
  const jobType = validTypes.includes(type ?? "") ? type! : "full_time";

  try {
    const job = await prisma.jobPosting.create({
      data: {
        clientId,
        title,
        description,
        requirements: JSON.stringify(requirements ?? []),
        compensation: compensation || null,
        location: location || null,
        type: jobType,
      },
    });

    // Create an activity event for the client
    try {
      await prisma.activityEvent.create({
        data: {
          clientId,
          type: "job_posting_created",
          title: `Job posting created: ${title}`,
          description: `New ${jobType.replace("_", "-")} job posting for "${title}" was created.`,
        },
      });
    } catch {
      // Non-critical, ignore
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
    });
  } catch (error) {
    logger.errorWithCause("[api/dashboard/recruiting] POST failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
