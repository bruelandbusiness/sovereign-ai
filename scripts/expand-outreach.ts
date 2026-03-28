/**
 * Sovereign AI — Expand Cold Outreach Script
 *
 * Adds 50 new prospects across 5 additional markets (Chicago, Denver, Dallas,
 * Phoenix, Atlanta) and creates one 5-email campaign sequence per city.
 *
 * Usage: npx tsx scripts/expand-outreach.ts
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

// ── PROSPECT DATA ─────────────────────────────────────────────────────────────

interface ProspectData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  vertical: string;
  city: string;
  state: string;
}

// ── CHICAGO, IL ──────────────────────────────────────────────────────────────
const CHICAGO_PROSPECTS: ProspectData[] = [
  {
    businessName: "Heatmasters Heating & Cooling",
    ownerName: "Owner",
    email: "info@heatmasters.com",
    phone: "(773) 413-1345",
    website: "https://www.heatmasters.com",
    vertical: "HVAC",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "Amber Mechanical",
    ownerName: "Owner",
    email: "info@ambermechanical.com",
    phone: "(773) 529-8000",
    website: "https://www.ambermechanical.com",
    vertical: "HVAC",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "Goode Plumbing",
    ownerName: "Mike Goode",
    email: "info@goodeplumbing.com",
    phone: "(773) 784-2448",
    website: "https://www.goodeplumbing.com",
    vertical: "Plumbing",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "Chicago Plumbing Experts",
    ownerName: "Manager",
    email: "info@chicagoplumbingexperts.com",
    phone: "(773) 234-0690",
    website: "https://www.chicagoplumbingexperts.com",
    vertical: "Plumbing",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "Christenson Electric",
    ownerName: "Owner",
    email: "info@christensonelectric.com",
    phone: "(773) 736-8100",
    website: "https://www.christensonelectric.com",
    vertical: "Electrical",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "Elcon Electric",
    ownerName: "Owner",
    email: "info@elconelectric.com",
    phone: "(773) 489-0990",
    website: "https://www.elconelectric.com",
    vertical: "Electrical",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "Advantage Roofing",
    ownerName: "Manager",
    email: "info@advantageroofingchicago.com",
    phone: "(773) 631-7663",
    website: "https://www.advantageroofingchicago.com",
    vertical: "Roofing",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "All American Roofing",
    ownerName: "Owner",
    email: "info@allamericanroofinginc.com",
    phone: "(773) 545-9400",
    website: "https://www.allamericanroofinginc.com",
    vertical: "Roofing",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "U.S. LawnWorks",
    ownerName: "Owner",
    email: "info@uslawnworks.com",
    phone: "(847) 724-5296",
    website: "https://www.uslawnworks.com",
    vertical: "Landscaping",
    city: "Chicago",
    state: "IL",
  },
  {
    businessName: "Organo Lawn",
    ownerName: "Manager",
    email: "info@organolawn.com",
    phone: "(773) 985-2101",
    website: "https://www.organolawn.com",
    vertical: "Landscaping",
    city: "Chicago",
    state: "IL",
  },
];

// ── DENVER, CO ───────────────────────────────────────────────────────────────
const DENVER_PROSPECTS: ProspectData[] = [
  {
    businessName: "Brothers Plumbing, Heating and Electric",
    ownerName: "Owner",
    email: "info@brothersplumbing.com",
    phone: "(303) 451-5057",
    website: "https://www.brothersplumbing.com",
    vertical: "HVAC",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Applewood Plumbing Heating & Electric",
    ownerName: "Owner",
    email: "info@applewoodfixit.com",
    phone: "(303) 328-3060",
    website: "https://www.applewoodfixit.com",
    vertical: "HVAC",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Bell Plumbing and Heating",
    ownerName: "Owner",
    email: "info@bellplumbing.com",
    phone: "(303) 757-5000",
    website: "https://www.bellplumbing.com",
    vertical: "Plumbing",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Plumbline Services",
    ownerName: "Manager",
    email: "info@plumblineservices.com",
    phone: "(303) 436-2525",
    website: "https://www.plumblineservices.com",
    vertical: "Plumbing",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Piper Electric",
    ownerName: "Owner",
    email: "info@piperelectric.com",
    phone: "(303) 422-0413",
    website: "https://www.piperelectric.com",
    vertical: "Electrical",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Current Solutions Electric",
    ownerName: "Owner",
    email: "info@currentsolutionselectric.com",
    phone: "(720) 327-9258",
    website: "https://www.currentsolutionselectric.com",
    vertical: "Electrical",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Pinnacol Roofing",
    ownerName: "Owner",
    email: "info@pinnacolroofing.com",
    phone: "(720) 295-0900",
    website: "https://www.pinnacolroofing.com",
    vertical: "Roofing",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "American Roofing & Metal",
    ownerName: "Manager",
    email: "info@americanroofingmetal.com",
    phone: "(303) 937-2787",
    website: "https://www.americanroofingmetal.com",
    vertical: "Roofing",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Lifescape Colorado",
    ownerName: "Owner",
    email: "info@lifescapecolorado.com",
    phone: "(303) 831-8279",
    website: "https://www.lifescapecolorado.com",
    vertical: "Landscaping",
    city: "Denver",
    state: "CO",
  },
  {
    businessName: "Timberline Landscaping",
    ownerName: "Manager",
    email: "info@timberlinelandscaping.com",
    phone: "(303) 791-6767",
    website: "https://www.timberlinelandscaping.com",
    vertical: "Landscaping",
    city: "Denver",
    state: "CO",
  },
];

// ── DALLAS, TX ───────────────────────────────────────────────────────────────
const DALLAS_PROSPECTS: ProspectData[] = [
  {
    businessName: "Milestone Electric, AC & Plumbing",
    ownerName: "Owner",
    email: "info@milestonehome.com",
    phone: "(214) 838-0740",
    website: "https://www.milestonehome.com",
    vertical: "HVAC",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "Air Conditioning by Jay",
    ownerName: "Jay",
    email: "info@acbyjay.com",
    phone: "(214) 350-4793",
    website: "https://www.acbyjay.com",
    vertical: "HVAC",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "Rescue Air and Plumbing",
    ownerName: "Owner",
    email: "info@rescueairandplumbing.com",
    phone: "(972) 564-8195",
    website: "https://www.rescueairandplumbing.com",
    vertical: "Plumbing",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "Berkey's Plumbing",
    ownerName: "Manager",
    email: "info@berkeysplumbing.com",
    phone: "(940) 202-2929",
    website: "https://www.berkeysplumbing.com",
    vertical: "Plumbing",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "Baker Brothers Plumbing, Air & Electric",
    ownerName: "Owner",
    email: "info@bakerbrothersdfw.com",
    phone: "(214) 324-8811",
    website: "https://www.bakerbrothersdfw.com",
    vertical: "Electrical",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "Tri-Star Electric",
    ownerName: "Owner",
    email: "info@tristarelectric.com",
    phone: "(214) 747-0113",
    website: "https://www.tristarelectric.com",
    vertical: "Electrical",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "Assured Roofing & Construction",
    ownerName: "Owner",
    email: "info@assuredroofing.com",
    phone: "(972) 422-0808",
    website: "https://www.assuredroofing.com",
    vertical: "Roofing",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "North Texas Roofing",
    ownerName: "Manager",
    email: "info@northtexasroofing.com",
    phone: "(972) 780-1800",
    website: "https://www.northtexasroofing.com",
    vertical: "Roofing",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "TruGreen Dallas",
    ownerName: "Manager",
    email: "info@trugreen.com",
    phone: "(800) 464-0171",
    website: "https://www.trugreen.com",
    vertical: "Landscaping",
    city: "Dallas",
    state: "TX",
  },
  {
    businessName: "Environmental Designs",
    ownerName: "Owner",
    email: "info@environmentaldesignsinc.com",
    phone: "(972) 231-2050",
    website: "https://www.environmentaldesignsinc.com",
    vertical: "Landscaping",
    city: "Dallas",
    state: "TX",
  },
];

// ── PHOENIX, AZ ──────────────────────────────────────────────────────────────
const PHOENIX_PROSPECTS: ProspectData[] = [
  {
    businessName: "Parker & Sons",
    ownerName: "Owner",
    email: "info@parkerandsons.com",
    phone: "(602) 273-7247",
    website: "https://www.parkerandsons.com",
    vertical: "HVAC",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "George Brazil Plumbing & Electrical",
    ownerName: "Owner",
    email: "info@georgebrazil.com",
    phone: "(602) 842-3936",
    website: "https://www.georgebrazil.com",
    vertical: "HVAC",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Hays Cooling, Heating & Plumbing",
    ownerName: "Owner",
    email: "info@hayscomfort.com",
    phone: "(602) 482-6302",
    website: "https://www.hayscomfort.com",
    vertical: "Plumbing",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Rooter Ranger Plumbing",
    ownerName: "Manager",
    email: "info@rooterranger.com",
    phone: "(602) 386-6987",
    website: "https://www.rooterranger.com",
    vertical: "Plumbing",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Penguin Air, Plumbing & Electrical",
    ownerName: "Owner",
    email: "info@penguinairphx.com",
    phone: "(480) 649-2808",
    website: "https://www.penguinairphx.com",
    vertical: "Electrical",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Professional Electrical Contractors",
    ownerName: "Owner",
    email: "info@pecaz.com",
    phone: "(623) 875-2990",
    website: "https://www.pecaz.com",
    vertical: "Electrical",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Arizona Roofing Systems",
    ownerName: "Owner",
    email: "info@arizonaroofingsystems.com",
    phone: "(480) 892-4411",
    website: "https://www.arizonaroofingsystems.com",
    vertical: "Roofing",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Lyons Roofing",
    ownerName: "Manager",
    email: "info@lyonsroofing.com",
    phone: "(602) 944-1556",
    website: "https://www.lyonsroofing.com",
    vertical: "Roofing",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Moon Valley Nursery & Landscaping",
    ownerName: "Owner",
    email: "info@moonvalleynurseries.com",
    phone: "(480) 969-5311",
    website: "https://www.moonvalleynurseries.com",
    vertical: "Landscaping",
    city: "Phoenix",
    state: "AZ",
  },
  {
    businessName: "Desert Crest Landscape",
    ownerName: "Owner",
    email: "info@desertcrestlandscape.com",
    phone: "(480) 951-5830",
    website: "https://www.desertcrestlandscape.com",
    vertical: "Landscaping",
    city: "Phoenix",
    state: "AZ",
  },
];

// ── ATLANTA, GA ──────────────────────────────────────────────────────────────
const ATLANTA_PROSPECTS: ProspectData[] = [
  {
    businessName: "Estes Heating and Air Conditioning",
    ownerName: "Owner",
    email: "info@estesair.com",
    phone: "(404) 366-9620",
    website: "https://www.estesair.com",
    vertical: "HVAC",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "PV Heating, Cooling & Plumbing",
    ownerName: "Owner",
    email: "info@pvhvac.com",
    phone: "(404) 994-2229",
    website: "https://www.pvhvac.com",
    vertical: "HVAC",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "Morningside Plumbing",
    ownerName: "Owner",
    email: "info@morningsideplumbing.com",
    phone: "(404) 984-2770",
    website: "https://www.morningsideplumbing.com",
    vertical: "Plumbing",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "Plumbers Inc. Atlanta",
    ownerName: "Manager",
    email: "info@plumbersincatlanta.com",
    phone: "(678) 222-4367",
    website: "https://www.plumbersincatlanta.com",
    vertical: "Plumbing",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "Byrd Electric",
    ownerName: "Owner",
    email: "info@byrdelectric.com",
    phone: "(770) 924-7740",
    website: "https://www.byrdelectric.com",
    vertical: "Electrical",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "Eklund Electric",
    ownerName: "Owner",
    email: "info@eklundelectric.com",
    phone: "(678) 450-4050",
    website: "https://www.eklundelectric.com",
    vertical: "Electrical",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "Atlanta Roofing Specialists",
    ownerName: "Owner",
    email: "info@atlantaroofing.com",
    phone: "(770) 419-2222",
    website: "https://www.atlantaroofing.com",
    vertical: "Roofing",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "Empire Roofing & Exteriors",
    ownerName: "Manager",
    email: "info@empireroofingga.com",
    phone: "(404) 350-7663",
    website: "https://www.empireroofingga.com",
    vertical: "Roofing",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "Gibbs Landscape Company",
    ownerName: "Owner",
    email: "info@gibbslandscape.com",
    phone: "(770) 952-1819",
    website: "https://www.gibbslandscape.com",
    vertical: "Landscaping",
    city: "Atlanta",
    state: "GA",
  },
  {
    businessName: "TurfPros Landscaping",
    ownerName: "Owner",
    email: "info@turfproslandscaping.com",
    phone: "(678) 369-8873",
    website: "https://www.turfproslandscaping.com",
    vertical: "Landscaping",
    city: "Atlanta",
    state: "GA",
  },
];

// ── ALL MARKETS ───────────────────────────────────────────────────────────────

interface MarketConfig {
  city: string;
  state: string;
  prospects: ProspectData[];
}

const MARKETS: MarketConfig[] = [
  { city: "Chicago", state: "IL", prospects: CHICAGO_PROSPECTS },
  { city: "Denver", state: "CO", prospects: DENVER_PROSPECTS },
  { city: "Dallas", state: "TX", prospects: DALLAS_PROSPECTS },
  { city: "Phoenix", state: "AZ", prospects: PHOENIX_PROSPECTS },
  { city: "Atlanta", state: "GA", prospects: ATLANTA_PROSPECTS },
];

// ── EMAIL TEMPLATES (city-parameterized) ──────────────────────────────────────

function buildEmail1Body(city: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>Straight to it — I'm not going to waste your time.</p>

<p>I work with {{vertical}} companies in the ${city} area, and here's what I keep seeing: owners spending $2,000–5,000/month on ads, but missing 30–40% of the calls those ads generate. Every missed call is a job that goes to whoever picks up first.</p>

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
}

function buildEmail2Body(city: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>Following up quick — wanted to share a real example since it's basically the same setup as {{company}}.</p>

<p>A {{vertical}} company with 8 trucks came to us a couple months back. Good crew, solid reputation, spending about $3K/month on Google Ads. The problem? They were missing 35% of the calls those ads were generating.</p>

<p><strong>Here's what happened after they plugged in Sovereign AI:</strong></p>

<ul>
<li>100% of calls answered, 24/7/365</li>
<li>47 extra appointments booked in the first month</li>
<li>$14,200 in new revenue from leads they were ALREADY paying for</li>
<li>23 new 5-star Google reviews (up from 2–3/month)</li>
<li>ROI: 11x what they paid us</li>
</ul>

<p>Same ads. Same budget. They just stopped letting leads walk out the door.</p>

<p>Your competitors in the ${city} area are starting to use this stuff, {{name}}. Not trying to scare you — just telling you what I'm seeing on the ground.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">15 Minutes — See If the Numbers Work</a></p>

<p>— Seth</p>
</div>`;
}

function buildEmail3Body(city: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>Two quick things I want to put on your radar because they're the biggest money leaks I see in {{vertical}} companies:</p>

<h3 style="color:#2563eb;">1. MISSED CALLS</h3>

<p>Here's what happens right now when a homeowner calls {{company}} after hours, or when your guys are knee-deep in a job:</p>

<p>The call goes to voicemail. The homeowner hangs up. They Google "{{vertical}} near me" and call the next company. That job is gone in 30 seconds.</p>

<p>Sovereign AI has an AI voice agent that picks up every call instantly. It sounds natural — not like one of those awful phone trees. It knows your services, your pricing, your availability. It books the appointment right there on the call.</p>

<h3 style="color:#2563eb;">2. YOUR ONLINE REPUTATION</h3>

<p>If you're sitting at 4.2 stars with 30 reviews and your competitor in ${city} has 4.8 stars with 200 reviews, you're invisible. Our reputation management system automatically sends review requests after every job and helps you climb the local rankings.</p>

<p>Both of these are included in Sovereign AI. Let me show you what it'd look like for {{company}}.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Book 15-Min Demo</a></p>

<p>— Seth</p>

<p><em>P.S. I can do a live demo where you hear the AI answer a call using YOUR company name and services. It's pretty wild.</em></p>
</div>`;
}

function buildEmail4Body(_city: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>I want to run some numbers by you real quick. No fluff — just math.</p>

<p>Let's say {{company}} gets 30 inbound calls per week. Industry data says {{vertical}} companies miss about 30% of those. That's <strong>9 missed calls per week</strong>.</p>

<p>Now let's say your average job is worth $800. And let's say half of those missed calls would've turned into booked jobs.</p>

<p style="font-size:18px;font-weight:bold;color:#dc2626;">9 missed calls x 50% close rate x $800 = $3,600/week in lost revenue.<br>That's $14,400 per month. Walking out the door.</p>

<p>Not because your work is bad. Just because nobody picked up the phone.</p>

<p>Sovereign AI costs a fraction of one missed job per month. And it doesn't just answer calls — it also runs your email marketing, manages your SEO, posts to social media, generates proposals, and handles your online reputation.</p>

<p>You'd need to hire 2–3 people to do what this platform does.</p>

<p>Most of our clients see full ROI within the first 7–10 days.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Last Few Spots This Week</a></p>

<p>— Seth</p>
</div>`;
}

function buildEmail5Body(city: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hey {{name}},</p>

<p>I've reached out a few times and haven't heard back. Totally get it — you're running a business, not sitting around reading emails from strangers.</p>

<p>I'm going to close out your file and stop bugging you.</p>

<p>But before I do — the {{vertical}} market in ${city} is getting more competitive every month. The companies winning right now aren't necessarily better at the work — they're better at capturing every lead, following up fast, and showing up first on Google.</p>

<p>If six months from now you're still missing calls after hours, struggling to get Google reviews, or doing all your marketing yourself at midnight — the door is open.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#6b7280;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Bookmark This for Later</a></p>

<p>Wishing you and {{company}} nothing but the best.</p>

<p>— Seth</p>

<p><em>P.S. We only take on a limited number of {{vertical}} clients per market area to keep things exclusive. If a competitor in your zip code signs up first, I won't be able to work with you. Just want to be upfront about that.</em></p>
</div>`;
}

// ── SUBJECT LINE VARIANTS (shared across markets — city injected via {{city}}) ─

const EMAIL_1_SUBJECTS = [
  "{{name}}, how many calls did {{company}} miss last week?",
  "Your Google Ads are working. Your phone isn't.",
  "{{name}} — a homeowner just called. Nobody picked up.",
];

const EMAIL_2_SUBJECTS = [
  "How a {{vertical}} shop added 47 booked jobs in 30 days",
  "{{name}}, figured you'd want to see this",
  "RE: Quick question for {{company}}",
];

const EMAIL_3_SUBJECTS = [
  "{{name}}, what if your phone never went to voicemail again?",
  "Your Google reviews are costing you jobs (here's the fix)",
  "The two things killing {{vertical}} businesses right now",
];

const EMAIL_4_SUBJECTS = [
  "{{name}}, let's do some quick math on {{company}}",
  "You're probably leaving $8K–15K/month on the table",
  "The real cost of doing nothing",
];

const EMAIL_5_SUBJECTS = [
  "Closing your file, {{name}}",
  "{{name}}, I'll take the hint",
  "No hard feelings",
];

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 SOVEREIGN AI — EXPAND OUTREACH TO 5 NEW MARKETS\n");
  console.log("=".repeat(60));

  for (const market of MARKETS) {
    const { city, state, prospects } = market;
    console.log(`\n📍 Processing market: ${city}, ${state}`);

    // ── Step A: Load Prospects ─────────────────────────────────────────────
    console.log(`   Loading ${prospects.length} prospects...`);
    let loadedCount = 0;
    let skippedCount = 0;

    for (const p of prospects) {
      const existing = await prisma.prospect.findFirst({
        where: { businessName: p.businessName, city: p.city },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.prospect.create({
        data: {
          businessName: p.businessName,
          ownerName: p.ownerName,
          email: p.email,
          phone: p.phone || null,
          website: p.website || null,
          vertical: p.vertical,
          city: p.city,
          state: p.state,
          status: "new",
          source: "manual",
          score: 70,
        },
      });
      loadedCount++;
    }

    console.log(
      `   ✅ Loaded ${loadedCount} prospects (${skippedCount} already existed)`
    );

    // ── Step B: Create 5-Email Campaign Sequence ───────────────────────────
    console.log(`   Creating 5-email campaign sequence...`);

    const campaignDefs = [
      {
        name: `${city} Contractors - Email 1 (Intro)`,
        subjects: EMAIL_1_SUBJECTS,
        body: buildEmail1Body(city),
        sequenceStep: 1,
        dayOffset: 0,
      },
      {
        name: `${city} Contractors - Email 2 (Social Proof)`,
        subjects: EMAIL_2_SUBJECTS,
        body: buildEmail2Body(city),
        sequenceStep: 2,
        dayOffset: 3,
      },
      {
        name: `${city} Contractors - Email 3 (Feature Spotlight)`,
        subjects: EMAIL_3_SUBJECTS,
        body: buildEmail3Body(city),
        sequenceStep: 3,
        dayOffset: 6,
      },
      {
        name: `${city} Contractors - Email 4 (ROI Math)`,
        subjects: EMAIL_4_SUBJECTS,
        body: buildEmail4Body(city),
        sequenceStep: 4,
        dayOffset: 9,
      },
      {
        name: `${city} Contractors - Email 5 (Breakup)`,
        subjects: EMAIL_5_SUBJECTS,
        body: buildEmail5Body(city),
        sequenceStep: 5,
        dayOffset: 11,
      },
    ];

    const createdCampaigns: Array<{ id: string; name: string }> = [];

    for (const def of campaignDefs) {
      const existing = await prisma.coldOutreachCampaign.findFirst({
        where: { name: def.name },
      });

      if (existing) {
        createdCampaigns.push({ id: existing.id, name: existing.name });
        console.log(`   ⏭️  Already exists: ${def.name}`);
        continue;
      }

      const created = await prisma.coldOutreachCampaign.create({
        data: {
          name: def.name,
          status: "draft",
          fromEmail: "noreply@trysovereignai.com",
          fromName: "Seth Brueland",
          subjectVariants: JSON.stringify(def.subjects),
          bodyTemplate: def.body,
          dailySendLimit: 50,
          warmupEnabled: true,
          warmupStartSent: 5,
          warmupRampRate: 3,
          sequenceStep: def.sequenceStep,
          dayOffset: def.dayOffset,
        },
      });

      createdCampaigns.push({ id: created.id, name: created.name });
      console.log(`   ✅ Created campaign: ${def.name}`);
    }

    // ── Step C: Link Prospects as Recipients ──────────────────────────────
    console.log(`   Linking prospects as campaign recipients...`);
    let totalAdded = 0;

    for (const campaign of createdCampaigns) {
      let added = 0;

      for (const p of prospects) {
        const existing = await prisma.coldEmailRecipient.findFirst({
          where: {
            campaignId: campaign.id,
            email: p.email.toLowerCase(),
          },
        });

        if (existing) continue;

        await prisma.coldEmailRecipient.create({
          data: {
            campaignId: campaign.id,
            email: p.email.toLowerCase(),
            name: p.ownerName,
            company: p.businessName,
            vertical: p.vertical,
            city: p.city,
            status: "pending",
          },
        });
        added++;
      }

      totalAdded += added;
      if (added > 0) {
        console.log(`   ✅ Added ${added} recipients to: ${campaign.name}`);
      }
    }

    console.log(
      `   📊 ${city}: ${totalAdded} recipient records created across 5 campaigns`
    );
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("🎯 EXPANSION COMPLETE\n");
  console.log("New markets added:");
  for (const m of MARKETS) {
    console.log(
      `  • ${m.city}, ${m.state} — ${m.prospects.length} prospects, 5 campaigns`
    );
  }
  console.log("");
  console.log("Totals:");
  const totalProspects = MARKETS.reduce((sum, m) => sum + m.prospects.length, 0);
  console.log(`  • ${totalProspects} new prospects across ${MARKETS.length} cities`);
  console.log(`  • ${MARKETS.length * 5} new campaign records (one 5-email sequence per city)`);
  console.log(
    `  • ${totalProspects * 5} recipient records (each prospect in all 5 sequence steps)`
  );
  console.log("");
  console.log("All campaigns are in 'draft' status.");
  console.log(
    "Activate Email 1 per city when ready — cron will handle the rest via dayOffset."
  );
  console.log("=".repeat(60));
}

main()
  .catch((error) => {
    console.error("\n❌ Expand outreach failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
