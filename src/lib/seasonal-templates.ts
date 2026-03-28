/**
 * Pre-built seasonal campaign templates for the Customer LTV Engine.
 * These are provisioned automatically based on the client's vertical.
 */

export interface SeasonalCampaignTemplate {
  name: string;
  vertical: string;
  season: string;
  triggerMonth: number;
  subject: string;
  body: string;
  discount: string | null;
}

const SEASONAL_CAMPAIGN_TEMPLATES: SeasonalCampaignTemplate[] = [
  // ─── HVAC ─────────────────────────────────────────────────
  {
    name: "AC Tune-Up Special — Beat the Summer Heat",
    vertical: "hvac",
    season: "spring",
    triggerMonth: 3,
    subject: "Beat the Summer Heat — Book Your AC Tune-Up Today!",
    body: `Hi {{name}},

Summer is just around the corner! Don't wait until your AC breaks down on the hottest day of the year.

{{business}} is offering a special Spring AC Tune-Up to keep your home cool and comfortable all summer long.

Book your tune-up today and get priority scheduling before our calendar fills up!

{{discount}}

Reply to this email or call us to schedule your appointment.

Best,
The {{business}} Team`,
    discount: "$50 off",
  },
  {
    name: "Furnace Check-Up — Stay Warm This Winter",
    vertical: "hvac",
    season: "fall",
    triggerMonth: 9,
    subject: "Stay Warm This Winter — Schedule Your Furnace Check-Up",
    body: `Hi {{name}},

Fall is here, and winter is right behind it. Now is the perfect time to make sure your furnace is ready for the cold months ahead.

{{business}} is offering our annual Furnace Check-Up Special to keep your family warm and safe this winter.

Don't get caught in the cold — schedule your check-up today!

{{discount}}

Reply to this email or call us to book your appointment.

Stay warm,
The {{business}} Team`,
    discount: "$40 off",
  },

  // ─── Plumbing ─────────────────────────────────────────────
  {
    name: "Prevent Frozen Pipes — Winter Plumbing Check",
    vertical: "plumbing",
    season: "winter",
    triggerMonth: 11,
    subject: "Prevent Frozen Pipes This Winter — Free Plumbing Inspection",
    body: `Hi {{name}},

Winter weather can wreak havoc on your plumbing. Frozen pipes can burst and cause thousands of dollars in damage.

{{business}} is offering a Winter Plumbing Safety Check to make sure your pipes are protected before temperatures drop.

Schedule your inspection today and avoid costly emergency repairs!

{{discount}}

Reply to this email or call us to book your appointment.

Best,
The {{business}} Team`,
    discount: "Free inspection",
  },
  {
    name: "Spring Drain Cleaning Special",
    vertical: "plumbing",
    season: "spring",
    triggerMonth: 4,
    subject: "Spring Cleaning for Your Drains — Special Offer Inside!",
    body: `Hi {{name}},

Spring is the perfect time to clear out your drains and prevent clogs before they become a problem.

{{business}} is running our annual Spring Drain Cleaning Special. Keep your plumbing flowing smoothly all year long.

Book now and save!

{{discount}}

Reply to this email or call us to schedule.

Best,
The {{business}} Team`,
    discount: "15% off",
  },

  // ─── Roofing ──────────────────────────────────────────────
  {
    name: "Post-Winter Roof Inspection",
    vertical: "roofing",
    season: "spring",
    triggerMonth: 3,
    subject: "Post-Winter Roof Inspection — Catch Damage Early",
    body: `Hi {{name}},

Winter storms can take a toll on your roof. Small issues like missing shingles or minor leaks can quickly turn into major problems if left unchecked.

{{business}} is offering a Post-Winter Roof Inspection to make sure your home is protected heading into spring.

Schedule your inspection today — catching damage early saves you money!

{{discount}}

Reply to this email or call us to book.

Best,
The {{business}} Team`,
    discount: "Free assessment",
  },
  {
    name: "Storm Season Prep — Free Roof Assessment",
    vertical: "roofing",
    season: "fall",
    triggerMonth: 8,
    subject: "Storm Season Is Coming — Is Your Roof Ready?",
    body: `Hi {{name}},

Storm season will be here before you know it. Is your roof ready to handle heavy rain, wind, and hail?

{{business}} is offering a Free Storm Season Roof Assessment to help you prepare and avoid costly damage.

Don't wait until it's too late — book your assessment today!

{{discount}}

Reply to this email or call us to schedule.

Best,
The {{business}} Team`,
    discount: "Free assessment",
  },

  // ─── Electrical ───────────────────────────────────────────
  {
    name: "Holiday Lighting Safety Check",
    vertical: "electrical",
    season: "winter",
    triggerMonth: 11,
    subject: "Holiday Lighting Safety Check — Keep Your Family Safe",
    body: `Hi {{name}},

The holidays are coming, and that means holiday lights and decorations! Before you plug everything in, make sure your electrical system can handle the extra load.

{{business}} is offering a Holiday Lighting Safety Check to keep your family safe this season.

Schedule your safety check today!

{{discount}}

Reply to this email or call us to book.

Happy Holidays,
The {{business}} Team`,
    discount: "$25 off",
  },
  {
    name: "Generator Readiness Check",
    vertical: "electrical",
    season: "summer",
    triggerMonth: 5,
    subject: "Summer Storm Season — Is Your Generator Ready?",
    body: `Hi {{name}},

Summer storms can knock out power for hours — or even days. Make sure your backup generator is ready when you need it most.

{{business}} is offering a Generator Readiness Check to ensure your home stays powered through any storm.

Schedule your check today and be prepared!

{{discount}}

Reply to this email or call us to book.

Best,
The {{business}} Team`,
    discount: "$35 off",
  },

  // ─── Landscaping ──────────────────────────────────────────
  {
    name: "Spring Cleanup & Mulching Package",
    vertical: "landscaping",
    season: "spring",
    triggerMonth: 3,
    subject: "Spring Cleanup Time — Fresh Mulch & a Beautiful Yard!",
    body: `Hi {{name}},

Spring is here! Time to shake off winter and get your yard looking beautiful again.

{{business}} is offering our Spring Cleanup & Mulching Package to get your property ready for the warm months ahead.

Book early for the best availability!

{{discount}}

Reply to this email or call us to schedule.

Best,
The {{business}} Team`,
    discount: "10% off",
  },
  {
    name: "Fall Leaf Cleanup & Winterizing",
    vertical: "landscaping",
    season: "fall",
    triggerMonth: 10,
    subject: "Fall Cleanup & Winterizing — Protect Your Lawn This Winter",
    body: `Hi {{name}},

Fall leaves are beautiful, but they can smother your lawn if left too long. Now is the perfect time to clean up and prepare your yard for winter.

{{business}} is offering our Fall Cleanup & Winterizing Package to keep your property healthy through the cold months.

Schedule your cleanup today!

{{discount}}

Reply to this email or call us to book.

Best,
The {{business}} Team`,
    discount: "15% off",
  },
];

/**
 * Get seasonal campaign templates for a specific vertical.
 * Falls back to HVAC templates if the vertical has no specific templates.
 */
export function getTemplatesForVertical(
  vertical: string | null | undefined
): SeasonalCampaignTemplate[] {
  const normalizedVertical = (vertical || "").toLowerCase().replace(/[\s-]/g, "");

  const verticalMap: Record<string, string> = {
    hvac: "hvac",
    plumbing: "plumbing",
    roofing: "roofing",
    electrical: "electrical",
    landscaping: "landscaping",
    generalcontractor: "hvac", // fallback to HVAC for general contractors
    other: "hvac",
  };

  const mappedVertical = verticalMap[normalizedVertical] || "hvac";

  return SEASONAL_CAMPAIGN_TEMPLATES.filter(
    (t) => t.vertical === mappedVertical
  );
}
