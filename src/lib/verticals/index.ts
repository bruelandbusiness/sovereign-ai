// =============================================================================
// Vertical Intelligence Database
// =============================================================================
// Structured data for every home-services vertical: ICPs, seasonal calendars,
// metrics, discovery-source priorities, and messaging angles.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerticalKey =
  | "hvac"
  | "roofing"
  | "plumbing"
  | "electrical"
  | "pest_control"
  | "landscaping";

export type MonthKey =
  | "jan"
  | "feb"
  | "mar"
  | "apr"
  | "may"
  | "jun"
  | "jul"
  | "aug"
  | "sep"
  | "oct"
  | "nov"
  | "dec";

export interface SeasonalEntry {
  demand: "low" | "medium" | "rising" | "declining" | "high" | "peak";
  focus: string;
  message: string;
}

export interface VerticalICP {
  propertyAge: string;
  propertyValue: string;
  propertyType: string;
  homeownerStatus: string;
  triggerEvents: string[];
  disqualifiers: string[];
}

export interface VerticalMetrics {
  avgBlendedJob: number;
  jobBreakdown: Record<string, number>;
  typicalCloseRate: number;
  typicalResponseRate: number;
  peakMonths: MonthKey[];
  shoulderMonths?: MonthKey[];
  slowMonths?: MonthKey[];
  systemLifespanYears?: number;
  replacementTriggerAge?: number;
  retentionRate?: number;
}

export interface VerticalMessaging {
  works: string[];
  doesntWork?: string[];
}

export interface VerticalIntelligence {
  key: VerticalKey;
  displayName: string;
  icp: VerticalICP;
  seasonalCalendar: Record<MonthKey, SeasonalEntry>;
  metrics: VerticalMetrics;
  discoverySources: string[];
  messaging: VerticalMessaging;
}

// ---------------------------------------------------------------------------
// Pest Control — Regional Calendar (Arizona)
// ---------------------------------------------------------------------------

export interface PestCalendarEntry {
  pests: string[];
  message: string;
}

export const PEST_CALENDAR_AZ: Record<MonthKey, PestCalendarEntry> = {
  jan: {
    pests: ["rodents", "cockroaches"],
    message: "Winter invaders seeking warmth — rodents and roaches move indoors.",
  },
  feb: {
    pests: ["rodents", "cockroaches", "termites"],
    message: "Early termite swarms begin. Rodent and roach pressure continues.",
  },
  mar: {
    pests: ["termites", "ants", "cockroaches"],
    message: "Spring swarm season — termites and ants emerge as temps rise.",
  },
  apr: {
    pests: ["termites", "ants", "scorpions", "bees"],
    message: "Scorpion season begins. Bee swarms and ant colonies are active.",
  },
  may: {
    pests: ["scorpions", "bees", "ants", "mosquitoes"],
    message: "Peak scorpion activity. Mosquito breeding starts with irrigation.",
  },
  jun: {
    pests: ["scorpions", "mosquitoes", "roaches", "crickets"],
    message: "Extreme heat drives scorpions and roaches indoors. Mosquitoes spike.",
  },
  jul: {
    pests: ["scorpions", "mosquitoes", "roaches", "crickets"],
    message: "Monsoon moisture fuels mosquitoes and crickets. Scorpions peak.",
  },
  aug: {
    pests: ["scorpions", "mosquitoes", "roaches", "spiders"],
    message: "Late monsoon keeps moisture pests active. Spider populations grow.",
  },
  sep: {
    pests: ["scorpions", "spiders", "roaches", "ants"],
    message: "Cooling temps shift pests indoors. Scorpion activity remains high.",
  },
  oct: {
    pests: ["spiders", "roaches", "rodents", "scorpions"],
    message: "Fall migration indoors — rodents, spiders, and roaches seek shelter.",
  },
  nov: {
    pests: ["rodents", "roaches", "spiders"],
    message: "Rodent season peaks. Indoor pest pressure increases with cold snaps.",
  },
  dec: {
    pests: ["rodents", "cockroaches"],
    message: "Winter pest pressure — rodents and roaches are primary indoor invaders.",
  },
};

