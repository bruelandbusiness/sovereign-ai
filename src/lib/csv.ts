/**
 * Convert an array of objects to a CSV string.
 *
 * - Derives columns from the first row when not specified explicitly.
 * - Escapes values that contain commas, double-quotes, or newlines per RFC 4180.
 */
export function toCSV(
  rows: Record<string, unknown>[],
  columns?: string[],
): string {
  if (rows.length === 0) return "";

  const cols = columns ?? Object.keys(rows[0]);

  function escapeValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Wrap in quotes if the value contains a comma, double-quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const header = cols.map(escapeValue).join(",");
  const body = rows
    .map((row) => cols.map((col) => escapeValue(row[col])).join(","))
    .join("\n");

  return `${header}\n${body}\n`;
}
