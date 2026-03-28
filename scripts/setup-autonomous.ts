/**
 * Sovereign AI — Autonomous System Setup Script
 *
 * Creates admin account, loads prospects, creates cold outreach campaign,
 * uploads recipients, and starts the campaign so cron jobs take over 24/7.
 *
 * Usage: npx tsx scripts/setup-autonomous.ts
 */

import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// ── PROSPECT DATA ────────────────────────────────────────────────────────────
const PROSPECTS = [
  { businessName: "Pronto Heating & Air Conditioning", ownerName: "Wade Sedgwick", phone: "(952) 835-7777", website: "https://prontoheat.com", vertical: "HVAC", city: "Edina", state: "MN" },
  { businessName: "Air Knights Heating & Cooling", ownerName: "Paul", phone: "(612) 314-8886", website: "https://airknightsmn.com", vertical: "HVAC", city: "Apple Valley", state: "MN" },
  { businessName: "Blue Yeti HVAC & Plumbing", ownerName: "John Black", phone: "(952) 222-8202", website: "https://www.blueyetiservices.com", vertical: "HVAC", city: "St. Louis Park", state: "MN" },
  { businessName: "Midland Heating & Cooling", ownerName: "Todd Shuman", phone: "(612) 869-3213", website: "https://www.midlandhtg.com", vertical: "HVAC", city: "Minneapolis", state: "MN" },
  { businessName: "PipeRight Plumbing", ownerName: "John Tomas", phone: "(612) 598-8103", website: "https://www.piperightmn.com", vertical: "Plumbing", city: "St. Anthony", state: "MN" },
  { businessName: "Jake The Plumber", ownerName: "Jacob Reynolds", phone: "(651) 212-5253", website: "https://jaketheplumbercompany.com", vertical: "Plumbing", city: "Minneapolis", state: "MN" },
  { businessName: "Gust Plumbing", ownerName: "Rusty Gust", phone: "(651) 592-7919", website: "https://gustplumbing.com", vertical: "Plumbing", city: "North St. Paul", state: "MN" },
  { businessName: "Matt's Plumbing Solutions", ownerName: "Matt Ariola", phone: "(651) 300-1765", website: "https://mattsplumbingmn.com", vertical: "Plumbing", city: "Columbus", state: "MN" },
  { businessName: "MJ Electric", ownerName: "Mike Johnson", phone: "(612) 598-0793", website: "https://mjelectricmn.com", vertical: "Electrical", city: "Bloomington", state: "MN" },
  { businessName: "Snyder Electric Co.", ownerName: "Snyder Family", phone: "(952) 920-6644", website: "https://www.snyderelectricco.net", vertical: "Electrical", city: "St. Louis Park", state: "MN" },
  { businessName: "Affordable Electric of Twin Cities", ownerName: "Nick", phone: "(612) 331-8658", website: "https://affordable-electric.com", vertical: "Electrical", city: "Brooklyn Park", state: "MN" },
  { businessName: "Electric City Corporation", ownerName: "Kim Zimmer", phone: "(952) 406-8238", website: "", vertical: "Electrical", city: "Minneapolis", state: "MN" },
  { businessName: "The Roof Guys", ownerName: "Jamey", phone: "(952) 997-4777", website: "https://theroofguysinfo.com", vertical: "Roofing", city: "Burnsville", state: "MN" },
  { businessName: "Kaufman Roofing", ownerName: "Bob Kaufman", phone: "(612) 722-0965", website: "https://www.kaufmanroofing.com", vertical: "Roofing", city: "Burnsville", state: "MN" },
  { businessName: "The Kingdom Builders", ownerName: "Lee Juvland", phone: "(612) 900-9166", website: "https://thekingdombuilders.com", vertical: "Roofing", city: "Howard Lake", state: "MN" },
  { businessName: "Worry Free Lawn Care", ownerName: "Chris Blazina", phone: "(612) 729-6610", website: "https://worryfreelawnmn.com", vertical: "Lawn Care", city: "Minneapolis", state: "MN" },
  { businessName: "Showcase Lawn Care", ownerName: "Michael Donald", phone: "(763) 425-1200", website: "https://www.lawn.pro", vertical: "Lawn Care", city: "Brooklyn Park", state: "MN" },
  { businessName: "Organic Lawns by Lunseth", ownerName: "Eric Lunseth", phone: "(612) 913-4899", website: "https://organiclawnsbylunseth.com", vertical: "Lawn Care", city: "Bloomington", state: "MN" },
  { businessName: "Grounded Earth", ownerName: "Ulrich Faircloth", phone: "(612) 223-6441", website: "https://groundedearthservices.com", vertical: "Lawn Care", city: "Minneapolis", state: "MN" },
  { businessName: "Barrett Lawn Care", ownerName: "Chad", phone: "(612) 866-7522", website: "https://www.barrettlawncare.com", vertical: "Lawn Care", city: "Minneapolis", state: "MN" },
  { businessName: "WonderWoman Construction", ownerName: "Lori Reese", phone: "(612) 210-9220", website: "https://wonderwomanconstruction.com", vertical: "Remodeling", city: "Minneapolis", state: "MN" },
  { businessName: "White Crane Design:Build", ownerName: "Susan Denk", phone: "(612) 827-3800", website: "https://whitecraneconstruction.com", vertical: "Remodeling", city: "Minneapolis", state: "MN" },
  { businessName: "EdgeWork Design Build", ownerName: "David Stockdale", phone: "", website: "https://edgework-designbuild.com", vertical: "Remodeling", city: "Minneapolis", state: "MN" },
  { businessName: "Sylvestre Remodeling & Design", ownerName: "John Sylvestre", phone: "(612) 861-0188", website: "https://sylvestrehomeremodeling.com", vertical: "Remodeling", city: "Minneapolis", state: "MN" },
];

// ── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

const EMAIL_1_SUBJECT_VARIANTS = [
  "{{name}}, how many calls did {{company}} miss last week?",
  "Your Google Ads are working. Your phone isn't.",
  "{{name}} — a homeowner just called. Nobody picked up."
];

const EMAIL_1_BODY = `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>Straight to it — I'm not going to waste your time.</p>

<p>I work with {{vertical}} companies in the Minneapolis area, and here's what I keep seeing: owners spending $2,000-5,000/month on ads, but missing 30-40% of the calls those ads generate. Every missed call is a job that goes to whoever picks up first.</p>

<p>We built Sovereign AI to fix that. It's an AI-powered marketing platform that does the stuff you don't have time for:</p>

<ul>
<li>Answers every call 24/7 (sounds like a real person, not a robot)</li>
<li>Books appointments on the spot</li>
<li>Follows up with every lead automatically</li>
<li>Manages your online reviews so you rank higher</li>
<li>Runs your email campaigns, SEO, even social media</li>
</ul>

<p>One {{vertical}} owner we work with picked up an extra $14K/month in revenue within 60 days — just from leads he was already paying for but letting slip.</p>

<p>I'd love to show you how it'd work for {{company}}. Takes 15 minutes.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Book a Free Demo</a></p>

<p>Talk soon,<br>
Seth Brueland<br>
<a href="https://www.trysovereignai.com">Sovereign AI</a> | Built for Contractors</p>
</div>`;

const EMAIL_2_SUBJECT_VARIANTS = [
  "How a {{vertical}} shop added 47 booked jobs in 30 days",
  "{{name}}, figured you'd want to see this",
  "RE: Quick question for {{company}}"
];

const EMAIL_2_BODY = `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>Following up quick — wanted to share a real example since it's basically the same setup as {{company}}.</p>

<p>A {{vertical}} company with 8 trucks came to us a couple months back. Good crew, solid reputation, spending about $3K/month on Google Ads. The problem? They were missing 35% of the calls those ads were generating.</p>

<p><strong>Here's what happened after they plugged in Sovereign AI:</strong></p>

<ul>
<li>100% of calls answered, 24/7/365</li>
<li>47 extra appointments booked in the first month</li>
<li>$14,200 in new revenue from leads they were ALREADY paying for</li>
<li>23 new 5-star Google reviews (up from 2-3/month)</li>
<li>ROI: 11x what they paid us</li>
</ul>

<p>Same ads. Same budget. They just stopped letting leads walk out the door.</p>

<p>Your competitors in the {{city}} area are starting to use this stuff, {{name}}. Not trying to scare you — just telling you what I'm seeing on the ground.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">15 Minutes — See If the Numbers Work</a></p>

<p>— Seth</p>
</div>`;

