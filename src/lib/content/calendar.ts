/**
 * Content Calendar Framework for Sovereign Empire
 *
 * Defines the weekly content rhythm, monthly themes aligned with seasonal demand,
 * and utility functions for planning and generating content ideas.
 */

/** Days of the week */
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/** A scheduled content slot in the weekly rhythm */
export interface ContentSlot {
  /** Day of the week this content is published */
  day: DayOfWeek;
  /** Target platform */
  platform: "linkedin" | "twitter" | "email" | "youtube";
  /** Type of content to create */
  contentType: string;
  /** Human-readable description of what to post */
  description: string;
  /** Maps to a PostTemplate if applicable */
  template?: string;
}

/**
 * The standard weekly content rhythm.
 * Each day has a designated platform and content type.
 */
export const WEEKLY_RHYTHM: ContentSlot[] = [
  {
    day: "monday",
    platform: "linkedin",
    contentType: "system_in_action",
    description: "Screenshot + metrics post",
    template: "system_in_action",
  },
  {
    day: "tuesday",
    platform: "twitter",
    contentType: "thread",
    description: "Behind the build or industry insight thread",
    template: "behind_the_build",
  },
  {
    day: "wednesday",
    platform: "linkedin",
    contentType: "educational",
    description: "Tip or framework post",
    template: "educational_tip",
  },
  {
    day: "thursday",
    platform: "email",
    contentType: "newsletter",
    description: "One insight + one proof point",
  },
  {
    day: "friday",
    platform: "linkedin",
    contentType: "story",
    description: "Client win or lesson learned",
    template: "client_win",
  },
  {
    day: "saturday",
    platform: "twitter",
    contentType: "short_post",
    description: "Repurposed from best LinkedIn post of the week",
  },
  {
    day: "sunday",
    platform: "linkedin",
    contentType: "rest",
    description: "Rest / batch-create next week's content",
  },
];

/** A monthly content theme aligned with seasonal contractor demand */
export interface MonthlyTheme {
  /** Month number (1-12) */
  month: number;
  /** Full month name */
  name: string;
  /** Theme headline */
  theme: string;
  /** Verticals to emphasize this month */
  focusVerticals: string[];
  /** Content angles and talking points */
  contentAngles: string[];
}

/**
 * Monthly themes aligned with seasonal demand cycles
 * for home services contractors.
 */
export const MONTHLY_THEMES: MonthlyTheme[] = [
  {
    month: 1,
    name: "January",
    theme: "New year, new leads",
    focusVerticals: ["hvac", "plumbing"],
    contentAngles: ["planning", "goal-setting for contractors"],
  },
  {
    month: 2,
    name: "February",
    theme: "Spring prep",
    focusVerticals: ["hvac", "roofing", "pest_control"],
    contentAngles: ["pre-season marketing", "spring prep"],
  },
  {
    month: 3,
    name: "March",
    theme: "The leads are warming up",
    focusVerticals: ["hvac", "roofing", "landscaping"],
    contentAngles: ["spring discovery signals", "warming markets"],
  },
  {
    month: 4,
    name: "April",
    theme: "Peak season prep",
    focusVerticals: ["hvac", "pest_control", "landscaping"],
    contentAngles: ["handling increased demand", "scaling operations"],
  },
  {
    month: 5,
    name: "May",
    theme: "Summer is coming",
    focusVerticals: ["hvac", "pest_control"],
    contentAngles: [
      "HVAC focus",
      "emergency readiness",
      "AC maintenance",
    ],
  },
  {
    month: 6,
    name: "June",
    theme: "Peak performance",
    focusVerticals: ["hvac", "pest_control", "landscaping"],
    contentAngles: ["showcase summer results", "peak season wins"],
  },
  {
    month: 7,
    name: "July",
    theme: "The data doesn't lie",
    focusVerticals: ["hvac", "roofing"],
    contentAngles: ["mid-year ROI reviews", "data-driven results"],
  },
  {
    month: 8,
    name: "August",
    theme: "Second half surge",
    focusVerticals: ["roofing", "plumbing"],
    contentAngles: ["fall prep", "roofing/plumbing focus"],
  },
  {
    month: 9,
    name: "September",
    theme: "Shoulder season strategy",
    focusVerticals: ["hvac", "roofing", "plumbing"],
    contentAngles: [
      "maintaining pipeline between peaks",
      "transition strategy",
    ],
  },
  {
    month: 10,
    name: "October",
    theme: "Winter is coming",
    focusVerticals: ["hvac", "plumbing"],
    contentAngles: ["heating season prep", "winterization leads"],
  },
  {
    month: 11,
    name: "November",
    theme: "Year in review prep",
    focusVerticals: ["hvac", "plumbing", "electrical"],
    contentAngles: ["holiday scheduling", "annual planning"],
  },
  {
    month: 12,
    name: "December",
    theme: "The year that was",
    focusVerticals: ["all"],
    contentAngles: [
      "annual results",
      "case studies",
      "next year planning",
    ],
  },
];

/** Map day-of-week index (0 = Sunday) to DayOfWeek */
const DAY_INDEX_MAP: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Returns the monthly theme for the given month.
 * Uses the current month if none is specified.
 *
 * @param month - Month number (1-12). Defaults to current month.
 * @returns The MonthlyTheme for the requested month.
 */
export function getCurrentTheme(month?: number): MonthlyTheme {
  const m = month ?? new Date().getMonth() + 1;
  const theme = MONTHLY_THEMES.find((t) => t.month === m);
  if (!theme) {
    throw new Error(`No theme found for month ${m}`);
  }
  return theme;
}

