import { NextRequest, NextResponse } from "next/server";
import { searchPublicContent } from "@/lib/search-data";

/**
 * GET /api/search?q=search+term
 *
 * Searches across public content: blog posts, help center articles,
 * knowledge base, services, and FAQ entries. No auth required.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json(
      { results: [], grouped: {}, query },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  }

  const results = searchPublicContent(query);

  // Group results by category
  const grouped: Record<string, typeof results> = {};
  for (const result of results) {
    const group = grouped[result.category];
    if (group) {
      group.push(result);
    } else {
      grouped[result.category] = [result];
    }
  }

  const response = NextResponse.json({ results, grouped, query });
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=60"
  );

  return response;
}
