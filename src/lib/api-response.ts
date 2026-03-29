import { NextResponse } from "next/server";
import {
  setRateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a successful API response body. */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Structured error detail returned inside an error response. */
export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

/** Shape of an error API response body. */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

/** Union of all possible API response bodies. */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Pagination metadata included in paginated responses. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map an HTTP status code to a machine-readable error code string. */
function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_ERROR",
  };
  return map[status] || "UNKNOWN_ERROR";
}

// ---------------------------------------------------------------------------
// Response factories
// ---------------------------------------------------------------------------

/**
 * Standard API success response.
 *
 * Returns `{ success: true, data }` with the given HTTP status (default 200).
 * An optional `meta` bag is spread into the response body when provided.
 * When a RateLimitResult is provided, rate-limit headers are added.
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
  rl?: RateLimitResult,
  meta?: Record<string, unknown>,
): NextResponse {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  const res = NextResponse.json(body, { status });
  return rl ? setRateLimitHeaders(res, rl) : res;
}

/**
 * Standard API error response.
 *
 * Returns `{ success: false, error: { code, message, details? } }` with the
 * given HTTP status. When a RateLimitResult is provided, rate-limit headers
 * are added (including Retry-After for 429 responses).
 */
export function apiError(
  message: string,
  status: number = 500,
  rl?: RateLimitResult,
  code?: string,
  details?: unknown,
): NextResponse {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: code || httpStatusToCode(status),
      message,
      ...(details !== undefined && { details }),
    },
  };
  const res = NextResponse.json(body, { status });
  return rl ? setRateLimitHeaders(res, rl) : res;
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
