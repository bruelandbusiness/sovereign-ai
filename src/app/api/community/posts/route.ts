import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const VALID_CATEGORIES = ["general", "tips", "wins", "questions", "feature_requests"] as const;
const PAGE_SIZE = 20;

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  category: z.enum(VALID_CATEGORIES),
});

export async function GET(request: NextRequest) {
  // Rate limit: 120 reads per hour per IP (authenticated community)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed: readAllowed } = await rateLimitByIP(ip, "community-read", 120);
  if (!readAllowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const where: Record<string, unknown> = {};

  if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              client: { select: { businessName: true } },
            },
          },
          _count: { select: { comments: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
        isPinned: p.isPinned,
        authorName: p.author.client?.businessName || p.author.name || "Anonymous",
        authorRole: p.author.role,
        commentCount: p._count.comments,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    logger.errorWithCause("[community/posts] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Rate limit: 20 posts per hour per IP (prevent spam)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed: writeAllowed } = await rateLimitByIP(ip, "community-post", 20);
  if (!writeAllowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createPostSchema.parse(body);

    const post = await prisma.communityPost.create({
      data: {
        authorId: session.account.id,
        title: data.title,
        content: data.content,
        category: data.category,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            client: { select: { businessName: true } },
          },
        },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      authorName: post.author.client?.businessName || post.author.name || "Anonymous",
      commentCount: post._count.comments,
      createdAt: post.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    logger.errorWithCause("Community post create error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
