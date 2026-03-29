/**
 * Seasonal trend analysis utility for home service businesses.
 * Provides demand forecasting, budget recommendations, and content
 * suggestions based on historical seasonal patterns per trade.
 *
 * Pure computation — no database or network calls.
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type Trade =
  | "hvac"
  | "plumbing"
  | "roofing"
  | "electrical"
  | "landscaping"
  | "pest_control"
  | "painting";

export type MonthIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface SeasonalTrend {
  trade: Trade;
  month: MonthIndex;
  demandIndex: number;
  label: string;
  description: string;
}

export interface TrendData {
  month: MonthIndex;
  year: number;
  value: number;
}

export interface SeasonalIndex {
  trade: Trade;
  indices: Record<MonthIndex, number>;
}

export interface ForecastResult {
  month: MonthIndex;
  year: number;
  projectedDemand: number;
  seasonalMultiplier: number;
  confidence: number;
}

export interface BudgetAdjustment {
  month: MonthIndex;
  year: number;
  currentSpend: number;
  recommendedSpend: number;
  changePercent: number;
  reasoning: string;
}

export interface PeakPeriod {
  month: MonthIndex;
  monthName: string;
  demandIndex: number;
  rank: number;
}

export interface YearOverYearResult {
  month: MonthIndex;
  monthName: string;
  years: Record<number, number>;
  changePercent: number | null;
  trend: "up" | "down" | "stable" | "insufficient_data";
}

export interface SeasonalContentSuggestion {
  month: MonthIndex;
  monthName: string;
  trade: Trade;
  topics: string[];
  callToAction: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES: Record<MonthIndex, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

/**
 * Monthly demand indices per trade. A value of 1.0 represents average
 * demand; values above indicate peaks and below indicate troughs.
 */
export const SEASONAL_PATTERNS: Record<Trade, Record<MonthIndex, number>> = {
  hvac: {
    1: 1.3,
    2: 1.1,
    3: 0.8,
    4: 0.7,
    5: 0.9,
    6: 1.5,
    7: 1.6,
    8: 1.5,
    9: 1.0,
    10: 0.8,
    11: 0.9,
    12: 1.3,
  },
  plumbing: {
    1: 1.3,
    2: 1.2,
    3: 1.2,
    4: 1.1,
    5: 1.0,
    6: 0.9,
    7: 0.8,
    8: 0.8,
    9: 0.9,
    10: 0.9,
    11: 1.0,
    12: 1.3,
  },
  roofing: {
    1: 0.5,
    2: 0.5,
    3: 1.1,
    4: 1.4,
    5: 1.5,
    6: 1.2,
    7: 1.0,
    8: 0.9,
    9: 1.3,
    10: 1.4,
    11: 0.8,
    12: 0.4,
  },
  electrical: {
    1: 0.9,
    2: 0.9,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 1.0,
    9: 1.0,
    10: 1.1,
    11: 1.2,
    12: 1.3,
  },
  landscaping: {
    1: 0.3,
    2: 0.3,
    3: 0.8,
    4: 1.3,
    5: 1.5,
    6: 1.4,
    7: 1.3,
    8: 1.2,
    9: 1.1,
    10: 1.0,
    11: 0.5,
    12: 0.3,
  },
  pest_control: {
    1: 0.5,
    2: 0.6,
    3: 1.0,
    4: 1.3,
    5: 1.5,
    6: 1.5,
    7: 1.4,
    8: 1.2,
    9: 1.0,
    10: 0.8,
    11: 0.6,
    12: 0.5,
  },
  painting: {
    1: 0.6,
    2: 0.6,
    3: 0.9,
    4: 1.3,
    5: 1.4,
    6: 1.2,
    7: 1.1,
    8: 1.0,
    9: 1.3,
    10: 1.1,
    11: 0.8,
    12: 0.5,
  },
};

