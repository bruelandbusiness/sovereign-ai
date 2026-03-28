/**
 * Sovereign AI — Seed Prospects & Cold Outreach Campaigns
 *
 * Inserts 50 fictional home service business prospects across 5 verticals
 * (HVAC, Plumbing, Roofing, Electrical, Landscaping) in 10 major US metros,
 * then creates a 5-email cold outreach campaign sequence and enrolls all
 * prospects as recipients so the cron jobs can begin processing.
 *
 * All business names, emails, phone numbers, and owner names are FICTIONAL.
 * Do not use these to contact real businesses.
 *
 * Usage:
 *   npx tsx scripts/seed-prospects.ts
 *
 * Prerequisites:
 *   - DATABASE_URL set in .env.local (Postgres)
 *   - Prisma migrations applied (`npx prisma migrate deploy`)
 */

import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local before running this script."
  );
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// ---------------------------------------------------------------------------
// Fictional prospect data — 50 records, 5 verticals x 10 cities
// ---------------------------------------------------------------------------

interface ProspectSeed {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  vertical: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
}

const PROSPECTS: ProspectSeed[] = [
  // ── Dallas, TX ──────────────────────────────────────────────────────────
  {
    businessName: "Lone Star Climate Control",
    ownerName: "Marcus Webb",
    email: "marcus@lonestarclimatecontrol.com",
    phone: "(214) 555-0132",
    website: "https://lonestarclimatecontrol.com",
    vertical: "HVAC",
    city: "Dallas",
    state: "TX",
    rating: 4.6,
    reviewCount: 87,
  },
  {
    businessName: "DFW Drain Pros",
    ownerName: "Carmen Ochoa",
    email: "carmen@dfwdrainpros.com",
    phone: "(972) 555-0218",
    website: "https://dfwdrainpros.com",
    vertical: "Plumbing",
    city: "Dallas",
    state: "TX",
    rating: 4.3,
    reviewCount: 52,
  },
  {
    businessName: "Ridgeline Roofing DFW",
    ownerName: "Travis Holt",
    email: "travis@ridgelineroofingdfw.com",
    phone: "(469) 555-0344",
    website: "https://ridgelineroofingdfw.com",
    vertical: "Roofing",
    city: "Dallas",
    state: "TX",
    rating: 4.7,
    reviewCount: 143,
  },
  {
    businessName: "Brightline Electric Dallas",
    ownerName: "Derek Chan",
    email: "derek@brightlineelectricdallas.com",
    phone: "(214) 555-0491",
    website: "https://brightlineelectricdallas.com",
    vertical: "Electrical",
    city: "Dallas",
    state: "TX",
    rating: 4.5,
    reviewCount: 39,
  },
  {
    businessName: "GreenEdge Landscaping",
    ownerName: "Rosa Villanueva",
    email: "rosa@greenedgelandscaping.com",
    phone: "(972) 555-0567",
    website: "https://greenedgelandscaping.com",
    vertical: "Landscaping",
    city: "Dallas",
    state: "TX",
    rating: 4.8,
    reviewCount: 64,
  },

  // ── Phoenix, AZ ─────────────────────────────────────────────────────────
  {
    businessName: "Desert Breeze HVAC",
    ownerName: "Kyle Whitman",
    email: "kyle@desertbreezehvac.com",
    phone: "(602) 555-0198",
    website: "https://desertbreezehvac.com",
    vertical: "HVAC",
    city: "Phoenix",
    state: "AZ",
    rating: 4.4,
    reviewCount: 112,
  },
  {
    businessName: "Copper State Plumbing",
    ownerName: "Janet Morales",
    email: "janet@copperstateplumbing.com",
    phone: "(480) 555-0275",
    website: "https://copperstateplumbing.com",
    vertical: "Plumbing",
    city: "Phoenix",
    state: "AZ",
    rating: 4.2,
    reviewCount: 78,
  },
  {
    businessName: "Sunbelt Roofing Solutions",
    ownerName: "Aaron Kimball",
    email: "aaron@sunbeltroofingsolutions.com",
    phone: "(623) 555-0382",
    website: "https://sunbeltroofingsolutions.com",
    vertical: "Roofing",
    city: "Phoenix",
    state: "AZ",
    rating: 4.6,
    reviewCount: 201,
  },
  {
    businessName: "Valley Volt Electric",
    ownerName: "Diana Perez",
    email: "diana@valleyvoltelectric.com",
    phone: "(602) 555-0419",
    website: "https://valleyvoltelectric.com",
    vertical: "Electrical",
    city: "Phoenix",
    state: "AZ",
    rating: 4.3,
    reviewCount: 45,
  },
  {
    businessName: "Sonoran Grounds Landscaping",
    ownerName: "Miguel Fuentes",
    email: "miguel@sonorangrounds.com",
    phone: "(480) 555-0503",
    website: "https://sonorangrounds.com",
    vertical: "Landscaping",
    city: "Phoenix",
    state: "AZ",
    rating: 4.7,
    reviewCount: 93,
  },

  // ── Minneapolis, MN ─────────────────────────────────────────────────────
  {
    businessName: "North Star Heating & Air",
    ownerName: "Erik Lindgren",
    email: "erik@northstarheatingair.com",
    phone: "(612) 555-0134",
    website: "https://northstarheatingair.com",
    vertical: "HVAC",
    city: "Minneapolis",
    state: "MN",
    rating: 4.5,
    reviewCount: 68,
  },
  {
    businessName: "Twin Cities Pipe Works",
    ownerName: "Rachel Kowalski",
    email: "rachel@twincpitiespipeworks.com",
    phone: "(763) 555-0251",
    website: "https://twincpitiespipeworks.com",
    vertical: "Plumbing",
    city: "Minneapolis",
    state: "MN",
    rating: 4.4,
    reviewCount: 41,
  },
  {
    businessName: "Northland Roofing Co",
    ownerName: "Cody Bjornstad",
    email: "cody@northlandroofingco.com",
    phone: "(952) 555-0378",
    website: "https://northlandroofingco.com",
    vertical: "Roofing",
    city: "Minneapolis",
    state: "MN",
    rating: 4.8,
    reviewCount: 156,
  },
  {
    businessName: "Lakeside Electric MN",
    ownerName: "Sandra Voss",
    email: "sandra@lakesideelectricmn.com",
    phone: "(612) 555-0442",
    website: "https://lakesideelectricmn.com",
    vertical: "Electrical",
    city: "Minneapolis",
    state: "MN",
    rating: 4.6,
    reviewCount: 33,
  },
  {
    businessName: "Prairie View Landscaping",
    ownerName: "Tom Henriksen",
    email: "tom@prairieviewlandscaping.com",
    phone: "(763) 555-0519",
    website: "https://prairieviewlandscaping.com",
    vertical: "Landscaping",
    city: "Minneapolis",
    state: "MN",
    rating: 4.3,
    reviewCount: 57,
  },

  // ── Denver, CO ──────────────────────────────────────────────────────────
  {
    businessName: "Mile High Comfort HVAC",
    ownerName: "Jason Mercer",
    email: "jason@milehighcomforthvac.com",
    phone: "(303) 555-0176",
    website: "https://milehighcomforthvac.com",
    vertical: "HVAC",
    city: "Denver",
    state: "CO",
    rating: 4.7,
    reviewCount: 95,
  },
  {
    businessName: "Front Range Plumbing",
    ownerName: "Alicia Torres",
    email: "alicia@frontrangeplumbing.com",
    phone: "(720) 555-0223",
    website: "https://frontrangeplumbing.com",
    vertical: "Plumbing",
    city: "Denver",
    state: "CO",
    rating: 4.5,
    reviewCount: 62,
  },
  {
    businessName: "Peak Performance Roofing",
    ownerName: "Brett Sullivan",
    email: "brett@peakperformanceroofing.com",
    phone: "(303) 555-0391",
    website: "https://peakperformanceroofing.com",
    vertical: "Roofing",
    city: "Denver",
    state: "CO",
    rating: 4.4,
    reviewCount: 178,
  },
  {
    businessName: "Rockies Electrical Services",
    ownerName: "Nina Castillo",
    email: "nina@rockieselectrical.com",
    phone: "(720) 555-0458",
    website: "https://rockieselectrical.com",
    vertical: "Electrical",
    city: "Denver",
    state: "CO",
    rating: 4.2,
    reviewCount: 28,
  },
  {
    businessName: "Elevation Landscape Design",
    ownerName: "Paul Decker",
    email: "paul@elevationlandscapedesign.com",
    phone: "(303) 555-0534",
    website: "https://elevationlandscapedesign.com",
    vertical: "Landscaping",
    city: "Denver",
    state: "CO",
    rating: 4.9,
    reviewCount: 71,
  },

  // ── Atlanta, GA ─────────────────────────────────────────────────────────
  {
    businessName: "Peachtree Air Systems",
    ownerName: "Terrence Brooks",
    email: "terrence@peachtreeairsystems.com",
    phone: "(404) 555-0141",
    website: "https://peachtreeairsystems.com",
    vertical: "HVAC",
    city: "Atlanta",
    state: "GA",
    rating: 4.3,
    reviewCount: 104,
  },
  {
    businessName: "Southern Flow Plumbing",
    ownerName: "Keisha Williams",
    email: "keisha@southernflowplumbing.com",
    phone: "(770) 555-0268",
    website: "https://southernflowplumbing.com",
    vertical: "Plumbing",
    city: "Atlanta",
    state: "GA",
    rating: 4.6,
    reviewCount: 59,
  },
  {
    businessName: "ATL Shield Roofing",
    ownerName: "Kevin Marsh",
    email: "kevin@atlshieldroofing.com",
    phone: "(678) 555-0355",
    website: "https://atlshieldroofing.com",
    vertical: "Roofing",
    city: "Atlanta",
    state: "GA",
    rating: 4.5,
    reviewCount: 132,
  },
  {
    businessName: "Dogwood Electric Co",
    ownerName: "Angela Dixon",
    email: "angela@dogwoodelectricco.com",
    phone: "(404) 555-0487",
    website: "https://dogwoodelectricco.com",
    vertical: "Electrical",
    city: "Atlanta",
    state: "GA",
    rating: 4.4,
    reviewCount: 47,
  },
  {
    businessName: "Magnolia Outdoor Services",
    ownerName: "Darnell Jackson",
    email: "darnell@magnoliaoutdoor.com",
    phone: "(770) 555-0512",
    website: "https://magnoliaoutdoor.com",
    vertical: "Landscaping",
    city: "Atlanta",
    state: "GA",
    rating: 4.7,
    reviewCount: 85,
  },

  // ── Tampa, FL ───────────────────────────────────────────────────────────
  {
    businessName: "Bay Breeze Air Conditioning",
    ownerName: "Carlos Reyes",
    email: "carlos@baybreezeac.com",
    phone: "(813) 555-0159",
    website: "https://baybreezeac.com",
    vertical: "HVAC",
    city: "Tampa",
    state: "FL",
    rating: 4.5,
    reviewCount: 91,
  },
  {
    businessName: "Gulf Coast Plumbing Pros",
    ownerName: "Linda Hartley",
    email: "linda@gulfcoastplumbingpros.com",
    phone: "(727) 555-0237",
    website: "https://gulfcoastplumbingpros.com",
    vertical: "Plumbing",
    city: "Tampa",
    state: "FL",
    rating: 4.1,
    reviewCount: 36,
  },
  {
    businessName: "Sunshine State Roofing",
    ownerName: "Grant Parsons",
    email: "grant@sunshinestateroofing.com",
    phone: "(813) 555-0364",
    website: "https://sunshinestateroofing.com",
    vertical: "Roofing",
    city: "Tampa",
    state: "FL",
    rating: 4.8,
    reviewCount: 217,
  },
  {
    businessName: "Tampa Bay Wiring Co",
    ownerName: "Michelle Cruz",
    email: "michelle@tampabaywiring.com",
    phone: "(727) 555-0428",
    website: "https://tampabaywiring.com",
    vertical: "Electrical",
    city: "Tampa",
    state: "FL",
    rating: 4.3,
    reviewCount: 54,
  },
  {
    businessName: "Coastal Green Landscapes",
    ownerName: "Robert Nguyen",
    email: "robert@coastalgreenlandscapes.com",
    phone: "(813) 555-0596",
    website: "https://coastalgreenlandscapes.com",
    vertical: "Landscaping",
    city: "Tampa",
    state: "FL",
    rating: 4.6,
    reviewCount: 72,
  },

  // ── Charlotte, NC ───────────────────────────────────────────────────────
  {
    businessName: "Queen City Heating & Air",
    ownerName: "Brian Stokes",
    email: "brian@queencityheatingair.com",
    phone: "(704) 555-0183",
    website: "https://queencityheatingair.com",
    vertical: "HVAC",
    city: "Charlotte",
    state: "NC",
    rating: 4.4,
    reviewCount: 76,
  },
  {
    businessName: "Carolina Plumbing Solutions",
    ownerName: "Stephanie Bass",
    email: "stephanie@carolinaplumbingsolutions.com",
    phone: "(980) 555-0241",
    website: "https://carolinaplumbingsolutions.com",
    vertical: "Plumbing",
    city: "Charlotte",
    state: "NC",
    rating: 4.6,
    reviewCount: 48,
  },
  {
    businessName: "Crown Roofing Charlotte",
    ownerName: "Nathan Wells",
    email: "nathan@crownroofingcharlotte.com",
    phone: "(704) 555-0372",
    website: "https://crownroofingcharlotte.com",
    vertical: "Roofing",
    city: "Charlotte",
    state: "NC",
    rating: 4.5,
    reviewCount: 165,
  },
  {
    businessName: "Piedmont Electrical Pros",
    ownerName: "Laura Kimble",
    email: "laura@piedmontelectricalpros.com",
    phone: "(980) 555-0439",
    website: "https://piedmontelectricalpros.com",
    vertical: "Electrical",
    city: "Charlotte",
    state: "NC",
    rating: 4.2,
    reviewCount: 31,
  },
  {
    businessName: "Carolina Curb Appeal",
    ownerName: "James Thornton",
    email: "james@carolinacurbappeal.com",
    phone: "(704) 555-0578",
    website: "https://carolinacurbappeal.com",
    vertical: "Landscaping",
    city: "Charlotte",
    state: "NC",
    rating: 4.8,
    reviewCount: 99,
  },

  // ── Nashville, TN ───────────────────────────────────────────────────────
  {
    businessName: "Music City Climate Co",
    ownerName: "Adam Fletcher",
    email: "adam@musiccityclimateco.com",
    phone: "(615) 555-0127",
    website: "https://musiccityclimateco.com",
    vertical: "HVAC",
    city: "Nashville",
    state: "TN",
    rating: 4.7,
    reviewCount: 83,
  },
  {
    businessName: "Nashville Pipe & Drain",
    ownerName: "Tanya Harper",
    email: "tanya@nashvillepipedrain.com",
    phone: "(629) 555-0264",
    website: "https://nashvillepipedrain.com",
    vertical: "Plumbing",
    city: "Nashville",
    state: "TN",
    rating: 4.3,
    reviewCount: 55,
  },
  {
    businessName: "Volunteer Roofing Group",
    ownerName: "Shane Garrett",
    email: "shane@volunteerroofinggroup.com",
    phone: "(615) 555-0389",
    website: "https://volunteerroofinggroup.com",
    vertical: "Roofing",
    city: "Nashville",
    state: "TN",
    rating: 4.6,
    reviewCount: 148,
  },
  {
    businessName: "Cumberland Electric LLC",
    ownerName: "Patricia Odom",
    email: "patricia@cumberlandelectricllc.com",
    phone: "(629) 555-0456",
    website: "https://cumberlandelectricllc.com",
    vertical: "Electrical",
    city: "Nashville",
    state: "TN",
    rating: 4.4,
    reviewCount: 42,
  },
  {
    businessName: "Volunteer Green Works",
    ownerName: "Dustin Keller",
    email: "dustin@volunteergreenworks.com",
    phone: "(615) 555-0523",
    website: "https://volunteergreenworks.com",
    vertical: "Landscaping",
    city: "Nashville",
    state: "TN",
    rating: 4.5,
    reviewCount: 67,
  },

  // ── Austin, TX ──────────────────────────────────────────────────────────
  {
    businessName: "Capitol HVAC Services",
    ownerName: "Ryan Caldwell",
    email: "ryan@capitolhvacservices.com",
    phone: "(512) 555-0148",
    website: "https://capitolhvacservices.com",
    vertical: "HVAC",
    city: "Austin",
    state: "TX",
    rating: 4.6,
    reviewCount: 102,
  },
  {
    businessName: "Barton Creek Plumbing",
    ownerName: "Leslie Dunn",
    email: "leslie@bartoncreekplumbing.com",
    phone: "(737) 555-0295",
    website: "https://bartoncreekplumbing.com",
    vertical: "Plumbing",
    city: "Austin",
    state: "TX",
    rating: 4.4,
    reviewCount: 44,
  },
  {
    businessName: "Hill Country Roofing ATX",
    ownerName: "Drew Ramsey",
    email: "drew@hillcountryroofing.com",
    phone: "(512) 555-0367",
    website: "https://hillcountryroofing.com",
    vertical: "Roofing",
    city: "Austin",
    state: "TX",
    rating: 4.7,
    reviewCount: 189,
  },
  {
    businessName: "Live Wire Electric Austin",
    ownerName: "Monica Garza",
    email: "monica@livewireelectricatx.com",
    phone: "(737) 555-0431",
    website: "https://livewireelectricatx.com",
    vertical: "Electrical",
    city: "Austin",
    state: "TX",
    rating: 4.5,
    reviewCount: 37,
  },
  {
    businessName: "Austin Greenscape Pros",
    ownerName: "Victor Herrera",
    email: "victor@austingreenscapepros.com",
    phone: "(512) 555-0588",
    website: "https://austingreenscapepros.com",
    vertical: "Landscaping",
    city: "Austin",
    state: "TX",
    rating: 4.8,
    reviewCount: 81,
  },

  // ── Houston, TX ─────────────────────────────────────────────────────────
  {
    businessName: "Bayou City Air & Heat",
    ownerName: "Leonard Price",
    email: "leonard@bayoucityairheat.com",
    phone: "(713) 555-0162",
    website: "https://bayoucityairheat.com",
    vertical: "HVAC",
    city: "Houston",
    state: "TX",
    rating: 4.3,
    reviewCount: 119,
  },
  {
    businessName: "Space City Plumbing",
    ownerName: "Karen Matsuda",
    email: "karen@spacecityplumbing.com",
    phone: "(832) 555-0289",
    website: "https://spacecityplumbing.com",
    vertical: "Plumbing",
    city: "Houston",
    state: "TX",
    rating: 4.5,
    reviewCount: 63,
  },
  {
    businessName: "Magnolia Roofing Houston",
    ownerName: "Chris Stratton",
    email: "chris@magnoliaroofinghouston.com",
    phone: "(713) 555-0346",
    website: "https://magnoliaroofinghouston.com",
    vertical: "Roofing",
    city: "Houston",
    state: "TX",
    rating: 4.6,
    reviewCount: 174,
  },
  {
    businessName: "H-Town Electric Pros",
    ownerName: "Felicia Warren",
    email: "felicia@htownelectricpros.com",
    phone: "(832) 555-0473",
    website: "https://htownelectricpros.com",
    vertical: "Electrical",
    city: "Houston",
    state: "TX",
    rating: 4.4,
    reviewCount: 51,
  },
  {
    businessName: "Bluebonnet Lawn & Garden",
    ownerName: "Ricardo Silva",
    email: "ricardo@bluebonnetlawngarden.com",
    phone: "(713) 555-0541",
    website: "https://bluebonnetlawngarden.com",
    vertical: "Landscaping",
    city: "Houston",
    state: "TX",
    rating: 4.7,
    reviewCount: 88,
  },
];

