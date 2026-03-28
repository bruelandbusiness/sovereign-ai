/**
 * Sovereign AI — Activate New City Email 1 Campaigns
 *
 * Finds all ColdOutreachCampaign records where name contains "Email 1"
 * and status is "draft", then sets them to "active" with startedAt = now.
 *
 * Usage: npx tsx scripts/activate-new-campaigns.ts
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

async function main() {
  console.log("\n🚀 ACTIVATE NEW CITY EMAIL 1 CAMPAIGNS\n");
  console.log("=".repeat(60));

  // Find all draft "Email 1" campaigns
  const draftCampaigns = await prisma.coldOutreachCampaign.findMany({
    where: {
      name: { contains: "Email 1" },
      status: "draft",
    },
    select: { id: true, name: true, status: true },
  });

  if (draftCampaigns.length === 0) {
    console.log("\n⚠️  No draft Email 1 campaigns found.");
    console.log(
      "    Either they are already active or the expand-outreach script hasn't been run yet.\n"
    );
    return;
  }

  console.log(`\nFound ${draftCampaigns.length} draft Email 1 campaign(s):\n`);
  for (const c of draftCampaigns) {
    console.log(`  • ${c.name} (${c.id})`);
  }

  // Activate them all
  const now = new Date();
  let activated = 0;

  for (const campaign of draftCampaigns) {
    await prisma.coldOutreachCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "active",
        startedAt: now,
      },
    });
    console.log(`\n  🟢 ACTIVATED: ${campaign.name}`);
    console.log(`     ID:        ${campaign.id}`);
    console.log(`     startedAt: ${now.toISOString()}`);
    activated++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ Done — ${activated} campaign(s) activated.`);
  console.log(
    "\n⏰ The outreach-send cron (every 15 min, 9am-5pm weekdays) will"
  );
  console.log(
    "   begin sending them on the next scheduled run.\n"
  );
}

main()
  .catch((error) => {
    console.error("\n❌ Activation failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
