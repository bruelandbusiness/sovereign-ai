import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Cron schedule definitions read from vercel.json at build time.
 *
 * Each entry maps a cron path to its schedule expression so the endpoint
 * can compute expected intervals and flag stale jobs.
 */
const CRON_JOBS: ReadonlyArray<{ path: string; schedule: string }> = [
  { path: "/api/cron/content", schedule: "0 6 * * *" },
  { path: "/api/cron/reviews", schedule: "0 9 * * *" },
  { path: "/api/cron/email", schedule: "0 10 * * *" },
  { path: "/api/cron/booking", schedule: "0 12 * * *" },
  { path: "/api/cron/weekly-report", schedule: "0 8 * * 1" },
  { path: "/api/cron/reactivation", schedule: "0 11 * * *" },
  { path: "/api/cron/nps", schedule: "0 14 * * *" },
  { path: "/api/funnel-nurture", schedule: "0 7 * * *" },
  { path: "/api/cron/social", schedule: "0 8 * * *" },
  { path: "/api/cron/anomaly-detection", schedule: "0 3 * * *" },
  { path: "/api/cron/email-queue", schedule: "*/5 * * * *" },
  { path: "/api/cron/trial-expiry", schedule: "0 13 * * *" },
  { path: "/api/cron/review-responses", schedule: "0 15 * * *" },
  { path: "/api/cron/lead-nurture", schedule: "0 16 * * *" },
  { path: "/api/cron/social-publish", schedule: "15 9 * * *" },
  { path: "/api/cron/booking-reminders", schedule: "15 7 * * *" },
  { path: "/api/cron/seasonal-campaigns", schedule: "0 5 1 * *" },
  { path: "/api/cron/seo-track", schedule: "0 2 * * *" },
  { path: "/api/cron/cleanup", schedule: "0 4 * * 0" },
  { path: "/api/cron/qbr", schedule: "0 0 1 1,4,7,10 *" },
  { path: "/api/cron/ads-sync", schedule: "0 5 * * *" },
  { path: "/api/cron/aeo-check", schedule: "0 4 * * 1" },
  { path: "/api/cron/insight-generation", schedule: "15 6 * * *" },
  { path: "/api/cron/ltv-reminders", schedule: "30 9 * * *" },
  { path: "/api/cron/benchmark-aggregation", schedule: "0 3 * * 1" },
  { path: "/api/cron/performance-billing", schedule: "0 1 1 * *" },
  { path: "/api/cron/fsm-sync", schedule: "*/15 * * * *" },
  { path: "/api/cron/orchestration-process", schedule: "*/10 * * * *" },
  { path: "/api/cron/agent-continue", schedule: "5/10 * * * *" },
  { path: "/api/cron/compliance-purge", schedule: "0 3 * * 0" },
  { path: "/api/cron/enrichment-run", schedule: "30 6 * * *" },
  { path: "/api/cron/discovery-run", schedule: "15 5 * * *" },
  { path: "/api/cron/telegram-digest", schedule: "15 8 * * *" },
  { path: "/api/cron/followup-process", schedule: "5/15 * * * *" },
  { path: "/api/cron/roi-weekly", schedule: "30 8 * * 1" },
  { path: "/api/cron/roi-monthly", schedule: "0 8 1 * *" },
  { path: "/api/cron/outreach-process", schedule: "10/15 * * * *" },
  { path: "/api/cron/outreach-warmup", schedule: "0 0 * * *" },
  { path: "/api/cron/prospect-discovery", schedule: "0 6 * * 1" },
  { path: "/api/cron/case-study-generation", schedule: "0 7 1 * *" },
  { path: "/api/cron/health-score", schedule: "30 7 * * *" },
  { path: "/api/cron/system-health", schedule: "2/5 * * * *" },
  { path: "/api/cron/morning-brief", schedule: "5 15 * * *" },
  { path: "/api/cron/evening-digest", schedule: "0 1 * * *" },
  { path: "/api/cron/weekly-digest", schedule: "0 15 * * 1" },
  { path: "/api/cron/monthly-report", schedule: "0 15 1 * *" },
  { path: "/api/cron/expansion-check", schedule: "0 17 * * 3" },
  { path: "/api/cron/churn-check", schedule: "10 15 * * *" },
  { path: "/api/cron/lead-cleanup", schedule: "0 8 * * 0" },
  { path: "/api/cron/guarantee-check", schedule: "0 2 1 * *" },
  { path: "/api/cron/health-check", schedule: "0 * * * *" },
  { path: "/api/cron/outreach-send", schedule: "*/15 9-17 * * 1-5" },
  { path: "/api/cron/outreach-enqueue", schedule: "45 7 * * *" },
  { path: "/api/cron/prospect-to-campaign", schedule: "30 7 * * *" },
  { path: "/api/cron/abandoned-cart", schedule: "0 */4 * * *" },
  { path: "/api/cron/welcome-drip", schedule: "0 */6 * * *" },
  { path: "/api/cron/re-engagement", schedule: "0 0 * * *" },
  { path: "/api/cron/quote-expiry", schedule: "0 2 * * *" },
];