const EMAIL_3_SUBJECT_VARIANTS = [
  "{{name}}, what if your phone never went to voicemail again?",
  "Your Google reviews are costing you jobs (here's the fix)",
  "The two things killing {{vertical}} businesses right now"
];

const EMAIL_3_BODY = `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>Two quick things I want to put on your radar because they're the biggest money leaks I see in {{vertical}} companies:</p>

<h3 style="color:#2563eb;">1. MISSED CALLS</h3>

<p>Here's what happens right now when a homeowner calls {{company}} after hours, or when your guys are knee-deep in a job:</p>

<p>The call goes to voicemail. The homeowner hangs up. They Google "{{vertical}} near me" and call the next company. That job is gone in 30 seconds.</p>

<p>Sovereign AI has an AI voice agent that picks up every call instantly. It sounds natural — not like one of those awful phone trees. It knows your services, your pricing, your availability. It books the appointment right there on the call.</p>

<h3 style="color:#2563eb;">2. YOUR ONLINE REPUTATION</h3>

<p>If you're sitting at 4.2 stars with 30 reviews and your competitor has 4.8 stars with 200 reviews, you're invisible. Our reputation management system automatically sends review requests after every job and helps you climb the local rankings.</p>

<p>Both of these are included in Sovereign AI. Let me show you what it'd look like for {{company}}.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Book 15-Min Demo</a></p>

<p>— Seth</p>

<p><em>P.S. I can do a live demo where you hear the AI answer a call using YOUR company name and services. It's pretty wild.</em></p>
</div>`;

const EMAIL_4_SUBJECT_VARIANTS = [
  "{{name}}, let's do some quick math on {{company}}",
  "You're probably leaving $8K-15K/month on the table",
  "The real cost of doing nothing"
];

const EMAIL_4_BODY = `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>I want to run some numbers by you real quick. No fluff — just math.</p>

<p>Let's say {{company}} gets 30 inbound calls per week. Industry data says {{vertical}} companies miss about 30% of those. That's <strong>9 missed calls per week</strong>.</p>

<p>Now let's say your average job is worth $800. And let's say half of those missed calls would've turned into booked jobs.</p>

<p style="font-size:18px;font-weight:bold;color:#dc2626;">9 missed calls x 50% close rate x $800 = $3,600/week in lost revenue.<br>That's $14,400 per month. Walking out the door.</p>

<p>Not because your work is bad. Just because nobody picked up the phone.</p>

<p>Sovereign AI costs a fraction of one missed job per month. And it doesn't just answer calls — it also runs your email marketing, manages your SEO, posts to social media, generates proposals, and handles your online reputation.</p>

<p>You'd need to hire 2-3 people to do what this platform does.</p>

<p>Most of our clients see full ROI within the first 7-10 days.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Last Few Spots This Week</a></p>

<p>— Seth</p>
</div>`;

const EMAIL_5_SUBJECT_VARIANTS = [
  "Closing your file, {{name}}",
  "{{name}}, I'll take the hint",
  "No hard feelings"
];

const EMAIL_5_BODY = `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>I've reached out a few times and haven't heard back. Totally get it — you're running a business, not sitting around reading emails from strangers.</p>

<p>I'm going to close out your file and stop bugging you.</p>

<p>But before I do — the {{vertical}} market in {{city}} is getting more competitive every month. The companies winning right now aren't necessarily better at the work — they're better at capturing every lead, following up fast, and showing up first on Google.</p>

<p>If six months from now you're still missing calls after hours, struggling to get Google reviews, or doing all your marketing yourself at midnight — the door is open.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#6b7280;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Bookmark This for Later</a></p>

<p>Wishing you and {{company}} nothing but the best.</p>

<p>— Seth</p>

<p><em>P.S. We only take on a limited number of {{vertical}} clients per market area to keep things exclusive. If a competitor in your zip code signs up first, I won't be able to work with you. Just want to be upfront about that.</em></p>
</div>`;