// ---------------------------------------------------------------------------
// Vertical Data: HVAC
// ---------------------------------------------------------------------------

const hvac: VerticalIntelligence = {
  key: "hvac",
  displayName: "HVAC",
  icp: {
    propertyAge: "15+",
    propertyValue: "$200K+",
    propertyType: "Single Family",
    homeownerStatus: "Owner-Occupied",
    triggerEvents: [
      "System older than 12 years",
      "Recent home purchase",
      "Utility bill spike",
      "Failed inspection",
      "Post-extreme-weather event",
      "Home renovation or addition",
    ],
    disqualifiers: [
      "New construction (< 5 years)",
      "Rental / tenant-occupied",
      "Recently serviced (< 6 months)",
      "Already under contract with competitor",
    ],
  },
  seasonalCalendar: {
    jan: {
      demand: "high",
      focus: "Heating repairs and emergency service",
      message: "Don't let a cold snap leave your family without heat. Schedule a furnace checkup today.",
    },
    feb: {
      demand: "medium",
      focus: "Heating maintenance and early AC planning",
      message: "Winter isn't over yet — make sure your heating system finishes strong. Early bird AC tune-ups save you money.",
    },
    mar: {
      demand: "rising",
      focus: "Spring AC tune-ups and shoulder-season maintenance",
      message: "Spring is here — get ahead of the summer rush with an AC tune-up before everyone else calls.",
    },
    apr: {
      demand: "rising",
      focus: "AC tune-ups and pre-summer inspections",
      message: "Summer heat is coming fast. Book your AC inspection now while appointments are still available.",
    },
    may: {
      demand: "medium",
      focus: "Last-chance tune-ups before peak",
      message: "Last chance for a pre-summer tune-up. Once June hits, wait times double.",
    },
    jun: {
      demand: "peak",
      focus: "AC repairs, installs, emergency service",
      message: "AC breaking down in the heat? We offer same-day emergency service to get you cool fast.",
    },
    jul: {
      demand: "peak",
      focus: "Emergency AC service and replacements",
      message: "Peak heat = peak breakdowns. If your AC is struggling, it may be time for a replacement.",
    },
    aug: {
      demand: "peak",
      focus: "AC repairs, replacements, and pre-fall planning",
      message: "Still sweating it out? Don't wait for a total failure — upgrade to a reliable system now.",
    },
    sep: {
      demand: "declining",
      focus: "Post-summer assessments and heating prep",
      message: "Summer took a toll on your system. Get a post-season checkup and start heating prep.",
    },
    oct: {
      demand: "rising",
      focus: "Heating system tune-ups and furnace inspections",
      message: "Cold weather is around the corner. Schedule your furnace tune-up before the holiday rush.",
    },
    nov: {
      demand: "medium",
      focus: "Heating readiness and holiday scheduling",
      message: "Is your heater ready for Thanksgiving guests? A quick tune-up gives you peace of mind.",
    },
    dec: {
      demand: "high",
      focus: "Heating emergencies and winter installs",
      message: "Furnace failure during the holidays is no joke. We're here 24/7 for emergency heating service.",
    },
  },
  metrics: {
    avgBlendedJob: 2500,
    jobBreakdown: {
      repair: 500,
      tuneup: 150,
      install: 7500,
    },
    typicalCloseRate: 0.25,
    typicalResponseRate: 0.08,
    peakMonths: ["jun", "jul", "aug", "dec", "jan"],
    shoulderMonths: ["mar", "apr", "sep", "oct"],
    slowMonths: ["may", "nov"],
    systemLifespanYears: 15,
    replacementTriggerAge: 12,
  },
  discoverySources: [
    "Building permits (new installs, renovations)",
    "Home sales (new owners with aging systems)",
    "Property age records (systems nearing end-of-life)",
    "Competitor reviews (unhappy customers ready to switch)",
    "Seasonal weather events (heat waves, cold snaps)",
    "Utility data (high usage indicating inefficiency)",
  ],
  messaging: {
    works: [
      "Age-of-system urgency: 'Your system is 14 years old — the average lifespan is 15.'",
      "Energy savings: 'New systems cut energy bills by 30-50%.'",
      "Safety angle: 'Aging furnaces can develop carbon monoxide leaks.'",
      "Comfort framing: 'Stop fighting with hot and cold spots in your home.'",
      "Financing offers: '$0 down, affordable monthly payments available.'",
    ],
    doesntWork: [
      "Generic 'we're the best' claims without proof",
      "Heavy technical jargon (SEER ratings, BTU calculations)",
      "Fear-based messaging without a solution",
      "Discounting without building value first",
    ],
  },
};