// ---------------------------------------------------------------------------
// Schedule parsing helpers
// ---------------------------------------------------------------------------

/**
 * Derive the expected interval in milliseconds from a cron schedule.
 *
 * Uses a heuristic approach: examines the minute and hour fields to
 * determine whether the job runs every N minutes, every N hours, daily,
 * weekly, or monthly, and returns the corresponding interval.
 */
function expectedIntervalMs(schedule: string): number {
  const parts = schedule.split(" ");
  if (parts.length < 5) return 24 * 60 * 60 * 1000; // fallback: daily

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

  // Every N minutes: */5, */10, */15, 5/10, 2/5, etc.
  if (minute.includes("/")) {
    const step = parseInt(minute.split("/")[1], 10);
    if (!isNaN(step) && step > 0) {
      return step * 60 * 1000;
    }
  }

  // Every N hours: hour field has */N or similar step
  if (hour.includes("/")) {
    const step = parseInt(hour.split("/")[1], 10);
    if (!isNaN(step) && step > 0) {
      return step * 60 * 60 * 1000;
    }
  }

  // Hourly: minute is fixed, hour is *
  if (hour === "*" && !minute.includes("/") && !minute.includes("*")) {
    return 60 * 60 * 1000;
  }

  // Monthly: specific day of month
  if (dayOfMonth !== "*") {
    return 31 * 24 * 60 * 60 * 1000;
  }

  // Weekly: specific day of week
  if (dayOfWeek !== "*") {
    return 7 * 24 * 60 * 60 * 1000;
  }

  // Daily (default for fixed hour + minute)
  return 24 * 60 * 60 * 1000;
}

/**
 * Derive search terms from a cron path for matching auditLog entries.
 *
 * Returns the job slug (e.g. "booking-reminders") and common action
 * patterns that cron handlers use when writing audit records.
 */
