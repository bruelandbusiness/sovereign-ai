import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CareerApplicationForm } from "./CareerApplicationForm";

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await prisma.jobPosting.findUnique({
    where: { id: slug },
    include: { client: { select: { businessName: true } } },
  });

  if (!job || job.status !== "active") {
    return { title: "Job Not Found | Sovereign AI" };
  }

  return {
    title: `${job.title} | ${job.client.businessName} | Careers`,
    description: job.description.substring(0, 160),
    alternates: { canonical: `/careers/${slug}` },
    openGraph: {
      title: `${job.title} at ${job.client.businessName}`,
      description: job.description.substring(0, 160),
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} at ${job.client.businessName}`,
      description: job.description.substring(0, 160),
    },
  };
}

// ---------------------------------------------------------------------------
// Type labels
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
};

// ---------------------------------------------------------------------------
// Server Component
// ---------------------------------------------------------------------------

export default async function CareerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const job = await prisma.jobPosting.findUnique({
    where: { id: slug },
    include: { client: { select: { businessName: true } } },
  });

  if (!job || job.status !== "active") {
    notFound();
  }

  // Increment view count (non-blocking)
  prisma.jobPosting
    .update({ where: { id: slug }, data: { viewCount: { increment: 1 } } })
    .catch((err) => logger.errorWithCause("[careers] View tracking failed", err));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 py-12">
        <Container size="md">
          {/* Job Header */}
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-primary">
              {job.client.businessName}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {job.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {job.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {job.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {typeLabels[job.type] ?? job.type}
              </span>
              {job.compensation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                  {job.compensation}
                </span>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="mb-8 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
            <h2 className="mb-3 text-lg font-semibold">About this role</h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div className="mb-8 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
              <h2 className="mb-3 text-lg font-semibold">Requirements</h2>
              <ul className="space-y-2">
                {(JSON.parse(job.requirements) as string[]).map((req: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Form */}
          <div
            id="apply"
            className="rounded-xl bg-card p-6 ring-1 ring-foreground/10"
          >
            <h2 className="mb-4 text-lg font-semibold">Apply Now</h2>
            <CareerApplicationForm jobId={job.id} />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