// ---------------------------------------------------------------------------
// Vertical Data: Roofing
// ---------------------------------------------------------------------------

const roofing: VerticalIntelligence = {
  key: "roofing",
  displayName: "Roofing",
  icp: {
    propertyAge: "20+",
    propertyValue: "$250K+",
    propertyType: "Single Family",
    homeownerStatus: "Owner-Occupied",
    triggerEvents: [
      "Roof older than 20 years",
      "Recent storm or hail damage",
      "Visible leaks or water staining",
      "Insurance claim filed",
      "Home sale preparation",
      "Neighbor getting new roof (social proof)",
    ],
    disqualifiers: [
      "New roof (< 5 years old)",
      "Rental / tenant-occupied",
      "Already under contract with competitor",
    ],
  },
  seasonalCalendar: {
    jan: {
      demand: "low",
      focus: "Storm damage inspections and emergency repairs",
      message: "Winter storms can hide roof damage. A free inspection now prevents costly leaks in spring.",
    },
    feb: {
      demand: "low",
      focus: "Planning and early spring booking",
      message: "Spring roofing season fills up fast. Lock in your spot now for the best scheduling.",
    },
    mar: {
      demand: "rising",
      focus: "Post-winter inspections and spring scheduling",
      message: "Winter is over — time to check what it left behind. Free roof inspections available this month.",
    },
    apr: {
      demand: "high",
      focus: "Full production — replacements and repairs",
      message: "Prime roofing season is here. Ideal weather means faster installs and better results.",
    },
    may: {
      demand: "peak",
      focus: "Peak production — full crews on replacements",
      message: "Our busiest month — but we've reserved spots for new customers. Book your replacement today.",
    },
    jun: {
      demand: "peak",
      focus: "Peak production continues",
      message: "Long days and clear skies mean we can get your roof done fast. Schedule your free estimate.",
    },
    jul: {
      demand: "high",
      focus: "Storm season repairs and replacements",
      message: "Summer storms cause damage you can't always see. Get a free inspection before it gets worse.",
    },
    aug: {
      demand: "high",
      focus: "Storm repairs and back-to-school installs",
      message: "Get your roof handled before the fall rush. We're booking into September already.",
    },
    sep: {
      demand: "declining",
      focus: "Fall prep and last-chance replacements",
      message: "Last chance for ideal roofing weather. Don't go into winter with a compromised roof.",
    },
    oct: {
      demand: "medium",
      focus: "Winterization and final installs",
      message: "Winter is coming — make sure your roof is ready. Final install slots are filling up.",
    },
    nov: {
      demand: "low",
      focus: "Emergency repairs and off-season planning",
      message: "Off-season pricing available for smart homeowners planning ahead.",
    },
    dec: {
      demand: "low",
      focus: "Emergency-only and next-year planning",
      message: "Planning a roof replacement for next year? Lock in this year's pricing before it goes up.",
    },
  },
  metrics: {
    avgBlendedJob: 5000,
    jobBreakdown: {
      repair: 800,
      replacement: 12000,
    },
    typicalCloseRate: 0.20,
    typicalResponseRate: 0.06,
    peakMonths: ["may", "jun"],
    shoulderMonths: ["apr", "jul", "aug"],
    slowMonths: ["nov", "dec", "jan", "feb"],
    systemLifespanYears: 25,
    replacementTriggerAge: 20,
  },
  discoverySources: [
    "Storm and hail event reports",
    "Property age records (roofs nearing end-of-life)",
    "Insurance claims data",
    "Home sales (inspection-flagged roofs)",
    "Building permits (competitor installs in the area)",
    "Aerial / satellite imagery (visible wear patterns)",
  ],
  messaging: {
    works: [
      "Storm urgency: 'Your area was hit — free inspections for affected homeowners.'",
      "Age-of-roof: 'Asphalt shingles last ~25 years. When was yours installed?'",
      "Insurance assistance: 'We handle the insurance paperwork for you.'",
      "Neighbor social proof: 'We just completed 3 roofs on your street.'",
    ],
    doesntWork: [
      "Storm chasing without local credibility",
      "High-pressure door-knocking tactics",
      "Lowball pricing that undercuts quality perception",
      "Generic brand advertising without specifics",
    ],
  },
};

