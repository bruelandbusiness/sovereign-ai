import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { rateLimitByIP } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Mock AI scoring helpers
// ---------------------------------------------------------------------------

function generateMockAiScore(): number {
  // Random score between 40 and 95
  return Math.floor(Math.random() * 56) + 40;
}

function generateMockAiSummary(
  name: string,
  experience: string | null,
  certifications: string[]
): string {
  const summaries = [
    `${name} demonstrates solid technical aptitude and relevant industry experience.`,
    `Based on qualifications analysis, ${name} shows strong potential for this role.`,
    `${name} brings a well-rounded skill set with practical hands-on expertise.`,
    `Assessment indicates ${name} has the technical foundation required for the position.`,
    `${name} presents a compelling background with applicable industry knowledge.`,
  ];

  let summary = summaries[Math.floor(Math.random() * summaries.length)];

  if (experience) {
    summary += ` Their experience in ${experience.substring(0, 60)} is directly relevant.`;
  }
  if (certifications.length > 0) {
    summary += ` Holds certifications: ${certifications.join(", ")}.`;
  }

  return summary;
}

// ---------------------------------------------------------------------------
// GET — List applicants for a job (paginated)
// ---------------------------------------------------------------------------

export async function GET(
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

  const { id: jobId } = await params;
  const url = request.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  // Verify the job belongs to this client
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, clientId },
  });

  if (!job) {
    return NextResponse.json(
      { error: "Job posting not found" },
      { status: 404 }
    );
  }

  const [applicants, total] = await Promise.all([
    prisma.applicant.findMany({
      where: { jobId },
      orderBy: { aiScore: "desc" },
      skip,
      take: limit,
    }),
    prisma.applicant.count({ where: { jobId } }),
  ]);

  return NextResponse.json({
    applicants: applicants.map((a) => ({
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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ---------------------------------------------------------------------------
// Zod schema for applicant submissions
// ---------------------------------------------------------------------------

const applicantSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional(),
  experience: z.string().max(5000).optional(),
  certifications: z.array(z.string().max(200)).max(20).optional(),
  coverLetter: z.string().max(10000).optional(),
});

// ---------------------------------------------------------------------------
// POST — Submit an application for a job
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 submissions per hour per IP (form submission)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "recruiting-apply", 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { id: jobId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = applicantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, phone, experience, certifications, coverLetter } = parsed.data;

  // Verify the job exists and is active
  const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json(
      { error: "Job posting not found" },
      { status: 404 }
    );
  }
  if (job.status !== "active") {
    return NextResponse.json(
      { error: "This job posting is no longer accepting applications" },
      { status: 400 }
    );
  }

  // Generate mock AI score and summary
  const certs = certifications ?? [];
  const aiScore = generateMockAiScore();
  const aiSummary = generateMockAiSummary(name, experience || null, certs);

  // Create applicant
  const applicant = await prisma.applicant.create({
    data: {
      jobId,
      name,
      email,
      phone: phone || null,
      experience: experience || null,
      certifications: JSON.stringify(certs),
      coverLetter: coverLetter || null,
      aiScore,
      aiSummary,
    },
  });

  // Increment applicant count on job posting
  await prisma.jobPosting.update({
    where: { id: jobId },
    data: { applicantCount: { increment: 1 } },
  });

  // Create an activity event for the client
  try {
    await prisma.activityEvent.create({
      data: {
        clientId: job.clientId,
        type: "applicant_received",
        title: `New applicant: ${name}`,
        description: `${name} applied for "${job.title}" with an AI score of ${aiScore}.`,
      },
    });
  } catch {
    // Non-critical
  }

  return NextResponse.json({
    id: applicant.id,
    jobId: applicant.jobId,
    name: applicant.name,
    email: applicant.email,
    phone: applicant.phone,
    experience: applicant.experience,
    certifications: applicant.certifications,
    aiScore: applicant.aiScore,
    aiSummary: applicant.aiSummary,
    status: applicant.status,
    createdAt: applicant.createdAt.toISOString(),
  });
}

// ---------------------------------------------------------------------------
// PUT — Update applicant status (called from dashboard)
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

  const { id: jobId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateApplicantSchema = z.object({
    applicantId: z.string().min(1).max(100),
    status: z.enum(["new", "screening", "interview", "offer", "hired", "rejected"]),
  });

  const parsed = updateApplicantSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { applicantId, status } = parsed.data;

  // Verify the job belongs to this client
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, clientId },
  });
  if (!job) {
    return NextResponse.json(
      { error: "Job posting not found" },
      { status: 404 }
    );
  }

  // Verify the applicant belongs to this job
  const existing = await prisma.applicant.findFirst({
    where: { id: applicantId, jobId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Applicant not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
