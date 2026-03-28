import { NextResponse } from "next/server";
import {
  setRateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rate-limit";

/**
 * Standard API success response.
 *
 * Returns `{ success: true, data }` with the given HTTP status (default 200).
 * When a RateLimitResult is provided, rate limit headers are added.
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
  rl?: RateLimitResult
): NextResponse {
  const res = NextResponse.json({ success: true, data }, { status });
  return rl ? setRateLimitHeaders(res, rl) : res;
}

/**
 * Standard API error response.
 *
 * Returns `{ success: false, error }` with the given HTTP status.
 * When a RateLimitResult is provided, rate limit headers are added
 * (including Retry-After for 429 responses).
 */
export function apiError(
  message: string,
  status: number,
  rl?: RateLimitResult
): NextResponse {
  const res = NextResponse.json({ success: false, error: message }, { status });
  return rl ? setRateLimitHeaders(res, rl) : res;
}

/**
 * Pagination metadata included in paginated responses.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Standard API paginated response.
 *
 * Returns `{ success: true, data, pagination }`.
 */
export function apiPaginated<T>(
  data: T,
  total: number,
  page: number,
  pageSize: number,
): NextResponse {
  const pagination: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
  return NextResponse.json({ success: true, data, pagination });
}