const SEASONAL_DESCRIPTIONS: Record<Trade, Record<MonthIndex, string>> = {
  hvac: {
    1: "Winter heating peak — furnace repairs and replacements surge",
    2: "Late winter heating demand remains elevated",
    3: "Shoulder season — spring AC tune-ups begin",
    4: "Pre-summer preparation, moderate demand",
    5: "AC demand ramps up as temperatures rise",
    6: "Summer cooling peak begins",
    7: "Peak summer — highest AC demand of the year",
    8: "Late summer cooling demand stays high",
    9: "Transition season — fall maintenance begins",
    10: "Pre-winter furnace inspections",
    11: "Early winter heating demand picks up",
    12: "Winter heating peak — holiday emergency calls",
  },
  plumbing: {
    1: "Frozen pipe emergencies drive peak demand",
    2: "Cold-weather pipe issues continue",
    3: "Spring thaw reveals winter damage",
    4: "Spring plumbing projects and inspections",
    5: "Steady spring demand",
    6: "Summer slowdown begins",
    7: "Lower demand — fewer weather-related issues",
    8: "Summer lull continues",
    9: "Back-to-school season, moderate demand",
    10: "Pre-winter pipe insulation and prep",
    11: "Winterization services increase",
    12: "Holiday gatherings strain plumbing systems",
  },
  roofing: {
    1: "Winter lull — too cold for most roofing work",
    2: "Winter lull continues",
    3: "Spring storm season drives inspections",
    4: "Peak spring — storm damage repairs and new installs",
    5: "Highest demand — ideal weather for roofing",
    6: "Strong demand continues into early summer",
    7: "Moderate demand, hot weather can slow work",
    8: "Late summer slowdown",
    9: "Fall rush — prepare roofs before winter",
    10: "Peak fall demand for pre-winter repairs",
    11: "Season winding down",
    12: "Winter lull — emergency repairs only",
  },
  electrical: {
    1: "Steady demand — post-holiday electrical work",
    2: "Moderate demand",
    3: "Spring projects begin",
    4: "Steady renovation season",
    5: "Moderate demand",
    6: "Summer projects and AC electrical work",
    7: "Steady summer demand",
    8: "Moderate demand",
    9: "Back-to-school renovations",
    10: "Holiday lighting prep begins",
    11: "Holiday lighting installations peak",
    12: "Peak — holiday lighting and winter electrical needs",
  },
  landscaping: {
    1: "Winter dormancy — very low demand",
    2: "Winter dormancy continues",
    3: "Early spring clean-up begins",
    4: "Spring planting season drives strong demand",
    5: "Peak season — full landscaping services",
    6: "High demand — mowing, planting, hardscaping",
    7: "Strong demand continues through summer",
    8: "Late summer maintenance",
    9: "Fall clean-up and planting begins",
    10: "Leaf removal and winterization prep",
    11: "Season winding down rapidly",
    12: "Winter dormancy — holiday lighting only",
  },
  pest_control: {
    1: "Low demand — most pests dormant",
    2: "Early activity — rodent issues indoors",
    3: "Spring emergence — ants and termites",
    4: "Strong demand — termite swarming season",
    5: "Peak season — mosquitoes, ants, termites",
    6: "Peak demand — all pest types active",
    7: "High demand — summer pest pressure",
    8: "Late summer — wasps and stinging insects",
    9: "Demand moderates as temperatures cool",
    10: "Rodents seek indoor shelter",
    11: "Low demand — preventive treatments",
    12: "Low demand — indoor rodent control",
  },
  painting: {
    1: "Winter lull — interior projects only",
    2: "Low demand — weather limits exterior work",
    3: "Spring prep and planning begins",
    4: "Peak spring — exterior painting season opens",
    5: "Highest demand — ideal weather conditions",
    6: "Strong demand continues",
    7: "Moderate — heat can limit exterior work",
    8: "Moderate demand",
    9: "Fall peak — last push before winter",
    10: "Good demand — mild weather for exteriors",
    11: "Season winding down",
    12: "Winter lull — limited to interior jobs",
  },
};