// ---------------------------------------------------------------------------
// Email campaign templates — 5-step cold sequence
//
// Uses the same placeholder convention as the existing templates:
// {{name}}, {{company}}, {{vertical}}, {{city}}, {{unsubscribeUrl}}
// ---------------------------------------------------------------------------

const CAN_SPAM_FOOTER = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#888;text-align:center;">
  <p>Sovereign AI | 123 Main Street, Suite 100, Austin, TX 78701</p>
  <p><a href="{{unsubscribeUrl}}" style="color:#888;text-decoration:underline;">Unsubscribe</a></p>
</div>`;

interface CampaignSeed {
  name: string;
  sequenceStep: number;
  dayOffset: number;
  subjectVariants: string[];
  bodyTemplate: string;
}

const CAMPAIGN_SEQUENCE: CampaignSeed[] = [
  {
    name: "Home Services National - Email 1 (Intro)",
    sequenceStep: 1,
    dayOffset: 0,
    subjectVariants: [
      "{{name}}, how many calls did {{company}} miss last week?",
      "Your Google Ads are working. Your phone isn't.",
      "{{name}} — a homeowner just called. Nobody picked up.",
    ],
    bodyTemplate: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;color:#333;">
<p>Hey {{name}},</p>

<p>I spent a few minutes looking at {{company}} online and noticed something that might be costing you jobs in {{city}}.</p>

<p>Most {{vertical}} companies miss 30-40% of their inbound calls. Every missed call is a homeowner who Googles the next contractor on the list. That adds up fast.</p>

<p>We built Sovereign AI to fix exactly this. It's an AI-powered marketing platform that:</p>

<ul>
<li>Answers every call 24/7 (sounds natural, books appointments on the spot)</li>
<li>Follows up with every lead automatically — email, text, even voice</li>
<li>Manages your online reviews so you rank higher on Google</li>
<li>Runs your email campaigns, SEO, and social media</li>
</ul>

<p>One {{vertical}} owner we work with picked up an extra $14K/month in revenue within 60 days — just from leads he was already paying for but letting slip through.</p>

<p>Would 15 minutes be worth it to see how this could work for {{company}}?</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Book a Free Demo</a></p>

<p>Best,<br>Seth Brueland<br><a href="https://www.trysovereignai.com">Sovereign AI</a> | Built for Contractors</p>
${CAN_SPAM_FOOTER}
</div>`,
  },
  {
    name: "Home Services National - Email 2 (Social Proof)",
    sequenceStep: 2,
    dayOffset: 3,
    subjectVariants: [
      "How a {{vertical}} shop added 47 booked jobs in 30 days",
      "{{name}}, figured you'd want to see this",
      "RE: Quick question for {{company}}",
    ],
    bodyTemplate: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;color:#333;">
<p>Hey {{name}},</p>

<p>Following up quick — wanted to share a real example since it's basically the same setup as {{company}}.</p>

<p>A {{vertical}} company with a small crew came to us spending about $3K/month on Google Ads. The problem? They were missing over a third of the calls those ads generated.</p>

<p><strong>Here's what happened after they plugged in Sovereign AI:</strong></p>

<ul>
<li>100% of calls answered, 24/7/365</li>
<li>47 extra appointments booked in the first month</li>
<li>$14,200 in new revenue from leads they were ALREADY paying for</li>
<li>23 new 5-star Google reviews (up from 2-3/month)</li>
<li>ROI: 11x what they paid us</li>
</ul>

<p>Same ads. Same budget. They just stopped letting leads walk out the door.</p>

<p>Your competitors in {{city}} are starting to use this stuff, {{name}}. Not trying to pressure you — just sharing what I'm seeing on the ground.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">15 Minutes — See If the Numbers Work</a></p>

<p>-- Seth</p>
${CAN_SPAM_FOOTER}
</div>`,
  },
  {
    name: "Home Services National - Email 3 (Feature Spotlight)",
    sequenceStep: 3,
    dayOffset: 7,
    subjectVariants: [
      "{{name}}, what if your phone never went to voicemail again?",
      "Your Google reviews are costing you jobs (here's the fix)",
      "The two things killing {{vertical}} businesses right now",
    ],
    bodyTemplate: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;color:#333;">
<p>Hey {{name}},</p>

<p>Two quick things I want to put on your radar because they're the biggest money leaks I see in {{vertical}} companies:</p>

<h3 style="color:#2563eb;">1. MISSED CALLS</h3>

<p>When a homeowner calls {{company}} after hours, or while your team is on a job, the call goes to voicemail. They hang up and call the next contractor. That job is gone in 30 seconds.</p>

<p>Sovereign AI has an AI voice agent that picks up every call instantly. It sounds natural, knows your services, and books the appointment right on the call.</p>

<h3 style="color:#2563eb;">2. YOUR ONLINE REPUTATION</h3>

<p>If you're sitting at a few dozen reviews and your competitor has 200+ at a higher rating, you're invisible in local search. Our reputation system automatically sends review requests after every job and helps you climb the local rankings in {{city}}.</p>

<p>Both are included in Sovereign AI. Let me show you what it'd look like for {{company}}.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Book 15-Min Demo</a></p>

<p>-- Seth</p>

<p><em>P.S. I can do a live demo where you hear the AI answer a call using YOUR company name and services.</em></p>
${CAN_SPAM_FOOTER}
</div>`,
  },
  {
    name: "Home Services National - Email 4 (ROI Math)",
    sequenceStep: 4,
    dayOffset: 11,
    subjectVariants: [
      "{{name}}, let's do some quick math on {{company}}",
      "You're probably leaving $8K-15K/month on the table",
      "The real cost of doing nothing",
    ],
    bodyTemplate: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;color:#333;">
<p>Hey {{name}},</p>

<p>Quick numbers — no fluff, just math.</p>

<p>Let's say {{company}} gets 30 inbound calls per week. Industry data says {{vertical}} companies miss about 30% of those. That's <strong>9 missed calls per week</strong>.</p>

<p>If your average job is worth $800 and half of those missed calls would've booked:</p>

<p style="font-size:18px;font-weight:bold;color:#dc2626;">9 missed calls x 50% close rate x $800 = $3,600/week in lost revenue.<br>That's $14,400 per month walking out the door.</p>

<p>Not because your work is bad. Just because nobody picked up the phone.</p>

<p>Sovereign AI costs a fraction of one missed job per month. And it doesn't just answer calls — it runs your email marketing, manages SEO, posts to social media, generates proposals, and handles your online reputation.</p>

<p>You'd need to hire 2-3 people to do what this platform does. Most of our clients see full ROI within 7-10 days.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Last Few Spots This Week</a></p>

<p>-- Seth</p>
${CAN_SPAM_FOOTER}
</div>`,
  },
  {
    name: "Home Services National - Email 5 (Breakup)",
    sequenceStep: 5,
    dayOffset: 14,
    subjectVariants: [
      "Closing your file, {{name}}",
      "{{name}}, I'll take the hint",
      "No hard feelings",
    ],
    bodyTemplate: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;color:#333;">
<p>Hey {{name}},</p>

<p>I've reached out a few times and haven't heard back. Totally get it — you're running a business, not sitting around reading emails.</p>

<p>I'm going to close out your file and stop reaching out.</p>

<p>But before I do — the {{vertical}} market in {{city}} is getting more competitive every month. The companies winning right now aren't necessarily better at the work — they're better at capturing every lead, following up fast, and showing up first on Google.</p>

<p>If down the road you're still missing calls after hours, struggling to get reviews, or doing all your marketing at midnight — the door is open.</p>

<p><a href="https://calendly.com/bruelandbusiness/30min" style="display:inline-block;background:#6b7280;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Bookmark This for Later</a></p>

<p>Wishing you and {{company}} nothing but the best.</p>

<p>-- Seth</p>

<p><em>P.S. We only take on a limited number of {{vertical}} clients per market area to keep things exclusive. If a competitor in your area signs up first, I won't be able to work with you. Just want to be upfront about that.</em></p>
${CAN_SPAM_FOOTER}
</div>`,
  },
];

