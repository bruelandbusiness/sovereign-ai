// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported export output formats. */
export type ExportFormat = "csv" | "json" | "xlsx_compatible" | "pdf_data";

/** Configuration for transforming a column value before export. */
export interface ColumnTransform {
  readonly type: "date" | "currency" | "boolean" | "custom";
  /** Date format string (e.g. "YYYY-MM-DD"). Used when type is "date". */
  readonly dateFormat?: string;
  /** Currency code (e.g. "USD"). Used when type is "currency". */
  readonly currencyCode?: string;
  /** Decimal places for currency. Defaults to 2. */
  readonly decimals?: number;
  /** Labels for boolean values. Defaults to ["Yes", "No"]. */
  readonly booleanLabels?: readonly [string, string];
  /** Custom transform function. Used when type is "custom". */
  readonly customFn?: (value: unknown) => string;
}

/** Describes a single column in the export output. */
export interface ExportColumn {
  /** The object key to read from each row. */
  readonly key: string;
  /** Human-readable header label. Defaults to `key` if omitted. */
  readonly label?: string;
  /** Column display order (lower = first). */
  readonly order?: number;
  /** Optional value transform applied before export. */
  readonly transform?: ColumnTransform;
}

/** Options that control the export process. */
export interface ExportConfig {
  readonly format: ExportFormat;
  readonly columns?: readonly ExportColumn[];
  /** When true, JSON output is minified. Defaults to false (pretty). */
  readonly minified?: boolean;
  /** Subset of fields to include (JSON format only). */
  readonly fields?: readonly string[];
  /** Prefix for the generated filename (e.g. "leads"). */
  readonly filenamePrefix?: string;
  /** Chunk size for paginated / streamed exports. */
  readonly chunkSize?: number;
}

/** Value returned after generating export content. */
export interface ExportResult {
  readonly content: string;
  readonly format: ExportFormat;
  readonly filename: string;
  readonly sizeBytes: number;
  readonly rowCount: number;
  readonly columnCount: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Escape a single CSV cell value.
 *
 * Rules (RFC 4180):
 * - If the value contains a double-quote, comma, or newline it must be
 *   wrapped in double-quotes.
 * - Double-quotes inside the value are escaped by doubling them.
 */
function escapeCSVCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (
    str.includes('"') ||
    str.includes(",") ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Escape a tab-separated cell value.
 *
 * Tabs and newlines inside values are replaced with spaces so they do not
 * break the column/row structure.
 */
function escapeTSVCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return str.replace(/[\t\r\n]/g, " ");
}

/**
 * Resolve the display value for a cell, applying an optional transform.
 */
function resolveValue(raw: unknown, transform?: ColumnTransform): string {
  if (transform === undefined) {
    return raw === null || raw === undefined ? "" : String(raw);
  }

  switch (transform.type) {
    case "date": {
      if (raw === null || raw === undefined || raw === "") return "";
      const d = new Date(raw as string | number);
      if (Number.isNaN(d.getTime())) return String(raw);
      return formatDate(d, transform.dateFormat ?? "YYYY-MM-DD");
    }
    case "currency": {
      const num = Number(raw);
      if (Number.isNaN(num)) return String(raw ?? "");
      const decimals = transform.decimals ?? 2;
      const code = transform.currencyCode ?? "USD";
      return `${code} ${num.toFixed(decimals)}`;
    }
    case "boolean": {
      const labels = transform.booleanLabels ?? (["Yes", "No"] as const);
      return raw ? labels[0] : labels[1];
    }
    case "custom": {
      if (transform.customFn) return transform.customFn(raw);
      return raw === null || raw === undefined ? "" : String(raw);
    }
    default:
      return raw === null || raw === undefined ? "" : String(raw);
  }
}

/**
 * Minimal date formatter supporting YYYY, MM, DD, HH, mm, ss tokens.
 */
function formatDate(date: Date, pattern: string): string {
  const tokens: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: String(date.getMonth() + 1).padStart(2, "0"),
    DD: String(date.getDate()).padStart(2, "0"),
    HH: String(date.getHours()).padStart(2, "0"),
    mm: String(date.getMinutes()).padStart(2, "0"),
    ss: String(date.getSeconds()).padStart(2, "0"),
  };

  let result = pattern;
  for (const [token, replacement] of Object.entries(tokens)) {
    result = result.replace(token, replacement);
  }
  return result;
}

/**
 * Extract a nested value from an object using a dot-separated key path.
 */
function getNestedValue(
  obj: Record<string, unknown>,
  key: string,
): unknown {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert an array of objects to a CSV string with RFC 4180 escaping.
 *
 * @param data   - rows to export
 * @param columns - column definitions (auto-detected when omitted)
 * @returns CSV string including the header row
 */
export function formatAsCSV(
  data: readonly Record<string, unknown>[],
  columns?: readonly ExportColumn[],
): string {
  const cols = columns ?? buildExportColumns(data);
  const header = cols.map((c) => escapeCSVCell(c.label ?? c.key)).join(",");
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const raw = getNestedValue(row, col.key);
        const resolved = resolveValue(raw, col.transform);
        return escapeCSVCell(resolved);
      })
      .join(","),
  );
  return [header, ...rows].join("\n");
}

/**
 * Serialize data as JSON with optional pretty-printing and field selection.
 *
 * @param data     - rows to export
 * @param options  - minified (default false), fields (subset of keys)
 * @returns JSON string
 */