const SEASONAL_CONTENT: Record<Trade, Record<MonthIndex, string[]>> = {
  hvac: {
    1: ["Emergency heating tips", "When to replace your furnace", "Energy-saving thermostat settings"],
    2: ["Indoor air quality in winter", "Heat pump vs. furnace comparison"],
    3: ["Spring AC tune-up checklist", "Preparing your AC for summer"],
    4: ["Signs your AC needs replacement", "SEER rating explained"],
    5: ["Beat the heat — AC maintenance tips", "Smart thermostat buyer's guide"],
    6: ["Summer energy savings tips", "AC not cooling? Common causes"],
    7: ["How to stay cool during a heatwave", "Central air vs. ductless mini-splits"],
    8: ["End-of-summer AC care", "Why your AC is running constantly"],
    9: ["Fall HVAC maintenance checklist", "Preparing for heating season"],
    10: ["Furnace safety inspection guide", "When to schedule a furnace tune-up"],
    11: ["Winter heating efficiency tips", "Carbon monoxide safety"],
    12: ["Emergency furnace repair guide", "Holiday hosting HVAC tips"],
  },
  plumbing: {
    1: ["How to prevent frozen pipes", "Emergency pipe burst response"],
    2: ["Thawing frozen pipes safely", "Water heater maintenance in winter"],
    3: ["Spring plumbing inspection checklist", "Sump pump readiness guide"],
    4: ["Outdoor faucet preparation", "Water line leak detection"],
    5: ["Sprinkler system start-up tips", "Water heater flush guide"],
    6: ["Summer water conservation tips", "Pool plumbing maintenance"],
    7: ["Vacation plumbing checklist", "Garbage disposal care tips"],
    8: ["Back-to-school plumbing prep", "Water pressure troubleshooting"],
    9: ["Fall plumbing maintenance", "Preparing outdoor pipes for winter"],
    10: ["Winterization guide for pipes", "Water heater buyer's guide"],
    11: ["Holiday plumbing survival guide", "Preventing kitchen drain clogs"],
    12: ["Emergency plumbing tips for holidays", "Frozen pipe prevention checklist"],
  },
  roofing: {
    1: ["Winter roof damage signs", "Ice dam prevention tips"],
    2: ["How snow affects your roof", "Emergency tarping guide"],
    3: ["Spring roof inspection checklist", "Storm damage assessment guide"],
    4: ["Best time to replace your roof", "Roofing material comparison"],
    5: ["Choosing a roofing contractor", "Shingle vs. metal roof guide"],
    6: ["Summer roofing considerations", "Attic ventilation importance"],
    7: ["Heat damage and your roof", "Roof warranty guide"],
    8: ["Late summer roof maintenance", "Gutter cleaning tips"],
    9: ["Fall roof prep checklist", "Leaf guard installation guide"],
    10: ["Pre-winter roof repairs", "Flashing inspection guide"],
    11: ["Preparing your roof for snow", "Emergency roof repair basics"],
    12: ["Winter roof safety tips", "Ice and snow removal guide"],
  },
  electrical: {
    1: ["Home electrical safety audit", "Generator buying guide"],
    2: ["Energy audit tips", "Outlet and switch upgrades"],
    3: ["Spring electrical maintenance", "Outdoor lighting planning"],
    4: ["Home renovation electrical needs", "EV charger installation guide"],
    5: ["Ceiling fan installation guide", "Whole-house surge protection"],
    6: ["Summer electrical safety", "Pool and spa electrical requirements"],
    7: ["Keeping cool efficiently", "Smart home electrical upgrades"],
    8: ["Back-to-school home office wiring", "Electrical panel upgrade signs"],
    9: ["Fall electrical safety check", "Landscape lighting ideas"],
    10: ["Holiday lighting safety tips", "Outdoor electrical prep for winter"],
    11: ["Holiday display electrical planning", "LED vs. incandescent lights"],
    12: ["Holiday lighting installation", "Winter storm electrical preparedness"],
  },
  landscaping: {
    1: ["Winter garden planning", "Indoor plant care tips"],
    2: ["Early spring prep checklist", "Seed starting guide"],
    3: ["Spring clean-up essentials", "Lawn aeration timing"],
    4: ["Planting season guide", "Mulching best practices"],
    5: ["Full lawn care program", "Garden design trends"],
    6: ["Summer lawn maintenance", "Irrigation system optimization"],
    7: ["Heat stress lawn care", "Drought-resistant landscaping"],
    8: ["Late summer garden tasks", "Fall planting preparation"],
    9: ["Fall lawn overseeding", "Tree and shrub planting guide"],
    10: ["Leaf removal strategies", "Winterization service guide"],
    11: ["Final fall clean-up", "Holiday decorating with landscaping"],
    12: ["Winter landscaping ideas", "Holiday lighting services"],
  },
  pest_control: {
    1: ["Winter rodent prevention", "Indoor pest identification"],
    2: ["Early spring pest preparation", "Rodent entry point sealing"],
    3: ["Termite awareness month", "Spring ant prevention"],
    4: ["Termite inspection importance", "Mosquito breeding prevention"],
    5: ["Mosquito control strategies", "Tick safety for families"],
    6: ["Summer pest-proofing your home", "Carpenter ant identification"],
    7: ["Wasp and hornet nest removal", "Bed bug travel prevention"],
    8: ["Stinging insect safety", "Back-to-school lice prevention"],
    9: ["Fall pest prevention tips", "Spider identification guide"],
    10: ["Rodent exclusion before winter", "Stink bug prevention"],
    11: ["Winter pest-proofing checklist", "Firewood pest prevention"],
    12: ["Holiday pest prevention", "Pantry pest identification"],
  },
  painting: {
    1: ["Interior painting project ideas", "Color trends for the new year"],
    2: ["Planning your spring painting project", "Paint finish guide"],
    3: ["Exterior paint prep checklist", "Choosing the right paint colors"],
    4: ["Best exterior painting conditions", "Curb appeal color palettes"],
    5: ["Summer painting project guide", "Deck and fence staining tips"],
    6: ["Interior vs. exterior paint differences", "Painting cost estimator"],
    7: ["Heat and humidity painting tips", "Cabinet refinishing guide"],
    8: ["Back-to-school room makeovers", "Accent wall ideas"],
    9: ["Fall exterior painting rush", "Before-winter painting checklist"],
    10: ["Autumn color inspiration", "Exterior touch-up guide"],
    11: ["Holiday-ready interior painting", "Garage floor coating guide"],
    12: ["Winter interior painting tips", "New year renovation planning"],
  },
};

