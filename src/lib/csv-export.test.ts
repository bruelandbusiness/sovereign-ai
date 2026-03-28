import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateCSV, csvFilename, type ColumnDefinition } from "./csv-export";

// ---------------------------------------------------------------------------
// generateCSV
// ---------------------------------------------------------------------------

describe("generateCSV", () => {
  it("returns empty string for empty array", () => {
    expect(generateCSV([])).toBe("");
  });

  it("auto-derives columns from the first row when columns are omitted", () => {
    const rows = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const csv = generateCSV(rows);
    expect(csv).toBe("name,age\nAlice,30\nBob,25\n");
  });

  it("uses explicit column definitions with custom headers", () => {
    const rows = [{ first: "Alice", last: "Smith" }];
    const cols: ColumnDefinition[] = [
      { key: "first", header: "First Name" },
      { key: "last", header: "Last Name" },
    ];
    const csv = generateCSV(rows, cols);
    expect(csv).toBe("First Name,Last Name\nAlice,Smith\n");
  });

  it("falls back to key as header when header is omitted in column def", () => {
    const rows = [{ id: 1 }];
    const cols: ColumnDefinition[] = [{ key: "id" }];
    const csv = generateCSV(rows, cols);
    expect(csv).toBe("id\n1\n");
  });

  it("applies a format function to cell values", () => {
    const rows = [{ price: 1999 }];
    const cols: ColumnDefinition[] = [
      {
        key: "price",
        header: "Price",
        format: (v) => `$${(Number(v) / 100).toFixed(2)}`,
      },
    ];
    const csv = generateCSV(rows, cols);
    expect(csv).toBe("Price\n$19.99\n");
  });

  // Edge cases: special characters per RFC 4180
  it("wraps values containing commas in double quotes", () => {
    const rows = [{ note: "hello, world" }];
    const csv = generateCSV(rows);
    expect(csv).toBe('note\n"hello, world"\n');
  });

  it("escapes double quotes by doubling them", () => {
    const rows = [{ note: 'She said "hi"' }];
    const csv = generateCSV(rows);
    expect(csv).toBe('note\n"She said ""hi"""\n');
  });

  it("wraps values containing newlines in double quotes", () => {
    const rows = [{ note: "line1\nline2" }];
    const csv = generateCSV(rows);
    expect(csv).toBe('note\n"line1\nline2"\n');
  });

  it("wraps values containing carriage returns in double quotes", () => {
    const rows = [{ note: "line1\rline2" }];
    const csv = generateCSV(rows);
    expect(csv).toBe('note\n"line1\rline2"\n');
  });

  it("renders null and undefined as empty strings", () => {
    const rows = [{ a: null, b: undefined }];
    const csv = generateCSV(rows as Record<string, unknown>[]);
    expect(csv).toBe("a,b\n,\n");
  });

  it("handles boolean and numeric values correctly", () => {
    const rows = [{ flag: true, count: 0, ratio: 3.14 }];
    const csv = generateCSV(rows as Record<string, unknown>[]);
    expect(csv).toBe("flag,count,ratio\ntrue,0,3.14\n");
  });

  it("handles a single row with a single column", () => {
    const rows = [{ x: "only" }];
    const csv = generateCSV(rows);
    expect(csv).toBe("x\nonly\n");
  });

  it("handles headers that contain special characters", () => {
    const rows = [{ val: 1 }];
    const cols: ColumnDefinition[] = [
      { key: "val", header: 'Revenue, "Gross"' },
    ];
    const csv = generateCSV(rows, cols);
    // Header itself should be escaped
    expect(csv).toContain('"Revenue, ""Gross"""');
  });
});

// ---------------------------------------------------------------------------
// csvFilename
// ---------------------------------------------------------------------------

describe("csvFilename", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces a filename with the given prefix and a timestamp", () => {
    vi.setSystemTime(new Date("2026-03-28T14:30:00.000Z"));
    const name = csvFilename("leads");
    expect(name).toBe("leads-2026-03-28T14-30-00.csv");
  });

  it("replaces colons in the ISO timestamp with hyphens", () => {
    vi.setSystemTime(new Date("2025-12-01T09:05:59.123Z"));
    const name = csvFilename("invoices");
    expect(name).toBe("invoices-2025-12-01T09-05-59.csv");
  });

  it("handles empty prefix", () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const name = csvFilename("");
    expect(name).toBe("-2026-01-01T00-00-00.csv");
  });
});
