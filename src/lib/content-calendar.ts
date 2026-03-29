/**
 * Content Calendar Generation Utility for Home Service Businesses.
 *
 * Provides functions to generate monthly content calendars, suggest
 * trade-specific content ideas, calculate optimal posting schedules,
 * and plan around upcoming holidays. Pure utility — no database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type ContentType =
  | "blog"
  | "social_media"
  | "email"
  | "video"
  | "infographic"
  | "case_study"
  | "testimonial";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived";

export type ContentTheme =
  | "spring_home_maintenance"
  | "summer_hvac_prep"
  | "fall_weatherization"
  | "winter_emergency_prep"
  | "holiday_promotions"
  | "tax_season"
  | "back_to_school"
  | "new_year_planning"
  | "customer_appreciation"
  | "safety_awareness"
  | "diy_tips"
  | "industry_news";

export type Trade =
  | "hvac"
  | "plumbing"
  | "electrical"
  | "roofing"
  | "landscaping"
  | "pest_control"
  | "painting"
  | "general_contractor";

export type Platform =
  | "facebook"
  | "instagram"
  | "google"
  | "email";

export interface ContentPost {
  readonly id: string;
  readonly title: string;
  readonly contentType: ContentType;
  readonly theme: ContentTheme;
  readonly scheduledDate: string;
  readonly status: PostStatus;
  readonly platform: Platform;
  readonly description: string;
  readonly tags: readonly string[];
}

export interface ContentCalendar {
  readonly month: number;
  readonly year: number;
  readonly trade: Trade;
  readonly posts: readonly ContentPost[];
  readonly generatedAt: string;
}

export interface PostTimeSlot {
  readonly platform: Platform;
  readonly dayOfWeek: string;
  readonly timeUtc: string;
  readonly engagementScore: number;
}

export interface ContentMix {
  readonly contentType: ContentType;
  readonly percentage: number;
  readonly postsPerMonth: number;
}

export interface Holiday {
  readonly name: string;
  readonly date: string;
  readonly contentIdeas: readonly string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const CONTENT_THEMES: ReadonlyArray<{
  readonly id: ContentTheme;
  readonly label: string;
  readonly description: string;
  readonly peakMonths: readonly number[];
}> = [
  {
    id: "spring_home_maintenance",
    label: "Spring Home Maintenance",
    description:
      "Tips for spring cleaning, HVAC tune-ups, gutter cleaning, and seasonal inspections.",
    peakMonths: [3, 4, 5],
  },
  {
    id: "summer_hvac_prep",
    label: "Summer HVAC Prep",
    description:
      "AC maintenance, energy efficiency tips, and beating the heat.",
    peakMonths: [5, 6, 7],
  },
  {
    id: "fall_weatherization",
    label: "Fall Weatherization",
    description:
      "Preparing homes for cold weather: insulation, heating checks, and draft sealing.",
    peakMonths: [9, 10, 11],
  },
  {
    id: "winter_emergency_prep",
    label: "Winter Emergency Prep",
    description:
      "Frozen pipe prevention, generator safety, and emergency heating tips.",
    peakMonths: [11, 12, 1],
  },
  {
    id: "holiday_promotions",
    label: "Holiday Promotions",
    description:
      "Seasonal deals, gift certificates, and holiday scheduling reminders.",
    peakMonths: [11, 12],
  },
  {
    id: "tax_season",
    label: "Tax Season",
    description:
      "Energy-efficient upgrade deductions, home office improvements, and tax credit reminders.",
    peakMonths: [1, 2, 3, 4],
  },
  {
    id: "back_to_school",
    label: "Back-to-School",
    description:
      "Safety inspections, electrical checks for home offices, and indoor air quality.",
    peakMonths: [8, 9],
  },
  {
    id: "new_year_planning",
    label: "New Year Planning",
    description:
      "Home improvement resolutions, maintenance schedules, and budget planning.",
    peakMonths: [1, 2],
  },
  {
    id: "customer_appreciation",
    label: "Customer Appreciation",
    description:
      "Referral programs, loyalty rewards, reviews and testimonials spotlights.",
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: "safety_awareness",
    label: "Safety Awareness",
    description:
      "Carbon monoxide awareness, electrical safety, fire prevention, and water safety.",
    peakMonths: [1, 5, 6, 10],
  },
  {
    id: "diy_tips",
    label: "DIY Tips",
    description:
      "Simple homeowner maintenance tips that build trust and demonstrate expertise.",
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: "industry_news",
    label: "Industry News",
    description:
      "New regulations, technology updates, product recalls, and industry trends.",
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Trade-specific content ideas                                       */
/* ------------------------------------------------------------------ */

