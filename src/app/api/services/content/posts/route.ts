import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const createContentJobSchema = z.object({
  type: z.string().max(50).optional(),
  title: z.string().min(1, "title is required").max(500),
  keywords: z.string().max(1000).optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const jobs = await prisma.contentJob.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      clientId: true,
      type: true,
      title: true,
      content: true,
      keywords: true,
      status: true,
      publishAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const response = NextResponse.json(
    jobs.map((j) => ({
      id: j.id,
      clientId: j.clientId,
      type: j.type,
      title: j.title,
      content: j.content,
      keywords: j.keywords,
      status: j.status,
      publishAt: j.publishAt?.toISOString() ?? null,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    }))
  );
  response.headers.set(
    "Cache-Control",
    "private, max-age=120, stale-while-revalidate=60"
  );
  return response;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createContentJobSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;

  const job = await prisma.contentJob.create({
    data: {
      clientId,
      type: body.type || "blog",
      title: body.title,
      keywords: body.keywords || null,
      status: "queued",
    },
  });

  return NextResponse.json(
    {
      id: job.id,
      clientId: job.clientId,
      type: job.type,
      title: job.title,
      content: job.content,
      keywords: job.keywords,
      status: job.status,
      publishAt: job.publishAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