// ---------------------------------------------------------------------------
// Sender config — matches the existing setup-autonomous.ts conventions
// ---------------------------------------------------------------------------

const FROM_EMAIL = "seth@trysovereignai.com";
const FROM_NAME = "Seth Brueland";

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n=== SOVEREIGN AI — SEED PROSPECTS & OUTREACH CAMPAIGNS ===\n");

  // ── Step 1: Insert prospect records ──────────────────────────────────
  console.log("Step 1: Inserting 50 prospect records...\n");

  let created = 0;
  let skipped = 0;

  for (const p of PROSPECTS) {
    const existing = await prisma.prospect.findFirst({
      where: {
        businessName: p.businessName,
        city: p.city,
      },
    });

    if (existing) {
      skipped++;
      console.log(`  [skip] ${p.businessName} (${p.city}) — already exists`);
      continue;
    }

    await prisma.prospect.create({
      data: {
        businessName: p.businessName,
        ownerName: p.ownerName,
        email: p.email,
        phone: p.phone,
        website: p.website,
        vertical: p.vertical,
        city: p.city,
        state: p.state,
        rating: p.rating,
        reviewCount: p.reviewCount,
        emailVerified: false,
        emailSource: "manual",
        score: 75, // Above the 60-point threshold for outreach-enqueue
        status: "enriched", // Required by outreach-enqueue cron
        source: "manual",
      },
    });

    created++;
    console.log(`  [new]  ${p.businessName} (${p.city}, ${p.state}) — ${p.vertical}`);
  }

  console.log(`\n  Result: ${created} created, ${skipped} skipped (duplicates)\n`);

  // ── Step 2: Create 5-email campaign sequence ─────────────────────────
  console.log("Step 2: Creating 5-email cold outreach campaign sequence...\n");

  const campaignIds: string[] = [];

  for (const c of CAMPAIGN_SEQUENCE) {
    const existing = await prisma.coldOutreachCampaign.findFirst({
      where: { name: c.name },
    });

    if (existing) {
      campaignIds.push(existing.id);
      console.log(`  [skip] ${c.name} — already exists (${existing.id})`);
      continue;
    }

    const campaign = await prisma.coldOutreachCampaign.create({
      data: {
        name: c.name,
        status: c.sequenceStep === 1 ? "active" : "draft",
        fromEmail: FROM_EMAIL,
        fromName: FROM_NAME,
        subjectVariants: JSON.stringify(c.subjectVariants),
        bodyTemplate: c.bodyTemplate,
        dailySendLimit: 50,
        warmupEnabled: true,
        warmupStartSent: 5,
        warmupRampRate: 3,
        sequenceStep: c.sequenceStep,
        dayOffset: c.dayOffset,
        startedAt: c.sequenceStep === 1 ? new Date() : null,
      },
    });

    campaignIds.push(campaign.id);
    console.log(
      `  [new]  ${c.name} — ${c.sequenceStep === 1 ? "ACTIVE" : "draft"} (${campaign.id})`
    );
  }

  console.log("");

  // ── Step 3: Enroll all prospects as recipients in the step-1 campaign ─
  console.log("Step 3: Enrolling prospects as campaign recipients...\n");

  const step1CampaignId = campaignIds[0];
  if (!step1CampaignId) {
    console.log("  [error] No step-1 campaign found — skipping enrollment.");
    return;
  }

  // Load the existing enrolled emails to avoid duplicates
  const existingRecipients = await prisma.coldEmailRecipient.findMany({
    where: { campaignId: step1CampaignId },
    select: { email: true },
  });
  const enrolledEmails = new Set(
    existingRecipients.map((r) => r.email.toLowerCase())
  );

  let enrolled = 0;
  let enrollSkipped = 0;

  for (const p of PROSPECTS) {
    const normalizedEmail = p.email.toLowerCase().trim();

    if (enrolledEmails.has(normalizedEmail)) {
      enrollSkipped++;
      continue;
    }

    await prisma.coldEmailRecipient.create({
      data: {
        campaignId: step1CampaignId,
        email: normalizedEmail,
        name: p.ownerName,
        company: p.businessName,
        vertical: p.vertical,
        city: p.city,
        status: "pending",
        trackingId: crypto.randomUUID(),
      },
    });

    enrolledEmails.add(normalizedEmail);
    enrolled++;
  }

  console.log(
    `  Result: ${enrolled} recipients enrolled, ${enrollSkipped} already enrolled\n`
  );

  // ── Step 4: Update prospect status to "outreach" ─────────────────────
  console.log("Step 4: Marking seeded prospects as 'outreach' status...\n");

  const emails = PROSPECTS.map((p) => p.email.toLowerCase());
  const updateResult = await prisma.prospect.updateMany({
    where: {
      email: { in: emails },
      status: "enriched",
    },
    data: { status: "outreach" },
  });

  console.log(`  Result: ${updateResult.count} prospects marked as 'outreach'\n`);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log("=".repeat(60));
  console.log("\nSEED COMPLETE\n");
  console.log("What was created:");
  console.log(`  - ${created} Prospect records (status: outreach, score: 75)`);
  console.log(`  - ${CAMPAIGN_SEQUENCE.length} ColdOutreachCampaign records`);
  console.log(`    - Email 1 (Intro):            ACTIVE — cron will start sending`);
  console.log(`    - Emails 2-5:                 draft — activate via cron or manually`);
  console.log(`  - ${enrolled} ColdEmailRecipient records (status: pending)`);
  console.log("");
  console.log("Verticals covered:");
  console.log("  HVAC, Plumbing, Roofing, Electrical, Landscaping");
  console.log("");
  console.log("Markets covered:");
  console.log("  Dallas TX, Phoenix AZ, Minneapolis MN, Denver CO, Atlanta GA");
  console.log("  Tampa FL, Charlotte NC, Nashville TN, Austin TX, Houston TX");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Verify campaign data:  npx prisma studio");
  console.log("  2. outreach-send cron will pick up the active campaign");
  console.log("     Schedule: every 15 min, 9am-5pm weekdays (vercel.json)");
  console.log("  3. Warmup: starts at 5 emails/day, ramps +3/day up to 50/day");
  console.log("  4. Activate later steps: npx tsx scripts/activate-new-campaigns.ts");
  console.log("");
  console.log("=".repeat(60));
}

main()
  .catch((error) => {
    console.error("\nSeed script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