// ---------------------------------------------------------------------------
// Vertical Data: Plumbing
// ---------------------------------------------------------------------------

const plumbing: VerticalIntelligence = {
  key: "plumbing",
  displayName: "Plumbing",
  icp: {
    propertyAge: "25+",
    propertyValue: "$200K+",
    propertyType: "Single Family",
    homeownerStatus: "Owner-Occupied",
    triggerEvents: [
      "Galvanized or polybutylene pipes (aging infrastructure)",
      "Water heater older than 10 years",
      "Visible water damage or low water pressure",
      "Recent home purchase (inspection findings)",
      "Slab leak or foundation moisture",
      "Remodel or addition requiring new plumbing",
    ],
    disqualifiers: [
      "New construction (< 10 years)",
      "Rental / tenant-occupied",
    ],
  },
  seasonalCalendar: {
    jan: {
      demand: "high",
      focus: "Frozen pipe emergencies and water heater failures",
      message: "Frozen pipes burst without warning. If your water pressure drops, call us immediately.",
    },
    feb: {
      demand: "high",
      focus: "Winter pipe emergencies continue",
      message: "Still in the danger zone for frozen pipes. Protect your home with a plumbing inspection.",
    },
    mar: {
      demand: "rising",
      focus: "Spring thaw leak detection",
      message: "Spring thaw reveals winter damage. Check for hidden leaks before they become big problems.",
    },
    apr: {
      demand: "medium",
      focus: "Spring maintenance and water heater checks",
      message: "Spring cleaning? Add your plumbing to the list. Water heater flushes extend life by years.",
    },
    may: {
      demand: "medium",
      focus: "Pre-summer prep and outdoor plumbing",
      message: "Get your outdoor faucets and sprinkler systems ready for summer.",
    },
    jun: {
      demand: "rising",
      focus: "Water heater demand and summer remodels",
      message: "Summer remodel season is here. Upgrade your plumbing while the walls are open.",
    },
    jul: {
      demand: "high",
      focus: "Peak usage — sewer line and drain issues",
      message: "More guests, more showers, more strain on your plumbing. Don't let a backup ruin your summer.",
    },
    aug: {
      demand: "high",
      focus: "Drain cleaning and back-to-school prep",
      message: "Heavy summer use takes a toll. Schedule a drain cleaning before school routines ramp up.",
    },
    sep: {
      demand: "medium",
      focus: "Fall maintenance and winterization prep",
      message: "Fall is the smart time to winterize your plumbing. A little prevention saves thousands.",
    },
    oct: {
      demand: "rising",
      focus: "Winterization and water heater season",
      message: "Water heaters work harder in cold weather. Is yours ready? Schedule an inspection.",
    },
    nov: {
      demand: "high",
      focus: "Holiday prep and water heater emergencies",
      message: "Thanksgiving guests mean extra demand on your plumbing. Make sure it's ready.",
    },
    dec: {
      demand: "high",
      focus: "Emergency service and freeze prevention",
      message: "Holiday plumbing emergencies happen. We're available 24/7 to keep your home running.",
    },
  },
  metrics: {
    avgBlendedJob: 1800,
    jobBreakdown: {
      repair: 400,
      water_heater: 1500,
      repipe: 8000,
    },
    typicalCloseRate: 0.30,
    typicalResponseRate: 0.07,
    peakMonths: ["jan", "feb", "jul", "aug", "nov", "dec"],
    shoulderMonths: ["mar", "jun", "oct"],
    slowMonths: ["apr", "may", "sep"],
    systemLifespanYears: 10,
    replacementTriggerAge: 10,
  },
  discoverySources: [
    "Building permits (remodels requiring plumbing work)",
    "Home sales (inspection findings on aging pipes)",
    "Property age records (galvanized pipe era: pre-1970)",
    "Competitor reviews (slow response, overpriced repairs)",
    "Water utility data (high usage, possible leaks)",
    "Insurance claims (water damage incidents)",
  ],
  messaging: {
    works: [
      "Emergency urgency: 'Water damage costs $10K+ on average. Fast response prevents disaster.'",
      "Pipe age awareness: 'Homes built before 1970 likely have galvanized pipes that are failing.'",
      "Water heater replacement: 'Your water heater lasts ~10 years. When was yours installed?'",
      "Health and safety: 'Old pipes can leach lead and other contaminants into your water.'",
    ],
    doesntWork: [
      "Vague 'we do it all' messaging",
      "Heavy discounting without value context",
      "Technical plumbing jargon without explanation",
      "Fear-based messaging without actionable next steps",
    ],
  },
};

