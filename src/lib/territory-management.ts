/**
 * Territory / service-area management utility for home service businesses.
 *
 * Pure math/logic for territory definition, overlap detection, coverage
 * analysis, and expansion recommendations. No database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export interface ZipCodeRange {
  readonly start: string;
  readonly end: string;
}

export interface Territory {
  readonly id: string;
  readonly name: string;
  readonly zipCodes: readonly string[];
  readonly zipCodeRanges: readonly ZipCodeRange[];
  readonly centerZip: string;
  readonly radiusMiles: number;
  readonly assignedTeam: string;
  readonly createdAt: Date;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface ServiceArea {
  readonly territoryId: string;
  readonly zipCode: string;
  readonly populationEstimate: number;
  readonly householdCount: number;
  readonly medianIncome: number;
  readonly leadDensity: number;
}

export interface TerritoryMetrics {
  readonly territoryId: string;
  readonly totalZipCodes: number;
  readonly estimatedPopulation: number;
  readonly estimatedHouseholds: number;
  readonly averageLeadDensity: number;
  readonly marketSizeEstimate: number;
  readonly coveragePercentage: number;
}

export interface CoverageGap {
  readonly zipCode: string;
  readonly nearestTerritoryId: string | null;
  readonly distanceToNearest: number;
  readonly estimatedPopulation: number;
  readonly priority: 'high' | 'medium' | 'low';
}

export interface TerritoryOverlap {
  readonly territoryA: string;
  readonly territoryB: string;
  readonly overlappingZipCodes: readonly string[];
  readonly overlapPercentageA: number;
  readonly overlapPercentageB: number;
}

export interface ExpansionSuggestion {
  readonly zipCode: string;
  readonly reason: string;
  readonly estimatedLeadDensity: number;
  readonly distanceFromCenter: number;
  readonly score: number;
}

export interface TravelRadiusResult {
  readonly centerZip: string;
  readonly radiusMiles: number;
  readonly coveredZipCodes: readonly string[];
  readonly estimatedDriveTimeMinutes: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/**
 * Map each US state abbreviation to its census region.
 */
export const US_REGIONS: Readonly<Record<string, string>> = {
  /* Northeast */
  CT: 'Northeast', DE: 'Northeast', ME: 'Northeast', MD: 'Northeast',
  MA: 'Northeast', NH: 'Northeast', NJ: 'Northeast', NY: 'Northeast',
  PA: 'Northeast', RI: 'Northeast', VT: 'Northeast',

  /* Southeast */
  AL: 'Southeast', AR: 'Southeast', FL: 'Southeast', GA: 'Southeast',
  KY: 'Southeast', LA: 'Southeast', MS: 'Southeast', NC: 'Southeast',
  SC: 'Southeast', TN: 'Southeast', VA: 'Southeast', WV: 'Southeast',

  /* Midwest */
  IL: 'Midwest', IN: 'Midwest', IA: 'Midwest', KS: 'Midwest',
  MI: 'Midwest', MN: 'Midwest', MO: 'Midwest', NE: 'Midwest',
  ND: 'Midwest', OH: 'Midwest', SD: 'Midwest', WI: 'Midwest',

  /* Southwest */
  AZ: 'Southwest', NM: 'Southwest', OK: 'Southwest', TX: 'Southwest',

  /* West */
  CO: 'West', ID: 'West', MT: 'West', NV: 'West',
  UT: 'West', WY: 'West',

  /* Pacific */
  AK: 'Pacific', CA: 'Pacific', HI: 'Pacific', OR: 'Pacific',
  WA: 'Pacific',
} as const;

/** Average US households per zip code (census approximation). */
const AVG_HOUSEHOLDS_PER_ZIP = 8_500;

/** Average US population per zip code (census approximation). */
const AVG_POPULATION_PER_ZIP = 22_000;

/** Average miles per zip-code-prefix digit step (rough heuristic). */
const MILES_PER_ZIP_UNIT = 0.6;

/** Average driving speed in MPH used for travel-time estimates. */
const AVG_DRIVING_SPEED_MPH = 30;

/** Default lead density when no service-area data is available. */
const DEFAULT_LEAD_DENSITY = 0.02;

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Parse a zip code string to its numeric value for range comparisons.
 *
 * @param zip - Five-character US zip code string.
 * @returns Numeric representation of the zip code.
 */
function zipToNumber(zip: string): number {
  return parseInt(zip.replace(/\D/g, '').padEnd(5, '0').slice(0, 5), 10);
}

/**
 * Rough straight-line distance between two zip codes using the
 * numeric prefix heuristic.  This is intentionally approximate;
 * real implementations should use a geocoding service.
 *
 * @param zipA - First zip code.
 * @param zipB - Second zip code.
 * @returns Estimated distance in miles.
 */
function estimateZipDistance(zipA: string, zipB: string): number {
  const a = zipToNumber(zipA);
  const b = zipToNumber(zipB);
  return Math.abs(a - b) * MILES_PER_ZIP_UNIT;
}

/**
 * Expand a ZipCodeRange into an array of individual five-digit zip
 * code strings (zero-padded).
 *
 * @param range - Start/end zip code range.
 * @returns Array of zip code strings within the range.
 */