/**
 * Returns weekly content slots, optionally filtered by day.
 *
 * @param dayOfWeek - If provided, returns only slots for that day. Otherwise returns all.
 * @returns An array of ContentSlot entries.
 */
export function getWeeklySlots(dayOfWeek?: DayOfWeek): ContentSlot[] {
  if (dayOfWeek) {
    return WEEKLY_RHYTHM.filter((slot) => slot.day === dayOfWeek);
  }
  return [...WEEKLY_RHYTHM];
}

/**
 * Returns the content slot and monthly theme for a given date (defaults to today).
 * Useful for knowing what to create right now.
 *
 * @param date - The date to check. Defaults to today.
 * @returns An object with the day's content slot and the current monthly theme.
 */
export function getTodaysContent(date?: Date): {
  slot: ContentSlot;
  theme: MonthlyTheme;
} {
  const d = date ?? new Date();
  const dayName = DAY_INDEX_MAP[d.getDay()];
  const slots = getWeeklySlots(dayName);
  const slot = slots[0];
  if (!slot) {
    throw new Error(`No content slot found for ${dayName}`);
  }
  const theme = getCurrentTheme(d.getMonth() + 1);
  return { slot, theme };
}

/**
 * Returns the full week's content plan starting from the given date.
 * The week starts on the provided date and runs for 7 consecutive days.
 *
 * @param weekStartDate - The first day of the planning week.
 * @returns An array of daily plans, each containing the date, content slot, and monthly theme.
 */
export function getWeeklyPlan(
  weekStartDate: Date
): Array<{ date: Date; slot: ContentSlot; theme: MonthlyTheme }> {
  const plan: Array<{ date: Date; slot: ContentSlot; theme: MonthlyTheme }> =
    [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    const dayName = DAY_INDEX_MAP[date.getDay()];
    const slots = getWeeklySlots(dayName);
    const theme = getCurrentTheme(date.getMonth() + 1);

    for (const slot of slots) {
      plan.push({ date: new Date(date), slot, theme });
    }
  }

  return plan;
}

/**
 * Generates 3-5 content ideas that combine the monthly theme with the content slot type.
 * Ideas are tailored to the focus verticals and content angles of the month.
 *
 * @param theme - The monthly theme providing verticals and angles.
 * @param slot - The content slot defining the format and platform.
 * @returns An array of 3-5 content idea strings.
 */
export function getContentIdeas(
  theme: MonthlyTheme,
  slot: ContentSlot
): string[] {
  const vertical =
    theme.focusVerticals[0] === "all"
      ? "home services"
      : theme.focusVerticals[0];
  const angle = theme.contentAngles[0];
  const secondVertical =
    theme.focusVerticals.length > 1
      ? theme.focusVerticals[1]
      : vertical;

  const ideaMap: Record<string, string[]> = {
    system_in_action: [
      `${capitalize(vertical)} discovery run showing ${angle} leads — screenshot + metrics breakdown`,
      `Before/after pipeline comparison for ${secondVertical} contractor using Sovereign system`,
      `Live demo: finding ${vertical} leads in under 10 minutes during ${theme.theme.toLowerCase()} season`,
      `Dashboard screenshot showing ${angle} results for a real ${vertical} client`,
      `Week-over-week lead growth metrics for ${secondVertical} — system in action`,
    ],
    thread: [
      `Thread: Why ${vertical} contractors are missing leads during ${theme.theme.toLowerCase()}`,
      `Behind the build: How we automated ${angle} for ${vertical} businesses`,
      `Industry insight thread: ${capitalize(angle)} trends every ${secondVertical} owner should know`,
      `Thread: 5 signals that a ${vertical} prospect is ready to buy right now`,
    ],
    educational: [
      `Framework: The 3-step ${angle} playbook for ${vertical} contractors`,
      `Tip: How ${secondVertical} companies can use data to beat seasonal slowdowns`,
      `The #1 mistake ${vertical} contractors make with ${angle} (and how to fix it)`,
      `Quick framework: Prioritizing leads during ${theme.theme.toLowerCase()} season`,
    ],
    newsletter: [
      `One insight on ${angle} + proof point from a ${vertical} client this week`,
      `What we learned about ${secondVertical} lead gen this ${theme.name}`,
      `The data behind ${theme.theme.toLowerCase()}: one metric that matters for ${vertical}`,
    ],
    story: [
      `Client win: How a ${vertical} contractor doubled leads with ${angle} strategy`,
      `Lesson learned: What went wrong (and right) with a ${secondVertical} campaign this month`,
      `Story: From zero pipeline to booked-out — a ${vertical} contractor's ${theme.name} transformation`,
      `Client spotlight: ${capitalize(secondVertical)} owner shares their ${angle} results`,
    ],
    short_post: [
      `Repurpose: Best-performing ${vertical} insight from this week's LinkedIn posts`,
      `Quick stat: ${capitalize(angle)} metric that surprised us this week`,
      `One-liner: The ${theme.theme.toLowerCase()} takeaway every ${vertical} contractor needs`,
    ],
    rest: [
      `Batch-create next week's content around ${angle}`,
      `Review this week's analytics and plan ${theme.name} content adjustments`,
      `Outline next week's ${vertical}-focused posts using top-performing formats`,
    ],
  };

  const ideas = ideaMap[slot.contentType];
  if (ideas) {
    return ideas;
  }

  // Fallback for unknown content types
  return [
    `${capitalize(slot.contentType)} post about ${angle} for ${vertical} contractors`,
    `${capitalize(slot.description)} focused on ${theme.theme.toLowerCase()}`,
    `${capitalize(vertical)} content: ${angle} angle for ${slot.platform}`,
  ];
}

/** Capitalize the first letter of a string */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