const SEASONAL_CTAS: Record<Trade, Record<MonthIndex, string>> = {
  hvac: {
    1: "Schedule emergency heating service today",
    2: "Book your furnace inspection before the cold snaps",
    3: "Get your AC tune-up scheduled early — slots fill fast",
    4: "Pre-summer AC check — book now and save",
    5: "Don't wait for the heatwave — schedule AC service now",
    6: "Beat the summer rush — AC repair and installation",
    7: "Same-day AC repair available — call now",
    8: "End-of-summer AC deals — schedule today",
    9: "Fall furnace tune-up — early bird pricing",
    10: "Heating season is coming — book your furnace check",
    11: "Stay warm this winter — schedule heating service",
    12: "24/7 emergency heating — we're here for you",
  },
  plumbing: {
    1: "Frozen pipes? Call our 24/7 emergency line",
    2: "Winter plumbing checkup — prevent costly damage",
    3: "Spring plumbing inspection — schedule yours today",
    4: "Get your outdoor plumbing ready for spring",
    5: "Water heater flush special — book now",
    6: "Summer plumbing tune-up — save water and money",
    7: "Vacation plumbing check — peace of mind before you go",
    8: "Back-to-school plumbing prep — schedule now",
    9: "Fall plumbing maintenance — winterize early",
    10: "Pipe winterization service — prevent frozen pipes",
    11: "Holiday prep — make sure your plumbing is ready",
    12: "Holiday plumbing emergency? We're available 24/7",
  },
  roofing: {
    1: "Free winter roof damage assessment",
    2: "Schedule your spring roof inspection early",
    3: "Post-storm roof inspection — free estimates",
    4: "Spring roofing special — book your project now",
    5: "Best time for a new roof — schedule your estimate",
    6: "Summer roofing deals — limited availability",
    7: "Beat the fall rush — schedule roofing now",
    8: "End-of-summer roofing specials",
    9: "Fall roof prep — protect your home this winter",
    10: "Last chance for pre-winter roof repairs",
    11: "Emergency roof tarping and repair available",
    12: "Winter emergency roof repair — call anytime",
  },
  electrical: {
    1: "New year electrical safety inspection — book now",
    2: "Home energy audit — save on your electric bill",
    3: "Spring electrical maintenance — schedule today",
    4: "Renovation electrical work — free estimates",
    5: "Ceiling fan installation — stay cool this summer",
    6: "Pool electrical safety inspection",
    7: "Smart home upgrades — free consultation",
    8: "Home office wiring — back-to-school special",
    9: "Fall electrical safety check — book now",
    10: "Holiday lighting installation — book early",
    11: "Professional holiday light installation",
    12: "Holiday lighting and winter electrical service",
  },
  landscaping: {
    1: "Plan your dream landscape — free winter consultation",
    2: "Early bird spring clean-up — book now and save",
    3: "Spring clean-up packages available — limited spots",
    4: "Full-service spring planting — schedule your design",
    5: "Lawn care programs starting — sign up today",
    6: "Irrigation system check-up — save water this summer",
    7: "Drought-resistant landscaping — free consultation",
    8: "Fall planting prep — schedule your design now",
    9: "Fall overseeding and aeration — book now",
    10: "Leaf removal service — weekly or one-time",
    11: "Final fall clean-up — schedule before winter",
    12: "Holiday lighting installation — book your display",
  },
  pest_control: {
    1: "Rodent control — seal your home this winter",
    2: "Pre-spring pest inspection — prevent infestations",
    3: "Termite inspection month — schedule yours free",
    4: "Termite treatment special — protect your investment",
    5: "Mosquito control program — enjoy your yard again",
    6: "Summer pest-proofing package — whole-home protection",
    7: "Wasp nest removal — safe and guaranteed",
    8: "End-of-summer pest treatment — fall prevention",
    9: "Fall pest prevention — seal out rodents and insects",
    10: "Rodent exclusion service — before they move in",
    11: "Winter pest-proofing — schedule your treatment",
    12: "Holiday pest prevention — clean home guaranteed",
  },
  painting: {
    1: "Winter interior painting special — transform your space",
    2: "Book your spring exterior project early — save 10%",
    3: "Spring painting prep — free exterior assessment",
    4: "Exterior painting season is here — book your estimate",
    5: "Prime painting weather — schedule your project now",
    6: "Summer painting deals — interior and exterior",
    7: "Cabinet refinishing special — update your kitchen",
    8: "Back-to-school room makeover — book now",
    9: "Last call for exterior painting this year",
    10: "Fall exterior touch-up special",
    11: "Holiday-ready interiors — painting packages available",
    12: "New year, new look — plan your painting project",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidTrade(trade: string): trade is Trade {
  return trade in SEASONAL_PATTERNS;
}

function isValidMonth(month: number): month is MonthIndex {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

function validateTradeAndMonth(
  trade: string,
  month: number
): { trade: Trade; month: MonthIndex } {
  if (!isValidTrade(trade)) {
    throw new Error(`Invalid trade: "${trade}". Expected one of: ${Object.keys(SEASONAL_PATTERNS).join(", ")}`);
  }
  if (!isValidMonth(month)) {
    throw new Error(`Invalid month: ${month}. Expected an integer from 1 to 12.`);
  }
  return { trade, month };
}

function advanceMonth(
  month: MonthIndex,
  year: number,
  offset: number
): { month: MonthIndex; year: number } {
  const zeroBasedMonth = month - 1 + offset;
  const newMonth = ((zeroBasedMonth % 12) + 12) % 12;
  const yearOffset = Math.floor(zeroBasedMonth / 12);
  return {
    month: (newMonth + 1) as MonthIndex,
    year: year + yearOffset,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the demand multiplier for a given trade and month.
 * A value of 1.0 means average demand; >1.0 is above average.
 */
export function getSeasonalIndex(trade: string, month: number): number {
  const validated = validateTradeAndMonth(trade, month);
  return SEASONAL_PATTERNS[validated.trade][validated.month];
}

/**
 * Project demand for the next `months` months (3-6) using historical
 * data combined with seasonal indices.
 *
 * The baseline is computed as the average of the provided historical
 * values, then scaled by the seasonal index for each projected month.
 * Confidence decreases linearly for months further into the future.
 */
export function forecastDemand(
  trade: string,
  historicalData: readonly TrendData[],
  startMonth: number,
  startYear: number,
  months: number = 3
): ForecastResult[] {
  if (!isValidTrade(trade)) {
    throw new Error(`Invalid trade: "${trade}".`);
  }
  if (months < 1 || months > 12) {
    throw new Error("Forecast horizon must be between 1 and 12 months.");
  }
  if (historicalData.length === 0) {
    throw new Error("At least one historical data point is required.");
  }

  const baseline =
    historicalData.reduce((sum, d) => sum + d.value, 0) /
    historicalData.length;

  const results: ForecastResult[] = [];
  for (let i = 0; i < months; i++) {
    const { month, year } = advanceMonth(
      startMonth as MonthIndex,
      startYear,
      i
    );
    const multiplier = SEASONAL_PATTERNS[trade as Trade][month];
    const confidence = Math.max(0.5, 1 - i * 0.08);
    results.push({
      month,
      year,
      projectedDemand: Math.round(baseline * multiplier * 100) / 100,
      seasonalMultiplier: multiplier,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  return results;
}

/**
 * Recommend ad-spend adjustments for upcoming months based on
 * seasonal demand patterns.
 *
 * The recommendation scales the current spend proportionally to the
 * seasonal index, with a dampening factor so swings are not too extreme.
 */
export function suggestBudgetAdjustment(
  trade: string,
  currentMonthlySpend: number,
  startMonth: number,
  startYear: number,
  months: number = 3
): BudgetAdjustment[] {
  if (!isValidTrade(trade)) {
    throw new Error(`Invalid trade: "${trade}".`);
  }
  if (currentMonthlySpend < 0) {
    throw new Error("Current monthly spend must be non-negative.");
  }
  if (months < 1 || months > 12) {
    throw new Error("Forecast horizon must be between 1 and 12 months.");
  }

  const DAMPEN = 0.6; // pull recommendations toward baseline
  const adjustments: BudgetAdjustment[] = [];

  for (let i = 0; i < months; i++) {
    const { month, year } = advanceMonth(
      startMonth as MonthIndex,
      startYear,
      i
    );
    const index = SEASONAL_PATTERNS[trade as Trade][month];
    const rawMultiplier = 1 + (index - 1) * DAMPEN;
    const recommended =
      Math.round(currentMonthlySpend * rawMultiplier * 100) / 100;
    const changePct =
      currentMonthlySpend === 0
        ? 0
        : Math.round(
            ((recommended - currentMonthlySpend) / currentMonthlySpend) *
              10000
          ) / 100;

    let reasoning: string;
    if (changePct > 5) {
      reasoning = `Demand peaks in ${MONTH_NAMES[month]} — increase spend to capture more leads.`;
    } else if (changePct < -5) {
      reasoning = `Demand dips in ${MONTH_NAMES[month]} — reduce spend and conserve budget.`;
    } else {
      reasoning = `Demand is near average in ${MONTH_NAMES[month]} — maintain current spend.`;
    }

    adjustments.push({
      month,
      year,
      currentSpend: currentMonthlySpend,
      recommendedSpend: recommended,
      changePercent: changePct,
      reasoning,
    });
  }

  return adjustments;
}

/**
 * Return the top N months for a given trade, ranked by demand index.
 */
export function identifyPeakPeriods(
  trade: string,
  topN: number = 3
): PeakPeriod[] {
  if (!isValidTrade(trade)) {
    throw new Error(`Invalid trade: "${trade}".`);
  }
  if (topN < 1 || topN > 12) {
    throw new Error("topN must be between 1 and 12.");
  }

  const months = (Object.keys(SEASONAL_PATTERNS[trade as Trade]) as unknown as MonthIndex[])
    .map((m) => Number(m) as MonthIndex);

  const sorted = months
    .map((m) => ({
      month: m,
      monthName: MONTH_NAMES[m],
      demandIndex: SEASONAL_PATTERNS[trade as Trade][m],
      rank: 0,
    }))
    .sort((a, b) => b.demandIndex - a.demandIndex);

  return sorted.slice(0, topN).map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

/**
 * Compare same-month metrics across years. Returns the percent change
 * between the two most recent years for each month present in the data.
 */
export function calculateYearOverYear(
  data: readonly TrendData[]
): YearOverYearResult[] {
  if (data.length === 0) {
    return [];
  }

  const byMonth = new Map<MonthIndex, Map<number, number>>();

  for (const point of data) {
    if (!isValidMonth(point.month)) {
      continue;
    }
    const monthMap = byMonth.get(point.month) ?? new Map<number, number>();
    monthMap.set(point.year, point.value);
    byMonth.set(point.month, monthMap);
  }

  const results: YearOverYearResult[] = [];

  const entries = Array.from(byMonth.entries());
  for (let e = 0; e < entries.length; e++) {
    const month = entries[e][0];
    const yearMap = entries[e][1];
    const yearKeys = Array.from(yearMap.keys());
    const sortedYears = yearKeys.sort((a, b) => a - b);
    const years: Record<number, number> = {};
    for (const y of sortedYears) {
      years[y] = yearMap.get(y)!;
    }

    let changePercent: number | null = null;
    let trend: YearOverYearResult["trend"] = "insufficient_data";

    if (sortedYears.length >= 2) {
      const prev = yearMap.get(sortedYears[sortedYears.length - 2])!;
      const curr = yearMap.get(sortedYears[sortedYears.length - 1])!;
      if (prev !== 0) {
        changePercent = Math.round(((curr - prev) / prev) * 10000) / 100;
        if (changePercent > 2) {
          trend = "up";
        } else if (changePercent < -2) {
          trend = "down";
        } else {
          trend = "stable";
        }
      }
    }

    results.push({
      month,
      monthName: MONTH_NAMES[month],
      years,
      changePercent,
      trend,
    });
  }

  return results.sort((a, b) => a.month - b.month);
}

/**
 * Suggest content topics and calls-to-action for the upcoming months
 * based on seasonal trends for a given trade.
 */
export function getSeasonalContent(
  trade: string,
  startMonth: number,
  startYear: number,
  months: number = 3
): SeasonalContentSuggestion[] {
  if (!isValidTrade(trade)) {
    throw new Error(`Invalid trade: "${trade}".`);
  }
  if (months < 1 || months > 12) {
    throw new Error("Months must be between 1 and 12.");
  }

  const suggestions: SeasonalContentSuggestion[] = [];

  for (let i = 0; i < months; i++) {
    const { month } = advanceMonth(
      startMonth as MonthIndex,
      startYear,
      i
    );

    suggestions.push({
      month,
      monthName: MONTH_NAMES[month],
      trade: trade as Trade,
      topics: SEASONAL_CONTENT[trade as Trade][month],
      callToAction: SEASONAL_CTAS[trade as Trade][month],
    });
  }

  return suggestions;
}