// ---------------------------------------------------------------------------
// Vertical Data: Electrical
// ---------------------------------------------------------------------------

const electrical: VerticalIntelligence = {
  key: "electrical",
  displayName: "Electrical",
  icp: {
    propertyAge: "30+",
    propertyValue: "$200K+",
    propertyType: "Single Family",
    homeownerStatus: "Owner-Occupied",
    triggerEvents: [
      "Panel older than 30 years or Federal Pacific / Zinsco brand",
      "Frequent breaker trips or flickering lights",
      "EV charger installation needed",
      "Home addition or remodel",
      "Solar panel installation or battery backup",
      "Home sale inspection findings",
      "Insurance requirement for panel upgrade",
    ],
    disqualifiers: [
      "New construction (< 10 years)",
      "Rental / tenant-occupied",
    ],
  },
  seasonalCalendar: {
    jan: {
      demand: "medium",
      focus: "Indoor electrical projects and panel upgrades",
      message: "Winter is perfect for indoor electrical upgrades. Modernize your panel before spring.",
    },
    feb: {
      demand: "medium",
      focus: "Pre-spring planning and EV charger installs",
      message: "New EV? Get your home charger installed before spring road trip season.",
    },
    mar: {
      demand: "rising",
      focus: "Spring remodel season electrical work",
      message: "Spring remodel? Make sure your electrical system can handle the upgrades.",
    },
    apr: {
      demand: "high",
      focus: "Remodel electrical, outdoor lighting, panels",
      message: "Remodel season is in full swing. Panel upgrades and outdoor lighting are our specialty.",
    },
    may: {
      demand: "high",
      focus: "Outdoor projects, landscape lighting, pool wiring",
      message: "Get your outdoor living space wired up — landscape lighting, pool pumps, and more.",
    },
    jun: {
      demand: "peak",
      focus: "Peak demand — all project types",
      message: "Our busiest month. Book now to secure your spot for summer electrical projects.",
    },
    jul: {
      demand: "peak",
      focus: "Peak demand continues — AC electrical, panels",
      message: "AC overloading your panel? A panel upgrade prevents dangerous overloads and outages.",
    },
    aug: {
      demand: "high",
      focus: "Back-to-school and pre-fall projects",
      message: "Wrap up summer projects before fall. Panel upgrades and EV chargers are in high demand.",
    },
    sep: {
      demand: "declining",
      focus: "Fall prep and generator installs",
      message: "Storm season is coming. Whole-home generators keep your family safe and comfortable.",
    },
    oct: {
      demand: "medium",
      focus: "Generator season and holiday lighting prep",
      message: "Before you hang holiday lights, make sure your outdoor circuits can handle the load.",
    },
    nov: {
      demand: "medium",
      focus: "Holiday lighting and indoor projects",
      message: "Holiday lighting overloading your circuits? We install dedicated outdoor outlets safely.",
    },
    dec: {
      demand: "low",
      focus: "Emergency service and new-year planning",
      message: "Flickering lights during holiday gatherings? We offer 24/7 emergency electrical service.",
    },
  },
  metrics: {
    avgBlendedJob: 2000,
    jobBreakdown: {
      repair: 350,
      panel_upgrade: 2500,
      ev_charger: 1500,
      rewire: 10000,
    },
    typicalCloseRate: 0.25,
    typicalResponseRate: 0.06,
    peakMonths: ["jun", "jul"],
    shoulderMonths: ["apr", "may", "aug"],
    slowMonths: ["dec", "jan", "feb"],
  },
  discoverySources: [
    "Building permits (remodels, additions, solar installs)",
    "Home sales (inspection findings on older panels)",
    "Property age records (homes with original wiring)",
    "EV registration data (new EV owners needing chargers)",
    "Solar installer partnerships (panel upgrade referrals)",
    "Insurance requirements (panel upgrade mandates)",
  ],
  messaging: {
    works: [
      "Safety urgency: 'Federal Pacific and Zinsco panels are fire hazards still in thousands of homes.'",
      "EV readiness: 'Charge your EV at home — fast, safe, and installed by licensed electricians.'",
      "Code compliance: 'Older homes often don't meet current electrical code. We bring you up to date.'",
      "Modernization: 'Your 1970s panel wasn't designed for today's electrical demands.'",
    ],
    doesntWork: [
      "Overly technical code references without context",
      "Generic 'licensed and insured' without differentiators",
      "Fear-based messaging without solutions",
      "Pricing focus without value explanation",
    ],
  },
};

