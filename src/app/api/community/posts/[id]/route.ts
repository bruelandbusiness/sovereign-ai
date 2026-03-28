import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const addCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

const pinSchema = z.object({
  isPinned: z.boolean(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            client: { select: { businessName: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                client: { select: { businessName: true } },
              },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      isPinned: post.isPinned,
      authorId: post.authorId,
      authorName: post.author.client?.businessName || post.author.name || "Anonymous",
      authorRole: post.author.role,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorId: c.authorId,
        authorName: c.author.client?.businessName || c.author.name || "Anonymous",
        authorRole: c.author.role,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.errorWithCause("[community/posts/[id]] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 comments per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "community-comment", 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if post exists
    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();

    // Check if this is a pin/unpin request (admin only)
    if ("isPinned" in body) {
      if (session.account.role !== "admin") {
        return NextResponse.json({ error: "Only admins can pin posts" }, { status: 403 });
      }
      const data = pinSchema.parse(body);
      const updated = await prisma.communityPost.update({
        where: { id },
        data: { isPinned: data.isPinned },
      });
      return NextResponse.json({
        id: updated.id,
        isPinned: updated.isPinned,
        message: data.isPinned ? "Post pinned" : "Post unpinned",
      });
    }

    // Otherwise, add a comment
    const data = addCommentSchema.parse(body);

    const comment = await prisma.communityComment.create({
      data: {
        postId: id,
        authorId: session.account.id,
        content: data.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            client: { select: { businessName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.author.client?.businessName || comment.author.name || "Anonymous",
      authorRole: comment.author.role,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    logger.errorWithCause("Community post action error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only the author or an admin can delete
    if (post.authorId !== session.account.id && session.account.role !== "admin") {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    await prisma.communityPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause("[community/posts/[id]] DELETE failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
