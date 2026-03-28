/**
 * Sovereign AI — LinkedIn Post Generator
 *
 * Generates 5 ready-to-publish LinkedIn posts using the Sovereign AI
 * content template system. Output is printed to stdout for copy-pasting
 * directly into LinkedIn.
 *
 * Usage: npx tsx scripts/generate-linkedin-posts.ts
 */

import { generatePost } from "../src/lib/content/templates";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEPARATOR = "\n" + "=".repeat(72) + "\n";

function printPost(label: string, content: string): void {
  console.log(SEPARATOR);
  console.log(`POST ${label}`);
  console.log("-".repeat(72));
  console.log(content);
}

// ---------------------------------------------------------------------------
// Post 1 — System in Action
// ---------------------------------------------------------------------------

const systemInAction = generatePost("system_in_action", {
  vertical: "HVAC",
  city: "Minneapolis",
  leadCount: 847,
  timeframe: "48 hours",
  sources: [
    {
      name: "Property Records",
      count: 312,
      trigger: "systems 15+ years old",
    },
    {
      name: "Permit Data",
      count: 189,
      trigger: "recent remodels needing HVAC",
    },
    {
      name: "Google Searches",
      count: 346,
      trigger: "searching 'AC repair near me'",
    },
  ],
});

printPost("1 of 5 — System in Action (LinkedIn · Monday)", systemInAction);

// ---------------------------------------------------------------------------
// Post 2 — Client Win
// ---------------------------------------------------------------------------

const clientWin = generatePost("client_win", {
  clientType: "Plumbing company",
  city: "Austin, TX",
  week1Leads: 156,
  week2Leads: 89,
  week2Replies: 34,
  week3Appointments: 18,
  week4Jobs: 11,
  revenue: 47500,
  monthlyCost: 3497,
});

printPost("2 of 5 — Client Win (LinkedIn · Friday)", clientWin);

// ---------------------------------------------------------------------------
// Post 3 — Educational Tip
// ---------------------------------------------------------------------------

const educationalTip = generatePost("educational_tip", {
  vertical: "Roofing",
  lostAmount: 180000,
  mistake: "Relying on word-of-mouth and HomeAdvisor for 90% of their leads",
  rootCause:
    "No owned lead generation system — you're renting someone else's audience",
  fixSteps: [
    "Build an AI-powered website that captures and qualifies leads 24/7",
    "Set up automated review requests after every job",
    "Deploy AI outreach to homeowners with aging roofs in your service area",
    "Add an AI phone agent so you never miss a call again",
  ],
  seasonalTrigger: "Spring storm season",
});

printPost("3 of 5 — Educational Tip (LinkedIn · Wednesday)", educationalTip);

// ---------------------------------------------------------------------------
// Post 4 — Contrarian Take
// ---------------------------------------------------------------------------

const contrarianTake = generatePost("contrarian_take", {
  contrarianStatement: "Stop buying leads from HomeAdvisor.",
  explanation:
    "Every lead you buy is shared with 3-5 other contractors. You're in a bidding war before you even pick up the phone. And the platform keeps raising prices because they can.",
  vertical: "home service",
  commonBehavior: "spend $500-2,000/month on shared leads they don't own",
  differentBehavior:
    "build AI systems that find exclusive leads directly — homeowners who need your service right now, before they ever hit a lead marketplace",
  proofPoint:
    "One HVAC company switched from HomeAdvisor to our AI system. Same monthly spend. 3x more jobs closed. Zero shared leads.",
  reframe: "Own your leads. Own your pipeline. Own your future.",
});

printPost("4 of 5 — Contrarian Take (LinkedIn)", contrarianTake);

// ---------------------------------------------------------------------------
// Post 5 — Behind the Build (most impactful tweet as standalone LinkedIn post)
// ---------------------------------------------------------------------------

const behindTheBuildTweets = generatePost("behind_the_build", {
  service: "HVAC repair",
  sourceCount: 47,
  scoringSignals: 23,
  vertical: "HVAC",
});

// Tweet 2 (index 1) is the most impactful for a standalone LinkedIn post:
// it immediately demonstrates concrete scale (47 data sources) and reframes
// what the system does — "discovery, not scraping" — which is the hook that
// makes a cold reader stop scrolling.
const behindTheBuildLinkedIn = behindTheBuildTweets[1];

printPost(
  "5 of 5 — Behind the Build · Standalone LinkedIn Post (adapted from thread tweet 2)",
  behindTheBuildLinkedIn,
);

console.log(SEPARATOR);
console.log("Done. 5 posts printed above — copy and paste each into LinkedIn.");
console.log(SEPARATOR);
