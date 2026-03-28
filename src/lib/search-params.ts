import {
  parseAsInteger,
  parseAsString,
  type inferParserType,
} from "nuqs";

/**
 * Reusable nuqs parser configurations for common dashboard filters.
 * Import individual parsers or the full `dashboardSearchParams` object
 * into any page / component that needs URL-driven state.
 */

export const dateRangeParser = parseAsString.withDefault("30d");

export const pageParser = parseAsInteger.withDefault(1);

export const pageSizeParser = parseAsInteger.withDefault(25);

export const sortParser = parseAsString;

export const searchParser = parseAsString.withDefault("");

export const statusParser = parseAsString;

/** Combined search-params map ready for `useQueryStates`. */
export const dashboardSearchParams = {
  dateRange: dateRangeParser,
  page: pageParser,
  pageSize: pageSizeParser,
  sort: sortParser,
  search: searchParser,
  status: statusParser,
} as const;

/** Inferred TypeScript type for the combined dashboard search params. */
export type DashboardSearchParams = inferParserType<
  typeof dashboardSearchParams
>;
