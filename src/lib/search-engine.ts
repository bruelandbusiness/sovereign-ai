/**
 * Client-side search and filtering utility.
 *
 * Provides full-text search, multi-filter support, sorting,
 * pagination, faceted navigation, and fuzzy matching — all
 * operating on in-memory arrays with no database dependency.
 */

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

export interface SearchQuery {
  readonly text: string;
  readonly fields: readonly string[];
  readonly weights?: Readonly<Record<string, number>>;
  readonly fuzzy?: boolean;
  readonly fuzzyThreshold?: number;
}

export interface SearchResult<T> {
  readonly item: T;
  readonly score: number;
  readonly matches: readonly FieldMatch[];
}

export interface FieldMatch {
  readonly field: string;
  readonly value: string;
  readonly indices: readonly [number, number][];
}

export type FilterOperator =
  | "equals"
  | "contains"
  | "range"
  | "in"
  | "not_in"
  | "between";

export interface SearchFilter {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: unknown;
  readonly caseSensitive?: boolean;
}

export interface SortOption {
  readonly field: string;
  readonly direction: "asc" | "desc";
}

export interface SearchConfig {
  readonly query?: SearchQuery;
  readonly filters?: readonly SearchFilter[];
  readonly sort?: readonly SortOption[];
  readonly offset?: number;
  readonly limit?: number;
}

export interface FacetCount {
  readonly value: string;
  readonly count: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

/* ------------------------------------------------------------------ */
/*  Tokenization                                                       */
/* ------------------------------------------------------------------ */

/**
 * Splits a search query into normalized, lowercase tokens.
 *
 * Strips punctuation, collapses whitespace, and deduplicates.
 */
export function tokenize(input: string): readonly string[] {
  if (!input || typeof input !== "string") {
    return [];
  }

  const normalized = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  if (normalized.length === 0) {
    return [];
  }

  const tokens = normalized.split(/\s+/);
  return [...new Set(tokens)];
}

/* ------------------------------------------------------------------ */
/*  Fuzzy matching (Levenshtein)                                       */
/* ------------------------------------------------------------------ */

/**
 * Computes the Levenshtein edit distance between two strings.
 *
 * Uses the Wagner-Fischer dynamic programming approach with
 * a single-row optimisation to reduce memory usage.
 */
function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  let prev = Array.from({ length: bLen + 1 }, (_, i) => i);

  for (let i = 1; i <= aLen; i++) {
    const curr = new Array<number>(bLen + 1);
    curr[0] = i;

    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }

    prev = curr;
  }

  return prev[bLen];
}

/**
 * Returns true when `candidate` is within the given edit-distance
 * threshold of `target`. Both strings are compared lowercase.
 *
 * Default threshold is 2.
 */
