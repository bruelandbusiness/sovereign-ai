/**
 * Client-side CSV export utility.
 *
 * Generates RFC 4180-compliant CSV strings with proper escaping and triggers
 * browser downloads with timestamped filenames.
 */

export interface ColumnDefinition<T = Record<string, unknown>> {
  /** Key to read from each row object. */
  key: string;
  /** Header label shown in the CSV. Defaults to `key` if omitted. */
  header?: string;
  /** Optional formatter applied to the raw value before writing. */
  format?: (value: unknown, row: T) => string;
}

/**
 * Escape a single CSV cell value per RFC 4180.
 *
 * Wraps in double-quotes when the value contains a comma, double-quote,
 * newline, or carriage return. Internal double-quotes are doubled.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to a CSV string.
 *
 * @param rows     - Array of data objects.
 * @param columns  - Column definitions controlling header names and formatting.
 *                   When omitted, columns are derived from the keys of the
 *                   first row.
 * @returns A complete CSV string including header row and trailing newline.
 */
export function generateCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns?: ColumnDefinition<T>[],
): string {
  if (rows.length === 0) return "";

  const cols: ColumnDefinition<T>[] =
    columns ??
    Object.keys(rows[0]).map((key) => ({ key, header: key }));

  const header = cols
    .map((col) => escapeCell(col.header ?? col.key))
    .join(",");

  const body = rows
    .map((row) =>
      cols
        .map((col) => {
          const raw = row[col.key];
          const formatted = col.format ? col.format(raw, row) : raw;
          return escapeCell(formatted);
        })
        .join(","),
    )
    .join("\n");

  return `${header}\n${body}\n`;
}

/**
 * Trigger a browser file download from a string payload.
 *
 * Creates a temporary Blob URL, clicks a hidden anchor, and revokes the URL.
 *
 * @param content  - File content (e.g. CSV string).
 * @param filename - Name for the downloaded file.
 * @param mimeType - MIME type. Defaults to `text/csv;charset=utf-8`.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  // Clean up after a short delay so the browser can finish the download.
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  }, 100);
}

/**
 * Build a timestamped filename for CSV exports.
 *
 * @param prefix - Descriptive prefix, e.g. "leads" or "invoices".
 * @returns A filename like `leads-2026-03-28T14-30-00.csv`.
 */
export function csvFilename(prefix: string): string {
  const ts = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .slice(0, 19);
  return `${prefix}-${ts}.csv`;
}

/**
 * High-level helper: generate a CSV from data and trigger a download.
 *
 * @param rows     - Array of data objects.
 * @param columns  - Column definitions (optional).
 * @param prefix   - Filename prefix, e.g. "crm-leads".
 */
export function exportCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns?: ColumnDefinition<T>[],
  prefix = "export",
): void {
  const csv = generateCSV(rows, columns);
  if (!csv) return;
  downloadFile(csv, csvFilename(prefix));
}