export function formatAsJSON(
  data: readonly Record<string, unknown>[],
  options: { readonly minified?: boolean; readonly fields?: readonly string[] } = {},
): string {
  const { minified = false, fields } = options;

  const filtered =
    fields && fields.length > 0
      ? data.map((row) => {
          const picked: Record<string, unknown> = {};
          for (const field of fields) {
            picked[field] = getNestedValue(row, field);
          }
          return picked;
        })
      : data;

  return minified
    ? JSON.stringify(filtered)
    : JSON.stringify(filtered, null, 2);
}

/**
 * Convert data to an Excel-compatible tab-separated format.
 *
 * @param data    - rows to export
 * @param columns - column definitions (auto-detected when omitted)
 * @returns tab-separated string including the header row
 */
export function formatAsTabSeparated(
  data: readonly Record<string, unknown>[],
  columns?: readonly ExportColumn[],
): string {
  const cols = columns ?? buildExportColumns(data);
  const header = cols.map((c) => escapeTSVCell(c.label ?? c.key)).join("\t");
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const raw = getNestedValue(row, col.key);
        const resolved = resolveValue(raw, col.transform);
        return escapeTSVCell(resolved);
      })
      .join("\t"),
  );
  return [header, ...rows].join("\n");
}

/**
 * Auto-detect columns from an array of objects.
 *
 * Scans every row to collect all unique keys and returns them in
 * insertion order. Custom labels and ordering can be supplied via
 * `overrides`.
 *
 * @param data      - source rows
 * @param overrides - optional column customisations keyed by field name
 * @returns ordered array of ExportColumn definitions
 */
export function buildExportColumns(
  data: readonly Record<string, unknown>[],
  overrides?: Readonly<Record<string, Partial<ExportColumn>>>,
): ExportColumn[] {
  const keySet = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      keySet.add(key);
    }
  }

  const columns: ExportColumn[] = [...keySet].map((key) => {
    const override = overrides?.[key];
    return {
      key,
      label: override?.label ?? key,
      order: override?.order ?? 0,
      transform: override?.transform,
    };
  });

  columns.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return columns;
}

/**
 * Apply transforms to every value in the dataset and return new rows
 * with string values ready for export.
 *
 * This is a pure function; the original data is never mutated.
 *
 * @param data    - source rows
 * @param columns - column definitions with optional transforms
 * @returns new array of rows with transformed string values
 */
export function applyColumnTransforms(
  data: readonly Record<string, unknown>[],
  columns: readonly ExportColumn[],
): Record<string, string>[] {
  return data.map((row) => {
    const transformed: Record<string, string> = {};
    for (const col of columns) {
      const raw = getNestedValue(row, col.key);
      transformed[col.key] = resolveValue(raw, col.transform);
    }
    return transformed;
  });
}

/**
 * Generate a timestamped export filename.
 *
 * @param prefix - human-readable prefix (e.g. "leads")
 * @param format - export format used to derive the file extension
 * @param date   - override the timestamp (defaults to `new Date()`)
 * @returns filename string like "leads-export-2025-01-15.csv"
 */
export function generateExportFilename(
  prefix: string,
  format: ExportFormat,
  date: Date = new Date(),
): string {
  const dateStr = formatDate(date, "YYYY-MM-DD");

  const extensions: Record<ExportFormat, string> = {
    csv: "csv",
    json: "json",
    xlsx_compatible: "tsv",
    pdf_data: "json",
  };

  const ext = extensions[format];
  return `${prefix}-export-${dateStr}.${ext}`;
}

/**
 * Estimate the export file size in bytes **before** generating the full
 * content.
 *
 * The estimate is based on a sample of rows (up to 100) and extrapolated
 * to the full dataset. The result includes a small overhead factor for
 * headers and delimiters.
 *
 * @param data   - full dataset
 * @param format - target export format
 * @param columns - column definitions (auto-detected when omitted)
 * @returns estimated size in bytes
 */
export function estimateExportSize(
  data: readonly Record<string, unknown>[],
  format: ExportFormat,
  columns?: readonly ExportColumn[],
): number {
  if (data.length === 0) return 0;

  const cols = columns ?? buildExportColumns(data);
  const sampleSize = Math.min(data.length, 100);
  const sample = data.slice(0, sampleSize);

  let sampleContent: string;
  switch (format) {
    case "csv":
      sampleContent = formatAsCSV(sample, cols);
      break;
    case "json":
      sampleContent = formatAsJSON(sample);
      break;
    case "xlsx_compatible":
      sampleContent = formatAsTabSeparated(sample, cols);
      break;
    case "pdf_data":
      sampleContent = formatAsJSON(sample);
      break;
  }

  const sampleBytes = new TextEncoder().encode(sampleContent).length;

  if (data.length <= sampleSize) return sampleBytes;

  // Estimate the header size separately so it is not multiplied.
  const headerOverhead = cols
    .map((c) => (c.label ?? c.key).length)
    .reduce((sum, len) => sum + len, 0);

  const bodyBytes = sampleBytes - headerOverhead;
  const perRowEstimate = bodyBytes / sampleSize;
  const estimated = headerOverhead + perRowEstimate * data.length;

  // Add a 5 % safety margin.
  return Math.ceil(estimated * 1.05);
}

/**
 * Split a dataset into fixed-size chunks for streaming or paginated
 * export.
 *
 * @param data      - full dataset
 * @param chunkSize - maximum rows per chunk (defaults to 1000)
 * @returns array of row-arrays, each containing at most `chunkSize` rows
 */
export function chunkForExport<T>(
  data: readonly T[],
  chunkSize: number = 1000,
): T[][] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer");
  }

  const chunks: T[][] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}
