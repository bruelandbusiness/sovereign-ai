/**
 * Locale-aware number, currency, and percentage formatters.
 *
 * All helpers use `Intl.NumberFormat` so output automatically adapts to the
 * runtime locale when a future i18n layer is introduced. Until then, the
 * default locale is `en-US` with USD as the default currency.
 */

const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";

// ── Currency ────────────────────────────────────────────────

/**
 * Format an amount as currency (e.g. "$1,234").
 *
 * @param amount  - The value in whole currency units (NOT cents).
 * @param currency - ISO 4217 currency code. Defaults to `"USD"`.
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a cents value as currency (e.g. 12345 => "$123").
 *
 * Convenience wrapper for APIs that store monetary values in cents.
 */
export function formatCents(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return formatCurrency(cents / 100, currency);
}

// ── Numbers ─────────────────────────────────────────────────

/**
 * Format a number with locale-appropriate grouping (e.g. "1,234,567").
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(n);
}

/**
 * Format a number as a percentage (e.g. 0.451 => "45.1%").
 *
 * Pass values in the 0-1 range (e.g. 0.25 for 25%).
 */
export function formatPercent(n: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Format a raw percentage value with one decimal place (e.g. 45.1 => "45.1%").
 *
 * Use when the value is already expressed as a percentage (0-100 scale)
 * rather than a fraction (0-1 scale).
 */
export function formatPercentValue(n: number): string {
  return `${n.toFixed(1)}%`;
}

/**
 * Format a number using compact notation: "1.2K", "3.4M", etc.
 */
export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Format a dollar amount in compact notation (e.g. 15000 => "$15K").
 *
 * Useful for chart axis labels and dashboard cards.
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}