const TRADE_CONTENT_IDEAS: Readonly<
  Record<Trade, readonly { readonly title: string; readonly type: ContentType; readonly theme: ContentTheme }[]>
> = {
  hvac: [
    { title: "5 Signs Your AC Needs Replacement", type: "blog", theme: "summer_hvac_prep" },
    { title: "How to Change Your Air Filter in 5 Minutes", type: "video", theme: "diy_tips" },
    { title: "Energy Savings From a New Heat Pump", type: "infographic", theme: "fall_weatherization" },
    { title: "Customer Story: Emergency Furnace Repair", type: "case_study", theme: "winter_emergency_prep" },
    { title: "Spring AC Tune-Up Checklist", type: "social_media", theme: "spring_home_maintenance" },
    { title: "HVAC Tax Credits You Might Be Missing", type: "email", theme: "tax_season" },
    { title: "What Our Customers Are Saying", type: "testimonial", theme: "customer_appreciation" },
    { title: "New Refrigerant Regulations Explained", type: "blog", theme: "industry_news" },
  ],
  plumbing: [
    { title: "How to Prevent Frozen Pipes This Winter", type: "blog", theme: "winter_emergency_prep" },
    { title: "DIY: Unclogging a Drain Safely", type: "video", theme: "diy_tips" },
    { title: "Water Usage Comparison Infographic", type: "infographic", theme: "safety_awareness" },
    { title: "Whole-Home Repiping Success Story", type: "case_study", theme: "customer_appreciation" },
    { title: "Spring Sprinkler System Startup Tips", type: "social_media", theme: "spring_home_maintenance" },
    { title: "Water Heater Maintenance Checklist", type: "email", theme: "fall_weatherization" },
    { title: "Our Plumber Saved the Day — Customer Review", type: "testimonial", theme: "customer_appreciation" },
    { title: "Lead Pipe Replacement Programs in Your Area", type: "blog", theme: "industry_news" },
  ],
  electrical: [
    { title: "Signs of Outdated Wiring in Older Homes", type: "blog", theme: "safety_awareness" },
    { title: "How to Reset a Tripped Breaker", type: "video", theme: "diy_tips" },
    { title: "Home Electrical Safety Checklist", type: "infographic", theme: "safety_awareness" },
    { title: "Whole-Home Generator Installation Story", type: "case_study", theme: "winter_emergency_prep" },
    { title: "Holiday Lighting Safety Tips", type: "social_media", theme: "holiday_promotions" },
    { title: "EV Charger Installation Guide", type: "email", theme: "industry_news" },
    { title: "Panel Upgrade Testimonial", type: "testimonial", theme: "customer_appreciation" },
    { title: "New NEC Code Changes for Homeowners", type: "blog", theme: "industry_news" },
  ],
  roofing: [
    { title: "Storm Damage: What to Check After Severe Weather", type: "blog", theme: "spring_home_maintenance" },
    { title: "How to Spot Missing Shingles From the Ground", type: "video", theme: "diy_tips" },
    { title: "Roof Lifespan by Material Type", type: "infographic", theme: "industry_news" },
    { title: "Insurance Claim Roof Replacement Story", type: "case_study", theme: "customer_appreciation" },
    { title: "Fall Gutter Cleaning Reminder", type: "social_media", theme: "fall_weatherization" },
    { title: "Ice Dam Prevention for Winter", type: "email", theme: "winter_emergency_prep" },
    { title: "New Roof Testimonial and Photos", type: "testimonial", theme: "customer_appreciation" },
    { title: "Metal Roofing vs Asphalt Shingles", type: "blog", theme: "industry_news" },
  ],
  landscaping: [
    { title: "Spring Lawn Care Schedule Week by Week", type: "blog", theme: "spring_home_maintenance" },
    { title: "How to Edge Your Lawn Like a Pro", type: "video", theme: "diy_tips" },
    { title: "Water-Saving Landscaping Ideas", type: "infographic", theme: "summer_hvac_prep" },
    { title: "Backyard Transformation Before and After", type: "case_study", theme: "customer_appreciation" },
    { title: "Fall Leaf Cleanup Tips", type: "social_media", theme: "fall_weatherization" },
    { title: "Winter Lawn Protection Guide", type: "email", theme: "winter_emergency_prep" },
    { title: "Happy Customer Patio Reveal", type: "testimonial", theme: "customer_appreciation" },
    { title: "Drought-Resistant Plants Trending This Year", type: "blog", theme: "industry_news" },
  ],
  pest_control: [
    { title: "Spring Pest Prevention Checklist", type: "blog", theme: "spring_home_maintenance" },
    { title: "How to Seal Entry Points Against Mice", type: "video", theme: "diy_tips" },
    { title: "Common Household Pests by Season", type: "infographic", theme: "safety_awareness" },
    { title: "Termite Treatment Success Story", type: "case_study", theme: "customer_appreciation" },
    { title: "Mosquito Season Is Here — Protect Your Yard", type: "social_media", theme: "summer_hvac_prep" },
    { title: "Fall Rodent-Proofing Your Home", type: "email", theme: "fall_weatherization" },
    { title: "Pest-Free Home Testimonial", type: "testimonial", theme: "customer_appreciation" },
    { title: "EPA Updates on Pest Control Products", type: "blog", theme: "industry_news" },
  ],
  painting: [
    { title: "How to Choose Exterior Paint Colors", type: "blog", theme: "spring_home_maintenance" },
    { title: "DIY Touch-Up Painting Techniques", type: "video", theme: "diy_tips" },
    { title: "Paint Finish Guide: Matte vs Satin vs Gloss", type: "infographic", theme: "diy_tips" },
    { title: "Commercial Painting Project Showcase", type: "case_study", theme: "customer_appreciation" },
    { title: "Best Time of Year to Paint Your Home Exterior", type: "social_media", theme: "summer_hvac_prep" },
    { title: "Interior Painting Prep Guide for Winter Projects", type: "email", theme: "winter_emergency_prep" },
    { title: "Kitchen Cabinet Painting Testimonial", type: "testimonial", theme: "customer_appreciation" },
    { title: "Low-VOC Paint Options for Health-Conscious Homeowners", type: "blog", theme: "industry_news" },
  ],
  general_contractor: [
    { title: "Home Renovation Planning Guide", type: "blog", theme: "new_year_planning" },
    { title: "How to Interview a Contractor", type: "video", theme: "diy_tips" },
    { title: "Renovation Cost Breakdown by Room", type: "infographic", theme: "tax_season" },
    { title: "Kitchen Remodel Before and After", type: "case_study", theme: "customer_appreciation" },
    { title: "Building Permit Tips for Homeowners", type: "social_media", theme: "industry_news" },
    { title: "Plan Your Spring Remodel Now", type: "email", theme: "new_year_planning" },
    { title: "Bathroom Renovation Success Story", type: "testimonial", theme: "customer_appreciation" },
    { title: "New Building Code Updates for Your Area", type: "blog", theme: "industry_news" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Optimal posting times by platform                                  */
/* ------------------------------------------------------------------ */

const OPTIMAL_POST_TIMES: readonly PostTimeSlot[] = [
  // Facebook
  { platform: "facebook", dayOfWeek: "Monday", timeUtc: "14:00", engagementScore: 72 },
  { platform: "facebook", dayOfWeek: "Tuesday", timeUtc: "10:00", engagementScore: 78 },
  { platform: "facebook", dayOfWeek: "Wednesday", timeUtc: "12:00", engagementScore: 85 },
  { platform: "facebook", dayOfWeek: "Thursday", timeUtc: "14:00", engagementScore: 80 },
  { platform: "facebook", dayOfWeek: "Friday", timeUtc: "09:00", engagementScore: 68 },
  { platform: "facebook", dayOfWeek: "Saturday", timeUtc: "11:00", engagementScore: 60 },
  { platform: "facebook", dayOfWeek: "Sunday", timeUtc: "10:00", engagementScore: 55 },
  // Instagram
  { platform: "instagram", dayOfWeek: "Monday", timeUtc: "11:00", engagementScore: 74 },
  { platform: "instagram", dayOfWeek: "Tuesday", timeUtc: "14:00", engagementScore: 82 },
  { platform: "instagram", dayOfWeek: "Wednesday", timeUtc: "11:00", engagementScore: 88 },
  { platform: "instagram", dayOfWeek: "Thursday", timeUtc: "12:00", engagementScore: 79 },
  { platform: "instagram", dayOfWeek: "Friday", timeUtc: "10:00", engagementScore: 70 },
  { platform: "instagram", dayOfWeek: "Saturday", timeUtc: "09:00", engagementScore: 65 },
  { platform: "instagram", dayOfWeek: "Sunday", timeUtc: "17:00", engagementScore: 58 },
  // Google (Google Business Profile)
  { platform: "google", dayOfWeek: "Monday", timeUtc: "09:00", engagementScore: 70 },
  { platform: "google", dayOfWeek: "Tuesday", timeUtc: "10:00", engagementScore: 75 },
  { platform: "google", dayOfWeek: "Wednesday", timeUtc: "09:00", engagementScore: 80 },
  { platform: "google", dayOfWeek: "Thursday", timeUtc: "11:00", engagementScore: 76 },
  { platform: "google", dayOfWeek: "Friday", timeUtc: "10:00", engagementScore: 65 },
  { platform: "google", dayOfWeek: "Saturday", timeUtc: "10:00", engagementScore: 50 },
  { platform: "google", dayOfWeek: "Sunday", timeUtc: "12:00", engagementScore: 45 },
  // Email
  { platform: "email", dayOfWeek: "Monday", timeUtc: "10:00", engagementScore: 68 },
  { platform: "email", dayOfWeek: "Tuesday", timeUtc: "10:00", engagementScore: 85 },
  { platform: "email", dayOfWeek: "Wednesday", timeUtc: "10:00", engagementScore: 78 },
  { platform: "email", dayOfWeek: "Thursday", timeUtc: "10:00", engagementScore: 80 },
  { platform: "email", dayOfWeek: "Friday", timeUtc: "10:00", engagementScore: 55 },
  { platform: "email", dayOfWeek: "Saturday", timeUtc: "09:00", engagementScore: 35 },
  { platform: "email", dayOfWeek: "Sunday", timeUtc: "09:00", engagementScore: 30 },
];

/* ------------------------------------------------------------------ */
/*  US holidays relevant to home service businesses                    */
/* ------------------------------------------------------------------ */

const US_HOLIDAYS: readonly {
  readonly name: string;
  readonly month: number;
  readonly day: number;
  readonly contentIdeas: readonly string[];
}[] = [
  {
    name: "New Year's Day",
    month: 1, day: 1,
    contentIdeas: [
      "New Year home maintenance resolutions",
      "Schedule your annual HVAC tune-up",
      "New year, new home improvement goals",
    ],
  },
  {
    name: "Martin Luther King Jr. Day",
    month: 1, day: 20,
    contentIdeas: [
      "Community service spotlight",
      "Give back — volunteer day with your team",
    ],
  },
  {
    name: "Valentine's Day",
    month: 2, day: 14,
    contentIdeas: [
      "Show your home some love — maintenance checklist",
      "Gift a home improvement project",
    ],
  },
  {
    name: "Presidents' Day",
    month: 2, day: 17,
    contentIdeas: [
      "Presidents' Day sale on services",
      "Winter maintenance deals",
    ],
  },
  {
    name: "St. Patrick's Day",
    month: 3, day: 17,
    contentIdeas: [
      "Go green with energy-efficient upgrades",
      "Lucky home maintenance tips",
    ],
  },
  {
    name: "Earth Day",
    month: 4, day: 22,
    contentIdeas: [
      "Eco-friendly home improvement ideas",
      "Reduce your home's carbon footprint",
      "Energy audit special for Earth Day",
    ],
  },
  {
    name: "Mother's Day",
    month: 5, day: 11,
    contentIdeas: [
      "Gift Mom a home improvement project",
      "Mother's Day service specials",
    ],
  },
  {
    name: "Memorial Day",
    month: 5, day: 26,
    contentIdeas: [
      "Memorial Day weekend project ideas",
      "Summer kickoff maintenance checklist",
      "Thank a veteran — community spotlight",
    ],
  },
  {
    name: "Father's Day",
    month: 6, day: 15,
    contentIdeas: [
      "Dad's dream garage or workshop upgrade",
      "Father's Day tool gift guide",
    ],
  },
  {
    name: "Independence Day",
    month: 7, day: 4,
    contentIdeas: [
      "Backyard BBQ safety tips",
      "July 4th electrical safety for fireworks",
      "Summer cooling tips for the holiday",
    ],
  },
  {
    name: "Labor Day",
    month: 9, day: 1,
    contentIdeas: [
      "End of summer maintenance checklist",
      "Labor Day sale on fall services",
      "Celebrating the trades that build America",
    ],
  },
  {
    name: "Halloween",
    month: 10, day: 31,
    contentIdeas: [
      "Spooky electrical hazards to watch for",
      "Don't let plumbing horrors haunt you",
      "Fall home safety walkthrough",
    ],
  },
  {
    name: "Veterans Day",
    month: 11, day: 11,
    contentIdeas: [
      "Veterans discount on services",
      "Honoring veterans on our team",
    ],
  },
  {
    name: "Thanksgiving",
    month: 11, day: 27,
    contentIdeas: [
      "Thankful for our customers — appreciation post",
      "Thanksgiving plumbing survival guide",
      "Pre-holiday HVAC check reminder",
    ],
  },
  {
    name: "Christmas",
    month: 12, day: 25,
    contentIdeas: [
      "Holiday lighting safety tips",
      "Gift certificates for home services",
      "Year in review — projects we're proud of",
    ],
  },
  {
    name: "New Year's Eve",
    month: 12, day: 31,
    contentIdeas: [
      "Year-end home maintenance wrap-up",
      "Book early for January appointments",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function generatePostId(
  year: number,
  month: number,
  index: number,
): string {
  const monthStr = String(month).padStart(2, "0");
  const indexStr = String(index).padStart(3, "0");
  return `cp-${year}${monthStr}-${indexStr}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getThemesForMonth(month: number): readonly ContentTheme[] {
  return CONTENT_THEMES
    .filter((t) => t.peakMonths.includes(month))
    .map((t) => t.id);
}

function getDayOfWeekName(date: Date): string {
  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];
  return days[date.getDay()];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate a full month of content post ideas for a given trade.
 *
 * Distributes posts across the month on weekdays, picks themes relevant
 * to the month, and varies content types according to the ideal mix.
 */
export function generateMonthlyCalendar(
  year: number,
  month: number,
  trade: Trade,
): ContentCalendar {
  const themes = getThemesForMonth(month);
  const tradeIdeas = TRADE_CONTENT_IDEAS[trade];
  const daysInMonth = getDaysInMonth(year, month);
  const mix = calculateContentMix();
  const platforms: readonly Platform[] = [
    "facebook", "instagram", "google", "email",
  ];

  const posts: ContentPost[] = [];
  let postIndex = 0;

  // Place ~3 posts per week (Mon, Wed, Fri), cycling through ideas
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();

    // Post on Monday (1), Wednesday (3), Friday (5)
    if (dow !== 1 && dow !== 3 && dow !== 5) {
      continue;
    }

    const ideaIndex = postIndex % tradeIdeas.length;
    const idea = tradeIdeas[ideaIndex];
    const theme = themes.includes(idea.theme)
      ? idea.theme
      : themes[postIndex % themes.length];
    const platform = platforms[postIndex % platforms.length];
    const mixEntry = mix.find((m) => m.contentType === idea.type);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const themeLabel =
      CONTENT_THEMES.find((t) => t.id === theme)?.label ?? theme;

    posts.push({
      id: generatePostId(year, month, postIndex),
      title: idea.title,
      contentType: idea.type,
      theme,
      scheduledDate: dateStr,
      status: "draft",
      platform,
      description:
        `${idea.title} — Part of the ${themeLabel} theme. ` +
        `Recommended ratio for ${idea.type}: ${mixEntry?.percentage ?? 10}%.`,
      tags: [trade, theme, idea.type],
    });

    postIndex++;
  }

  return {
    month,
    year,
    trade,
    posts,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Return the optimal posting times for one or all platforms.
 *
 * Results are sorted by engagement score (highest first).
 */
export function getOptimalPostTimes(
  platform?: Platform,
): readonly PostTimeSlot[] {
  const slots = platform
    ? OPTIMAL_POST_TIMES.filter((s) => s.platform === platform)
    : [...OPTIMAL_POST_TIMES];

  return [...slots].sort(
    (a, b) => b.engagementScore - a.engagementScore,
  );
}

/**
 * Get trade-specific content ideas, optionally filtered by content type.
 */
export function suggestContentForTrade(
  trade: Trade,
  contentType?: ContentType,
): readonly { readonly title: string; readonly type: ContentType; readonly theme: ContentTheme }[] {
  const ideas = TRADE_CONTENT_IDEAS[trade];
  if (!contentType) {
    return ideas;
  }
  return ideas.filter((idea) => idea.type === contentType);
}

/**
 * Calculate the ideal content mix ratios for home service businesses.
 *
 * Based on industry best practices for engagement:
 * - Educational/DIY content builds trust
 * - Social proof (testimonials, case studies) drives conversions
 * - Promotional content should be a small fraction
 */
export function calculateContentMix(
  totalPostsPerMonth: number = 12,
): readonly ContentMix[] {
  const ratios: readonly { readonly type: ContentType; readonly pct: number }[] = [
    { type: "blog", pct: 25 },
    { type: "social_media", pct: 25 },
    { type: "video", pct: 15 },
    { type: "email", pct: 12 },
    { type: "testimonial", pct: 8 },
    { type: "case_study", pct: 8 },
    { type: "infographic", pct: 7 },
  ];

  return ratios.map((r) => ({
    contentType: r.type,
    percentage: r.pct,
    postsPerMonth: Math.max(1, Math.round((r.pct / 100) * totalPostsPerMonth)),
  }));
}

/**
 * Return holidays occurring within the next 30 days from `referenceDate`.
 *
 * Uses a simplified fixed-date calendar (does not account for floating
 * holidays like Thanksgiving that shift year to year). Suitable for
 * content planning prompts and rough scheduling.
 */
export function getUpcomingHolidays(
  referenceDate: Date = new Date(),
): readonly Holiday[] {
  const refTime = referenceDate.getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const cutoff = refTime + thirtyDaysMs;
  const refYear = referenceDate.getFullYear();

  const results: Holiday[] = [];

  // Check current year and next year to handle year boundaries
  for (const yearOffset of [0, 1]) {
    const year = refYear + yearOffset;
    for (const h of US_HOLIDAYS) {
      const holidayDate = new Date(year, h.month - 1, h.day);
      const holidayTime = holidayDate.getTime();

      if (holidayTime >= refTime && holidayTime <= cutoff) {
        const dateStr =
          `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`;
        results.push({
          name: h.name,
          date: dateStr,
          contentIdeas: h.contentIdeas,
        });
      }
    }
  }

  return results.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
