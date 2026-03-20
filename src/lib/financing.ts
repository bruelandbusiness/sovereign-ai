// ─── Embedded Financing (Wisetack) ──────────────────────────────
//
// Financing calculator utilities and Wisetack API client stub.
// All monetary amounts are in cents unless otherwise noted.

// ─── Types ──────────────────────────────────────────────────────

export interface FinancingOffer {
  term: number; // months
  apr: number; // percent (e.g. 9.99)
  monthlyPayment: number; // cents
  totalCost: number; // cents
  label: string; // e.g. "6 months at 0% APR"
}

export interface WisetackApplication {
  id: string;
  status: string;
  prequalAmount: number | null;
  applicationUrl: string | null;
}

// ─── Calculator ─────────────────────────────────────────────────

/**
 * Calculate monthly payment using standard amortization formula.
 *
 * For 0% APR, the payment is simply `amountCents / termMonths`.
 * For non-zero APR, we use:
 *   M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where r = monthly rate, n = number of months.
 *
 * @returns monthly payment in cents, rounded to nearest cent.
 */
export function calculateMonthlyPayment(
  amountCents: number,
  termMonths: number,
  aprPercent: number
): number {
  if (termMonths <= 0) return 0;
  if (amountCents <= 0) return 0;

  if (aprPercent === 0) {
    return Math.round(amountCents / termMonths);
  }

  const monthlyRate = aprPercent / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const payment = amountCents * (monthlyRate * factor) / (factor - 1);

  return Math.round(payment);
}

/**
 * Generate the three standard financing offer tiers for a given amount.
 *
 * - 6 months at 0% APR
 * - 12 months at 0% APR
 * - 24 months at 9.99% APR
 */
export function formatFinancingOffers(amountCents: number): FinancingOffer[] {
  const tiers: { term: number; apr: number; label: string }[] = [
    { term: 6, apr: 0, label: "6 months at 0% APR" },
    { term: 12, apr: 0, label: "12 months at 0% APR" },
    { term: 24, apr: 9.99, label: "24 months at 9.99% APR" },
  ];

  return tiers.map(({ term, apr, label }) => {
    const monthlyPayment = calculateMonthlyPayment(amountCents, term, apr);
    const totalCost = monthlyPayment * term;

    return {
      term,
      apr,
      monthlyPayment,
      totalCost,
      label,
    };
  });
}

/**
 * Get the lowest possible monthly payment for a given amount across all tiers.
 * Useful for "As low as $X/mo" displays.
 */
function getLowestMonthlyPayment(amountCents: number): number {
  const offers = formatFinancingOffers(amountCents);
  return Math.min(...offers.map((o) => o.monthlyPayment));
}

// ─── Currency Formatting ────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format cents to dollars display string (e.g. 150000 -> "$1,500") */
export function formatCentsToDollars(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Format cents to dollars with cents (e.g. 15099 -> "$150.99") */
function formatCentsToDollarsExact(cents: number): string {
  return currencyFormatterCents.format(cents / 100);
}

// ─── Wisetack API Client (Stub) ────────────────────────────────
//
// These functions provide the interface for the Wisetack integration.
// They read WISETACK_API_KEY from the environment and gracefully
// return null if the key is not configured.

const WISETACK_API_BASE = "https://api.wisetack.com/v1";

function getWisetackHeaders(): Record<string, string> | null {
  const apiKey = process.env.WISETACK_API_KEY;
  if (!apiKey) return null;

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create a new financing application with Wisetack.
 * Returns the external application object, or null if API key is not configured.
 */
export async function createApplication(params: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amountCents: number;
  merchantId?: string;
}): Promise<WisetackApplication | null> {
  const headers = getWisetackHeaders();
  if (!headers) {
    console.info(
      "[financing] WISETACK_API_KEY not configured — skipping external application creation"
    );
    return null;
  }

  try {
    const response = await fetch(`${WISETACK_API_BASE}/applications`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        consumer: {
          first_name: params.customerName.split(" ")[0] || params.customerName,
          last_name: params.customerName.split(" ").slice(1).join(" ") || "",
          email: params.customerEmail,
          phone: params.customerPhone || undefined,
        },
        transaction_amount: params.amountCents / 100, // Wisetack expects dollars
        merchant_id: params.merchantId || undefined,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[financing] Wisetack create application failed: ${response.status}`,
        errorBody
      );
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status || "pending",
      prequalAmount: data.prequal_amount
        ? Math.round(data.prequal_amount * 100)
        : null,
      applicationUrl: data.application_url || null,
    };
  } catch (error) {
    console.error("[financing] Wisetack create application error:", error);
    return null;
  }
}

/**
 * Check the status of an existing Wisetack application.
 * Returns the application object, or null if API key is not configured.
 */
async function checkStatus(
  externalId: string
): Promise<WisetackApplication | null> {
  const headers = getWisetackHeaders();
  if (!headers) {
    console.info(
      "[financing] WISETACK_API_KEY not configured — skipping status check"
    );
    return null;
  }

  try {
    const response = await fetch(
      `${WISETACK_API_BASE}/applications/${externalId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[financing] Wisetack check status failed: ${response.status}`,
        errorBody
      );
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status || "unknown",
      prequalAmount: data.prequal_amount
        ? Math.round(data.prequal_amount * 100)
        : null,
      applicationUrl: data.application_url || null,
    };
  } catch (error) {
    console.error("[financing] Wisetack check status error:", error);
    return null;
  }
}