// ---------------------------------------------------------------------------
// Vertical Data: Pest Control
// ---------------------------------------------------------------------------

const pest_control: VerticalIntelligence = {
  key: "pest_control",
  displayName: "Pest Control",
  icp: {
    propertyAge: "Any",
    propertyValue: "$150K+",
    propertyType: "Single Family",
    homeownerStatus: "Owner-Occupied",
    triggerEvents: [
      "Visible pest activity (scorpions, roaches, ants, rodents)",
      "Recent move to area (unfamiliar with local pests)",
      "Neighbor pest treatment (displacement effect)",
      "Seasonal pest emergence (spring/monsoon)",
      "Home purchase (new homeowner proactive protection)",
      "Previous pest control contract lapse",
    ],
    disqualifiers: [
      "Already under annual pest contract",
      "New construction with builder pest warranty",
    ],
  },
  seasonalCalendar: {
    jan: {
      demand: "low",
      focus: "Rodent control and indoor pest management",
      message: "Rodents seek warmth in winter. Seal your home and schedule a rodent inspection.",
    },
    feb: {
      demand: "low",
      focus: "Early termite awareness and pre-spring prep",
      message: "Termite swarm season is weeks away. Early inspections catch problems before they spread.",
    },
    mar: {
      demand: "rising",
      focus: "Termite swarms and ant emergence",
      message: "Spring is here and so are the bugs. Termites, ants, and roaches are on the move.",
    },
    apr: {
      demand: "high",
      focus: "Scorpion season begins, bee swarms, full pest activity",
      message: "Scorpion season is here. Protect your family with a professional barrier treatment.",
    },
    may: {
      demand: "peak",
      focus: "Peak scorpion, mosquito breeding, full service demand",
      message: "Peak pest season — scorpions, mosquitoes, and ants are everywhere. Don't wait to treat.",
    },
    jun: {
      demand: "peak",
      focus: "Extreme heat drives pests indoors — full emergency demand",
      message: "Triple-digit heat pushes scorpions and roaches inside. We provide same-day treatment.",
    },
    jul: {
      demand: "peak",
      focus: "Monsoon pest surge — mosquitoes, crickets, scorpions",
      message: "Monsoon moisture means mosquitoes and crickets explode. Stay ahead with monthly service.",
    },
    aug: {
      demand: "high",
      focus: "Late monsoon pests and spider season",
      message: "Monsoon pests are still active and spider populations are growing. Keep your home protected.",
    },
    sep: {
      demand: "declining",
      focus: "Transition pests — scorpions moving indoors for winter",
      message: "Cooling temps push pests indoors. Fall barrier treatments keep them out all winter.",
    },
    oct: {
      demand: "medium",
      focus: "Fall indoor migration — rodents, spiders, roaches",
      message: "Rodents, spiders, and roaches are moving inside for winter. Block them with fall treatment.",
    },
    nov: {
      demand: "low",
      focus: "Rodent season and annual plan renewals",
      message: "Rodent season is peaking. Protect your home and lock in next year's annual plan pricing.",
    },
    dec: {
      demand: "low",
      focus: "Indoor pest control and annual plan sales",
      message: "End the year pest-free. Annual plans start as low as $50/month for year-round protection.",
    },
  },
  metrics: {
    avgBlendedJob: 300,
    jobBreakdown: {
      one_time: 250,
      monthly_service: 50,
      annual_plan: 600,
    },
    typicalCloseRate: 0.35,
    typicalResponseRate: 0.10,
    peakMonths: ["may", "jun", "jul"],
    shoulderMonths: ["apr", "aug", "sep"],
    slowMonths: ["nov", "dec", "jan", "feb"],
    retentionRate: 0.80,
  },
  discoverySources: [
    "Seasonal pest emergence patterns (regional calendars)",
    "Home sales (new homeowners unfamiliar with local pests)",
    "Neighbor treatment displacement (adjacent properties)",
    "Competitor reviews (missed treatments, poor communication)",
    "Property age records (older homes with more entry points)",
    "HOA and community pest reports",
  ],
  messaging: {
    works: [
      "Local pest knowledge: 'Arizona scorpion season runs April-October. Are you protected?'",
      "Family safety: 'Keep your kids and pets safe from scorpion stings and rodent contamination.'",
      "Convenience of recurring plans: 'Monthly service means you never have to think about pests.'",
      "Neighbor effect: 'When your neighbor treats, pests move to the nearest untreated home — yours.'",
    ],
    doesntWork: [
      "Generic 'bug-free guarantee' without specifics",
      "Overemphasis on chemicals (eco-conscious backlash)",
      "One-time-only positioning (misses recurring revenue opportunity)",
      "National-brand messaging that ignores regional pest realities",
    ],
  },
};

