import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const jobs = await prisma.contentJob.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
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
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let body: { type?: string; title?: string; keywords?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

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
