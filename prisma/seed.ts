/**
 * Sovereign AI — Comprehensive Database Seed Script
 *
 * Creates demo data for development and testing.
 * Uses upsert logic throughout so the script is idempotent (safe to run
 * multiple times without duplicating data).
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *   npm run db:seed
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function futureDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function cents(dollars: number): number {
  return Math.round(dollars * 100);
}

// ---------------------------------------------------------------------------
// Deterministic IDs for idempotent upserts
// ---------------------------------------------------------------------------

const DEMO_ACCOUNT_ID = "demo_account_001";
const DEMO_SESSION_ID = "demo_session_001";
const DEMO_CLIENT_ID = "demo_client_001";

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as never);

  console.log("  Seeding Sovereign AI database...\n");

  await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    // ── 1. Demo Account ──────────────────────────────────────────
    const account = await tx.account.upsert({
      where: { email: "demo@trysovereignai.com" },
      update: { name: "Demo User" },
      create: {
        id: DEMO_ACCOUNT_ID,
        email: "demo@trysovereignai.com",
        name: "Demo User",
        role: "client",
      },
    });

    await tx.session.upsert({
      where: { id: DEMO_SESSION_ID },
      update: { expiresAt: futureDate(30) },
      create: {
        id: DEMO_SESSION_ID,
        token: "demo-session-token-sovereign-ai-2024",
        accountId: account.id,
        expiresAt: futureDate(30),
        userAgent: "SeedScript/1.0",
      },
    });

    console.log("  1. Account & session created");

    // ── 2. Demo Client ───────────────────────────────────────────
    const client = await tx.client.upsert({
      where: { accountId: account.id },
      update: {
        businessName: "Phoenix HVAC Pros",
        vertical: "HVAC",
      },
      create: {
        id: DEMO_CLIENT_ID,
        accountId: account.id,
        businessName: "Phoenix HVAC Pros",
        ownerName: "Marcus Johnson",
        phone: "(602) 555-0100",
        city: "Phoenix",
        state: "AZ",
        vertical: "HVAC",
        website: "https://phoenixhvacpros.com",
        serviceAreaRadius: "30",
      },
    });

    // Subscription (growth plan)
    await tx.subscription.upsert({
      where: { clientId: client.id },
      update: { bundleId: "growth", status: "active" },
      create: {
        clientId: client.id,
        bundleId: "growth",
        status: "active",
        monthlyAmount: cents(497),
        currentPeriodEnd: futureDate(28),
      },
    });

    console.log("  2. Client & subscription created (Phoenix HVAC Pros, growth plan)");

    // ── 3. 20 Demo Leads ─────────────────────────────────────────
    const leads = [
      { name: "Sarah Mitchell", email: "sarah.m@email.com", phone: "(602) 555-0201", status: "new", source: "website", score: 72, stage: "warm", value: cents(3500), notes: "Interested in AC tune-up for summer", ago: 1 },
      { name: "James Rodriguez", email: "j.rodriguez@email.com", phone: "(480) 555-0202", status: "new", source: "chatbot", score: 65, stage: "warm", value: cents(2800), notes: "Asked about duct cleaning pricing", ago: 2 },
      { name: "Emily Chen", email: "emily.chen@email.com", phone: "(623) 555-0203", status: "new", source: "form", score: 58, stage: "cold", value: cents(1500), notes: "Submitted contact form, needs callback", ago: 3 },
      { name: "David Thompson", email: "d.thompson@email.com", phone: "(602) 555-0204", status: "qualified", source: "phone", score: 85, stage: "hot", value: cents(8500), notes: "Full system replacement, wants quote this week", ago: 5 },
      { name: "Maria Garcia", email: "m.garcia@email.com", phone: "(480) 555-0205", status: "qualified", source: "referral", score: 90, stage: "hot", value: cents(12000), notes: "Referred by neighbor, needs new AC unit", ago: 7 },
      { name: "Robert Wilson", email: "r.wilson@email.com", phone: "(623) 555-0206", status: "qualified", source: "website", score: 78, stage: "warm", value: cents(4200), notes: "Commercial HVAC maintenance contract", ago: 8 },
      { name: "Lisa Anderson", email: "l.anderson@email.com", phone: "(602) 555-0207", status: "qualified", source: "chatbot", score: 82, stage: "hot", value: cents(6500), notes: "Heat pump installation inquiry", ago: 10 },
      { name: "Michael Brown", email: "m.brown@email.com", phone: "(480) 555-0208", status: "appointment", source: "phone", score: 92, stage: "hot", value: cents(9800), notes: "Appointment scheduled for AC replacement estimate", ago: 4 },
      { name: "Jennifer Davis", email: "j.davis@email.com", phone: "(623) 555-0209", status: "appointment", source: "website", score: 88, stage: "hot", value: cents(5500), notes: "Booked for mini-split consultation", ago: 6 },
      { name: "William Taylor", email: "w.taylor@email.com", phone: "(602) 555-0210", status: "appointment", source: "referral", score: 95, stage: "hot", value: cents(15000), notes: "New construction, full HVAC system", ago: 9 },
      { name: "Amanda Martinez", email: "a.martinez@email.com", phone: "(480) 555-0211", status: "won", source: "website", score: 98, stage: "hot", value: cents(7200), notes: "Signed contract for AC replacement", ago: 15 },
      { name: "Christopher Lee", email: "c.lee@email.com", phone: "(623) 555-0212", status: "won", source: "phone", score: 96, stage: "hot", value: cents(4800), notes: "Completed duct sealing job", ago: 20 },
      { name: "Jessica White", email: "j.white@email.com", phone: "(602) 555-0213", status: "won", source: "chatbot", score: 94, stage: "hot", value: cents(11500), notes: "Full system install completed, very happy", ago: 25 },
      { name: "Daniel Harris", email: "d.harris@email.com", phone: "(480) 555-0214", status: "won", source: "referral", score: 97, stage: "hot", value: cents(3200), notes: "Annual maintenance plan signed", ago: 30 },
      { name: "Stephanie Clark", email: "s.clark@email.com", phone: "(623) 555-0215", status: "won", source: "form", score: 93, stage: "hot", value: cents(6800), notes: "Zone system upgrade complete", ago: 35 },
      { name: "Kevin Lewis", email: "k.lewis@email.com", phone: "(602) 555-0216", status: "lost", source: "website", score: 45, stage: "cold", value: cents(5000), notes: "Went with competitor, price sensitive", ago: 40 },
      { name: "Rachel Walker", email: "r.walker@email.com", phone: "(480) 555-0217", status: "lost", source: "chatbot", score: 38, stage: "cold", value: cents(3000), notes: "Decided to repair instead of replace", ago: 42 },
      { name: "Andrew Hall", email: "a.hall@email.com", phone: "(623) 555-0218", status: "lost", source: "phone", score: 42, stage: "cold", value: cents(7500), notes: "No response after follow-up", ago: 50 },
      { name: "Nicole Young", email: "n.young@email.com", phone: "(602) 555-0219", status: "new", source: "voice", score: 60, stage: "warm", value: cents(2000), notes: "Called about thermostat issues", ago: 1 },
      { name: "Brian King", email: "b.king@email.com", phone: "(480) 555-0220", status: "qualified", source: "website", score: 80, stage: "hot", value: cents(9000), notes: "Wants energy-efficient system upgrade", ago: 4 },
    ];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const leadId = `demo_lead_${String(i + 1).padStart(3, "0")}`;
      await tx.lead.upsert({
        where: { id: leadId },
        update: {
          name: lead.name,
          status: lead.status,
          score: lead.score,
          notes: lead.notes,
        },
        create: {
          id: leadId,
          clientId: client.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          notes: lead.notes,
          score: lead.score,
          stage: lead.stage,
          value: lead.value,
          lastContactedAt: daysAgo(Math.max(0, lead.ago - 1)),
          createdAt: daysAgo(lead.ago),
        },
      });
    }

    console.log("  3. 20 leads created (new/qualified/appointment/won/lost)");

    // ── 4. 5 Demo Invoices ───────────────────────────────────────
    const invoices: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      description: string;
      amount: number;
      status: string;
      paidAt: Date | null;
      sentAt: Date | null;
      ago: number;
    }> = [
      { id: "demo_invoice_001", customerName: "Amanda Martinez", customerEmail: "a.martinez@email.com", customerPhone: "(480) 555-0211", description: "AC Replacement - Carrier 3-ton unit", amount: cents(7200), status: "paid", paidAt: daysAgo(5), sentAt: daysAgo(12), ago: 15 },
      { id: "demo_invoice_002", customerName: "Christopher Lee", customerEmail: "c.lee@email.com", customerPhone: "(623) 555-0212", description: "Duct sealing and insulation", amount: cents(4800), status: "paid", paidAt: daysAgo(2), sentAt: daysAgo(8), ago: 20 },
      { id: "demo_invoice_003", customerName: "Jessica White", customerEmail: "j.white@email.com", customerPhone: "(602) 555-0213", description: "Full HVAC system installation", amount: cents(11500), status: "sent", paidAt: null, sentAt: daysAgo(3), ago: 25 },
      { id: "demo_invoice_004", customerName: "Daniel Harris", customerEmail: "d.harris@email.com", customerPhone: "(480) 555-0214", description: "Annual maintenance plan - Year 1", amount: cents(3200), status: "overdue", paidAt: null, sentAt: daysAgo(35), ago: 40 },
      { id: "demo_invoice_005", customerName: "William Taylor", customerEmail: "w.taylor@email.com", customerPhone: "(602) 555-0210", description: "New construction HVAC rough-in", amount: cents(15000), status: "draft", paidAt: null, sentAt: null, ago: 5 },
    ];

    for (const inv of invoices) {
      await tx.invoice.upsert({
        where: { id: inv.id },
        update: { status: inv.status, amount: inv.amount },
        create: {
          id: inv.id,
          clientId: client.id,
          customerName: inv.customerName,
          customerEmail: inv.customerEmail,
          customerPhone: inv.customerPhone,
          description: inv.description,
          amount: inv.amount,
          status: inv.status,
          paidAt: inv.paidAt,
          sentAt: inv.sentAt,
          createdAt: daysAgo(inv.ago),
        },
      });
    }

    console.log("  4. 5 invoices created (2 paid, 1 pending/sent, 1 overdue, 1 draft)");

    // ── 5. 3 Demo Quotes ─────────────────────────────────────────
    const quotes: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      title: string;
      description: string;
      lineItems: string;
      subtotal: number;
      tax: number;
      total: number;
      status: string;
      sentAt: Date | null;
      acceptedAt: Date | null;
      expiresAt: Date;
    }> = [
      {
        id: "demo_quote_001",
        customerName: "David Thompson",
        customerEmail: "d.thompson@email.com",
        customerPhone: "(602) 555-0204",
        title: "Full AC System Replacement",
        description: "Remove existing 2-ton unit, install new Carrier 3-ton 16 SEER2 system with new thermostat",
        lineItems: JSON.stringify([
          { description: "Carrier 3-ton AC unit", qty: 1, unitPrice: 450000 },
          { description: "Smart thermostat", qty: 1, unitPrice: 25000 },
          { description: "Installation labor", qty: 1, unitPrice: 280000 },
          { description: "Permit & inspection", qty: 1, unitPrice: 35000 },
        ]),
        subtotal: cents(7900),
        tax: cents(553),
        total: cents(8453),
        status: "accepted",
        sentAt: daysAgo(10),
        acceptedAt: daysAgo(7),
        expiresAt: futureDate(20),
      },
      {
        id: "demo_quote_002",
        customerName: "Maria Garcia",
        customerEmail: "m.garcia@email.com",
        customerPhone: "(480) 555-0205",
        title: "New AC Unit Installation",
        description: "Supply and install Lennox 4-ton 18 SEER2 heat pump system",
        lineItems: JSON.stringify([
          { description: "Lennox 4-ton heat pump", qty: 1, unitPrice: 620000 },
          { description: "Air handler", qty: 1, unitPrice: 180000 },
          { description: "Installation labor", qty: 1, unitPrice: 350000 },
          { description: "Ductwork modifications", qty: 1, unitPrice: 75000 },
        ]),
        subtotal: cents(12250),
        tax: cents(857),
        total: cents(13107),
        status: "sent",
        sentAt: daysAgo(2),
        acceptedAt: null,
        expiresAt: futureDate(28),
      },
      {
        id: "demo_quote_003",
        customerName: "Brian King",
        customerEmail: "b.king@email.com",
        customerPhone: "(480) 555-0220",
        title: "Energy-Efficient System Upgrade",
        description: "Upgrade to high-efficiency system with zone control",
        lineItems: JSON.stringify([
          { description: "Trane XV20i variable speed", qty: 1, unitPrice: 520000 },
          { description: "Zone control system (3 zones)", qty: 1, unitPrice: 180000 },
          { description: "Installation labor", qty: 1, unitPrice: 300000 },
        ]),
        subtotal: cents(10000),
        tax: cents(700),
        total: cents(10700),
        status: "draft",
        sentAt: null,
        acceptedAt: null,
        expiresAt: futureDate(30),
      },
    ];

    for (const q of quotes) {
      await tx.quote.upsert({
        where: { id: q.id },
        update: { status: q.status },
        create: {
          id: q.id,
          clientId: client.id,
          customerName: q.customerName,
          customerEmail: q.customerEmail,
          customerPhone: q.customerPhone,
          title: q.title,
          description: q.description,
          lineItems: q.lineItems,
          subtotal: q.subtotal,
          tax: q.tax,
          total: q.total,
          status: q.status,
          sentAt: q.sentAt,
          acceptedAt: q.acceptedAt,
          expiresAt: q.expiresAt,
        },
      });
    }

    console.log("  5. 3 quotes created (1 accepted, 1 sent, 1 draft)");

    // ── 6. Demo Activity Events ──────────────────────────────────
    const activities = [
      { id: "demo_activity_001", type: "lead_captured", title: "New lead captured", description: "Sarah Mitchell submitted a contact form on the website", ago: 1 },
      { id: "demo_activity_002", type: "lead_captured", title: "Chatbot lead captured", description: "James Rodriguez engaged with the AI chatbot and provided contact info", ago: 2 },
      { id: "demo_activity_003", type: "call_booked", title: "Appointment booked", description: "Michael Brown booked an AC replacement estimate appointment", ago: 3 },
      { id: "demo_activity_004", type: "review_received", title: "5-star review received", description: "Amanda Martinez left a 5-star Google review: 'Amazing service! Fast and professional.'", ago: 4 },
      { id: "demo_activity_005", type: "email_sent", title: "Invoice sent", description: "Invoice #003 sent to Jessica White for $11,500.00", ago: 3 },
      { id: "demo_activity_006", type: "review_response", title: "Review response published", description: "AI-generated response published for Google review from Chris Lee", ago: 5 },
      { id: "demo_activity_007", type: "content_published", title: "Blog post published", description: "'5 Signs Your AC Needs Replacement' published to website", ago: 6 },
      { id: "demo_activity_008", type: "lead_captured", title: "Phone lead captured", description: "Nicole Young called about thermostat issues, captured by AI receptionist", ago: 7 },
      { id: "demo_activity_009", type: "ad_optimized", title: "Ad campaign optimized", description: "Google Ads budget reallocated: +15% to AC repair keywords", ago: 8 },
      { id: "demo_activity_010", type: "seo_update", title: "SEO rankings improved", description: "'HVAC repair Phoenix' moved from #8 to #5 on Google", ago: 10 },
      { id: "demo_activity_011", type: "seasonal_campaign_sent", title: "Summer prep campaign sent", description: "Email campaign sent to 245 past customers about AC tune-ups", ago: 12 },
      { id: "demo_activity_012", type: "review_received", title: "4-star review received", description: "Daniel Harris left a 4-star review: 'Good value maintenance plan.'", ago: 14 },
    ];

    for (const act of activities) {
      await tx.activityEvent.upsert({
        where: { id: act.id },
        update: { title: act.title },
        create: {
          id: act.id,
          clientId: client.id,
          type: act.type,
          title: act.title,
          description: act.description,
          createdAt: daysAgo(act.ago),
        },
      });
    }

    console.log("  6. 12 activity events created");

    // ── 7. Revenue Events (6 months) ─────────────────────────────
    const channels = ["website", "google_ads", "referral", "chatbot", "phone"];
    const eventTypes = ["lead", "booking", "invoice_paid", "subscription"];

    let revCount = 0;
    for (let month = 0; month < 6; month++) {
      const eventsPerMonth = 8 + month * 2; // Growing trend
      for (let j = 0; j < eventsPerMonth; j++) {
        const revId = `demo_rev_${month}_${String(j).padStart(3, "0")}`;
        const dayOffset = Math.min(j * 3, 27); // Deterministic spread
        const baseDate = monthsAgo(5 - month);
        baseDate.setDate(Math.min(baseDate.getDate() + dayOffset, 28));

        const eventType = eventTypes[j % eventTypes.length];
        let amount: number;
        switch (eventType) {
          case "lead":
            amount = 0;
            break;
          case "booking":
            amount = cents(150 + (j * 50));
            break;
          case "invoice_paid":
            amount = cents(2000 + (j * 500));
            break;
          case "subscription":
            amount = cents(497);
            break;
          default:
            amount = cents(500);
        }

        await tx.revenueEvent.upsert({
          where: { id: revId },
          update: { amount },
          create: {
            id: revId,
            clientId: client.id,
            channel: channels[j % channels.length],
            eventType,
            amount,
            createdAt: baseDate,
          },
        });
        revCount++;
      }
    }

    console.log(`  7. ${revCount} revenue events created (6 months)`);

    // ── 8. 3 Franchise Locations ─────────────────────────────────
    const franchiseLocations = [
      { id: "demo_franchise_001", name: "Phoenix Central", address: "1234 N Central Ave", city: "Phoenix", state: "AZ", zip: "85004", phone: "(602) 555-0100", manager: "Marcus Johnson", leadsThisMonth: 28, revenueThisMonth: cents(42500), bookingsThisMonth: 12, avgRating: 4.8 },
      { id: "demo_franchise_002", name: "Scottsdale", address: "5678 E Camelback Rd", city: "Scottsdale", state: "AZ", zip: "85251", phone: "(480) 555-0150", manager: "Laura Chen", leadsThisMonth: 22, revenueThisMonth: cents(38200), bookingsThisMonth: 9, avgRating: 4.9 },
      { id: "demo_franchise_003", name: "Mesa / Gilbert", address: "910 S Gilbert Rd", city: "Gilbert", state: "AZ", zip: "85296", phone: "(480) 555-0175", manager: "Tony Ramirez", leadsThisMonth: 18, revenueThisMonth: cents(29800), bookingsThisMonth: 7, avgRating: 4.7 },
    ];

    for (const loc of franchiseLocations) {
      await tx.franchiseLocation.upsert({
        where: { id: loc.id },
        update: {
          leadsThisMonth: loc.leadsThisMonth,
          revenueThisMonth: loc.revenueThisMonth,
          bookingsThisMonth: loc.bookingsThisMonth,
          avgRating: loc.avgRating,
        },
        create: {
          id: loc.id,
          clientId: client.id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          zip: loc.zip,
          phone: loc.phone,
          manager: loc.manager,
          isActive: true,
          leadsThisMonth: loc.leadsThisMonth,
          revenueThisMonth: loc.revenueThisMonth,
          bookingsThisMonth: loc.bookingsThisMonth,
          avgRating: loc.avgRating,
        },
      });
    }

    console.log("  8. 3 franchise locations created (Phoenix area)");

    // ── 9. 5 Support Tickets ─────────────────────────────────────
    const tickets = [
      { id: "demo_ticket_001", subject: "Chatbot not responding after 10pm", description: "The AI chatbot on our website stops responding to visitors after 10pm. We get a lot of late-night inquiries.", status: "open", priority: "high", ago: 1 },
      { id: "demo_ticket_002", subject: "Update business hours for holiday", description: "We need to update our business hours for the upcoming holiday weekend. Please adjust the AI receptionist greeting.", status: "in_progress", priority: "medium", ago: 3 },
      { id: "demo_ticket_003", subject: "Add new service area in Chandler", description: "We are expanding to Chandler, AZ. Please update our service area and Google Business Profile.", status: "open", priority: "medium", ago: 5 },
      { id: "demo_ticket_004", subject: "Invoice payment link not working", description: "Customer reported that the Stripe payment link on Invoice #004 is returning an error.", status: "resolved", priority: "high", ago: 10 },
      { id: "demo_ticket_005", subject: "Request monthly performance report", description: "Can you send me a summary of last month's lead generation and ROI metrics?", status: "closed", priority: "low", ago: 20 },
    ];

    for (const t of tickets) {
      await tx.supportTicket.upsert({
        where: { id: t.id },
        update: { status: t.status },
        create: {
          id: t.id,
          clientId: client.id,
          subject: t.subject,
          description: t.description,
          status: t.status,
          priority: t.priority,
          createdAt: daysAgo(t.ago),
        },
      });
    }

    // Add reply messages to the resolved ticket
    await tx.ticketMessage.upsert({
      where: { id: "demo_ticket_msg_001" },
      update: {},
      create: {
        id: "demo_ticket_msg_001",
        ticketId: "demo_ticket_004",
        senderRole: "admin",
        message: "The payment link has been regenerated. The customer should now be able to pay. We apologize for the inconvenience.",
        createdAt: daysAgo(9),
      },
    });

    await tx.ticketMessage.upsert({
      where: { id: "demo_ticket_msg_002" },
      update: {},
      create: {
        id: "demo_ticket_msg_002",
        ticketId: "demo_ticket_004",
        senderRole: "client",
        message: "Confirmed, the customer was able to pay. Thanks for the quick fix!",
        createdAt: daysAgo(8),
      },
    });

    console.log("  9. 5 support tickets created (open/in_progress/resolved/closed)");
  }, { timeout: 60000 });

  console.log("\n  Seed completed successfully!");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e: unknown) => {
  console.error("  Seed failed:", e);
  process.exit(1);
});