// ---------------------------------------------------------------------------
// Vertical Data: Landscaping
// ---------------------------------------------------------------------------

const landscaping: VerticalIntelligence = {
  key: "landscaping",
  displayName: "Landscaping",
  icp: {
    propertyAge: "Any",
    propertyValue: "$300K+",
    propertyType: "Single Family",
    homeownerStatus: "Owner-Occupied",
    triggerEvents: [
      "Recent home purchase (curb appeal upgrade)",
      "Home sale preparation (staging the exterior)",
      "HOA violation or notice",
      "Outdoor living trend (patio, fire pit, kitchen)",
      "Water conservation mandate (xeriscape conversion)",
      "Neighbor landscape upgrade (keeping up with the Joneses)",
    ],
    disqualifiers: [
      "Rental / tenant-occupied",
      "Vacant property",
      "Already under long-term landscape maintenance contract",
    ],
  },
  seasonalCalendar: {
    jan: {
      demand: "low",
      focus: "Dormant pruning and planning for spring",
      message: "Winter is the best time to plan your dream landscape. Design consultations are available now.",
    },
    feb: {
      demand: "low",
      focus: "Pre-spring prep and early bookings",
      message: "Spring planting season fills up fast. Book your landscape project now for March/April start.",
    },
    mar: {
      demand: "rising",
      focus: "Spring planting and cleanup begins",
      message: "Spring is here — time for fresh mulch, new plantings, and lawn renovation.",
    },
    apr: {
      demand: "high",
      focus: "Full spring production — planting, sod, hardscape",
      message: "Peak planting season is here. Transform your yard with new sod, plants, and hardscaping.",
    },
    may: {
      demand: "peak",
      focus: "Peak production — all project types",
      message: "Our busiest month. Get your outdoor living space ready for summer entertaining.",
    },
    jun: {
      demand: "peak",
      focus: "Outdoor living projects and maintenance ramp",
      message: "Long summer days are perfect for outdoor living projects. Patios, fire pits, and more.",
    },
    jul: {
      demand: "high",
      focus: "Maintenance focus and irrigation management",
      message: "Summer heat stresses your landscape. Proper irrigation management keeps it thriving.",
    },
    aug: {
      demand: "high",
      focus: "Irrigation, heat stress management, fall prep",
      message: "August heat is tough on lawns. Let us manage your irrigation and prep for fall renovation.",
    },
    sep: {
      demand: "declining",
      focus: "Fall renovation and overseeding",
      message: "Fall is the #1 time to overseed, fertilize, and renovate your lawn for next spring.",
    },
    oct: {
      demand: "medium",
      focus: "Fall planting and leaf cleanup",
      message: "Fall planting establishes strong roots. Plus, leaf cleanup keeps your property pristine.",
    },
    nov: {
      demand: "low",
      focus: "Leaf cleanup, winterization, annual contracts",
      message: "Wrapping up the season. Lock in your annual maintenance contract for next year's savings.",
    },
    dec: {
      demand: "low",
      focus: "Holiday lighting and dormant season planning",
      message: "Holiday lighting services available. Plus, plan your spring landscape project at winter prices.",
    },
  },
  metrics: {
    avgBlendedJob: 2500,
    jobBreakdown: {
      maintenance_monthly: 200,
      design_install: 8000,
    },
    typicalCloseRate: 0.20,
    typicalResponseRate: 0.05,
    peakMonths: ["may", "jun"],
    shoulderMonths: ["apr", "jul", "aug"],
    slowMonths: ["nov", "dec", "jan", "feb"],
    retentionRate: 0.70,
  },
  discoverySources: [
    "Home sales (new owners improving curb appeal)",
    "HOA violations and community standards notices",
    "Competitor reviews (unreliable service, poor quality)",
    "Seasonal patterns (spring planting, fall renovation)",
    "Property value trends (higher-value homes invest more)",
    "Social media / Nextdoor (neighbor recommendations)",
  ],
  messaging: {
    works: [
      "Curb appeal ROI: 'Professional landscaping adds 10-15% to your home's value.'",
      "Outdoor living lifestyle: 'Create your backyard oasis — patios, fire pits, and outdoor kitchens.'",
      "Water savings: 'Xeriscape conversions cut water bills by 50-75%.'",
      "Convenience: 'Weekly maintenance means you enjoy your yard without the work.'",
    ],
    doesntWork: [
      "Low-price-only positioning (attracts price shoppers, not quality clients)",
      "Generic 'mow and blow' messaging for design/build clients",
      "Ignoring seasonal relevance in messaging",
      "No portfolio or visual proof of work",
    ],
  },
};