export function fuzzyMatch(
  target: string,
  candidate: string,
  threshold = 2,
): boolean {
  const a = target.toLowerCase();
  const b = candidate.toLowerCase();

  if (a === b) return true;
  if (Math.abs(a.length - b.length) > threshold) return false;

  return levenshteinDistance(a, b) <= threshold;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Safely retrieves a nested field value using dot-notation. */
function getField(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/** Converts a field value to a comparable string. */
function fieldToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(fieldToString).join(" ");
  return String(value);
}

/**
 * Finds all start/end index pairs where `token` appears in `text`
 * (case-insensitive).
 */
function findMatchIndices(
  text: string,
  token: string,
): readonly [number, number][] {
  const indices: [number, number][] = [];
  const lowerText = text.toLowerCase();
  const lowerToken = token.toLowerCase();

  if (lowerToken.length === 0) return indices;

  let start = 0;
  while (start <= lowerText.length - lowerToken.length) {
    const idx = lowerText.indexOf(lowerToken, start);
    if (idx === -1) break;
    indices.push([idx, idx + lowerToken.length]);
    start = idx + 1;
  }

  return indices;
}

/* ------------------------------------------------------------------ */
/*  Full-text search                                                   */
/* ------------------------------------------------------------------ */

/**
 * Performs full-text search across an array of objects.
 *
 * Scores each item by summing token-hit counts multiplied by the
 * optional field weight. Supports exact and fuzzy matching.
 * Returns results sorted by descending score.
 */
export function search<T>(
  items: readonly T[],
  query: SearchQuery,
): readonly SearchResult<T>[] {
  const tokens = tokenize(query.text);
  if (tokens.length === 0) {
    return items.map((item) => ({ item, score: 0, matches: [] }));
  }

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    let totalScore = 0;
    const allMatches: FieldMatch[] = [];

    for (const field of query.fields) {
      const raw = getField(item, field);
      const text = fieldToString(raw);
      if (text.length === 0) continue;

      const weight = query.weights?.[field] ?? 1;
      const fieldTokens = tokenize(text);

      for (const token of tokens) {
        let matched = false;
        const indices: [number, number][] = [];

        /* Exact substring match */
        const exactIndices = findMatchIndices(text, token);
        if (exactIndices.length > 0) {
          matched = true;
          indices.push(...exactIndices);
          totalScore += exactIndices.length * weight;
        }

        /* Fuzzy token-level match */
        if (
          !matched &&
          query.fuzzy !== false &&
          query.fuzzyThreshold !== undefined
        ) {
          for (const ft of fieldTokens) {
            if (fuzzyMatch(token, ft, query.fuzzyThreshold)) {
              matched = true;
              totalScore += 0.5 * weight;
              const fuzzyIndices = findMatchIndices(text, ft);
              indices.push(...fuzzyIndices);
            }
          }
        }

        if (matched) {
          allMatches.push({ field, value: text, indices });
        }
      }
    }

    if (totalScore > 0) {
      results.push({ item, score: totalScore, matches: allMatches });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/*  Filtering                                                          */
/* ------------------------------------------------------------------ */

/**
 * Applies one or more filters to an array, returning only items
 * that satisfy every filter.
 *
 * Supported operators:
 * - `equals`  — strict equality (or case-insensitive string compare)
 * - `contains` — substring match
 * - `range`   — value is `{ min?, max? }`
 * - `in`      — value is in a provided array
 * - `not_in`  — value is NOT in a provided array
 * - `between` — value is `[min, max]` inclusive
 */
export function filterBy<T>(
  items: readonly T[],
  filters: readonly SearchFilter[],
): readonly T[] {
  if (filters.length === 0) return items;

  return items.filter((item) =>
    filters.every((f) => applyFilter(item, f)),
  );
}

function applyFilter(item: unknown, filter: SearchFilter): boolean {
  const raw = getField(item, filter.field);

  switch (filter.operator) {
    case "equals":
      return matchEquals(raw, filter.value, filter.caseSensitive);

    case "contains":
      return matchContains(raw, filter.value, filter.caseSensitive);

    case "range":
      return matchRange(raw, filter.value);

    case "in":
      return matchIn(raw, filter.value);

    case "not_in":
      return !matchIn(raw, filter.value);

    case "between":
      return matchBetween(raw, filter.value);

    default:
      return false;
  }
}

function matchEquals(
  fieldVal: unknown,
  filterVal: unknown,
  caseSensitive?: boolean,
): boolean {
  if (
    !caseSensitive &&
    typeof fieldVal === "string" &&
    typeof filterVal === "string"
  ) {
    return fieldVal.toLowerCase() === filterVal.toLowerCase();
  }
  return fieldVal === filterVal;
}

function matchContains(
  fieldVal: unknown,
  filterVal: unknown,
  caseSensitive?: boolean,
): boolean {
  const a = fieldToString(fieldVal);
  const b = fieldToString(filterVal);

  if (caseSensitive) return a.includes(b);
  return a.toLowerCase().includes(b.toLowerCase());
}

function matchRange(
  fieldVal: unknown,
  rangeVal: unknown,
): boolean {
  if (typeof fieldVal !== "number" || rangeVal == null) return false;
  const range = rangeVal as { min?: number; max?: number };

  if (range.min !== undefined && fieldVal < range.min) return false;
  if (range.max !== undefined && fieldVal > range.max) return false;
  return true;
}

function matchIn(fieldVal: unknown, list: unknown): boolean {
  if (!Array.isArray(list)) return false;
  return list.includes(fieldVal);
}

function matchBetween(fieldVal: unknown, bounds: unknown): boolean {
  if (typeof fieldVal !== "number" || !Array.isArray(bounds)) {
    return false;
  }
  const [min, max] = bounds as [number, number];
  return fieldVal >= min && fieldVal <= max;
}

/* ------------------------------------------------------------------ */
/*  Sorting                                                            */
/* ------------------------------------------------------------------ */

/**
 * Sorts items by one or more fields. Earlier sort options take
 * higher precedence (tie-breaking flows to subsequent fields).
 *
 * Returns a new sorted array — the original is never mutated.
 */
export function sortBy<T>(
  items: readonly T[],
  options: readonly SortOption[],
): readonly T[] {
  if (options.length === 0) return items;

  return [...items].sort((a, b) => {
    for (const opt of options) {
      const aVal = getField(a, opt.field);
      const bVal = getField(b, opt.field);
      const cmp = compareValues(aVal, bVal);

      if (cmp !== 0) {
        return opt.direction === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  return String(a).localeCompare(String(b));
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

/**
 * Slices a results array with offset and limit, returning a
 * paginated envelope that includes the total count.
 */
export function paginate<T>(
  items: readonly T[],
  offset = 0,
  limit = 20,
): PaginatedResult<T> {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  const sliced = items.slice(safeOffset, safeOffset + safeLimit);

  return {
    items: sliced,
    total: items.length,
    offset: safeOffset,
    limit: safeLimit,
    hasMore: safeOffset + safeLimit < items.length,
  };
}

/* ------------------------------------------------------------------ */
/*  Search pipeline                                                    */
/* ------------------------------------------------------------------ */

/**
 * Composes search, filter, sort, and paginate into a single call.
 *
 * Steps execute in order: search -> filter -> sort -> paginate.
 * Any step can be omitted by leaving its config field undefined.
 */
export function buildSearchPipeline<T>(
  items: readonly T[],
  config: SearchConfig,
): PaginatedResult<T> {
  let working: readonly T[] = items;

  /* 1. Full-text search */
  if (config.query && config.query.text.trim().length > 0) {
    const results = search(working, config.query);
    working = results.map((r) => r.item);
  }

  /* 2. Filters */
  if (config.filters && config.filters.length > 0) {
    working = filterBy(working, config.filters);
  }

  /* 3. Sort */
  if (config.sort && config.sort.length > 0) {
    working = sortBy(working, config.sort);
  }

  /* 4. Paginate */
  return paginate(working, config.offset, config.limit);
}

/* ------------------------------------------------------------------ */
/*  Highlight matches                                                  */
/* ------------------------------------------------------------------ */

/**
 * Wraps every occurrence of each search token inside `text`
 * with configurable markers (default `<mark>` / `</mark>`).
 *
 * Overlapping matches are merged so markers never nest.
 */
export function highlightMatches(
  text: string,
  tokens: readonly string[],
  openTag = "<mark>",
  closeTag = "</mark>",
): string {
  if (!text || tokens.length === 0) return text;

  /* Collect all match ranges */
  const ranges: [number, number][] = [];
  for (const token of tokens) {
    if (token.length === 0) continue;
    const indices = findMatchIndices(text, token);
    ranges.push(...indices);
  }

  if (ranges.length === 0) return text;

  /* Merge overlapping ranges */
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [ranges[0]];

  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  /* Build highlighted string from right to left */
  let result = text;
  for (let i = merged.length - 1; i >= 0; i--) {
    const [start, end] = merged[i];
    result =
      result.slice(0, start) +
      openTag +
      result.slice(start, end) +
      closeTag +
      result.slice(end);
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Faceted navigation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Counts distinct values for a given field across an array of items.
 *
 * Useful for faceted navigation — e.g., counting leads by source
 * or products by category. Returns counts sorted descending.
 */
export function calculateFacets<T>(
  items: readonly T[],
  field: string,
): readonly FacetCount[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const raw = getField(item, field);
    const values = Array.isArray(raw)
      ? raw.map(fieldToString)
      : [fieldToString(raw)];

    for (const v of values) {
      if (v.length === 0) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}