function expandZipRange(range: ZipCodeRange): readonly string[] {
  const start = zipToNumber(range.start);
  const end = zipToNumber(range.end);
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);

  const zips: string[] = [];
  for (let i = lo; i <= hi; i++) {
    zips.push(String(i).padStart(5, '0'));
  }
  return zips;
}

/**
 * Collect every zip code referenced by a territory (explicit list
 * plus any expanded ranges) into a single deduplicated set.
 *
 * @param territory - The territory to resolve.
 * @returns Set of all zip code strings belonging to the territory.
 */
function resolveAllZips(territory: Territory): ReadonlySet<string> {
  const zips = new Set<string>(territory.zipCodes);
  for (const range of territory.zipCodeRanges) {
    for (const zip of expandZipRange(range)) {
      zips.add(zip);
    }
  }
  return zips;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Define a new territory with a name, zip codes, service radius,
 * and assigned team.
 *
 * @param params - Territory creation parameters.
 * @returns A fully initialised Territory object.
 */
export function createTerritory(params: {
  readonly id: string;
  readonly name: string;
  readonly zipCodes?: readonly string[];
  readonly zipCodeRanges?: readonly ZipCodeRange[];
  readonly centerZip: string;
  readonly radiusMiles: number;
  readonly assignedTeam: string;
  readonly metadata?: Readonly<Record<string, string>>;
}): Territory {
  if (!params.id || !params.name) {
    throw new Error('Territory id and name are required.');
  }
  if (!params.centerZip || params.centerZip.replace(/\D/g, '').length < 5) {
    throw new Error('A valid 5-digit center zip code is required.');
  }
  if (params.radiusMiles <= 0) {
    throw new Error('Radius must be a positive number.');
  }

  return {
    id: params.id,
    name: params.name,
    zipCodes: params.zipCodes ?? [],
    zipCodeRanges: params.zipCodeRanges ?? [],
    centerZip: params.centerZip,
    radiusMiles: params.radiusMiles,
    assignedTeam: params.assignedTeam,
    createdAt: new Date(),
    metadata: params.metadata ?? {},
  };
}

/**
 * Check whether a given zip code falls within a territory (either
 * listed explicitly, inside a declared range, or within the service
 * radius of the center zip).
 *
 * @param zip - The zip code to test.
 * @param territory - The territory to check against.
 * @returns True when the zip belongs to the territory.
 */
export function isZipInTerritory(
  zip: string,
  territory: Territory,
): boolean {
  const allZips = resolveAllZips(territory);
  if (allZips.has(zip)) {
    return true;
  }

  const distance = estimateZipDistance(zip, territory.centerZip);
  return distance <= territory.radiusMiles;
}

/**
 * Find the overlapping zip codes between two territories and return
 * overlap percentages relative to each territory's total size.
 *
 * @param a - First territory.
 * @param b - Second territory.
 * @returns Overlap details including shared zip codes and percentages.
 */
export function calculateTerritoryOverlap(
  a: Territory,
  b: Territory,
): TerritoryOverlap {
  const zipsA = resolveAllZips(a);
  const zipsB = resolveAllZips(b);

  const overlapping: string[] = [];
  for (const zip of zipsA) {
    if (zipsB.has(zip)) {
      overlapping.push(zip);
    }
  }

  const sizeA = Math.max(zipsA.size, 1);
  const sizeB = Math.max(zipsB.size, 1);

  return {
    territoryA: a.id,
    territoryB: b.id,
    overlappingZipCodes: overlapping,
    overlapPercentageA: (overlapping.length / sizeA) * 100,
    overlapPercentageB: (overlapping.length / sizeB) * 100,
  };
}

/**
 * Produce a rough market-size estimate for a territory based on
 * average population density and optional service-area overrides.
 *
 * @param territory - The territory to evaluate.
 * @param serviceAreas - Optional per-zip data for more accurate estimates.
 * @returns Metrics summarising the territory's market potential.
 */
export function estimateMarketSize(
  territory: Territory,
  serviceAreas: readonly ServiceArea[] = [],
): TerritoryMetrics {
  const allZips = resolveAllZips(territory);
  const totalZipCodes = allZips.size;

  const areaMap = new Map(
    serviceAreas.map((sa) => [sa.zipCode, sa]),
  );

  let totalPop = 0;
  let totalHouseholds = 0;
  let totalLeadDensity = 0;
  let counted = 0;

  for (const zip of allZips) {
    const area = areaMap.get(zip);
    totalPop += area?.populationEstimate ?? AVG_POPULATION_PER_ZIP;
    totalHouseholds += area?.householdCount ?? AVG_HOUSEHOLDS_PER_ZIP;
    totalLeadDensity += area?.leadDensity ?? DEFAULT_LEAD_DENSITY;
    counted++;
  }

  const avgLeadDensity = counted > 0 ? totalLeadDensity / counted : 0;
  const marketSize = totalHouseholds * avgLeadDensity;

  return {
    territoryId: territory.id,
    totalZipCodes,
    estimatedPopulation: totalPop,
    estimatedHouseholds: totalHouseholds,
    averageLeadDensity: Math.round(avgLeadDensity * 10_000) / 10_000,
    marketSizeEstimate: Math.round(marketSize),
    coveragePercentage: 100,
  };
}

/**
 * Identify zip codes from a master list that are not assigned to any
 * territory, ordered by estimated priority.
 *
 * @param allZipCodes - Complete universe of zip codes to check.
 * @param territories - All currently defined territories.
 * @returns List of coverage gaps with priority ratings.
 */
export function findCoverageGaps(
  allZipCodes: readonly string[],
  territories: readonly Territory[],
): readonly CoverageGap[] {
  const coveredZips = new Set<string>();
  const resolvedByTerritory: Array<{
    id: string;
    zips: ReadonlySet<string>;
    center: string;
  }> = [];

  for (const t of territories) {
    const zips = resolveAllZips(t);
    resolvedByTerritory.push({ id: t.id, zips, center: t.centerZip });
    for (const z of zips) {
      coveredZips.add(z);
    }
  }

  const gaps: CoverageGap[] = [];

  for (const zip of allZipCodes) {
    if (coveredZips.has(zip)) {
      continue;
    }

    let nearestId: string | null = null;
    let nearestDist = Infinity;

    for (const rt of resolvedByTerritory) {
      const dist = estimateZipDistance(zip, rt.center);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = rt.id;
      }
    }

    const estimatedPop = AVG_POPULATION_PER_ZIP;
    const priority: CoverageGap['priority'] =
      nearestDist < 20
        ? 'high'
        : nearestDist < 50
          ? 'medium'
          : 'low';

    gaps.push({
      zipCode: zip,
      nearestTerritoryId: nearestId,
      distanceToNearest: Math.round(nearestDist * 100) / 100,
      estimatedPopulation: estimatedPop,
      priority,
    });
  }

  const priorityOrder: Record<CoverageGap['priority'], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...gaps].sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      a.distanceToNearest - b.distanceToNearest,
  );
}

