import { NextResponse } from "next/server";

export const API_VERSION_HEADER = "x-api-version";
export const CURRENT_API_VERSION = "2026-03-01";

export function getApiVersion(request: Request): string {
  return request.headers.get(API_VERSION_HEADER) || CURRENT_API_VERSION;
}

export function addDeprecationHeaders(
  response: Response,
  sunset: string, // ISO date when this version stops working
  link?: string, // URL to migration docs
): Response {
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", sunset);
  if (link) response.headers.set("Link", `<${link}>; rel="successor-version"`);
  return response;
}

export function versionedResponse(data: unknown, status = 200): Response {
  const response = NextResponse.json(data, { status });
  response.headers.set(API_VERSION_HEADER, CURRENT_API_VERSION);
  return response;
}
