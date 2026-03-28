/**
 * Sovereign AI — Blog Content Generation Script
 *
 * Queues 10 high-value SEO blog posts targeting home service contractors
 * searching for AI marketing solutions. Jobs are picked up and processed
 * automatically by the content cron at /api/cron/content.
 *
 * Usage: npx tsx scripts/generate-blog-content.ts
 */

import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// ── BLOG TOPICS ──────────────────────────────────────────────────────────────

const BLOG_TOPICS = [
  {
    title: "How AI is Revolutionizing HVAC Marketing in 2026",
    keywords: "AI HVAC marketing, HVAC lead generation, AI marketing 2026, HVAC digital marketing",
    type: "blog" as const,
  },
  {
    title: "5 Ways Plumbing Companies Are Using AI to Get More Leads",
    keywords: "AI plumbing leads, plumbing lead generation, AI marketing plumbers, plumber more leads",
    type: "blog" as const,
  },
  {
    title: "Why Your Roofing Company Needs an AI Receptionist",
    keywords: "AI receptionist roofing, roofing company AI, AI phone answering roofing, roofing lead capture",
    type: "blog" as const,
  },
  {
    title: "The Complete Guide to AI-Powered Review Management for Contractors",
    keywords: "AI review management, contractor reviews, Google reviews automation, home service reputation management",
    type: "blog" as const,
  },
  {
    title: "How Minneapolis Contractors Are Doubling Revenue with AI Marketing",
    keywords: "Minneapolis contractor marketing, AI marketing Minneapolis, home service AI revenue, contractor revenue growth",
    type: "blog" as const,
  },
  {
    title: "AI vs Traditional Marketing: ROI Comparison for Home Service Businesses",
    keywords: "AI marketing ROI, traditional marketing vs AI, home service marketing ROI, contractor marketing comparison",
    type: "blog" as const,
  },
  {
    title: "Stop Missing Calls: How AI Voice Agents Save Contractors $50K/Year",
    keywords: "AI voice agent contractors, missed calls contractor, AI phone answering service, contractor call answering",
    type: "blog" as const,
  },
  {
    title: "The Contractor's Guide to AI-Powered SEO in 2026",
    keywords: "AI SEO contractors, contractor local SEO, AI-powered SEO 2026, home service SEO",
    type: "blog" as const,
  },
  {
    title: "How to Automate Your Home Service Business with AI",
    keywords: "home service automation, AI business automation, contractor automation, automate home service marketing",
    type: "blog" as const,
  },
  {
    title: "Why Top Electricians Are Switching to AI Marketing Platforms",
    keywords: "AI marketing electricians, electrician marketing platform, electrical contractor marketing, AI electrician leads",
    type: "blog" as const,
  },
];

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n📝 SOVEREIGN AI — BLOG CONTENT QUEUE SETUP\n");
  console.log("=".repeat(60));

  // Resolve the Sovereign AI client record (first client = Sovereign AI's own account)
  const client = await prisma.client.findFirst({ select: { id: true, businessName: true } });
  if (!client) {
    throw new Error(
      "No client record found. Run scripts/setup-autonomous.ts first to create the Sovereign AI client."
    );
  }
  console.log(`\n✅ Using client: ${client.businessName} (${client.id})\n`);

  // Fetch existing job titles to avoid duplicates
  const existingJobs = await prisma.contentJob.findMany({
    where: { clientId: client.id },
    select: { title: true },
  });
  const existingTitles = new Set(existingJobs.map((j) => j.title));

  let queued = 0;
  let skipped = 0;

  console.log("Queueing blog posts...\n");

  for (const topic of BLOG_TOPICS) {
    if (existingTitles.has(topic.title)) {
      console.log(`  ⏭️  Already exists — skipping: "${topic.title}"`);
      skipped++;
      continue;
    }

    await prisma.contentJob.create({
      data: {
        clientId: client.id,
        type: topic.type,
        title: topic.title,
        keywords: topic.keywords,
        status: "queued",
      },
    });

    console.log(`  ✅ Queued: "${topic.title}"`);
    queued++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n🎯 Done — ${queued} jobs queued, ${skipped} skipped (already existed)\n`);

  if (queued > 0) {
    console.log("The content cron at /api/cron/content processes 2 jobs per run.");
    console.log("At the default daily cadence all posts will publish within ~5 cron runs.\n");
    console.log("To trigger generation immediately, call:");
    console.log("  GET /api/cron/content  (with CRON_SECRET header)\n");
  }
}

main()
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
