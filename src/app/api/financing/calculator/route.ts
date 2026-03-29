import { NextRequest, NextResponse } from "next/server";
import { formatFinancingOffers } from "@/lib/financing";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — Public calculator API
//
// Returns financing options for a given dollar amount.
// No authentication required.
//
// Query params:
//   amount — amount in dollars (e.g. 5000)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP (public calculator)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "financing-calc", 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const url = request.nextUrl;
    const amountParam = url.searchParams.get("amount");

    if (!amountParam) {
      return NextResponse.json(
        { error: "Missing required query parameter: amount (in dollars)" },
        { status: 400 }
      );
    }

    const amountDollars = parseFloat(amountParam);

    if (isNaN(amountDollars) || amountDollars < 500 || amountDollars > 25000) {
      return NextResponse.json(
        { error: "Amount must be between 500 and 25000 (dollars)" },
        { status: 400 }
      );
    }

    const amountCents = Math.round(amountDollars * 100);
    const offers = formatFinancingOffers(amountCents);

    const response = NextResponse.json({
      amount: amountCents,
      amountFormatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(amountDollars),
      offers: offers.map((offer) => ({
        term: offer.term,
        apr: offer.apr,
        monthlyPayment: offer.monthlyPayment,
        monthlyPaymentFormatted: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(offer.monthlyPayment / 100),
        totalCost: offer.totalCost,
        totalCostFormatted: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(offer.totalCost / 100),
        label: offer.label,
      })),
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to calculate financing options" },
      { status: 500 }
    );
  }
}