/**
 * Recommend adjacent zip codes for territory expansion based on
 * lead density, proximity, and gap analysis.
 *
 * @param territory - The territory to expand.
 * @param candidateZips - Zip codes to consider for expansion.
 * @param serviceAreas - Optional lead-density data per zip.
 * @param maxSuggestions - Maximum number of suggestions to return.
 * @returns Ranked list of expansion suggestions.
 */
export function suggestTerritoryExpansion(
  territory: Territory,
  candidateZips: readonly string[],
  serviceAreas: readonly ServiceArea[] = [],
  maxSuggestions: number = 10,
): readonly ExpansionSuggestion[] {
  const existingZips = resolveAllZips(territory);
  const areaMap = new Map(
    serviceAreas.map((sa) => [sa.zipCode, sa]),
  );

  const suggestions: ExpansionSuggestion[] = [];

  for (const zip of candidateZips) {
    if (existingZips.has(zip)) {
      continue;
    }

    const distance = estimateZipDistance(zip, territory.centerZip);
    const area = areaMap.get(zip);
    const leadDensity = area?.leadDensity ?? DEFAULT_LEAD_DENSITY;

    /* Score: higher lead density and shorter distance = better. */
    const distancePenalty = Math.max(1, distance);
    const score =
      (leadDensity * 1000) / distancePenalty;

    const reason =
      distance <= territory.radiusMiles * 1.2
        ? 'Adjacent to current service radius'
        : leadDensity > DEFAULT_LEAD_DENSITY * 2
          ? 'High lead density opportunity'
          : 'Moderate growth potential';

    suggestions.push({
      zipCode: zip,
      reason,
      estimatedLeadDensity:
        Math.round(leadDensity * 10_000) / 10_000,
      distanceFromCenter: Math.round(distance * 100) / 100,
      score: Math.round(score * 10_000) / 10_000,
    });
  }

  return [...suggestions]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
}

/**
 * Estimate the service radius from a central zip code and return the
 * covered zip codes from a candidate list along with an approximate
 * drive-time estimate.
 *
 * @param centerZip - The hub zip code.
 * @param radiusMiles - Maximum service distance in miles.
 * @param candidateZips - Universe of zip codes to filter.
 * @returns Covered zips and estimated drive time.
 */
export function calculateTravelRadius(
  centerZip: string,
  radiusMiles: number,
  candidateZips: readonly string[],
): TravelRadiusResult {
  if (radiusMiles <= 0) {
    throw new Error('Radius must be a positive number.');
  }

  const covered: string[] = [];

  for (const zip of candidateZips) {
    const dist = estimateZipDistance(centerZip, zip);
    if (dist <= radiusMiles) {
      covered.push(zip);
    }
  }

  const estimatedDriveTime =
    AVG_DRIVING_SPEED_MPH > 0
      ? (radiusMiles / AVG_DRIVING_SPEED_MPH) * 60
      : 0;

  return {
    centerZip,
    radiusMiles,
    coveredZipCodes: covered,
    estimatedDriveTimeMinutes: Math.round(estimatedDriveTime),
  };
}
