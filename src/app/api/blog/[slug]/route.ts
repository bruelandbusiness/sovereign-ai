import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "blog-detail", 120);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      ...post,
      publishedAt: post.publishedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    logger.errorWithCause("[blog/slug] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
