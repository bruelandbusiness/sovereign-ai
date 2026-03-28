import { Pool } from "pg";
import { randomBytes } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface Target {
  q: string;
  city: string;
  state: string;
  vertical: string;
}

const targets: Target[] = [
  { q: "HVAC companies in Scottsdale AZ", city: "Scottsdale", state: "AZ", vertical: "HVAC" },
  { q: "HVAC companies in Mesa AZ", city: "Mesa", state: "AZ", vertical: "HVAC" },
  { q: "HVAC companies in Tempe AZ", city: "Tempe", state: "AZ", vertical: "HVAC" },
  { q: "HVAC companies in Chandler AZ", city: "Chandler", state: "AZ", vertical: "HVAC" },
  { q: "plumbing companies in Phoenix AZ", city: "Phoenix", state: "AZ", vertical: "Plumbing" },
  { q: "roofing companies in Phoenix AZ", city: "Phoenix", state: "AZ", vertical: "Roofing" },
  { q: "electrician companies in Phoenix AZ", city: "Phoenix", state: "AZ", vertical: "Electrical" },
  { q: "HVAC companies in Las Vegas NV", city: "Las Vegas", state: "NV", vertical: "HVAC" },
  { q: "HVAC companies in Dallas TX", city: "Dallas", state: "TX", vertical: "HVAC" },
  { q: "HVAC companies in Houston TX", city: "Houston", state: "TX", vertical: "HVAC" },
  { q: "HVAC companies in Austin TX", city: "Austin", state: "TX", vertical: "HVAC" },
  { q: "HVAC companies in Tampa FL", city: "Tampa", state: "FL", vertical: "HVAC" },
  { q: "HVAC companies in Atlanta GA", city: "Atlanta", state: "GA", vertical: "HVAC" },
  { q: "plumbing companies in Dallas TX", city: "Dallas", state: "TX", vertical: "Plumbing" },
  { q: "roofing companies in Dallas TX", city: "Dallas", state: "TX", vertical: "Roofing" },
];

async function main() {
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const t of targets) {
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google_maps");
      url.searchParams.set("q", t.q);
      url.searchParams.set("type", "search");
      url.searchParams.set("api_key", process.env.SERPAPI_KEY || "");

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!data.local_results) {
        console.log("✗", t.q, "- no results");
        continue;
      }

      let added = 0;
      for (const biz of data.local_results) {
        const placeId = biz.place_id || null;
        if (placeId) {
          const dup = await pool.query('SELECT id FROM "Prospect" WHERE "placeId" = $1', [placeId]);
          if (dup.rows.length > 0) {
            totalSkipped++;
            continue;
          }
        }

        const id = "pr_" + randomBytes(12).toString("hex");
        const reviewCount = biz.reviews || 0;
        const rating = biz.rating || null;
        const website = biz.website || null;

        let score = 0;
        if (!reviewCount || reviewCount < 50) score += 20;
        if (rating && rating < 4.5) score += 15;
        if (!website) score += 25;
        else score += 10;
        if (reviewCount && reviewCount < 200) score += 15;
        if (biz.phone) score += 15;

        await pool.query(
          `INSERT INTO "Prospect" (id, "businessName", phone, website, address, city, state, vertical, score, status, "placeId", rating, "reviewCount", "googleMapsUrl", source, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10, $11, $12, $13, 'serpapi_google_maps', NOW(), NOW())`,
          [id, biz.title, biz.phone || null, website, biz.address || null, t.city, t.state, t.vertical, score, placeId, rating, reviewCount, biz.link || null]
        );
        added++;
      }

      totalAdded += added;
      console.log("✓", t.q, "-", added, "added (" + data.local_results.length + " found)");

      // Rate limit
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.slice(0, 80) : String(e);
      console.log("✗", t.q, "-", msg);
    }
  }

  // Enrich with emails
  console.log("\n--- Enriching emails from websites ---\n");

  const noEmail = await pool.query('SELECT id, "businessName", website FROM "Prospect" WHERE email IS NULL AND website IS NOT NULL') as { rows: { id: string; businessName: string; website: string }[] };
  let emailsFound = 0;

  for (const p of noEmail.rows) {
    try {
      const base = p.website.startsWith("http") ? p.website : "https://" + p.website;
      const urls = [base, base + "/contact", base + "/contact-us", base + "/about"];

      for (const url of urls) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
          clearTimeout(timeout);
          if (!res.ok) continue;

          const html = await res.text();
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const emails = [...new Set(html.match(emailRegex) || [])].filter(
            (e) =>
              !e.includes("example") &&
              !e.includes("sentry") &&
              !e.includes(".png") &&
              !e.includes(".jpg") &&
              !e.includes(".webp") &&
              !e.includes(".avif") &&
              !e.includes(".svg") &&
              !e.includes("noreply") &&
              !e.includes("no-reply") &&
              !e.includes("wixpress") &&
              !e.includes("protection") &&
              !e.includes("johndoe") &&
              !e.includes("user@domain") &&
              !e.includes("@2x") &&
              !e.includes("@sentry") &&
              !e.includes("webpack") &&
              e.length < 60
          );

          if (emails.length > 0) {
            await pool.query('UPDATE "Prospect" SET email = $1, "emailSource" = \'website_scrape\', "emailVerified" = false, "updatedAt" = NOW() WHERE id = $2', [emails[0], p.id]);
            console.log("  ✓", p.businessName, "->", emails[0]);
            emailsFound++;
            break;
          }
        } catch {
          // skip this URL
        }
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch {
      // skip this prospect
    }
  }

  // Summary
  const total = await pool.query('SELECT COUNT(*) FROM "Prospect"') as { rows: { count: string }[] };
  const withEmail = await pool.query('SELECT COUNT(*) FROM "Prospect" WHERE email IS NOT NULL') as { rows: { count: string }[] };
  const byMarket = await pool.query('SELECT city, state, vertical, COUNT(*) as cnt FROM "Prospect" GROUP BY city, state, vertical ORDER BY cnt DESC') as { rows: { city: string; state: string; vertical: string; cnt: string }[] };

  console.log("\n=== PIPELINE SUMMARY ===");
  console.log("New prospects added:", totalAdded);
  console.log("Duplicates skipped:", totalSkipped);
  console.log("Emails found:", emailsFound);
  console.log("Total in database:", total.rows[0].count);
  console.log("With email:", withEmail.rows[0].count);
  console.log("\nBy market:");
  byMarket.rows.forEach((r: { city: string; state: string; vertical: string; cnt: string }) => console.log(" ", r.city + ", " + r.state, "-", r.vertical + ":", r.cnt));

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