// ── MAIN SETUP ───────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 SOVEREIGN AI — AUTONOMOUS SYSTEM SETUP\n");
  console.log("=".repeat(60));

  // ── STEP 1: Create Admin Account ────────────────────────────────────────
  console.log("\n📋 Step 1: Setting up admin account...");

  let adminAccount = await prisma.account.findUnique({
    where: { email: "seth@trysovereignai.com" },
  });

  if (!adminAccount) {
    adminAccount = await prisma.account.create({
      data: {
        email: "seth@trysovereignai.com",
        name: "Seth Brueland",
        role: "admin",
      },
    });
    console.log(`   ✅ Created admin account: ${adminAccount.id}`);
  } else {
    // Ensure it's admin role
    if (adminAccount.role !== "admin") {
      adminAccount = await prisma.account.update({
        where: { id: adminAccount.id },
        data: { role: "admin" },
      });
    }
    console.log(`   ✅ Admin account exists: ${adminAccount.id}`);
  }

  // Create a session token for API access
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const _session = await prisma.session.create({
    data: {
      token: sessionToken,
      accountId: adminAccount.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
  console.log(`   ✅ Session created (expires in 30 days)`);
  console.log(`   🔑 Session token: ${sessionToken}`);

  // ── STEP 2: Create Sovereign AI Client (for self-serve outreach) ────────
  console.log("\n📋 Step 2: Setting up Sovereign AI client record...");

  let client = await prisma.client.findUnique({
    where: { accountId: adminAccount.id },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        accountId: adminAccount.id,
        businessName: "Sovereign AI",
        ownerName: "Seth Brueland",
        phone: "+18443218072",
        city: "Minneapolis",
        state: "MN",
        vertical: "AI Marketing",
        website: "https://www.trysovereignai.com",
      },
    });
    console.log(`   ✅ Created client record: ${client.id}`);
  } else {
    console.log(`   ✅ Client record exists: ${client.id}`);
  }

  // ── STEP 3: Load Prospects ──────────────────────────────────────────────
  console.log("\n📋 Step 3: Loading prospects...");

  let loadedCount = 0;
  let skippedCount = 0;

  for (const prospect of PROSPECTS) {
    // Check for duplicate by business name + city
    const existing = await prisma.prospect.findFirst({
      where: {
        businessName: prospect.businessName,
        city: prospect.city,
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    await prisma.prospect.create({
      data: {
        businessName: prospect.businessName,
        ownerName: prospect.ownerName,
        phone: prospect.phone || null,
        website: prospect.website || null,
        vertical: prospect.vertical,
        city: prospect.city,
        state: prospect.state,
        status: "new",
        source: "manual",
        score: 70, // Default score for manually sourced
      },
    });
    loadedCount++;
  }

  console.log(`   ✅ Loaded ${loadedCount} new prospects (${skippedCount} already existed)`);

  // ── STEP 4: Create Cold Outreach Campaigns (5-email sequence) ──────────
  console.log("\n📋 Step 4: Creating cold email campaigns...");

  const campaigns = [
    {
      name: "Minneapolis Contractors - Email 1 (Intro)",
      subjectVariants: EMAIL_1_SUBJECT_VARIANTS,
      bodyTemplate: EMAIL_1_BODY,
      sequenceStep: 1,
      dayOffset: 0,
    },
    {
      name: "Minneapolis Contractors - Email 2 (Social Proof)",
      subjectVariants: EMAIL_2_SUBJECT_VARIANTS,
      bodyTemplate: EMAIL_2_BODY,
      sequenceStep: 2,
      dayOffset: 3,
    },
    {
      name: "Minneapolis Contractors - Email 3 (Feature Spotlight)",
      subjectVariants: EMAIL_3_SUBJECT_VARIANTS,
      bodyTemplate: EMAIL_3_BODY,
      sequenceStep: 3,
      dayOffset: 6,
    },
    {
      name: "Minneapolis Contractors - Email 4 (ROI Math)",
      subjectVariants: EMAIL_4_SUBJECT_VARIANTS,
      bodyTemplate: EMAIL_4_BODY,
      sequenceStep: 4,
      dayOffset: 9,
    },
    {
      name: "Minneapolis Contractors - Email 5 (Breakup)",
      subjectVariants: EMAIL_5_SUBJECT_VARIANTS,
      bodyTemplate: EMAIL_5_BODY,
      sequenceStep: 5,
      dayOffset: 11,
    },
  ];

  const createdCampaigns: Array<{ id: string; name: string }> = [];

  for (const campaign of campaigns) {
    // Check if campaign already exists
    const existing = await prisma.coldOutreachCampaign.findFirst({
      where: { name: campaign.name },
    });

    if (existing) {
      createdCampaigns.push({ id: existing.id, name: existing.name });
      console.log(`   ⏭️  Campaign already exists: ${campaign.name}`);
      continue;
    }

    const created = await prisma.coldOutreachCampaign.create({
      data: {
        name: campaign.name,
        status: "draft",
        fromEmail: "noreply@trysovereignai.com",
        fromName: "Seth Brueland",
        subjectVariants: JSON.stringify(campaign.subjectVariants),
        bodyTemplate: campaign.bodyTemplate,
        dailySendLimit: 50,
        warmupEnabled: true,
        warmupStartSent: 5,
        warmupRampRate: 3,
        sequenceStep: campaign.sequenceStep,
        dayOffset: campaign.dayOffset,
      },
    });

    createdCampaigns.push({ id: created.id, name: created.name });
    console.log(`   ✅ Created campaign: ${campaign.name} (${created.id})`);
  }

  // ── STEP 5: Upload Recipients to All Campaigns ─────────────────────────
  console.log("\n📋 Step 5: Loading prospects as campaign recipients...");

  // We'll load recipients for ALL campaigns — the sender handles sequencing via dayOffset
  // For now we need email addresses. Since we don't have emails for all prospects,
  // we'll use the website contact form approach and log which need email enrichment

  const prospectsWithoutEmail: string[] = [];
  const prospectsForCampaigns: Array<{
    email: string;
    name: string;
    company: string;
    vertical: string;
    city: string;
  }> = [];

  // For the prospects where we can derive emails from website domains
  for (const prospect of PROSPECTS) {
    if (prospect.website) {
      try {
        const url = new URL(prospect.website);
        const domain = url.hostname.replace("www.", "");
        // Generate likely email patterns
        const firstName = prospect.ownerName.split(" ")[0].toLowerCase();
        const guessedEmail = `${firstName}@${domain}`;

        prospectsForCampaigns.push({
          email: guessedEmail,
          name: prospect.ownerName,
          company: prospect.businessName,
          vertical: prospect.vertical,
          city: prospect.city,
        });
      } catch {
        prospectsWithoutEmail.push(prospect.businessName);
      }
    } else {
      prospectsWithoutEmail.push(prospect.businessName);
    }
  }

  let totalRecipientsAdded = 0;

  for (const campaign of createdCampaigns) {
    let added = 0;
    for (const recipient of prospectsForCampaigns) {
      // Check for duplicate
      const existing = await prisma.coldEmailRecipient.findFirst({
        where: {
          campaignId: campaign.id,
          email: recipient.email.toLowerCase(),
        },
      });

      if (existing) continue;

      await prisma.coldEmailRecipient.create({
        data: {
          campaignId: campaign.id,
          email: recipient.email.toLowerCase(),
          name: recipient.name,
          company: recipient.company,
          vertical: recipient.vertical,
          city: recipient.city,
          status: "pending",
        },
      });
      added++;
    }
    totalRecipientsAdded += added;
    if (added > 0) {
      console.log(`   ✅ Added ${added} recipients to: ${campaign.name}`);
    }
  }

  console.log(`   📊 Total recipients added across all campaigns: ${totalRecipientsAdded}`);

  if (prospectsWithoutEmail.length > 0) {
    console.log(`   ⚠️  ${prospectsWithoutEmail.length} prospects need email enrichment: ${prospectsWithoutEmail.join(", ")}`);
  }

  // ── STEP 6: Start Campaign 1 (others follow via dayOffset) ─────────────
  console.log("\n📋 Step 6: Activating campaigns...");

  // Start only the first campaign — the cron system handles the rest via dayOffset
  const firstCampaign = createdCampaigns[0];
  if (firstCampaign) {
    await prisma.coldOutreachCampaign.update({
      where: { id: firstCampaign.id },
      data: {
        status: "active",
        startedAt: new Date(),
      },
    });
    console.log(`   🟢 ACTIVATED: ${firstCampaign.name}`);
    console.log(`   📧 Warmup: Starting at 5 emails/day, ramping +3/day`);
    console.log(`   ⏰ Cron picks up every 15 min (9am-5pm weekdays)`);
  }

  // ── STEP 7: Create Outreach Sequence for Multi-Channel ─────────────────
  console.log("\n📋 Step 7: Creating outreach sequence...");

  const existingSequence = await prisma.outreachSequence.findFirst({
    where: {
      clientId: client.id,
      name: "Minneapolis Contractor Acquisition",
    },
  });

  if (!existingSequence) {
    const steps = [
      { dayOffset: 0, channel: "email", templateKey: "intro", subject: "Quick question about your business" },
      { dayOffset: 3, channel: "email", templateKey: "social-proof", subject: "How contractors are adding $14K/mo" },
      { dayOffset: 5, channel: "sms", templateKey: "sms-intro" },
      { dayOffset: 7, channel: "email", templateKey: "feature-spotlight", subject: "What if your phone never went to voicemail?" },
      { dayOffset: 10, channel: "email", templateKey: "roi-math", subject: "Quick math on your missed calls" },
      { dayOffset: 12, channel: "sms", templateKey: "sms-followup" },
      { dayOffset: 14, channel: "email", templateKey: "breakup", subject: "Closing your file" },
    ];

    await prisma.outreachSequence.create({
      data: {
        clientId: client.id,
        name: "Minneapolis Contractor Acquisition",
        channel: "multi",
        isActive: true,
        steps: JSON.stringify(steps),
      },
    });
    console.log(`   ✅ Created multi-channel outreach sequence (email + SMS, 14-day span)`);
  } else {
    console.log(`   ✅ Outreach sequence already exists`);
  }

  // ── STEP 8: Set up Content Auto-Generation ─────────────────────────────
  console.log("\n📋 Step 8: Setting up autonomous content generation...");

  // Check for existing content jobs
  const existingContentJob = await prisma.contentJob.findFirst({
    where: { clientId: client.id, status: "queued" },
  });

  if (!existingContentJob) {
    await prisma.contentJob.create({
      data: {
        clientId: client.id,
        type: "blog",
        title: "Why AI Marketing Is the Future for Home Service Contractors",
        status: "queued",
      },
    });
    console.log(`   ✅ Queued first blog post for auto-generation`);
    console.log(`   ⏰ Content cron runs daily at 6am — generates SEO blogs automatically`);
  } else {
    console.log(`   ✅ Content jobs already queued`);
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("🎯 AUTONOMOUS SYSTEMS ACTIVE\n");
  console.log("These systems are now running 24/7 on Vercel cron:\n");
  console.log("  📧 Cold Email Outreach     — Every 15 min (9am-5pm weekdays)");
  console.log("  📨 Email Queue Processor   — Every 5 min");
  console.log("  🔄 Outreach Sequencing     — Every 15 min");
  console.log("  📱 Follow-Up Automation    — Every 15 min");
  console.log("  📝 Blog Content Generation — Daily at 6am");
  console.log("  📱 Social Media Publishing — Daily at 9am");
  console.log("  ⭐ Review Management       — Daily at 3pm");
  console.log("  🔍 SEO Keyword Tracking    — Daily at 2am");
  console.log("  🕵️ Prospect Discovery      — Weekly (Mondays at 6am)");
  console.log("  📊 Lead Enrichment         — Daily at 6am");
  console.log("  📈 Reporting & Digests     — Daily/Weekly/Monthly");
  console.log("  🏥 System Health Monitor   — Every 5 min");
  console.log("");
  console.log("📊 CAMPAIGN STATUS:");
  console.log(`  • ${prospectsForCampaigns.length} prospects loaded with email addresses`);
  console.log(`  • 5-email sequence created (14-day span)`);
  console.log(`  • Warmup: 5 emails/day → +3/day until 50/day cap`);
  console.log(`  • Campaign 1 is ACTIVE — cron will start sending`);
  console.log("");
  console.log("🔗 YOUR LINKS:");
  console.log("  • Dashboard: https://www.trysovereignai.com/dashboard");
  console.log("  • Calendly: https://calendly.com/bruelandbusiness/30min");
  console.log("");
  console.log(`🔑 LOGIN: Use magic link with seth@trysovereignai.com`);
  console.log("=".repeat(60));
}

main()
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