// ---------------------------------------------------------------------------
// Master Vertical Record
// ---------------------------------------------------------------------------

export const VERTICALS: Record<VerticalKey, VerticalIntelligence> = {
  hvac,
  roofing,
  plumbing,
  electrical,
  pest_control,
  landscaping,
};

// ---------------------------------------------------------------------------
// Helper: Month key from current date
// ---------------------------------------------------------------------------

const MONTH_KEYS: MonthKey[] = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function currentMonthKey(): MonthKey {
  return MONTH_KEYS[new Date().getMonth()];
}

// ---------------------------------------------------------------------------
// Exported Helper Functions
// ---------------------------------------------------------------------------

/**
 * Retrieve full vertical intelligence by key.
 */
export function getVertical(key: VerticalKey): VerticalIntelligence {
  const vertical = VERTICALS[key];
  if (!vertical) {
    throw new Error(`Unknown vertical key: ${key}`);
  }
  return vertical;
}

/**
 * Get the seasonal entry for the current calendar month.
 */
export function getCurrentSeasonalEntry(key: VerticalKey): SeasonalEntry {
  const vertical = getVertical(key);
  return vertical.seasonalCalendar[currentMonthKey()];
}

/**
 * Check whether the vertical is currently in its peak season.
 */
export function isInPeakSeason(key: VerticalKey): boolean {
  const vertical = getVertical(key);
  const month = currentMonthKey();
  return vertical.metrics.peakMonths.includes(month);
}

/**
 * Get the seasonal entry for a specific month.
 */
export function getVerticalByMonth(
  key: VerticalKey,
  month: MonthKey,
): SeasonalEntry {
  const vertical = getVertical(key);
  return vertical.seasonalCalendar[month];
}