function deriveSearchTerms(cronPath: string): string[] {
  // "/api/cron/booking-reminders" -> "booking-reminders"
  const slug = cronPath.replace(/^\/api\/(cron\/)?/, "");
  const underscored = slug.replace(/-/g, "_");
  const slashed = `cron/${slug}`;

  return [slug, underscored, slashed];
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface CronStatusEntry {
  name: string;
  schedule: string;
  expectedIntervalMs: number;
  lastRun: string | null;
  lastStatus: "success" | "error" | "unknown";
  runsLast24h: number;
  errorsLast24h: number;
  stale: boolean;
  staleSinceMs: number | null;
}

// ---------------------------------------------------------------------------
// GET /api/admin/cron-status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Auth
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  // Rate limit: 30 requests per hour per IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimitByIP(ip, "admin-cron-status", 30);
  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
    return setRateLimitHeaders(res, rl);
  }

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch all audit log entries from the last 24 hours that could relate
    // to cron jobs. We search broadly by action patterns containing cron
    // slugs, then match per-job in memory.
    const recentAuditEntries = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        OR: [
          { resource: "cron" },
          { action: { contains: "cron" } },
          // Common cron action patterns from existing handlers
          { action: { contains: "booking_reminder" } },
          { action: { contains: "lead_nurture" } },
          { action: { contains: "welcome_drip" } },
          { action: { contains: "abandoned_cart" } },
          { action: { contains: "re_engagement" } },
          { action: { contains: "weekly_report" } },
          { action: { contains: "drip" } },
          { action: { contains: "nurture" } },
          { action: { contains: "reminder" } },
          { action: { contains: "digest" } },
          { action: { contains: "cleanup" } },
          { action: { contains: "sync" } },
          { action: { contains: "enrichment" } },
          { action: { contains: "discovery" } },
          { action: { contains: "outreach" } },
          { action: { contains: "reactivation" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        action: true,
        resource: true,
        metadata: true,
        createdAt: true,
      },
      take: 5000,
    });

    // Build status for each known cron job
    const statuses: CronStatusEntry[] = CRON_JOBS.map((job) => {
      const searchTerms = deriveSearchTerms(job.path);
      const interval = expectedIntervalMs(job.schedule);

      // Match audit entries to this job by checking if any search term
      // appears in the action, resource, or metadata fields
      const matchingEntries = recentAuditEntries.filter((entry) => {
        const haystack = [
          entry.action,
          entry.resource,
          entry.metadata ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchTerms.some((term) =>
          haystack.includes(term.toLowerCase()),
        );
      });

      const runsLast24h = matchingEntries.length;

      // Determine errors: entries with "error" or "fail" in action/metadata
      const errorEntries = matchingEntries.filter((entry) => {
        const text = [entry.action, entry.metadata ?? ""]
          .join(" ")
          .toLowerCase();
        return text.includes("error") || text.includes("fail");
      });
      const errorsLast24h = errorEntries.length;

      // Most recent run
      const lastEntry = matchingEntries[0] ?? null;
      const lastRun = lastEntry ? lastEntry.createdAt.toISOString() : null;

      // Determine last status
      let lastStatus: "success" | "error" | "unknown" = "unknown";
      if (lastEntry) {
        const lastText = [lastEntry.action, lastEntry.metadata ?? ""]
          .join(" ")
          .toLowerCase();
        const isError =
          lastText.includes("error") || lastText.includes("fail");
        lastStatus = isError ? "error" : "success";
      }

      // Stale detection: job hasn't run within 2x its expected interval
      // (generous buffer to account for timing variance)
      const staleThreshold = interval * 2;
      const timeSinceLastRun = lastEntry
        ? now.getTime() - lastEntry.createdAt.getTime()
        : null;
      const stale =
        timeSinceLastRun === null || timeSinceLastRun > staleThreshold;
      const staleSinceMs =
        stale && timeSinceLastRun !== null ? timeSinceLastRun : null;

      return {
        name: job.path,
        schedule: job.schedule,
        expectedIntervalMs: interval,
        lastRun,
        lastStatus,
        runsLast24h,
        errorsLast24h,
        stale,
        staleSinceMs,
      };
    });

    // Sort by staleness: stale jobs first, then by longest time since last run
    const sorted = [...statuses].sort((a, b) => {
      // Stale jobs first
      if (a.stale && !b.stale) return -1;
      if (!a.stale && b.stale) return 1;

      // Among stale jobs: never-run (null lastRun) first, then longest silence
      if (a.stale && b.stale) {
        if (a.lastRun === null && b.lastRun !== null) return -1;
        if (a.lastRun !== null && b.lastRun === null) return 1;
        if (a.staleSinceMs !== null && b.staleSinceMs !== null) {
          return b.staleSinceMs - a.staleSinceMs;
        }
        return 0;
      }

      // Among healthy jobs: sort by most recent errors
      if (a.errorsLast24h !== b.errorsLast24h) {
        return b.errorsLast24h - a.errorsLast24h;
      }
      return 0;
    });

    const summary = {
      total: sorted.length,
      stale: sorted.filter((s) => s.stale).length,
      healthy: sorted.filter((s) => !s.stale).length,
      withErrors: sorted.filter((s) => s.errorsLast24h > 0).length,
      checkedAt: now.toISOString(),
    };

    const res = NextResponse.json({ summary, crons: sorted });
    return setRateLimitHeaders(res, rl);
  } catch (error) {
    logger.errorWithCause("[admin/cron-status] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
