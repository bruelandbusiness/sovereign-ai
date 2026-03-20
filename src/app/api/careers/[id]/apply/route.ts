import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

const applySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional(),
  experience: z.string().max(5000).optional(),
  certifications: z.array(z.string().max(200)).max(20).optional(),
  coverLetter: z.string().max(10000).optional(),
});

// ---------------------------------------------------------------------------
// Mock AI scoring helpers
// ---------------------------------------------------------------------------

function generateMockAiScore(): number {
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
// POST — Public: submit an application (no auth required)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  // Rate limit: 30 applications per hour per IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "careers-apply", 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many applications. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
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

  // Create applicant record
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

  // Create activity event for the client (non-blocking)
  prisma.activityEvent
    .create({
      data: {
        clientId: job.clientId,
        type: "applicant_received",
        title: `New applicant: ${name}`,
        description: `${name} applied for "${job.title}" via public careers page. AI Score: ${aiScore}.`,
      },
    })
    .catch((err) => console.error("[careers] Application notification failed:", err instanceof Error ? err.message : err));

  return NextResponse.json({
    id: applicant.id,
    message: "Application submitted successfully",
    aiScore: applicant.aiScore,
  });
}
