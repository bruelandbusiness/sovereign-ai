import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import {
  publishPost,
  type SocialPlatform,
} from "@/lib/integrations/social";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

const VALID_PLATFORMS: SocialPlatform[] = [
  "facebook",
  "instagram",
  "linkedin",
  "google_business",
];

// Maximum posts published per client per cron run to prevent accidental mass publishing
const MAX_PER_CLIENT_PER_RUN = 5;

// Maximum retry attempts before permanently marking as failed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAX_RETRY_ATTEMPTS = 3;

function isValidPlatform(p: string): p is SocialPlatform {
  return (VALID_PLATFORMS as string[]).includes(p);
}

// Publish scheduled social posts whose scheduledAt <= now
export const GET = withCronErrorHandler("cron/social-publish", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
  const now = new Date();

  // Find all posts ready to be published
  const scheduledPosts = await prisma.socialPost.findMany({
    where: {
      status: { in: ["scheduled"] },
      scheduledAt: { lte: now },
    },
    include: {
      client: { select: { id: true, businessName: true } },
    },
    take: 50, // Fetch more so we can apply per-client limits
    orderBy: { scheduledAt: "asc" },
  });

  // Enforce per-client limit to prevent accidental mass publishing
  const perClientCount = new Map<string, number>();
  const cappedPosts = scheduledPosts.filter((post) => {
    const count = perClientCount.get(post.clientId) ?? 0;
    if (count >= MAX_PER_CLIENT_PER_RUN) return false;
    perClientCount.set(post.clientId, count + 1);
    return true;
  });

  if (cappedPosts.length === 0) {
    return NextResponse.json({
      published: 0,
      message: "No scheduled posts ready to publish",
    });
  }

  const results: Array<{
    postId: string;
    platform: string;
    status: string;
    error?: string;
  }> = [];

  for (const post of cappedPosts) {
    try {
      if (!isValidPlatform(post.platform)) {
        results.push({
          postId: post.id,
          platform: post.platform,
          status: "failed",
          error: `Unsupported platform: ${post.platform}`,
        });
        continue;
      }

      const mediaUrls: string[] = post.mediaUrls
        ? JSON.parse(post.mediaUrls)
        : [];

      const result = await publishPost(post.platform, post.content, mediaUrls);

      if (result.success) {
        // Wrap post status update + activity event in a transaction for atomicity
        await prisma.$transaction(async (tx) => {
          await tx.socialPost.update({
            where: { id: post.id },
            data: {
              status: "published",
              publishedAt: new Date(),
              externalId: result.externalId,
            },
          });

          await tx.activityEvent.create({
            data: {
              clientId: post.client.id,
              type: "content_published",
              title: `${post.platform} post published`,
              description: `Your scheduled ${post.platform} post has been published: "${post.content.substring(0, 80)}${post.content.length > 80 ? "..." : ""}"`,
            },
          });
        });

        results.push({
          postId: post.id,
          platform: post.platform,
          status: "published",
        });
      } else {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "failed",
          },
        });

        results.push({
          postId: post.id,
          platform: post.platform,
          status: "failed",
          error: `Platform returned unsuccessful result`,
        });
      }
    } catch (error) {
      logger.errorWithCause(
        `Failed to publish post ${post.id} to ${post.platform}`,
        error
      );

      try {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "failed",
          },
        });
      } catch (updateErr) {
        logger.errorWithCause(
          `[cron/social-publish] Failed to update post ${post.id} status after error`,
          updateErr
        );
      }

      results.push({
        postId: post.id,
        platform: post.platform,
        status: "failed",
        error: `An unexpected error occurred`,
      });
    }
  }

  return NextResponse.json({
    published: results.filter((r) => r.status === "published").length,
    failed: results.filter((r) => r.status === "failed").length,
    retryPending: 0,
    skippedByClientCap: scheduledPosts.length - cappedPosts.length,
    results,
  });
  } catch (err) {
    logger.errorWithCause("[cron/social-publish] Fatal error", err);
    return NextResponse.json(
      { error: "Social publish cron job failed" },
      { status: 500 }
    );
  }
});
